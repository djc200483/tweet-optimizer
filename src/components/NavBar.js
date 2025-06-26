import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import './NavBar.css';

export default function NavBar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const closeTimeout = useRef(null);
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const handleMouseEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => setDropdownOpen(false), 120);
  };

  const handleVisualTools = () => {
    setDropdownOpen(false);
    if (user && token) {
      navigate('/image-generator');
    } else {
      setShowLoginModal(true);
    }
  };

  const handleWrittenTools = () => {
    setDropdownOpen(false);
    if (user && token) {
      navigate('/?tab=written');
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
          <div
            className="navbar-item navbar-dropdown"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button className="navbar-link">Product ▾</button>
            {dropdownOpen && (
              <div
                className="navbar-dropdown-menu"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button className="navbar-dropdown-item" onClick={handleVisualTools}>Visual Tools</button>
                <button className="navbar-dropdown-item" onClick={handleWrittenTools}>Written Tools</button>
              </div>
            )}
          </div>
        </div>
      </nav>
      {showLoginModal && (
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
      )}
    </>
  );
} 