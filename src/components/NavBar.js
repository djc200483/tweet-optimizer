import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Auth from './auth/Auth';
import logo from '../assets/logo.png';
import './NavBar.css';

export default function NavBar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const closeTimeout = useRef(null);
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

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
      navigate('/writing-tools');
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
          <button className="navbar-logo-btn" onClick={() => navigate('/')} tabIndex={0} aria-label="Go to Home">
            <img src={logo} alt="Site Logo" className="navbar-logo" />
          </button>
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
                <button className="navbar-dropdown-item" onClick={handleWrittenTools}>Writing Tools</button>
              </div>
            )}
          </div>
          <div className="navbar-auth">
            {user && token ? (
              <button className="navbar-logout-btn" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <button className="navbar-login-btn" onClick={() => setShowLoginModal(true)}>
                Login/Register
              </button>
            )}
          </div>
        </div>
      </nav>
      {showLoginModal && (
        <Auth onClose={() => setShowLoginModal(false)} />
      )}
    </>
  );
} 