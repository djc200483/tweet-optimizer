import React, { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import Home from './Home';
import NavBar from './NavBar';
import './NavBar.css';

export default function WritingToolsPage() {
  const { user, token } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(!user || !token);

  if (!user || !token) {
    return (
      <>
        <NavBar />
        <div className="navbar-modal-overlay">
          <div className="navbar-modal">
            <div className="navbar-modal-header">
              <span className="navbar-modal-title">Login Required</span>
              <button className="navbar-modal-close" onClick={() => setShowLoginModal(false)}>&times;</button>
            </div>
            <div className="navbar-modal-body">
              <p>You must be logged in to access this area. Please log in or register to continue.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Home isLoggedIn={true} onSelectFeature={() => {}} initialTab="written" />
    </>
  );
} 