const express = require('express');
const { body, validationResult } = require('express-validator');
const { mysqlPool } = require('../config/database');
const StoryContent = require('../models/StoryContent');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Créer une histoire
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required'),
  body('description').optional().trim(),
  body('tags').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, tags } = req.body;
    const authorId = req.user.id;

    // Créer l'histoire dans MySQL
    const [result] = await mysqlPool.execute(
      'INSERT INTO stories (author_id, title, description, tags, status) VALUES (?, ?, ?, ?, ?)',
      [authorId, title, description || null, tags || null, 'draft']
    );

    const storyId = result.insertId;

    // Créer un document vide dans MongoDB pour le contenu
    await StoryContent.create({
      story_id: storyId,
      content: {}
    });

    res.status(201).json({
      message: 'Story created successfully',
      story: {
        id: storyId,
        author_id: authorId,
        title,
        description,
        tags,
        status: 'draft',
        start_page_id: null
      }
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lister toutes les histoires (publiées ou toutes si admin)
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT s.*, u.username as author_name,
             COUNT(DISTINCT gs.id) as play_count
      FROM stories s
      LEFT JOIN users u ON s.author_id = u.id
      LEFT JOIN game_sessions gs ON s.id = gs.story_id
    `;
    const params = [];

    // Si l'utilisateur n'est pas admin, ne montrer que les histoires publiées et non suspendues
    if (req.user.role !== 'admin') {
      query += ' WHERE s.status = ? AND s.is_suspended = FALSE';
      params.push('published');
    }

    query += ' GROUP BY s.id ORDER BY s.created_at DESC';

    const [stories] = await mysqlPool.execute(query, params);

    res.json({ stories });
  } catch (error) {
    console.error('List stories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rechercher des histoires
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    const query = `
      SELECT s.*, u.username as author_name,
             COUNT(DISTINCT gs.id) as play_count
      FROM stories s
      LEFT JOIN users u ON s.author_id = u.id
      LEFT JOIN game_sessions gs ON s.id = gs.story_id
      WHERE s.title LIKE ? AND s.status = ? AND s.is_suspended = FALSE
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `;
    const [stories] = await mysqlPool.execute(query, [`%${searchTerm}%`, 'published']);

    res.json({ stories });
  } catch (error) {
    console.error('Search stories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtenir une histoire par ID
router.get('/:id', async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);

    const [stories] = await mysqlPool.execute(
      `SELECT s.*, u.username as author_name,
              COUNT(DISTINCT gs.id) as play_count
       FROM stories s
       LEFT JOIN users u ON s.author_id = u.id
       LEFT JOIN game_sessions gs ON s.id = gs.story_id
       WHERE s.id = ?
       GROUP BY s.id`,
      [storyId]
    );

    if (stories.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const story = stories[0];

    // Vérifier les permissions (auteur ou admin peut voir les brouillons)
    if (story.status === 'draft' && story.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ story });
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Modifier une histoire
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('tags').optional().trim(),
  body('status').optional().isIn(['draft', 'published']),
  body('start_page_id').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const storyId = parseInt(req.params.id);

    // Vérifier que l'histoire existe et appartient à l'utilisateur
    const [stories] = await mysqlPool.execute(
      'SELECT author_id FROM stories WHERE id = ?',
      [storyId]
    );

    if (stories.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (stories[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const values = [];

    if (req.body.title !== undefined) {
      updates.push('title = ?');
      values.push(req.body.title);
    }
    if (req.body.description !== undefined) {
      updates.push('description = ?');
      values.push(req.body.description);
    }
    if (req.body.tags !== undefined) {
      updates.push('tags = ?');
      values.push(req.body.tags);
    }
    if (req.body.status !== undefined) {
      updates.push('status = ?');
      values.push(req.body.status);
    }
    if (req.body.start_page_id !== undefined) {
      updates.push('start_page_id = ?');
      values.push(req.body.start_page_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(storyId);

    await mysqlPool.execute(
      `UPDATE stories SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Récupérer l'histoire mise à jour
    const [updated] = await mysqlPool.execute(
      'SELECT * FROM stories WHERE id = ?',
      [storyId]
    );

    res.json({
      message: 'Story updated successfully',
      story: updated[0]
    });
  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Supprimer une histoire
router.delete('/:id', async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);

    // Vérifier que l'histoire existe et appartient à l'utilisateur
    const [stories] = await mysqlPool.execute(
      'SELECT author_id FROM stories WHERE id = ?',
      [storyId]
    );

    if (stories.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (stories[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Supprimer le contenu MongoDB
    await StoryContent.deleteOne({ story_id: storyId });

    // Supprimer l'histoire (cascade supprimera les pages et choix)
    await mysqlPool.execute('DELETE FROM stories WHERE id = ?', [storyId]);

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtenir les histoires de l'utilisateur connecté
router.get('/my/stories', async (req, res) => {
  try {
    const [stories] = await mysqlPool.execute(
      `SELECT s.*, COUNT(DISTINCT gs.id) as play_count
       FROM stories s
       LEFT JOIN game_sessions gs ON s.id = gs.story_id
       WHERE s.author_id = ?
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );

    res.json({ stories });
  } catch (error) {
    console.error('Get my stories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

