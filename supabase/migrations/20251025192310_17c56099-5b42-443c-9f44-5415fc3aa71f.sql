-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Update book creation policy to only allow admins
DROP POLICY IF EXISTS "Authenticated users can create books" ON public.books;
CREATE POLICY "Only admins can create books"
ON public.books
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Update book update policy to only allow admins
DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
CREATE POLICY "Only admins can update books"
ON public.books
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Update book delete policy to only allow admins
DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;
CREATE POLICY "Only admins can delete books"
ON public.books
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Add book_content field for full book text
ALTER TABLE public.books
ADD COLUMN book_content TEXT;

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  feedback_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own feedback"
ON public.feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Feedback is viewable by everyone"
ON public.feedback
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own feedback"
ON public.feedback
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
ON public.feedback
FOR DELETE
USING (auth.uid() = user_id);

-- Create notes table
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  note_text TEXT NOT NULL,
  page_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own notes"
ON public.notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notes"
ON public.notes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON public.notes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.notes
FOR DELETE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user function to assign default 'user' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;