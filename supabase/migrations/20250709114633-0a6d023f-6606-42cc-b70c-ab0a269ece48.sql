
-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_conditions TEXT[],
  allergies TEXT[],
  current_medications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medical records table
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  record_type TEXT NOT NULL CHECK (record_type IN ('lab_result', 'prescription', 'imaging', 'visit_note', 'other')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  extracted_text TEXT,
  ai_analysis JSONB,
  date_recorded DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create symptoms table
CREATE TABLE public.symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symptom_name TEXT NOT NULL,
  severity INTEGER CHECK (severity >= 1 AND severity <= 5),
  duration_hours INTEGER,
  location TEXT,
  description TEXT,
  ai_suggestions JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health metrics table
CREATE TABLE public.health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('blood_pressure', 'heart_rate', 'weight', 'temperature', 'blood_sugar', 'other')),
  value_numeric DECIMAL,
  value_text TEXT,
  unit TEXT,
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for medical records
CREATE POLICY "Users can view their own medical records" ON public.medical_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own medical records" ON public.medical_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own medical records" ON public.medical_records
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own medical records" ON public.medical_records
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for symptoms
CREATE POLICY "Users can view their own symptoms" ON public.symptoms
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own symptoms" ON public.symptoms
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own symptoms" ON public.symptoms
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own symptoms" ON public.symptoms
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for health metrics
CREATE POLICY "Users can view their own health metrics" ON public.health_metrics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own health metrics" ON public.health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own health metrics" ON public.health_metrics
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own health metrics" ON public.health_metrics
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
