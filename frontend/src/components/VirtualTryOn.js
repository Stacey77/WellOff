import React, { useState, useEffect, useRef } from 'react';
import '../styles/VirtualTryOn.css';

function VirtualTryOn({ bodyModel, selectedGarments, onSaveOutfit }) {
  const [currentPose, setCurrentPose] = useState('standing');
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Simple canvas rendering simulation
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      renderVirtualModel(ctx);
    }
  }, [bodyModel, selectedGarments, currentPose, rotation]);

  const renderVirtualModel = (ctx) => {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Simple body representation
    ctx.save();
    ctx.translate(250, 300);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Head
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(0, -150, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(-40, -120, 80, 120);
    
    // Arms
    const armOffset = currentPose === 'arms-out' ? 60 : 45;
    ctx.fillRect(-100, -100, 60, 15);
    ctx.fillRect(40, -100, 60, 15);
    
    // Legs
    ctx.fillRect(-35, 0, 30, 100);
    ctx.fillRect(5, 0, 30, 100);
    
    // Render garments on body
    selectedGarments.forEach((garment, index) => {
      ctx.fillStyle = getGarmentColor(garment.color);
      if (garment.category === 'tops') {
        ctx.fillRect(-40, -110, 80, 60);
      } else if (garment.category === 'bottoms') {
        ctx.fillRect(-40, -50, 80, 50);
        ctx.fillRect(-35, 0, 30, 100);
        ctx.fillRect(5, 0, 30, 100);
      } else if (garment.category === 'dresses') {
        ctx.fillRect(-45, -110, 90, 120);
      } else if (garment.category === 'outerwear') {
        ctx.fillRect(-50, -120, 100, 130);
      }
    });
    
    ctx.restore();
    
    // Info text
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.fillText(`Pose: ${currentPose}`, 10, 30);
    ctx.fillText(`Rotation: ${rotation}°`, 10, 50);
    ctx.fillText(`Items: ${selectedGarments.length}`, 10, 70);
  };

  const getGarmentColor = (colorName) => {
    const colors = {
      'white': '#ffffff',
      'blue': '#4a90e2',
      'red': '#e74c3c',
      'black': '#2c3e50',
      'striped': '#95a5a6',
      'floral': '#ff69b4',
      'gold': '#f39c12',
      'gray': '#7f8c8d'
    };
    return colors[colorName] || '#95a5a6';
  };

  const handleSave = () => {
    const outfit = {
      id: Date.now(),
      items: selectedGarments,
      pose: currentPose,
      rotation: rotation,
      savedAt: new Date().toISOString()
    };
    onSaveOutfit(outfit);
    alert('Outfit saved to your lookbook!');
  };

  const handleShare = () => {
    alert('Share functionality - would integrate with social media APIs');
  };

  const handlePurchase = () => {
    alert('Purchase functionality - would redirect to brand e-commerce sites');
  };

  return (
    <div className="virtual-tryon">
      <h2>Virtual Try-On Studio</h2>
      
      <div className="tryon-container">
        <div className="canvas-section">
          <canvas 
            ref={canvasRef} 
            width={500} 
            height={600}
            className="render-canvas"
          />
          
          <div className="controls">
            <div className="control-group">
              <label>Pose:</label>
              <select value={currentPose} onChange={(e) => setCurrentPose(e.target.value)}>
                <option value="standing">Standing</option>
                <option value="walking">Walking</option>
                <option value="sitting">Sitting</option>
                <option value="arms-out">Arms Out</option>
              </select>
            </div>
            <div className="control-group">
              <label>Rotation: {rotation}°</label>
              <input 
                type="range" 
                min="-180" 
                max="180" 
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="sidebar">
          <div className="current-items">
            <h3>Current Outfit</h3>
            {selectedGarments.length === 0 ? (
              <p className="empty-message">No items selected. Browse the catalog to add items.</p>
            ) : (
              <ul className="items-list">
                {selectedGarments.map((garment, index) => (
                  <li key={index} className="item">
                    <span>{garment.image}</span>
                    <div>
                      <p className="item-name">{garment.name}</p>
                      <p className="item-brand">{garment.brand}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="actions">
            <button className="action-button save" onClick={handleSave}>
              💾 Save to Lookbook
            </button>
            <button className="action-button share" onClick={handleShare}>
              📱 Share
            </button>
            <button className="action-button purchase" onClick={handlePurchase}>
              🛒 Purchase All
            </button>
          </div>

          <div className="ai-suggestions">
            <h3>AI Stylist Suggestions</h3>
            <p className="suggestion">
              ✨ Try adding a belt to accentuate your waist!
            </p>
            <p className="suggestion">
              👟 White sneakers would complete this look perfectly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VirtualTryOn;
