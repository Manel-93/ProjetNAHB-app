const express = require('express');
const { body, validationResult } = require('express-validator');
const { mysqlPool } = require('../config/database');
const PageContent = require('../models/PageContent');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Créer une page
router.post('/', [
  body('story_id').isInt().withMessage('Story ID is required'),
  body('is_ending').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { story_id, is_ending = false } = req.body;

    // Vérifier que l'histoire existe et appartient à l'utilisateur
    const [stories] = await mysqlPool.execute(
      'SELECT author_id FROM stories WHERE id = ?',
      [story_id]
    );

    if (stories.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (stories[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Créer la page dans MySQL
    const [result] = await mysqlPool.execute(
      'INSERT INTO pages (story_id, is_ending) VALUES (?, ?)',
      [story_id, is_ending]
    );

    const pageId = result.insertId;

    // Créer le contenu dans MongoDB
    await PageContent.create({
      page_id: pageId,
      text: '',
      images: []
    });

    res.status(201).json({
      message: 'Page created successfully',
      page: {
        id: pageId,
        story_id,
        is_ending,
        text: '',
        images: []
      }
    });
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtenir toutes les pages d'une histoire
router.get('/story/:storyId', async (req, res) => {
  try {
    const storyId = parseInt(req.params.storyId);

    // Vérifier que l'histoire existe
    const [stories] = await mysqlPool.execute(
      'SELECT author_id, status FROM stories WHERE id = ?',
      [storyId]
    );

    if (stories.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const story = stories[0];

    // Vérifier les permissions
    if (story.status === 'draft' && story.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Récupérer les pages depuis MySQL
    const [pages] = await mysqlPool.execute(
      'SELECT * FROM pages WHERE story_id = ? ORDER BY created_at ASC',
      [storyId]
    );

    // Récupérer le contenu depuis MongoDB
    const pageIds = pages.map(p => p.id);
    const contents = await PageContent.find({ page_id: { $in: pageIds } });

    const contentMap = {};
    contents.forEach(content => {
      contentMap[content.page_id] = content;
    });

    // Combiner les données
    const pagesWithContent = pages.map(page => ({
      ...page,
      text: contentMap[page.id]?.text || '',
      images: contentMap[page.id]?.images || []
    }));

    res.json({ pages: pagesWithContent });
  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtenir une page par ID
router.get('/:id', async (req, res) => {
  try {
    const pageId = parseInt(req.params.id);

    // Récupérer la page depuis MySQL
    const [pages] = await mysqlPool.execute(
      'SELECT p.*, s.author_id, s.status FROM pages p JOIN stories s ON p.story_id = s.id WHERE p.id = ?',
      [pageId]
    );

    if (pages.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const page = pages[0];

    // Vérifier les permissions
    if (page.status === 'draft' && page.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Récupérer le contenu depuis MongoDB
    const content = await PageContent.findOne({ page_id: pageId });

    res.json({
      page: {
        ...page,
        text: content?.text || '',
        images: content?.images || []
      }
    });
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Modifier une page
router.put('/:id', [
  body('is_ending').optional().isBoolean(),
  body('text').optional().isString(),
  body('images').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pageId = parseInt(req.params.id);

    // Vérifier que la page existe et appartient à l'utilisateur
    const [pages] = await mysqlPool.execute(
      'SELECT p.*, s.author_id FROM pages p JOIN stories s ON p.story_id = s.id WHERE p.id = ?',
      [pageId]
    );

    if (pages.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (pages[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mettre à jour MySQL si nécessaire
    if (req.body.is_ending !== undefined) {
      await mysqlPool.execute(
        'UPDATE pages SET is_ending = ? WHERE id = ?',
        [req.body.is_ending, pageId]
      );
    }

    // Mettre à jour MongoDB
    const updateContent = {};
    if (req.body.text !== undefined) updateContent.text = req.body.text;
    if (req.body.images !== undefined) updateContent.images = req.body.images;

    if (Object.keys(updateContent).length > 0) {
      await PageContent.findOneAndUpdate(
        { page_id: pageId },
        updateContent,
        { upsert: true, new: true }
      );
    }

    // Récupérer la page mise à jour
    const [updated] = await mysqlPool.execute('SELECT * FROM pages WHERE id = ?', [pageId]);
    const content = await PageContent.findOne({ page_id: pageId });

    res.json({
      message: 'Page updated successfully',
      page: {
        ...updated[0],
        text: content?.text || '',
        images: content?.images || []
      }
    });
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Supprimer une page
router.delete('/:id', async (req, res) => {
  try {
    const pageId = parseInt(req.params.id);

    // Vérifier que la page existe et appartient à l'utilisateur
    const [pages] = await mysqlPool.execute(
      'SELECT p.*, s.author_id FROM pages p JOIN stories s ON p.story_id = s.id WHERE p.id = ?',
      [pageId]
    );

    if (pages.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (pages[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Supprimer le contenu MongoDB
    await PageContent.deleteOne({ page_id: pageId });

    // Supprimer la page (cascade supprimera les choix)
    await mysqlPool.execute('DELETE FROM pages WHERE id = ?', [pageId]);

    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Delete page error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

