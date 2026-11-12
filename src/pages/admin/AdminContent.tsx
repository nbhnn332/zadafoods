import React, { useState, useEffect } from 'react';
import { Save, ExternalLink, Eye, Edit3 } from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { Link } from 'react-router-dom';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';

export const AdminContent: React.FC = () => {
  const { storeContent, updateStoreContent } = useAdminData();
  const [selectedSlug, setSelectedSlug] = useState<string>(storeContent[0]?.slug || 'about');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);

  const currentPage = storeContent.find((p) => p.slug === selectedSlug) || storeContent[0];
  const [editedTitle, setEditedTitle] = useState(currentPage?.title || '');
  const [editedContent, setEditedContent] = useState(currentPage?.content || '');

  // Synchronize local input state whenever the authoritative storeContent loads or page changes
  useEffect(() => {
    if (currentPage) {
      setEditedTitle(currentPage.title);
      setEditedContent(currentPage.content);
    }
  }, [currentPage?.slug, currentPage?.title, currentPage?.content]);

  const handleSelectPage = (slug: string) => {
    setSelectedSlug(slug);
    const target = storeContent.find((p) => p.slug === slug);
    if (target) {
      setEditedTitle(target.title);
      setEditedContent(target.content);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPage) return;
    setIsSaving(true);
    try {
      updateStoreContent(currentPage.slug, editedContent, editedTitle);
    } finally {
      setTimeout(() => setIsSaving(false), 400);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary">
            Store Content, Brand Story & Legal Policies
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Maintain customer-facing content for About Us, Contact, FAQs, Shipping, Refunds, and Terms.
          </p>
        </div>

        {currentPage && (
          <Link
            to={currentPage.slug === 'about' ? '/our-story' : `/${currentPage.slug}`}
            target="_blank"
            className="px-3 py-1.5 rounded-btn border border-border-subtle bg-white text-content-primary text-xs font-semibold hover:bg-canvas-subtle flex items-center gap-1.5 shadow-sm self-start"
          >
            <span>Preview Public Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="bg-white rounded-card border border-border-subtle shadow-subtle p-3 space-y-1">
          <p className="px-3 py-1 text-[10px] uppercase font-bold text-content-muted tracking-wider">
            Content Pages ({storeContent.length})
          </p>
          {storeContent.map((page) => (
            <button
              key={page.slug}
              onClick={() => handleSelectPage(page.slug)}
              className={`w-full text-left px-3 py-2 rounded-btn text-xs font-semibold flex items-center justify-between transition-colors ${
                selectedSlug === page.slug
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-content-secondary hover:bg-canvas-subtle'
              }`}
            >
              <span className="truncate">{page.title}</span>
              <span className="text-[10px] opacity-70 font-mono">/{page.slug}</span>
            </button>
          ))}
        </div>

        {/* Content Editor */}
        <div className="md:col-span-3 bg-white rounded-card border border-border-subtle shadow-subtle p-6 space-y-4">
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <span className="text-[10px] text-content-muted font-mono uppercase">
                  Editing: /{currentPage?.slug}
                </span>
                <p className="text-[11px] text-content-muted">Last Updated: {currentPage?.lastUpdated}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex border border-border-subtle rounded-btn overflow-hidden bg-canvas-subtle">
                  <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1 ${
                      activeTab === 'editor' ? 'bg-white shadow-2xs text-brand-primary' : 'text-content-muted'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1 ${
                      activeTab === 'preview' ? 'bg-white shadow-2xs text-brand-primary' : 'text-content-muted'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Markdown Preview</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save & Publish'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-content-primary block mb-1">Page Title</label>
              <input
                type="text"
                required
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-bold"
              />
            </div>

            {activeTab === 'editor' ? (
              <div>
                <label className="font-bold text-content-primary block mb-1">
                  Body Content (Markdown Supported: # Headings, **bold**, *italic*, - bullet lists, 1. numbered lists, &gt; quotes, [links](url))
                </label>
                <textarea
                  rows={16}
                  required
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-mono leading-relaxed"
                  placeholder="Write page content in clean markdown or formatted text..."
                />
              </div>
            ) : (
              <div className="border border-border-subtle rounded-input p-4 bg-canvas-subtle/30 min-h-[300px]">
                <p className="text-[10px] font-bold text-content-muted uppercase tracking-wider mb-2 border-b border-border-subtle pb-1">
                  Live Preview: {editedTitle}
                </p>
                <MarkdownRenderer content={editedContent} />
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
