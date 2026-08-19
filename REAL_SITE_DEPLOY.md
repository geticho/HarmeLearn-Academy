# Deploy HarmeLearn as a Real Permanent Site

This sandbox preview URL can change.  
For a real site that does **not** die, deploy to Vercel + a free database.

---

## Option 1 — Fastest permanent free site (Vercel)

### 1) Put code on GitHub
If not done yet:

1. Create empty GitHub repo: `harmelearn-academy`
2. Run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/harmelearn-academy.git
git push -u origin main
```

### 2) Create free Postgres database
Use one of these free options:
- [Neon](https://neon.tech) (recommended)
- [Supabase](https://supabase.com)

Copy the connection string, example:

```text
postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

### 3) Deploy on Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with GitHub
3. **Add New Project** → import `harmelearn-academy`
4. Framework: **Next.js**
5. Add Environment Variables:

| Name | Value |
|---|---|
| `DATABASE_URL` | your Postgres URL |
| `ADMIN_EMAIL` | `admin@harmelearn.et` |
| `ADMIN_PASSWORD` | `Admin@12345` (change later) |
| `NEXT_PUBLIC_APP_URL` | your Vercel URL after first deploy (or custom domain) |
| `SEED_DEMO` | `true` (optional demo content) |

6. Click **Deploy**

### 4) Apply database tables
After first deploy, open Vercel project → **Deployments** → open the deployment → **Runtime Logs**, or run locally against production DB:

```bash
npx drizzle-kit push
```

Then open your Vercel URL and log in.

---

## Your permanent URL will look like:
```text
https://harmelearn-academy.vercel.app
```

Then you can connect a custom domain:
```text
https://harmelearn.et
https://www.harmelearn.et
```

---

## First login after real deploy
- Admin: `admin@harmelearn.et` / `Admin@12345`
- Student signup code: `DEMO-STUDENT`
- Teacher signup code: `DEMO-TEACHER`

---

## Option 2 — Keep using temporary preview
Current temporary preview (can die after restart):

```text
https://3000-imbcm8g93g4px98zvxodf.e2b.app
```

This is only for testing inside the sandbox.
