# 🚀 Chatbot Deployment Checklist

Complete checklist for deploying the AI chatbot to production.

---

## 📋 Pre-Deployment

### 1. Environment Setup
- [ ] All environment variables configured in `.env`
- [ ] OpenAI API key is valid and has credits
- [ ] Supabase credentials are correct
- [ ] n8n webhook URL is configured
- [ ] Database connection string is set

### 2. Database Setup
- [ ] Migration `003_create_chat_tables.sql` applied
- [ ] All tables created successfully:
  - [ ] `conversations`
  - [ ] `messages`
  - [ ] `user_sessions`
  - [ ] `conversation_analytics`
- [ ] FAQ embeddings generated (`npm run generate:embeddings`)
- [ ] Course embeddings generated (`npm run generate:course-embeddings`)
- [ ] Vector indexes created
- [ ] Row-level security policies enabled

### 3. Backend API
- [ ] Dependencies installed (`cd chatbot-server && npm install`)
- [ ] Server starts without errors (`npm run chatbot:dev`)
- [ ] Health endpoint responds (`curl http://localhost:3001/health`)
- [ ] Chat endpoint works (`curl -X POST http://localhost:3001/api/chat ...`)
- [ ] Error handling tested
- [ ] Logging configured

### 4. n8n Workflow
- [ ] Workflow imported to n8n dashboard
- [ ] Webhook configured for POST requests
- [ ] HTTP Request node URL updated
- [ ] Response formatting nodes configured
- [ ] Error handling tested
- [ ] Workflow activated (not just test mode)

### 5. Frontend Integration
- [ ] ChatbotWidget component added to layout
- [ ] User ID properly passed to widget
- [ ] Widget appears on correct pages
- [ ] Styling matches brand colors
- [ ] Mobile responsive
- [ ] Accessibility tested

### 6. Testing
- [ ] Integration test passes (`npm run test:chatbot`)
- [ ] Manual end-to-end test completed
- [ ] Multiple conversations tested
- [ ] Error scenarios tested
- [ ] Performance acceptable (< 2s response)
- [ ] Sources/citations displaying correctly

---

## 🌐 Deployment

### Option A: Render Deployment

#### Step 1: Prepare Repository
- [ ] Code committed to GitHub
- [ ] `.env` file in `.gitignore`
- [ ] `chatbot-server/` directory ready

#### Step 2: Create Render Service
- [ ] Sign up/login to Render.com
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Configure service:
  - [ ] Name: `ai-chatbot-api`
  - [ ] Region: Choose closest to users
  - [ ] Branch: `main`
  - [ ] Root Directory: `chatbot-server`
  - [ ] Runtime: `Node`
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `node enhanced-server.js`
  - [ ] Plan: Free or Starter ($7/month)

#### Step 3: Environment Variables
Add in Render dashboard:
- [ ] `OPENAI_API_KEY`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_KEY`
- [ ] `CHATBOT_PORT=3001`
- [ ] `NODE_ENV=production`

#### Step 4: Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (5-10 minutes)
- [ ] Check logs for errors
- [ ] Note the service URL (e.g., `https://ai-chatbot-api.onrender.com`)

#### Step 5: Update n8n
- [ ] Open n8n workflow
- [ ] Update HTTP Request node URL to Render URL
- [ ] Save workflow
- [ ] Test webhook

### Option B: Railway Deployment

- [ ] Install Railway CLI: `npm install -g @railway/cli`
- [ ] Login: `railway login`
- [ ] Navigate to chatbot-server: `cd chatbot-server`
- [ ] Initialize: `railway init`
- [ ] Add environment variables: `railway variables`
- [ ] Deploy: `railway up`
- [ ] Get URL: `railway domain`
- [ ] Update n8n with Railway URL

### Option C: Vercel (Next.js API Routes)

- [ ] Convert `enhanced-server.js` to API routes
- [ ] Create `app/api/chat/route.ts`
- [ ] Deploy Next.js app: `vercel --prod`
- [ ] Update n8n with Vercel URL

---

## ✅ Post-Deployment

### 1. Verification
- [ ] Health endpoint accessible: `https://your-api.com/health`
- [ ] Chat endpoint works: `curl -X POST https://your-api.com/api/chat ...`
- [ ] n8n webhook responds: `curl -X POST https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook ...`
- [ ] Frontend widget loads
- [ ] End-to-end conversation works
- [ ] Conversation history persists

### 2. Performance Testing
- [ ] Response time < 2 seconds
- [ ] Multiple concurrent users tested
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Error rate < 1%

### 3. Monitoring Setup
- [ ] Server logs accessible
- [ ] n8n execution logs monitored
- [ ] Database performance tracked
- [ ] Error alerting configured
- [ ] Uptime monitoring enabled

