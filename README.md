# StyleFit AI - Virtual Try-On Fashion Platform

![StyleFit AI](https://img.shields.io/badge/StyleFit-AI-purple)
![React](https://img.shields.io/badge/React-18.2-blue)
![Flask](https://img.shields.io/badge/Flask-2.3-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## Overview

**StyleFit AI** is an innovative virtual try-on platform that uses AI technology to revolutionize online shopping. Users can upload their photos, create 3D body models, and virtually try on clothing from various brands in real-time.

## Mission

To empower users to confidently explore and experiment with fashion virtually, reducing returns and enhancing the shopping experience through advanced AI technology.

## Features

### Core Features

1. **AI-Powered Virtual Try-On**
   - User body mapping from uploaded photos
   - 3D garment digitization
   - Real-time rendering with realistic shadows and fabric interactions
   - Multiple pose and movement simulations

2. **Personalized Styling & Recommendations**
   - AI-powered style suggestions based on preferences and body shape
   - Trend analysis integration
   - Outfit builder for mixing and matching items

3. **Social Sharing & Community**
   - Virtual lookbook for saved outfits
   - Share try-ons with friends and community
   - Influencer integration support

4. **Brand Integration & E-commerce**
   - Direct purchase links to brand websites
   - Brand showcases and collections
   - Analytics for brands (planned)

5. **Augmented Reality** (Future Enhancement)
   - AR overlay using smartphone cameras

## Technology Stack

### Frontend
- **Framework**: React 18.2
- **3D Graphics**: Three.js
- **HTTP Client**: Axios
- **Styling**: CSS3 with responsive design

### Backend
- **Framework**: Flask (Python)
- **CORS**: Flask-CORS
- **Image Processing**: Pillow
- **Numerical Computing**: NumPy

### AI/ML (Planned Integration)
- TensorFlow/PyTorch for computer vision
- 3D body mapping algorithms
- Recommendation engines
- NLP for style descriptions

## Project Structure

```
WellOff/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Header.js
│   │   │   ├── BodyMapper.js
│   │   │   ├── GarmentCatalog.js
│   │   │   ├── VirtualTryOn.js
│   │   │   ├── OutfitBuilder.js
│   │   │   └── Lookbook.js
│   │   ├── services/        # API services
│   │   │   └── api.js
│   │   ├── styles/          # CSS stylesheets
│   │   ├── App.js           # Main App component
│   │   └── index.js         # Entry point
│   └── package.json
├── backend/                  # Flask backend API
│   ├── app.py               # Main Flask application
│   └── requirements.txt     # Python dependencies
├── docs/                     # Documentation
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python 3.8 or higher
- npm or yarn

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Stacey77/WellOff.git
cd WellOff
```

#### 2. Set Up Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend API will run on `http://localhost:5000`

#### 3. Set Up Frontend

```bash
cd frontend
npm install
npm start
```

The frontend application will run on `http://localhost:3000`

## Usage

### 1. Create Your Virtual Body Model
- Navigate to the home page
- Click "Start Virtual Try-On"
- Upload a full-body photo
- Enter your measurements (height, weight, gender)
- Click "Create 3D Model"

### 2. Browse Garment Catalog
- Filter by category (tops, bottoms, dresses, outerwear)
- Filter by brand
- Click "Add to Try-On" on items you want to try

### 3. Virtual Try-On Studio
- View selected items on your virtual body model
- Change poses (standing, walking, sitting, arms out)
- Rotate the model using the slider
- Get AI stylist suggestions
- Save outfits to your lookbook
- Share with friends or purchase items

### 4. Outfit Builder
- Mix and match different items
- Create complete outfits from various brands
- Get AI styling tips
- Save your favorite combinations

### 5. My Lookbook
- View all saved outfits
- Share outfits with the community
- Browse community lookbooks

## API Endpoints

### Health Check
```
GET /api/health
```

### Body Model
```
POST /api/body-model
Body: { measurements: { height, weight, gender } }
```

### Garments
```
GET /api/garments?category=tops&brand=Brand%20A
GET /api/garments/:id
```

### Virtual Try-On
```
POST /api/virtual-tryon
Body: { model_id, garment_ids: [] }
```

### Outfits
```
POST /api/outfits
Body: { items: [], user_id, name }

GET /api/outfits?user_id=guest
```

### Recommendations
```
POST /api/recommendations
Body: { user_preferences, body_model }
```

## Development Roadmap

### Phase 1: MVP (Current)
- [x] Basic virtual try-on interface
- [x] Body mapping upload system
- [x] Garment catalog
- [x] Outfit builder
- [x] Lookbook functionality
- [x] Backend API structure

### Phase 2: AI Integration
- [ ] Implement actual AI body mapping
- [ ] 3D garment rendering with realistic physics
- [ ] Machine learning recommendation engine
- [ ] Advanced pose simulation

### Phase 3: Features Expansion
- [ ] User authentication and profiles
- [ ] Social community features
- [ ] Brand partner integration
- [ ] Payment processing
- [ ] Mobile app development

### Phase 4: Scaling
- [ ] AR overlay implementation
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Influencer collaboration tools

## Monetization Strategy

1. **Commission on Sales**: Percentage of sales through the platform
2. **Premium Features**: Advanced tools, exclusive access, ad-free
3. **Brand Subscriptions**: Enhanced analytics and placement
4. **Advertising**: Targeted fashion brand ads

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Project Link: [https://github.com/Stacey77/WellOff](https://github.com/Stacey77/WellOff)

## Acknowledgments

- React community for excellent documentation
- Flask framework for robust backend development
- Three.js for 3D graphics capabilities
- All contributors and testers

---

**Built with ❤️ for the future of online fashion shopping**