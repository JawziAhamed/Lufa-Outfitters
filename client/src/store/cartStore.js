import { create } from 'zustand';

const initialItemsRaw = localStorage.getItem('cart_items');
const initialItems = initialItemsRaw ? JSON.parse(initialItemsRaw) : [];

const persistItems = (items) => {
  localStorage.setItem('cart_items', JSON.stringify(items));
};

export const useCartStore = create((set, get) => ({
  items: initialItems,

  addItem: (item) => {
    const items = [...get().items];
    const existing = items.find(
      (cartItem) =>
        cartItem.productId === item.productId &&
        cartItem.size === item.size &&
        cartItem.color === item.color &&
        JSON.stringify(cartItem.customization || {}) === JSON.stringify(item.customization || {})
    );

    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      items.push({
        ...item,
        quantity: item.quantity || 1,
      });
    }

    persistItems(items);
    set({ items });
  },

  updateItemQuantity: (index, quantity) => {
    const items = [...get().items];
    if (!items[index]) return;

    items[index].quantity = Math.max(quantity, 1);
    persistItems(items);
    set({ items });
  },

  removeItem: (index) => {
    const items = get().items.filter((_, idx) => idx !== index);
    persistItems(items);
    set({ items });
  },

  clearCart: () => {
    persistItems([]);
    set({ items: [] });
  },

  subtotal: () =>
    get().items.reduce((sum, item) => {
      const lineTotal = Number(item.unitPrice || 0) * Number(item.quantity || 0);
      return sum + lineTotal;
    }, 0),
}));
