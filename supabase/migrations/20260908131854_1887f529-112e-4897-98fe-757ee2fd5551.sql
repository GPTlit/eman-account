
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','owner','worker');
CREATE TYPE public.subscription_plan AS ENUM ('bronze','silver','gold','platinum');
CREATE TYPE public.request_status AS ENUM ('pending','approved','rejected','cancelled');
CREATE TYPE public.transaction_type AS ENUM ('sale','purchase','expense','income','refund','debt','payment_received','payment_sent','other');
CREATE TYPE public.cash_movement_type AS ENUM ('cash_added','cash_removed','bank_deposit','withdrawal','adjustment');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  resident_area TEXT,
  avatar_url TEXT,
  role public.app_role NOT NULL DEFAULT 'worker',
  language TEXT NOT NULL DEFAULT 'ar',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_username ON public.profiles (lower(username));
CREATE INDEX idx_profiles_owner ON public.profiles (owner_id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  location TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_shops_owner ON public.shops (owner_id);

CREATE TABLE public.shop_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  can_edit BOOLEAN NOT NULL DEFAULT true,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, worker_id)
);
CREATE INDEX idx_shop_members_worker ON public.shop_members (worker_id);

CREATE OR REPLACE FUNCTION public.owns_shop(_shop_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shops s WHERE s.id = _shop_id AND s.owner_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.member_of_shop(_shop_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shop_members m WHERE m.shop_id = _shop_id AND m.worker_id = auth.uid());
$$;

CREATE TABLE public.worker_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (worker_id, owner_id)
);
CREATE INDEX idx_worker_requests_owner ON public.worker_requests (owner_id, status);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  type public.transaction_type NOT NULL DEFAULT 'sale',
  product TEXT,
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MRU',
  payment_method TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  receipt_url TEXT,
  is_voided BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_shop_date ON public.transactions (shop_id, occurred_at DESC);
CREATE INDEX idx_transactions_creator ON public.transactions (created_by);

CREATE TABLE public.cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  type public.cash_movement_type NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cash_movements_shop ON public.cash_movements (shop_id, created_at DESC);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 year'),
  max_shops INTEGER NOT NULL DEFAULT 3,
  max_workers INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_owner ON public.subscriptions (owner_id, status);

CREATE TABLE public.subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL,
  resident_area TEXT,
  whatsapp TEXT,
  phone TEXT,
  id_document_path TEXT,
  receipt_path TEXT,
  status public.request_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscription_requests_status ON public.subscription_requests (status, created_at DESC);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title_key TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications (user_id, is_read, created_at DESC);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  object_type TEXT,
  object_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_created ON public.audit_logs (created_at DESC);

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shops TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.worker_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_movements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.profiles, public.shops, public.shop_members, public.worker_requests,
  public.transactions, public.cash_movements, public.subscriptions, public.subscription_requests,
  public.notifications, public.audit_logs, public.user_roles TO service_role;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "owner manages shops" ON public.shops FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin()) WITH CHECK (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "workers read assigned shops" ON public.shops FOR SELECT TO authenticated
  USING (public.member_of_shop(id));

CREATE POLICY "owner manages shop members" ON public.shop_members FOR ALL TO authenticated
  USING (public.owns_shop(shop_id) OR public.is_admin()) WITH CHECK (public.owns_shop(shop_id) OR public.is_admin());
CREATE POLICY "worker reads own membership" ON public.shop_members FOR SELECT TO authenticated
  USING (worker_id = auth.uid());

CREATE POLICY "worker creates request" ON public.worker_requests FOR INSERT TO authenticated WITH CHECK (worker_id = auth.uid());
CREATE POLICY "parties read request" ON public.worker_requests FOR SELECT TO authenticated
  USING (worker_id = auth.uid() OR owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "owner updates request" ON public.worker_requests FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "worker deletes own request" ON public.worker_requests FOR DELETE TO authenticated USING (worker_id = auth.uid());

CREATE POLICY "read shop transactions" ON public.transactions FOR SELECT TO authenticated
  USING (public.owns_shop(shop_id) OR public.member_of_shop(shop_id) OR public.is_admin());
CREATE POLICY "create shop transactions" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (public.owns_shop(shop_id) OR public.member_of_shop(shop_id)));
CREATE POLICY "update shop transactions" ON public.transactions FOR UPDATE TO authenticated
  USING (public.owns_shop(shop_id) OR (public.member_of_shop(shop_id) AND created_by = auth.uid()))
  WITH CHECK (public.owns_shop(shop_id) OR (public.member_of_shop(shop_id) AND created_by = auth.uid()));
CREATE POLICY "owner deletes transactions" ON public.transactions FOR DELETE TO authenticated USING (public.owns_shop(shop_id));

CREATE POLICY "read cash movements" ON public.cash_movements FOR SELECT TO authenticated
  USING (public.owns_shop(shop_id) OR public.member_of_shop(shop_id) OR public.is_admin());
CREATE POLICY "create cash movements" ON public.cash_movements FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (public.owns_shop(shop_id) OR public.member_of_shop(shop_id)));

CREATE POLICY "owner reads subscription" ON public.subscriptions FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "admin manages subscriptions" ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "owner reads own sub requests" ON public.subscription_requests FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "owner creates sub request" ON public.subscription_requests FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "admin updates sub requests" ON public.subscription_requests FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "read own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "admin reads audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin() OR actor_id = auth.uid());
CREATE POLICY "insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_shops_updated BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_transactions_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_subrequests_updated BEFORE UPDATE ON public.subscription_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_worker_requests_updated BEFORE UPDATE ON public.worker_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- new user -> profile + role
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.app_role;
  v_username TEXT;
BEGIN
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'worker');
  v_username := COALESCE(NULLIF(NEW.raw_user_meta_data->>'username',''), split_part(NEW.email,'@',1) || '_' || substr(NEW.id::text,1,4));

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
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role) ON CONFLICT DO NOTHING;

  IF lower(NEW.email) = 'eman4real.new@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
    UPDATE public.profiles SET role = 'admin' WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_requests;