### 4. Security Review
- [ ] Environment variables secured
- [ ] No secrets in code
- [ ] CORS properly configured
- [ ] Input validation working
- [ ] Rate limiting considered
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

### 5. Documentation
- [ ] Production URLs documented
- [ ] Deployment process documented
- [ ] Rollback procedure defined
- [ ] Team members trained
- [ ] Support contacts listed

---

## 🔧 Configuration Updates

### Update Frontend Environment
```bash
# .env or .env.production
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
```

### Update n8n Workflow
1. Open workflow in n8n dashboard
2. Click "Call Chatbot API" node
3. Update URL to: `https://your-api.onrender.com/api/chat`
4. Save and test

### Update Database Connection
If using external database:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
```

---

## 📊 Monitoring & Maintenance

### Daily Checks
- [ ] Check error logs
- [ ] Monitor response times
- [ ] Review n8n execution logs
- [ ] Check OpenAI API usage

### Weekly Tasks
- [ ] Review conversation analytics
- [ ] Check database size
- [ ] Update course embeddings if content changed
- [ ] Review user feedback

### Monthly Tasks
- [ ] Analyze costs (OpenAI, hosting)
- [ ] Review and optimize prompts
- [ ] Update dependencies
- [ ] Backup database
- [ ] Security audit

---

## 🐛 Troubleshooting

### Deployment Fails
```bash
# Check logs
render logs --tail

# Or Railway
railway logs

# Verify build
cd chatbot-server
npm install
node enhanced-server.js
```

### n8n Can't Connect
- [ ] Verify API URL is public (not localhost)
- [ ] Check firewall settings
- [ ] Test API directly: `curl https://your-api.com/health`
- [ ] Review n8n execution logs

### Database Connection Issues
- [ ] Verify connection string
- [ ] Check Supabase project is active
- [ ] Test connection: `psql $DATABASE_URL -c "SELECT 1"`
- [ ] Review RLS policies

### High Response Times
- [ ] Check OpenAI API status
- [ ] Review database query performance
- [ ] Consider caching common responses
- [ ] Optimize vector search parameters

---

## 💰 Cost Optimization

### OpenAI Costs
- [ ] Monitor token usage
- [ ] Reduce `max_tokens` if responses too long
- [ ] Cache common questions
- [ ] Consider GPT-3.5-turbo for simpler queries

### Hosting Costs
- [ ] Use free tier for development
- [ ] Upgrade only when needed
- [ ] Monitor resource usage
- [ ] Consider serverless for low traffic

### Database Costs
- [ ] Stay within Supabase free tier limits
- [ ] Archive old conversations
- [ ] Optimize indexes
- [ ] Clean up test data

---

## 🎯 Success Metrics

### Technical Metrics
- [ ] Uptime: > 99%
- [ ] Response time: < 2s
- [ ] Error rate: < 1%
- [ ] API success rate: > 95%

### Business Metrics
- [ ] User engagement: Track conversations/day
- [ ] User satisfaction: Collect feedback
- [ ] Support ticket reduction: Measure impact
- [ ] Course completion: Track improvement

### Cost Metrics
- [ ] Cost per conversation: < $0.01
- [ ] Monthly OpenAI costs: Within budget
- [ ] Infrastructure costs: Optimized
- [ ] ROI: Positive

---

## 📞 Support Contacts

### Services
- **OpenAI Support**: https://help.openai.com
- **Supabase Support**: https://supabase.com/support
- **n8n Support**: https://community.n8n.io
- **Render Support**: https://render.com/docs

### Internal
- **Technical Lead**: [Name/Email]
- **DevOps**: [Name/Email]
- **Product Owner**: [Name/Email]

---

## 🔄 Rollback Procedure

If deployment fails:

1. **Revert n8n Workflow**
   - Open workflow
   - Change HTTP Request URL back to previous
   - Save and test

2. **Rollback Code**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Restore Database**
   ```bash
   # If migration caused issues
   psql $DATABASE_URL -f migrations/rollback.sql
   ```

4. **Notify Team**
   - Post in team chat
   - Update status page
   - Document issues

---

## ✅ Final Checklist

Before marking deployment complete:

- [ ] All tests passing
- [ ] Production URL working
- [ ] n8n workflow active
- [ ] Frontend widget functional
- [ ] Monitoring enabled
- [ ] Documentation updated
- [ ] Team notified
- [ ] Backup created
- [ ] Rollback tested
- [ ] Success metrics defined

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Production URL**: _______________  
**Status**: ⬜ In Progress  ⬜ Complete  ⬜ Rolled Back

---

**Next Review**: _______________  
**Notes**: 
_______________________________________
_______________________________________
_______________________________________
