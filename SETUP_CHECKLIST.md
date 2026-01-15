# Phase 1 Setup Checklist

Use this checklist to ensure you've completed all setup steps correctly.

## Prerequisites ✅

- [ ] Node.js installed (v16 or higher)
- [ ] npm or yarn installed
- [ ] Expo CLI installed (`npm install -g expo-cli`)
- [ ] Git installed (for version control)
- [ ] A code editor (VS Code recommended)

## Dependencies Installation ✅

- [x] Supabase client installed (`@supabase/supabase-js@2.90.1`)
- [x] Zustand installed (`zustand@5.0.10`)
- [x] date-fns installed (`date-fns@4.1.0`)
- [x] All other dependencies up to date

**Verification:**
```bash
npm list @supabase/supabase-js zustand date-fns
```

## Supabase Project Setup 🔧

### Step 1: Create Project
- [ ] Signed up at https://supabase.com
- [ ] Created new project named "KinetiqAI"
- [ ] Chose a strong database password
- [ ] Selected appropriate region
- [ ] Waited for project provisioning (2-3 minutes)

### Step 2: Get Credentials
- [ ] Navigated to Settings → API
- [ ] Copied Project URL
- [ ] Copied anon public key
- [ ] Saved credentials securely

### Step 3: Configure Environment
- [ ] Created `.env` file in project root
- [ ] Added `EXPO_PUBLIC_SUPABASE_URL` with project URL
- [ ] Added `EXPO_PUBLIC_SUPABASE_ANON_KEY` with anon key
- [ ] Verified `.env` is in `.gitignore`

### Step 4: Run Database Migration
- [ ] Opened Supabase SQL Editor
- [ ] Created new query
- [ ] Copied all SQL from `database/migrations/001_initial_schema.sql`
- [ ] Ran the migration (Ctrl+Enter / Cmd+Enter)
- [ ] Saw "Success. No rows returned" message

### Step 5: Verify Database
- [ ] Opened Table Editor in Supabase
- [ ] Confirmed 7 tables exist:
  - [ ] profiles
  - [ ] connections
  - [ ] exercises
  - [ ] patient_programs
  - [ ] workout_sessions
  - [ ] progress_snapshots
  - [ ] messages
- [ ] Opened exercises table
- [ ] Confirmed 6 pre-seeded exercises

### Step 6: Configure Authentication
- [ ] Navigated to Authentication → Providers
- [ ] Verified Email provider is enabled
- [ ] (Optional) Disabled email confirmations for development:
  - [ ] Authentication → Settings
  - [ ] Toggled "Enable email confirmations" to OFF

## Application Testing 🧪

### Step 1: Start Development Server
- [ ] Ran `npm start`
- [ ] Development server started successfully
- [ ] QR code appeared (or web opened)
- [ ] No errors in terminal

### Step 2: Test Patient Sign Up
- [ ] Opened app (Expo Go or simulator)
- [ ] Saw SignInScreen
- [ ] Tapped "Don't have an account? Sign up"
- [ ] Entered email: `patient@test.com`
- [ ] Entered password: `Test123!`
- [ ] Tapped "Create Account"
- [ ] Saw RoleSelectionScreen
- [ ] Selected "Patient" role
- [ ] Tapped "Continue"
- [ ] Saw ProfileSetupScreen
- [ ] Filled in:
  - [ ] Full Name
  - [ ] Phone
  - [ ] Bio (optional)
- [ ] Tapped "Complete Profile"
- [ ] Successfully navigated to HomeScreen

### Step 3: Verify Database Entry
- [ ] Opened Supabase Table Editor
- [ ] Opened profiles table
- [ ] Confirmed patient profile exists with:
  - [ ] Correct email
  - [ ] role = 'patient'
  - [ ] full_name populated
  - [ ] phone populated (if entered)

### Step 4: Test Sign Out & Sign In
- [ ] From HomeScreen, navigated to Profile tab
- [ ] Found a way to sign out (may need temporary button)
- [ ] Successfully signed out
- [ ] Returned to SignInScreen
- [ ] Entered same credentials
- [ ] Successfully signed in
- [ ] Returned to HomeScreen

### Step 5: Test Physiotherapist Sign Up
- [ ] Signed out from previous account
- [ ] Tapped "Don't have an account? Sign up"
- [ ] Entered email: `physio@test.com`
- [ ] Entered password: `Test123!`
- [ ] Selected "Physiotherapist" role
- [ ] Filled in profile including:
  - [ ] Full Name
  - [ ] Phone
  - [ ] Bio
  - [ ] Specialization (e.g., "Sports Injury")
  - [ ] Hourly Rate (e.g., "75")
