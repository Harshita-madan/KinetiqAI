# Phase 1 Quick Reference

Quick reference for working with the KinetiqAI authentication system.

## Environment Setup

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Add your Supabase credentials to .env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 3. Start the app
npm start
```

## Using Auth Store

```typescript
import { useAuthStore } from '../stores';

// In a component
const MyComponent = () => {
  const { user, profile, signIn, signOut } = useAuthStore();

  // Check if authenticated
  if (!user) {
    return <Text>Not logged in</Text>;
  }

  // Access profile data
  return <Text>Welcome {profile?.full_name}</Text>;
};
```

## Auth Store API

```typescript
// State
const user = useAuthStore((state) => state.user);           // Supabase User object
const profile = useAuthStore((state) => state.profile);     // Profile from database
const loading = useAuthStore((state) => state.loading);     // Loading state
const initialized = useAuthStore((state) => state.initialized); // Init complete

// Actions
const signIn = useAuthStore((state) => state.signIn);       // (email, password)
const signUp = useAuthStore((state) => state.signUp);       // (email, password, role)
const signOut = useAuthStore((state) => state.signOut);     // ()
const fetchProfile = useAuthStore((state) => state.fetchProfile); // ()
const updateProfile = useAuthStore((state) => state.updateProfile); // (updates)
```

## Supabase Direct Access

```typescript
import { supabase } from '../config/supabase';

// Query data
const { data, error } = await supabase
  .from('exercises')
  .select('*')
  .eq('difficulty', 'beginner');

// Insert data
const { data, error } = await supabase
  .from('workout_sessions')
  .insert({
    patient_id: user.id,
    exercise_id: 'exercise-uuid',
    duration_seconds: 300,
    completed_reps: 10
  });

// Update data
const { data, error } = await supabase
  .from('profiles')
  .update({ full_name: 'New Name' })
  .eq('id', user.id);
```

## Database Types

```typescript
import { Profile, Exercise, WorkoutSession } from '../types/database';

// Type-safe profile
const profile: Profile = {
  id: 'uuid',
  email: 'user@example.com',
  role: 'patient',
  full_name: 'John Doe',
  phone: '+1234567890',
  avatar_url: null,
  bio: 'Patient bio',
  specialization: null,
  hourly_rate: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};
```

## Navigation

```typescript
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MyComponent = () => {
  const navigation = useNavigation<NavigationProp>();

  // Navigate to a screen
  navigation.navigate('ExerciseSelection');

  // Navigate with params
  navigation.navigate('LiveWorkout', {
    exercise: 'squat',
    duration: 300
  });
};
```

## Common Queries

### Get Current User's Profile
```typescript
const profile = useAuthStore((state) => state.profile);
```

### Get All Exercises
```typescript
const { data: exercises } = await supabase
  .from('exercises')
  .select('*')
  .order('name');
```

### Get Patient's Active Programs
```typescript
const { data: programs } = await supabase
  .from('patient_programs')
  .select(`
    *,
    exercise:exercises(*),
    physiotherapist:profiles!physiotherapist_id(*)
  `)
  .eq('patient_id', user.id)
  .eq('is_active', true);
```

### Get Physiotherapist's Patients
```typescript
const { data: patients } = await supabase
  .from('connections')
  .select(`
    *,
    patient:profiles!patient_id(*)
  `)
  .eq('physiotherapist_id', user.id)
  .eq('status', 'active');
```

### Create Workout Session
```typescript
const { data, error } = await supabase
  .from('workout_sessions')
  .insert({
    patient_id: user.id,
    exercise_id: exerciseId,
    duration_seconds: 300,
    completed_reps: 10,
    completed_sets: 3,
    average_score: 85.5
  })
  .select()
  .single();
```

## Real-Time Subscriptions

### Subscribe to New Messages
```typescript
const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `receiver_id=eq.${user.id}`
    },
    (payload) => {
      console.log('New message:', payload.new);
    }
  )
  .subscribe();

// Cleanup
return () => {
  channel.unsubscribe();
};
```

## Error Handling

```typescript
try {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;

  return data;
} catch (error: any) {
  if (error.code === 'PGRST116') {
    // Row not found
    console.log('Profile not found');
  } else {
    console.error('Error:', error.message);
  }
}
```

## Testing

### Create Test User
```typescript
const testEmail = 'test@example.com';
const testPassword = 'Test123!';

await signUp(testEmail, testPassword, 'patient');
```

### Clear Test Data
```sql
-- Run in Supabase SQL Editor
DELETE FROM profiles WHERE email LIKE 'test%';
DELETE FROM connections WHERE invite_code = '000000';
```

## Common Issues

### "User not authenticated"
```typescript
// Always check if user is loaded
const { user, initialized } = useAuthStore();

if (!initialized) {
  return <LoadingScreen />;
}

if (!user) {
  return <SignInScreen />;
}
```

### "RLS policy violation"
```typescript
// Make sure you're querying your own data
const { data } = await supabase
  .from('workout_sessions')
  .select('*')
  .eq('patient_id', user.id); // ✅ Your own data
  // .eq('patient_id', otherUserId); ❌ Not allowed by RLS
```

### "Invalid API key"
```typescript
// Check .env file
// Variables must start with EXPO_PUBLIC_
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...

// Restart Expo after changing .env
npm start
```

## File Structure

```
src/
├── config/
│   └── supabase.ts          # Supabase client
├── stores/
│   ├── authStore.ts         # Auth state management
│   └── index.ts             # Store exports
├── types/
│   └── database.ts          # TypeScript types
├── screens/
│   ├── auth/
│   │   ├── SignInScreen.tsx
│   │   ├── RoleSelectionScreen.tsx
│   │   ├── ProfileSetupScreen.tsx
│   │   └── index.ts
│   └── index.ts             # Screen exports
└── navigation/
    └── AppNavigator.tsx     # Navigation logic

database/
└── migrations/
    └── 001_initial_schema.sql
```

## Next Steps

1. **Read**: [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)
2. **Review**: [PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md)
3. **Start building**: Phase 1 Week 2 features

---

Need help? Check the main documentation files or Supabase logs!
