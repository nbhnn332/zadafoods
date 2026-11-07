import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
var SECURITY_HEADERS = {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com; frame-src https://api.razorpay.com https://checkout.razorpay.com; object-src 'none'; base-uri 'self'; form-action 'self'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        headers: SECURITY_HEADERS,
    },
    preview: {
        headers: SECURITY_HEADERS,
    },
    resolve: {
        preserveSymlinks: true,
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
                        return 'vendor-react';
                    }
                    if (id.includes('node_modules/@supabase/')) {
                        return 'vendor-supabase';
                    }
                    if (id.includes('node_modules/lucide-react/')) {
                        return 'vendor-icons';
                    }
                },
            },
        },
    },
    // @ts-ignore
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
    },
});
