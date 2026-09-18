CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role;
  v_username TEXT;
  v_base TEXT;
  i INT := 0;
BEGIN
  BEGIN
    v_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'worker');
  EXCEPTION WHEN OTHERS THEN
    v_role := 'worker';
  END;

  v_base := COALESCE(NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'username',''), '[^a-zA-Z0-9_]', '', 'g'), ''), split_part(NEW.email,'@',1));
  v_base := COALESCE(NULLIF(v_base,''), 'user');
  v_username := v_base;

  WHILE EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.username) = lower(v_username)) AND i < 50 LOOP
    i := i + 1;
    v_username := v_base || i::text;
  END LOOP;

  IF EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.username) = lower(v_username)) THEN
    v_username := v_base || '_' || substr(replace(NEW.id::text,'-',''),1,6);
  END IF;

  INSERT INTO public.profiles (id, full_name, username, email, phone, whatsapp, resident_area, avatar_url, role, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    v_username,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'resident_area',
    NEW.raw_user_meta_data->>'avatar_url',
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'language','ar')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role) ON CONFLICT DO NOTHING;

  IF lower(NEW.email) = 'eman4real.new@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
    UPDATE public.profiles SET role = 'admin' WHERE id = NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END; $function$;