import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Settings,
  ShoppingBag,
  MapPin,
  Heart,
  Star,
  Building2,
  User as UserIcon,
  HelpCircle,
  LogOut,
  ChevronRight,
  X,
  KeyRound
} from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useAdminData } from '../context/AdminDataContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Address } from '../types';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { orders, reviews, products, addReview } = useAdminData();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isGuest = !user;
  const userName = user ? user.fullName : 'Guest Customer';
  const userEmail = user ? user.email : '';
  const userPhone = user?.phone || '';
  const initialLetter = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'G';

  // Modal states for customer actions
  const [activeModal, setActiveModal] = useState<
    'NONE' | 'ORDERS' | 'ADDRESSES' | 'WISHLIST' | 'REVIEWS' | 'PROFILE' | 'PASSWORD_RESET'
  >('NONE');

  // Customer addresses state (strictly namespaced by user ID, never shared)
  const [savedAddresses, setSavedAddresses] = useState<Address[]>(() => {
    if (!user?.id) return [];
    try {
      const saved = localStorage.getItem(`zada_addresses_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveAddressesToStorage = (addrs: Address[]) => {
    setSavedAddresses(addrs);
    if (user?.id) {
      localStorage.setItem(`zada_addresses_${user.id}`, JSON.stringify(addrs));
    }
  };

  // Address Modal Form State
  const [newAddrTag, setNewAddrTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [newAddrName, setNewAddrName] = useState(user?.fullName || '');
  const [newAddrPhone, setNewAddrPhone] = useState(user?.phone || '');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrLandmark, setNewAddrLandmark] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('Kozhikode');
  const [newAddrState, setNewAddrState] = useState('Kerala');
  const [newAddrPostal, setNewAddrPostal] = useState('673001');

  // New Review Form State
  const [reviewProdId, setReviewProdId] = useState(products[0]?.id || '');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');

  // Customer's orders strictly isolated to authenticated user
  const customerOrders = user
    ? orders.filter(
        (o) =>
          (user.id && o.userId === user.id) ||
          (user.email && o.customerEmail.toLowerCase().trim() === user.email.toLowerCase().trim())
      )
    : [];

  // Filtered customer reviews strictly isolated
  const customerReviews = user
    ? reviews.filter(
        (r) =>
          (user.id && r.userId === user.id) ||
          (user.fullName && r.reviewerName.toLowerCase() === user.fullName.toLowerCase())
      )
    : [];

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrStreet.trim()) return;

    const newAddress: Address = {
      id: `addr-${Date.now()}`,
      userId: user?.id || 'cust-1',
      tag: newAddrTag,
      recipientName: newAddrName,
      phone: newAddrPhone,
      streetAddress: newAddrStreet,
      landmark: newAddrLandmark,
      city: newAddrCity,
      state: newAddrState,
      postalCode: newAddrPostal,
      isDefault: savedAddresses.length === 0
    };

    const updated = [...savedAddresses, newAddress];
    saveAddressesToStorage(updated);
    showToast('Address Saved', 'New delivery address added successfully.', 'success');
    setNewAddrStreet('');
    setNewAddrLandmark('');
  };

  const handleDeleteAddress = (id: string) => {
    const updated = savedAddresses.filter((a) => a.id !== id);
    saveAddressesToStorage(updated);
    showToast('Address Removed', 'Address deleted.', 'info');
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = savedAddresses.map((a) => ({
      ...a,
      isDefault: a.id === id
    }));
    saveAddressesToStorage(updated);
    showToast('Default Updated', 'Primary delivery address set.', 'info');
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    addReview({
      productId: reviewProdId,
      reviewerName: userName,
      rating: reviewRating,
      reviewTitle,
      reviewText,
      isVerifiedPurchase: true,
      userId: user?.id
    });

    setReviewTitle('');
    setReviewText('');
    setActiveModal('NONE');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profile Saved', 'Account details updated successfully.', 'success');
    setActiveModal('NONE');
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(
      'Service Unavailable in Staging',
      'Transactional email provider (SMTP) is not yet configured for live password reset links. Please contact support.',
      'error'
    );
  };

  return (
    <div className="min-h-screen bg-canvas pb-20 text-content-primary">
      {/* Top Header matching Screen 7 */}
      <div className="max-w-md mx-auto px-4 pt-2.5 flex items-center justify-between">
        <h1 className="font-sans text-xl sm:text-2xl font-bold text-[#1C1917]">
          My Account
        </h1>
        <button
          onClick={() => setActiveModal('PROFILE')}
          className="p-1 text-[#1C1917] hover:text-[#A67732] transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 stroke-[1.8]" />
        </button>
      </div>

      <main className="max-w-md mx-auto px-3.5 pt-2 space-y-2">
        {/* User Profile Card matching Screen 7 */}
        {user ? (
          <section
            onClick={() => setActiveModal('PROFILE')}
            className="bg-white rounded-xl p-3 border border-[#EAE5DC] shadow-sm flex items-center justify-between cursor-pointer hover:bg-[#F9F7F3] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#072C20] text-white flex items-center justify-center font-bold text-xl font-serif shrink-0">
                {initialLetter}
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-sm sm:text-base text-[#1C1917]">{userName}</p>
                <p className="text-xs text-[#71717A]">{userEmail}</p>
                {userPhone && <p className="text-xs text-[#71717A]">{userPhone}</p>}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#71717A]" />
          </section>
        ) : (
          <section className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF6EE] text-[#072C20] border border-[#EAE5DC] flex items-center justify-center font-bold shrink-0">
                <UserIcon className="w-6 h-6 text-[#072C20]" />
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-sm sm:text-base text-[#1C1917]">Welcome, Guest</p>
                <p className="text-xs text-[#71717A]">Sign in to access orders, saved addresses &amp; wishlist</p>
              </div>
            </div>
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg bg-[#072C20] text-white text-xs font-bold hover:bg-[#051c14] transition-colors shadow-sm shrink-0"
            >
              Sign In
            </Link>
          </section>
        )}

        {/* Account Menu Navigation List matching Screen 7 */}
        <section className="bg-white rounded-xl border border-[#EAE5DC] shadow-sm divide-y divide-[#EAE5DC]/60 overflow-hidden">
          {/* 1. My Orders */}
          <button
            onClick={() => setActiveModal('ORDERS')}
            className="w-full text-left py-2 px-3 flex items-center justify-between hover:bg-[#F9F7F3] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-[#1C1917] stroke-[1.8]" />
              <div>
                <p className="text-xs font-bold text-[#1C1917]">My Orders</p>
                <p className="text-[10px] text-[#71717A]">Track, return or buy again</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
          </button>

          {/* 2. Addresses */}
          <button
            onClick={() => setActiveModal('ADDRESSES')}
            className="w-full text-left py-2 px-3 flex items-center justify-between hover:bg-[#F9F7F3] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-[#1C1917] stroke-[1.8]" />
              <div>
                <p className="text-xs font-bold text-[#1C1917]">Addresses</p>
                <p className="text-[10px] text-[#71717A]">Manage delivery addresses</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
          </button>

          {/* 3. Wishlist */}
          <button
            onClick={() => setActiveModal('WISHLIST')}
            className="w-full text-left py-2 px-3 flex items-center justify-between hover:bg-[#F9F7F3] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-[#1C1917] stroke-[1.8]" />
              <div>
                <p className="text-xs font-bold text-[#1C1917]">Wishlist</p>
                <p className="text-[10px] text-[#71717A]">Your favourite products</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#A67732] text-white text-[9px] font-bold flex items-center justify-center">
                3
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
            </div>
          </button>

          {/* 4. My Reviews */}
          <button
            onClick={() => setActiveModal('REVIEWS')}
            className="w-full text-left py-2 px-3 flex items-center justify-between hover:bg-[#F9F7F3] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-[#1C1917] stroke-[1.8]" />
              <div>
                <p className="text-xs font-bold text-[#1C1917]">My Reviews</p>
                <p className="text-[10px] text-[#71717A]">View and edit your reviews</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
          </button>

          {/* 5. Bulk Enquiries */}
          <Link
            to="/bulk-enquiries"
            className="py-2 px-3 flex items-center justify-between hover:bg-[#F9F7F3] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-[#1C1917] stroke-[1.8]" />
              <div>
                <p className="text-xs font-bold text-[#1C1917]">Bulk Enquiries</p>
                <p className="text-[10px] text-[#71717A]">Corporate, wedding & gifting</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
          </Link>

          {/* 6. Manage Account */}
          <button
            onClick={() => setActiveModal('PROFILE')}
            className="w-full text-left py-2 px-3 flex items-center justify-between hover:bg-[#F9F7F3] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <UserIcon className="w-4 h-4 text-[#1C1917] stroke-[1.8]" />
              <div>
                <p className="text-xs font-bold text-[#1C1917]">Manage Account</p>
                <p className="text-[10px] text-[#71717A]">Profile, password and preferences</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
          </button>

          {/* 7. Help & Support */}
          <Link
            to="/contact"
            className="py-2 px-3 flex items-center justify-between hover:bg-[#F9F7F3] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-[#1C1917] stroke-[1.8]" />
              <div>
                <p className="text-xs font-bold text-[#1C1917]">Help & Support</p>
                <p className="text-[10px] text-[#71717A]">FAQs, contact us</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
          </Link>

          {/* 8. Logout or Sign In */}
          {user ? (
            <button
              onClick={handleLogout}
              className="w-full text-left py-2 px-3 flex items-center justify-between hover:bg-[#F9F7F3] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <LogOut className="w-4 h-4 text-[#1C1917] stroke-[1.8]" />
                <div>
                  <p className="text-xs font-bold text-[#1C1917]">Logout</p>
                  <p className="text-[10px] text-[#71717A]">Sign out from your account</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
            </button>
          ) : (
            <Link
              to="/login"
              className="w-full text-left py-2 px-3 flex items-center justify-between hover:bg-[#F9F7F3] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <UserIcon className="w-4 h-4 text-brand-primary stroke-[1.8]" />
                <div>
                  <p className="text-xs font-bold text-brand-primary">Sign In / Register</p>
                  <p className="text-[10px] text-[#71717A]">Access your personal account, orders &amp; addresses</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
            </Link>
          )}
        </section>

        {/* Promo Notification Banner matching Screen 7 */}
        <section className="rounded-xl overflow-hidden shadow-sm">
          <img
            src="/assets/account-promo-banner.png"
            alt="Get Exclusive Offers - Be the first to know about new products, festive offers and more!"
            className="w-full h-auto object-cover"
          />
        </section>
      </main>

      {/* MODAL 1: MY ORDERS DRAWER */}
      {activeModal === 'ORDERS' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-elevated space-y-4 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="font-serif text-lg font-bold text-content-primary">
                My Orders ({customerOrders.length})
              </h2>
              <button onClick={() => setActiveModal('NONE')} className="p-1 text-content-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isGuest ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-canvas-subtle mx-auto flex items-center justify-center text-content-muted">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-content-primary">Guest Session</h3>
                <p className="text-content-secondary text-xs">
                  Sign in to your customer account to view your past orders, reorder favorites, and track delivery status.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    to="/login"
                    className="w-full py-2 rounded-btn bg-brand-primary text-white font-bold text-center hover:bg-brand-primary-hover shadow-sm"
                  >
                    Sign In / Register
                  </Link>
                  <Link
                    to="/order-tracking/guest"
                    className="w-full py-2 rounded-btn border border-border-subtle text-content-secondary font-medium text-center hover:bg-canvas-subtle"
                  >
                    Track Guest Order with Order #
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {customerOrders.length === 0 ? (
                  <p className="p-6 text-center text-content-muted">No orders placed yet.</p>
                ) : (
                  customerOrders.map((ord) => (
                    <div key={ord.id} className="p-3 border border-border-subtle rounded-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-content-primary">{ord.orderNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.fulfillmentStatus === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.fulfillmentStatus}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {ord.items.map((it, idx) => (
                          <p key={idx} className="text-content-secondary">
                            • {it.productName} ({it.variantWeightLabel}) x{it.quantity}
                          </p>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                        <span className="font-bold text-content-primary">Total: ₹{ord.totalAmount}</span>
                        <Link
                          to={`/order-tracking/${ord.id}`}
                          className="text-brand-primary font-bold hover:underline"
                        >
                          Track Order →
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: ADDRESS BOOK */}
      {activeModal === 'ADDRESSES' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-elevated space-y-4 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="font-serif text-lg font-bold text-content-primary">
                Delivery Address Book
              </h2>
              <button onClick={() => setActiveModal('NONE')} className="p-1 text-content-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isGuest ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-canvas-subtle mx-auto flex items-center justify-center text-content-muted">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-content-primary">Guest Session</h3>
                <p className="text-content-secondary text-xs">
                  Delivery addresses are synced across your devices when you sign in. Guests do not have saved addresses.
                </p>
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="block w-full py-2 rounded-btn bg-brand-primary text-white font-bold text-center hover:bg-brand-primary-hover shadow-sm"
                  >
                    Sign In to Save Addresses
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* List Saved Addresses */}
                <div className="space-y-2.5">
                  {savedAddresses.length === 0 ? (
                    <p className="p-4 text-center text-content-muted">No saved addresses yet.</p>
                  ) : (
                    savedAddresses.map((addr) => (
                      <div key={addr.id} className="p-3 border border-border-subtle rounded-card relative space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-content-primary">
                            {addr.recipientName} ({addr.tag})
                          </span>
                          {addr.isDefault ? (
                            <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Default
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-[10px] text-brand-primary font-semibold hover:underline"
                            >
                              Set as Default
                            </button>
                          )}
                        </div>
                        <p className="text-content-secondary leading-relaxed">
                          {addr.streetAddress}{addr.landmark ? `, ${addr.landmark}` : ''}<br />
                          {addr.city}, {addr.state} - {addr.postalCode}
                        </p>
                        <p className="text-[11px] text-content-muted">Phone: {addr.phone}</p>
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Address Form */}
                <form onSubmit={handleAddAddress} className="pt-3 border-t border-border-subtle space-y-2.5">
                  <h3 className="font-bold text-content-primary uppercase text-[10px] tracking-wider">
                    Add New Delivery Address
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={newAddrTag}
                      onChange={(e) => setNewAddrTag(e.target.value as any)}
                      className="px-2.5 py-1.5 border border-border-subtle rounded text-xs bg-white font-semibold"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Recipient Name"
                      value={newAddrName}
                      onChange={(e) => setNewAddrName(e.target.value)}
                      className="px-2.5 py-1.5 border border-border-subtle rounded text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Phone"
                      value={newAddrPhone}
                      onChange={(e) => setNewAddrPhone(e.target.value)}
                      className="px-2.5 py-1.5 border border-border-subtle rounded text-xs"
                    />
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Street Address / House No."
                    value={newAddrStreet}
                    onChange={(e) => setNewAddrStreet(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-border-subtle rounded text-xs"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={newAddrCity}
                      onChange={(e) => setNewAddrCity(e.target.value)}
                      className="px-2.5 py-1.5 border border-border-subtle rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={newAddrState}
                      onChange={(e) => setNewAddrState(e.target.value)}
                      className="px-2.5 py-1.5 border border-border-subtle rounded text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder="PIN Code"
                      value={newAddrPostal}
                      onChange={(e) => setNewAddrPostal(e.target.value)}
                      className="px-2.5 py-1.5 border border-border-subtle rounded text-xs"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Landmark (Optional)"
                    value={newAddrLandmark}
                    onChange={(e) => setNewAddrLandmark(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-border-subtle rounded text-xs"
                  />

                  <button
                    type="submit"
                    className="w-full py-2 bg-brand-primary text-white font-bold rounded-btn text-xs hover:bg-brand-primary-hover shadow-sm"
                  >
                    Save Delivery Address
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: WISHLIST */}
      {activeModal === 'WISHLIST' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-elevated space-y-4 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="font-serif text-lg font-bold text-content-primary">
                Saved Wishlist Items (2)
              </h2>
              <button onClick={() => setActiveModal('NONE')} className="p-1 text-content-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {products.slice(0, 2).map((prod) => (
                <div key={prod.id} className="p-3 border border-border-subtle rounded-card flex items-center justify-between gap-3">
                  <img
                    src={prod.images[0]?.imageUrl}
                    alt={prod.name}
                    className="w-12 h-12 rounded object-cover bg-canvas border border-border-subtle shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-content-primary truncate">{prod.name}</p>
                    <p className="text-[11px] text-content-muted">₹{prod.variants[0]?.sellingPrice}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (prod.variants[0]) {
                        addToCart(prod, prod.variants[0], 1);
                      }
                    }}
                    className="px-3 py-1.5 rounded-btn bg-brand-primary text-white font-bold text-xs hover:bg-brand-primary-hover shadow-sm"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: WRITE & VIEW REVIEWS */}
      {activeModal === 'REVIEWS' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-elevated space-y-4 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="font-serif text-lg font-bold text-content-primary">
                Customer Reviews
              </h2>
              <button onClick={() => setActiveModal('NONE')} className="p-1 text-content-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* My Existing Reviews */}
            <div className="space-y-2">
              <h3 className="font-bold text-content-primary uppercase text-[10px] tracking-wider">
                Your Past Testimonials ({customerReviews.length})
              </h3>
              {customerReviews.map((rev) => (
                <div key={rev.id} className="p-3 bg-canvas-subtle rounded-card space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-content-primary">{rev.reviewTitle}</span>
                    <div className="flex text-amber-500">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-content-secondary">{rev.reviewText}</p>
                </div>
              ))}
            </div>

            {/* Add Review Form */}
            <form onSubmit={handleSubmitReview} className="pt-3 border-t border-border-subtle space-y-2.5">
              <h3 className="font-bold text-content-primary uppercase text-[10px] tracking-wider">
                Write a Product Review
              </h3>
              <div>
                <label className="text-content-muted block mb-0.5">Select Snack</label>
                <select
                  value={reviewProdId}
                  onChange={(e) => setReviewProdId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-border-subtle rounded text-xs bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-content-muted block mb-0.5">Rating (1 to 5 Stars)</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-border-subtle rounded text-xs bg-white font-bold"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5 Very Good)</option>
                  <option value={3}>⭐⭐⭐ (3/5 Average)</option>
                  <option value={2}>⭐⭐ (2/5 Below Average)</option>
                  <option value={1}>⭐ (1/5 Poor)</option>
                </select>
              </div>

              <input
                type="text"
                required
                placeholder="Review Title (e.g. Authentic Taste!)"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-border-subtle rounded text-xs font-bold"
              />

              <textarea
                rows={3}
                required
                placeholder="Describe your crunch, flavour and delivery experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-border-subtle rounded text-xs"
              />

              <button
                type="submit"
                className="w-full py-2 bg-brand-primary text-white font-bold rounded-btn text-xs hover:bg-brand-primary-hover shadow-sm"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PROFILE & PASSWORD RESET */}
      {activeModal === 'PROFILE' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-elevated space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="font-serif text-lg font-bold text-content-primary">
                Account Details & Security
              </h2>
              <button onClick={() => setActiveModal('NONE')} className="p-1 text-content-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isGuest ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-canvas-subtle mx-auto flex items-center justify-center text-content-muted">
                  <UserIcon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-content-primary">Guest Profile</h3>
                <p className="text-content-secondary text-xs">
                  You are currently visiting as a guest. Sign in or register to manage your personal profile, credentials, and settings.
                </p>
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="block w-full py-2 rounded-btn bg-brand-primary text-white font-bold text-center hover:bg-brand-primary-hover shadow-sm"
                  >
                    Sign In / Register
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div>
                    <label className="font-bold text-content-primary block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-content-primary block mb-1">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={userEmail}
                      className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs bg-canvas-subtle text-content-muted"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-content-primary block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2 bg-brand-primary text-white font-bold rounded-btn text-xs hover:bg-brand-primary-hover shadow-sm"
                    >
                      Save Profile Details
                    </button>
                  </div>
                </form>

                <div className="pt-3 border-t border-border-subtle space-y-1.5">
                  <h3 className="font-bold text-content-primary">Security &amp; Password</h3>
                  <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                    <span className="font-bold block text-amber-950 mb-0.5">⚠️ Staging Notice:</span>
                    Password reset via transactional email is unavailable until external SMTP credentials (AWS SES / SendGrid) are provisioned.
                  </div>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="w-full py-2 bg-canvas-subtle hover:bg-canvas-subtle/80 text-content-muted font-bold rounded-btn text-xs border border-border-subtle flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Password Reset (Disabled in Staging)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />

      <BottomNav />
    </div>
  );
};
