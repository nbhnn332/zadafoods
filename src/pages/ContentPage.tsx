import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Mail, Phone } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Footer } from '../components/Footer';

export const ContentPage: React.FC<{ forcedSlug?: string }> = ({ forcedSlug }) => {
  const { slug } = useParams<{ slug: string }>();
  const pageSlug = forcedSlug || slug || 'about';
  const { storeContent, settings } = useAdminData();

  const page = storeContent.find((p) => p.slug === pageSlug) || {
    slug: pageSlug,
    title: 'ZaDa Foods Information',
    content: 'Content is being updated by our editorial team.',
    lastUpdated: '2026-10-27'
  };

  return (
    <div className="min-h-screen bg-canvas pb-20 md:pb-12 text-content-primary">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-brand-primary font-bold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Storefront</span>
        </Link>

        {/* Content Card */}
        <article className="bg-white rounded-card p-6 md:p-8 border border-border-subtle shadow-subtle space-y-6">
          <div className="border-b border-border-subtle pb-4 space-y-1">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-content-primary">
              {page.title}
            </h1>
            <p className="text-xs text-content-muted">
              Official ZaDa Foods Policy • Last Updated {page.lastUpdated}
            </p>
          </div>

          {/* Formatted Markdown/Text Body */}
          <div className="prose prose-sm max-w-none text-content-secondary leading-relaxed space-y-4 whitespace-pre-line text-xs sm:text-sm">
            {page.content}
          </div>

          {/* Support Helpline Box */}
          <div className="pt-6 border-t border-border-subtle/80 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-canvas-subtle p-4 rounded-card text-xs">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-primary shrink-0" />
              <div>
                <p className="text-[10px] text-content-muted">Helpline</p>
                <p className="font-bold text-content-primary">{settings.supportPhone}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-primary shrink-0" />
              <div>
                <p className="text-[10px] text-content-muted">Email Support</p>
                <p className="font-bold text-content-primary">{settings.supportEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0" />
              <div>
                <p className="text-[10px] text-content-muted">FSSAI Certified</p>
                <p className="font-bold text-content-primary font-mono">{settings.fssaiNumber}</p>
              </div>
            </div>
          </div>
        </article>
      </main>

      <Footer />

      <BottomNav />
    </div>
  );
};
