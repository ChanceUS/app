# Scripts Security Notice

⚠️ **IMPORTANT**: All scripts in the `scripts/` directory have been updated to use environment variables instead of hardcoded API keys.

## Required Environment Variables

To run any script in the `scripts/` directory, you need to set these environment variables:

### For scripts using anonymous key (most scripts):
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### For scripts using service role key (admin operations):
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (⚠️ **Keep this secret!**)

## How to Run Scripts

Create a `.env.local` file in the root directory (if you don't have one already) and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Then run scripts with:

```bash
node scripts/script-name.js
```

## Security Reminder

- ⚠️ **Never commit hardcoded keys to version control**
- ⚠️ **Never share your service role key publicly**
- ✅ The `.gitignore` file is configured to ignore `.env*` files
- ✅ All scripts now validate environment variables before running
