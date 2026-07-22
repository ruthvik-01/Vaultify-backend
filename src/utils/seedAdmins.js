const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const logger = require('../config/logger');

const seedAdmins = async () => {
  try {
    const adminsToSeed = [
      {
        name: 'Admin 1',
        email: 'vikranthabv@gmail.com',
        password: 'Admin@123',
        role: 'admin'
      },
      {
        name: 'Admin 2',
        email: 'EdubotAdmin@gmail.com',
        password: 'Password@123',
        role: 'admin'
      }
    ];

    for (const adminData of adminsToSeed) {
      const existingAdmin = await Admin.findOne({ email: adminData.email });
      const password_hash = await bcrypt.hash(adminData.password, 10);

      if (existingAdmin) {
        existingAdmin.password_hash = password_hash;
        existingAdmin.role = adminData.role;
        // Admin schema doesn't have a status field by default, but if it did we would set it
        await existingAdmin.save();
        logger.info(`Updated existing admin account: ${adminData.email}`);
      } else {
        const newAdmin = new Admin({
          name: adminData.name,
          email: adminData.email,
          password_hash,
          role: adminData.role
        });
        await newAdmin.save();
        logger.info(`Created new admin account: ${adminData.email}`);
      }
    }
  } catch (error) {
    logger.error('Error seeding admins:', error);
  }
};

module.exports = seedAdmins;
