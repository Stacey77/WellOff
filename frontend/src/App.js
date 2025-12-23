import React, { useState } from 'react';
import './styles/App.css';
import Header from './components/Header';
import BodyMapper from './components/BodyMapper';
import GarmentCatalog from './components/GarmentCatalog';
import VirtualTryOn from './components/VirtualTryOn';
import OutfitBuilder from './components/OutfitBuilder';
import Lookbook from './components/Lookbook';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [userBodyModel, setUserBodyModel] = useState(null);
  const [selectedGarments, setSelectedGarments] = useState([]);
  const [savedOutfits, setSavedOutfits] = useState([]);

  const handleBodyUpload = (bodyData) => {
    setUserBodyModel(bodyData);
    setCurrentView('catalog');
  };

  const handleGarmentSelect = (garment) => {
    setSelectedGarments([...selectedGarments, garment]);
  };

  const handleSaveOutfit = (outfit) => {
    setSavedOutfits([...savedOutfits, outfit]);
  };

  return (
    <div className="App">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="main-content">
        {currentView === 'home' && (
          <div className="home-view">
            <div className="hero-section">
              <h1>StyleFit AI</h1>
              <p className="tagline">Try on clothes virtually with AI-powered precision</p>
              <button 
                className="cta-button"
                onClick={() => setCurrentView('upload')}
              >
                Start Virtual Try-On
              </button>
            </div>
            
            <div className="features-section">
              <h2>Transform Your Shopping Experience</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">📸</div>
                  <h3>AI Body Mapping</h3>
                  <p>Upload your photo for precise 3D body modeling</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">👗</div>
                  <h3>Virtual Try-On</h3>
                  <p>See how clothes fit in real-time with accurate rendering</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">✨</div>
                  <h3>AI Stylist</h3>
                  <p>Get personalized recommendations and outfit suggestions</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🛍️</div>
                  <h3>Outfit Builder</h3>
                  <p>Mix and match items from various brands</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📱</div>
                  <h3>Share & Save</h3>
                  <p>Create lookbooks and share with friends</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🔗</div>
                  <h3>Direct Purchase</h3>
                  <p>Buy directly from integrated brand partners</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'upload' && (
          <BodyMapper onBodyUpload={handleBodyUpload} />
        )}

        {currentView === 'catalog' && (
          <GarmentCatalog 
            onGarmentSelect={handleGarmentSelect}
            onViewTryOn={() => setCurrentView('tryon')}
          />
        )}

        {currentView === 'tryon' && (
          <VirtualTryOn 
            bodyModel={userBodyModel}
            selectedGarments={selectedGarments}
            onSaveOutfit={handleSaveOutfit}
          />
        )}

        {currentView === 'outfit-builder' && (
          <OutfitBuilder 
            bodyModel={userBodyModel}
            onSaveOutfit={handleSaveOutfit}
          />
        )}

        {currentView === 'lookbook' && (
          <Lookbook savedOutfits={savedOutfits} />
        )}
      </main>
    </div>
  );
}

export default App;
