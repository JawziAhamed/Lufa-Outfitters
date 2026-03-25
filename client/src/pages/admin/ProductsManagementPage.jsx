import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Loader, Pagination, SectionHeader } from '../../components';
import { categoryService } from '../../services/categoryService';
import { productService } from '../../services/productService';
import { currency } from '../../utils/format';
import { resolveProductImageUrl } from '../../utils/image';

const adminListPlaceholder =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='640'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-family='Arial,sans-serif' font-size='28'%3ENo Image%3C/text%3E%3C/svg%3E";

const formDefaults = {
  name: '',
  description: '',
  basePrice: 0,
  stock: 0,
  lowStockThreshold: 10,
  tags: 'custom,tshirt',
  customArtworkAllowed: true,
  isActive: true,
};

const getProductImageUrl = (product) => {
  const resolvedUrl = resolveProductImageUrl(product?.imageUrl);
  if (resolvedUrl) return resolvedUrl;
  return adminListPlaceholder;
};

const sortCategories = (categories = []) =>
  [...categories].sort((a, b) => {
    if ((a?.sortOrder ?? 0) !== (b?.sortOrder ?? 0)) {
      return (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0);
    }
    return String(a?.name || '').localeCompare(String(b?.name || ''));
  });

const resolveCategoryIdsFromProduct = (product, categoriesBySlug) => {
  if (Array.isArray(product?.categories) && product.categories.length) {
    const resolved = product.categories
      .map((category) => (typeof category === 'string' ? category : category?._id))
      .map((value) => (value ? String(value) : ''))
      .filter(Boolean);

    if (resolved.length) return [...new Set(resolved)];
  }

  if (product?.category && categoriesBySlug.has(product.category)) {
    return [categoriesBySlug.get(product.category)._id];
  }

  return [];
};

const getProductCategoryLabels = (product, categoriesById, categoriesBySlug) => {
  const labels = [];

  if (Array.isArray(product?.categories) && product.categories.length) {
    product.categories.forEach((category) => {
      if (typeof category === 'object' && category !== null) {
        if (category.name) {
          labels.push(category.name);
          return;
        }

        if (category._id && categoriesById.has(String(category._id))) {
          labels.push(categoriesById.get(String(category._id)).name);
          return;
        }
      }

      const mappedCategory = categoriesById.get(String(category));
      if (mappedCategory?.name) {
        labels.push(mappedCategory.name);
      }
    });
  }

  if (!labels.length && product?.category) {
    labels.push(categoriesBySlug.get(product.category)?.name || product.category);
  }

  const uniqueLabels = [...new Set(labels.filter(Boolean))];
  return uniqueLabels.length ? uniqueLabels : ['Uncategorized'];
};

