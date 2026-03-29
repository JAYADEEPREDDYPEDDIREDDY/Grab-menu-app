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

const RS = '\u20B9';

function QuantityStepper({ quantity, onDecrease, onIncrease, disabled = false }) {
  return (
    <div className="inline-flex h-[42px] items-center rounded-full bg-[#2A2623] px-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all duration-300">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          disabled ? 'cursor-not-allowed text-[#6F665D]' : 'text-[#D2C7BB] hover:text-white'
        }`}
      >
        <Minus size={16} />
      </button>
      <span className="min-w-[30px] text-center text-base font-bold text-white">{quantity}</span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        className={`flex h-8 w-8 items-center justify-center rounded-full text-white transition-all ${
          disabled
            ? 'cursor-not-allowed bg-[#6F665D] shadow-none'
            : 'bg-[#FF8C2B] shadow-[0_8px_18px_rgba(255,140,43,0.18)] hover:brightness-105'
        }`}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function CartItem({ item, onDecrease, onIncrease, onRemove, disabled = false }) {
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
              {RS}
              {totalPrice.toFixed(2)}
            </p>
            <div className="mt-4">
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
            className={`self-start rounded-full p-2 transition-colors ${
              disabled
                ? 'cursor-not-allowed text-[#6F665D]'
                : 'text-[#9E9387] hover:bg-white/5 hover:text-white'
            }`}
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
    <div className="mb-5 rounded-[20px] border border-white/[0.05] bg-[#201C19] p-4 shadow-[0_14px_28px_rgba(0,0,0,0.16)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-white">{restaurantName || 'Table Bill'}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#FFB76A]">
            table {tableId}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/[0.06] px-3 py-1 text-xs font-semibold text-[#CDBEAF] transition-colors hover:bg-white/5 hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="space-y-2">
        {(bill.lineItems || []).map((item, index) => (
          <div key={`${item.name}-${index}`} className="flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="font-semibold text-white">{item.name}</p>
              <p className="text-[#9E9387]">
                {item.quantity} x {RS}
                {Number(item.unitPrice || 0).toFixed(2)}
              </p>
            </div>
            <p className="shrink-0 font-semibold text-[#FF8C2B]">
              {RS}
              {Number(item.totalPrice || 0).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2 border-t border-white/[0.05] pt-4 text-sm">
        <div className="flex items-center justify-between text-[#A79B8F]">
          <span>Subtotal</span>
          <span>{RS}{Number(bill.subtotal || 0).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-[#A79B8F]">
          <span>GST ({bill.gstRate || 0}%)</span>
          <span>{RS}{Number(bill.gstAmount || 0).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-[#A79B8F]">
          <span>Service ({bill.serviceChargeRate || 0}%)</span>
          <span>{RS}{Number(bill.serviceChargeAmount || 0).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-white">
          <span className="font-bold">Total</span>
          <span className="text-lg font-bold text-[#FF8C2B]">
            {RS}{Number(bill.totalAmount || 0).toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[#A79B8F]">
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

    if (cart.length === 0 || orderingDisabled) {
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
            {billError ? (
              <div className="mb-4 rounded-[16px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {billError}
              </div>
            ) : null}

            {statusMessage ? (
              <div className="mb-4 rounded-[16px] border border-[#FF8C2B]/15 bg-[#201A16] px-4 py-3 text-sm text-[#E7D7C5]">
                {statusMessage}
              </div>
            ) : null}

            {paymentMessage ? (
              <div className="mb-4 rounded-[16px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
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

                <div className="mb-5 rounded-[20px] border border-white/[0.05] bg-[#201C19] p-4 shadow-[0_14px_28px_rgba(0,0,0,0.16)]">
                  <div className="mb-3">
                    <p className="text-lg font-bold text-white">Payment Options</p>
                    <p className="mt-1 text-sm text-[#A79B8F]">
                      Your table is locked for billing now. Complete the selected payment flow and the admin will update the bill.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {restaurant?.paymentQrUrl ? (
                      <div className="rounded-[16px] border border-white/[0.05] bg-[#181411] p-4">
                        <div className="mb-3 flex items-center gap-2 text-white">
                          <QrCode size={18} className="text-[#FF8C2B]" />
                          <span className="font-semibold">Pay via QR Code</span>
                        </div>
                        <img
                          src={restaurant.paymentQrUrl}
                          alt="Restaurant payment QR"
                          className="mx-auto h-40 w-40 rounded-[16px] bg-white object-contain p-2"
                        />
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={openUpi}
                      disabled={!upiDeepLink}
                      className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] border text-[15px] font-semibold transition-all ${
                        upiDeepLink
                          ? 'border-white/[0.06] bg-[#171412] text-white hover:bg-white/[0.04]'
                          : 'cursor-not-allowed border-white/[0.04] bg-[#171412] text-[#7B7168]'
                      }`}
                    >
                      <Wallet size={17} />
                      <span>{upiDeepLink ? 'Open UPI App' : 'UPI not configured yet'}</span>
                    </button>

                    <div className="rounded-[16px] border border-white/[0.05] bg-[#171412] px-4 py-3 text-sm text-[#A79B8F]">
                      Selected method: <span className="font-semibold text-white">{billPreview.paymentMethod || '-'}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {!session ? (
              <div className="rounded-[18px] border border-white/[0.04] bg-[#201C19] px-4 py-5 text-center text-sm text-[#A79B8F]">
                Start the table session on the menu page before placing orders.
              </div>
            ) : cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-[#A1A1AA]">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/[0.05] bg-white/[0.03]">
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
                    disabled={orderingDisabled}
                    onDecrease={() => updateQuantity(item._id, -1)}
                    onIncrease={() => updateQuantity(item._id, 1)}
                    onRemove={() => removeFromCart(item._id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 z-20 border-t border-white/[0.05] bg-[#201B18] px-5 pt-5 pb-[calc(1rem+env(safe-area-inset-bottom,0))] backdrop-blur-[1px]">
            {cart.length > 0 ? (
              <>
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
                    <span className="font-semibold text-[#E3DDD5]">
                      {RS}{cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-[18px] font-bold text-white">Total</span>
                    <span className="text-[20px] font-bold text-[#FF8C2B]">
                      {RS}{cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            ) : null}

            <div className="space-y-3">
              {cart.length > 0 ? (
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting || hasLockedOrderState}
                className={`flex h-[56px] w-full items-center justify-center gap-2 rounded-[16px] text-[18px] font-bold text-white transition-all duration-300 ${
                  isSubmitting || hasLockedOrderState
                    ? 'cursor-not-allowed bg-[#6E6258] opacity-70 shadow-none'
                    : 'bg-[linear-gradient(135deg,#FF8C2B,#FF5E00)] shadow-[0_18px_40px_rgba(255,110,10,0.28)] hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(255,110,10,0.34)]'
                }`}
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
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={billReady ? () => handleSelectPaymentMethod('QR') : handleGenerateBill}
                    disabled={isBillLoading || !session?._id}
                    className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] border border-white/[0.06] text-[16px] font-semibold transition-all duration-300 ${
                      isBillLoading || !session?._id
                        ? 'cursor-not-allowed bg-[#171412] text-[#7E746B]'
                        : 'bg-[#171412] text-white hover:bg-white/[0.04]'
                    }`}
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
                        className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] border border-white/[0.06] text-[16px] font-semibold transition-all duration-300 ${
                          isBillLoading || !session?._id
                            ? 'cursor-not-allowed bg-[#171412] text-[#7E746B]'
                            : 'bg-[#171412] text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <Wallet size={17} />
                        <span>{isBillLoading && selectedPaymentMethod === 'UPI' ? 'Preparing Bill...' : 'Pay via UPI'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod('CASH')}
                        disabled={isBillLoading || !session?._id}
                        className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] text-[16px] font-semibold text-white transition-all duration-300 ${
                          isBillLoading || !session?._id
                            ? 'cursor-not-allowed bg-[#6E6258] opacity-70 shadow-none'
                            : 'bg-[linear-gradient(135deg,#FF8C2B,#FF5E00)] shadow-[0_18px_40px_rgba(255,110,10,0.28)] hover:-translate-y-0.5'
                        }`}
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
