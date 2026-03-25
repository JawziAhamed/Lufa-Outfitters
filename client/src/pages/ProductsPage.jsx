import { useEffect, useMemo, useState } from 'react';

import { EmptyState, Loader, Pagination, ProductCard, SectionHeader } from '../components';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';

const sortCategories = (categories = []) =>
  [...categories].sort((a, b) => {
    if ((a?.sortOrder ?? 0) !== (b?.sortOrder ?? 0)) {
      return (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0);
    }
    return String(a?.name || '').localeCompare(String(b?.name || ''));
  });

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 8,
    search: '',
    category: '',
  });

  const quickCategories = useMemo(() => categories.slice(0, 5), [categories]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productService.getProducts(filters);
      setProducts(data.data || []);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoryLoading(true);
    try {
      const { data } = await categoryService.getCategories({ active: true });
      setCategories(sortCategories(data.data || []));
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters.page, filters.limit, filters.search, filters.category]);

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Collection"
        title="Products"
        description="Browse premium tees, apply filters, and open any product to customize in 3D."
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-3">
          <input
            type="text"
            value={filters.search}
            placeholder="Search by name or style"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
            onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, search: event.target.value }))}
          />
          <select
            value={filters.category}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
            onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, category: event.target.value }))}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={filters.limit}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
            onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, limit: Number(event.target.value) }))}
          >
            <option value={8}>8 / page</option>
            <option value={12}>12 / page</option>
            <option value={16}>16 / page</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-3 bg-gradient-to-r from-slate-50 to-white px-4 pb-4 pt-3">
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, page: 1, category: '' }))}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              !filters.category
                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow'
            }`}
          >
            All
          </button>

          {!categoryLoading
            ? quickCategories.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: 1,
                      category: category._id,
                    }))
                  }
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                    filters.category === category._id
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow'
                  }`}
                >
                  {category.name}
                </button>
              ))
            : null}
        </div>
      </div>

      {loading ? <Loader label="Loading products" /> : null}

      {!loading && products.length === 0 ? (
        <EmptyState title="No products found" description="Try adjusting your search or category filters." />
      ) : null}

      {!loading && products.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : null}

      <Pagination pagination={pagination} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
    </div>
  );
};

export default ProductsPage;
