import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            NAHB
          </Link>
          <div className="navbar-links">
            {user ? (
              <>
                <Link to="/my-stories">Mes histoires</Link>
                <Link to="/create-story">Créer une histoire</Link>
                {user.role === 'admin' && (
                  <Link to="/admin">Admin</Link>
                )}
                <span className="navbar-user">Bonjour, {user.username}</span>
                <button onClick={handleLogout} className="btn btn-secondary">
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Connexion</Link>
                <Link to="/register">Inscription</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

