# 🚀 Argus App - Complete Setup Guide for MacBook

This is a comprehensive guide to get the Argus application running on your MacBook right now.

## 📋 Prerequisites Check

✅ **Node.js**: You have v25.2.1 installed (required: >= 16.0.0)  
✅ **npm**: You have v11.6.2 installed  
✅ **Dependencies**: Already installed

You're all set with the prerequisites!

---

## 🎯 Quick Start (5 Minutes)

### Step 1: Create Environment File

```bash
cd /Users/sammytourani/Desktop/argus-app
cp .env.example .env.local
```

### Step 2: Get Your API Keys

You'll need to obtain API keys from the following services. I'll guide you through each one:

#### 🔥 **1. Firecrawl API Key (REQUIRED)**
- **Purpose**: Web scraping and website cloning
- **Get it**: 
  1. Go to https://firecrawl.dev
  2. Sign up for a free account
  3. Navigate to your dashboard/API keys section
  4. Copy your API key
- **Add to `.env.local`**: 
  ```bash
  FIRECRAWL_API_KEY=fc-your-actual-key-here
  ```

#### 🏖️ **2. Sandbox Provider (REQUIRED - Choose ONE)**

**Option A: E2B Sandbox (EASIEST - Recommended for beginners)**
- **Purpose**: Code execution environment where your generated code runs
- **Get it**:
  1. Go to https://e2b.dev
  2. Sign up for a free account
  3. Get your API key from the dashboard
- **Add to `.env.local`**:
  ```bash
  SANDBOX_PROVIDER=e2b
  E2B_API_KEY=e2b-your-actual-key-here
  ```

**Option B: Vercel Sandbox (More advanced)**
- **Purpose**: Alternative code execution environment
- **Setup Method 1 (Easiest - Using Vercel CLI)**:
  ```bash
  # Install Vercel CLI globally
  npm i -g vercel
  
  # Link your project
  vercel link
  
  # Pull environment variables (this adds VERCEL_OIDC_TOKEN automatically)
  vercel env pull .env.local
  ```
  
- **Setup Method 2 (Using Personal Access Token)**:
  1. Go to https://vercel.com/account/tokens
  2. Create a new token
  3. Get your Team ID and Project ID from your Vercel dashboard
  4. Add to `.env.local`:
     ```bash
     SANDBOX_PROVIDER=vercel
     VERCEL_TEAM_ID=team_xxxxx
     VERCEL_PROJECT_ID=prj_xxxxx
     VERCEL_TOKEN=your_token_here
     ```

#### 🤖 **3. AI Provider Keys (REQUIRED - Need at least ONE)**

The app uses AI to generate code. You need at least one of these:

**Anthropic (Claude) - Recommended**
- **Get it**: https://console.anthropic.com
- **Steps**:
  1. Sign up/login
  2. Go to API Keys section
  3. Create a new key
- **Add to `.env.local`**:
  ```bash
  ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
  ```

**OpenAI (GPT-5)**
- **Get it**: https://platform.openai.com
- **Steps**:
  1. Sign up/login
  2. Go to API Keys
  3. Create a new secret key
- **Add to `.env.local`**:
  ```bash
  OPENAI_API_KEY=sk-your-actual-key-here
  ```

**Google (Gemini)**
- **Get it**: https://aistudio.google.com/app/apikey
- **Steps**:
  1. Sign in with Google
  2. Create API key
- **Add to `.env.local`**:
  ```bash
  GEMINI_API_KEY=your-actual-key-here
  ```

**Groq (Fast & Free tier available)**
- **Get it**: https://console.groq.com
- **Steps**:
  1. Sign up for free account
  2. Go to API Keys
  3. Create a new key
- **Add to `.env.local`**:
  ```bash
  GROQ_API_KEY=gsk_your-actual-key-here
  ```

**💡 Recommendation**: Start with **Groq** (free tier) or **Anthropic** (good quality). You can add multiple providers and switch between them in the app.

