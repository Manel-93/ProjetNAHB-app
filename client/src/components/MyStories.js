import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './MyStories.css';

function MyStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await axios.get('/api/stories/my/stories');
      setStories(response.data.stories);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (storyId, newStatus) => {
    try {
      await axios.put(`/api/stories/${storyId}`, { status: newStatus });
      fetchStories();
    } catch (error) {
      alert('Erreur lors de la mise à jour');
      console.error('Error updating story:', error);
    }
  };

  if (loading) {
    return <div className="container">Chargement...</div>;
  }

  return (
    <div className="container">
      <div className="my-stories-header">
        <h1>Mes histoires</h1>
        <Link to="/create-story" className="btn btn-primary">
          Créer une nouvelle histoire
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="no-stories">
          <p>Vous n'avez pas encore créé d'histoire.</p>
          <Link to="/create-story" className="btn btn-primary">
            Créer votre première histoire
          </Link>
        </div>
      ) : (
        <div className="stories-list">
          {stories.map((story) => (
            <div key={story.id} className="story-item">
              <div className="story-item-content">
                <h3>{story.title}</h3>
                <p className="story-status">
                  Statut: <span className={`status-badge ${story.status}`}>
                    {story.status === 'published' ? 'Publié' : 'Brouillon'}
                  </span>
                </p>
                {story.description && (
                  <p className="story-description">{story.description}</p>
                )}
                <p className="story-stats">
                  {story.play_count || 0} parties jouées
                </p>
              </div>
              <div className="story-item-actions">
                <Link to={`/edit-story/${story.id}`} className="btn btn-secondary">
                  Modifier
                </Link>
                <Link to={`/story/${story.id}`} className="btn btn-secondary">
                  Voir
                </Link>
                <button
                  onClick={() => handleStatusChange(
                    story.id,
                    story.status === 'published' ? 'draft' : 'published'
                  )}
                  className={`btn ${story.status === 'published' ? 'btn-secondary' : 'btn-success'}`}
                >
                  {story.status === 'published' ? 'Mettre en brouillon' : 'Publier'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyStories;

