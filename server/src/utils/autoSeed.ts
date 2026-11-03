import { User } from '../models/User.js';
import { seedDatabase } from '../scripts/seed.js';

export const autoSeedIfEmpty = async (): Promise<void> => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('⚡ Empty database detected. Running automatic initial seed...');
      await seedDatabase(false);
      console.log('✅ Initial database auto-seeding completed.');
    }
  } catch (err) {
    console.error('Auto-seed check failed:', err);
  }
};
