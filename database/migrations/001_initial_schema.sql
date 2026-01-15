-- KinetiqAI Database Schema
-- Phase 1: Authentication and User Management

-- ==============================================
-- 1. Profiles Table (extends Supabase auth.users)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('patient', 'physiotherapist')),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  
  -- Physiotherapist-specific fields
  specialization TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10, 2),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast role-based queries
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ==============================================
-- 2. Connections Table (patient-physiotherapist relationships)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  physiotherapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  invite_code TEXT UNIQUE,
  
  -- Metadata
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique patient-physio pairs
  UNIQUE(patient_id, physiotherapist_id),
  
  -- Ensure a patient doesn't connect to themselves
  CHECK (patient_id != physiotherapist_id)
);

-- Create indexes for fast lookups
CREATE INDEX idx_connections_patient ON public.connections(patient_id);
CREATE INDEX idx_connections_physiotherapist ON public.connections(physiotherapist_id);
CREATE INDEX idx_connections_invite_code ON public.connections(invite_code);
CREATE INDEX idx_connections_status ON public.connections(status);

-- ==============================================
-- 3. Exercises Table (exercise definitions)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('squat', 'lunge', 'plank', 'pushup', 'other')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  
  -- Exercise parameters
  target_reps INTEGER,
  target_sets INTEGER,
  target_hold_seconds INTEGER,
  
  -- Media
  thumbnail_url TEXT,
  video_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_exercises_category ON public.exercises(category);
CREATE INDEX idx_exercises_difficulty ON public.exercises(difficulty);

-- ==============================================
-- 4. Patient Programs Table (assigned exercise programs)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.patient_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  physiotherapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  
  -- Program details
  frequency_per_week INTEGER NOT NULL DEFAULT 3,
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_patient_programs_patient ON public.patient_programs(patient_id);
CREATE INDEX idx_patient_programs_physiotherapist ON public.patient_programs(physiotherapist_id);
CREATE INDEX idx_patient_programs_exercise ON public.patient_programs(exercise_id);
CREATE INDEX idx_patient_programs_active ON public.patient_programs(is_active);

-- ==============================================
-- 5. Workout Sessions Table (completed workouts)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.patient_programs(id) ON DELETE SET NULL,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  
  -- Session data
  duration_seconds INTEGER NOT NULL,
  completed_reps INTEGER NOT NULL DEFAULT 0,
  completed_sets INTEGER NOT NULL DEFAULT 0,
  
  -- Quality metrics
  average_score DECIMAL(5, 2),
  max_score DECIMAL(5, 2),
  min_score DECIMAL(5, 2),
  
  -- Detailed feedback
  feedback_summary TEXT,
  
  -- Metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_workout_sessions_patient ON public.workout_sessions(patient_id);
CREATE INDEX idx_workout_sessions_program ON public.workout_sessions(program_id);
CREATE INDEX idx_workout_sessions_exercise ON public.workout_sessions(exercise_id);
CREATE INDEX idx_workout_sessions_started_at ON public.workout_sessions(started_at);

-- ==============================================
-- 6. Progress Snapshots Table (periodic assessments)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.patient_programs(id) ON DELETE CASCADE,
  
  -- Snapshot data
  week_number INTEGER NOT NULL,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  average_score DECIMAL(5, 2),
  improvement_percentage DECIMAL(5, 2),
  
  -- Notes
  physiotherapist_notes TEXT,
  patient_feedback TEXT,
  
  -- Metadata
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_progress_snapshots_patient ON public.progress_snapshots(patient_id);
CREATE INDEX idx_progress_snapshots_program ON public.progress_snapshots(program_id);
CREATE INDEX idx_progress_snapshots_week ON public.progress_snapshots(week_number);

-- ==============================================
-- 7. Messages Table (patient-physio communication)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Message content
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'session')),
  
  -- Optional session reference (for sharing workout results)
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  
  -- Read status
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_messages_connection ON public.messages(connection_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_is_read ON public.messages(is_read);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- RLS Policies: Profiles
-- ==============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Patients can read their connected physiotherapists
CREATE POLICY "Patients can read connected physiotherapists"
  ON public.profiles FOR SELECT
  USING (
    role = 'physiotherapist' AND
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE connections.physiotherapist_id = profiles.id
        AND connections.patient_id = auth.uid()
        AND connections.status = 'active'
    )
  );

