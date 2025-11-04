# 🚀 Deployment Guide

Complete guide for deploying your chatbot API and connecting it to n8n cloud.

---

## 📋 Deployment Options

### Option 1: Local Development with ngrok (Recommended for Testing)
- ✅ Quick setup
- ✅ No deployment needed
- ✅ Perfect for development
- ❌ Not for production
- ❌ Requires ngrok running

### Option 2: Cloud Deployment (Recommended for Production)
- ✅ Production-ready
- ✅ Always available
- ✅ Scalable
- ❌ Requires deployment setup
- ❌ May have costs

### Option 3: Docker Container
- ✅ Consistent environment
- ✅ Easy to deploy anywhere
- ✅ Portable
- ❌ Requires Docker knowledge

---

## 🔧 Option 1: Local Development with ngrok

### What is ngrok?

ngrok creates a secure tunnel from the internet to your local machine, allowing n8n cloud to reach your local API server.

### Step 1: Install ngrok

**macOS:**
```bash
brew install ngrok
```

**Linux:**
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
  echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list && \
  sudo apt update && sudo apt install ngrok
```

**Windows:**
```bash
choco install ngrok
```

### Step 2: Sign Up for ngrok

1. Go to [https://ngrok.com](https://ngrok.com)
2. Create a free account
3. Get your auth token from the dashboard

### Step 3: Configure ngrok

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 4: Start Your API Server

```bash
cd chatbot-server
npm start
```

**Expected output:**
```
🚀 CHATBOT API SERVER STARTED
📍 Local:    http://localhost:3001
```

### Step 5: Start ngrok Tunnel

**In a new terminal:**
```bash
ngrok http 3001
```

**Expected output:**
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3001
```

### Step 6: Copy Your ngrok URL

Look for the `Forwarding` line:
```
https://abc123.ngrok-free.app
```

**⚠️ Important:** This URL changes every time you restart ngrok (on free plan)

### Step 7: Update n8n Workflow

1. Open your n8n workflow
2. Find the **HTTP Request** node
3. Update the URL to:
   ```
   https://abc123.ngrok-free.app/api/chat
   ```
4. Save the workflow

### Step 8: Test the Connection

```bash
# Test ngrok URL directly
curl -X POST https://abc123.ngrok-free.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Module 1 about?",
    "userId": "test-user-123"
  }'

# Test through n8n webhook
curl -X POST https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Module 1 about?",
    "userId": "test-user-123"
  }'
```

### ngrok Web Interface

Visit `http://127.0.0.1:4040` to see:
- All HTTP requests
- Request/response details
- Replay requests
- Performance metrics

### ngrok Tips

**Keep URL Stable (Paid Plan):**
```bash
ngrok http 3001 --domain=your-custom-domain.ngrok-free.app
```

**Custom Subdomain (Paid Plan):**
```bash
ngrok http 3001 --subdomain=myapi
# URL: https://myapi.ngrok-free.app
```

**Configuration File:**
Create `~/.ngrok2/ngrok.yml`:
```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN
tunnels:
  chatbot:
    proto: http
    addr: 3001
    subdomain: myapi
```

Then start with:
```bash
ngrok start chatbot
```

---

## ☁️ Option 2: Cloud Deployment

### 2A: Deploy to Render.com (Free Tier Available)

#### Step 1: Prepare Your Code

1. Create a `Dockerfile` (see Docker section below)
2. Or use Node.js buildpack
3. Push code to GitHub

#### Step 2: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"

#### Step 3: Configure Service

```yaml
Name: ai-chatbot-api
Environment: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

#### Step 4: Add Environment Variables

In Render dashboard, add:
```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
CHATBOT_PORT=3001
```

#### Step 5: Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Get your URL: `https://your-app.onrender.com`

#### Step 6: Update n8n

Update HTTP Request node URL to:
```
https://your-app.onrender.com/api/chat
```

---

### 2B: Deploy to Railway.app

#### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

#### Step 2: Login

```bash
railway login
```

#### Step 3: Initialize Project

```bash
cd chatbot-server
railway init
```

#### Step 4: Add Environment Variables

```bash
railway variables set OPENAI_API_KEY=sk-...
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://...
railway variables set SUPABASE_SERVICE_ROLE_KEY=...
```

#### Step 5: Deploy

```bash
railway up
```

#### Step 6: Get URL

```bash
railway domain
```

---

### 2C: Deploy to Heroku

#### Step 1: Install Heroku CLI

```bash
brew install heroku/brew/heroku
```

#### Step 2: Login

```bash
heroku login
```

#### Step 3: Create App

```bash
cd chatbot-server
heroku create ai-chatbot-api
```

#### Step 4: Add Environment Variables

