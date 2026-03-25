const previewCardStyles =
  'overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-sm';

const previewImageShellStyles =
  'flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100 p-3';

const TShirtPreviewPair = ({
  baseSrc,
  customSrc,
  productName,
  fallbackSrc,
  compact = false,
}) => {
  const mediaHeightClass = compact ? 'h-24 sm:h-28' : 'h-40 sm:h-44 lg:h-48';
  const titleClass = compact
    ? 'px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500'
    : 'border-b border-slate-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500';

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className={previewCardStyles}>
        <p className={titleClass}>Base T-shirt</p>
        <div className={`${previewImageShellStyles} ${mediaHeightClass}`}>
          <img
            src={baseSrc || fallbackSrc}
            alt={`${productName} base`}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackSrc;
            }}
            className="h-full w-full object-contain drop-shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
          />
        </div>
      </div>

      <div className={previewCardStyles}>
        <p className={titleClass}>Custom Design Preview</p>
        <div className={`${previewImageShellStyles} ${mediaHeightClass}`}>
          <img
            src={customSrc || fallbackSrc}
            alt={`${productName} customized preview`}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackSrc;
            }}
            className="h-full w-full object-contain drop-shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
          />
        </div>
      </div>
    </div>
  );
};

export default TShirtPreviewPair;
