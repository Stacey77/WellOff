# Deployment Guide for StyleFit AI

## Development Deployment

### Prerequisites
- Node.js v14+
- Python 3.8+
- npm or yarn
- pip

### Steps

1. **Clone Repository**
```bash
git clone https://github.com/Stacey77/WellOff.git
cd WellOff
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
python app.py
```

3. **Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Production Deployment

### Option 1: Traditional Server

#### Backend (Flask)

1. **Install dependencies**
```bash
pip install -r requirements.txt
pip install gunicorn
```

2. **Run with Gunicorn**
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

3. **Set up Nginx reverse proxy**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Frontend (React)

1. **Build for production**
```bash
npm run build
```

2. **Serve with Nginx**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/WellOff/frontend/build;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Option 2: Docker Deployment

#### Create Dockerfiles

**Backend Dockerfile** (`backend/Dockerfile`):
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

**Frontend Dockerfile** (`frontend/Dockerfile`):
```dockerfile
FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always
```

**Deploy with Docker Compose**:
```bash
docker-compose up -d
```

### Option 3: Cloud Platforms

#### Heroku

**Backend**:
1. Create `Procfile` in backend/:
```
web: gunicorn app:app
```

2. Deploy:
```bash
heroku create stylefit-api
git subtree push --prefix backend heroku main
```

**Frontend**:
1. Create `static.json`:
```json
{
  "root": "build/",
  "routes": {
    "/**": "index.html"
  }
}
```

2. Deploy:
```bash
heroku create stylefit-web
git subtree push --prefix frontend heroku main
```

#### AWS

**Backend (Elastic Beanstalk)**:
1. Install EB CLI
2. Initialize: `eb init`
3. Create environment: `eb create stylefit-api`
4. Deploy: `eb deploy`

**Frontend (S3 + CloudFront)**:
1. Build: `npm run build`
2. Upload to S3: `aws s3 sync build/ s3://your-bucket`
3. Configure CloudFront distribution

#### Google Cloud Platform

**Backend (Cloud Run)**:
```bash
gcloud builds submit --tag gcr.io/PROJECT-ID/stylefit-api
gcloud run deploy --image gcr.io/PROJECT-ID/stylefit-api --platform managed
```

**Frontend (Firebase Hosting)**:
```bash
npm run build
firebase deploy
```

### Option 4: Vercel (Frontend) + Railway (Backend)

**Frontend on Vercel**:
1. Import repository
2. Configure build settings
3. Deploy automatically

**Backend on Railway**:
1. Create new project
2. Connect repository
3. Deploy automatically

## Environment Variables

### Production Backend
```
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=<strong-random-key>
DATABASE_URL=<database-connection-string>
CORS_ORIGINS=https://yourdomain.com
```

### Production Frontend
```
REACT_APP_API_URL=https://api.yourdomain.com/api
```

## Post-Deployment

1. **Configure SSL/HTTPS**
   - Use Let's Encrypt with Certbot
   - Or use cloud provider SSL certificates

2. **Set up monitoring**
   - Application performance monitoring
   - Error tracking
   - Uptime monitoring

3. **Configure backups**
   - Database backups
   - Code repository backups

4. **Set up CI/CD**
   - GitHub Actions
   - GitLab CI
   - Jenkins

## Performance Optimization

1. **Enable caching**
   - Browser caching headers
   - API response caching
   - CDN for static assets

2. **Compress responses**
   - Gzip compression
   - Minify assets

3. **Database optimization**
   - Indexing
   - Query optimization
   - Connection pooling

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation enabled
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Security headers configured
- [ ] Regular security updates

## Monitoring

### Tools
- **Uptime**: UptimeRobot, Pingdom
- **Performance**: New Relic, DataDog
- **Errors**: Sentry, Rollbar
- **Analytics**: Google Analytics, Mixpanel

### Metrics to Monitor
- Response time
- Error rate
- CPU/Memory usage
- Database performance
- API endpoint usage

## Scaling

### Horizontal Scaling
- Load balancer
- Multiple application servers
- Database replication

### Vertical Scaling
- Increase server resources
- Optimize code
- Database optimization

### Caching Strategy
- Redis for session data
- CDN for static assets
- API response caching
