import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [storageKey, setStorageKey] = useState('');
  
  // calculate total logic
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const addToCart = useCallback((menuItem, quantity = 1) => {
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    setCart((prev) => {
      const existing = prev.find(i => i._id === menuItem._id);
      if (existing) {
        return prev.map(i =>
          i._id === menuItem._id ? { ...i, quantity: i.quantity + safeQuantity } : i
        );
      }
      return [...prev, { ...menuItem, quantity: safeQuantity }];
    });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCart((prev) => prev.filter(i => i._id !== itemId));
  }, []);

  const removeQuantityFromCart = useCallback((itemId, quantity = 1) => {
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    setCart((prev) =>
      prev.flatMap((item) => {
        if (item._id !== itemId) {
          return [item];
        }

        const nextQuantity = item.quantity - safeQuantity;
        return nextQuantity > 0 ? [{ ...item, quantity: nextQuantity }] : [];
      })
    );
  }, []);

  const updateQuantity = useCallback((itemId, delta) => {
    setCart((prev) =>
      prev.flatMap((item) => {
        if (item._id !== itemId) {
          return [item];
        }

        const newQty = item.quantity + delta;
        return newQty > 0 ? [{ ...item, quantity: newQty }] : [];
      })
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const replaceCart = useCallback((items = []) => {
    const normalizedItems = Array.isArray(items)
      ? items
          .filter((item) => item && item._id && Number(item.quantity) > 0)
          .map((item) => ({
            ...item,
            quantity: Math.max(1, Number(item.quantity) || 1),
          }))
      : [];

    setCart(normalizedItems);
  }, []);

  const setCartPersistenceKey = useCallback((nextKey) => {
    setStorageKey(nextKey || '');
  }, []);

  const clearPersistedCart = useCallback(() => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    setCart([]);
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) {
      setCart([]);
      return;
    }

    try {
      const storedValue = localStorage.getItem(storageKey);
      if (!storedValue) {
        setCart([]);
        return;
      }

      const parsed = JSON.parse(storedValue);
      const normalizedItems = Array.isArray(parsed)
        ? parsed
            .filter((item) => item && item._id && Number(item.quantity) > 0)
            .map((item) => ({
              ...item,
              quantity: Math.max(1, Number(item.quantity) || 1),
            }))
        : [];

      setCart(normalizedItems);
    } catch (error) {
      console.error('Failed to restore cart from storage', error);
      setCart([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, storageKey]);

  const value = useMemo(
    () => ({
      cart,
      cartTotal,
      cartCount,
      addToCart,
      removeFromCart,
      removeQuantityFromCart,
      updateQuantity,
      clearCart,
      replaceCart,
      setCartPersistenceKey,
      clearPersistedCart,
    }),
    [
      addToCart,
      cart,
      cartCount,
      cartTotal,
      clearCart,
      clearPersistedCart,
      removeFromCart,
      removeQuantityFromCart,
      replaceCart,
      setCartPersistenceKey,
      updateQuantity,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
