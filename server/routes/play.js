const express = require('express');
const { mysqlPool } = require('../config/database');
const PageContent = require('../models/PageContent');
const ChoiceContent = require('../models/ChoiceContent');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Démarrer une partie
router.post('/start/:storyId', async (req, res) => {
  try {
    const storyId = parseInt(req.params.storyId);

    // Vérifier que l'histoire existe et est publiée
    const [stories] = await mysqlPool.execute(
      'SELECT * FROM stories WHERE id = ? AND status = ? AND is_suspended = FALSE',
      [storyId, 'published']
    );

    if (stories.length === 0) {
      return res.status(404).json({ error: 'Story not found or not available' });
    }

    const story = stories[0];

    if (!story.start_page_id) {
      return res.status(400).json({ error: 'Story has no start page defined' });
    }

    // Créer une session de jeu
    const [sessionResult] = await mysqlPool.execute(
      'INSERT INTO game_sessions (user_id, story_id) VALUES (?, ?)',
      [req.user.id, storyId]
    );

    const sessionId = sessionResult.insertId;

    // Récupérer la page de départ
    const [pages] = await mysqlPool.execute(
      'SELECT * FROM pages WHERE id = ?',
      [story.start_page_id]
    );

    if (pages.length === 0) {
      return res.status(404).json({ error: 'Start page not found' });
    }

    const page = pages[0];

    // Récupérer le contenu de la page depuis MongoDB
    const pageContent = await PageContent.findOne({ page_id: page.id });

    // Récupérer les choix de la page
    const [choices] = await mysqlPool.execute(
      'SELECT * FROM choices WHERE page_id = ? ORDER BY created_at ASC',
      [page.id]
    );

    const choiceIds = choices.map(c => c.id);
    const choiceContents = await ChoiceContent.find({ choice_id: { $in: choiceIds } });

    const choiceContentMap = {};
    choiceContents.forEach(content => {
      choiceContentMap[content.choice_id] = content.text;
    });

    const choicesWithText = choices.map(choice => ({
      ...choice,
      text: choiceContentMap[choice.id] || ''
    }));

    res.json({
      session_id: sessionId,
      page: {
        ...page,
        text: pageContent?.text || '',
        images: pageContent?.images || []
      },
      choices: choicesWithText,
      is_ending: page.is_ending
    });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Faire un choix et aller à la page suivante
router.post('/choose', async (req, res) => {
  try {
    const { session_id, choice_id } = req.body;

    if (!session_id || !choice_id) {
      return res.status(400).json({ error: 'Session ID and choice ID are required' });
    }

    // Vérifier que la session existe et appartient à l'utilisateur
    const [sessions] = await mysqlPool.execute(
      'SELECT * FROM game_sessions WHERE id = ? AND user_id = ?',
      [session_id, req.user.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessions[0];

    if (session.ended_at) {
      return res.status(400).json({ error: 'Session already ended' });
    }

    // Récupérer le choix
    const [choices] = await mysqlPool.execute(
      'SELECT * FROM choices WHERE id = ?',
      [choice_id]
    );

    if (choices.length === 0) {
      return res.status(404).json({ error: 'Choice not found' });
    }

    const choice = choices[0];

    // Vérifier que le choix appartient à l'histoire de la session
    const [pages] = await mysqlPool.execute(
      'SELECT story_id FROM pages WHERE id = ?',
      [choice.page_id]
    );

    if (pages.length === 0 || pages[0].story_id !== session.story_id) {
      return res.status(400).json({ error: 'Invalid choice for this story' });
    }

    // Si pas de page cible, c'est une fin
    if (!choice.target_page_id) {
      // Terminer la session
      await mysqlPool.execute(
        'UPDATE game_sessions SET ending_page_id = ?, ended_at = NOW() WHERE id = ?',
        [choice.page_id, session_id]
      );

      return res.json({
        message: 'Story ended',
        is_ending: true
      });
    }

    // Récupérer la page cible
    const [targetPages] = await mysqlPool.execute(
      'SELECT * FROM pages WHERE id = ?',
      [choice.target_page_id]
    );

    if (targetPages.length === 0) {
      return res.status(404).json({ error: 'Target page not found' });
    }

    const targetPage = targetPages[0];

    // Si c'est une page finale, terminer la session
    if (targetPage.is_ending) {
      await mysqlPool.execute(
        'UPDATE game_sessions SET ending_page_id = ?, ended_at = NOW() WHERE id = ?',
        [targetPage.id, session_id]
      );
    }

    // Récupérer le contenu de la page depuis MongoDB
    const pageContent = await PageContent.findOne({ page_id: targetPage.id });

    // Récupérer les choix de la page
    const [nextChoices] = await mysqlPool.execute(
      'SELECT * FROM choices WHERE page_id = ? ORDER BY created_at ASC',
      [targetPage.id]
    );

    const choiceIds = nextChoices.map(c => c.id);
    const choiceContents = await ChoiceContent.find({ choice_id: { $in: choiceIds } });

    const choiceContentMap = {};
    choiceContents.forEach(content => {
      choiceContentMap[content.choice_id] = content.text;
    });

    const choicesWithText = nextChoices.map(choice => ({
      ...choice,
      text: choiceContentMap[choice.id] || ''
    }));

    res.json({
      page: {
        ...targetPage,
        text: pageContent?.text || '',
        images: pageContent?.images || []
      },
      choices: choicesWithText,
      is_ending: targetPage.is_ending
    });
  } catch (error) {
    console.error('Choose error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtenir l'historique des parties de l'utilisateur
router.get('/my-sessions', async (req, res) => {
  try {
    const [sessions] = await mysqlPool.execute(
      `SELECT gs.*, s.title as story_title, s.author_id,
              u.username as author_name
       FROM game_sessions gs
       JOIN stories s ON gs.story_id = s.id
       JOIN users u ON s.author_id = u.id
       WHERE gs.user_id = ?
       ORDER BY gs.started_at DESC`,
      [req.user.id]
    );

    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