- [ ] Completed profile
- [ ] Reached HomeScreen

### Step 6: Verify Physiotherapist Entry
- [ ] Checked profiles table in Supabase
- [ ] Confirmed physiotherapist profile with:
  - [ ] role = 'physiotherapist'
  - [ ] specialization populated
  - [ ] hourly_rate populated

### Step 7: Test Session Persistence
- [ ] Closed app completely (force quit)
- [ ] Reopened app
- [ ] Did NOT see SignInScreen
- [ ] Automatically navigated to HomeScreen
- [ ] User remained logged in

## Code Quality Verification 🔍

### TypeScript
- [ ] No TypeScript errors in terminal
- [ ] All imports resolve correctly
- [ ] Type definitions working properly

### File Structure
- [ ] `src/config/supabase.ts` exists
- [ ] `src/stores/authStore.ts` exists
- [ ] `src/types/database.ts` exists
- [ ] `src/screens/auth/` folder contains 3 screens
- [ ] `database/migrations/001_initial_schema.sql` exists

### Documentation
- [ ] Read `SUPABASE_SETUP_GUIDE.md`
- [ ] Read `PHASE_1_COMPLETE.md`
- [ ] Reviewed `PHASE_1_QUICK_REFERENCE.md`
- [ ] Reviewed `AUTH_FLOW_DIAGRAM.md`

## Security Verification 🔒

### Environment Security
- [ ] `.env` file is in `.gitignore`
- [ ] `.env` not committed to git (check `git status`)
- [ ] No hardcoded credentials in code

### Row Level Security
- [ ] RLS enabled on all tables (checked in Supabase)
- [ ] Tested that patients can't see other patients' data
- [ ] Verified policies are active

### Authentication
- [ ] Email validation working
- [ ] Password requirements enforced
- [ ] Session tokens stored securely (AsyncStorage)

## Performance Check ⚡

- [ ] App launches quickly (<2 seconds to initial screen)
- [ ] Auth initialization fast (<300ms)
- [ ] No lag when navigating between screens
- [ ] Form inputs responsive
- [ ] No memory leaks (check with React DevTools)

## Troubleshooting Completed ✅

If you encountered issues, check these:

### "Invalid API key"
- [ ] Fixed by verifying .env credentials
- [ ] Fixed by restarting Expo server

### "Tables not found"
- [ ] Fixed by re-running migration
- [ ] Fixed by checking SQL errors

### "Can't sign up"
- [ ] Fixed by disabling email confirmations
- [ ] Fixed by checking Supabase logs

### "TypeScript errors"
- [ ] Fixed by installing dependencies
- [ ] Fixed by restarting VS Code

## Final Verification ✅

- [ ] No errors in Expo terminal
- [ ] No errors in browser console (if using web)
- [ ] Can sign up as patient
- [ ] Can sign up as physiotherapist
- [ ] Profiles saved to database
- [ ] Session persists after restart
- [ ] Navigation works correctly
- [ ] All documentation reviewed

## Ready for Phase 2? 🚀

Check all these before proceeding:

- [ ] ✅ All items in this checklist completed
- [ ] ✅ Both roles (patient + physio) tested
- [ ] ✅ Database has test data
- [ ] ✅ No critical errors or warnings
- [ ] ✅ Understood auth flow and architecture
- [ ] ✅ Read documentation files

## Next Steps 📋

Once this checklist is complete:

1. **Phase 1 Week 2 - Patient Features:**
   - Find physiotherapists screen
   - Connect via invite code
   - View assigned programs

2. **Phase 1 Week 2 - Physiotherapist Features:**
   - Patient dashboard
   - Generate invite codes
   - Assign programs to patients

3. **Phase 2 - Real-Time Features:**
   - Messaging system
   - Live workout tracking
   - Progress analytics

---

## Summary

**Total Checklist Items:** 100+
**Estimated Completion Time:** 15-30 minutes
**Prerequisites:** Supabase account, Node.js, basic React Native knowledge

**Status:**
- [ ] Not Started
- [ ] In Progress
- [ ] Completed ✅

---

**Once all items are checked, you're ready to build the next phase!** 🎉

*Refer back to this checklist if you encounter issues or need to verify your setup.*
