# StyleFit AI - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently, the API does not require authentication. This will be added in Phase 2.

## Endpoints

### 1. Health Check

**Endpoint:** `GET /api/health`

**Description:** Check if the API is running

**Response:**
```json
{
  "status": "healthy",
  "message": "StyleFit AI API is running"
}
```

---

### 2. Create Body Model

**Endpoint:** `POST /api/body-model`

**Description:** Create a 3D body model from user measurements and photo

**Request Body:**
```json
{
  "measurements": {
    "height": 165,
    "weight": 60,
    "gender": "female"
  },
  "imageUrl": "base64_encoded_image_or_url"
}
```

**Response:**
```json
{
  "success": true,
  "model": {
    "id": "model_1703289600.123",
    "measurements": {
      "height": 165,
      "weight": 60,
      "gender": "female"
    },
    "created_at": "2023-12-22T12:00:00.000000",
    "status": "processed"
  },
  "message": "Body model created successfully"
}
```

---

### 3. Get Garments

**Endpoint:** `GET /api/garments`

**Description:** Get all garments with optional filtering

**Query Parameters:**
- `category` (optional): Filter by category (tops, bottoms, dresses, outerwear)
- `brand` (optional): Filter by brand name

**Example:** `GET /api/garments?category=tops&brand=Brand%20A`

**Response:**
```json
{
  "success": true,
  "garments": [
    {
      "id": 1,
      "name": "Classic White Shirt",
      "brand": "Brand A",
      "category": "tops",
      "price": 49.99,
      "image": "shirt_white.jpg",
      "color": "white",
      "sizes": ["XS", "S", "M", "L", "XL"],
      "material": "Cotton",
      "description": "A timeless white shirt perfect for any occasion"
    }
  ],
  "count": 1
}
```

---

### 4. Get Single Garment

**Endpoint:** `GET /api/garments/:id`

**Description:** Get details of a specific garment

**Example:** `GET /api/garments/1`

**Response:**
```json
{
  "success": true,
  "garment": {
    "id": 1,
    "name": "Classic White Shirt",
    "brand": "Brand A",
    "category": "tops",
    "price": 49.99,
    "image": "shirt_white.jpg",
    "color": "white",
    "sizes": ["XS", "S", "M", "L", "XL"],
    "material": "Cotton",
    "description": "A timeless white shirt perfect for any occasion"
  }
}
```

---

### 5. Virtual Try-On

**Endpoint:** `POST /api/virtual-tryon`

**Description:** Process a virtual try-on request

**Request Body:**
```json
{
  "model_id": "model_1703289600.123",
  "garment_ids": [1, 2, 3]
}
```

**Response:**
```json
{
  "success": true,
  "render_url": "/renders/model_1703289600.123_tryon.png",
  "garments_applied": [1, 2, 3],
  "timestamp": "2023-12-22T12:00:00.000000"
}
```

---

### 6. Save Outfit

**Endpoint:** `POST /api/outfits`

**Description:** Save an outfit to user's lookbook

**Request Body:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Classic White Shirt",
      "brand": "Brand A"
    },
    {
      "id": 2,
      "name": "Blue Denim Jeans",
      "brand": "Brand B"
    }
  ],
  "user_id": "guest",
  "name": "Casual Friday"
}
```

**Response:**
```json
{
  "success": true,
  "outfit": {
    "id": 1,
    "items": [...],
    "user_id": "guest",
    "created_at": "2023-12-22T12:00:00.000000",
    "name": "Casual Friday"
  },
  "message": "Outfit saved successfully"
}
```

---

### 7. Get Outfits

**Endpoint:** `GET /api/outfits`

**Description:** Get all saved outfits for a user

**Query Parameters:**
- `user_id` (optional): User ID (default: "guest")

**Example:** `GET /api/outfits?user_id=guest`

**Response:**
```json
{
  "success": true,
  "outfits": [
    {
      "id": 1,
      "items": [...],
      "user_id": "guest",
      "created_at": "2023-12-22T12:00:00.000000",
      "name": "Casual Friday"
    }
  ],
  "count": 1
}
```

---

### 8. Get Recommendations

**Endpoint:** `POST /api/recommendations`

**Description:** Get AI-powered style recommendations

**Request Body:**
```json
{
  "user_preferences": {
    "style": "casual",
    "colors": ["blue", "white"],
    "occasion": "work"
  },
  "body_model": "model_1703289600.123"
}
```

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "type": "accessory",
      "suggestion": "Add a belt to accentuate your waist",
      "confidence": 0.85
    },
    {
      "type": "footwear",
      "suggestion": "White sneakers would complete this look",
      "confidence": 0.78
    }
  ]
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting

Currently, there are no rate limits. This will be implemented in future versions.

## Pagination

Pagination will be added in Phase 2 for endpoints returning large datasets.
