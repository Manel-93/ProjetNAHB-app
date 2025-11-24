import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StoryEditor.css';

function StoryEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [story, setStory] = useState({
    title: '',
    description: '',
    tags: '',
    status: 'draft',
    start_page_id: null
  });
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchStory();
      fetchPages();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchStory = async () => {
    try {
      const response = await axios.get(`/api/stories/${id}`);
      setStory(response.data.story);
    } catch (error) {
      setError('Erreur lors du chargement');
      console.error('Error fetching story:', error);
    }
  };

  const fetchPages = async () => {
    try {
      const response = await axios.get(`/api/pages/story/${id}`);
      const pagesData = response.data.pages;
      
      // Récupérer les choix pour chaque page
      const pagesWithChoices = await Promise.all(
        pagesData.map(async (page) => {
          try {
            const choicesResponse = await axios.get(`/api/choices/page/${page.id}`);
            return { ...page, choices: choicesResponse.data.choices || [] };
          } catch (error) {
            return { ...page, choices: [] };
          }
        })
      );
      
      setPages(pagesWithChoices);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStorySave = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await axios.put(`/api/stories/${id}`, story);
      } else {
        const response = await axios.post('/api/stories', story);
        navigate(`/edit-story/${response.data.story.id}`);
        return;
      }
      alert('Histoire sauvegardée !');
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
      console.error('Error saving story:', error);
    }
  };

  const handleCreatePage = async () => {
    try {
      const response = await axios.post('/api/pages', {
        story_id: id,
        is_ending: false
      });
      fetchPages();
    } catch (error) {
      alert('Erreur lors de la création de la page');
      console.error('Error creating page:', error);
    }
  };

  const handlePageUpdate = async (pageId, field, value) => {
    try {
      const updateData = {};
      if (field === 'text' || field === 'images') {
        updateData[field] = value;
      } else {
        updateData.is_ending = value;
      }
      await axios.put(`/api/pages/${pageId}`, updateData);
      fetchPages();
    } catch (error) {
      console.error('Error updating page:', error);
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!window.confirm('Supprimer cette page ?')) return;
    try {
      await axios.delete(`/api/pages/${pageId}`);
      fetchPages();
    } catch (error) {
      alert('Erreur lors de la suppression');
      console.error('Error deleting page:', error);
    }
  };

  const handleCreateChoice = async (pageId) => {
    const text = prompt('Texte du choix :');
    if (!text) return;

    try {
      await axios.post('/api/choices', {
        page_id: pageId,
        text: text
      });
      fetchPages();
    } catch (error) {
      alert('Erreur lors de la création du choix');
      console.error('Error creating choice:', error);
    }
  };

  const handleChoiceUpdate = async (choiceId, targetPageId, text) => {
    try {
      await axios.put(`/api/choices/${choiceId}`, {
        target_page_id: targetPageId || null,
        text: text
      });
      fetchPages();
    } catch (error) {
      console.error('Error updating choice:', error);
    }
  };

  const handleDeleteChoice = async (choiceId) => {
    if (!window.confirm('Supprimer ce choix ?')) return;
    try {
      await axios.delete(`/api/choices/${choiceId}`);
      fetchPages();
    } catch (error) {
      alert('Erreur lors de la suppression');
      console.error('Error deleting choice:', error);
    }
  };

  if (loading) {
    return <div className="container">Chargement...</div>;
  }

  return (
    <div className="container">
      <div className="story-editor">
        <h1>{isEdit ? 'Modifier l\'histoire' : 'Créer une histoire'}</h1>

        <form onSubmit={handleStorySave} className="story-form">
          <div className="form-group">
            <label>Titre *</label>
            <input
              type="text"
              value={story.title}
              onChange={(e) => setStory({ ...story, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={story.description}
              onChange={(e) => setStory({ ...story, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Tags (séparés par des virgules)</label>
            <input
              type="text"
              value={story.tags}
              onChange={(e) => setStory({ ...story, tags: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Statut</label>
            <select
              value={story.status}
              onChange={(e) => setStory({ ...story, status: e.target.value })}
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>
          </div>
          {isEdit && (
            <div className="form-group">
              <label>Page de départ</label>
              <select
                value={story.start_page_id || ''}
                onChange={(e) => setStory({ ...story, start_page_id: parseInt(e.target.value) || null })}
              >
                <option value="">Aucune</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    Page {page.id}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" className="btn btn-primary">
            Sauvegarder l'histoire
          </button>
        </form>

        {isEdit && (
          <div className="pages-section">
            <div className="pages-header">
              <h2>Pages</h2>
              <button onClick={handleCreatePage} className="btn btn-success">
                Créer une page
              </button>
            </div>

            {pages.map((page) => (
              <div key={page.id} className="page-editor">
                <div className="page-header">
                  <h3>Page {page.id}</h3>
                  <div className="page-controls">
                    <label>
                      <input
                        type="checkbox"
                        checked={page.is_ending}
                        onChange={(e) => handlePageUpdate(page.id, 'is_ending', e.target.checked)}
                      />
                      Page finale
                    </label>
                    <button
                      onClick={() => handleDeletePage(page.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Texte de la page</label>
                  <textarea
                    value={page.text}
                    onChange={(e) => handlePageUpdate(page.id, 'text', e.target.value)}
                    rows={5}
                  />
                </div>

                <div className="choices-section">
                  <h4>Choix</h4>
                  {page.choices && page.choices.length > 0 ? (
                    page.choices.map((choice) => (
                      <div key={choice.id} className="choice-item">
                        <input
                          type="text"
                          value={choice.text}
                          onChange={(e) => handleChoiceUpdate(choice.id, choice.target_page_id, e.target.value)}
                          placeholder="Texte du choix"
                        />
                        <select
                          value={choice.target_page_id || ''}
                          onChange={(e) => handleChoiceUpdate(choice.id, parseInt(e.target.value) || null, choice.text)}
                        >
                          <option value="">Fin</option>
                          {pages.filter(p => p.id !== page.id).map((p) => (
                            <option key={p.id} value={p.id}>
                              Page {p.id}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDeleteChoice(choice.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="no-choices">Aucun choix</p>
                  )}
                  <button
                    onClick={() => handleCreateChoice(page.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    Ajouter un choix
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StoryEditor;

