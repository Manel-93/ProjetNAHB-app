const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectMongoDB, initMySQLTables } = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize databases
(async () => {
  try {
    await initMySQLTables();
    await connectMongoDB();
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
})();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const storyRoutes = require('./routes/stories');
const pageRoutes = require('./routes/pages');
const choiceRoutes = require('./routes/choices');
const playRoutes = require('./routes/play');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/choices', choiceRoutes);
app.use('/api/play', playRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'NAHB API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

