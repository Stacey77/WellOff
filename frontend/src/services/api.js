import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Body Model API
export const createBodyModel = async (bodyData) => {
  try {
    const response = await api.post('/body-model', bodyData);
    return response.data;
  } catch (error) {
    console.error('Error creating body model:', error);
    throw error;
  }
};

// Garments API
export const getGarments = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/garments?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching garments:', error);
    throw error;
  }
};

export const getGarment = async (garmentId) => {
  try {
    const response = await api.get(`/garments/${garmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching garment:', error);
    throw error;
  }
};

// Virtual Try-On API
export const processVirtualTryOn = async (tryOnData) => {
  try {
    const response = await api.post('/virtual-tryon', tryOnData);
    return response.data;
  } catch (error) {
    console.error('Error processing virtual try-on:', error);
    throw error;
  }
};

// Outfits API
export const saveOutfit = async (outfitData) => {
  try {
    const response = await api.post('/outfits', outfitData);
    return response.data;
  } catch (error) {
    console.error('Error saving outfit:', error);
    throw error;
  }
};

export const getOutfits = async (userId = 'guest') => {
  try {
    const response = await api.get(`/outfits?user_id=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching outfits:', error);
    throw error;
  }
};

// Recommendations API
export const getRecommendations = async (userData) => {
  try {
    const response = await api.post('/recommendations', userData);
    return response.data;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error checking API health:', error);
    throw error;
  }
};

export default api;
