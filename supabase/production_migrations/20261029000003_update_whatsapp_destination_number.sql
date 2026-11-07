-- ============================================================================
-- ZaDa Foods — Phase 15A: Global Authoritative WhatsApp Destination Update
-- Migration: 20261029000003_update_whatsapp_destination_number.sql
-- ============================================================================

-- Update store_settings checkout and support records to 917593959235
UPDATE public.store_settings
SET value = jsonb_set(
    jsonb_set(
        COALESCE(value, '{}'::jsonb),
        '{whatsappNumber}',
        '"917593959235"'
    ),
    '{whatsAppDestinationNumber}',
    '"917593959235"'
)
WHERE key = 'checkout';

-- Update compliance / contact store_settings if present
UPDATE public.store_settings
SET value = jsonb_set(
    COALESCE(value, '{}'::jsonb),
    '{supportWhatsApp}',
    '"+91 75939 59235"'
)
WHERE key = 'compliance';

-- Update contact page content to authoritative phone number
UPDATE public.store_content_pages
SET content = REPLACE(content, '+91 98765 43210', '+91 75939 59235')
WHERE slug = 'contact';
