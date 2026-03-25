const Loader = ({ label = 'Loading...' }) => (
  <div className="flex min-h-[160px] items-center justify-center">
    <div className="flex items-center gap-3 text-slate-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  </div>
);

export default Loader;
