const express = require('express');
const { mysqlPool } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Toutes les routes admin nécessitent authentification et rôle admin
router.use(authenticate);
router.use(requireAdmin);

// Bannir un auteur
router.post('/ban-author/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot ban yourself' });
    }

    const [users] = await mysqlPool.execute(
      'SELECT id, is_banned FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await mysqlPool.execute(
      'UPDATE users SET is_banned = TRUE WHERE id = ?',
      [userId]
    );

    res.json({ message: 'Author banned successfully' });
  } catch (error) {
    console.error('Ban author error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Débannir un auteur
router.post('/unban-author/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const [users] = await mysqlPool.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await mysqlPool.execute(
      'UPDATE users SET is_banned = FALSE WHERE id = ?',
      [userId]
    );

    res.json({ message: 'Author unbanned successfully' });
  } catch (error) {
    console.error('Unban author error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Suspendre une histoire
router.post('/suspend-story/:storyId', async (req, res) => {
  try {
    const storyId = parseInt(req.params.storyId);

    const [stories] = await mysqlPool.execute(
      'SELECT id FROM stories WHERE id = ?',
      [storyId]
    );

    if (stories.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    await mysqlPool.execute(
      'UPDATE stories SET is_suspended = TRUE WHERE id = ?',
      [storyId]
    );

    res.json({ message: 'Story suspended successfully' });
  } catch (error) {
    console.error('Suspend story error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Réactiver une histoire
router.post('/unsuspend-story/:storyId', async (req, res) => {
  try {
    const storyId = parseInt(req.params.storyId);

    const [stories] = await mysqlPool.execute(
      'SELECT id FROM stories WHERE id = ?',
      [storyId]
    );

    if (stories.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    await mysqlPool.execute(
      'UPDATE stories SET is_suspended = FALSE WHERE id = ?',
      [storyId]
    );

    res.json({ message: 'Story unsuspended successfully' });
  } catch (error) {
    console.error('Unsuspend story error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtenir les statistiques globales
router.get('/statistics', async (req, res) => {
  try {
    // Statistiques des histoires
    const [storyStats] = await mysqlPool.execute(`
      SELECT 
        s.id,
        s.title,
        s.status,
        s.is_suspended,
        u.username as author_name,
        COUNT(DISTINCT gs.id) as play_count,
        COUNT(DISTINCT p.id) as page_count,
        COUNT(DISTINCT c.id) as choice_count
      FROM stories s
      LEFT JOIN users u ON s.author_id = u.id
      LEFT JOIN game_sessions gs ON s.id = gs.story_id
      LEFT JOIN pages p ON s.id = p.story_id
      LEFT JOIN choices c ON p.id = c.page_id
      GROUP BY s.id
      ORDER BY play_count DESC
    `);

    // Statistiques globales
    const [totalStats] = await mysqlPool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM stories) as total_stories,
        (SELECT COUNT(*) FROM stories WHERE status = 'published') as published_stories,
        (SELECT COUNT(*) FROM game_sessions) as total_sessions,
        (SELECT COUNT(*) FROM pages) as total_pages
    `);

    res.json({
      story_statistics: storyStats,
      global_statistics: totalStats[0]
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtenir tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const [users] = await mysqlPool.execute(
      `SELECT u.id, u.username, u.email, u.role, u.is_banned, u.created_at,
              COUNT(DISTINCT s.id) as story_count,
              COUNT(DISTINCT gs.id) as session_count
       FROM users u
       LEFT JOIN stories s ON u.id = s.author_id
       LEFT JOIN game_sessions gs ON u.id = gs.user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

