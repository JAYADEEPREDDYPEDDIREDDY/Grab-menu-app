import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  
  // calculate total logic
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const addToCart = (menuItem) => {
    setCart((prev) => {
      const existing = prev.find(i => i._id === menuItem._id);
      if (existing) {
        return prev.map(i => i._id === menuItem._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...menuItem, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter(i => i._id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prev) => prev.map(i => {
      if (i._id === itemId) {
        const newQty = i.quantity + delta;
        return newQty > 0 ? { ...i, quantity: newQty } : i;
      }
      return i;
    }));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, cartTotal, cartCount, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
