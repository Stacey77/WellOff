import React from 'react';
import '../styles/Lookbook.css';

function Lookbook({ savedOutfits }) {
  const handleShare = (outfitId) => {
    alert(`Share outfit ${outfitId} - would integrate with social media`);
  };

  const handleDelete = (outfitId) => {
    alert(`Delete outfit ${outfitId}`);
  };

  return (
    <div className="lookbook">
      <h2>My Lookbook</h2>
      <p className="description">Your saved outfits and virtual try-on sessions</p>

      {savedOutfits.length === 0 ? (
        <div className="empty-lookbook">
          <div className="empty-icon">📚</div>
          <h3>Your lookbook is empty</h3>
          <p>Save outfits from the Virtual Try-On or Outfit Builder to see them here</p>
        </div>
      ) : (
        <div className="outfits-grid">
          {savedOutfits.map((outfit) => (
            <div key={outfit.id} className="outfit-card">
              <div className="outfit-preview">
                <div className="outfit-items">
                  {outfit.items && outfit.items.map((item, index) => (
                    <span key={index} className="outfit-item-icon">
                      {item.image}
                    </span>
                  ))}
                </div>
              </div>
              <div className="outfit-info">
                <p className="outfit-date">
                  Saved: {new Date(outfit.savedAt || outfit.createdAt).toLocaleDateString()}
                </p>
                <p className="outfit-items-count">
                  {outfit.items?.length || 0} items
                </p>
                <div className="outfit-actions">
                  <button 
                    className="action-btn share"
                    onClick={() => handleShare(outfit.id)}
                  >
                    📱 Share
                  </button>
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDelete(outfit.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="social-section">
        <h3>Share with Community</h3>
        <p>Get feedback from other StyleFit AI users and fashion influencers</p>
        <button className="community-button">Browse Community Lookbooks</button>
      </div>
    </div>
  );
}

export default Lookbook;
