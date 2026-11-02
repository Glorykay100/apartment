import { PrismaClient, Role, BookingStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Yahsab database seed...');

  // 1. Clean existing records in reverse dependency order
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.apartmentImage.deleteMany();
  await prisma.apartment.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users (Admin & Guest)
  const adminPasswordHash = await bcrypt.hash('YahsabAdmin2026!', 10);
  const guestPasswordHash = await bcrypt.hash('YahsabGuest2026!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@yahsab.com',
      passwordHash: adminPasswordHash,
      fullName: 'Glory Itodo',
      phone: '+2348031234567',
      role: Role.ADMIN,
    },
  });

  const guest = await prisma.user.create({
    data: {
      email: 'guest@yahsab.com',
      passwordHash: guestPasswordHash,
      fullName: 'Terna Agbo',
      phone: '+2348098765432',
      role: Role.GUEST,
    },
  });

  console.log(`👤 Created Admin (${admin.email}) and Guest (${guest.email})`);

  // 3. Create Standard Amenities
  const amenitiesData = [
    { name: '24/7 Solar & Soundproof Generator', icon: 'Zap', category: 'Power & Utilities' },
    { name: 'Starlink Gigabit WiFi', icon: 'Wifi', category: 'Connectivity' },
    { name: 'Treated Central Water Supply', icon: 'Droplets', category: 'Power & Utilities' },
    { name: 'Smart Keyless Access', icon: 'KeyRound', category: 'Security' },
    { name: '24/7 Uniformed Security & CCTV', icon: 'ShieldCheck', category: 'Security' },
    { name: 'Fully Equipped Chef Kitchen', icon: 'Utensils', category: 'Kitchen & Dining' },
    { name: 'In-Unit Washer & Dryer', icon: 'Shirt', category: 'Convenience' },
    { name: '65" 4K Smart TV & Netflix', icon: 'Tv', category: 'Entertainment' },
    { name: 'Ergonomic Workspace Desk', icon: 'Briefcase', category: 'Work' },
    { name: 'Private Swimming Pool', icon: 'Waves', category: 'Leisure' },
    { name: 'Scenic Riverview Balcony', icon: 'Sun', category: 'Leisure' },
    { name: 'Secure On-Site Parking', icon: 'Car', category: 'Convenience' },
  ];

  const createdAmenities: Record<string, any> = {};
  for (const am of amenitiesData) {
    const record = await prisma.amenity.create({ data: am });
    createdAmenities[am.name] = record;
  }
  console.log(`✨ Created ${Object.keys(createdAmenities).length} amenities`);

  // 4. Create 9 Curated Realistic Nigerian Apartments
  const apartments = [
    {
      slug: 'the-benue-terrace-penthouse',
      title: 'The Benue Terrace Penthouse',
      headline: 'Panoramic River Benue views with expansive private balcony and wrap-around terrace',
      description:
        'Perched in the prestigious Old GRA enclave of Makurdi, this signature 3-bedroom penthouse offers an architectural sanctuary with floor-to-ceiling glass framing the River Benue. Features warm timber millwork, custom terracotta ceramic furnishings, a bespoke chef kitchen with marble island, and uninterrupted dual solar-diesel inverter power. Ideal for visiting executives, family retreats, and discerning diplomats.',
      address: 'Plot 14, River Benue Crescent, Old GRA',
      city: 'Makurdi',
      state: 'Benue',
      basePricePerNight: 85000,
      cleaningFee: 8000,
      serviceFeeRate: 0.05,
      bedrooms: 3,
      bathrooms: 3,
      maxGuests: 6,
      sqft: 2200,
      isFeatured: true,
      isPublished: true,
      checkInTime: '14:00',
      checkOutTime: '11:00',
      houseRules: [
        'Strictly no indoor smoking (terrace permitted)',
        'Quiet hours observe 10:00 PM to 7:00 AM',
        'No unauthorized large social gatherings or filming without prior clearance',
        'Maximum 6 registered guests overnight',
      ],
      amenityNames: [
        '24/7 Solar & Soundproof Generator',
        'Starlink Gigabit WiFi',
        'Treated Central Water Supply',
        'Smart Keyless Access',
        '24/7 Uniformed Security & CCTV',
        'Fully Equipped Chef Kitchen',
        '65" 4K Smart TV & Netflix',
        'Scenic Riverview Balcony',
        'Secure On-Site Parking',
        'In-Unit Washer & Dryer',
      ],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
          caption: 'Spacious sun-drenched living room with direct terrace access',
          isPrimary: true,
          order: 0,
        },
        {
          url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
          caption: 'Chef kitchen with African granite counters and bar seating',
          isPrimary: false,
          order: 1,
        },
        {
          url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
          caption: 'Master bedroom suite with super-king pillow-top mattress',
          isPrimary: false,
          order: 2,
        },
        {
          url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
          caption: 'En-suite master bath with deep soaking tub and rain shower',
          isPrimary: false,
          order: 3,
        },
      ],
    },
    {
      slug: 'high-level-executive-suite',
      title: 'High-Level Executive Studio',
      headline: 'Minimalist designer residence crafted for focus, business trips, and modern comfort',
      description:
        'Conveniently situated in High-Level, Makurdi, just minutes from the city commercial hub and State Secretariat. This stylish executive suite pairs minimalist Scandinavian warmth with local craft. Outfitted with high-speed Starlink connectivity, an ergonomic walnut workstation, ambient smart lighting, and 24/7 uninterrupted power for remote productivity.',
      address: '22 Kashim Ibrahim Road, High-Level',
      city: 'Makurdi',
      state: 'Benue',
      basePricePerNight: 35000,
      cleaningFee: 4000,
      serviceFeeRate: 0.05,
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      sqft: 650,
      isFeatured: true,
      isPublished: true,
      checkInTime: '13:00',
      checkOutTime: '11:00',
      houseRules: [
        'Non-smoking throughout the building',
        'Valid photo ID required at check-in',
        'Quiet residential environment',
      ],
      amenityNames: [
        '24/7 Solar & Soundproof Generator',
        'Starlink Gigabit WiFi',
        'Ergonomic Workspace Desk',
        'Smart Keyless Access',
        '65" 4K Smart TV & Netflix',
        'Secure On-Site Parking',
      ],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80',
          caption: 'Studio layout featuring warm timber textures and comfortable sofa',
          isPrimary: true,
          order: 0,
        },
        {
          url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80',
          caption: 'Serene bedroom area with hotel-grade crisp white linens',
          isPrimary: false,
          order: 1,
        },
        {
          url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
          caption: 'En-suite modern bathroom with glass-enclosed rain shower',
          isPrimary: false,
          order: 2,
        },
      ],
    },
    {
      slug: 'judges-quarters-garden-villa',
      title: 'Judges Quarters Garden Villa',
      headline: 'Secluded 2-bedroom garden residence surrounded by manicured tropical flora',
      description:
        'Tucked inside the serene Judges Quarters residential district in Makurdi, this private 2-bedroom villa is framed by palm fronds and flowering bougainvillea. Enjoy morning coffee on the shaded private patio, prepare meals in a granite-topped kitchen, and rest easy with round-the-clock private security and guaranteed clean energy.',
      address: '18 Justice Idoko Way, Judges Quarters',
      city: 'Makurdi',
      state: 'Benue',
      basePricePerNight: 55000,
      cleaningFee: 6000,
      serviceFeeRate: 0.05,
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      sqft: 1400,
      isFeatured: true,
      isPublished: true,
      checkInTime: '14:00',
      checkOutTime: '11:00',
      houseRules: [
        'Pets considered upon advance request',
        'No smoking inside the premises',
        'Respect quiet hours after 10:00 PM',
      ],
      amenityNames: [
        '24/7 Solar & Soundproof Generator',
        'Starlink Gigabit WiFi',
        'Treated Central Water Supply',
        '24/7 Uniformed Security & CCTV',
        'Fully Equipped Chef Kitchen',
        'In-Unit Washer & Dryer',
        '65" 4K Smart TV & Netflix',
        'Secure On-Site Parking',
      ],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80',
          caption: 'Garden lounge opening onto lush outdoor greenery',
          isPrimary: true,
          order: 0,
        },
        {
          url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=1200&q=80',
          caption: 'Spacious guest bedroom with king bed and garden views',
          isPrimary: false,
          order: 1,
        },
        {
          url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
          caption: 'Fully appointed contemporary kitchen with gas burners',
          isPrimary: false,
          order: 2,
        },
      ],
    },
    {
      slug: 'wurukum-heritage-loft',
      title: 'Wurukum Heritage Loft',
      headline: 'Warm brick accents and lofted ceilings near Makurdi Roundabout',
      description:
        'A character-filled two-story loft residence showcasing warm earthy brickwork, high wood beams, and a modern mezzanine bedroom. Minutes from Wurukum Market and the Wurukum Roundabout, offering both authentic cultural immersion and executive peace with soundproof acoustic double glazing.',
      address: '5 Gboko Road, Wurukum',
      city: 'Makurdi',
      state: 'Benue',
      basePricePerNight: 42000,
      cleaningFee: 5000,
      serviceFeeRate: 0.05,
      bedrooms: 1,
      bathrooms: 1.5,
      maxGuests: 2,
      sqft: 900,
      isFeatured: false,
      isPublished: true,
      checkInTime: '14:00',
      checkOutTime: '11:00',
      houseRules: [
        'Strictly 2 guests maximum',
        'No smoking inside',
        'Check-in strictly with valid government identity',
      ],
      amenityNames: [
        '24/7 Solar & Soundproof Generator',
        'Starlink Gigabit WiFi',
        'Smart Keyless Access',
        '65" 4K Smart TV & Netflix',
        'Ergonomic Workspace Desk',
        'Secure On-Site Parking',
      ],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=80',
          caption: 'Industrial-chic loft with double-height ceilings',
          isPrimary: true,
          order: 0,
        },
        {
          url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
          caption: 'Mezzanine master sleeping quarter with ambient reading lights',
          isPrimary: false,
          order: 1,
        },
      ],
    },
    {
      slug: 'guzape-hillside-haven-abuja',
      title: 'The Guzape Hillside Haven',
      headline: 'Architectural luxury with infinity pool overlooking Abuja city lights',
      description:
        'Located in the elite Guzape hills of Abuja, this 3-bedroom luxury apartment pairs breathtaking panoramic sunset vistas with ultra-modern finishings. Includes private infinity pool access, marble bathrooms with rainfall showers, German induction kitchen, and 24/7 dedicated security protocol.',
      address: 'Plot 418, Diplomatic Hillway, Guzape',
      city: 'Abuja',
      state: 'FCT',
      basePricePerNight: 125000,
      cleaningFee: 10000,
      serviceFeeRate: 0.05,
      bedrooms: 3,
      bathrooms: 3.5,
      maxGuests: 6,
      sqft: 2600,
      isFeatured: true,
      isPublished: true,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      houseRules: [
        'No indoor smoking',
        'Parties and events require prior management authorization',
        'Children must be supervised around pool area at all times',
      ],
      amenityNames: [
        '24/7 Solar & Soundproof Generator',
        'Starlink Gigabit WiFi',
        'Private Swimming Pool',
        'Treated Central Water Supply',
        '24/7 Uniformed Security & CCTV',
        'Fully Equipped Chef Kitchen',
        'In-Unit Washer & Dryer',
        '65" 4K Smart TV & Netflix',
        'Scenic Riverview Balcony',
        'Secure On-Site Parking',
      ],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80',
          caption: 'Sleek open-plan living room overlooking the Abuja skyline',
          isPrimary: true,
          order: 0,
        },
        {
          url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
          caption: 'Sunken terrace and infinity pool with evening illumination',
          isPrimary: false,
          order: 1,
        },
        {
          url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
          caption: 'Grand master bedroom with bespoke oak wardrobe',
          isPrimary: false,
          order: 2,
        },
      ],
    },
    {
      slug: 'wuse-ii-diplomatic-residence',
      title: 'Wuse II Diplomatic Flat',
      headline: 'Chic 2-bedroom urban residence in the heart of Abuja’s lifestyle quarter',
      description:
        'Steps away from gourmet restaurants, art galleries, and embassies in Wuse II, Abuja. Features acoustic isolation, automated blackout shades, smart voice lighting, premium soundbar, and a serene inner courtyard garden. Ideal for long-term consultants and diplomatic delegations.',
      address: '14 Adetokunbo Ademola Crescent, Wuse II',
      city: 'Abuja',
      state: 'FCT',
      basePricePerNight: 95000,
      cleaningFee: 7500,
      serviceFeeRate: 0.05,
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      sqft: 1550,
      isFeatured: true,
      isPublished: true,
      checkInTime: '14:00',
      checkOutTime: '11:00',
      houseRules: [
        'Non-smoking throughout',
        'No pets allowed',
        'Strictly 4 guests overnight limit',
      ],
      amenityNames: [
        '24/7 Solar & Soundproof Generator',
        'Starlink Gigabit WiFi',
        'Treated Central Water Supply',
        'Smart Keyless Access',
        '24/7 Uniformed Security & CCTV',
        'Fully Equipped Chef Kitchen',
        'In-Unit Washer & Dryer',
        '65" 4K Smart TV & Netflix',
        'Ergonomic Workspace Desk',
        'Secure On-Site Parking',
      ],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80',
          caption: 'Airy living space with curated contemporary African art',
          isPrimary: true,
          order: 0,
        },
        {
          url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
          caption: 'Second bedroom with private bathroom and workstation',
          isPrimary: false,
          order: 1,
        },
      ],
    },
    {
      slug: 'old-gra-orchard-cottage',
      title: 'Old GRA Orchard Cottage',
      headline: 'Single-story boutique sanctuary shaded by mature mango and citrus trees',
      description:
        'Experience timeless pastoral calm in Makurdi’s historic Old GRA. This charming 2-bedroom bungalow is surrounded by a mature fruit orchard and features terracotta tiled floors, custom rattan seating, high ceilings, and an outdoor BBQ pavilion. Perfect for families seeking peace and fresh air.',
      address: '7 Atom Kpera Crescent, Old GRA',
      city: 'Makurdi',
      state: 'Benue',
      basePricePerNight: 48000,
      cleaningFee: 5000,
      serviceFeeRate: 0.05,
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      sqft: 1300,
      isFeatured: false,
      isPublished: true,
      checkInTime: '14:00',
      checkOutTime: '11:00',
      houseRules: [
        'Children welcome under supervision',
        'No smoking inside the cottage',
        'BBQ permitted in the designated outdoor gazebo only',
      ],
      amenityNames: [
        '24/7 Solar & Soundproof Generator',
        'Starlink Gigabit WiFi',
        'Treated Central Water Supply',
        'Fully Equipped Chef Kitchen',
        '65" 4K Smart TV & Netflix',
        'Secure On-Site Parking',
      ],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1400&q=80',
          caption: 'Cottage exterior patio flanked by tranquil greenery',
          isPrimary: true,
          order: 0,
        },
        {
          url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
          caption: 'Cozy lounge with plush modular sofa and warm ambient lamps',
          isPrimary: false,
          order: 1,
        },
      ],
    },
    {
      slug: 'wadata-riverside-studio',
      title: 'Wadata Riverside Modern Studio',
      headline: 'Compact, value-focused contemporary studio near the artisanal fish market',
      description:
        'A thoughtfully designed, budget-friendly apartment for solo travelers, researchers, and young professionals. Features an ultra-efficient open plan with kitchenette, high-pressure shower, Starlink broadband, and round-the-clock solar inverter backup.',
      address: '3 Marine Road, Wadata',
      city: 'Makurdi',
      state: 'Benue',
      basePricePerNight: 28000,
      cleaningFee: 3500,
      serviceFeeRate: 0.05,
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      sqft: 480,
      isFeatured: false,
      isPublished: true,
      checkInTime: '13:00',
      checkOutTime: '11:00',
      houseRules: [
        'Max 2 guests',
        'No smoking',
        'Respect quiet hours after 10:00 PM',
      ],
      amenityNames: [
        '24/7 Solar & Soundproof Generator',
        'Starlink Gigabit WiFi',
        'Smart Keyless Access',
        'Ergonomic Workspace Desk',
        'Secure On-Site Parking',
      ],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80',
          caption: 'Modern studio suite with streamlined kitchenette and dining table',
          isPrimary: true,
          order: 0,
        },
      ],
    },
  ];

  for (const apt of apartments) {
    const { amenityNames, images, ...aptData } = apt;

    const createdApartment = await prisma.apartment.create({
      data: {
        ...aptData,
        amenities: {
          connect: amenityNames.map((name) => ({ id: createdAmenities[name].id })),
        },
        images: {
          create: images,
        },
      },
    });

    console.log(`🏡 Seeded apartment: ${createdApartment.title} (₦${createdApartment.basePricePerNight.toLocaleString()}/night)`);
  }

  // 5. Seed a Completed Booking & Verified Stay Review for Social Proof
  const penthouse = await prisma.apartment.findUnique({
    where: { slug: 'the-benue-terrace-penthouse' },
  });

  if (penthouse) {
    const pastCheckIn = new Date();
    pastCheckIn.setDate(pastCheckIn.getDate() - 10);
    const pastCheckOut = new Date();
    pastCheckOut.setDate(pastCheckOut.getDate() - 7);

    const booking = await prisma.booking.create({
      data: {
        reference: 'YAH-2026-B9K1',
        apartmentId: penthouse.id,
        userId: guest.id,
        guestFullName: guest.fullName,
        guestEmail: guest.email,
        guestPhone: guest.phone || '+2348098765432',
        checkIn: pastCheckIn,
        checkOut: pastCheckOut,
        nights: 3,
        guestCount: 2,
        nightlyRate: penthouse.basePricePerNight,
        subtotal: penthouse.basePricePerNight * 3,
        cleaningFee: penthouse.cleaningFee,
        serviceFee: Math.round(penthouse.basePricePerNight * 3 * penthouse.serviceFeeRate),
        totalAmount:
          penthouse.basePricePerNight * 3 +
          penthouse.cleaningFee +
          Math.round(penthouse.basePricePerNight * 3 * penthouse.serviceFeeRate),
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        paystackReference: 'PSTK_VERIFIED_PAST_STAY_001',
        paystackPaidAt: pastCheckIn,
      },
    });

    await prisma.review.create({
      data: {
        apartmentId: penthouse.id,
        bookingId: booking.id,
        userId: guest.id,
        rating: 5,
        cleanliness: 5,
        accuracy: 5,
        location: 5,
        value: 5,
        comment:
          'Staying at The Benue Terrace Penthouse was easily the highlight of my trip to Makurdi. The 24/7 solar power never flickered once, Starlink internet allowed me to run all my video conferences smoothly, and the sunset over River Benue from the terrace is world-class. Yahsab hospitality is second to none.',
      },
    });

    console.log(`⭐ Seeded completed stay and 5-star review for ${penthouse.title}`);
  }

  console.log('✅ Yahsab database seed finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
