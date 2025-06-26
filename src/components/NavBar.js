import React, { useState, useRef } from 'react';
import './NavBar.css';

export default function NavBar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const closeTimeout = useRef(null);

  const handleMouseEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => setDropdownOpen(false), 120);
  };

  return (
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
              <button className="navbar-dropdown-item">Visual Tools</button>
              <button className="navbar-dropdown-item">Written Tools</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 