const ProductsManagementPage = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState(null);
  const [colorsList, setColorsList] = useState(['#000000', '#ffffff']);
  const [newColor, setNewColor] = useState('');
  const [sizesList, setSizesList] = useState([
    { size: 'M', priceModifier: 0 },
    { size: 'L', priceModifier: 2 },
  ]);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [String(category._id), category])),
    [categories]
  );
  const categoriesBySlug = useMemo(
    () => new Map(categories.map((category) => [String(category.slug), category])),
    [categories]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: formDefaults,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productService.getProducts({ page, limit: 8, active: false });
      setProducts(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const { data } = await categoryService.getCategories({ active: true });
      setCategories(sortCategories(data.data || []));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingProduct || selectedCategoryIds.length > 0 || categories.length === 0) {
      return;
    }

    const defaultCategory = categories.find((category) => category.slug === 'regular-products');
    if (defaultCategory) {
      setSelectedCategoryIds([String(defaultCategory._id)]);
    }
  }, [categories, editingProduct, selectedCategoryIds.length]);

  useEffect(() => {
    if (!editingProduct || selectedCategoryIds.length > 0 || categories.length === 0) {
      return;
    }

    setSelectedCategoryIds(resolveCategoryIdsFromProduct(editingProduct, categoriesBySlug));
  }, [categories.length, categoriesBySlug, editingProduct, selectedCategoryIds.length]);

  const openEdit = (product) => {
    setEditingProduct(product);
    setColorsList(product.colors || []);
    setSizesList(product.sizes || []);
    setSelectedCategoryIds(resolveCategoryIdsFromProduct(product, categoriesBySlug));

    reset({
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
      stock: 0,
      lowStockThreshold: 10,
      tags: (product.tags || []).join(','),
      customArtworkAllowed: product.customArtworkAllowed,
      isActive: product.isActive,
    });
  };

  const clearForm = () => {
    setEditingProduct(null);
    setColorsList(['#000000', '#ffffff']);
    setSizesList([
      { size: 'M', priceModifier: 0 },
      { size: 'L', priceModifier: 2 },
    ]);
    setSelectedCategoryIds(() => {
      const defaultCategory = categories.find((category) => category.slug === 'regular-products');
      return defaultCategory ? [String(defaultCategory._id)] : [];
    });
    reset(formDefaults);
  };

  const toggleCategory = (categoryId) => {
    const normalizedCategoryId = String(categoryId);

    setSelectedCategoryIds((prev) => {
      if (prev.includes(normalizedCategoryId)) {
        return prev.filter((id) => id !== normalizedCategoryId);
      }
      return [...prev, normalizedCategoryId];
    });
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error('Enter a category name first');
      return;
    }

    try {
      const { data } = await categoryService.createCategory({ name });
      const createdCategory = data.category;
      const createdCategoryId = String(createdCategory._id);

      setCategories((prev) => sortCategories([...prev, createdCategory]));
      setSelectedCategoryIds((prev) =>
        prev.includes(createdCategoryId) ? prev : [...prev, createdCategoryId]
      );
      setNewCategoryName('');
      toast.success('Category created');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    }
  };

  const onSubmit = async (payload) => {
    if (!editingProduct && !payload.image?.[0]) {
      toast.error('Product image is required when creating a product.');
      return;
    }

    if (selectedCategoryIds.length === 0) {
      toast.error('Select at least one category');
      return;
    }

    const normalizedSizes = sizesList
      .map((item) => ({
        size: (item.size || '').trim(),
        priceModifier: Number(item.priceModifier || 0),
      }))
      .filter((item) => item.size);

    if (normalizedSizes.length === 0) {
      toast.error('Please add at least one size with a label.');
      return;
    }

    const finalPayload = {
      ...payload,
      basePrice: payload.basePrice ?? 0,
      stock: payload.stock ?? 0,
      lowStockThreshold: payload.lowStockThreshold ?? 0,
      colors: colorsList.join(','),
      sizes: JSON.stringify(normalizedSizes),
      categories: JSON.stringify(selectedCategoryIds),
    };

    const formData = new FormData();

    Object.entries(finalPayload).forEach(([key, value]) => {
      if (key === 'image' && value?.[0]) {
        formData.append('image', value[0]);
      } else if (key !== 'image') {
        formData.append(key, value);
      }
    });

    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, formData);
        toast.success('Product updated');
      } else {
        await productService.createProduct(formData);
        toast.success('Product created');
      }

      clearForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      await productService.deleteProduct(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  return (
    <div>
      <SectionHeader
        title="Products Management"
        description="Create, update, and remove products with stock settings."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="mb-6 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {editingProduct ? 'Edit Product' : 'Create Product'}
        </h3>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <input
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 chars' } })}
              placeholder="Product name"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            {errors.name ? <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p> : null}
          </div>

          <div>
            <input
              type="number"
              step="0.01"
              {...register('basePrice', {
                required: 'Base price is required',
                min: { value: 0, message: 'Must be >= 0' },
                valueAsNumber: true,
              })}
              placeholder="Base price"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            {errors.basePrice ? <p className="mt-1 text-xs text-rose-600">{errors.basePrice.message}</p> : null}
          </div>

          <div className="sm:col-span-2 space-y-2 rounded border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">Categories</p>
              <p className="text-xs text-slate-500">Select one or multiple categories</p>
            </div>

            {categoriesLoading ? (
              <p className="text-xs text-slate-500">Loading categories...</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const categoryId = String(category._id);
                  const isSelected = selectedCategoryIds.includes(categoryId);
                  return (
                    <button
                      key={category._id}
                      type="button"
                      onClick={() => toggleCategory(categoryId)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {category.name}
                    </button>
                  );
                })}
                {categories.length === 0 ? <p className="text-xs text-slate-500">No categories found.</p> : null}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Add new category"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm sm:w-64"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              >
                Create Category
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <textarea
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 10, message: 'Min 10 characters' },
              })}
              placeholder="Description"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={2}
            />
            {errors.description ? <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p> : null}
          </div>

          <div className="sm:col-span-2 space-y-2 rounded border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Colors</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newColor}
                  onChange={(event) => setNewColor(event.target.value)}
                  placeholder="e.g. Black or #000000"
                  className="w-40 rounded border border-slate-300 px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const value = newColor.trim();
                    if (!value || colorsList.includes(value)) return;
                    setColorsList((prev) => [...prev, value]);
                    setNewColor('');
                  }}
                  className="rounded bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {colorsList.map((color) => (
                <span
                  key={color}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  <span
                    className="h-4 w-4 rounded-full border border-slate-300"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                  {color}
                  <button
                    type="button"
                    onClick={() => setColorsList((prev) => prev.filter((item) => item !== color))}
                    className="text-slate-400 hover:text-rose-500"
                    aria-label="Remove color"
                  >
                    x
                  </button>
                </span>
              ))}
              {colorsList.length === 0 ? <span className="text-xs text-slate-500">No colors added yet.</span> : null}
            </div>
          </div>

          <div className="sm:col-span-2 space-y-2 rounded border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Sizes and Price Modifiers</p>
              <button
                type="button"
                onClick={() => setSizesList((prev) => [...prev, { size: '', priceModifier: 0 }])}
                className="rounded bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
              >
                Add size
              </button>
            </div>
            <div className="space-y-2">
              {sizesList.map((row, idx) => (
                <div key={`${row.size}-${idx}`} className="grid gap-2 sm:grid-cols-[1fr,1fr,auto]">
                  <input
                    type="text"
                    value={row.size}
                    onChange={(event) =>
                      setSizesList((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, size: event.target.value } : item))
                      )
                    }
                    placeholder="Size (e.g. M)"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={row.priceModifier}
                    onChange={(event) =>
                      setSizesList((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, priceModifier: event.target.value } : item
                        )
                      )
                    }
                    placeholder="Price modifier"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setSizesList((prev) => prev.filter((_, i) => i !== idx))}
                    className="rounded border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-rose-200 hover:text-rose-600 sm:whitespace-nowrap"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {sizesList.length === 0 ? (
                <p className="text-xs text-slate-500">Add at least one size to enable pricing.</p>
              ) : null}
            </div>
          </div>

          <input
            {...register('tags')}
            placeholder="Tags comma-separated"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="file"
            accept="image/*"
            {...register('image')}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />

          <div>
            <input
              type="number"
              {...register('stock', { valueAsNumber: true, min: { value: 0, message: 'Must be >= 0' } })}
              placeholder="Stock"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            {errors.stock ? <p className="mt-1 text-xs text-rose-600">{errors.stock.message}</p> : null}
          </div>
          <div>
            <input
              type="number"
              {...register('lowStockThreshold', { valueAsNumber: true, min: { value: 0, message: 'Must be >= 0' } })}
              placeholder="Low stock threshold"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            {errors.lowStockThreshold ? (
              <p className="mt-1 text-xs text-rose-600">{errors.lowStockThreshold.message}</p>
            ) : null}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register('customArtworkAllowed')} />
            Custom artwork allowed
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register('isActive')} />
            Active
          </label>
        </div>

        <div className="mt-3 flex gap-2">
          <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            {editingProduct ? 'Update Product' : 'Create Product'}
          </button>
          {editingProduct ? (
            <button
              type="button"
              onClick={clearForm}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>

      {loading ? <Loader label="Loading products" /> : null}

      {!loading ? (
        <div className="space-y-3">
          {products.map((product) => (
            <article
              key={product._id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = adminListPlaceholder;
                    }}
                    className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                  />
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{product.name}</h3>
                    <p className="text-sm text-slate-500">
                      {getProductCategoryLabels(product, categoriesById, categoriesBySlug).join(' | ')}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">{currency(product.basePrice)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Colors: {product.colors?.length || 0} | Sizes: {product.sizes?.length || 0}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product._id)}
                    className="rounded border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
};

export default ProductsManagementPage;
