import React, { useState, useEffect } from 'react';
import '../styles/OutfitBuilder.css';

function OutfitBuilder({ bodyModel, onSaveOutfit }) {
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({
    top: null,
    bottom: null,
    dress: null,
    outerwear: null,
    accessories: []
  });

  useEffect(() => {
    // Mock available items
    const items = [
      { id: 1, name: 'White Blouse', category: 'top', image: '👚', brand: 'Brand A' },
      { id: 2, name: 'Black Pants', category: 'bottom', image: '👖', brand: 'Brand B' },
      { id: 3, name: 'Summer Dress', category: 'dress', image: '👗', brand: 'Brand A' },
      { id: 4, name: 'Denim Jacket', category: 'outerwear', image: '🧥', brand: 'Brand C' },
      { id: 5, name: 'Blue Jeans', category: 'bottom', image: '👖', brand: 'Brand B' },
      { id: 6, name: 'Striped Shirt', category: 'top', image: '👕', brand: 'Brand A' },
    ];
    setAvailableItems(items);
  }, []);

  const handleItemSelect = (item, category) => {
    setSelectedItems({
      ...selectedItems,
      [category]: item
    });
  };

  const handleSaveOutfit = () => {
    const outfit = {
      id: Date.now(),
      items: Object.values(selectedItems).filter(item => item !== null),
      createdAt: new Date().toISOString()
    };
    onSaveOutfit(outfit);
    alert('Outfit combination saved!');
  };

  const getItemsByCategory = (category) => {
    return availableItems.filter(item => item.category === category);
  };

  return (
    <div className="outfit-builder">
      <h2>Outfit Builder</h2>
      <p className="description">Mix and match items to create your perfect outfit</p>

      <div className="builder-container">
        <div className="items-selection">
          <div className="category-section">
            <h3>Tops</h3>
            <div className="items-grid">
              {getItemsByCategory('top').map(item => (
                <div 
                  key={item.id} 
                  className={`item-card ${selectedItems.top?.id === item.id ? 'selected' : ''}`}
                  onClick={() => handleItemSelect(item, 'top')}
                >
                  <div className="item-image">{item.image}</div>
                  <p>{item.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="category-section">
            <h3>Bottoms</h3>
            <div className="items-grid">
              {getItemsByCategory('bottom').map(item => (
                <div 
                  key={item.id} 
                  className={`item-card ${selectedItems.bottom?.id === item.id ? 'selected' : ''}`}
                  onClick={() => handleItemSelect(item, 'bottom')}
                >
                  <div className="item-image">{item.image}</div>
                  <p>{item.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="category-section">
            <h3>Dresses</h3>
            <div className="items-grid">
              {getItemsByCategory('dress').map(item => (
                <div 
                  key={item.id} 
                  className={`item-card ${selectedItems.dress?.id === item.id ? 'selected' : ''}`}
                  onClick={() => handleItemSelect(item, 'dress')}
                >
                  <div className="item-image">{item.image}</div>
                  <p>{item.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="category-section">
            <h3>Outerwear</h3>
            <div className="items-grid">
              {getItemsByCategory('outerwear').map(item => (
                <div 
                  key={item.id} 
                  className={`item-card ${selectedItems.outerwear?.id === item.id ? 'selected' : ''}`}
                  onClick={() => handleItemSelect(item, 'outerwear')}
                >
                  <div className="item-image">{item.image}</div>
                  <p>{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="outfit-preview">
          <h3>Your Outfit</h3>
          <div className="preview-box">
            {selectedItems.outerwear && (
              <div className="preview-item">{selectedItems.outerwear.image} {selectedItems.outerwear.name}</div>
            )}
            {selectedItems.top && !selectedItems.dress && (
              <div className="preview-item">{selectedItems.top.image} {selectedItems.top.name}</div>
            )}
            {selectedItems.dress && (
              <div className="preview-item">{selectedItems.dress.image} {selectedItems.dress.name}</div>
            )}
            {selectedItems.bottom && !selectedItems.dress && (
              <div className="preview-item">{selectedItems.bottom.image} {selectedItems.bottom.name}</div>
            )}
            {!selectedItems.top && !selectedItems.bottom && !selectedItems.dress && !selectedItems.outerwear && (
              <p className="empty-preview">Select items to build your outfit</p>
            )}
          </div>
          
          <button 
            className="save-outfit-button"
            onClick={handleSaveOutfit}
            disabled={!selectedItems.top && !selectedItems.dress}
          >
            Save Outfit
          </button>

          <div className="ai-tips">
            <h4>AI Styling Tips</h4>
            <p>💡 Pairing neutrals with bold colors creates visual interest</p>
            <p>💡 Layer outerwear for a sophisticated look</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OutfitBuilder;
