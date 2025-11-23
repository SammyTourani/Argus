# Argus Local Development Setup Guide

## Prerequisites

✅ **Node.js** - You have v25.2.1 installed (required: >= 16.0.0)
✅ **npm** - You have v11.6.2 installed
✅ **Dependencies** - Already installed

## Important Note About Databases

**This application does NOT require Redis or PostgreSQL.** It's a Next.js frontend application that:
- Uses external API services (Firecrawl, AI providers)
- Uses sandbox providers (E2B or Vercel) for code execution
- Stores data in browser/local state, not a database

## Step 1: Create Environment File

Create a `.env.local` file in the root directory with your API keys:

```bash
cp .env.example .env.local
```

## Step 2: Required API Keys

### 1. Firecrawl API Key (REQUIRED)
- **Purpose**: Web scraping for cloning websites
- **Get it at**: https://firecrawl.dev
- **Add to `.env.local`**: `FIRECRAWL_API_KEY=your_key_here`

### 2. Sandbox Provider (Choose ONE)

#### Option A: Vercel Sandbox (Recommended)
- **Purpose**: Code execution environment
- **Setup**:
  1. Install Vercel CLI: `npm i -g vercel`
  2. Run `vercel link` in the project directory
  3. Run `vercel env pull .env.local` to get OIDC token automatically
- **OR** use Personal Access Token:
  - Get from: https://vercel.com/account/tokens
  - Add to `.env.local`:
    ```
    SANDBOX_PROVIDER=vercel
    VERCEL_TEAM_ID=your_team_id
    VERCEL_PROJECT_ID=your_project_id
    VERCEL_TOKEN=your_token
    ```

#### Option B: E2B Sandbox
- **Purpose**: Alternative code execution environment
- **Get it at**: https://e2b.dev
- **Add to `.env.local`**:
  ```
  SANDBOX_PROVIDER=e2b
  E2B_API_KEY=your_key_here
  ```

### 3. AI Provider Keys (Need at least ONE)

Choose one or more:

- **Anthropic (Claude)**: https://console.anthropic.com
  - `ANTHROPIC_API_KEY=your_key_here`

- **OpenAI (GPT-5)**: https://platform.openai.com
  - `OPENAI_API_KEY=your_key_here`

- **Google (Gemini)**: https://aistudio.google.com/app/apikey
  - `GEMINI_API_KEY=your_key_here`

- **Groq (Fast inference)**: https://console.groq.com
  - `GROQ_API_KEY=your_key_here`

### 4. Optional: Morph Fast Apply
- **Purpose**: Faster code edits
- **Get it at**: https://morphllm.com/
- `MORPH_API_KEY=your_key_here`

## Step 3: Run the Application

```bash
npm run dev
```

The app will start at: http://localhost:3000

## Troubleshooting

### Port Already in Use
If port 3000 is taken:
```bash
PORT=3001 npm run dev
```

### Missing API Keys
- The app will show mock/demo data if API keys are missing
- Check browser console for specific error messages

### Vercel Sandbox Issues
- Make sure you've run `vercel link` and `vercel env pull`
- Or use E2B sandbox as an alternative

## Next Steps

1. Open http://localhost:3000
2. Test the web scraping feature with a URL
3. Try generating code with AI
4. Start making your changes!

