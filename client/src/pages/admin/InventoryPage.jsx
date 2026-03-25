import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Loader, Pagination, SectionHeader } from '../../components';
import { inventoryService } from '../../services/inventoryService';

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data } = await inventoryService.getInventory({ page, limit: 10 });
      setItems(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page]);

  const handleUpdate = async (item) => {
    try {
      await inventoryService.updateInventory(item._id, {
        stock: Number(item.stock),
        lowStockThreshold: Number(item.lowStockThreshold),
      });
      toast.success('Inventory updated');
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update inventory');
    }
  };

  const handleFieldChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div>
      <SectionHeader
        title="Inventory"
        description="Track stock levels, edit thresholds, and monitor low-stock alerts."
      />

      {loading ? <Loader label="Loading inventory" /> : null}

      {!loading ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <article key={item._id} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{item.product?.name}</h3>
                  <p className="text-xs text-slate-500">Threshold: {item.lowStockThreshold}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:flex">
                  <input
                    type="number"
                    value={item.stock}
                    onChange={(event) => handleFieldChange(index, 'stock', event.target.value)}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm sm:w-24"
                  />
                  <input
                    type="number"
                    value={item.lowStockThreshold}
                    onChange={(event) => handleFieldChange(index, 'lowStockThreshold', event.target.value)}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm sm:w-24"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdate(item)}
                    className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Save
                  </button>
                </div>
              </div>

              {Number(item.stock) <= Number(item.lowStockThreshold) ? (
                <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                  Low stock alert
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
};

export default InventoryPage;
