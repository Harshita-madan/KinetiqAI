# Supabase Setup Guide for KinetiqAI

This guide will walk you through setting up Supabase for the KinetiqAI authentication and database system.

## Prerequisites

- A Supabase account (sign up at https://supabase.com if you don't have one)
- Node.js and npm installed
- KinetiqAI project dependencies installed

## Step 1: Create a Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in the project details:
   - **Name**: KinetiqAI (or your preferred name)
   - **Database Password**: Choose a strong password (save it somewhere safe!)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Free tier is sufficient for development
4. Click "Create new project"
5. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get Your Project Credentials

1. Once your project is ready, go to **Settings** → **API**
2. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)
3. Keep this page open - you'll need these values in the next step

## Step 3: Configure Environment Variables

1. Create a `.env` file in the root of your KinetiqAI project:
   ```bash
   touch .env
   ```

2. Add your Supabase credentials to `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **Replace** the values with your actual credentials from Step 2.

3. Add `.env` to your `.gitignore` to keep credentials secure:
   ```bash
   echo ".env" >> .gitignore
   ```

## Step 4: Run Database Migrations

### Option A: Using Supabase SQL Editor (Recommended for beginners)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the migration file: `database/migrations/001_initial_schema.sql`
5. Copy the entire SQL content
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
8. You should see "Success. No rows returned" - this is expected!

### Option B: Using Supabase CLI (Advanced)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

## Step 5: Verify Database Setup

1. Go to **Table Editor** in your Supabase dashboard
2. You should see 7 tables:
   - ✅ `profiles`
   - ✅ `connections`
   - ✅ `exercises`
   - ✅ `patient_programs`
   - ✅ `workout_sessions`
   - ✅ `progress_snapshots`
   - ✅ `messages`

3. Click on the `exercises` table - you should see 6 pre-loaded exercises

## Step 6: Configure Authentication

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable **Email** provider (should be enabled by default)
3. Scroll down to **Email Templates** (optional but recommended):
   - Customize the confirmation email template
   - Customize the password reset email template

### Important: Configure Email Confirmations

For **development/testing**, you can disable email confirmations:
1. Go to **Authentication** → **Settings**
2. Scroll to **Email Confirmations**
3. Toggle **Enable email confirmations** to **OFF**

For **production**, keep email confirmations enabled for security.

## Step 7: Test Your Setup

1. Restart your Expo development server:
   ```bash
   npm start
   ```

2. The app should now show the Sign In screen

3. Try creating a test account:
   - Email: `test@example.com`
   - Password: `Password123!`
   - Select a role: Patient or Physiotherapist
   - Complete your profile

4. If everything works, you should be redirected to the home screen!

## Step 8: Verify Database Data

1. Go back to Supabase **Table Editor**
2. Click on the `profiles` table
3. You should see your test user's profile data
4. Verify the `role` field matches what you selected

## Troubleshooting

### "Invalid API key" Error

- Double-check your `.env` file has the correct values
- Make sure variable names start with `EXPO_PUBLIC_`
- Restart the Expo server after changing `.env`

### "Network request failed"

- Check your internet connection
- Verify the Supabase project URL is correct
- Make sure your Supabase project is not paused (free tier projects pause after inactivity)

### "Row Level Security" Errors

- This usually means the RLS policies aren't working correctly
- Go to **SQL Editor** and re-run the migration
- Check the browser console for detailed error messages

### Email Confirmation Issues

- If you can't receive confirmation emails in development, disable email confirmations (see Step 6)
- For production, configure a custom SMTP server in **Settings** → **Auth** → **SMTP Settings**

### Tables Not Showing Up

- Make sure you ran the entire migration SQL script
- Check the SQL Editor for any error messages
- Try running the migration again (it's safe to run multiple times)

## Next Steps

Now that your database is set up, you can:

1. **Test the authentication flow**:
   - Sign up as a patient
   - Sign up as a physiotherapist
   - Test profile updates

2. **Explore the database**:
   - Use the Table Editor to view data
   - Try the SQL Editor to run custom queries

3. **Enable real-time features** (Phase 2):
   - Messages will update instantly
   - Workout sessions sync in real-time

4. **Set up Row Level Security monitoring**:
   - Test that patients can't see other patients' data
   - Verify physiotherapists can only see connected patients

## Security Checklist

Before deploying to production:

- [ ] Email confirmations are enabled
- [ ] Strong password requirements are configured
- [ ] `.env` file is in `.gitignore`
- [ ] Supabase anon key is never exposed in client-side code
- [ ] Row Level Security policies are tested
- [ ] API rate limiting is configured in Supabase dashboard
- [ ] Database backups are enabled (automatic in paid plans)

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [React Native Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)

## Support

If you run into issues:
1. Check the Supabase logs in **Logs** → **Postgres Logs**
2. Review the RLS policies in **Authentication** → **Policies**
3. Join the Supabase Discord community for help
4. Check the GitHub issues for similar problems

---

**Congratulations!** 🎉 Your KinetiqAI database is now set up and ready for development!
