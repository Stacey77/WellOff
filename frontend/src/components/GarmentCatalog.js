import React, { useState, useEffect } from 'react';
import '../styles/GarmentCatalog.css';

function GarmentCatalog({ onGarmentSelect, onViewTryOn }) {
  const [garments, setGarments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');

  useEffect(() => {
    // Mock garment data - in production, this would come from an API
    const mockGarments = [
      { id: 1, name: 'Classic White Shirt', brand: 'Brand A', category: 'tops', price: 49.99, image: '👕', color: 'white' },
      { id: 2, name: 'Blue Denim Jeans', brand: 'Brand B', category: 'bottoms', price: 79.99, image: '👖', color: 'blue' },
      { id: 3, name: 'Red Summer Dress', brand: 'Brand A', category: 'dresses', price: 89.99, image: '👗', color: 'red' },
      { id: 4, name: 'Black Leather Jacket', brand: 'Brand C', category: 'outerwear', price: 199.99, image: '🧥', color: 'black' },
      { id: 5, name: 'Striped T-Shirt', brand: 'Brand B', category: 'tops', price: 29.99, image: '👕', color: 'striped' },
      { id: 6, name: 'Floral Skirt', brand: 'Brand A', category: 'bottoms', price: 54.99, image: '👗', color: 'floral' },
      { id: 7, name: 'Evening Gown', brand: 'Brand C', category: 'dresses', price: 249.99, image: '👗', color: 'gold' },
      { id: 8, name: 'Casual Hoodie', brand: 'Brand B', category: 'outerwear', price: 69.99, image: '🧥', color: 'gray' },
    ];
    setGarments(mockGarments);
  }, []);

  const filteredGarments = garments.filter(garment => {
    const categoryMatch = selectedCategory === 'all' || garment.category === selectedCategory;
    const brandMatch = selectedBrand === 'all' || garment.brand === selectedBrand;
    return categoryMatch && brandMatch;
  });

  const handleAddToTryOn = (garment) => {
    onGarmentSelect(garment);
    alert(`${garment.name} added to try-on session!`);
  };

  return (
    <div className="garment-catalog">
      <div className="catalog-header">
        <h2>Browse Our Collection</h2>
        <button className="view-tryon-button" onClick={onViewTryOn}>
          View Virtual Try-On
        </button>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Category:</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="tops">Tops</option>
            <option value="bottoms">Bottoms</option>
            <option value="dresses">Dresses</option>
            <option value="outerwear">Outerwear</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Brand:</label>
          <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
            <option value="all">All Brands</option>
            <option value="Brand A">Brand A</option>
            <option value="Brand B">Brand B</option>
            <option value="Brand C">Brand C</option>
          </select>
        </div>
      </div>

      <div className="garments-grid">
        {filteredGarments.map(garment => (
          <div key={garment.id} className="garment-card">
            <div className="garment-image">{garment.image}</div>
            <div className="garment-info">
              <h3>{garment.name}</h3>
              <p className="brand">{garment.brand}</p>
              <p className="price">${garment.price}</p>
              <div className="garment-actions">
                <button 
                  className="try-on-button"
                  onClick={() => handleAddToTryOn(garment)}
                >
                  Add to Try-On
                </button>
                <button className="details-button">View Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GarmentCatalog;
