import React, { useState } from 'react';
import './NavBar.css';

export default function NavBar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div
          className="navbar-item navbar-dropdown"
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <button className="navbar-link">Product ▾</button>
          {dropdownOpen && (
            <div className="navbar-dropdown-menu">
              <button className="navbar-dropdown-item">Visual Tools</button>
              <button className="navbar-dropdown-item">Written Tools</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 