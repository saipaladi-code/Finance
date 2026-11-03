import { User } from '../models/User.js';
import { Customer } from '../models/Customer.js';
import { seedDatabase } from '../scripts/seed.js';
import { normalizeIndianPhone } from './phoneUtils.js';

export const autoSeedIfEmpty = async (): Promise<void> => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('⚡ Empty database detected. Running automatic initial seed...');
      await seedDatabase(false);
      console.log('✅ Initial database auto-seeding completed.');
      return;
    }

    // Migration check: Ensure an admin with default mobile '9876543210' exists
    const adminByPhone = await User.findOne({ phone: '9876543210' });
    if (!adminByPhone) {
      // Check if an admin exists by email or role
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        existingAdmin.phone = '9876543210';
        existingAdmin.password = 'Password@123';
        existingAdmin.isActive = true;
        await existingAdmin.save();
        console.log('🔄 Migrated existing admin user to mobile: 9876543210 / Password@123');
      } else {
        await User.create({
          name: 'R. Venkatesh (Admin)',
          phone: '9876543210',
          email: 'admin@finance.local',
          password: 'Password@123',
          role: 'admin',
          isActive: true,
        });
        console.log('👤 Created default admin with mobile: 9876543210 / Password@123');
      }
    }

    // Normalize customer phones in DB
    const customersWithoutCleanPhone = await Customer.find({});
    for (const cust of customersWithoutCleanPhone) {
      const clean = normalizeIndianPhone(cust.phone);
      if (clean && clean !== cust.phone) {
        cust.phone = clean;
        await cust.save();
      }
    }
  } catch (err) {
    console.error('Auto-seed / migration check failed:', err);
  }
};
