const SectionHeader = ({
  title,
  description,
  action,
  eyebrow,
  centered = false,
  compact = false,
  className = '',
}) => {
  const alignClass = centered ? 'text-center sm:text-center' : 'text-left';
  const wrapClass = compact
    ? 'mb-4'
    : 'mb-5 border-b border-slate-200 pb-4 sm:mb-6';

  return (
    <div
      className={`${wrapClass} flex flex-col gap-3 ${centered ? 'items-center' : ''} sm:flex-row sm:items-end ${
        centered ? 'sm:justify-center' : 'sm:justify-between'
      } ${className}`}
    >
      <div className={alignClass}>
        {eyebrow ? (
          <p className="mb-2 inline-flex rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-500">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className={`${centered ? '' : 'w-full sm:w-auto'}`}>{action}</div> : null}
    </div>
  );
};

export default SectionHeader;
