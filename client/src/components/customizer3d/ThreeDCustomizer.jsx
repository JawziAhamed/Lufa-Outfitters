import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';

import { aiService } from '../../services/aiService';
import { useAuthStore } from '../../store/authStore';
import { resolveProductImageUrl } from '../../utils/image';
import CanvasPreview from './CanvasPreview';

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const defaultCustomization = {
  shirtColor: '#0f172a',
  logoDecal: '/threejs.png',
  fullDecal: '',
  showLogo: true,
  showFull: false,
  customPreviewImage: '',
  logoPlacement: {
    x: 0,
    y: 0.04,
    scale: 0.15,
    rotation: 0,
  },
  note: '',
};

const mergeCustomization = (base = {}, incoming = {}) => {
  const source = incoming && typeof incoming === 'object' ? incoming : {};
  return {
    ...base,
    ...source,
    logoPlacement: {
      ...(base.logoPlacement || defaultCustomization.logoPlacement),
      ...(source.logoPlacement && typeof source.logoPlacement === 'object' ? source.logoPlacement : {}),
    },
  };
};

const stableEqual = (a, b) => JSON.stringify(a || {}) === JSON.stringify(b || {});

const capturePreviewDataUrl = (containerNode, format = 'image/jpeg', quality = 0.86) => {
  const canvas = containerNode?.querySelector?.('canvas');
  if (!canvas) return '';
  try {
    return canvas.toDataURL(format, quality);
  } catch {
    return '';
  }
};

