-- Create ENUM types
CREATE TYPE tier_type AS ENUM ('free', 'basic', 'pro');
CREATE TYPE category_type AS ENUM ('top', 'bottom', 'dress', 'shoes', 'accessory');
CREATE TYPE generation_type AS ENUM ('tryon', 'outfit');

-- 1. Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  tier tier_type DEFAULT 'free',
  credits_remaining INTEGER DEFAULT 0,
  credits_reset_date TIMESTAMPTZ DEFAULT NOW(),
  total_generations INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clothing Items Table
CREATE TABLE public.clothing_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  image_url TEXT NOT NULL,
  category category_type NOT NULL,
  colors TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  occasions TEXT[] DEFAULT '{}',
  last_worn TIMESTAMPTZ,
  cost_per_wear NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Outfits Table
CREATE TABLE public.outfits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  items UUID[] NOT NULL, -- Array of clothing_items IDs
  occasion TEXT,
  worn_count INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Generation Logs Table
CREATE TABLE public.generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  type generation_type NOT NULL,
  cost_to_user INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. Clothing Items Policies
CREATE POLICY "Users can view own clothing items" 
ON public.clothing_items FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clothing items" 
ON public.clothing_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clothing items" 
ON public.clothing_items FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clothing items" 
ON public.clothing_items FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Outfits Policies
CREATE POLICY "Users can view own outfits" 
ON public.outfits FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfits" 
ON public.outfits FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outfits" 
ON public.outfits FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own outfits" 
ON public.outfits FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Generation Logs Policies
CREATE POLICY "Users can view own generation logs" 
ON public.generation_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation logs" 
ON public.generation_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Function to handle new user signup (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, tier, credits_remaining, credits_reset_date)
  VALUES (new.id, new.email, 'free', 0, NOW());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
