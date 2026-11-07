import React, { useState } from 'react';
import { Star, Pin, Trash2, CheckCircle2, Search, Filter, Plus, Edit2, X } from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { Review } from '../../types';

export const AdminReviews: React.FC = () => {
  const {
    reviews,
    toggleReviewFeatured,
    updateReviewApproval,
    deleteReview,
    addReview,
    updateReview,
    products
  } = useAdminData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');

  // Add Review Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addProductId, setAddProductId] = useState('');
  const [addProductSearch, setAddProductSearch] = useState('');
  const [addReviewerName, setAddReviewerName] = useState('');
  const [addRating, setAddRating] = useState<number>(5);
  const [addTitle, setAddTitle] = useState('');
  const [addText, setAddText] = useState('');
  const [addIsApproved, setAddIsApproved] = useState(true);
  const [addIsVerified, setAddIsVerified] = useState(true);

  // Edit Review Modal State
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editProductId, setEditProductId] = useState('');
  const [editProductSearch, setEditProductSearch] = useState('');
  const [editReviewerName, setEditReviewerName] = useState('');
  const [editRating, setEditRating] = useState<number>(5);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editIsApproved, setEditIsApproved] = useState(true);
  const [editIsVerified, setEditIsVerified] = useState(true);

  const filteredReviews = reviews.filter((rev) => {
    const matchesSearch =
      rev.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rev.reviewTitle && rev.reviewTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      rev.reviewText.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'approved' && rev.isApproved) ||
      (filterStatus === 'hidden' && !rev.isApproved) ||
      (filterStatus === 'featured' && rev.isFeaturedOnPdp);

    const matchesRating = filterRating === 'all' || rev.rating === Number(filterRating);

    return matchesSearch && matchesStatus && matchesRating;
  });

  const handleOpenAdd = () => {
    setAddProductId(products[0]?.id || '');
    setAddProductSearch('');
    setAddReviewerName('');
    setAddRating(5);
    setAddTitle('');
    setAddText('');
    setAddIsApproved(true);
    setAddIsVerified(true);
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addProductId || !addReviewerName.trim() || !addText.trim()) return;

    addReview({
      productId: addProductId,
      reviewerName: addReviewerName.trim(),
      rating: addRating,
      reviewTitle: addTitle.trim() || undefined,
      reviewText: addText.trim(),
      isVerifiedPurchase: addIsVerified,
      isApproved: addIsApproved
    });

    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (rev: Review) => {
    setEditingReview(rev);
    setEditProductId(rev.productId);
    setEditProductSearch('');
    setEditReviewerName(rev.reviewerName);
    setEditRating(rev.rating);
    setEditTitle(rev.reviewTitle || '');
    setEditText(rev.reviewText);
    setEditIsApproved(rev.isApproved);
    setEditIsVerified(rev.isVerifiedPurchase);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview || !editReviewerName.trim() || !editText.trim()) return;

    updateReview(editingReview.id, {
      productId: editProductId,
      reviewerName: editReviewerName.trim(),
      rating: editRating,
      reviewTitle: editTitle.trim() || undefined,
      reviewText: editText.trim(),
      isApproved: editIsApproved,
      isVerifiedPurchase: editIsVerified
    });

    setEditingReview(null);
  };

  const filteredAddProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(addProductSearch.toLowerCase()) ||
      p.categorySlug.toLowerCase().includes(addProductSearch.toLowerCase())
  );

  const filteredEditProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(editProductSearch.toLowerCase()) ||
      p.categorySlug.toLowerCase().includes(editProductSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary">
            Customer Reviews & Moderation
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Audit customer feedback, approve verified testimonials, and pin top reviews to Product Detail Pages.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-subtle transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Review</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-card p-3 border border-border-subtle shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reviews by customer name, title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-content-muted" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-input border border-border-subtle text-content-primary bg-white focus:outline-none"
          >
            <option value="all">All Moderation States</option>
            <option value="approved">Approved for Public Display</option>
            <option value="hidden">Hidden / Pending</option>
            <option value="featured">Pinned to PDP</option>
          </select>

          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-input border border-border-subtle text-content-primary bg-white focus:outline-none"
          >
            <option value="all">All Star Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-card border border-border-subtle shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas-subtle text-content-muted uppercase font-bold border-b border-border-subtle">
              <tr>
                <th className="py-3 px-4">Reviewer</th>
                <th className="py-3 px-4">Target Product</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Testimonial Content</th>
                <th className="py-3 px-4">Pin (PDP)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-content-muted">
                    No reviews match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((rev) => {
                  const targetProd = products.find((p) => p.id === rev.productId);

                  return (
                    <tr key={rev.id} className="hover:bg-canvas-subtle/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-content-primary">{rev.reviewerName}</p>
                        <p className="text-[10px] text-content-muted">{rev.createdAt}</p>
                        {rev.isVerifiedPurchase && (
                          <span className="text-[9px] text-emerald-700 font-semibold flex items-center gap-0.5 mt-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-content-primary max-w-[140px] truncate">
                        {targetProd?.name || 'Kerala Banana Chips'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="font-bold text-content-primary">{rev.reviewTitle}</p>
                        <p className="text-content-secondary line-clamp-2 mt-0.5 leading-relaxed">
                          {rev.reviewText}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleReviewFeatured(rev.id)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                            rev.isFeaturedOnPdp
                              ? 'bg-amber-100 text-amber-800 font-bold border border-amber-300'
                              : 'bg-canvas-subtle text-content-muted hover:text-content-primary'
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                          <span>{rev.isFeaturedOnPdp ? 'Pinned' : 'Pin'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rev.isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {rev.isApproved ? 'Approved' : 'Hidden'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(rev)}
                          className="p-1 rounded text-content-muted hover:text-brand-primary"
                          title="Edit Review"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {rev.isApproved ? (
                          <button
                            onClick={() => updateReviewApproval(rev.id, false)}
                            className="px-2.5 py-1 rounded border border-border-subtle text-xs text-rose-600 hover:bg-rose-50"
                          >
                            Hide
                          </button>
                        ) : (
                          <button
                            onClick={() => updateReviewApproval(rev.id, true)}
                            className="px-2.5 py-1 rounded bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-sm"
                          >
                            Approve
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (confirm('Delete this review permanently?')) {
                              deleteReview(rev.id);
                            }
                          }}
                          className="p-1 rounded text-content-muted hover:text-rose-600"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Review Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-lg w-full p-5 space-y-4 shadow-elevated border border-border-subtle animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="font-bold text-sm text-content-primary">Add Product Review</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-content-muted hover:text-content-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5 text-xs">
              {/* Product Selector with Search */}
              <div>
                <label className="block font-bold text-content-secondary mb-1">Select Target Product *</label>
                <input
                  type="text"
                  placeholder="Type to filter products..."
                  value={addProductSearch}
                  onChange={(e) => setAddProductSearch(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none mb-1.5"
                />
                <select
                  value={addProductId}
                  onChange={(e) => setAddProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none bg-white font-medium"
                  required
                >
                  {filteredAddProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.categorySlug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reviewer Name */}
              <div>
                <label className="block font-bold text-content-secondary mb-1">Customer / Reviewer Name *</label>
                <input
                  type="text"
                  value={addReviewerName}
                  onChange={(e) => setAddReviewerName(e.target.value)}
                  placeholder="e.g. Anjali Nair"
                  className="w-full px-3 py-2 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none"
                  required
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block font-bold text-content-secondary mb-1">Rating (1 to 5 Stars) *</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setAddRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= addRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-bold text-content-primary">{addRating} Star{addRating > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block font-bold text-content-secondary mb-1">Review Headline / Title</label>
                <input
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="e.g. Authentic Kerala flavour, loved it!"
                  className="w-full px-3 py-2 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none"
                />
              </div>

              {/* Review Text */}
              <div>
                <label className="block font-bold text-content-secondary mb-1">Review Content / Description *</label>
                <textarea
                  value={addText}
                  onChange={(e) => setAddText(e.target.value)}
                  placeholder="Detailed customer testimonial..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none"
                  required
                />
              </div>

              {/* Status & Verified Buyer */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addIsVerified}
                    onChange={(e) => setAddIsVerified(e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="font-semibold text-content-primary">Verified Buyer badge</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-content-secondary">Status:</span>
                  <select
                    value={addIsApproved ? 'approved' : 'hidden'}
                    onChange={(e) => setAddIsApproved(e.target.value === 'approved')}
                    className="px-2.5 py-1 text-xs rounded border border-border-subtle bg-white font-bold"
                  >
                    <option value="approved">Approved (Public)</option>
                    <option value="hidden">Hidden (Pending)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-btn border border-border-subtle text-content-secondary hover:bg-canvas-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-btn bg-brand-primary text-white font-bold hover:bg-brand-primary-hover shadow-subtle"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-lg w-full p-5 space-y-4 shadow-elevated border border-border-subtle animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="font-bold text-sm text-content-primary">Edit Review</h3>
              <button onClick={() => setEditingReview(null)} className="p-1 text-content-muted hover:text-content-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              {/* Product Selector with Search */}
              <div>
                <label className="block font-bold text-content-secondary mb-1">Target Product</label>
                <input
                  type="text"
                  placeholder="Filter products..."
                  value={editProductSearch}
                  onChange={(e) => setEditProductSearch(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none mb-1.5"
                />
                <select
                  value={editProductId}
                  onChange={(e) => setEditProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none bg-white font-medium"
                >
                  {filteredEditProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.categorySlug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reviewer Name */}
              <div>
                <label className="block font-bold text-content-secondary mb-1">Reviewer Name *</label>
                <input
                  type="text"
                  value={editReviewerName}
                  onChange={(e) => setEditReviewerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none"
                  required
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block font-bold text-content-secondary mb-1">Rating *</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setEditRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= editRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-bold text-content-primary">{editRating} Star{editRating > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block font-bold text-content-secondary mb-1">Review Headline / Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none"
                />
              </div>

              {/* Review Text */}
              <div>
                <label className="block font-bold text-content-secondary mb-1">Review Content *</label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none"
                  required
                />
              </div>

              {/* Status & Verified Buyer */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsVerified}
                    onChange={(e) => setEditIsVerified(e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="font-semibold text-content-primary">Verified Buyer</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-content-secondary">Status:</span>
                  <select
                    value={editIsApproved ? 'approved' : 'hidden'}
                    onChange={(e) => setEditIsApproved(e.target.value === 'approved')}
                    className="px-2.5 py-1 text-xs rounded border border-border-subtle bg-white font-bold"
                  >
                    <option value="approved">Approved</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-3 py-1.5 rounded-btn border border-border-subtle text-content-secondary hover:bg-canvas-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-btn bg-brand-primary text-white font-bold hover:bg-brand-primary-hover shadow-subtle"
                >
                  Update Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
