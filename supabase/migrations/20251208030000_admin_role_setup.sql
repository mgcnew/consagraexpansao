-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL UNIQUE
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role_id UUID REFERENCES public.roles(id) NOT NULL,
  UNIQUE(user_id, role_id)
);

-- Insert 'admin' role
INSERT INTO public.roles (role) VALUES ('admin') ON CONFLICT (role) DO NOTHING;

-- Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_role BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id AND r.role = _role
  ) INTO has_role;
  RETURN has_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
;
