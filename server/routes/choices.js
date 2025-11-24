const express = require('express');
const { body, validationResult } = require('express-validator');
const { mysqlPool } = require('../config/database');
const ChoiceContent = require('../models/ChoiceContent');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Créer un choix
router.post('/', [
  body('page_id').isInt().withMessage('Page ID is required'),
  body('target_page_id').optional().isInt(),
  body('text').trim().isLength({ min: 1 }).withMessage('Choice text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page_id, target_page_id, text } = req.body;

    // Vérifier que la page existe et appartient à l'utilisateur
    const [pages] = await mysqlPool.execute(
      'SELECT p.*, s.author_id FROM pages p JOIN stories s ON p.story_id = s.id WHERE p.id = ?',
      [page_id]
    );

    if (pages.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (pages[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Vérifier que la page cible existe dans la même histoire (si fournie)
    if (target_page_id) {
      const [targetPages] = await mysqlPool.execute(
        'SELECT story_id FROM pages WHERE id = ?',
        [target_page_id]
      );

      if (targetPages.length === 0) {
        return res.status(404).json({ error: 'Target page not found' });
      }

      if (targetPages[0].story_id !== pages[0].story_id) {
        return res.status(400).json({ error: 'Target page must be in the same story' });
      }
    }

    // Créer le choix dans MySQL
    const [result] = await mysqlPool.execute(
      'INSERT INTO choices (page_id, target_page_id) VALUES (?, ?)',
      [page_id, target_page_id || null]
    );

    const choiceId = result.insertId;

    // Stocker le texte dans MongoDB
    await ChoiceContent.create({
      choice_id: choiceId,
      text: text
    });

    res.status(201).json({
      message: 'Choice created successfully',
      choice: {
        id: choiceId,
        page_id,
        target_page_id,
        text
      }
    });
  } catch (error) {
    console.error('Create choice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtenir tous les choix d'une page
router.get('/page/:pageId', async (req, res) => {
  try {
    const pageId = parseInt(req.params.pageId);

    // Récupérer les choix depuis MySQL
    const [choices] = await mysqlPool.execute(
      'SELECT * FROM choices WHERE page_id = ? ORDER BY created_at ASC',
      [pageId]
    );

    // Récupérer les textes depuis MongoDB
    const choiceIds = choices.map(c => c.id);
    const contents = await ChoiceContent.find({ choice_id: { $in: choiceIds } });

    const contentMap = {};
    contents.forEach(content => {
      contentMap[content.choice_id] = content.text;
    });

    // Combiner les données
    const choicesWithText = choices.map(choice => ({
      ...choice,
      text: contentMap[choice.id] || ''
    }));

    res.json({ choices: choicesWithText });
  } catch (error) {
    console.error('Get choices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Modifier un choix
router.put('/:id', [
  body('target_page_id').optional().isInt(),
  body('text').optional().trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const choiceId = parseInt(req.params.id);

    // Vérifier que le choix existe et appartient à l'utilisateur
    const [choices] = await mysqlPool.execute(
      `SELECT c.*, s.author_id 
       FROM choices c 
       JOIN pages p ON c.page_id = p.id 
       JOIN stories s ON p.story_id = s.id 
       WHERE c.id = ?`,
      [choiceId]
    );

    if (choices.length === 0) {
      return res.status(404).json({ error: 'Choice not found' });
    }

    if (choices[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mettre à jour MySQL si nécessaire
    if (req.body.target_page_id !== undefined) {
      await mysqlPool.execute(
        'UPDATE choices SET target_page_id = ? WHERE id = ?',
        [req.body.target_page_id, choiceId]
      );
    }

    // Mettre à jour MongoDB si nécessaire
    if (req.body.text !== undefined) {
      await ChoiceContent.findOneAndUpdate(
        { choice_id: choiceId },
        { text: req.body.text },
        { upsert: true, new: true }
      );
    }

    // Récupérer le choix mis à jour
    const [updated] = await mysqlPool.execute('SELECT * FROM choices WHERE id = ?', [choiceId]);
    const content = await ChoiceContent.findOne({ choice_id: choiceId });

    res.json({
      message: 'Choice updated successfully',
      choice: {
        ...updated[0],
        text: content?.text || ''
      }
    });
  } catch (error) {
    console.error('Update choice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Supprimer un choix
router.delete('/:id', async (req, res) => {
  try {
    const choiceId = parseInt(req.params.id);

    // Vérifier que le choix existe et appartient à l'utilisateur
    const [choices] = await mysqlPool.execute(
      `SELECT c.*, s.author_id 
       FROM choices c 
       JOIN pages p ON c.page_id = p.id 
       JOIN stories s ON p.story_id = s.id 
       WHERE c.id = ?`,
      [choiceId]
    );

    if (choices.length === 0) {
      return res.status(404).json({ error: 'Choice not found' });
    }

    if (choices[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Supprimer le contenu MongoDB
    await ChoiceContent.deleteOne({ choice_id: choiceId });

    // Supprimer le choix
    await mysqlPool.execute('DELETE FROM choices WHERE id = ?', [choiceId]);

    res.json({ message: 'Choice deleted successfully' });
  } catch (error) {
    console.error('Delete choice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

