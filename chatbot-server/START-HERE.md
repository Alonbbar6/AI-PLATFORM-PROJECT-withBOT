# 🚀 START HERE

Welcome! This is your complete chatbot integration system.

---

## 🎯 What Is This?

A production-ready Express API server that:
- Receives questions from n8n webhooks
- Uses AI to search your FAQ database
- Returns intelligent answers with sources
- Integrates seamlessly with your AI Training Platform

---

## ⚡ Quick Start (Choose One)

### Option A: Automated Setup (Recommended)
```bash
./setup.sh
```
This script will:
- Install dependencies
- Set up environment
- Run diagnostics
- Guide you through the process

### Option B: Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
nano .env  # Add your API keys

# 3. Start server
npm start

# 4. Test
npm test
```

---

## 📚 Documentation Guide

### New to the project?
1. **[QUICKSTART.md](./QUICKSTART.md)** ← Start here! (10-minute setup)
2. **[README.md](./README.md)** ← Overview and API reference

### Setting up n8n?
3. **[N8N-WORKFLOW-GUIDE.md](./N8N-WORKFLOW-GUIDE.md)** ← Complete n8n setup

### Having issues?
4. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** ← Common problems solved

### Ready to deploy?
5. **[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)** ← Production deployment

### Want details?
6. **[IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)** ← Full technical details

---

## 🔑 What You Need

Before starting, get these:

1. **OpenAI API Key**
   - Go to: https://platform.openai.com/api-keys
   - Create a new key
   - Add credits if needed

2. **Supabase Credentials**
   - Go to your Supabase project
   - Settings → API
   - Copy URL and Service Role Key

3. **n8n Account**
   - Sign up at: https://n8n.io
   - Your webhook URL: https://aiforepic.app.n8n.cloud

---

## 🧪 Testing Your Setup

### Step 1: Test API
```bash
npm test
```
Expected: All tests pass ✅

### Step 2: Test Webhook
```bash
./test-n8n-webhook.sh
```
Expected: Successful response ✅

### Step 3: Run Diagnostics
```bash
node debug-workflow.js
```
Expected: All checks pass ✅

---

## 🎓 Understanding the System

### Simple Flow:
```
User asks question
    ↓
n8n webhook receives it
    ↓
Your API (this project) processes it
    ↓
OpenAI generates answer
    ↓
User gets response
```

### What Each File Does:

**Core Files:**
- `server.js` - Main API server
- `package.json` - Dependencies
- `.env` - Your secret keys (create from .env.example)

**Testing Files:**
- `test-api.js` - Test the API
- `test-n8n-webhook.sh` - Test n8n connection
- `debug-workflow.js` - Diagnose issues

**Documentation:**
- `QUICKSTART.md` - Fast setup guide
- `README.md` - Main documentation
- `N8N-WORKFLOW-GUIDE.md` - n8n setup
- `TROUBLESHOOTING.md` - Fix problems
- `DEPLOYMENT-GUIDE.md` - Go to production

---

## 🚦 Your Next Steps

### For Development:
1. ✅ Run `./setup.sh`
2. ✅ Start server: `npm start`
3. ✅ Start ngrok: `ngrok http 3001`
4. ✅ Configure n8n with ngrok URL
5. ✅ Test: `./test-n8n-webhook.sh`

### For Production:
1. ✅ Follow [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)
2. ✅ Deploy to cloud (Render, Railway, etc.)
3. ✅ Update n8n with production URL
4. ✅ Activate n8n workflow
5. ✅ Set up monitoring

---

## 🆘 Need Help?

### Quick Fixes:

**Server won't start?**
```bash
# Check environment variables
node debug-workflow.js
```

**n8n can't connect?**
```bash
# Use ngrok to expose local server
ngrok http 3001
```

**Getting errors?**
```bash
# Check the troubleshooting guide
open TROUBLESHOOTING.md
```

### Detailed Help:

1. Run diagnostics: `node debug-workflow.js`
2. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. Review server logs
4. Check n8n execution logs

---

## 📊 System Status Check

Run this to check if everything is working:

```bash
# Quick health check
curl http://localhost:3001/health

# Full diagnostics
node debug-workflow.js

# Test everything
npm test && ./test-n8n-webhook.sh
```

---

## 🎉 Success Indicators

You're ready when you see:

✅ Server starts without errors
✅ `npm test` passes all tests
✅ `debug-workflow.js` shows all green
✅ n8n webhook returns responses
✅ End-to-end test succeeds

---

## 💡 Pro Tips

1. **Keep three terminals open:**
   - Terminal 1: Server (`npm start`)
   - Terminal 2: ngrok (`ngrok http 3001`)
   - Terminal 3: Testing

2. **Monitor everything:**
   - Server logs (Terminal 1)
   - ngrok web UI (http://127.0.0.1:4040)
   - n8n executions tab

3. **Test after changes:**
   ```bash
   npm test
   ```

4. **Use the debug script:**
   ```bash
   node debug-workflow.js
   ```

---

## 🎯 Common Commands

```bash
# Start server
npm start

# Run tests
npm test

# Test webhook
./test-n8n-webhook.sh

# Run diagnostics
node debug-workflow.js

# Setup everything
./setup.sh

# Start ngrok
ngrok http 3001
```

---

## 📞 Support Resources

### Documentation:
- [QUICKSTART.md](./QUICKSTART.md) - Fast setup
- [README.md](./README.md) - Full reference
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Fix issues

### External Resources:
- OpenAI Docs: https://platform.openai.com/docs
- Supabase Docs: https://supabase.com/docs
- n8n Docs: https://docs.n8n.io
- Express Docs: https://expressjs.com

---

## ✅ Pre-Flight Checklist

Before you start:

- [ ] Node.js 20.x installed
- [ ] OpenAI API key ready
- [ ] Supabase credentials ready
- [ ] n8n account created
- [ ] Terminal ready
- [ ] Text editor ready

---

## 🚀 Ready to Begin?

### Fastest path:
```bash
./setup.sh
```

### Step-by-step path:
Open [QUICKSTART.md](./QUICKSTART.md)

### Need more context?
Open [README.md](./README.md)

---

**Let's build something amazing! 🎉**
