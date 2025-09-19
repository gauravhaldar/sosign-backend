# SoSign Backend - Production Deployment Guide

## Overview

This is the backend API for SoSign, a petition platform built with Node.js, Express, and MongoDB.

## Features

- User authentication and management
- Petition creation, management, and signing
- File upload with Cloudinary integration
- RESTful API endpoints
- Production-ready security and performance optimizations

## Prerequisites

- Node.js (v16 or higher)
- MongoDB database (local or MongoDB Atlas)
- Cloudinary account for image uploads

## Environment Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd sosign-backend
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Required Environment Variables:**

- `PORT`: Server port (default: 8000)
- `NODE_ENV`: Environment (development/production)
- `MONGODB_URL`: MongoDB connection string
- `JWT_SECRET`: Secure random string for JWT signing
- `CLOUDINARY_URL`: Cloudinary URL for image uploads
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
- `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend URLs

### 3. Database Setup

Ensure your MongoDB database is accessible and the connection string is correct in your `.env` file.

## Development

### Start Development Server

```bash
npm run dev
```

This runs the server with nodemon for automatic restarts on file changes.

### Available Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm run build`: No-op for Node.js (included for CI/CD compatibility)
- `npm test`: Run tests (to be implemented)

## Production Deployment

### 1. Platform-Specific Deployment

#### Heroku

1. Create a new Heroku app:

   ```bash
   heroku create your-app-name
   ```

2. Set environment variables:

   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URL=your_mongodb_url
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set CLOUDINARY_URL=your_cloudinary_url
   heroku config:set ALLOWED_ORIGINS=https://your-frontend-domain.com
   ```

3. Deploy:
   ```bash
   git push heroku main
   ```

#### Railway

1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

#### DigitalOcean App Platform

1. Create new app from GitHub repository
2. Configure environment variables
3. Set build and run commands:
   - Build: `npm install`
   - Run: `npm start`

#### VPS/Custom Server

1. Clone repository on server
2. Install dependencies: `npm install`
3. Set up environment variables
4. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start index.js --name "sosign-backend"
   pm2 startup
   pm2 save
   ```

### 2. Environment Configuration

**Production Environment Variables:**

```env
NODE_ENV=production
PORT=8000
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/sosign
JWT_SECRET=your_super_secure_jwt_secret_here
CLOUDINARY_URL=cloudinary://key:secret@cloudname
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3. Security Considerations

- Use strong, unique JWT secret
- Enable MongoDB authentication
- Use HTTPS in production
- Configure CORS for your specific domains
- Regularly update dependencies
- Monitor for security vulnerabilities

## API Endpoints

### Health Check

- `GET /health` - Server health status

### Authentication

- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `GET /api/users/profile` - Get user profile

### Petitions

- `GET /api/petitions` - Get all petitions
- `POST /api/petitions` - Create new petition
- `GET /api/petitions/:id` - Get petition by ID
- `PUT /api/petitions/:id` - Update petition
- `DELETE /api/petitions/:id` - Delete petition
- `POST /api/petitions/:id/sign` - Sign a petition

### Successful Petitions

- `GET /api/successful-petitions` - Get successful petitions
- `POST /api/successful-petitions` - Create successful petition
- `GET /api/successful-petitions/:id` - Get successful petition by ID

## Monitoring and Maintenance

### Health Checks

The `/health` endpoint provides server status information including:

- Server uptime
- Environment
- Timestamp

### Logging

- Development: Detailed logging with morgan 'dev' format
- Production: Standard combined log format

### Performance Features

- Helmet.js for security headers
- Compression middleware for response compression
- Rate limiting to prevent abuse
- CORS configuration for cross-origin requests

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**

   - Verify MONGODB_URL is correct
   - Check network connectivity
   - Ensure MongoDB Atlas IP whitelist includes your server

2. **CORS Errors**

   - Verify ALLOWED_ORIGINS includes your frontend domain
   - Check protocol (http vs https)

3. **File Upload Issues**

   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper middleware configuration

4. **Authentication Errors**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure secure cookie settings in production

### Logs and Debugging

- Check application logs for error details
- Use health endpoint to verify server status
- Monitor database connections
- Review rate limiting logs for suspicious activity

## License

This project is licensed under the ISC License.

## Support

For deployment issues or questions, please refer to the project documentation or contact the development team.
