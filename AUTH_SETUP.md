# Google and Microsoft login: setup guide

The login page already has **Continue with Google** and **Continue with Microsoft** buttons. Each one switches on as soon as you enable that provider in Supabase. No code change or redeploy is needed.

You'll need the **Supabase callback URL** below in both setups:
```
https://pnagluwtfgnumtiykhzw.supabase.co/auth/v1/callback
```

---

## 0. Supabase URL settings (once, 1 min)
Supabase → **Authentication → URL Configuration**:
- **Site URL:** `https://inboundplus.vercel.app`
- **Redirect URLs:** add `https://inboundplus.vercel.app/**` (and `http://localhost:5510/**` for local testing)

---

## 1. Google login (about 10 min)
1. Open https://console.cloud.google.com and sign in with the Google account that should own the app (ideally an InboundPlus company account).
2. At the top, click the project picker → **New project** → name it `InboundPlus Client Hub` → **Create** → select it.
3. Menu → **APIs & Services → OAuth consent screen**. Newer screens call this **Google Auth Platform**; if you see it, click **Get started**.
   - **App name:** `InboundPlus Client Hub`
   - **User support email:** your email
   - **Audience:** **External**
   - **Contact email:** your email → **Create**
   - **Branding** (optional, recommended): add the logo, the home page `https://inboundplus.vercel.app` and a privacy policy link.
4. **Clients → + Create client** (older screens: **Credentials → Create credentials → OAuth client ID**):
   - **Application type:** **Web application**
   - **Name:** `InboundPlus Supabase`
   - **Authorized JavaScript origins:** `https://inboundplus.vercel.app`
   - **Authorized redirect URIs:** `https://pnagluwtfgnumtiykhzw.supabase.co/auth/v1/callback`
   - **Create**, then copy the **Client ID** and **Client secret**.
5. Supabase → **Authentication → Sign In / Providers → Google** → turn **Enable** on → paste the **Client ID** and **Client Secret** → **Save**.
6. **Publish:** in Google's **Audience** page, click **Publish app** so anyone can log in. While it's in "Testing", only the test users you list there can sign in.

---

## 2. Microsoft login (Outlook, Hotmail, Microsoft 365) (about 10 min)
1. Open https://portal.azure.com and sign in with a Microsoft account. A free account works.
2. Search for **Microsoft Entra ID** → **App registrations** → **+ New registration**:
   - **Name:** `InboundPlus Client Hub`
   - **Supported account types:** **Accounts in any organizational directory and personal Microsoft accounts** (the third option). This allows both company and personal Outlook or Hotmail accounts.
   - **Redirect URI:** platform **Web**, URL `https://pnagluwtfgnumtiykhzw.supabase.co/auth/v1/callback`
   - **Register**
3. On the app's **Overview** page, copy the **Application (client) ID**.
4. **Certificates & secrets → Client secrets → + New client secret** → description `Supabase`, expiry **24 months** → **Add** → copy the **Value** right away. It's shown only once; copy the *Value*, not the *Secret ID*.
5. **API permissions:** check that **Microsoft Graph → User.Read** is there (it's added by default). Also add **email**, **openid** and **profile**: **+ Add a permission → Microsoft Graph → Delegated → tick them → Add**.
6. Supabase → **Authentication → Sign In / Providers → Azure** → turn **Enable** on:
   - **Application (client) ID:** from step 3
   - **Secret Value:** from step 4
   - **Azure Tenant URL:** leave **empty**, so any Microsoft account can log in
   - **Save**

> The secret expires after 24 months. Put a reminder in the calendar to create a new one and update it in Supabase.

---

## 3. Test it
1. Open https://inboundplus.vercel.app/login and hard-refresh (**Ctrl + F5**). The Google and Microsoft buttons now appear at full strength; greyed-out means not enabled yet.
2. Click **Continue with Google**, choose an account, and you land in the client portal.
3. Do the same with **Continue with Microsoft**.
4. Supabase → **Authentication → Users** shows each new user, with the provider listed.

## How it works
- **New clients:** a new person who logs in with Google or Microsoft gets their **own client workspace** automatically (named after their email), the same as when someone registers with email. Change the company name in **Settings**, or link them to an existing client under **Admin → Users & access**.
- **Admins:** an admin who logs in with Google or Microsoft *using the same email address* stays admin. Supabase links the accounts by email.
- **Errors:** if someone cancels on the Google or Microsoft page, they return to the login page with a short message.