-- Physiotherapists can read their connected patients
CREATE POLICY "Physiotherapists can read connected patients"
  ON public.profiles FOR SELECT
  USING (
    role = 'patient' AND
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE connections.patient_id = profiles.id
        AND connections.physiotherapist_id = auth.uid()
        AND connections.status = 'active'
    )
  );

-- ==============================================
-- RLS Policies: Connections
-- ==============================================

-- Patients can read their own connections
CREATE POLICY "Patients can read own connections"
  ON public.connections FOR SELECT
  USING (patient_id = auth.uid());

-- Physiotherapists can read their own connections
CREATE POLICY "Physiotherapists can read own connections"
  ON public.connections FOR SELECT
  USING (physiotherapist_id = auth.uid());

-- Patients can create connections (join via invite code)
CREATE POLICY "Patients can create connections"
  ON public.connections FOR INSERT
  WITH CHECK (patient_id = auth.uid());

-- Physiotherapists can update connections (accept/reject)
CREATE POLICY "Physiotherapists can update connections"
  ON public.connections FOR UPDATE
  USING (physiotherapist_id = auth.uid());

-- ==============================================
-- RLS Policies: Exercises
-- ==============================================

-- Everyone can read exercises (catalog)
CREATE POLICY "Anyone can read exercises"
  ON public.exercises FOR SELECT
  USING (true);

-- Only physiotherapists can create/modify exercises (future feature)
CREATE POLICY "Physiotherapists can manage exercises"
  ON public.exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'physiotherapist'
    )
  );

-- ==============================================
-- RLS Policies: Patient Programs
-- ==============================================

-- Patients can read their own programs
CREATE POLICY "Patients can read own programs"
  ON public.patient_programs FOR SELECT
  USING (patient_id = auth.uid());

-- Physiotherapists can read programs they assigned
CREATE POLICY "Physiotherapists can read assigned programs"
  ON public.patient_programs FOR SELECT
  USING (physiotherapist_id = auth.uid());

-- Physiotherapists can create programs for their patients
CREATE POLICY "Physiotherapists can create programs"
  ON public.patient_programs FOR INSERT
  WITH CHECK (
    physiotherapist_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE connections.patient_id = patient_programs.patient_id
        AND connections.physiotherapist_id = auth.uid()
        AND connections.status = 'active'
    )
  );

-- Physiotherapists can update their assigned programs
CREATE POLICY "Physiotherapists can update programs"
  ON public.patient_programs FOR UPDATE
  USING (physiotherapist_id = auth.uid());

-- ==============================================
-- RLS Policies: Workout Sessions
-- ==============================================

-- Patients can read their own sessions
CREATE POLICY "Patients can read own sessions"
  ON public.workout_sessions FOR SELECT
  USING (patient_id = auth.uid());

-- Patients can create their own sessions
CREATE POLICY "Patients can create own sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (patient_id = auth.uid());

-- Physiotherapists can read sessions of their patients
CREATE POLICY "Physiotherapists can read patient sessions"
  ON public.workout_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE connections.patient_id = workout_sessions.patient_id
        AND connections.physiotherapist_id = auth.uid()
        AND connections.status = 'active'
    )
  );

-- ==============================================
-- RLS Policies: Progress Snapshots
-- ==============================================

-- Patients can read their own snapshots
CREATE POLICY "Patients can read own snapshots"
  ON public.progress_snapshots FOR SELECT
  USING (patient_id = auth.uid());

-- Physiotherapists can read/write snapshots for their patients
CREATE POLICY "Physiotherapists can manage patient snapshots"
  ON public.progress_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_programs
      WHERE patient_programs.id = progress_snapshots.program_id
        AND patient_programs.physiotherapist_id = auth.uid()
    )
  );

-- ==============================================
-- RLS Policies: Messages
-- ==============================================

-- Users can read messages they sent or received
CREATE POLICY "Users can read own messages"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Users can send messages in their connections
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE connections.id = messages.connection_id
        AND (connections.patient_id = auth.uid() OR connections.physiotherapist_id = auth.uid())
        AND connections.status = 'active'
    )
  );

