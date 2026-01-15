// Database Types - Generated from Supabase Schema

export type UserRole = 'patient' | 'physiotherapist';
export type ConnectionStatus = 'pending' | 'active' | 'completed';
export type ProgramStatus = 'active' | 'paused' | 'completed';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  specialization: string[] | null; // For physiotherapists
  hourly_rate: number | null; // For physiotherapists
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  patient_id: string;
  physiotherapist_id: string;
  status: ConnectionStatus;
  invite_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  patient?: Profile;
  physiotherapist?: Profile;
}

export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  target_muscles: string[] | null;
  video_demo_url: string | null;
  thumbnail_url: string | null;
  instructions: string[] | null;
  target_angles: Record<string, any> | null;
  contraindications: string[] | null;
  is_template: boolean;
  created_by: string | null;
  created_at: string;
  duration: number; // Default duration in seconds
}

export interface Program {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  difficulty: string | null;
  estimated_weeks: number | null;
  exercises: ProgramExercise[];
  is_template: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ProgramExercise {
  exercise_id: string;
  sets: number;
  reps: number;
  duration: number;
  order: number;
  notes: string | null;
}

export interface PatientProgram {
  id: string;
  patient_id: string;
  program_id: string;
  assigned_by: string;
  connection_id: string | null;
  start_date: string;
  end_date: string | null;
  frequency_per_week: number;
  custom_notes: string | null;
  status: ProgramStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  program?: Program;
  assigned_by_profile?: Profile;
}

export interface WorkoutSession {
  id: string;
  patient_id: string;
  exercise_id: string;
  program_id: string | null;
  duration_seconds: number;
  completed_reps: number;
  completed_sets: number;
  average_score: number | null;
  max_score: number | null;
  min_score: number | null;
  feedback_summary: string | null;
  started_at: string;
  ended_at: string;
  created_at: string;
  // Joined data
  exercise?: Exercise;
}

export interface SessionMistake {
  timestamp: number;
  mistake: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'video' | 'session_share';
  metadata: Record<string, any> | null;
  read_at: string | null;
  created_at: string;
  // Joined data
  sender?: Profile;
}

export interface ProgressSnapshot {
  id: string;
  patient_id: string;
  week_start: string;
  total_sessions: number;
  average_form_score: number;
  total_duration_minutes: number;
  compliance_rate: number;
  pain_trend: 'improving' | 'stable' | 'worsening' | null;
  notes: string | null;
  created_at: string;
}

// Database response types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      connections: {
        Row: Connection;
        Insert: Omit<Connection, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Connection, 'id' | 'created_at'>>;
      };
      exercises: {
        Row: Exercise;
        Insert: Omit<Exercise, 'id' | 'created_at'>;
        Update: Partial<Omit<Exercise, 'id' | 'created_at'>>;
      };
      workout_sessions: {
        Row: WorkoutSession;
        Insert: Omit<WorkoutSession, 'id' | 'created_at'>;
        Update: Partial<Omit<WorkoutSession, 'id' | 'created_at'>>;
      };
    };
  };
};
