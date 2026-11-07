import React, { useState } from 'react';
import { MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Footer } from '../components/Footer';
import { useAdminData } from '../context/AdminDataContext';
import { normalizeWhatsAppNumber, DISPLAY_WHATSAPP_DESTINATION } from '../lib/commerce/whatsappRouting';

export const BulkEnquiriesPage: React.FC = () => {
  const { submitBulkEnquiry, settings } = useAdminData();
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] = useState<'Corporate Gifting' | 'Wedding' | 'Festive Hamper' | 'Wholesale'>('Corporate Gifting');
  const [estimatedQuantity, setEstimatedQuantity] = useState(50);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitBulkEnquiry({
      fullName,
      organizationName,
      email,
      phone,
      eventType,
      estimatedQuantity: Number(estimatedQuantity),
      message
    });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-canvas pb-24 md:pb-12 text-content-primary">
      <Header title="Bulk & Gifting" showBack={true} showSearch={false} />

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        <section className="bg-brand-secondary text-white rounded-card p-6 shadow-elevated text-center space-y-2">
          <div className="flex justify-center">
            <img
              src="/assets/brand-emblem.png"
              alt="ZaDa Foods"
              className="w-12 h-12 object-contain drop-shadow"
            />
          </div>
          <h1 className="font-serif text-2xl font-bold">Corporate & Wedding Gifting</h1>
          <p className="text-xs text-white/80 max-w-md mx-auto">
            Custom-branded Kerala delicacy hampers, festive gift boxes, and bulk snack orders tailored for special occasions.
          </p>
        </section>

        {submitted ? (
          <div className="bg-white rounded-card p-8 border border-border-subtle shadow-subtle text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-status-success mx-auto" />
            <h2 className="text-lg font-bold font-serif text-content-primary">Enquiry Received!</h2>
            <p className="text-xs text-content-secondary max-w-sm mx-auto">
              Thank you, {fullName}. Our corporate team will reach out to {phone} within 24 hours with custom pricing.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-3 px-5 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold"
            >
              Submit Another Enquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-content-primary">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-content-primary">Organization / Company</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Company or Family Name"
                  className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-content-primary">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-content-primary">Phone / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-content-primary">Occasion / Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle"
                >
                  <option value="Corporate Gifting">Corporate Gifting</option>
                  <option value="Wedding">Wedding Favors</option>
                  <option value="Festive Hamper">Festive Gift Hamper</option>
                  <option value="Wholesale">Wholesale / Retail</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-content-primary">Estimated Quantity (Units)</label>
                <input
                  type="number"
                  min="20"
                  value={estimatedQuantity}
                  onChange={(e) => setEstimatedQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-content-primary">Requirements / Customization Notes</label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mention required delivery date, customized packaging notes, or specific items requested..."
                className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-btn bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold shadow flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Bulk Enquiry</span>
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-content-muted">Or chat directly with our bulk manager:</p>
              <a
                href={`https://wa.me/${normalizeWhatsAppNumber(settings.whatsAppDestinationNumber || settings.supportWhatsApp)}?text=${encodeURIComponent("Hi ZaDa Foods, I'm interested in a bulk enquiry.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline mt-1"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp ({DISPLAY_WHATSAPP_DESTINATION})</span>
              </a>
            </div>
          </form>
        )}
      </main>

      <Footer />

      <BottomNav />
    </div>
  );
};