### Step 3: Edit Your `.env.local` File

Open `.env.local` in your editor and replace all the placeholder values with your actual API keys:

```bash
# Open in your preferred editor
code .env.local
# or
nano .env.local
# or
vim .env.local
```

**Minimum required setup example:**
```bash
FIRECRAWL_API_KEY=fc-your-actual-key
SANDBOX_PROVIDER=e2b
E2B_API_KEY=e2b-your-actual-key
GROQ_API_KEY=gsk_your-actual-key
```

### Step 4: Start the Application

```bash
npm run dev
```

The app will start at: **http://localhost:3000**

Open your browser and navigate to that URL!

---

## 📝 Complete Environment Variables Reference

Here's what each variable does:

### Required Variables

| Variable | Purpose | Where to Get It |
|----------|---------|-----------------|
| `FIRECRAWL_API_KEY` | Web scraping | https://firecrawl.dev |
| `SANDBOX_PROVIDER` | Which sandbox to use | Set to `e2b` or `vercel` |
| `E2B_API_KEY` | E2B sandbox access | https://e2b.dev (if using E2B) |
| `VERCEL_*` | Vercel sandbox access | Vercel dashboard (if using Vercel) |
| At least one AI key | AI code generation | See AI providers above |

### Optional Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `MORPH_API_KEY` | Faster code edits | Not set |
| `AI_GATEWAY_API_KEY` | Unified AI gateway | Not set |
| `NEXT_PUBLIC_APP_URL` | App base URL | `http://localhost:3000` |
| `NPM_FLAGS` | NPM install flags | `--legacy-peer-deps` |
| `AUTO_RESTART_VITE` | Auto-restart dev server | `true` |

---

## 🔧 Troubleshooting

### Port Already in Use
If port 3000 is taken:
```bash
PORT=3001 npm run dev
```

### Missing API Keys
- The app will show mock/demo data if API keys are missing
- Check browser console (F12) for specific error messages
- Make sure your `.env.local` file is in the root directory

### Vercel Sandbox Issues
- Make sure you've run `vercel link` and `vercel env pull`
- Or switch to E2B sandbox as an alternative (easier setup)

### Dependencies Not Installed
If you need to reinstall:
```bash
npm install
```

### TypeScript Errors
If you see TypeScript errors, try:
```bash
npm run build
```

---

## 🎨 What This App Does

**Argus** is a Multi-Agent Code Review & Collaboration Platform that:

1. **Web Scraping**: Uses Firecrawl to scrape and clone websites
2. **AI Code Generation**: Uses AI models to generate code based on your prompts
3. **Live Preview**: Runs your code in a sandbox environment (E2B or Vercel)
4. **Code Editing**: Allows you to edit and refine generated code
5. **Real-time Collaboration**: Multiple features for code review and collaboration

---

## 🚦 Next Steps After Setup

1. ✅ Open http://localhost:3000
2. ✅ Test the web scraping feature with a URL
3. ✅ Try generating code with AI
4. ✅ Explore the builder and generation pages
5. ✅ Start making your changes!

---

## 📚 Additional Resources

- **Firecrawl Docs**: https://docs.firecrawl.dev
- **E2B Docs**: https://docs.e2b.dev
- **Vercel Sandbox Docs**: https://vercel.com/docs/sandbox
- **Next.js Docs**: https://nextjs.org/docs

---

## ⚠️ Important Notes

1. **Never commit `.env.local`** - It contains your API keys
2. **API Key Security**: Keep your keys secret. If exposed, regenerate them immediately
3. **Rate Limits**: Free tiers have rate limits. Check each service's documentation
4. **Costs**: Some services charge after free tier. Monitor your usage

---

## 🆘 Need Help?

- Check the browser console for errors
- Review the API route files in `app/api/` for specific error handling
- Check each service's status page if APIs are failing

---

**You're all set! Happy coding! 🎉**

