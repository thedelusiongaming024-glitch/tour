-- =============================================================================
-- COMPLETE SUPABASE TABLE PERMISSIONS FOR ATITHI APPLICATION
-- Target Project: https://tcituxdzdqjgslhctncu.supabase.co
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/tcituxdzdqjgslhctncu/sql
-- =============================================================================

-- Ensure RLS allows full backend writes for all remaining tables
ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clearance_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_activities DISABLE ROW LEVEL SECURITY;

-- Verify that public has full access
GRANT ALL ON TABLE public.destinations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tours TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.bookings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.customers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.offers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.testimonials TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.blog_posts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.homepage_blocks TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.payments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.clearance_tickets TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.contact_inquiries TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.operational_alerts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.customer_activities TO anon, authenticated, service_role;
