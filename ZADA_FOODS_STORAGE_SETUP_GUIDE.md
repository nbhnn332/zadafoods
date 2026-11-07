# ZaDa Foods — Supabase Storage Architecture & Setup Guide

This guide details how to configure production-grade Supabase Storage for the fresh ZaDa Foods Supabase project.

---

## 1. Storage Buckets Overview

ZaDa Foods requires four dedicated public storage buckets:

| Bucket Name | Purpose | Public Read | Max File Size | Allowed MIME Types |
|---|---|---|---|---|
| `product-images` | Catalogue imagery, PDP packaging visuals | Yes | 5 MB | `image/png`, `image/jpeg`, `image/webp` |
| `banners` | Homepage Hero carousel images | Yes | 8 MB | `image/png`, `image/jpeg`, `image/webp` |
| `category-banners` | Category header backdrops and icons | Yes | 5 MB | `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml` |
| `festival-assets` | Festival Theme Manager graphics and motifs | Yes | 5 MB | `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml` |

---

## 2. Automated Storage Setup SQL

Execute the following SQL block in your new Supabase project's **SQL Editor** to automatically create all four buckets with appropriate MIME constraints and Row Level Security policies:

```sql
-- ==============================================================================
-- ZaDa Foods — Supabase Storage Buckets & Policies Initialization
-- ==============================================================================

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
(
    'product-images',
    'product-images',
    true,
    5242880, -- 5 MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg']
),
(
    'banners',
    'banners',
    true,
    8388608, -- 8 MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg']
),
(
    'category-banners',
    'category-banners',
    true,
    5242880, -- 5 MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/svg+xml']
),
(
    'festival-assets',
    'festival-assets',
    true,
    5242880, -- 5 MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Objects RLS Policies

-- Public Read Access for all 4 buckets
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id IN ('product-images', 'banners', 'category-banners', 'festival-assets'));

-- Admin Upload Access
DROP POLICY IF EXISTS "Admins can upload storage objects" ON storage.objects;
CREATE POLICY "Admins can upload storage objects"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id IN ('product-images', 'banners', 'category-banners', 'festival-assets')
        AND (
            public.is_admin() = true
            OR public.is_super_admin() = true
        )
    );

-- Admin Update Access
DROP POLICY IF EXISTS "Admins can update storage objects" ON storage.objects;
CREATE POLICY "Admins can update storage objects"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id IN ('product-images', 'banners', 'category-banners', 'festival-assets')
        AND (
            public.is_admin() = true
            OR public.is_super_admin() = true
        )
    );

-- Admin Delete Access
DROP POLICY IF EXISTS "Admins can delete storage objects" ON storage.objects;
CREATE POLICY "Admins can delete storage objects"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id IN ('product-images', 'banners', 'category-banners', 'festival-assets')
        AND (
            public.is_admin() = true
            OR public.is_super_admin() = true
        )
    );
```

---

## 3. Manual Dashboard Configuration (Alternative)

If you prefer using the Supabase UI:
1. Navigate to **Storage** in the left sidebar of your Supabase Dashboard.
2. Click **New Bucket**.
3. Create each bucket:
   - Name: `product-images` → Toggle **Public Bucket: ON** → Save.
   - Name: `banners` → Toggle **Public Bucket: ON** → Save.
   - Name: `category-banners` → Toggle **Public Bucket: ON** → Save.
   - Name: `festival-assets` → Toggle **Public Bucket: ON** → Save.
4. Navigate to **Configuration -> Policies** to verify that read access is public and write access is restricted to authenticated admins.

---

## 4. Frontend CDN URL Resolution

Public asset URLs generated from these buckets follow this standard format:

```text
https://<YOUR-NEW-PROJECT-REF>.supabase.co/storage/v1/object/public/<BUCKET-NAME>/<FILE-PATH>
```

Example for a product image:
```text
https://xyzcompany.supabase.co/storage/v1/object/public/product-images/banana-chips-250g.png
```
