import { useMemo } from 'react';

const Pagination = ({ pagination, onPageChange }) => {
  const pages = useMemo(() => {
    if (!pagination) return [];
    return Array.from({ length: pagination.totalPages || 1 }, (_, idx) => idx + 1);
  }, [pagination]);

  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const canGoPrev = pagination.page > 1;
  const canGoNext = pagination.page < pagination.totalPages;

  return (
    <div className="mt-6 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
      <button
        type="button"
        onClick={() => canGoPrev && onPageChange(pagination.page - 1)}
        disabled={!canGoPrev}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
      >
        Prev
      </button>

      <div className="flex flex-1 items-center gap-2 overflow-x-auto px-1">
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`shrink-0 rounded-md border px-3 py-1 text-sm ${
              pagination.page === pageNumber
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            {pageNumber}
          </button>
        ))}
      </div>

        <button
          type="button"
          onClick={() => canGoNext && onPageChange(pagination.page + 1)}
          disabled={!canGoNext}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
        >
          Next
        </button>
    </div>
  );
};

export default Pagination;
