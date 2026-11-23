import { Product } from '../../types';

export interface CategoryReference {
  id?: string;
  name?: string;
  slug?: string;
  subcategories?: Array<{ id?: string; slug?: string; name?: string }>;
}

/**
 * Checks whether a product is assigned to a category by checking:
 * 1. Category ID match (categoryId, category_id, category.id)
 * 2. Category Slug match (categorySlug, category_slug, category.slug)
 * 3. Category Name match (categoryName, category_name, category.name, category string)
 * 4. Subcategory membership (subcategoryId, subcategorySlug matching any category subcategory)
 * 5. Categories array membership (categories, categoryIds)
 */
export function isProductAssignedToCategory(
  product: Product | any,
  category: CategoryReference | null | undefined
): boolean {
  if (!product || !category) return false;

  const cId = (category.id || '').trim().toLowerCase();
  const cSlug = (category.slug || '').trim().toLowerCase();
  const cName = (category.name || '').trim().toLowerCase();

  const pCatId = (product.categoryId || product.category_id || product.category?.id || '').trim().toLowerCase();
  const pCatSlug = (product.categorySlug || product.category_slug || product.category?.slug || '').trim().toLowerCase();
  const pCatName = (
    product.categoryName ||
    product.category_name ||
    product.category?.name ||
    (typeof product.category === 'string' ? product.category : '') ||
    ''
  ).trim().toLowerCase();

  // Direct ID / Slug / Name match
  if (cId && (pCatId === cId || pCatSlug === cId || pCatName === cId)) return true;
  if (cSlug && (pCatSlug === cSlug || pCatId === cSlug || pCatName === cSlug)) return true;
  if (cName && (pCatName === cName || pCatId === cName || pCatSlug === cName)) return true;

  // Subcategory match
  if (category.subcategories && Array.isArray(category.subcategories)) {
    const subIds = new Set(category.subcategories.map((s) => (s.id || '').trim().toLowerCase()).filter(Boolean));
    const subSlugs = new Set(category.subcategories.map((s) => (s.slug || '').trim().toLowerCase()).filter(Boolean));
    const subNames = new Set(category.subcategories.map((s) => (s.name || '').trim().toLowerCase()).filter(Boolean));

    const pSubId = (product.subcategoryId || product.subcategory_id || product.subcategory?.id || '').trim().toLowerCase();
    const pSubSlug = (product.subcategorySlug || product.subcategory_slug || product.subcategory?.slug || '').trim().toLowerCase();
    const pSubName = (
      product.subcategoryName ||
      product.subcategory_name ||
      product.subcategory?.name ||
      (typeof product.subcategory === 'string' ? product.subcategory : '') ||
      ''
    ).trim().toLowerCase();

    if (pSubId && subIds.has(pSubId)) return true;
    if (pSubSlug && subSlugs.has(pSubSlug)) return true;
    if (pSubName && subNames.has(pSubName)) return true;
  }

  // Categories array match
  const pCategories = Array.isArray(product.categories) ? product.categories : [];
  for (const cat of pCategories) {
    const catStr = (typeof cat === 'string' ? cat : cat?.id || cat?.slug || cat?.name || '').trim().toLowerCase();
    if (catStr && (catStr === cId || catStr === cSlug || catStr === cName)) return true;
  }

  const pCategoryIds = Array.isArray(product.categoryIds) ? product.categoryIds : [];
  for (const catId of pCategoryIds) {
    const idStr = String(catId || '').trim().toLowerCase();
    if (idStr && (idStr === cId || idStr === cSlug)) return true;
  }

  return false;
}
