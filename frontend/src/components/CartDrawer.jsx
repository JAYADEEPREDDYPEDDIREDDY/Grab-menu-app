import { useState } from 'react';
import { useCart } from '../context/CartContext';
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function QuantityStepper({ quantity, onDecrease, onIncrease }) {
  return (
    <div className="inline-flex h-[42px] items-center rounded-full bg-[#2A2623] px-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all duration-300"  >
      <button
        type="button"
        onClick={onDecrease}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#D2C7BB] transition-colors hover:text-white"
      >
        <Minus size={16} />
      </button>
      <span className="min-w-[30px] text-center text-base font-bold text-white">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF8C2B] text-white shadow-[0_8px_18px_rgba(255,140,43,0.18)] transition-all hover:brightness-105"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function CartItem({ item, onDecrease, onIncrease, onRemove }) {
  const totalPrice = Number(item.price || 0) * item.quantity;

  return (
    <div className="rounded-[18px] border border-white/[0.04] bg-[#201C19] p-4 shadow-[0_14px_28px_rgba(0,0,0,0.16)]">
      <div className="flex gap-4">
        <div className="flex h-[94px] w-[94px] shrink-0 items-center justify-center rounded-[12px] bg-[#2B2420] text-[40px] font-bold text-[#6B625A]">
          {item.name?.charAt(0)?.toUpperCase() || 'C'}
        </div>
        <div className="flex min-w-0 flex-1 justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <h4 className="truncate text-[17px] font-bold leading-[1.2] text-white">
              {item.name}
            </h4>
            <p className="mt-1 text-[14px] font-semibold text-[#FF8C2B]">
              ${totalPrice.toFixed(2)}
            </p>

            <div className="mt-4">
              <QuantityStepper
                quantity={item.quantity}
                onDecrease={onDecrease}
                onIncrease={onIncrease}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="self-start rounded-full p-2 text-[#9E9387] transition-colors hover:bg-white/5 hover:text-white"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (!tableId) {
      alert('Table ID missing! Cannot place order.');
      return;
    }
    if (cart.length === 0) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          customerName,
          items: cart.map((item) => ({
            menuItemId: item._id.match(/^[0-9a-fA-F]{24}$/)
              ? item._id
              : '651a2b3c4d5e6f7a8b9c0d11',
            quantity: item.quantity,
            priceAtTimeOfOrder: item.price,
          })),
          totalPrice: cartTotal,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to place order');
      }

      const order = await response.json();
      clearCart();
      setCustomerName('');
      onClose();
      navigate(`/order/${order._id}`);
    } catch (error) {
      console.error(error);
      alert('Error placing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      ) : null}

      <aside
        style={{
          paddingTop: 'env(safe-area-inset-top, 0.75rem)',
          paddingBottom: 'env(safe-area-inset-bottom, 0.85rem)',
        }}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[430px] transform flex-col rounded-l-[20px] border-l border-white/[0.05] bg-[#1A1715] shadow-[0_24px_60px_rgba(0,0,0,0.48)] transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex flex-col gap-2 border-b border-white/[0.05] px-5 py-5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="flex items-center gap-3 text-[24px] font-extrabold tracking-tight text-white">
              <ShoppingBag size={25} className="text-[#FF8C2B]" />
              Your Order
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#FF8C2B]/40 text-[#D4C6B7] transition-all hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          {tableId ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-[#FFB76A]">
              ordering for table {tableId}
            </p>
          ) : null}
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-[#A1A1AA]">                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/[0.05] bg-white/[0.03]">
                  <ShoppingBag size={34} className="text-[#FF8C2B]" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">Your cart is empty</p>
                  <p className="mt-1 text-sm">Add something delicious to get started.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <CartItem
                    key={item._id}
                    item={item}
                    onDecrease={() => updateQuantity(item._id, -1)}
                    onIncrease={() => updateQuantity(item._id, 1)}
                    onRemove={() => removeFromCart(item._id)}
                  />
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 ? (
            <div className="sticky bottom-0 z-20 border-t border-white/[0.05] bg-[#201B18] px-5 pt-5 pb-[calc(1rem+env(safe-area-inset-bottom,0))] backdrop-blur-[1px]">
              <div className="mb-5">
                <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.04em] text-[#9E9387]">
                  Name (Optional)
                </label>
                <div className="flex h-[50px] items-center gap-3 rounded-[12px] border border-white/[0.06] bg-[#1A1715] px-4">
                  <UserRound size={16} className="text-[#756C63]" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Enter your name"
                    className="h-full w-full border-0 bg-transparent text-[15px] text-white outline-none placeholder:text-[#7E746B]"
                  />
                </div>
              </div>

              <div className="mb-6 space-y-3 border-t border-white/[0.04] pt-5">
                <div className="flex items-center justify-between text-[15px] text-[#A79B8F]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#E3DDD5]">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-[18px] font-bold text-white">Total</span>
                  <span className="text-[20px] font-bold text-[#FF8C2B]">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                className={`flex h-[56px] w-full items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#FF8C2B,#FF5E00)] text-[18px] font-bold text-white shadow-[0_18px_40px_rgba(255,110,10,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(255,110,10,0.34)] ${
                  isSubmitting ? 'cursor-not-allowed opacity-70' : ''
                }`}
              >
                <span>{isSubmitting ? 'Placing Order...' : 'Place Order'}</span>
                {!isSubmitting ? <ArrowRight size={18} /> : null}
              </button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
