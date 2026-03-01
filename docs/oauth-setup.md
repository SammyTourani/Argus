# OAuth Setup Guide — GitHub & Microsoft for Argus v2

> This guide is written assuming you've never set up OAuth before.  
> Follow each step exactly — wrong URLs will cause "redirect_uri_mismatch" errors.

---

## Before You Start

You'll need:
1. Your **Supabase Project ID** — find it at [app.supabase.com](https://app.supabase.com) → your project → Settings → General → `Reference ID` (looks like `abcdefghijklmnop`)
2. Access to your GitHub account
3. Access to your Microsoft/Azure account (can be a personal Microsoft account for testing)

**Your Supabase callback URL** (you'll paste this in both providers):
```
https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback
```
Replace `[YOUR-PROJECT-ID]` with your actual project ID. Example:
```
https://abcdefghijklmnop.supabase.co/auth/v1/callback
```

---

## Part 1: GitHub OAuth

### Step 1.1 — Go to GitHub Developer Settings

1. Open your browser and go to: https://github.com/settings/developers
2. Make sure you're logged into the right GitHub account (the one associated with Sammy's Argus project)
3. Click **"OAuth Apps"** in the left sidebar
4. Click the green **"New OAuth App"** button in the top right

### Step 1.2 — Fill in the OAuth App Form

You'll see a form with these fields:

| Field | What to Enter |
|-------|--------------|
| **Application name** | `Argus` |
| **Homepage URL** | `https://buildargus.com` |
| **Application description** | `AI web app builder` (optional) |
| **Authorization callback URL** | `https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback` |

⚠️ **The callback URL is the most important field.** If it's wrong, GitHub logins will fail with a "redirect_uri_mismatch" error.

Example filled in:
```
Application name: Argus
Homepage URL: https://buildargus.com
Authorization callback URL: https://abcdefghijklmnop.supabase.co/auth/v1/callback
```

5. Click **"Register application"**

### Step 1.3 — Get Your Client ID and Client Secret

After registering, you'll be taken to your new OAuth app's settings page.

1. **Client ID**: Copy the string next to "Client ID". It looks like: `Ov23liXXXXXXXXXXXXXX`
2. **Client Secret**: Click **"Generate a new client secret"** button
   - GitHub will show the secret **exactly once** — copy it immediately
   - It looks like: `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`

Save both values somewhere temporarily (like a notes app) — you'll paste them into Supabase next.

### Step 1.4 — Add GitHub to Supabase

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click on your Argus project
3. In the left sidebar, click **"Authentication"**
4. Click **"Providers"** (in the Authentication sub-menu)
5. Scroll down the list until you find **"GitHub"**
6. Click on "GitHub" to expand it
7. Toggle the **"GitHub enabled"** switch to ON
8. You'll see two input fields:

| Supabase Field | Value to Paste |
|----------------|----------------|
| **GitHub Client ID** | Paste the Client ID from Step 1.3 |
| **GitHub Secret** | Paste the Client Secret from Step 1.3 |

9. Click **"Save"**

### Step 1.5 — Add to Your `.env.local` (Optional — Supabase handles this)

GitHub OAuth credentials live in Supabase, not your `.env.local`. Supabase handles the OAuth dance automatically. You don't need to add anything to your env file for GitHub.

### Step 1.6 — Test GitHub Login

1. Run your dev server: `pnpm dev`
2. Go to `http://localhost:3000/sign-in`
3. You should see a "Continue with GitHub" button
4. Click it — GitHub will redirect to your callback URL

> **During development**, GitHub OAuth works even on localhost because Supabase proxies the callback.

---

## Part 2: Microsoft OAuth (Azure)

This is slightly more complex than GitHub but follow these steps exactly.

### Step 2.1 — Create an Azure App Registration

1. Go to: https://portal.azure.com
2. Sign in with your Microsoft account (personal account is fine for dev/testing)
3. In the search bar at the top, type **"App registrations"** and click the result
4. Click **"+ New registration"** button

### Step 2.2 — Fill in the App Registration Form

| Field | What to Enter |
|-------|--------------|
| **Name** | `Argus` |
| **Supported account types** | Select: **"Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts"** |
| **Redirect URI** | Select **"Web"** from the dropdown, then enter: `https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback` |

⚠️ **Account types**: Choose "Multitenant + personal" so users can log in with personal @outlook.com accounts AND work/school Microsoft accounts. This is the most permissive option and gives you the widest user base.

5. Click **"Register"**

### Step 2.3 — Collect Your App Credentials

You'll be taken to your new app's "Overview" page. Collect these three values:

**From the Overview page:**

| What You Need | Where to Find It | Example |
|--------------|------------------|---------|
| **Application (client) ID** | Shown prominently on the Overview page | `12345678-1234-1234-1234-123456789abc` |
| **Directory (tenant) ID** | Also shown on the Overview page | `98765432-4321-4321-4321-987654321abc` |

Copy both of these now.

**For the Client Secret** (you need to create one):

1. In the left sidebar of your app page, click **"Certificates & secrets"**
2. Click **"+ New client secret"**
3. Fill in:
   - **Description**: `Argus Supabase Auth`
   - **Expires**: `24 months` (longest option — you'll need to rotate this before it expires)
4. Click **"Add"**
5. **Copy the "Value" immediately** — it looks like: `abc~defghijklmnopqrstuvwxyz1234567890_AB`
6. ⚠️ You cannot view this value again after leaving the page. If you lose it, you must create a new one.

### Step 2.4 — Add Microsoft to Supabase

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click on your Argus project
3. In the left sidebar, click **"Authentication"**
4. Click **"Providers"**
5. Scroll down to find **"Azure"** (Microsoft's provider is listed as "Azure")
6. Click on "Azure" to expand it
7. Toggle the **"Azure enabled"** switch to ON
8. Fill in the fields:

| Supabase Field | Value to Paste |
|----------------|----------------|
| **Azure (Microsoft) Client ID** | The Application (client) ID from Step 2.3 |
| **Azure (Microsoft) Secret** | The client secret Value from Step 2.3 |
| **Azure (Microsoft) Tenant URL** | `https://login.microsoftonline.com/common` |

> **Why `common` in the Tenant URL?** Because you chose "Multitenant + personal" in Step 2.2, Azure uses the special `common` endpoint that accepts any Microsoft account. If you had chosen a single tenant, you'd use `https://login.microsoftonline.com/[YOUR-TENANT-ID]`. Using `common` is correct for a public SaaS product.

9. Click **"Save"**

### Step 2.5 — Verify the Redirect URI is Registered in Azure

Back in the Azure portal, double-check that the redirect URI was saved correctly:

1. Go back to your app in Azure portal
2. Click **"Authentication"** in the left sidebar
3. Under "Platform configurations", you should see "Web" with your redirect URI:
   ```
   https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback
   ```
4. If it's not there, click **"+ Add a platform"** → **"Web"** → paste the URL → **"Configure"**
5. Make sure **both** "Access tokens" and "ID tokens" checkboxes are checked under "Implicit grant and hybrid flows"
6. Click **"Save"**

### Step 2.6 — Test Microsoft Login

1. Run your dev server: `pnpm dev`
2. Go to `http://localhost:3000/sign-in`
3. You should see a "Continue with Microsoft" button
4. Click it — Microsoft will prompt you to log in and then ask for permission to share your email with Argus
5. After approval, you'll be redirected back to your app

---

## Part 3: Add Buttons to Your Sign-In Page

Now that both providers are configured in Supabase, update your `sign-in` and `sign-up` pages to show the new buttons.

### OAuth Button Component

```typescript
// components/auth/OAuthButtons.tsx
'use client';

import { createClient } from '@/lib/supabase/client';

export function OAuthButtons() {
  const supabase = createClient();

  const signInWithGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signInWithMicrosoft = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email profile openid',
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <button onClick={signInWithGitHub} className="oauth-btn">
        <GitHubIcon /> Continue with GitHub
      </button>
      <button onClick={signInWithMicrosoft} className="oauth-btn">
        <MicrosoftIcon /> Continue with Microsoft
      </button>
    </div>
  );
}
```

### Auth Callback Route

Make sure this file exists (it handles the redirect after OAuth):

```typescript
// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/workspace';

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=oauth_failed`);
}
```

---

## Part 4: Troubleshooting

### "redirect_uri_mismatch" Error

**Cause**: The callback URL in GitHub/Azure doesn't exactly match what Supabase is sending.

**Fix**:
1. Go to GitHub → your OAuth App → check the "Authorization callback URL"
2. It must be exactly: `https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback`
3. No trailing slash. No `http://`. No `www.`

### "Application not found" or "Invalid client" from Microsoft

**Cause**: Wrong Client ID or the app was registered in the wrong tenant.

**Fix**:
1. In Azure portal, go to App registrations → find your Argus app
2. Copy the Application (client) ID again — make sure you're copying from the right app
3. Re-paste into Supabase Authentication → Providers → Azure

### GitHub Works in Dev but not Production

**Cause**: Your GitHub OAuth App only has the Supabase callback URL. That's correct — you don't need to add `localhost` separately because Supabase handles the full OAuth flow.

**What to verify**: In GitHub → your OAuth App → the "Authorization callback URL" should be the Supabase URL, not your Vercel/production URL. The Supabase URL is the permanent callback; Supabase then redirects to your app using your `redirectTo` option.

### Microsoft "Need admin approval" Error

**Cause**: Your Azure tenant has locked-down permissions.

**Fix**: If logging in with a work/school Microsoft account, the IT admin may need to approve the app. For personal Microsoft accounts (@outlook.com, @hotmail.com), this doesn't apply. You can also add yourself as an admin in the Azure app registration under "API permissions" → "Grant admin consent".

### Supabase Provider Not Showing in Dashboard

**Cause**: Sometimes the Supabase dashboard takes 30-60s to save.

**Fix**: Hard-refresh the Supabase dashboard page (`Cmd+Shift+R`) and check again.

---

## Checklist: Quick Reference

### GitHub Setup
- [ ] Went to github.com/settings/developers → OAuth Apps → New OAuth App
- [ ] Set Homepage URL to `https://buildargus.com`
- [ ] Set callback URL to `https://[project-id].supabase.co/auth/v1/callback`
- [ ] Generated + copied Client Secret (one-time reveal)
- [ ] Pasted Client ID + Secret into Supabase → Authentication → Providers → GitHub → Enabled
- [ ] Clicked Save in Supabase

### Microsoft Setup
- [ ] Went to portal.azure.com → App registrations → New registration
- [ ] Selected "Multitenant + personal Microsoft accounts"
- [ ] Set redirect URI to `https://[project-id].supabase.co/auth/v1/callback`
- [ ] Created a client secret under Certificates & secrets → copied the Value immediately
- [ ] Collected: Application (client) ID from Overview page
- [ ] In Supabase: Authentication → Providers → Azure → Enabled
- [ ] Pasted Client ID, Secret, and set Tenant URL to `https://login.microsoftonline.com/common`
- [ ] Clicked Save in Supabase
- [ ] Verified in Azure → Authentication that redirect URI is listed

### Code Setup
- [ ] `OAuthButtons.tsx` component created with `signInWithGitHub` and `signInWithMicrosoft` functions
- [ ] `app/auth/callback/route.ts` exists and handles code exchange
- [ ] OAuth buttons added to sign-in and sign-up pages

---

*Guide written for Argus v2 · February 2026*
