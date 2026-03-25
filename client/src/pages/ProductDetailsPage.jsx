import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { Loader, SectionHeader, ThreeDCustomizer } from '../components';
import { productService } from '../services/productService';
import { useCartStore } from '../store/cartStore';
import { currency } from '../utils/format';
import { resolveProductImageUrl } from '../utils/image';

const NO_IMAGE_DATA_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='640'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-family='Arial,sans-serif' font-size='28'%3ENo Image%3C/text%3E%3C/svg%3E";

const ProductDetailsPage = () => {
  const { id } = useParams();
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customization, setCustomization] = useState({});
  const customizerRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await productService.getProductById(id);
        setProduct(data.product);
        setInventory(data.inventory);
        setSelectedSize(data.product.sizes?.[0]?.size || '');
        setSelectedColor(data.product.colors?.[0] || '');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    const sizeMatch = product.sizes?.find((size) => size.size === selectedSize);
    return Number(product.basePrice) + Number(sizeMatch?.priceModifier || 0);
  }, [product, selectedSize]);

  const handleAddToCart = async () => {
    if (!product) return;

    const exportedCustomization = await customizerRef.current?.exportCustomization?.();
    const finalCustomization = {
      ...(exportedCustomization || customization || {}),
      shirtColor: exportedCustomization?.shirtColor || selectedColor || '#FFFFFF',
      baseProductImage: product.imageUrl || '',
      customPreviewImage:
        exportedCustomization?.customPreviewImage || customization?.customPreviewImage || '',
    };

    addItem({
      productId: product._id,
      productName: product.name,
      quantity,
      size: selectedSize,
      color: selectedColor,
      unitPrice,
      baseProductImage: product.imageUrl || '',
      customPreviewImage: finalCustomization.customPreviewImage || '',
      customization: finalCustomization,
    });

    toast.success('Added to cart');
  };

  if (loading) {
    return <Loader label="Loading product" />;
  }

  if (!product) {
    return <p className="text-sm text-slate-500">Product not found.</p>;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Product"
        title={product.name}
        description={product.description || 'Premium fabric, sharp prints, crafted for your design.'}
      />

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start xl:gap-8">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-4 sm:p-6 md:p-8">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <p className="relative z-10 mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              Base T-Shirt
            </p>
            <div className="relative z-10 flex h-[clamp(20rem,45vw,34rem)] items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/5 p-4 sm:p-6">
              <img
                src={resolveProductImageUrl(product.imageUrl)}
                alt={product.name}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = NO_IMAGE_DATA_URL;
                }}
                className="h-full w-full max-w-[30rem] rounded-2xl object-contain shadow-2xl transition duration-500 hover:-translate-y-1"
              />
            </div>
            <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-2 text-white/80">
              <span className="text-sm">Stock: {inventory?.stock ?? 0}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                Base {currency(product.basePrice)}
              </span>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Size</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.sizes?.map((sizeOption) => {
                    const isActive = selectedSize === sizeOption.size;
                    return (
                      <button
                        key={sizeOption.size}
                        type="button"
                        onClick={() => setSelectedSize(sizeOption.size)}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          isActive
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        {sizeOption.size} ({currency(product.basePrice + Number(sizeOption.priceModifier || 0))})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Color</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.colors?.map((color) => {
                    const isActive = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                          isActive
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Quantity
                <input
                  type="number"
                  min={1}
                  max={inventory?.stock || 1}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unit Price</p>
                <p className="text-2xl font-extrabold text-slate-900">{currency(unitPrice)}</p>
                <p className="text-xs text-slate-500">Auto-updates with size modifiers.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              Add to Cart
            </button>
          </div>
        </div>

        <ThreeDCustomizer
          ref={customizerRef}
          value={customization}
          onChange={setCustomization}
          templates={product.defaultTemplates || []}
        />
      </div>
    </div>
  );
};

export default ProductDetailsPage;
