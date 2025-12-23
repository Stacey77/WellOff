from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# In-memory storage (in production, use a database)
body_models = {}
garments = []
outfits = []

# Initialize mock garment data
def initialize_garments():
    global garments
    garments = [
        {
            'id': 1,
            'name': 'Classic White Shirt',
            'brand': 'Brand A',
            'category': 'tops',
            'price': 49.99,
            'image': 'shirt_white.jpg',
            'color': 'white',
            'sizes': ['XS', 'S', 'M', 'L', 'XL'],
            'material': 'Cotton',
            'description': 'A timeless white shirt perfect for any occasion'
        },
        {
            'id': 2,
            'name': 'Blue Denim Jeans',
            'brand': 'Brand B',
            'category': 'bottoms',
            'price': 79.99,
            'image': 'jeans_blue.jpg',
            'color': 'blue',
            'sizes': ['XS', 'S', 'M', 'L', 'XL'],
            'material': 'Denim',
            'description': 'Classic blue jeans with a comfortable fit'
        },
        {
            'id': 3,
            'name': 'Red Summer Dress',
            'brand': 'Brand A',
            'category': 'dresses',
            'price': 89.99,
            'image': 'dress_red.jpg',
            'color': 'red',
            'sizes': ['XS', 'S', 'M', 'L', 'XL'],
            'material': 'Silk blend',
            'description': 'Elegant summer dress in vibrant red'
        },
        {
            'id': 4,
            'name': 'Black Leather Jacket',
            'brand': 'Brand C',
            'category': 'outerwear',
            'price': 199.99,
            'image': 'jacket_black.jpg',
            'color': 'black',
            'sizes': ['XS', 'S', 'M', 'L', 'XL'],
            'material': 'Leather',
            'description': 'Premium leather jacket for a bold look'
        }
    ]

initialize_garments()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'StyleFit AI API is running'})

@app.route('/api/body-model', methods=['POST'])
def create_body_model():
    """Create a 3D body model from uploaded image and measurements"""
    try:
        data = request.json
        
        # In production, this would process the image with AI
        # For now, we'll create a mock model
        model_id = f"model_{datetime.now().timestamp()}"
        
        body_model = {
            'id': model_id,
            'measurements': data.get('measurements', {}),
            'created_at': datetime.now().isoformat(),
            'status': 'processed'
        }
        
        body_models[model_id] = body_model
        
        return jsonify({
            'success': True,
            'model': body_model,
            'message': 'Body model created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/garments', methods=['GET'])
def get_garments():
    """Get all garments with optional filtering"""
    category = request.args.get('category')
    brand = request.args.get('brand')
    
    filtered_garments = garments
    
    if category and category != 'all':
        filtered_garments = [g for g in filtered_garments if g['category'] == category]
    
    if brand and brand != 'all':
        filtered_garments = [g for g in filtered_garments if g['brand'] == brand]
    
    return jsonify({
        'success': True,
        'garments': filtered_garments,
        'count': len(filtered_garments)
    })

@app.route('/api/garments/<int:garment_id>', methods=['GET'])
def get_garment(garment_id):
    """Get a specific garment by ID"""
    garment = next((g for g in garments if g['id'] == garment_id), None)
    
    if garment:
        return jsonify({'success': True, 'garment': garment})
    else:
        return jsonify({'success': False, 'error': 'Garment not found'}), 404

@app.route('/api/virtual-tryon', methods=['POST'])
def virtual_tryon():
    """Process virtual try-on request"""
    try:
        data = request.json
        model_id = data.get('model_id')
        garment_ids = data.get('garment_ids', [])
        
        # In production, this would use AI to render the try-on
        # For now, return a mock response
        
        result = {
            'success': True,
            'render_url': f'/renders/{model_id}_tryon.png',
            'garments_applied': garment_ids,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/outfits', methods=['POST'])
def save_outfit():
    """Save an outfit to user's lookbook"""
    try:
        data = request.json
        
        outfit = {
            'id': len(outfits) + 1,
            'items': data.get('items', []),
            'user_id': data.get('user_id', 'guest'),
            'created_at': datetime.now().isoformat(),
            'name': data.get('name', f'Outfit {len(outfits) + 1}')
        }
        
        outfits.append(outfit)
        
        return jsonify({
            'success': True,
            'outfit': outfit,
            'message': 'Outfit saved successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/outfits', methods=['GET'])
def get_outfits():
    """Get all saved outfits for a user"""
    user_id = request.args.get('user_id', 'guest')
    
    user_outfits = [o for o in outfits if o['user_id'] == user_id]
    
    return jsonify({
        'success': True,
        'outfits': user_outfits,
        'count': len(user_outfits)
    })

@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    """Get AI-powered style recommendations"""
    try:
        data = request.json
        
        # In production, this would use ML models for recommendations
        # For now, return mock recommendations
        
        recommendations = [
            {
                'type': 'accessory',
                'suggestion': 'Add a belt to accentuate your waist',
                'confidence': 0.85
            },
            {
                'type': 'footwear',
                'suggestion': 'White sneakers would complete this look',
                'confidence': 0.78
            },
            {
                'type': 'style_tip',
                'suggestion': 'Try layering for a more sophisticated look',
                'confidence': 0.72
            }
        ]
        
        return jsonify({
            'success': True,
            'recommendations': recommendations
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
