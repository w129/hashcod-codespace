-- Retire the persisted platform-registration intake.
-- User submissions are now local-only and handed off through WhatsApp.
drop table if exists public.hashcod_platform_registrations cascade;
