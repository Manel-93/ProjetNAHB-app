const mysql = require('mysql2/promise');
const mongoose = require('mongoose');

// MySQL Connection Pool
const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nahb_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// MongoDB (via Mongoose)
const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nahb';
    await mongoose.connect(mongoURI, {
      autoIndex: true
    });
    console.log('Connected to MongoDB with Mongoose');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Initialize MySQL tables
const initMySQLTables = async () => {
  try {
    const connection = await mysqlPool.getConnection();
    
    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        is_banned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Stories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        author_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        tags VARCHAR(500),
        status ENUM('draft', 'published') DEFAULT 'draft',
        start_page_id INT,
        is_suspended BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_author (author_id),
        INDEX idx_status (status)
      )
    `);

    // Pages table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        story_id INT NOT NULL,
        is_ending BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
        INDEX idx_story (story_id)
      )
    `);

    // Choices table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS choices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_id INT NOT NULL,
        target_page_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
        FOREIGN KEY (target_page_id) REFERENCES pages(id) ON DELETE SET NULL,
        INDEX idx_page (page_id),
        INDEX idx_target (target_page_id)
      )
    `);

    // Game sessions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        story_id INT NOT NULL,
        ending_page_id INT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
        FOREIGN KEY (ending_page_id) REFERENCES pages(id) ON DELETE SET NULL,
        INDEX idx_user (user_id),
        INDEX idx_story (story_id)
      )
    `);

    connection.release();
    console.log('MySQL tables initialized');
  } catch (error) {
    console.error('Error initializing MySQL tables:', error);
    throw error;
  }
};

module.exports = {
  mysqlPool,
  connectMongoDB,
  mongoose,
  initMySQLTables
};

