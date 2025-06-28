import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Auth from './auth/Auth';
import logo from '../assets/logo.png';
import './NavBar.css';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

export default function NavBar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const closeTimeout = useRef(null);
  const resourcesCloseTimeout = useRef(null);
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const isMobile = useIsMobile();

  // --- Desktop Handlers ---
  const handleMouseEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setDropdownOpen(true);
  };
  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => {
      setDropdownOpen(false);
      setResourcesDropdownOpen(false);
    }, 120);
  };
  
  const handleResourcesMouseEnter = () => {
    if (resourcesCloseTimeout.current) clearTimeout(resourcesCloseTimeout.current);
    setResourcesDropdownOpen(true);
  };
  const handleResourcesMouseLeave = () => {
    resourcesCloseTimeout.current = setTimeout(() => setResourcesDropdownOpen(false), 120);
  };
  
  const handleVisualTools = () => {
    setDropdownOpen(false);
    setResourcesDropdownOpen(false);
    setIsMobileMenuOpen(false);
    setMobileResourcesOpen(false);
    if (user && token) {
      navigate('/image-generator');
    } else {
      setShowLoginModal(true);
    }
  };
  const handleImageEnhance = () => {
    setDropdownOpen(false);
    setResourcesDropdownOpen(false);
    setIsMobileMenuOpen(false);
    setMobileResourcesOpen(false);
    if (user && token) {
      navigate('/image-enhance');
    } else {
      setShowLoginModal(true);
    }
  };
  const handleWrittenTools = () => {
    setDropdownOpen(false);
    setResourcesDropdownOpen(false);
    setIsMobileMenuOpen(false);
    setMobileResourcesOpen(false);
    if (user && token) {
      navigate('/writing-tools');
    } else {
      setShowLoginModal(true);
    }
  };
  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };
  const handleMobileLogin = () => {
    setIsMobileMenuOpen(false);
    setShowAuth(true);
  };
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  const toggleMobileResources = () => {
    setMobileResourcesOpen(!mobileResourcesOpen);
  };

  // --- Render ---
  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
          <button className="navbar-logo-btn" onClick={() => navigate('/')} tabIndex={0} aria-label="Go to Home">
            <img src={logo} alt="Site Logo" className="navbar-logo" />
          </button>
          {isMobile ? (
            // --- MOBILE NAVBAR ---
            <div className="navbar-mobile">
              <button className="burger-menu-btn" onClick={toggleMobileMenu} aria-label="Toggle menu">
                <span className={`burger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
                <span className={`burger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
                <span className={`burger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
              </button>
            </div>
          ) : (
            // --- DESKTOP NAVBAR (multi-level dropdown) ---
            <>
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
                    <div
                      className="navbar-dropdown-item navbar-dropdown-submenu"
                      onMouseEnter={handleResourcesMouseEnter}
                      onMouseLeave={handleResourcesMouseLeave}
                    >
                      <span>Resources ▸</span>
                      {resourcesDropdownOpen && (
                        <div className="navbar-subdropdown-menu">
                          <button className="navbar-dropdown-item" onClick={handleVisualTools}>Generate</button>
                          <button className="navbar-dropdown-item" onClick={handleImageEnhance}>Enhance Image</button>
                          <button className="navbar-dropdown-item" onClick={handleWrittenTools}>Enhance Posts</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="navbar-auth">
                {user && token ? (
                  <button className="navbar-logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                ) : (
                  <button className="navbar-login-btn" onClick={() => setShowAuth(true)}>
                    Login/Register
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <span className="mobile-menu-title">Menu</span>
              <button className="mobile-menu-close" onClick={() => setIsMobileMenuOpen(false)}>&times;</button>
            </div>
            <div className="mobile-menu-section">
              <div className="mobile-menu-item mobile-menu-section-title">Product</div>
              <button className="mobile-menu-item mobile-menu-submenu-toggle" onClick={toggleMobileResources}>
                Resources {mobileResourcesOpen ? '▾' : '▸'}
              </button>
              {mobileResourcesOpen && (
                <div className="mobile-submenu">
                  <button className="mobile-menu-item mobile-submenu-item" onClick={handleVisualTools}>
                    Generate
                  </button>
                  <button className="mobile-menu-item mobile-submenu-item" onClick={handleImageEnhance}>
                    Enhance Image
                  </button>
                  <button className="mobile-menu-item mobile-submenu-item" onClick={handleWrittenTools}>
                    Enhance Posts
                  </button>
                </div>
              )}
              {user && token ? (
                <button className="mobile-menu-item mobile-menu-auth" onClick={handleLogout}>
                  Logout
                </button>
              ) : (
                <button className="mobile-menu-item mobile-menu-auth" onClick={handleMobileLogin}>
                  Login/Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
      {showAuth && (
        <Auth onClose={() => setShowAuth(false)} />
      )}
    </>
  );
} 