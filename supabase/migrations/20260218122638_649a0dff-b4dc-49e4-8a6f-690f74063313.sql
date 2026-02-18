CREATE TABLE public.dns_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dns_servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.dns_servers
  FOR SELECT TO anon USING (true);

INSERT INTO public.dns_servers (name, url) VALUES
  ('Principal', 'http://servidor1.com:8080'),
  ('Backup', 'http://servidor2.com:8080');