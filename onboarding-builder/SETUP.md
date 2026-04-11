# Onboarding Builder — Setup Guide

## 1. Neon Database Setup

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Click "New Project" → name it `onboarding-builder`
3. Copy the connection string (looks like `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)
4. Paste it as `DATABASE_URL` in your `.env` file

## 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: add `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID → paste as `AUTH_GOOGLE_ID` in `.env`
8. Copy the Client Secret → paste as `AUTH_GOOGLE_SECRET` in `.env`

## 3. Auth Secret

Run this in your terminal:
```bash
openssl rand -base64 32
```
Paste the output as `AUTH_SECRET` in `.env`

## 4. Grok API Key

1. Go to [console.x.ai](https://console.x.ai)
2. Create an API key
3. Paste as `GROK_API_KEY` in `.env`
4. Update `GROK_MODEL` if you want a different model

## 5. Run Database Migration

```bash
cd onboarding-builder
npx prisma migrate dev --name init
```

## 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 7. Vercel Deployment

```bash
npm i -g vercel
vercel
```

Add environment variables in Vercel dashboard:
- `DATABASE_URL` — your Neon connection string
- `AUTH_SECRET` — generated secret
- `AUTH_GOOGLE_ID` — Google OAuth client ID
- `AUTH_GOOGLE_SECRET` — Google OAuth client secret
- `GROK_API_KEY` — your xAI API key
- `GROK_BASE_URL` — `https://api.x.ai/v1`
- `GROK_MODEL` — `grok-3` (or your preferred model)

Update Google OAuth redirect URI to include your Vercel domain:
`https://your-app.vercel.app/api/auth/callback/google`
