import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './StoryDetail.css';

function StoryDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStory();
  }, [id]);

  const fetchStory = async () => {
    try {
      const response = await axios.get(`/api/stories/${id}`);
      setStory(response.data.story);
    } catch (error) {
      setError('Histoire non trouvée');
      console.error('Error fetching story:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette histoire ?')) {
      return;
    }

    try {
      await axios.delete(`/api/stories/${id}`);
      navigate('/my-stories');
    } catch (error) {
      alert('Erreur lors de la suppression');
      console.error('Error deleting story:', error);
    }
  };

  if (loading) {
    return <div className="container">Chargement...</div>;
  }

  if (error || !story) {
    return <div className="container">{error || 'Histoire non trouvée'}</div>;
  }

  const isAuthor = user && story.author_id === user.id;

  return (
    <div className="container">
      <div className="story-detail">
        <h1>{story.title}</h1>
        <p className="story-meta">
          Par <strong>{story.author_name}</strong> • {story.play_count || 0} parties jouées
        </p>
        {story.description && (
          <p className="story-description">{story.description}</p>
        )}
        {story.tags && (
          <div className="story-tags">
            {story.tags.split(',').map((tag, idx) => (
              <span key={idx} className="tag">{tag.trim()}</span>
            ))}
          </div>
        )}

        <div className="story-actions">
          {story.status === 'published' && (
            <Link to={`/play/${id}`} className="btn btn-primary">
              Jouer cette histoire
            </Link>
          )}
          {isAuthor && (
            <>
              <Link to={`/edit-story/${id}`} className="btn btn-secondary">
                Modifier
              </Link>
              <button onClick={handleDelete} className="btn btn-danger">
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StoryDetail;

