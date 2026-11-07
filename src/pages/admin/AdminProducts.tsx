import React, { useState } from 'react';
import {
  Plus,
  Star,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  FolderTree,
  X,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { Product, ProductVariant, Category } from '../../types';

export const AdminProducts: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductPublish,
    addCategory,
    deleteCategory
  } = useAdminData();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Delete Confirmation States
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeletingCategory(true);
    try {
      const res = await deleteCategory(categoryToDelete.id);
      if (res.success) {
        setCategoryToDelete(null);
      }
    } finally {
      setIsDeletingCategory(false);
    }
  };

  // Form State for Product Create / Edit
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tagline: '',
    categoryId: categories[0]?.id || '',
    categorySlug: categories[0]?.slug || '',
    description: '',
    ingredients: '',
    storageInstructions: 'Store in a cool, dry place in an airtight container.',
    shelfLifeDays: 90,
    isPreservativeFree: true,
    isCoconutOilMade: true,
    isBestseller: false,
    isOnOffer: false,
    isCodEligible: true,
    isPublished: true,
    imageUrl: '',
    variants: [
      {
        id: `var-new-1`,
        productId: '',
        sku: 'ZDF-NEW-250G',
        weightValue: 250,
        weightUnit: 'g' as const,
        weightLabel: '250 g',
        sellingPrice: 150,
        mrp: 180,
        discountPercentage: 16,
        stockQuantity: 50,
        lowStockThreshold: 10,
        isDefault: true
      }
    ] as ProductVariant[]
  });

  // Form State for Category Create
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newCategoryImg, setNewCategoryImg] = useState('');

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.variants.some((v) => v.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || p.categoryId === selectedCategory || p.categorySlug === selectedCategory;

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'published' && p.isPublished) ||
      (selectedStatus === 'draft' && !p.isPublished);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      tagline: '',
      categoryId: categories[0]?.id || '',
      categorySlug: categories[0]?.slug || '',
      description: '',
      ingredients: 'Raw Kerala Nendran Bananas, Cold-Pressed Coconut Oil, Pure Rock Salt.',
      storageInstructions: 'Store in a cool, dry place in an airtight container.',
      shelfLifeDays: 90,
      isPreservativeFree: true,
      isCoconutOilMade: true,
      isBestseller: false,
      isOnOffer: false,
      isCodEligible: true,
      isPublished: true,
      imageUrl: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=600&q=80',
      variants: [
        {
          id: `var-${Date.now()}-250g`,
          productId: '',
          sku: 'ZDF-NEW-250G',
          weightValue: 250,
          weightUnit: 'g',
          weightLabel: '250 g',
          sellingPrice: 150,
          mrp: 180,
          discountPercentage: 16,
          stockQuantity: 50,
          lowStockThreshold: 10,
          isDefault: true
        }
      ]
    });
    setIsProductModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      slug: p.slug,
      tagline: p.tagline || '',
      categoryId: p.categoryId,
      categorySlug: p.categorySlug,
      description: p.description,
      ingredients: p.ingredients || '',
      storageInstructions: p.storageInstructions || 'Store in a cool, dry place.',
      shelfLifeDays: p.shelfLifeDays || 90,
      isPreservativeFree: p.isPreservativeFree,
      isCoconutOilMade: p.isCoconutOilMade,
      isBestseller: p.isBestseller,
      isOnOffer: p.isOnOffer,
      isCodEligible: p.isCodEligible,
      isPublished: p.isPublished,
      imageUrl: p.images[0]?.imageUrl || '',
      variants: [...p.variants]
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) return;

    const matchedCat = categories.find((c) => c.id === formData.categoryId);
    const categorySlug = matchedCat ? matchedCat.slug : formData.categorySlug;

    const images = [
      {
        id: `img-${Date.now()}`,
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=600&q=80',
        altText: formData.name,
        displayOrder: 1,
        isPrimary: true
      }
    ];

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        slug: formData.slug,
        tagline: formData.tagline,
        categoryId: formData.categoryId,
        categorySlug,
        description: formData.description,
        ingredients: formData.ingredients,
        storageInstructions: formData.storageInstructions,
        shelfLifeDays: Number(formData.shelfLifeDays),
        isPreservativeFree: formData.isPreservativeFree,
        isCoconutOilMade: formData.isCoconutOilMade,
        isBestseller: formData.isBestseller,
        isOnOffer: formData.isOnOffer,
        isCodEligible: formData.isCodEligible,
        isPublished: formData.isPublished,
        images,
        variants: formData.variants
      });
    } else {
      addProduct({
        name: formData.name,
        slug: formData.slug,
        tagline: formData.tagline,
        categoryId: formData.categoryId,
        categorySlug,
        description: formData.description,
        ingredients: formData.ingredients,
        storageInstructions: formData.storageInstructions,
        shelfLifeDays: Number(formData.shelfLifeDays),
        isPreservativeFree: formData.isPreservativeFree,
        isCoconutOilMade: formData.isCoconutOilMade,
        isBestseller: formData.isBestseller,
        isOnOffer: formData.isOnOffer,
        isCodEligible: formData.isCodEligible,
        isPublished: formData.isPublished,
        images,
        variants: formData.variants
      });
    }

    setIsProductModalOpen(false);
  };

  const addVariantRow = () => {
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: editingProduct?.id || '',
      sku: `ZDF-${formData.slug.toUpperCase().slice(0, 4)}-500G`,
      weightValue: 500,
      weightUnit: 'g',
      weightLabel: '500 g',
      sellingPrice: 280,
      mrp: 320,
      discountPercentage: 12,
      stockQuantity: 40,
      lowStockThreshold: 10,
      isDefault: false
    };
    setFormData((prev) => ({ ...prev, variants: [...prev.variants, newVariant] }));
  };

  const removeVariantRow = (index: number) => {
    if (formData.variants.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const slug = newCategorySlug.trim() || newCategoryName.toLowerCase().replace(/\s+/g, '-');
    addCategory({
      name: newCategoryName,
      slug,
      description: newCategoryDesc || `Handcrafted Kerala ${newCategoryName} made with authentic recipes.`,
      imageUrl: newCategoryImg || 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=300&q=80',
      displayOrder: categories.length + 1,
      subcategories: []
    });

    setNewCategoryName('');
    setNewCategorySlug('');
    setNewCategoryDesc('');
    setNewCategoryImg('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary">
            Products & Categories Catalog
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Full control over multi-variant pack sizes, ingredient declarations, pricing, and category hierarchies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3 py-2 rounded-btn border border-border-subtle bg-white text-content-primary text-xs font-semibold hover:bg-canvas-subtle flex items-center gap-1.5 shadow-sm"
          >
            <FolderTree className="w-4 h-4 text-content-muted" />
            <span>Manage Categories ({categories.length})</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold flex items-center gap-1.5 hover:bg-brand-primary-hover shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-card p-3 border border-border-subtle shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-content-muted" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-input border border-border-subtle text-content-primary bg-white focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-input border border-border-subtle text-content-primary bg-white focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-card border border-border-subtle shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas-subtle text-content-muted uppercase font-bold border-b border-border-subtle">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Pack Sizes & Stock</th>
                <th className="py-3 px-4">COD Allowed</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-canvas-subtle/50 transition-colors">
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <img
                      src={product.images?.[0]?.imageUrl || (product as any).imageUrl || '/assets/prod-banana-chips-hero.png'}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover bg-canvas shrink-0 border border-border-subtle"
                    />
                    <div>
                      <p className="font-bold text-sm text-content-primary">{product.name}</p>
                      <p className="text-[11px] text-content-muted line-clamp-1">{product.tagline}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {product.isCoconutOilMade && (
                          <span className="text-[9px] bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                            Coconut Oil
                          </span>
                        )}
                        {product.isPreservativeFree && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                            No Preservatives
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-content-secondary capitalize">
                    {product.categorySlug}
                  </td>

                  <td className="py-3.5 px-4 space-y-1">
                    {product.variants.map((v) => (
                      <div key={v.id} className="text-[11px] text-content-secondary">
                        <span className="font-bold text-content-primary">{v.weightLabel}</span>: ₹{v.sellingPrice}{' '}
                        <span
                          className={`font-semibold ${
                            v.stockQuantity <= v.lowStockThreshold
                              ? 'text-rose-600'
                              : 'text-content-muted'
                          }`}
                        >
                          (Stock: {v.stockQuantity})
                        </span>
                      </div>
                    ))}
                  </td>

                  <td className="py-3.5 px-4">
                    {product.isCodEligible ? (
                      <span className="text-emerald-700 font-bold">Yes</span>
                    ) : (
                      <span className="text-rose-600 font-bold">Prepaid Only</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 font-bold text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{product.averageRating}</span>
                      <span className="text-content-muted text-[10px]">({product.reviewCount})</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        product.isPublished
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-content-muted/20 text-content-muted'
                      }`}
                    >
                      {product.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => toggleProductPublish(product.id)}
                        className="p-1.5 rounded text-content-muted hover:text-content-primary hover:bg-canvas-subtle"
                        title={product.isPublished ? 'Unpublish' : 'Publish'}
                      >
                        {product.isPublished ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-1.5 rounded text-content-muted hover:text-brand-primary hover:bg-canvas-subtle"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setProductToDelete(product)}
                        className="p-1.5 rounded text-content-muted hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Edit / Create Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-card max-w-3xl w-full p-6 shadow-elevated space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="font-serif text-lg font-bold text-content-primary">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-content-muted hover:text-content-primary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Product Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-content-primary block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                    placeholder="e.g. Kerala Banana Chips (Nendran)"
                  />
                </div>

                <div>
                  <label className="font-bold text-content-primary block mb-1">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                    placeholder="e.g. kerala-banana-chips-nendran"
                  />
                </div>

                <div>
                  <label className="font-bold text-content-primary block mb-1">Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => {
                      const cat = categories.find((c) => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        categoryId: e.target.value,
                        categorySlug: cat ? cat.slug : ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-content-primary block mb-1">Tagline</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                    placeholder="Crisped in pure cold-pressed coconut oil"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-content-primary block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  placeholder="Detailed culinary and preparation story..."
                />
              </div>

              {/* Ingredients & Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-content-primary block mb-1">Ingredients Declaration</label>
                  <input
                    type="text"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                    placeholder="e.g. Raw Bananas, Pure Coconut Oil, Salt"
                  />
                </div>

                <div>
                  <label className="font-bold text-content-primary block mb-1">Shelf Life (Days)</label>
                  <input
                    type="number"
                    value={formData.shelfLifeDays}
                    onChange={(e) => setFormData({ ...formData, shelfLifeDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-content-primary block mb-1">Image URL</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  placeholder="https://..."
                />
              </div>

              {/* Checkbox Flags */}
              <div className="flex flex-wrap gap-4 pt-1 border-t border-border-subtle/60">
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.isCoconutOilMade}
                    onChange={(e) => setFormData({ ...formData, isCoconutOilMade: e.target.checked })}
                    className="rounded text-brand-primary"
                  />
                  <span>100% Coconut Oil</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.isPreservativeFree}
                    onChange={(e) => setFormData({ ...formData, isPreservativeFree: e.target.checked })}
                    className="rounded text-brand-primary"
                  />
                  <span>Preservative Free</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.isCodEligible}
                    onChange={(e) => setFormData({ ...formData, isCodEligible: e.target.checked })}
                    className="rounded text-brand-primary"
                  />
                  <span>Cash on Delivery (COD) Allowed</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="rounded text-brand-primary"
                  />
                  <span>Publish to Storefront</span>
                </label>
              </div>

              {/* Variants & SKUs Section */}
              <div className="pt-2 border-t border-border-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase text-content-secondary tracking-wider">
                    Pack Sizes & Variant Pricing (SKUs)
                  </h3>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="text-xs text-brand-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Pack Variant</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-2.5 bg-canvas-subtle rounded-card items-center text-[11px]"
                    >
                      <div>
                        <label className="text-content-muted block text-[10px]">Pack Label</label>
                        <input
                          type="text"
                          value={v.weightLabel}
                          onChange={(e) => {
                            const updated = [...formData.variants];
                            updated[idx] = { ...updated[idx], weightLabel: e.target.value };
                            setFormData({ ...formData, variants: updated });
                          }}
                          className="w-full px-2 py-1 border border-border-subtle rounded text-xs"
                          placeholder="500 g"
                        />
                      </div>

                      <div>
                        <label className="text-content-muted block text-[10px]">SKU Code</label>
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => {
                            const updated = [...formData.variants];
                            updated[idx] = { ...updated[idx], sku: e.target.value };
                            setFormData({ ...formData, variants: updated });
                          }}
                          className="w-full px-2 py-1 border border-border-subtle rounded text-xs"
                          placeholder="ZDF-SKU-1"
                        />
                      </div>

                      <div>
                        <label className="text-content-muted block text-[10px]">Selling Price (₹)</label>
                        <input
                          type="number"
                          value={v.sellingPrice}
                          onChange={(e) => {
                            const updated = [...formData.variants];
                            updated[idx] = { ...updated[idx], sellingPrice: Number(e.target.value) };
                            setFormData({ ...formData, variants: updated });
                          }}
                          className="w-full px-2 py-1 border border-border-subtle rounded text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-content-muted block text-[10px]">MRP (₹)</label>
                        <input
                          type="number"
                          value={v.mrp}
                          onChange={(e) => {
                            const updated = [...formData.variants];
                            updated[idx] = { ...updated[idx], mrp: Number(e.target.value) };
                            setFormData({ ...formData, variants: updated });
                          }}
                          className="w-full px-2 py-1 border border-border-subtle rounded text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-content-muted block text-[10px]">Stock Qty</label>
                        <input
                          type="number"
                          value={v.stockQuantity}
                          onChange={(e) => {
                            const updated = [...formData.variants];
                            updated[idx] = { ...updated[idx], stockQuantity: Math.max(0, Number(e.target.value)) };
                            setFormData({ ...formData, variants: updated });
                          }}
                          className="w-full px-2 py-1 border border-border-subtle rounded text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-end pt-3">
                        {formData.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariantRow(idx)}
                            className="text-rose-500 hover:text-rose-700 text-xs p-1"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-btn border border-border-subtle text-xs font-semibold text-content-primary hover:bg-canvas-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-sm"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Drawer / Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-2xl w-full p-6 shadow-elevated space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="font-serif text-lg font-bold text-content-primary">
                Category Hierarchy Management
              </h2>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-content-muted hover:text-content-primary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Categories List */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase text-content-secondary tracking-wider">
                Current Categories ({categories.length})
              </h3>
              <div className="divide-y divide-border-subtle border border-border-subtle rounded-card overflow-hidden">
                {categories.map((c) => (
                  <div key={c.id} className="p-3 flex items-center justify-between text-xs hover:bg-canvas-subtle/50">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        className="w-10 h-10 rounded-lg object-cover bg-canvas shrink-0"
                      />
                      <div>
                        <p className="font-bold text-content-primary">{c.name}</p>
                        <p className="text-[11px] text-content-muted">Slug: /{c.slug}</p>
                      </div>
                    </div>
                    <button
                      data-testid={`delete-category-${c.id}-btn`}
                      onClick={() => setCategoryToDelete(c)}
                      className="p-1 text-content-muted hover:text-rose-600 rounded"
                      title={`Delete category ${c.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Category Form */}
            <form onSubmit={handleCreateCategory} className="pt-3 border-t border-border-subtle space-y-3 text-xs">
              <h3 className="font-bold text-xs uppercase text-content-secondary tracking-wider">
                Create New Category
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="Category Name (e.g. Traditional Murukku)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="px-3 py-2 border border-border-subtle rounded-input text-xs"
                />
                <input
                  type="text"
                  placeholder="Slug (e.g. murukku)"
                  value={newCategorySlug}
                  onChange={(e) => setNewCategorySlug(e.target.value)}
                  className="px-3 py-2 border border-border-subtle rounded-input text-xs"
                />
              </div>

              <input
                type="text"
                placeholder="Description"
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
              />

              <input
                type="text"
                placeholder="Category Image URL (https://...)"
                value={newCategoryImg}
                onChange={(e) => setNewCategoryImg(e.target.value)}
                className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
              />

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-primary text-white font-bold rounded-btn text-xs hover:bg-brand-primary-hover shadow-sm"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-canvas-card rounded-2xl border border-border shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-content-primary">
                  Delete Product
                </h3>
                <p className="text-xs text-content-muted">
                  Are you sure you want to delete <span className="font-semibold text-content-primary">"{productToDelete.name}"</span>?
                </p>
              </div>
            </div>

            <div className="p-3 bg-canvas-subtle rounded-xl text-xs space-y-1.5 border border-border-subtle">
              <div className="flex justify-between text-content-muted">
                <span>Category:</span>
                <span className="font-medium text-content-primary">{productToDelete.categorySlug}</span>
              </div>
              <div className="flex justify-between text-content-muted">
                <span>Variants:</span>
                <span className="font-medium text-content-primary">{productToDelete.variants?.length || 0} variant(s)</span>
              </div>
              <div className="flex justify-between text-content-muted">
                <span>Database Sync:</span>
                <span className="font-medium text-emerald-600">Supabase PostgreSQL</span>
              </div>
            </div>

            <p className="text-[11px] text-content-muted leading-relaxed">
              If this product was previously purchased in customer orders, it will be safely archived (marked inactive and unpublished) to protect order history integrity. Otherwise, it will be permanently deleted.
            </p>

            <div className="flex justify-end items-center gap-2 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeletingProduct}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-border-subtle text-content-secondary hover:bg-canvas-subtle disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-delete-product-btn"
                onClick={handleConfirmDeleteProduct}
                disabled={isDeletingProduct}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {isDeletingProduct ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Modal */}
      {categoryToDelete && (() => {
        const assignedProducts = products.filter((p) => p.categoryId === categoryToDelete.id);
        const hasAssigned = assignedProducts.length > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-canvas-card rounded-2xl border border-border shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-xl shrink-0 ${hasAssigned ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-lg text-content-primary">
                    {hasAssigned ? 'Cannot Delete Category' : 'Delete Category'}
                  </h3>
                  <p className="text-xs text-content-muted">
                    Category: <span className="font-semibold text-content-primary">"{categoryToDelete.name}"</span> (/{categoryToDelete.slug})
                  </p>
                </div>
              </div>

              {hasAssigned ? (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 space-y-2">
                    <p className="font-semibold text-amber-900">
                      Cannot delete category with assigned products.
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      There are <span className="font-bold">{assignedProducts.length} product(s)</span> currently assigned to this category. Foreign key constraints and catalog integrity prevent deleting this category until all assigned products are either reassigned to another category or deleted.
                    </p>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    <p className="text-[11px] font-semibold text-content-muted uppercase tracking-wider">Assigned Products:</p>
                    {assignedProducts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-canvas-subtle text-xs border border-border-subtle">
                        <span className="font-medium text-content-primary truncate">{p.name}</span>
                        <span className="text-[10px] text-content-muted font-mono">{p.slug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-content-secondary leading-relaxed">
                    Are you sure you want to delete this category? This will permanently remove it from Supabase PostgreSQL and storefront navigation.
                  </p>
                  <div className="p-3 bg-canvas-subtle rounded-xl text-xs space-y-1 border border-border-subtle">
                    <div className="flex justify-between text-content-muted">
                      <span>Category Name:</span>
                      <span className="font-medium text-content-primary">{categoryToDelete.name}</span>
                    </div>
                    <div className="flex justify-between text-content-muted">
                      <span>Slug:</span>
                      <span className="font-mono text-content-primary">/{categoryToDelete.slug}</span>
                    </div>
                    <div className="flex justify-between text-content-muted">
                      <span>Assigned Products:</span>
                      <span className="font-medium text-emerald-600">0 products</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end items-center gap-2 pt-2 border-t border-border-subtle">
                {hasAssigned ? (
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-primary text-white hover:bg-brand-primary-hover shadow-sm"
                  >
                    Understood / Close
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(null)}
                      disabled={isDeletingCategory}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-border-subtle text-content-secondary hover:bg-canvas-subtle disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      data-testid="confirm-delete-category-btn"
                      onClick={handleConfirmDeleteCategory}
                      disabled={isDeletingCategory}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                      {isDeletingCategory ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Category</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
