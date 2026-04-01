import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '../context/CartContext';
import {
  ArrowRight,
  FileText,
  Minus,
  Plus,
  QrCode,
  ShoppingBag,
  Trash2,
  UserRound,
  Wallet,
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

function BillPreview({ bill, tableId, restaurantName, onClose }) {
  return (
    <div className="bill-preview">
      <div className="bill-preview-header">
        <div>
          <p className="bill-preview-title">{restaurantName || 'Table Bill'}</p>
          <p className="bill-preview-table">
            table {tableId}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="bill-preview-close"
        >
          Close
        </button>
      </div>

      <div className="bill-preview-items">
        {(bill.lineItems || []).map((item, index) => (
          <div key={`${item.name}-${index}`} className="bill-preview-item">
            <div className="bill-preview-item-info">
              <p className="bill-preview-item-name">{item.name}</p>
              <p className="bill-preview-item-meta">
                {item.quantity} x {RS}
                {Number(item.unitPrice || 0).toFixed(2)}
              </p>
            </div>
            <p className="bill-preview-item-total">
              {RS}
              {Number(item.totalPrice || 0).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="bill-preview-summary">
        <div className="bill-preview-summary-row">
          <span>Subtotal</span>
          <span>{RS}{Number(bill.subtotal || 0).toFixed(2)}</span>
        </div>
        <div className="bill-preview-summary-row">
          <span>GST ({bill.gstRate || 0}%)</span>
          <span>{RS}{Number(bill.gstAmount || 0).toFixed(2)}</span>
        </div>
        <div className="bill-preview-summary-row">
          <span>Service ({bill.serviceChargeRate || 0}%)</span>
          <span>{RS}{Number(bill.serviceChargeAmount || 0).toFixed(2)}</span>
        </div>
        <div className="bill-preview-summary-row bill-preview-summary-total">
          <span className="bill-preview-summary-total-label">Total</span>
          <span className="bill-preview-summary-total-value">
            {RS}{Number(bill.totalAmount || 0).toFixed(2)}
          </span>
        </div>
        <div className="bill-preview-summary-row">
          <span>Payment Status</span>
          <span>{bill.paymentStatusLabel || bill.paymentStatus}</span>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer({
  isOpen,
  onClose,
  restaurantId,
  restaurant,
  tableId,
  session,
  sessionToken,
  orderingDisabled,
  onSessionUpdate,
  onStartSession,
  personsInput,
}) {
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBillLoading, setIsBillLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [billReady, setBillReady] = useState(false);
  const [billError, setBillError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [billPreview, setBillPreview] = useState(null);
  const hasLockedOrderState =
    Boolean(orderingDisabled) && (Boolean(session?._id) || Boolean(billPreview));
  const lastSyncedPayloadRef = useRef('');

  useEffect(() => {
    setCustomerName(session?.customerName || '');
  }, [session?.customerName]);

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
  }, [cart, customerName, session?._id, session?.isActive, sessionToken]);

  const upiDeepLink = useMemo(() => {
    if (!restaurant?.upiId || !billPreview?.totalAmount) {
      return '';
    }

    const amount = Number(billPreview.totalAmount || 0).toFixed(2);
    const params = new URLSearchParams({
      pa: restaurant.upiId,
      pn: restaurant.name || 'Restaurant',
      am: amount,
      cu: 'INR',
      tn: `Table ${tableId} Bill`,
    });

    return `upi://pay?${params.toString()}`;
  }, [billPreview?.totalAmount, restaurant?.name, restaurant?.upiId, tableId]);

  const handleCheckout = async () => {
    if (!tableId || !restaurantId || !sessionToken) {
      setBillError('Table session missing. Please refresh and try again.');
      return;
    }

    if (cart.length === 0 || hasLockedOrderState) {
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

      clearCart();
      setStatusMessage(`Order placed successfully for Table ${tableId}. You can continue ordering anytime.`);
      onClose();
    } catch (error) {
      console.error(error);
      setBillError(error.message || 'Error placing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPaymentMethod = async (paymentMethod) => {
    if (!tableId || !restaurantId || !session?._id || !sessionToken) {
      setBillError('Table session missing. Please refresh and start the session again.');
      return;
    }

    if (cart.length > 0) {
      setBillError('Place or clear the current cart items before generating the bill.');
      return;
    }

    try {
      setIsBillLoading(true);
      setSelectedPaymentMethod(paymentMethod);
      setBillError('');
      setPaymentMessage('');
      const response = await fetch(getApiUrl('/api/payment/select-method'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          restaurantId,
          sessionId: session._id,
          sessionToken,
          paymentMethod,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create bill');
      }

      setBillPreview(data);
      onSessionUpdate?.({ ...session, status: 'BILLING', isLocked: true });

      if (paymentMethod === 'CASH') {
        setPaymentMessage('Cash payment requested. The staff will approve the bill once payment is collected.');
      } else if (paymentMethod === 'QR') {
        setPaymentMessage('QR payment selected. Scan the restaurant QR and ask staff to mark the bill as paid.');
      } else {
        setPaymentMessage('UPI payment selected. Complete the transfer and ask staff to mark the bill as paid.');
      }
    } catch (error) {
      console.error(error);
      setBillError(error.message || 'Failed to generate bill');
    } finally {
      setIsBillLoading(false);
      setSelectedPaymentMethod('');
    }
  };

  const handleGenerateBill = async () => {
    if (!tableId || !restaurantId || !session?._id || !sessionToken) {
      setBillError('Table session missing. Please refresh and start the session again.');
      return;
    }

    if (cart.length > 0) {
      setBillError('Place or clear the current cart items before generating the bill.');
      return;
    }

    setBillError('');
    setPaymentMessage('');
    setBillReady(true);
    setStatusMessage('Bill generated. Choose a payment option to continue.');
  };

  const openUpi = () => {
    if (!upiDeepLink) {
      setBillError('UPI ID is not configured for this restaurant yet.');
      return;
    }

    window.location.href = upiDeepLink;
    setPaymentMessage('UPI app opened. Complete the payment and ask staff to mark the bill as paid.');
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

            {paymentMessage ? (
              <div className="cart-drawer-alert cart-drawer-alert--payment">
                {paymentMessage}
              </div>
            ) : null}

            {billPreview ? (
              <>
                <BillPreview
                  bill={billPreview}
                  tableId={tableId}
                  restaurantName={restaurant?.name}
                  onClose={() => {
                    setBillPreview(null);
                    setBillReady(false);
                    setPaymentMessage('');
                  }}
                />

                <div className="cart-payment-card">
                  <div className="cart-payment-header">
                    <p className="cart-payment-title">Payment Options</p>
                    <p className="cart-payment-desc">
                      Your table is locked for billing now. Complete the selected payment flow and the admin will update the bill.
                    </p>
                  </div>

                  <div className="cart-payment-options">
                    {restaurant?.paymentQrUrl ? (
                      <div className="cart-payment-qr">
                        <div className="cart-payment-qr-title">
                          <QrCode size={18} className="cart-payment-qr-icon" />
                          <span className="cart-payment-qr-label">Pay via QR Code</span>
                        </div>
                        <img
                          src={restaurant.paymentQrUrl}
                          alt="Restaurant payment QR"
                          className="cart-payment-qr-image"
                        />
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={openUpi}
                      disabled={!upiDeepLink}
                      className={`cart-payment-button ${upiDeepLink ? '' : 'is-disabled'}`}
                    >
                      <Wallet size={17} />
                      <span>{upiDeepLink ? 'Open UPI App' : 'UPI not configured yet'}</span>
                    </button>

                    <div className="cart-payment-selected">
                      Selected method: <span className="cart-payment-selected-value">{billPreview.paymentMethod || '-'}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {!session ? (
              <div className="cart-drawer-empty-session">
                Start the table session on the menu page before placing orders.
              </div>
            ) : cart.length === 0 ? (
              <div className="cart-drawer-empty">
                <div className="cart-drawer-empty-icon">
                  <ShoppingBag size={34} className="cart-drawer-empty-icon-svg" />
                </div>
                <div>
                  <p className="cart-drawer-empty-title">Your cart is empty</p>
                  <p className="cart-drawer-empty-subtitle">Add something delicious to get started.</p>
                </div>
              </div>
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

              {!billPreview ? (
                <div className="cart-bill-group">
                  <button
                    type="button"
                    onClick={billReady ? () => handleSelectPaymentMethod('QR') : handleGenerateBill}
                    disabled={isBillLoading || !session?._id}
                    className={`cart-bill-button ${isBillLoading || !session?._id ? 'is-disabled' : ''}`}
                  >
                    {billReady ? <QrCode size={17} /> : <FileText size={17} />}
                    <span>
                      {!billReady
                        ? 'Generate Bill'
                        : isBillLoading && selectedPaymentMethod === 'QR'
                          ? 'Preparing Bill...'
                          : 'Pay via QR Code'}
                    </span>
                  </button>
                  {billReady ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod('UPI')}
                        disabled={isBillLoading || !session?._id}
                        className={`cart-bill-button ${isBillLoading || !session?._id ? 'is-disabled' : ''}`}
                      >
                        <Wallet size={17} />
                        <span>{isBillLoading && selectedPaymentMethod === 'UPI' ? 'Preparing Bill...' : 'Pay via UPI'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod('CASH')}
                        disabled={isBillLoading || !session?._id}
                        className={`cart-bill-button cart-bill-button--primary ${isBillLoading || !session?._id ? 'is-disabled' : ''}`}
                      >
                        <FileText size={17} />
                        <span>{isBillLoading && selectedPaymentMethod === 'CASH' ? 'Preparing Bill...' : 'Pay with Cash'}</span>
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
