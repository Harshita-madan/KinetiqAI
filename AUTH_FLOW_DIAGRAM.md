# Authentication Flow Diagram

## User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                         APP LAUNCH                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Initialize Auth    │
                   │  (Check for session)│
                   └─────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │   No Session Found   │    │   Session Found      │
    │   (Not Logged In)    │    │   (Logged In)        │
    └──────────────────────┘    └──────────────────────┘
                │                           │
                ▼                           ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │   SignInScreen       │    │   Check Profile      │
    │                      │    │   Complete?          │
    │  ┌──────────────┐    │    └──────────────────────┘
    │  │ Sign In Form │    │                │
    │  └──────────────┘    │      ┌─────────┴──────────┐
    │  ┌──────────────┐    │      │                    │
    │  │ Sign Up Link │────┼──────┤                    │
    │  └──────────────┘    │      ▼                    ▼
    └──────────────────────┘  ┌────────────┐  ┌─────────────────┐
                              │  Complete  │  │   Incomplete    │
                              └────────────┘  └─────────────────┘
                                    │                  │
                                    │                  ▼
                                    │         ┌─────────────────┐
                                    │         │ ProfileSetup    │
                                    │         │ Screen          │
                                    │         └─────────────────┘
                                    │                  │
                                    ▼                  ▼
                              ┌──────────────────────────┐
                              │    HOME SCREEN           │
                              │    (Main App)            │
                              └──────────────────────────┘
```

## Sign Up Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SignInScreen                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  [Email Input]                                         │     │
│  │  [Password Input]                          [Show/Hide] │     │
│  │                                                         │     │
│  │  User taps: "Don't have an account? Sign up"           │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SignInScreen (Sign Up Mode)                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  [Email Input]                                         │     │
│  │  [Password Input]                          [Show/Hide] │     │
│  │                                                         │     │
│  │  User enters: patient@test.com / Test123!              │     │
│  │  User taps: [Create Account]                           │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │ Supabase Auth  │
                     │ Creates User   │
                     └────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  RoleSelectionScreen                             │
│  ┌─────────────────────────────┐  ┌──────────────────────────┐  │
│  │  🏥 PATIENT                 │  │  💼 PHYSIOTHERAPIST      │  │
│  │                             │  │                          │  │
│  │  ✓ Track your workouts     │  │  ✓ Manage patients       │  │
│  │  ✓ Connect with physios    │  │  ✓ Create programs       │  │
│  │  ✓ Get exercise programs   │  │  ✓ Track progress        │  │
│  │  ✓ View your progress      │  │  ✓ Chat with patients    │  │
│  │                             │  │                          │  │
│  │  [Selected ✓]              │  │  [ ]                     │  │
│  └─────────────────────────────┘  └──────────────────────────┘  │
│                                                                  │
│                    [Continue →]                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │ Save role to   │
                     │ profiles table │
                     └────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ProfileSetupScreen                              │
│  ┌────────────────────────────────────────────────────────┐     │
│  │     [Avatar Placeholder]                               │     │
│  │                                                         │     │
│  │  Full Name: [_______________________]                  │     │
│  │                                                         │     │
│  │  Phone: [_______________________]                      │     │
│  │                                                         │     │
│  │  Bio: [_________________________________]              │     │
│  │       [_________________________________]              │     │
│  │                                                         │     │
│  │  --- If Physiotherapist ---                            │     │
│  │  Specialization: [_______________________]             │     │
│  │  Hourly Rate: $[_______]                               │     │
│  │                                                         │     │
│  │  [Complete Profile]                    [Skip for now]  │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │ Save profile   │
                     │ to database    │
                     └────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HOME SCREEN                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                                                       │       │
│  │  Welcome back, [User Name]!                          │       │
│  │                                                       │       │
│  │  [Your Workouts]  [Programs]  [Messages]             │       │
│  │                                                       │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
│  Bottom Tabs: [Home] [Chat] [Profile]                           │
└─────────────────────────────────────────────────────────────────┘
```

## Database Interactions

```
┌──────────────────┐
│  User signs up   │
│  on device       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐        ┌─────────────────────────────────┐
│  Supabase Auth   │───────▶│  auth.users table               │
│  creates account │        │  (managed by Supabase)          │
└────────┬─────────┘        └─────────────────────────────────┘
         │
         ▼
┌──────────────────┐        ┌─────────────────────────────────┐
│  App creates     │───────▶│  public.profiles table          │
│  profile record  │        │  (your custom data)             │
└────────┬─────────┘        │                                 │
         │                  │  - id (references auth.users)   │
         │                  │  - email                        │
         ▼                  │  - role (patient/physio)        │
┌──────────────────┐        │  - full_name                    │
│  User navigates  │        │  - phone, bio, avatar_url       │
│  to main app     │        │  - specialization, hourly_rate  │
└──────────────────┘        └─────────────────────────────────┘
```

