const bcrypt = require('bcryptjs');
const { mysqlPool, initMySQLTables, connectMongoDB } = require('../config/database');
require('dotenv').config();

async function createAdmin() {
  try {
    await initMySQLTables();
    await connectMongoDB();

    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@nahb.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    // Vérifier si l'admin existe déjà
    const [existing] = await mysqlPool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existing.length > 0) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Créer l'admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await mysqlPool.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'admin']
    );

    console.log('Admin user created successfully!');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();

