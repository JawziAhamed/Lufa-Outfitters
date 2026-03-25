const EmptyState = ({ title, description }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
    <h3 className="text-base font-semibold text-slate-800">{title}</h3>
    <p className="mt-2 text-sm text-slate-500">{description}</p>
  </div>
);

export default EmptyState;