```bash
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set NEXT_PUBLIC_SUPABASE_URL=https://...
heroku config:set SUPABASE_SERVICE_ROLE_KEY=...
```

#### Step 5: Deploy

```bash
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

#### Step 6: Get URL

```bash
heroku open
```

---

### 2D: Deploy to Vercel (Serverless)

**Note:** Requires converting to serverless functions

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Create `api/chat.js`

```javascript
import { createServer } from '../server.js';

export default async function handler(req, res) {
  const server = createServer();
  return server(req, res);
}
```

#### Step 3: Create `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-key"
  }
}
```

#### Step 4: Deploy

```bash
vercel
```

---

## 🐳 Option 3: Docker Deployment

### Step 1: Create Dockerfile

Create `chatbot-server/Dockerfile`:

```dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
```

### Step 2: Create .dockerignore

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
*.md
.DS_Store
```

### Step 3: Build Image

```bash
cd chatbot-server
docker build -t ai-chatbot-api .
```

### Step 4: Run Container

```bash
docker run -d \
  --name chatbot-api \
  -p 3001:3001 \
  -e OPENAI_API_KEY=sk-... \
  -e NEXT_PUBLIC_SUPABASE_URL=https://... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  ai-chatbot-api
```

### Step 5: Check Logs

```bash
docker logs -f chatbot-api
```

### Step 6: Stop Container

```bash
docker stop chatbot-api
docker rm chatbot-api
```

---

## 🔄 Docker Compose (Recommended)

### Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  chatbot-api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - CHATBOT_PORT=3001
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

### Usage

```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

---

## 📊 Deployment Comparison

| Feature | ngrok | Render | Railway | Heroku | Vercel | Docker |
|---------|-------|--------|---------|--------|--------|--------|
| **Setup Time** | 5 min | 15 min | 10 min | 15 min | 20 min | 10 min |
| **Free Tier** | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| **Always On** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Custom Domain** | 💰 | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Auto Deploy** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Logs** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Best For** | Dev | Prod | Prod | Prod | Serverless | Any |

---

## 🔐 Security Checklist

Before deploying to production:

```bash
✅ Environment Variables
   [ ] Never commit .env to git
   [ ] Use platform secrets management
   [ ] Rotate keys regularly

✅ API Security
   [ ] Add rate limiting
   [ ] Implement authentication
   [ ] Use HTTPS only
   [ ] Validate all inputs

✅ CORS
   [ ] Restrict allowed origins
   [ ] Don't use * in production
   [ ] List specific domains

✅ Monitoring
   [ ] Set up error tracking
   [ ] Monitor API usage
   [ ] Track response times
   [ ] Set up alerts

✅ Backups
   [ ] Backup environment variables
   [ ] Document configuration
   [ ] Keep deployment notes
```

---

## 📈 Monitoring & Maintenance

### Health Checks

Add to your monitoring:
```bash
# Check every 5 minutes
*/5 * * * * curl -f https://your-api.com/health || alert
```

### Log Monitoring

**For Docker:**
```bash
docker logs -f --tail=100 chatbot-api
```

**For Cloud Platforms:**
- Use platform's built-in logging
- Set up log aggregation (e.g., Papertrail)
- Configure alerts for errors

### Performance Monitoring

Tools to consider:
- **New Relic** - Full APM
- **Datadog** - Infrastructure monitoring
- **Sentry** - Error tracking
- **LogRocket** - Session replay

---

## 🆘 Deployment Troubleshooting

### Issue: Build Fails

```bash
✅ Check Node version matches (20.x)
✅ Verify all dependencies in package.json
✅ Check for missing files
✅ Review build logs
```

### Issue: App Crashes on Start

```bash
✅ Check environment variables are set
✅ Verify port is correct
✅ Check for missing dependencies
✅ Review startup logs
```

### Issue: Can't Connect from n8n

```bash
✅ Verify URL is correct
✅ Check firewall rules
✅ Test with curl first
✅ Verify CORS settings
```

---

## 📝 Deployment Checklist

```bash
✅ Pre-Deployment
   [ ] All tests passing
   [ ] Environment variables documented
   [ ] Dependencies up to date
   [ ] Security review completed

✅ Deployment
   [ ] Choose deployment platform
   [ ] Configure environment
   [ ] Deploy application
   [ ] Verify health endpoint

✅ Post-Deployment
   [ ] Update n8n workflow URL
   [ ] Test end-to-end
   [ ] Set up monitoring
   [ ] Document deployment

✅ Ongoing
   [ ] Monitor logs
   [ ] Check performance
   [ ] Update dependencies
   [ ] Review security
```

---

**Last Updated:** 2024
**Version:** 1.0.0
