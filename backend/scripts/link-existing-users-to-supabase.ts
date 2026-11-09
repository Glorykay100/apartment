import 'dotenv/config';

const dryRun = process.argv.includes('--dry-run');
const frontendUrl = process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:3000';
const redirectTo = `${frontendUrl.replace(/\/$/, '')}/auth/callback?next=/auth/reset-password`;

async function findSupabaseUser(email: string) {
  const { supabaseAdmin } = await import('../src/config/supabase');
  if (!supabaseAdmin) throw new Error('Supabase Admin API is not configured.');
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 1000) return null;
  }
  throw new Error('Supabase user lookup reached the pagination safety limit.');
}

async function main() {
  const [{ prisma }, { supabaseAdmin }, { sendPasswordSetupEmailOnce }] = await Promise.all([
    import('../src/config/db'),
    import('../src/config/supabase'),
    import('../src/services/email.service'),
  ]);
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_URL.includes('your-project-ref')) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env before running this script.');
  }
  if (!supabaseAdmin) throw new Error('Supabase Admin API is not configured.');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, fullName: true, role: true, emailVerified: true, supabaseUserId: true, passwordHash: true },
  });
  const summary = { scanned: users.length, alreadyLinked: 0, linked: 0, bcryptHashesImported: 0, fallbackAccountsWithoutPassword: 0, verificationEmailsSent: 0, failed: 0, dryRun };

  for (const user of users) {
    try {
      if (dryRun) {
        if (user.supabaseUserId) summary.alreadyLinked += 1;
        else {
          console.log(`[dry-run] Would provision ${user.email} (${user.role}) and set only User.supabaseUserId`);
          summary.linked += 1;
        }
        continue;
      }

      let authUser = user.supabaseUserId
        ? (await supabaseAdmin.auth.admin.getUserById(user.supabaseUserId)).data.user
        : null;
      if (!authUser) authUser = await findSupabaseUser(user.email);

      if (!authUser) {
        const isBcrypt = /^\$2[aby]\$\d{2}\$/.test(user.passwordHash);
        const attributes: Parameters<typeof supabaseAdmin.auth.admin.createUser>[0] = {
          email: user.email,
          email_confirm: user.emailVerified,
          user_metadata: { full_name: user.fullName },
        };
        if (isBcrypt) attributes.password_hash = user.passwordHash;
        const { data, error } = await supabaseAdmin.auth.admin.createUser(attributes);
        if (error) throw error;
        authUser = data.user;
        if (isBcrypt) summary.bcryptHashesImported += 1;
        else summary.fallbackAccountsWithoutPassword += 1;
      }

      let actionLink: string | null = null;
      const isBcrypt = /^\$2[aby]\$\d{2}\$/.test(user.passwordHash);
      const needsVerification = !authUser.email_confirmed_at;
      if (needsVerification || (!isBcrypt && !user.supabaseUserId)) {
        const linkResponse = needsVerification
          ? await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: user.email, options: { redirectTo } })
          : await supabaseAdmin.auth.admin.generateLink({ type: 'recovery', email: user.email, options: { redirectTo } });
        const { data: linkData, error: linkError } = linkResponse;
        if (linkError || !linkData.properties?.action_link) throw linkError || new Error('Supabase did not return a password recovery link.');
        actionLink = linkData.properties.action_link;
      }

      if (user.supabaseUserId !== authUser.id) {
        // Existing bookings/receipts/reviews stay attached to this User row.
        // This is the only User column the linking script updates.
        await prisma.user.update({ where: { id: user.id }, data: { supabaseUserId: authUser.id }, select: { id: true } });
      } else {
        summary.alreadyLinked += 1;
      }

      let delivery: string = 'not-needed';
      if (actionLink) {
        delivery = await sendPasswordSetupEmailOnce(
          { id: user.id, email: user.email, fullName: user.fullName }, actionLink
        );
        if (needsVerification) summary.verificationEmailsSent += 1;
      }
      summary.linked += 1;
      console.log(`[linked] ${user.email} (${user.role}) — password import: ${/^\$2[aby]\$\d{2}\$/.test(user.passwordHash) ? 'bcrypt' : 'setup link'}; email: ${delivery}`);
    } catch (error) {
      summary.failed += 1;
      console.error(`[failed] ${user.email}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  console.log('Linking summary:', JSON.stringify(summary, null, 2));
  if (summary.failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error('Linking script stopped:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
}).finally(async () => {
  const { prisma } = await import('../src/config/db');
  await prisma.$disconnect();
});
