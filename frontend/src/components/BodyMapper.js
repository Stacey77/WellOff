import React, { useState } from 'react';
import '../styles/BodyMapper.css';

function BodyMapper({ onBodyUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [measurements, setMeasurements] = useState({
    height: '',
    weight: '',
    gender: 'female'
  });

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMeasurementChange = (field, value) => {
    setMeasurements({ ...measurements, [field]: value });
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert('Please upload a photo first');
      return;
    }

    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const bodyData = {
        imageUrl: preview,
        measurements: measurements,
        modelId: `model_${Date.now()}`,
        timestamp: new Date().toISOString()
      };
      
      setIsProcessing(false);
      onBodyUpload(bodyData);
    }, 2000);
  };

  return (
    <div className="body-mapper">
      <h2>Create Your Virtual Body Model</h2>
      <p className="description">
        Upload a full-body photo and provide your measurements for the most accurate virtual try-on experience.
      </p>

      <div className="mapper-content">
        <div className="upload-section">
          <div className="upload-area">
            {preview ? (
              <div className="preview">
                <img src={preview} alt="Preview" />
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📸</div>
                <p>Upload a full-body photo</p>
                <p className="hint">For best results, stand straight with arms slightly away from body</p>
              </div>
            )}
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <label htmlFor="photo-upload" className="upload-button">
              {preview ? 'Change Photo' : 'Choose Photo'}
            </label>
          </div>
        </div>

        <div className="measurements-section">
          <h3>Your Measurements</h3>
          <div className="form-group">
            <label>Height (cm)</label>
            <input
              type="number"
              value={measurements.height}
              onChange={(e) => handleMeasurementChange('height', e.target.value)}
              placeholder="165"
            />
          </div>
          <div className="form-group">
            <label>Weight (kg)</label>
            <input
              type="number"
              value={measurements.weight}
              onChange={(e) => handleMeasurementChange('weight', e.target.value)}
              placeholder="60"
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select
              value={measurements.gender}
              onChange={(e) => handleMeasurementChange('gender', e.target.value)}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button 
            className="process-button"
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing with AI...' : 'Create 3D Model'}
          </button>

          {isProcessing && (
            <div className="processing-status">
              <div className="spinner"></div>
              <p>Analyzing your photo and creating a precise 3D body model...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BodyMapper;
