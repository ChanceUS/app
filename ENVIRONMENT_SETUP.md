# Environment Variables Setup

## Local Development (.env.local)

Create a `.env.local` file in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://qhggmqttxbmuehugwbzi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Vercel Production

Add these environment variables in your Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://qhggmqttxbmuehugwbzi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
NEXT_PUBLIC_SITE_URL=https://chance-us-app.vercel.app
```

## Supabase Configuration

In your Supabase dashboard, set these redirect URLs:

```
Site URL: https://chance-us-app.vercel.app
Redirect URLs:
- https://chance-us-app.vercel.app/auth/callback
- http://localhost:3000/auth/callback
```

## After Setup

1. **Restart your local dev server**: `pnpm dev`
2. **Test locally**: Should redirect to `http://localhost:3000/auth/callback`
3. **Test on Vercel**: Should redirect to `https://chance-us-app.vercel.app/auth/callback`

## How It Works

- **Local development**: Uses `http://localhost:3000` for OAuth callbacks
- **Vercel production**: Uses `https://chance-us-app.vercel.app` for OAuth callbacks
- **Config file**: Centralizes URL logic in `lib/config.ts`
- **Automatic**: No code changes needed when switching environments
