import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PlayStory.css';

function PlayStory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [choices, setChoices] = useState([]);
  const [isEnding, setIsEnding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    startGame();
  }, [id]);

  const startGame = async () => {
    try {
      const response = await axios.post(`/api/play/start/${id}`);
      setSessionId(response.data.session_id);
      setCurrentPage(response.data.page);
      setChoices(response.data.choices);
      setIsEnding(response.data.is_ending);
    } catch (error) {
      setError('Erreur lors du démarrage de l\'histoire');
      console.error('Error starting game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choiceId) => {
    try {
      const response = await axios.post('/api/play/choose', {
        session_id: sessionId,
        choice_id: choiceId
      });

      if (response.data.is_ending || response.data.message === 'Story ended') {
        setIsEnding(true);
        setChoices([]);
        if (response.data.message === 'Story ended') {
          setTimeout(() => {
            navigate('/');
          }, 3000);
        }
      } else {
        setCurrentPage(response.data.page);
        setChoices(response.data.choices);
        setIsEnding(response.data.is_ending);
      }
    } catch (error) {
      console.error('Error making choice:', error);
      alert('Erreur lors du choix');
    }
  };

  if (loading) {
    return <div className="container">Chargement de l'histoire...</div>;
  }

  if (error) {
    return <div className="container">{error}</div>;
  }

  if (!currentPage) {
    return <div className="container">Page non trouvée</div>;
  }

  return (
    <div className="container">
      <div className="play-story">
        {isEnding && (
          <div className="ending-banner">
            <h2>Fin de l'histoire</h2>
          </div>
        )}
        <div className="page-content">
          <div className="page-text">
            {currentPage.text.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
          {currentPage.images && currentPage.images.length > 0 && (
            <div className="page-images">
              {currentPage.images.map((img, idx) => (
                <img key={idx} src={img} alt={`Illustration ${idx + 1}`} />
              ))}
            </div>
          )}
        </div>

        {!isEnding && choices.length > 0 && (
          <div className="choices">
            <h3>Que voulez-vous faire ?</h3>
            {choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice.id)}
                className="choice-btn"
              >
                {choice.text}
              </button>
            ))}
          </div>
        )}

        {isEnding && (
          <div className="ending-message">
            <p>Vous avez atteint la fin de cette histoire !</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Retour à l'accueil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayStory;

