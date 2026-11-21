-- Create trigger function untuk sync user dari Supabase auth.users ke core_auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO core_auth.users (
    id, 
    email, 
    "fullName", 
    "phoneNumber", 
    "passwordHash", 
    "userType",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    new.id::text,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'name', 
      split_part(new.email, '@', 1),
      'User'
    ),
    NULLIF(new.raw_user_meta_data->>'phone_number', ''),
    '',
    'CUSTOMER',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    "fullName" = COALESCE(EXCLUDED."fullName", core_auth.users."fullName"),
    "email" = EXCLUDED."email",
    "updatedAt" = NOW();
    
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Mencegah transaksi auth.users gagal jika ada error saat sync ke core_auth
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions agar trigger function bisa akses schema core_auth
GRANT USAGE ON SCHEMA core_auth TO postgres, service_role, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA core_auth TO postgres, service_role, anon, authenticated;

-- Pasang trigger pada tabel auth.users Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
