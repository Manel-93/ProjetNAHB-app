import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './StoryList.css';

function StoryList() {
  const [stories, setStories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await axios.get('/api/stories');
      setStories(response.data.stories);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchStories();
      return;
    }

    try {
      const response = await axios.get(`/api/stories/search?q=${encodeURIComponent(searchTerm)}`);
      setStories(response.data.stories);
    } catch (error) {
      console.error('Error searching stories:', error);
    }
  };

  if (loading) {
    return <div className="container">Chargement...</div>;
  }

  return (
    <div className="container">
      <h1>Histoires disponibles</h1>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Rechercher une histoire..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="btn btn-primary">
          Rechercher
        </button>
      </form>

      {stories.length === 0 ? (
        <div className="no-stories">
          <p>Aucune histoire disponible pour le moment.</p>
        </div>
      ) : (
        <div className="stories-grid">
          {stories.map((story) => (
            <div key={story.id} className="story-card">
              <h3>{story.title}</h3>
              <p className="story-author">Par {story.author_name}</p>
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
              <div className="story-stats">
                <span>{story.play_count || 0} parties jouées</span>
              </div>
              <Link to={`/story/${story.id}`} className="btn btn-primary">
                Voir les détails
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StoryList;

