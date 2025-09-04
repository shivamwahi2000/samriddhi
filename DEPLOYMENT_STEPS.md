# Samriddhi Deployment Guide

## Backend Deployment (Railway)

1. **Go to [Railway.app](https://railway.app) and sign up**

2. **Create New Project**
   - Click "New Project" 
   - Select "Deploy from GitHub repo" or "Empty Project"

3. **Upload Backend Code**
   - Upload the `deploy/backend/` folder contents
   - Railway will auto-detect Node.js

4. **Add Environment Variables in Railway**
   ```
   NODE_ENV=production
   JWT_SECRET=samriddhi-secure-jwt-secret-2025
   JWT_REFRESH_SECRET=samriddhi-refresh-secret-2025
   FRONTEND_URL=https://your-app.netlify.app
   GREEN_API_ID=7105311986
   GREEN_API_TOKEN=7b0dcbac18c84b2a85b0d14525449669c15ccf3c1e064213bf
   ```
   - Railway will auto-add `DATABASE_URL` for PostgreSQL

5. **Deploy** - Railway builds and deploys automatically

6. **Get Your Backend URL** - Copy from Railway dashboard (e.g., `https://samriddhi-backend-production.up.railway.app`)

## Frontend Deployment (Netlify)

1. **Update API URL**
   - Open `deploy/frontend/rural-app.js`
   - Replace `https://your-backend-url.com/api` with your Railway URL + `/api`

2. **Go to [Netlify.com](https://netlify.com) and sign up**

3. **Deploy**
   - Drag and drop the `deploy/frontend/` folder
   - Netlify deploys instantly

4. **Get Your Frontend URL** - Copy from Netlify (e.g., `https://samriddhi-app.netlify.app`)

## Final Steps

1. **Update CORS** - Add your Netlify URL to backend CORS origins
2. **Test Login**:
   - Shivam: 7838284268, PIN: 5678
   - SHG: 9811946551, PIN: 1234

## Quick Commands

If deploying fails, you can run locally:
```bash
cd deploy/backend
npm install
npm run build
npm start
```

Your app will be live at your Netlify URL!