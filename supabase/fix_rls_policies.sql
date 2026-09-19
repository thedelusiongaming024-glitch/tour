-- =============================================================================
-- FIX DATABASE COMMUNICATION & RLS POLICIES
-- Target Project: https://tcituxdzdqjgslhctncu.supabase.co
-- Execute in Supabase SQL Editor: https://supabase.com/dashboard/project/tcituxdzdqjgslhctncu/sql
-- =============================================================================

-- 1. BOOKINGS: Allow travelers to create bookings and view their booking details
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public booking insert" ON public.bookings;
CREATE POLICY "Allow public booking insert" ON public.bookings
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public booking select" ON public.bookings;
CREATE POLICY "Allow public booking select" ON public.bookings
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public booking update" ON public.bookings;
CREATE POLICY "Allow public booking update" ON public.bookings
FOR UPDATE TO public USING (true) WITH CHECK (true);


-- 2. CUSTOMERS: Allow customer profiles to be created and linked
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public customer insert" ON public.customers;
CREATE POLICY "Allow public customer insert" ON public.customers
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public customer select" ON public.customers;
CREATE POLICY "Allow public customer select" ON public.customers
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public customer update" ON public.customers;
CREATE POLICY "Allow public customer update" ON public.customers
FOR UPDATE TO public USING (true) WITH CHECK (true);


-- 3. CATALOG TABLES: Allow full read and sync management
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public destinations read" ON public.destinations;
CREATE POLICY "Allow public destinations read" ON public.destinations
FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow catalog destinations write" ON public.destinations;
CREATE POLICY "Allow catalog destinations write" ON public.destinations
FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public tours read" ON public.tours;
CREATE POLICY "Allow public tours read" ON public.tours
FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow catalog tours write" ON public.tours;
CREATE POLICY "Allow catalog tours write" ON public.tours
FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public offers read" ON public.offers;
CREATE POLICY "Allow public offers read" ON public.offers
FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow catalog offers write" ON public.offers;
CREATE POLICY "Allow catalog offers write" ON public.offers
FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public testimonials read" ON public.testimonials;
CREATE POLICY "Allow public testimonials read" ON public.testimonials
FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow catalog testimonials write" ON public.testimonials;
CREATE POLICY "Allow catalog testimonials write" ON public.testimonials
FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public blogs read" ON public.blog_posts;
CREATE POLICY "Allow public blogs read" ON public.blog_posts
FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow catalog blogs write" ON public.blog_posts;
CREATE POLICY "Allow catalog blogs write" ON public.blog_posts
FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.homepage_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public blocks read" ON public.homepage_blocks;
CREATE POLICY "Allow public blocks read" ON public.homepage_blocks
FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow catalog blocks write" ON public.homepage_blocks;
CREATE POLICY "Allow catalog blocks write" ON public.homepage_blocks
FOR ALL TO public USING (true) WITH CHECK (true);


-- 4. STORAGE: Ensure atithi-data bucket exists with full permissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('atithi-data', 'atithi-data', true, 52428800, ARRAY['application/json'])
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read Access on atithi-data" ON storage.objects;
CREATE POLICY "Public Read Access on atithi-data"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'atithi-data');

DROP POLICY IF EXISTS "Public Upload Access on atithi-data" ON storage.objects;
CREATE POLICY "Public Upload Access on atithi-data"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'atithi-data');

DROP POLICY IF EXISTS "Public Update Access on atithi-data" ON storage.objects;
CREATE POLICY "Public Update Access on atithi-data"
ON storage.objects FOR UPDATE TO public
USING (bucket_id = 'atithi-data')
WITH CHECK (bucket_id = 'atithi-data');
