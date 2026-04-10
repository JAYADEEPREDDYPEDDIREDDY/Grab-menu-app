import { useEffect, useRef, useState } from 'react';
import { useCart } from '../context/CartContext';
import {
  ArrowRight,
  Mail,
  Minus,
  Plus,
  ShoppingBag,
  Smartphone,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { getApiUrl } from '../config/api';
import './CartDrawer.css';

const RS = '\u20B9';

function QuantityStepper({ quantity, onDecrease, onIncrease, disabled = false }) {
  return (
    <div className="quantity-stepper">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled}
        className={`quantity-stepper-btn quantity-stepper-btn--minus ${disabled ? 'is-disabled' : ''}`}
      >
        <Minus size={16} />
      </button>
      <span className="quantity-stepper-value">{quantity}</span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        className={`quantity-stepper-btn quantity-stepper-btn--plus ${disabled ? 'is-disabled' : ''}`}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function CartItem({ item, onDecrease, onIncrease, onRemove, disabled = false }) {
  const totalPrice = Number(item.price || 0) * item.quantity;

  return (
    <div className="cart-item">
      <div className="cart-item-row">
        <div className="cart-item-avatar">
          {item.name?.charAt(0)?.toUpperCase() || 'C'}
        </div>
        <div className="cart-item-body">
          <div className="cart-item-content">
            <h4 className="cart-item-title">
              {item.name}
            </h4>
            <p className="cart-item-price">
              {RS}
              {totalPrice.toFixed(2)}
            </p>
            <div className="cart-item-stepper">
              <QuantityStepper
                quantity={item.quantity}
                onDecrease={onDecrease}
                onIncrease={onIncrease}
                disabled={disabled}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className={`cart-item-remove ${disabled ? 'is-disabled' : ''}`}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer({
  isOpen,
  onClose,
  restaurantId,
  tableId,
  session,
  sessionToken,
  orderingDisabled,
  onSessionUpdate,
  onStartSession,
  onOrderPlaced,
}) {
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billError, setBillError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const hasLockedOrderState = Boolean(orderingDisabled) && Boolean(session?._id);
  const lastSyncedPayloadRef = useRef('');

  useEffect(() => {
    setCustomerName(session?.customerName || '');
    setCustomerPhone(session?.customerPhone || '');
    setCustomerEmail(session?.customerEmail || '');
  }, [session?.customerEmail, session?.customerName, session?.customerPhone]);

  useEffect(() => {
    if (!session?._id) {
      lastSyncedPayloadRef.current = '';
    }
  }, [session?._id]);

  useEffect(() => {
    if (!session?._id || !sessionToken || !session?.isActive) {
      return undefined;
    }

    const syncPayload = JSON.stringify({
      customerName,
      customerPhone,
      customerEmail,
      cartItems: cart.map((item) => ({
        menuItemId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });

    if (lastSyncedPayloadRef.current === syncPayload) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(getApiUrl(`/api/session/${session._id}/cart`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionToken,
            ...JSON.parse(syncPayload),
          }),
        });

        if (response.ok) {
          lastSyncedPayloadRef.current = syncPayload;
        }
      } catch (error) {
        console.error('Failed to sync table session cart', error);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [cart, customerEmail, customerName, customerPhone, session?._id, session?.isActive, sessionToken]);

  const handleCheckout = async () => {
    if (!tableId || !restaurantId || !sessionToken) {
      setBillError('Table session missing. Please refresh and try again.');
      return;
    }

    if (cart.length === 0 || hasLockedOrderState) {
      return;
    }

    const trimmedPhone = customerPhone.trim();
    const trimmedEmail = customerEmail.trim();

    if (!trimmedPhone) {
      setBillError('Mobile number is required to place the order.');
      return;
    }

    try {
      setIsSubmitting(true);
      setBillError('');
      setStatusMessage('');
      let activeSession = session;

      if (!activeSession?._id) {
        if (!onStartSession) {
          throw new Error('Unable to start a table session automatically.');
        }

        activeSession = await onStartSession();
      }

      const response = await fetch(getApiUrl('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          restaurantId,
          sessionId: activeSession._id,
          sessionToken,
          customerName,
          customerPhone: trimmedPhone,
          customerEmail: trimmedEmail,
          items: cart.map((item) => ({
            menuItemId: item._id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      const placedOrder = data?.order || data;
      const updatedSession = data?.session || activeSession;

      clearCart();
      onSessionUpdate?.(updatedSession);
      onOrderPlaced?.(placedOrder);
      setStatusMessage(`Order placed successfully for Table ${tableId}. You can continue ordering anytime.`);
      onClose();
    } catch (error) {
      console.error(error);
      setBillError(error.message || 'Error placing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isOpen ? (
        <div
          className="cart-drawer-backdrop"
          onClick={onClose}
        />
      ) : null}

      <aside
        style={{
          paddingTop: 'env(safe-area-inset-top, 0.75rem)',
          paddingBottom: 'env(safe-area-inset-bottom, 0.85rem)',
        }}
        className={`cart-drawer ${isOpen ? 'is-open' : ''}`}
      >
        <header className="cart-drawer-header">
          <div className="cart-drawer-header-row">
            <h2 className="cart-drawer-title">
              <ShoppingBag size={25} className="cart-drawer-title-icon" />
              Your Order
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="cart-drawer-close"
            >
              <X size={18} />
            </button>
          </div>
          {tableId ? (
            <p className="cart-drawer-table">
              ordering for table {tableId}
            </p>
          ) : null}
        </header>

        <div className="cart-drawer-body">
          <div className="cart-drawer-scroll">
            {billError ? (
              <div className="cart-drawer-alert cart-drawer-alert--error">
                {billError}
              </div>
            ) : null}

            {statusMessage ? (
              <div className="cart-drawer-alert cart-drawer-alert--status">
                {statusMessage}
              </div>
            ) : null}

            {cart.length === 0 ? (
              !session ? (
                <div className="cart-drawer-empty-session">
                  Add items and place your order. The table session will start automatically.
                </div>
              ) : (
              <div className="cart-drawer-empty">
                <div className="cart-drawer-empty-icon">
                  <ShoppingBag size={34} className="cart-drawer-empty-icon-svg" />
                </div>
                <div>
                  <p className="cart-drawer-empty-title">Your cart is empty</p>
                  <p className="cart-drawer-empty-subtitle">Add something delicious to get started.</p>
                </div>
              </div>
              )
            ) : (
              <div className="cart-items">
                {cart.map((item) => (
                  <CartItem
                    key={item._id}
                    item={item}
                    disabled={orderingDisabled}
                    onDecrease={() => updateQuantity(item._id, -1)}
                    onIncrease={() => updateQuantity(item._id, 1)}
                    onRemove={() => removeFromCart(item._id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="cart-drawer-footer">
            {cart.length > 0 ? (
              <>
                <div className="cart-customer">
                  <label className="cart-customer-label">
                    Name (Optional)
                  </label>
                  <div className="cart-customer-input">
                    <UserRound size={16} className="cart-customer-icon" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Enter your name"
                      className="cart-customer-field"
                    />
                  </div>
                </div>

                <div className="cart-customer">
                  <label className="cart-customer-label">
                    Mobile Number
                  </label>
                  <div className="cart-customer-input">
                    <Smartphone size={16} className="cart-customer-icon" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      placeholder="Enter your mobile number"
                      className="cart-customer-field"
                      required
                    />
                  </div>
                </div>

                <div className="cart-customer">
                  <label className="cart-customer-label">
                    Email (Optional)
                  </label>
                  <div className="cart-customer-input">
                    <Mail size={16} className="cart-customer-icon" />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(event) => setCustomerEmail(event.target.value)}
                      placeholder="Enter your email"
                      className="cart-customer-field"
                    />
                  </div>
                </div>

                <div className="cart-summary">
                  <div className="cart-summary-row">
                    <span>Subtotal</span>
                    <span className="cart-summary-value">
                      {RS}{cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="cart-summary-total">
                    <span className="cart-summary-total-label">Total</span>
                    <span className="cart-summary-total-value">
                      {RS}{cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            ) : null}

            <div className="cart-action-stack">
              {cart.length > 0 ? (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isSubmitting || hasLockedOrderState}
                  className={`cart-checkout-button ${isSubmitting || hasLockedOrderState ? 'is-disabled' : ''}`}
                >
                  <span>
                    {isSubmitting
                      ? 'Placing Order...'
                      : hasLockedOrderState
                        ? 'Ordering Locked'
                        : 'Place Order'}
                  </span>
                  {!isSubmitting && !hasLockedOrderState ? <ArrowRight size={18} /> : null}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
