import dotenv from 'dotenv';
import { connectDB, closeDB } from '../config/db.js';
import { Service, Barber, SalonConfig } from '../models/index.js';

dotenv.config();

export const seedServices = [
  {
    nameEn: 'Haircut',
    nameGu: 'હેર કટ',
    durationMin: 30,
    price: 150,
    sortOrder: 1,
    isActive: true,
  },
  {
    nameEn: 'Beard Trim & Styling',
    nameGu: 'દાઢી ટ્રિમ અને સ્ટાઇલિંગ',
    durationMin: 15,
    price: 80,
    sortOrder: 2,
    isActive: true,
  },
  {
    nameEn: 'Hair Spa',
    nameGu: 'હેર સ્પા',
    durationMin: 45,
    price: 400,
    sortOrder: 3,
    isActive: true,
  },
  {
    nameEn: 'Relaxing Head Massage',
    nameGu: 'રિલેક્સિંગ હેડ મસાજ',
    durationMin: 20,
    price: 120,
    sortOrder: 4,
    isActive: true,
  },
  {
    nameEn: 'De-Tan Facial Cleanup',
    nameGu: 'ડી-ટેન ફેશિયલ ક્લીનઅપ',
    durationMin: 35,
    price: 350,
    sortOrder: 5,
    isActive: true,
  },
  {
    nameEn: 'Hair Colour & Wash',
    nameGu: 'હેર કલર અને વોશ',
    durationMin: 45,
    price: 500,
    sortOrder: 6,
    isActive: true,
  },
];

export const seedBarbers = [
  {
    name: 'Ravi',
    slug: 'ravi',
    specialtyEn: 'Senior Hair & Fade Specialist',
    specialtyGu: 'સિનિયર હેર અને ફેડ સ્પેશિયાલિસ્ટ',
    status: 'available',
    onDuty: true,
  },
  {
    name: 'Amit',
    slug: 'amit',
    specialtyEn: 'Classic Cuts & Beard Styling',
    specialtyGu: 'ક્લાસિક કટ અને દાઢી સ્ટાઇલિંગ',
    status: 'available',
    onDuty: true,
  },
  {
    name: 'Imran',
    slug: 'imran',
    specialtyEn: 'Hair Spa & Grooming Expert',
    specialtyGu: 'હેર સ્પા અને ગ્રૂમિંગ એક્સપર્ટ',
    status: 'available',
    onDuty: true,
  },
];

export const defaultSalonConfig = {
  key: 'default',
  salonNameEn: 'Studio Kashi Salon',
  salonNameGu: 'સ્ટુડિયો કાશી સલૂન',
  openTime: '09:00',
  closeTime: '21:00',
  isQueueOpen: true,
  onlineCutoffMinutes: 30,
};

/**
 * Idempotently seed data into MongoDB
 */
export const seedData = async () => {
  console.log('[Seed] Checking and seeding database records...');

  // 1. SalonConfig (upsert)
  await SalonConfig.findOneAndUpdate(
    { key: 'default' },
    { $set: defaultSalonConfig },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('[Seed] SalonConfig verified/upserted.');

  // 2. Barbers (idempotent upsert by slug)
  for (const b of seedBarbers) {
    await Barber.findOneAndUpdate(
      { slug: b.slug },
      { $set: b },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`[Seed] ${seedBarbers.length} Barbers verified/upserted.`);

  // 3. Services (idempotent upsert by nameEn)
  for (const s of seedServices) {
    await Service.findOneAndUpdate(
      { nameEn: s.nameEn },
      { $set: s },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`[Seed] ${seedServices.length} Services verified/upserted.`);

  return true;
};

/**
 * Auto seed only if Barber or Service collections are empty
 */
export const autoSeedIfEmpty = async () => {
  try {
    const serviceCount = await Service.countDocuments();
    const barberCount = await Barber.countDocuments();
    const configCount = await SalonConfig.countDocuments();

    if (serviceCount === 0 || barberCount === 0 || configCount === 0) {
      console.log('[Seed] Empty collections detected. Running initial seed...');
      await seedData();
    } else {
      console.log(`[Seed] Database already seeded (${barberCount} barbers, ${serviceCount} services).`);
    }
  } catch (error) {
    console.error('[Seed] Error in autoSeedIfEmpty:', error.message);
  }
};

// If run directly from CLI via `node src/seed/seedData.js`
if (process.argv[1] && process.argv[1].endsWith('seedData.js')) {
  (async () => {
    try {
      await connectDB();
      await seedData();
      console.log('[Seed] Seeding completed successfully.');
      await closeDB();
      process.exit(0);
    } catch (err) {
      console.error('[Seed Error]:', err);
      process.exit(1);
    }
  })();
}

export default seedData;