## Row Level Security in Action

```
┌─────────────────────────────────────────────────────────────────┐
│  Patient A tries to query workout_sessions table                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  RLS Policy:   │
                     │  Check if      │
                     │  patient_id =  │
                     │  auth.uid()    │
                     └────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │   Own Sessions       │    │   Other's Sessions   │
    │   ✅ ALLOWED         │    │   ❌ DENIED          │
    └──────────────────────┘    └──────────────────────┘
                │
                ▼
    ┌──────────────────────┐
    │  Return only         │
    │  Patient A's data    │
    └──────────────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Zustand Auth Store                           │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  State:                                                │     │
│  │    - user: User | null                                 │     │
│  │    - profile: Profile | null                           │     │
│  │    - loading: boolean                                  │     │
│  │    - initialized: boolean                              │     │
│  │                                                         │     │
│  │  Actions:                                              │     │
│  │    - initialize()        ───▶ Check AsyncStorage      │     │
│  │    - signIn()            ───▶ Supabase Auth           │     │
│  │    - signUp()            ───▶ Supabase Auth           │     │
│  │    - signOut()           ───▶ Clear session           │     │
│  │    - fetchProfile()      ───▶ Query profiles table    │     │
│  │    - updateProfile()     ───▶ Update profiles table   │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    React Components                              │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  const { user, profile } = useAuthStore();             │     │
│  │                                                         │     │
│  │  // Automatic re-render when state changes             │     │
│  │  if (!user) return <SignInScreen />;                   │     │
│  │                                                         │     │
│  │  return <HomeScreen profile={profile} />;              │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## Session Persistence

```
┌─────────────────────────────────────────────────────────────────┐
│                     App Lifecycle                                │
└─────────────────────────────────────────────────────────────────┘

  First Launch:
  ─────────────
  1. App starts
  2. authStore.initialize() called
  3. Check AsyncStorage for session
  4. No session found
  5. Show SignInScreen
  6. User signs in
  7. Supabase saves session to AsyncStorage
  8. Navigate to HomeScreen

  Subsequent Launches:
  ───────────────────
  1. App starts
  2. authStore.initialize() called
  3. Check AsyncStorage for session
  4. Session found! ✅
  5. Load user + profile
  6. Navigate directly to HomeScreen
     (No sign-in required!)

  After Sign Out:
  ──────────────
  1. User taps Sign Out
  2. authStore.signOut() called
  3. Clear AsyncStorage
  4. Clear Zustand state
  5. Navigate to SignInScreen
```

## Connection Flow (Phase 2)

```
┌─────────────────────────────────────────────────────────────────┐
│              Physiotherapist generates invite code               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  Generate      │
                     │  6-digit code  │
                     │  (e.g., 123456)│
                     └────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  Save to       │
                     │  connections   │
                     │  table         │
                     └────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Patient enters invite code                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  Find          │
                     │  connection    │
                     │  by code       │
                     └────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  Update        │
                     │  connection:   │
                     │  status='active'│
                     └────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Patient and Physio are now connected!               │
│                                                                  │
│  - Patient can view assigned programs                            │
│  - Physio can see patient's progress                             │
│  - Both can send messages                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Key Security Features

```
┌─────────────────────────────────────────────────────────────────┐
│                        Security Layers                           │
└─────────────────────────────────────────────────────────────────┘

  1. Supabase Authentication
     ────────────────────────
     ✓ Email/password validation
     ✓ JWT token generation
     ✓ Automatic token refresh
     ✓ Secure session storage

  2. Row Level Security (RLS)
     ────────────────────────
     ✓ Database-level access control
     ✓ Policies on every table
     ✓ Users can only access their own data
     ✓ Connected users can see each other

  3. Type Safety
     ───────────
     ✓ TypeScript throughout
     ✓ Database types match schema
     ✓ Compile-time error checking

  4. Environment Security
     ────────────────────
     ✓ .env file for credentials
     ✓ .gitignore prevents commits
     ✓ No hardcoded secrets

  5. API Key Security
     ────────────────
     ✓ Using anon key (public)
     ✓ RLS enforces permissions
     ✓ Service key never exposed
```

---

**Visual Summary:** This flow shows how users move through the authentication process, how data is stored securely, and how Row Level Security protects user data. The system is designed to be secure by default while maintaining a smooth user experience.
