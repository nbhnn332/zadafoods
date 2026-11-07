-- ==============================================================================
-- ZaDa Foods: Global COD Advance Payment Configuration Schema Migration
-- Migration: 20261104000004_global_cod_advance_payment_configuration.sql
-- ==============================================================================
-- Forward-only migration adding global COD advance payment tracking to orders
-- and updating payment_status constraints to support 'ADVANCE_PAID' and 'PARTIALLY_PAID'.
-- ==============================================================================

-- 1. Orders table: Add COD Advance tracking columns
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS cod_advance_amount NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cod_advance_paid NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cod_remaining_amount NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cod_advance_payment_status VARCHAR(32) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS advance_payment_reference VARCHAR(128) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS advance_payment_method VARCHAR(64) DEFAULT NULL;

-- 2. Update payment_status check constraint to permit ADVANCE_PAID & PARTIALLY_PAID
DO $$
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
    ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
        CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'ADVANCE_PAID', 'PARTIALLY_PAID'));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint update notice: %', SQLERRM;
END $$;

-- 3. Ensure store_settings has initial checkout settings for COD advance if unconfigured
INSERT INTO public.store_settings (key, value, description, updated_at)
VALUES (
    'checkout',
    '{
        "isCodGloballyEnabled": true,
        "isCodAdvanceEnabled": false,
        "codAdvanceType": "FIXED",
        "codAdvanceValue": 0,
        "codAdvanceMinOrderValue": 0,
        "codAdvanceMinAmount": 0,
        "codAdvanceMaxAmount": 0,
        "isRazorpayEnabled": true,
        "primaryCheckoutMode": "RAZORPAY",
        "defaultCustomerPaymentMethod": "COD",
        "isWhatsAppAssistedCodEnabled": true
    }'::jsonb,
    'Storefront checkout and payment configuration',
    NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Explicit grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT ON public.orders TO anon;
