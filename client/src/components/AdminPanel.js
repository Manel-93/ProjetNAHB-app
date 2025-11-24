import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

function AdminPanel() {
  const [statistics, setStatistics] = useState(null);
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/statistics'),
        axios.get('/api/admin/users')
      ]);
      setStatistics(statsRes.data);
      setStories(statsRes.data.story_statistics);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm('Bannir cet utilisateur ?')) return;
    try {
      await axios.post(`/api/admin/ban-author/${userId}`);
      fetchData();
    } catch (error) {
      alert('Erreur lors du bannissement');
      console.error('Error banning user:', error);
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await axios.post(`/api/admin/unban-author/${userId}`);
      fetchData();
    } catch (error) {
      alert('Erreur lors du débannissement');
      console.error('Error unbanning user:', error);
    }
  };

  const handleSuspendStory = async (storyId) => {
    if (!window.confirm('Suspendre cette histoire ?')) return;
    try {
      await axios.post(`/api/admin/suspend-story/${storyId}`);
      fetchData();
    } catch (error) {
      alert('Erreur lors de la suspension');
      console.error('Error suspending story:', error);
    }
  };

  const handleUnsuspendStory = async (storyId) => {
    try {
      await axios.post(`/api/admin/unsuspend-story/${storyId}`);
      fetchData();
    } catch (error) {
      alert('Erreur lors de la réactivation');
      console.error('Error unsuspending story:', error);
    }
  };

  if (loading) {
    return <div className="container">Chargement...</div>;
  }

  return (
    <div className="container">
      <div className="admin-panel">
        <h1>Panneau d'administration</h1>

        <div className="admin-tabs">
          <button
            className={activeTab === 'stats' ? 'active' : ''}
            onClick={() => setActiveTab('stats')}
          >
            Statistiques
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Utilisateurs
          </button>
          <button
            className={activeTab === 'stories' ? 'active' : ''}
            onClick={() => setActiveTab('stories')}
          >
            Histoires
          </button>
        </div>

        {activeTab === 'stats' && statistics && (
          <div className="admin-section">
            <h2>Statistiques globales</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Utilisateurs</h3>
                <p className="stat-value">{statistics.global_statistics.total_users}</p>
              </div>
              <div className="stat-card">
                <h3>Histoires</h3>
                <p className="stat-value">{statistics.global_statistics.total_stories}</p>
              </div>
              <div className="stat-card">
                <h3>Histoires publiées</h3>
                <p className="stat-value">{statistics.global_statistics.published_stories}</p>
              </div>
              <div className="stat-card">
                <h3>Parties jouées</h3>
                <p className="stat-value">{statistics.global_statistics.total_sessions}</p>
              </div>
              <div className="stat-card">
                <h3>Pages</h3>
                <p className="stat-value">{statistics.global_statistics.total_pages}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-section">
            <h2>Gestion des utilisateurs</h2>
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom d'utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Histoires</th>
                    <th>Parties</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        {user.is_banned ? (
                          <span className="badge banned">Banni</span>
                        ) : (
                          <span className="badge active">Actif</span>
                        )}
                      </td>
                      <td>{user.story_count}</td>
                      <td>{user.session_count}</td>
                      <td>
                        {user.is_banned ? (
                          <button
                            onClick={() => handleUnbanUser(user.id)}
                            className="btn btn-success btn-sm"
                          >
                            Débannir
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(user.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Bannir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="admin-section">
            <h2>Gestion des histoires</h2>
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Titre</th>
                    <th>Auteur</th>
                    <th>Statut</th>
                    <th>Parties</th>
                    <th>Pages</th>
                    <th>Choix</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((story) => (
                    <tr key={story.id}>
                      <td>{story.id}</td>
                      <td>{story.title}</td>
                      <td>{story.author_name}</td>
                      <td>
                        <span className={`badge ${story.status}`}>
                          {story.status === 'published' ? 'Publié' : 'Brouillon'}
                        </span>
                        {story.is_suspended && (
                          <span className="badge suspended">Suspendu</span>
                        )}
                      </td>
                      <td>{story.play_count}</td>
                      <td>{story.page_count}</td>
                      <td>{story.choice_count}</td>
                      <td>
                        {story.is_suspended ? (
                          <button
                            onClick={() => handleUnsuspendStory(story.id)}
                            className="btn btn-success btn-sm"
                          >
                            Réactiver
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspendStory(story.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Suspendre
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;