-- Users can update messages they received (mark as read)
CREATE POLICY "Users can update received messages"
  ON public.messages FOR UPDATE
  USING (receiver_id = auth.uid());

-- ==============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_programs_updated_at
  BEFORE UPDATE ON public.patient_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- SEED DATA: Default Exercises
-- ==============================================

INSERT INTO public.exercises (name, description, category, difficulty, duration_minutes, target_reps, target_sets, thumbnail_url) VALUES
-- Squat variations
('Basic Squat', 'Standard bodyweight squat for beginners. Focus on proper form and depth.', 'squat', 'beginner', 5, 10, 3, null),
('Deep Squat', 'Advanced squat with greater depth and control. Requires good mobility.', 'squat', 'advanced', 8, 12, 4, null),
('Sumo Squat', 'Wide stance squat targeting inner thighs and glutes.', 'squat', 'intermediate', 6, 12, 3, null),
('Jump Squat', 'Explosive plyometric squat for power development.', 'squat', 'advanced', 5, 8, 3, null),
-- Lunge variations
('Forward Lunge', 'Single-leg exercise to improve balance and leg strength.', 'lunge', 'beginner', 5, 10, 3, null),
('Side Lunge', 'Lateral lunge to target different muscle groups.', 'lunge', 'intermediate', 6, 8, 3, null),
('Reverse Lunge', 'Backward stepping lunge emphasizing glutes and hamstrings.', 'lunge', 'beginner', 5, 10, 3, null),
('Walking Lunge', 'Dynamic lunge moving forward for functional strength.', 'lunge', 'intermediate', 7, 20, 2, null),
-- Plank variations
('Plank Hold', 'Isometric core exercise. Hold position with proper alignment.', 'plank', 'beginner', 3, 1, 3, null),
('Side Plank', 'Lateral core stability exercise targeting obliques.', 'plank', 'intermediate', 4, 1, 3, null),
('Plank to Downward Dog', 'Dynamic plank variation with shoulder mobility.', 'plank', 'intermediate', 5, 10, 3, null),
-- Pushup variations
('Standard Pushup', 'Classic upper body exercise. Maintain straight body line.', 'pushup', 'intermediate', 5, 10, 3, null),
('Knee Pushup', 'Modified pushup for beginners to build strength.', 'pushup', 'beginner', 4, 12, 3, null),
('Diamond Pushup', 'Close-grip pushup targeting triceps.', 'pushup', 'advanced', 6, 8, 3, null),
('Wide Pushup', 'Wide-grip pushup emphasizing chest muscles.', 'pushup', 'intermediate', 5, 10, 3, null),
-- Additional exercises
('Bird Dog', 'Core stability exercise with opposite arm and leg extension.', 'other', 'beginner', 4, 10, 3, null),
('Mountain Climber', 'Dynamic core and cardio exercise.', 'other', 'intermediate', 5, 20, 3, null),
('Burpee', 'Full body explosive exercise combining squat, plank, and jump.', 'other', 'advanced', 8, 10, 3, null)
ON CONFLICT DO NOTHING;

-- ==============================================
-- HELPFUL FUNCTIONS
-- ==============================================

-- Function to generate unique 6-digit invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-digit code
    code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.connections WHERE invite_code = code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- REAL-TIME SUBSCRIPTIONS (Optional)
-- ==============================================

-- Enable real-time for messages table (for instant chat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable real-time for workout_sessions (for live progress tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_sessions;

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Composite indexes for common queries
CREATE INDEX idx_connections_patient_status ON public.connections(patient_id, status);
CREATE INDEX idx_connections_physio_status ON public.connections(physiotherapist_id, status);
CREATE INDEX idx_patient_programs_patient_active ON public.patient_programs(patient_id, is_active);
CREATE INDEX idx_workout_sessions_patient_date ON public.workout_sessions(patient_id, started_at DESC);
CREATE INDEX idx_messages_connection_created ON public.messages(connection_id, created_at DESC);

-- ==============================================
-- END OF MIGRATION
-- ==============================================
