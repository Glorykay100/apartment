import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/db';

const BASE = '/api/v1/newsletter';
const created = new Set<string>();

const subscribe = (email: string) =>
  request(app).post(`${BASE}/subscribe`).send({ email, fullName: 'QA Tester' });

afterAll(async () => {
  await prisma.subscriber.deleteMany({ where: { email: { in: [...created] } } });
  await prisma.webhookEvent.deleteMany({ where: { provider: 'brevo' } });
});

describe('Newsletter — double opt-in, signed tokens, suppression', () => {
  const email = 'qa-newsletter@example.com';
  created.add(email);

  it('subscribes a new email and starts double opt-in (PENDING)', async () => {
    const res = await subscribe(email);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.message).toMatch(/confirm/i);

    const subscriber = await prisma.subscriber.findUnique({ where: { email } });
    expect(subscriber?.status).toBe('PENDING');
  });

  it('sends a confirm link with a signed token that validates', async () => {
    const subscriber = await prisma.subscriber.findUniqueOrThrow({ where: { email } });
    expect(subscriber.confirmToken).toBeTruthy();

    // The stored token IS the token embedded in the emailed link.
    const res = await request(app).get(`${BASE}/confirm?token=${subscriber.confirmToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('SUBSCRIBED');

    const after = await prisma.subscriber.findUniqueOrThrow({ where: { email } });
    expect(after.status).toBe('SUBSCRIBED');
    expect(after.confirmedAt).toBeTruthy();
  });

  it('duplicate subscribe of a confirmed address is a no-op with no re-opt-in', async () => {
    const res = await subscribe(email);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('SUBSCRIBED');
    expect(res.body.message).toMatch(/already subscribed/i);
  });

  it('rejects a tampered confirm token (400)', async () => {
    const tampered = 'eyJlbWFpbCI6ImV2aWxAZXhhbXBsZS5jb20iLGV4cDoxOTk5OTk5OTk5fQ.deadbeefsignature';
    const res = await request(app).get(`${BASE}/confirm?token=${tampered}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it('rejects a confirm token used as an unsubscribe token (wrong purpose)', async () => {
    const subscriber = await prisma.subscriber.findUniqueOrThrow({ where: { email } });
    // Re-issue a confirm-purpose token and try it against /unsubscribe
    const { signActionToken } = await import('../src/utils/tokens');
    const confirmToken = signActionToken(email, 'newsletter_confirm');
    void subscriber;
    const res = await request(app).get(`${BASE}/unsubscribe?token=${confirmToken}`);
    expect(res.status).toBe(400);
  });

  it('unsubscribes via signed token without login', async () => {
    const { signActionToken } = await import('../src/utils/tokens');
    const token = signActionToken(email, 'newsletter_unsubscribe');
    const res = await request(app).get(`${BASE}/unsubscribe?token=${token}`);
    expect(res.status).toBe(200);
    const after = await prisma.subscriber.findUniqueOrThrow({ where: { email } });
    expect(after.status).toBe('UNSUBSCRIBED');
    expect(after.unsubscribedAt).toBeTruthy();
  });

  it('rejects a tampered unsubscribe token (400) and does not unsubscribe', async () => {
    const otherEmail = 'qa-newsletter-victim@example.com';
    created.add(otherEmail);
    await prisma.subscriber.create({ data: { email: otherEmail, status: 'SUBSCRIBED', confirmedAt: new Date() } });

    const tampered = 'not-a-token';
    const res = await request(app).get(`${BASE}/unsubscribe?token=${tampered}`);
    expect(res.status).toBe(400);

    const after = await prisma.subscriber.findUniqueOrThrow({ where: { email: otherEmail } });
    expect(after.status).toBe('SUBSCRIBED');
  });

  it('resubscribes after unsubscribing (back to PENDING → confirm)', async () => {
    const res = await subscribe(email);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PENDING');

    const subscriber = await prisma.subscriber.findUniqueOrThrow({ where: { email } });
    const confirm = await request(app).get(`${BASE}/confirm?token=${subscriber.confirmToken}`);
    expect(confirm.status).toBe(200);
    const after = await prisma.subscriber.findUniqueOrThrow({ where: { email } });
    expect(after.status).toBe('SUBSCRIBED');
  });

  it('rejects an invalid email (400) and missing email (400)', async () => {
    expect((await request(app).post(`${BASE}/subscribe`).send({ email: 'not-an-email' })).status).toBe(400);
    expect((await request(app).post(`${BASE}/subscribe`).send({})).status).toBe(400);
  });
});

describe('Brevo bounce/complaint webhook — suppression', () => {
  const email = 'qa-bounce@example.com';
  created.add(email);

  it('rejects the webhook without the secret token (401)', async () => {
    const res = await request(app).post(`${BASE}/brevo-webhook`).send({ event: 'hard_bounce', email });
    expect(res.status).toBe(401);
  });

  it('suppresses the address on hard_bounce', async () => {
    await prisma.subscriber.upsert({
      where: { email },
      update: { status: 'SUBSCRIBED' },
      create: { email, status: 'SUBSCRIBED', confirmedAt: new Date() },
    });
    const res = await request(app)
      .post(`${BASE}/brevo-webhook?token=test-brevo-webhook-token`)
      .send({ event: 'hard_bounce', email, 'message-id': 'msg-001' });
    expect(res.status).toBe(200);
    expect(res.body.data.suppressed).toBe(1);

    const after = await prisma.subscriber.findUniqueOrThrow({ where: { email } });
    expect(after.status).toBe('UNSUBSCRIBED');
  });

  it('suppresses on spam complaint', async () => {
    await prisma.subscriber.upsert({
      where: { email },
      update: { status: 'SUBSCRIBED', unsubscribedAt: null },
      create: { email, status: 'SUBSCRIBED', confirmedAt: new Date() },
    });
    const res = await request(app)
      .post(`${BASE}/brevo-webhook?token=test-brevo-webhook-token`)
      .send({ event: 'spam', email, 'message-id': 'msg-002' });
    expect(res.status).toBe(200);
    const after = await prisma.subscriber.findUniqueOrThrow({ where: { email } });
    expect(after.status).toBe('UNSUBSCRIBED');
  });

  it('is idempotent — the same event twice only suppresses once', async () => {
    await prisma.subscriber.upsert({
      where: { email },
      update: { status: 'SUBSCRIBED', unsubscribedAt: null },
      create: { email, status: 'SUBSCRIBED', confirmedAt: new Date() },
    });
    const payload = { event: 'complaint', email, 'message-id': 'msg-dup-1' };
    const res1 = await request(app).post(`${BASE}/brevo-webhook?token=test-brevo-webhook-token`).send(payload);
    const res2 = await request(app).post(`${BASE}/brevo-webhook?token=test-brevo-webhook-token`).send(payload);
    expect(res1.body.data.suppressed).toBe(1);
    expect(res2.body.data.skippedDuplicates).toBe(1);
    expect(res2.body.data.suppressed).toBe(0);
  });
});

describe('Marketing suppression rules', () => {
  const subscribed = 'qa-mkt-sub@example.com';
  const unsubscribed = 'qa-mkt-unsub@example.com';
  created.add(subscribed);
  created.add(unsubscribed);

  it('unsubscribed users never receive marketing; subscribed users do', async () => {
    await prisma.subscriber.upsert({
      where: { email: subscribed },
      update: { status: 'SUBSCRIBED' },
      create: { email: subscribed, status: 'SUBSCRIBED', confirmedAt: new Date() },
    });
    await prisma.subscriber.upsert({
      where: { email: unsubscribed },
      update: { status: 'UNSUBSCRIBED' },
      create: { email: unsubscribed, status: 'UNSUBSCRIBED' },
    });

    const { sendMarketingEmail } = await import('../src/services/email.service');
    const template = {
      subject: 'Yahsab seasonal offer',
      html: '<p>Offer</p>',
      text: 'Offer',
    };
    expect(await sendMarketingEmail(unsubscribed, template)).toBe('skipped_unsubscribed');
    expect(await sendMarketingEmail(subscribed, template)).toBe('simulated');
    expect(await sendMarketingEmail('qa-mkt-unknown@example.com', template)).toBe('skipped_unsubscribed');
  });
});
