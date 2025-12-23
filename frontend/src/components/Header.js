import React from 'react';
import '../styles/Header.css';

function Header({ currentView, setCurrentView }) {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h2>StyleFit AI</h2>
        </div>
        <nav className="nav-menu">
          <button 
            className={currentView === 'home' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('home')}
          >
            Home
          </button>
          <button 
            className={currentView === 'catalog' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('catalog')}
          >
            Catalog
          </button>
          <button 
            className={currentView === 'tryon' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('tryon')}
          >
            Try-On
          </button>
          <button 
            className={currentView === 'outfit-builder' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('outfit-builder')}
          >
            Outfit Builder
          </button>
          <button 
            className={currentView === 'lookbook' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('lookbook')}
          >
            My Lookbook
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
