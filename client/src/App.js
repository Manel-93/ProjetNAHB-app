import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import StoryList from './components/StoryList';
import StoryDetail from './components/StoryDetail';
import StoryEditor from './components/StoryEditor';
import PlayStory from './components/PlayStory';
import MyStories from './components/MyStories';
import AdminPanel from './components/AdminPanel';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <div className="container">Accès refusé. Admin requis.</div>;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/" element={<StoryList />} />
      <Route path="/story/:id" element={<StoryDetail />} />
      <Route
        path="/play/:id"
        element={
          <ProtectedRoute>
            <PlayStory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-stories"
        element={
          <ProtectedRoute>
            <MyStories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-story/:id"
        element={
          <ProtectedRoute>
            <StoryEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-story"
        element={
          <ProtectedRoute>
            <StoryEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

