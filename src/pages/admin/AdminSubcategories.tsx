import React, { useState, useMemo } from 'react';
import {
  FolderTree,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  AlertTriangle,
  Package,
  Layers,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminData } from '../../context/AdminDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Subcategory } from '../../types';

export const AdminSubcategories: React.FC = () => {
  const {
    categories,
    subcategories,
    products,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    toggleSubcategoryActive,
    reorderSubcategories
  } = useAdminData();

  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user ? (user.role === 'admin' || user.email?.toLowerCase().includes('admin')) : true;

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'products'>('order');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [deleteConfirmSub, setDeleteConfirmSub] = useState<Subcategory | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('unassign');

  // Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map category ID to Category Name & Slug
  const categoryMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug: string }>();
    categories.forEach((c) => {
      map.set(c.id, { id: c.id, name: c.name, slug: c.slug });
      map.set(c.slug, { id: c.id, name: c.name, slug: c.slug });
    });
    return map;
  }, [categories]);

  // Compute product counts per subcategory
  const productCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      if (p.subcategoryId) {
        counts.set(p.subcategoryId, (counts.get(p.subcategoryId) || 0) + 1);
      }
    });
    return counts;
  }, [products]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    if (!isAdmin) {
      showToast('Permission Denied', 'Administrator role required to add subcategories.', 'error');
      return;
    }
    const defaultCat = categories[0]?.id || '';
    const catSubs = subcategories.filter((s) => s.categoryId === defaultCat);
    setEditingSubcategory(null);
    setFormName('');
    setFormSlug('');
    setFormCategoryId(defaultCat);
    setFormDescription('');
    setFormDisplayOrder(catSubs.length + 1);
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (sub: Subcategory) => {
    if (!isAdmin) {
      showToast('Permission Denied', 'Administrator role required to edit subcategories.', 'error');
      return;
    }
    setEditingSubcategory(sub);
    setFormName(sub.name);
    setFormSlug(sub.slug);
    setFormCategoryId(sub.categoryId);
    setFormDescription(sub.description || '');
    setFormDisplayOrder(sub.displayOrder);
    setFormIsActive(sub.isActive !== false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Auto-slugify on name change if not editing or slug untouched
  const handleNameChange = (nameVal: string) => {
    setFormName(nameVal);
    if (!editingSubcategory || formSlug === '') {
      const generated = nameVal
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormSlug(generated);
    }
  };

  // Form Validation & Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Permission Denied', 'Administrator privileges required.', 'error');
      return;
    }

    setFormError(null);

    const trimmedName = formName.trim();
    const cleanSlug = formSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');

    if (!trimmedName) {
      setFormError('Subcategory name is required.');
      return;
    }
    if (!cleanSlug) {
      setFormError('URL slug is required.');
      return;
    }
    if (!formCategoryId) {
      setFormError('Please select a parent category.');
      return;
    }

    // Check duplicate name or slug within the selected parent category
    const duplicate = subcategories.find(
      (s) =>
        s.categoryId === formCategoryId &&
        (s.slug.toLowerCase() === cleanSlug || s.name.toLowerCase() === trimmedName.toLowerCase()) &&
        s.id !== editingSubcategory?.id
    );

    if (duplicate) {
      setFormError(
        duplicate.slug.toLowerCase() === cleanSlug
          ? `A subcategory with slug "${cleanSlug}" already exists under this parent category.`
          : `A subcategory named "${trimmedName}" already exists under this parent category.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSubcategory) {
        await updateSubcategory(editingSubcategory.id, {
          name: trimmedName,
          slug: cleanSlug,
          categoryId: formCategoryId,
          description: formDescription.trim(),
          displayOrder: Number(formDisplayOrder),
          isActive: formIsActive
        });
      } else {
        await addSubcategory({
          name: trimmedName,
          slug: cleanSlug,
          categoryId: formCategoryId,
          description: formDescription.trim(),
          displayOrder: Number(formDisplayOrder),
          isActive: formIsActive
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move up/down within same parent category
  const handleMoveOrder = async (sub: Subcategory, direction: 'UP' | 'DOWN') => {
    if (!isAdmin) {
      showToast('Permission Denied', 'Administrator privileges required.', 'error');
      return;
    }

    const sameCatSubs = subcategories
      .filter((s) => s.categoryId === sub.categoryId)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const index = sameCatSubs.findIndex((s) => s.id === sub.id);
    if (index === -1) return;

    if (direction === 'UP' && index > 0) {
      const swapped = [...sameCatSubs];
      const temp = swapped[index];
      swapped[index] = swapped[index - 1];
      swapped[index - 1] = temp;
      await reorderSubcategories(swapped.map((s) => s.id));
    } else if (direction === 'DOWN' && index < sameCatSubs.length - 1) {
      const swapped = [...sameCatSubs];
      const temp = swapped[index];
      swapped[index] = swapped[index + 1];
      swapped[index + 1] = temp;
      await reorderSubcategories(swapped.map((s) => s.id));
    }
  };

  // Prompt delete
  const handleInitiateDelete = (sub: Subcategory) => {
    if (!isAdmin) {
      showToast('Permission Denied', 'Administrator privileges required.', 'error');
      return;
    }
    setDeleteConfirmSub(sub);
    setReassignTargetId('unassign');
  };

  // Confirm delete with optional product reassignment
  const handleConfirmDelete = async () => {
    if (!deleteConfirmSub || !isAdmin) return;
    setIsSubmitting(true);
    try {
      const targetId = reassignTargetId === 'unassign' ? undefined : reassignTargetId;
      await deleteSubcategory(deleteConfirmSub.id, targetId);
      setDeleteConfirmSub(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered & Sorted Subcategories List
  const filteredSubcategories = useMemo(() => {
    return subcategories
      .filter((s) => {
        // Search filter
        if (searchTerm) {
          const query = searchTerm.toLowerCase();
          const catInfo = categoryMap.get(s.categoryId);
          const catName = catInfo?.name.toLowerCase() || '';
          const matches =
            s.name.toLowerCase().includes(query) ||
            s.slug.toLowerCase().includes(query) ||
            (s.description && s.description.toLowerCase().includes(query)) ||
            catName.includes(query);
          if (!matches) return false;
        }

        // Parent Category filter
        if (selectedCategoryFilter !== 'all') {
          if (s.categoryId !== selectedCategoryFilter) return false;
        }

        // Status filter
        if (statusFilter === 'active' && s.isActive === false) return false;
        if (statusFilter === 'inactive' && s.isActive !== false) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'products') {
          const countA = productCountMap.get(a.id) || 0;
          const countB = productCountMap.get(b.id) || 0;
          return countB - countA;
        }
        // Default sort by parent category, then displayOrder
        if (a.categoryId !== b.categoryId) {
          const nameA = categoryMap.get(a.categoryId)?.name || '';
          const nameB = categoryMap.get(b.categoryId)?.name || '';
          return nameA.localeCompare(nameB);
        }
        return a.displayOrder - b.displayOrder;
      });
  }, [subcategories, searchTerm, selectedCategoryFilter, statusFilter, sortBy, categoryMap, productCountMap]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary flex items-center gap-2.5">
            <FolderTree className="w-6 h-6 text-brand-primary" />
            <span>Subcategory Management</span>
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Configure product classification chips, filter slugs, and display hierarchies for category storefronts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-btn text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subcategory</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-card p-3.5 border border-border-subtle shadow-subtle flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-content-muted uppercase tracking-wider font-semibold">Total Subcategories</p>
            <p className="text-base font-bold text-content-primary">{subcategories.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-card p-3.5 border border-border-subtle shadow-subtle flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-content-muted uppercase tracking-wider font-semibold">Active Storefront</p>
            <p className="text-base font-bold text-content-primary">
              {subcategories.filter((s) => s.isActive !== false).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-card p-3.5 border border-border-subtle shadow-subtle flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-content-muted uppercase tracking-wider font-semibold">Linked Products</p>
            <p className="text-base font-bold text-content-primary">
              {products.filter((p) => Boolean(p.subcategoryId)).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-card p-3.5 border border-border-subtle shadow-subtle flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-content-muted uppercase tracking-wider font-semibold">Covered Categories</p>
            <p className="text-base font-bold text-content-primary">
              {new Set(subcategories.map((s) => s.categoryId)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Search, Category Filter, Status Filter & Sorting Toolbar */}
      <div className="bg-white rounded-card p-3.5 border border-border-subtle shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subcategory, slug, description..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-input border border-border-subtle bg-white focus:outline-none focus:border-brand-primary"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-content-secondary">
            <Filter className="w-3.5 h-3.5 text-content-muted" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-btn border border-border-subtle bg-white text-content-primary focus:outline-none focus:border-brand-primary"
            >
              <option value="all">All Parent Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-btn border border-border-subtle bg-white text-content-primary focus:outline-none focus:border-brand-primary"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-btn border border-border-subtle bg-white text-content-primary focus:outline-none focus:border-brand-primary"
          >
            <option value="order">Sort: Display Order</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="products">Sort: Product Count</option>
          </select>
        </div>
      </div>

      {/* Subcategories Table */}
      <div className="bg-white rounded-card border border-border-subtle shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF8F5] text-content-muted uppercase font-bold border-b border-border-subtle tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3 w-16 text-center">Order</th>
                <th className="py-3 px-4">Subcategory</th>
                <th className="py-3 px-4">Parent Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-3 text-center">Products</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredSubcategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-content-muted">
                    <FolderTree className="w-8 h-8 mx-auto text-content-muted/50 mb-2" />
                    <p className="font-semibold text-content-primary">No subcategories found</p>
                    <p className="text-xs text-content-muted mt-1">
                      {searchTerm || selectedCategoryFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try clearing your search or active filter criteria.'
                        : 'Click "Add Subcategory" to create your first subcategory.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubcategories.map((sub) => {
                  const parent = categoryMap.get(sub.categoryId);
                  const pCount = productCountMap.get(sub.id) || 0;
                  const isActive = sub.isActive !== false;

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-canvas-subtle/60 transition-colors"
                      data-testid={`subcategory-row-${sub.slug}`}
                    >
                      {/* Reorder / Display Order */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-mono font-bold text-[11px] text-content-muted w-5">
                            {sub.displayOrder}
                          </span>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(sub, 'UP')}
                              aria-label={`Move ${sub.name} up`}
                              className="p-0.5 text-content-muted hover:text-brand-primary disabled:opacity-20"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(sub, 'DOWN')}
                              aria-label={`Move ${sub.name} down`}
                              className="p-0.5 text-content-muted hover:text-brand-primary disabled:opacity-20"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Name & Slug */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-content-primary text-xs">{sub.name}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-content-muted">
                            <code className="font-mono bg-canvas-subtle px-1 py-0.5 rounded text-[10px]">
                              {sub.slug}
                            </code>
                            {parent && (
                              <Link
                                to={`/category/${parent.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-brand-primary hover:underline text-[10px]"
                                title="Preview storefront category"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Parent Category */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FAF6EE] text-[#A67732] border border-[#EAE5DC]">
                          {parent?.name || sub.categoryId}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-[11px] text-content-secondary line-clamp-2">
                          {sub.description || <span className="text-content-muted italic">No description</span>}
                        </p>
                      </td>

                      {/* Product Count */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pCount > 0
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          {pCount} {pCount === 1 ? 'product' : 'products'}
                        </span>
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSubcategoryActive(sub.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                          aria-label={`Toggle active status for ${sub.name}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(sub)}
                            className="p-1.5 rounded-btn hover:bg-canvas-subtle text-content-secondary hover:text-brand-primary transition-colors"
                            title="Edit subcategory"
                            aria-label={`Edit ${sub.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleInitiateDelete(sub)}
                            className="p-1.5 rounded-btn hover:bg-rose-50 text-content-secondary hover:text-rose-600 transition-colors"
                            title="Delete subcategory"
                            aria-label={`Delete ${sub.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Subcategory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-card shadow-modal max-w-lg w-full overflow-hidden border border-border-subtle">
            <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-brand-primary" />
                <h2 className="font-bold font-serif text-base text-content-primary">
                  {editingSubcategory ? `Edit Subcategory: ${editingSubcategory.name}` : 'Add New Subcategory'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-content-muted hover:text-content-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Parent Category Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-content-primary block">
                  Parent Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle text-content-primary focus:outline-none focus:border-brand-primary"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-content-muted">
                  The storefront category where these subcategory filter pills will appear.
                </p>
              </div>

              {/* Subcategory Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary block">
                    Subcategory Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Banana Chips"
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle text-content-primary focus:outline-none focus:border-brand-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary block">
                    URL Slug <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                    placeholder="e.g. banana-chips"
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle font-mono text-content-primary focus:outline-none focus:border-brand-primary"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-content-primary block">
                  Short Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of this collection (e.g. Traditional Wayanad banana chips fried in pure coconut oil)."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle text-content-primary focus:outline-none focus:border-brand-primary resize-none"
                />
              </div>

              {/* Display Order & Active Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary block">Display Priority / Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle font-mono text-content-primary focus:outline-none focus:border-brand-primary"
                  />
                  <p className="text-[10px] text-content-muted">Lower numbers appear first on storefront pill row.</p>
                </div>

                <div className="pt-4 flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                  <span className="text-xs font-bold text-content-primary">
                    {formIsActive ? 'Published & Active' : 'Draft / Inactive'}
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border-subtle rounded-btn text-xs font-bold text-content-secondary hover:bg-canvas-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-btn text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingSubcategory ? 'Update Subcategory' : 'Save Subcategory'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation & Product Reassignment Modal */}
      {deleteConfirmSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-card shadow-modal max-w-md w-full overflow-hidden border border-border-subtle">
            <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="font-bold font-serif text-base">Delete Subcategory</h2>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmSub(null)}
                className="p-1 rounded text-rose-400 hover:text-rose-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-content-primary leading-relaxed">
                Are you sure you want to delete subcategory <strong>"{deleteConfirmSub.name}"</strong>?
              </p>

              {/* Check dependent products */}
              {(() => {
                const affectedProducts = products.filter((p) => p.subcategoryId === deleteConfirmSub.id);
                const siblingSubs = subcategories.filter(
                  (s) => s.categoryId === deleteConfirmSub.categoryId && s.id !== deleteConfirmSub.id
                );

                if (affectedProducts.length === 0) {
                  return (
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
                      No products are currently assigned to this subcategory. It can be safely removed.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                    <p className="font-bold text-amber-900">
                      ⚠️ {affectedProducts.length} product(s) are currently assigned to this subcategory:
                    </p>
                    <ul className="list-disc list-inside text-amber-800 space-y-0.5 text-[11px] max-h-24 overflow-y-auto">
                      {affectedProducts.map((p) => (
                        <li key={p.id}>{p.name}</li>
                      ))}
                    </ul>

                    <div className="pt-2 border-t border-amber-200 space-y-1">
                      <label className="font-bold text-amber-900 block text-[11px]">
                        Reassign dependent products to:
                      </label>
                      <select
                        value={reassignTargetId}
                        onChange={(e) => setReassignTargetId(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-btn border border-amber-300 bg-white text-content-primary focus:outline-none"
                      >
                        <option value="unassign">Remove subcategory assignment (General Category)</option>
                        {siblingSubs.map((s) => (
                          <option key={s.id} value={s.id}>
                            Reassign to: {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmSub(null)}
                  className="px-4 py-2 border border-border-subtle rounded-btn text-xs font-bold text-content-secondary hover:bg-canvas-subtle"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-btn text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <span>Deleting...</span> : <span>Confirm Delete</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