const ThreeDCustomizer = forwardRef(({ value, onChange, templates = [] }, ref) => {
  const [config, setConfig] = useState(() => mergeCustomization(defaultCustomization, value || {}));
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'controls' (mobile modal tabs)

  const hasAuthToken = useAuthStore((state) => Boolean(state.token));
  const previewRef = useRef(null);
  const modalPreviewRef = useRef(null);

  const updateConfig = useCallback(
    (updater) => {
      setConfig((prev) => {
        const nextDraft = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        const next = mergeCustomization(defaultCustomization, nextDraft);
        onChange?.(next);
        return next;
      });
    },
    [onChange]
  );

  useEffect(() => {
    if (!value || typeof value !== 'object') return;
    setConfig((prev) => {
      const next = mergeCustomization(defaultCustomization, value);
      return stableEqual(prev, next) ? prev : next;
    });
  }, [value]);

  // Close modal on Escape key
  useEffect(() => {
    if (!isModalOpen) return;
    const handler = (e) => { if (e.key === 'Escape') setIsModalOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isModalOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  const exportCustomization = useCallback(() => {
    // Prefer modal canvas (larger/higher quality) if modal is open
    const activeRef = isModalOpen ? modalPreviewRef : previewRef;
    const previewDataUrl = capturePreviewDataUrl(activeRef.current, 'image/jpeg', 0.86);
    return {
      ...config,
      customPreviewImage: previewDataUrl || config.customPreviewImage || '',
      logoPlacement: { ...config.logoPlacement },
    };
  }, [config, isModalOpen]);

  useImperativeHandle(
    ref,
    () => ({
      exportCustomization,
      capturePreview: () => capturePreviewDataUrl(previewRef.current, 'image/jpeg', 0.86),
    }),
    [exportCustomization]
  );

  const handleUpload = async (event, field) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
      return;
    }
    try {
      const dataUrl = await toBase64(file);
      updateConfig((prev) => ({
        ...prev,
        [field]: dataUrl,
        ...(field === 'logoDecal'
          ? { showLogo: true, showFull: false }
          : { showFull: true, showLogo: false }),
      }));
      toast.success(field === 'logoDecal' ? 'Logo uploaded' : 'Full design uploaded');
    } catch {
      toast.error('Failed to read uploaded image.');
    } finally {
      event.target.value = '';
    }
  };

  const handleGenerateAI = async (type) => {
    if (!prompt.trim()) { toast.error('Enter a prompt first'); return; }
    if (!hasAuthToken) { toast.error('Login required for AI generation'); return; }
    try {
      setGenerating(true);
      const { data } = await aiService.generateDesign({ prompt });
      const imageData = `data:image/png;base64,${data.photo}`;
      if (type === 'logo') {
        updateConfig((prev) => ({ ...prev, logoDecal: imageData, showLogo: true, showFull: false }));
      } else {
        updateConfig((prev) => ({ ...prev, fullDecal: imageData, showFull: true, showLogo: false }));
      }
      toast.success('AI design generated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate AI design');
    } finally {
      setGenerating(false);
    }
  };

  const handlePlacementChange = (field, val) => {
    updateConfig((prev) => ({
      ...prev,
      logoPlacement: { ...prev.logoPlacement, [field]: Number(val) },
    }));
  };

  const handleCapturePreview = (sourceRef) => {
    const ref = sourceRef || previewRef;
    const dataUrl = capturePreviewDataUrl(ref.current, 'image/jpeg', 0.86);
    if (!dataUrl) { toast.error('Unable to capture preview'); return; }
    updateConfig((prev) => ({ ...prev, customPreviewImage: dataUrl }));
    toast.success('Customization preview captured');
  };

  const downloadPreview = (sourceRef) => {
    const ref = sourceRef || previewRef;
    const dataUrl =
      capturePreviewDataUrl(ref.current, 'image/png', 0.92) || config.customPreviewImage;
    if (!dataUrl) { toast.error('Preview is not ready yet'); return; }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'customized-shirt-preview.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Inline render function (not a React component) to avoid remount issues ──
  // Called directly as {renderControls(refForButtons)} in both page and modal.
  const renderControls = (activeRef) => (
    <>
      {/* Shirt Color */}
      <label className="block text-sm font-medium text-slate-700">
        Shirt Color
        <input
          type="color"
          value={config.shirtColor}
          onChange={(e) => updateConfig((prev) => ({ ...prev, shirtColor: e.target.value }))}
          className="mt-2 h-10 w-full cursor-pointer rounded border border-slate-300"
        />
      </label>

      {/* Upload */}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700">
          Upload Logo
          <input
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-xs"
            onChange={(e) => handleUpload(e, 'logoDecal')}
          />
        </label>
        <label className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700">
          Upload Full Design
          <input
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-xs"
            onChange={(e) => handleUpload(e, 'fullDecal')}
          />
        </label>
      </div>

      {/* Toggle visibility */}
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => updateConfig((prev) => ({ ...prev, showLogo: !prev.showLogo }))}
          className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
            config.showLogo ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {config.showLogo ? 'Logo: On' : 'Logo: Off'}
        </button>
        <button
          type="button"
          onClick={() => updateConfig((prev) => ({ ...prev, showFull: !prev.showFull }))}
          className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
            config.showFull ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {config.showFull ? 'Full Design: On' : 'Full Design: Off'}
        </button>
      </div>

      {/* Logo Placement */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Logo Placement
        </p>
        <div className="space-y-3">
          {[
            { label: 'Horizontal', field: 'x', min: -0.5, max: 0.5, step: 0.01, display: config.logoPlacement.x.toFixed(2) },
            { label: 'Vertical', field: 'y', min: -0.2, max: 0.35, step: 0.01, display: config.logoPlacement.y.toFixed(2) },
            { label: 'Scale', field: 'scale', min: 0.05, max: 0.5, step: 0.01, display: config.logoPlacement.scale.toFixed(2) },
            { label: 'Rotation', field: 'rotation', min: -180, max: 180, step: 1, display: `${Math.round(config.logoPlacement.rotation)}°` },
          ].map(({ label, field, min, max, step, display }) => (
            <label key={field} className="block text-xs text-slate-600">
              <div className="mb-1 flex justify-between">
                <span>{label}</span>
                <span className="font-mono font-semibold text-slate-800">{display}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={config.logoPlacement[field]}
                onChange={(e) => handlePlacementChange(field, e.target.value)}
                className="w-full accent-slate-900"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Templates */}
      {templates.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Templates</p>
          <div className="grid grid-cols-3 gap-2">
            {templates.slice(0, 6).map((template, index) => (
              <button
                key={`${template}-${index}`}
                type="button"
                onClick={() =>
                  updateConfig((prev) => ({
                    ...prev,
                    logoDecal: resolveProductImageUrl(template),
                    showLogo: true,
                    showFull: false,
                  }))
                }
                className="overflow-hidden rounded-lg border-2 border-transparent transition hover:border-slate-400"
              >
                <img
                  src={resolveProductImageUrl(template)}
                  alt={`template-${index + 1}`}
                  className="h-16 w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Design */}
      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI Design Generator</p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Describe your design idea (e.g. a dragon on fire)..."
          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleGenerateAI('logo')}
            disabled={generating}
            className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'AI Logo'}
          </button>
          <button
            type="button"
            onClick={() => handleGenerateAI('full')}
            disabled={generating}
            className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'AI Full Design'}
          </button>
        </div>
      </div>

      {/* Notes */}
      <textarea
        value={config.note}
        onChange={(e) => updateConfig((prev) => ({ ...prev, note: e.target.value }))}
        rows={2}
        placeholder="Customization notes for the printing team…"
        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      />

      {/* Saved preview thumbnail */}
      {config.customPreviewImage && (
        <div className="rounded-lg border border-slate-200 p-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Saved Preview
          </p>
          <img
            src={resolveProductImageUrl(config.customPreviewImage)}
            alt="Saved customization preview"
            className="h-24 w-full rounded bg-slate-50 object-contain"
          />
        </div>
      )}

      {/* Capture / Download */}
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleCapturePreview(activeRef)}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Capture Preview
        </button>
        <button
          type="button"
          onClick={() => downloadPreview(activeRef)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Download Preview
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Inline component on product page (layout unchanged) ─────── */}
      <div className="min-w-0 space-y-5">

        {/* Preview card — clickable to open modal */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Click to open full-screen customizer"
          onClick={() => setIsModalOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsModalOpen(true); }}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-4 sm:p-6 md:p-8">
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />
            <p className="relative z-10 mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              3D Customized Preview
            </p>
            <div ref={previewRef} className="relative z-10 min-w-0">
              <CanvasPreview customization={config} />
            </div>

            {/* Hover badge */}
            <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-end p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M13.28 7.78l3.22-3.22v2.69a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.69l-3.22 3.22a.75.75 0 001.06 1.06zM2 17.25v-4.5a.75.75 0 011.5 0v2.69l3.22-3.22a.75.75 0 011.06 1.06L4.56 16.5h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" />
                </svg>
                Open Customizer
              </span>
            </div>
          </div>
        </div>

        {/* Controls panel */}
        <div className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            3D Customization Studio
          </h3>
          {renderControls(previewRef)}
        </div>
      </div>

      {/* ── Full-screen modal ─────────────────────────────────────────── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 backdrop-blur-sm sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div className="relative flex h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[92vh] sm:flex-row">

            {/* Close button */}
            <button
              type="button"
              aria-label="Close customizer"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-lg font-bold text-white transition hover:bg-black/60"
            >
              ✕
            </button>

            {/* ── Left: 3D Preview panel ──────────────────────────────── */}
            <div className="relative flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 sm:w-[58%]">
              <div
                className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
              />

              {/* Mobile tab switcher */}
              <div className="relative z-10 flex border-b border-white/10 sm:hidden">
                {['preview', 'controls'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition ${
                      activeTab === tab ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    {tab === 'preview' ? '3D Preview' : 'Customizer'}
                  </button>
                ))}
              </div>

              {/* Preview canvas */}
              <div
                className={`relative z-10 flex flex-1 flex-col p-4 sm:flex sm:p-6 ${
                  activeTab !== 'preview' ? 'hidden sm:flex' : 'flex'
                }`}
              >
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  Real-time 3D Preview — drag to rotate
                </p>
                <div ref={modalPreviewRef} className="min-h-0 flex-1">
                  <CanvasPreview
                    customization={config}
                    containerClassName="h-full min-h-[280px] w-full overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-b from-slate-50 via-white to-slate-100 shadow-inner"
                  />
                </div>
                <p className="mt-3 text-center text-[11px] text-white/50">
                  Click "Open Customizer" tab on mobile to edit ·  Changes reflect instantly
                </p>
              </div>
            </div>

            {/* ── Right: Controls panel ────────────────────────────────── */}
            <div
              className={`flex flex-col sm:flex sm:w-[42%] ${
                activeTab !== 'controls' ? 'hidden sm:flex' : 'flex'
              }`}
            >
              <div className="border-b border-slate-200 px-5 py-3">
                <h2 className="text-sm font-bold text-slate-900">3D Customization Studio</h2>
                <p className="text-xs text-slate-500">All changes reflect on the preview in real-time</p>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-5 pb-6">
                {renderControls(modalPreviewRef)}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
});

ThreeDCustomizer.displayName = 'ThreeDCustomizer';

export default ThreeDCustomizer;
