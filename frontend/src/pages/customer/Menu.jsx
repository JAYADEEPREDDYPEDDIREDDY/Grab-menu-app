import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
  FileText,
  QrCode,
  Wallet,
  Search,
  Star,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import MenuItemCard from "../../components/MenuItemCard";
import CartDrawer from "../../components/CartDrawer";
import SearchBar from "../../components/SearchBar";
import CartButton from "../../components/CartButton";
import { SOCKET_BASE_URL, getApiUrl } from "../../config/api";
import "./Menu.css";

const container = "menu-container";
const SESSION_TOKEN_VERSION = "v1";
const RS = "\u20B9";

const createSessionToken = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getStorageKey = (prefix, restaurantId, tableId) =>
  `${prefix}:${SESSION_TOKEN_VERSION}:${restaurantId || "unknown"}:${tableId || "unknown"}`;

const getOrderStatusTone = (status) => {
  if (status === "Completed") return "is-success";
  if (status === "Ready") return "is-ready";
  if (status === "Preparing") return "is-progress";
  return "is-muted";
};

export default function Menu() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("table");
  const restaurantId = searchParams.get("restaurant");

  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionActionLoading, setSessionActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Featured");
  const [foodTypeFilter, setFoodTypeFilter] = useState("ALL");
  const [priceFilter, setPriceFilter] = useState("ALL");
  const [priceSort, setPriceSort] = useState("DEFAULT");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [customerNotice, setCustomerNotice] = useState("");
  const [customerError, setCustomerError] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [tableLocked, setTableLocked] = useState(false);
  const [activeBill, setActiveBill] = useState(null);
  const [billReady, setBillReady] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [billingMessage, setBillingMessage] = useState("");
  const [billActionLoading, setBillActionLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  const restoredSessionCartRef = useRef(false);
  const sessionTokenKey = useMemo(
    () => getStorageKey("grab-menu-session-token", restaurantId, tableId),
    [restaurantId, tableId]
  );
  const cartKey = useMemo(
    () => getStorageKey("grab-menu-cart", restaurantId, tableId),
    [restaurantId, tableId]
  );
  const sessionTokenRef = useRef("");

  const {
    cart,
    cartCount,
    cartTotal,
    replaceCart,
    clearPersistedCart,
    setCartPersistenceKey,
  } = useCart();

  const parsedTableNumber = Number.parseInt(tableId || "", 10);
  const tableLabel = Number.isFinite(parsedTableNumber)
    ? `Table #${parsedTableNumber}`
    : "Table";
  const mobileTableLabel = Number.isFinite(parsedTableNumber)
    ? `T-${parsedTableNumber}`
    : tableLabel;
  const missingTableContext = !tableId || !restaurantId;

  const orderingDisabled =
    tableLocked || (Boolean(session?._id) && (!session?.isActive || session?.status !== "ACTIVE"));
  const addToCartDisabledLabel = tableLocked
    ? "Table Locked"
    : session?.status === "COMPLETED" || session?.isActive === false
      ? "Session Closed"
      : "Billing In Progress";

  useEffect(() => {
    setCartPersistenceKey(cartKey);
  }, [cartKey, setCartPersistenceKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const existingToken = window.localStorage.getItem(sessionTokenKey);
    if (existingToken) {
      sessionTokenRef.current = existingToken;
      return;
    }

    const nextToken = createSessionToken();
    window.localStorage.setItem(sessionTokenKey, nextToken);
    sessionTokenRef.current = nextToken;
  }, [sessionTokenKey]);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchMenu = async () => {
      try {
        setLoading(true);
        const res = await fetch(getApiUrl(`/api/menu?restaurantId=${restaurantId}`));
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setCustomerError("Unable to load the menu right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [restaurantId]);

  const loadOrders = async (activeSession = session) => {
    if (!activeSession?._id || !sessionTokenRef.current) {
      setOrders([]);
      return;
    }

    try {
      const response = await fetch(
        getApiUrl(
          `/api/orders/session/${activeSession._id}?sessionToken=${encodeURIComponent(
            sessionTokenRef.current
          )}`
        )
      );

      if (!response.ok) {
        throw new Error("Failed to load your orders.");
      }

      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setCustomerError((current) => current || "Unable to load your order status.");
    }
  };

  const loadTableSession = async () => {
    if (!tableId || !restaurantId || !sessionTokenRef.current) {
      setSessionLoading(false);
      return;
    }

    try {
      setSessionLoading(true);
      setCustomerError("");
      const response = await fetch(
        getApiUrl(
          `/api/session/table/${encodeURIComponent(tableId)}?restaurantId=${encodeURIComponent(
            restaurantId
          )}&sessionToken=${encodeURIComponent(sessionTokenRef.current)}`
        )
      );
      const data = await response.json().catch(() => ({}));

      if (response.status === 423) {
        setSession(null);
        setOrders([]);
        setRestaurant(data.restaurant || null);
        setTableLocked(true);
        setCustomerNotice(data.message || "This table already has an active session.");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to load table session.");
      }

      setTableLocked(false);
      setCustomerNotice(
        data?.session?._id
          ? `Session restored for ${tableLabel}.`
          : "Add items to cart and place your order. The table session starts automatically."
      );
      setSession(data.session || null);
      setRestaurant(data.restaurant || null);

      if (!data.session) {
        setActiveBill(null);
        setOrders([]);
      }
    } catch (error) {
      console.error(error);
      setCustomerError(error.message || "Unable to load table session.");
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    loadTableSession();
  }, [restaurantId, tableId, tableLabel]);

  useEffect(() => {
    if (session?._id) {
      loadOrders(session);
    } else {
      setOrders([]);
    }
  }, [session?._id]);

  useEffect(() => {
    if (!session?._id || !items.length || restoredSessionCartRef.current) {
      return;
    }

    const existingCartIds = new Set(cart.map((item) => String(item._id)));
    if (existingCartIds.size > 0) {
      restoredSessionCartRef.current = true;
      return;
    }

    const restoredItems = (session.cartItems || [])
      .map((item) => {
        const menuItemId = item.menuItemId?._id || item.menuItemId;
        const menuItem = items.find((candidate) => String(candidate._id) === String(menuItemId));

        if (menuItem) {
          return {
            ...menuItem,
            quantity: Number(item.quantity || 1),
          };
        }

        if (!menuItemId) {
          return null;
        }

        return {
          _id: String(menuItemId),
          name: item.name,
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          description: "",
          image: "",
          isVeg: true,
        };
      })
      .filter(Boolean);

    if (restoredItems.length) {
      replaceCart(restoredItems);
    }

    restoredSessionCartRef.current = true;
  }, [cart, items, replaceCart, session]);

  useEffect(() => {
    if (!session?._id) {
      restoredSessionCartRef.current = false;
    }
  }, [session?._id]);

  useEffect(() => {
    setFeedbackRating(Number(activeBill?.feedback?.rating || 0));
    setFeedbackComment(activeBill?.feedback?.comment || "");
    setFeedbackName(activeBill?.feedback?.customerName || session?.customerName || "");
    setFeedbackSuccess("");
  }, [activeBill?._id, activeBill?.feedback, session?.customerName]);

  useEffect(() => {
    const socket = io(SOCKET_BASE_URL);

    socket.on("sessionUpdate", (updatedSession) => {
      const updatedTableId = updatedSession?.tableId?._id || updatedSession?.tableId;
      if (
        updatedSession?._id === session?._id ||
        String(updatedTableId || "") === String(session?.tableId?._id || session?.tableId || tableId || "")
      ) {
        setSession(updatedSession);
        if (updatedSession?.status === "COMPLETED" || !updatedSession?.isActive) {
          setCustomerNotice("Session completed. Add items to cart whenever you are ready to start again.");
          setActiveBill(null);
          setBillReady(false);
          setBillingMessage("");
          clearPersistedCart();
          setOrders([]);
          restoredSessionCartRef.current = false;
        }
      }
    });

    socket.on("orderStatusUpdate", (updatedOrder) => {
      const updatedTableId = updatedOrder?.tableId?._id || updatedOrder?.tableId;
      if (String(updatedTableId || "") !== String(session?.tableId?._id || session?.tableId || "")) {
        return;
      }

      setOrders((currentOrders) => {
        const existingIndex = currentOrders.findIndex((order) => order._id === updatedOrder._id);
        if (existingIndex === -1) {
          return [updatedOrder, ...currentOrders];
        }

        return currentOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        );
      });
    });

    socket.on("billUpdate", (updatedBill) => {
      const billSessionId = updatedBill?.sessionId?._id || updatedBill?.sessionId;
      const tableIds = (updatedBill?.tableIds || []).map((table) => String(table?._id || table));
      const relevantToThisTable =
        (session?._id && String(billSessionId || "") === String(session._id)) ||
        tableIds.includes(String(session?.tableId?._id || session?.tableId || tableId || ""));

      if (relevantToThisTable) {
        setActiveBill(updatedBill);
        setBillReady(false);
      }
    });

    return () => socket.disconnect();
  }, [clearPersistedCart, session, tableId]);

  const startSession = async () => {
    if (!tableId || !restaurantId || !sessionTokenRef.current) {
      throw new Error("Missing table session details.");
    }

    try {
      setSessionActionLoading(true);
      setCustomerError("");
      setCustomerNotice("");

      const response = await fetch(getApiUrl("/api/session/start"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          restaurantId,
          persons: 2,
          sessionToken: sessionTokenRef.current,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Unable to start session.");
      }

      setSession(data.session || null);
      setRestaurant(data.restaurant || null);
      setTableLocked(false);
      setCustomerNotice(`Session started automatically for ${tableLabel}. You can place orders now.`);
      return data.session;
    } catch (error) {
      console.error(error);
      setCustomerError(error.message || "Unable to start session.");
      throw error;
    } finally {
      setSessionActionLoading(false);
    }
  };

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(items.map((item) => (item.category || "Others").trim()).filter(Boolean))
    );
    return ["Featured", ...unique];
  }, [items]);

  const filterCounts = useMemo(
    () =>
      items.reduce(
        (counts, item) => {
          const price = Number(item.price || 0);

          counts.ALL += 1;
          if (item.isVeg === false) {
            counts.NON_VEG += 1;
          } else {
            counts.VEG += 1;
          }

          if (price <= 200) {
            counts.BUDGET += 1;
          } else if (price <= 500) {
            counts.MID += 1;
          } else {
            counts.PREMIUM += 1;
          }

          return counts;
        },
        {
          ALL: 0,
          VEG: 0,
          NON_VEG: 0,
          BUDGET: 0,
          MID: 0,
          PREMIUM: 0,
        }
      ),
    [items]
  );

  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = items;

    if (activeCategory !== "Featured") {
      list = list.filter((item) => (item.category || "Others").trim() === activeCategory);
    }

    if (foodTypeFilter === "VEG") {
      list = list.filter((item) => item.isVeg !== false);
    } else if (foodTypeFilter === "NON_VEG") {
      list = list.filter((item) => item.isVeg === false);
    }

    if (priceFilter === "BUDGET") {
      list = list.filter((item) => Number(item.price || 0) <= 200);
    } else if (priceFilter === "MID") {
      list = list.filter((item) => {
        const price = Number(item.price || 0);
        return price > 200 && price <= 500;
      });
    } else if (priceFilter === "PREMIUM") {
      list = list.filter((item) => Number(item.price || 0) > 500);
    }

    if (q) {
      list = list.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
      );
    }

    if (priceSort === "LOW_TO_HIGH") {
      return [...list].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    if (priceSort === "HIGH_TO_LOW") {
      return [...list].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    return list;
  }, [activeCategory, foodTypeFilter, items, priceFilter, priceSort, searchQuery]);

  const heroImage = useMemo(() => {
    const popular = items.find((item) => item.isPopular && item.image);
    const withImage = items.find((item) => item.image);
    return popular?.image || withImage?.image || "";
  }, [items]);

  const completedOrdersTotal = useMemo(
    () =>
      orders
        .filter((order) => ["Ready", "Completed"].includes(order.status))
        .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
    [orders]
  );

  const handleGenerateBill = () => {
    if (!tableId || !restaurantId) {
      setBillingError("Open this page with valid table details before generating a bill.");
      return;
    }

    if (!session?._id) {
      setBillingError("Place your first order to start the table session before generating the bill.");
      return;
    }

    if (cart.length > 0) {
      setBillingError("Place or clear the current cart items before generating the bill.");
      return;
    }

    setBillingError("");
    setBillingMessage("Bill is ready. Choose a payment option to continue.");
    setBillReady(true);
  };

  const handleSelectPaymentMethod = async (paymentMethod) => {
    if (!tableId || !restaurantId || !session?._id || !sessionTokenRef.current) {
      setBillingError("Table session missing. Please refresh and try again.");
      return;
    }

    if (cart.length > 0) {
      setBillingError("Place or clear the current cart items before generating the bill.");
      return;
    }

    try {
      setBillActionLoading(true);
      setSelectedPaymentMethod(paymentMethod);
      setBillingError("");
      setBillingMessage("");

      const response = await fetch(getApiUrl("/api/payment/select-method"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          restaurantId,
          sessionId: session._id,
          sessionToken: sessionTokenRef.current,
          paymentMethod,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to generate bill");
      }

      setActiveBill(data);
      setBillReady(false);

      if (paymentMethod === "CASH") {
        setBillingMessage("Cash payment requested. The staff will approve the bill after collecting payment.");
      } else if (paymentMethod === "QR") {
        setBillingMessage("QR payment selected. Scan the restaurant QR code and complete the payment.");
      } else {
        setBillingMessage("UPI payment selected. Open your UPI app and complete the payment.");
      }
    } catch (error) {
      console.error(error);
      setBillingError(error.message || "Failed to generate bill");
    } finally {
      setBillActionLoading(false);
      setSelectedPaymentMethod("");
    }
  };

  const handleSubmitFeedback = async () => {
    const billSessionId = activeBill?.sessionId?._id || activeBill?.sessionId || session?._id;

    if (!activeBill?._id || !billSessionId || !sessionTokenRef.current) {
      setBillingError("Bill session missing. Refresh the page and try again.");
      return;
    }

    if (!feedbackRating) {
      setBillingError("Please choose a rating before submitting feedback.");
      return;
    }

    try {
      setFeedbackSubmitting(true);
      setBillingError("");
      setFeedbackSuccess("");

      const response = await fetch(getApiUrl(`/api/billing/${activeBill._id}/feedback`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: billSessionId,
          sessionToken: sessionTokenRef.current,
          rating: feedbackRating,
          comment: feedbackComment,
          customerName: feedbackName,
        }),
      });

      const rawBody = await response.text();
      let data = {};

      try {
        data = rawBody ? JSON.parse(rawBody) : {};
      } catch (parseError) {
        data = { message: rawBody || "Failed to submit feedback." };
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit feedback.");
      }

      setActiveBill(data);
      setFeedbackSuccess("Thanks for your feedback. The restaurant team can now review it.");
    } catch (error) {
      console.error(error);
      setBillingError(error.message || "Failed to submit feedback.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const liveOrdersContent = (
    <>
      <div className="menu-panel-header">
        <div>
          <p className="menu-panel-kicker">Live Orders</p>
          <h3 className="menu-display menu-panel-title">Order Status</h3>
        </div>
        <span className="menu-panel-pill is-neutral">
          {sessionLoading ? "Loading" : `${orders.length} total`}
        </span>
      </div>

      {sessionLoading ? (
        <div className="menu-orders-empty">Loading your table activity...</div>
      ) : missingTableContext ? (
        <div className="menu-orders-empty">
          Open this page with both `table` and `restaurant` in the URL to start ordering.
        </div>
      ) : customerError ? (
        <div className="menu-orders-empty">{customerError}</div>
      ) : customerNotice && !session ? (
        <div className="menu-orders-empty">{customerNotice}</div>
      ) : !session ? (
        <div className="menu-orders-empty">
          Place your first order to start the session automatically and track updates here.
        </div>
      ) : orders.length === 0 ? (
        <div className="menu-orders-empty">
          No orders yet. Add items to the cart and place your first order.
        </div>
      ) : (
        <div className="menu-orders-list">
          {orders.slice(0, 5).map((order) => (
            <div key={order._id} className="menu-order-card">
              <div className="menu-order-top">
                <div>
                  <p className="menu-order-id">Order #{order._id.slice(-6).toUpperCase()}</p>
                  <p className="menu-order-time">
                    {new Date(order.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className={`menu-order-status ${getOrderStatusTone(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <div className="menu-order-items">
                {(order.items || []).slice(0, 3).map((item, index) => (
                  <p key={`${order._id}-${index}`} className="menu-order-item">
                    {item.quantity}x {item.menuItemId?.name || "Menu item"}
                  </p>
                ))}
              </div>

              <div className="menu-order-total">
                <span>Total</span>
                <strong>
                  {RS}
                  {Number(order.totalPrice || 0).toFixed(2)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const billingActions = (
    <div className="menu-billing-actions">
      {!billReady ? (
        <button
          type="button"
          onClick={handleGenerateBill}
          disabled={billActionLoading || sessionLoading || missingTableContext}
          className={`menu-primary-button ${
            billActionLoading || sessionLoading || missingTableContext ? "is-disabled" : ""
          }`}
        >
          <FileText size={17} />
          <span>Generate Bill</span>
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => handleSelectPaymentMethod("QR")}
            disabled={billActionLoading}
            className={`menu-billing-method-button ${billActionLoading ? "is-disabled" : ""}`}
          >
            <QrCode size={17} />
            <span>
              {billActionLoading && selectedPaymentMethod === "QR"
                ? "Preparing..."
                : "Pay via QR"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectPaymentMethod("UPI")}
            disabled={billActionLoading}
            className={`menu-billing-method-button ${billActionLoading ? "is-disabled" : ""}`}
          >
            <Wallet size={17} />
            <span>
              {billActionLoading && selectedPaymentMethod === "UPI"
                ? "Preparing..."
                : "Pay via UPI"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectPaymentMethod("CASH")}
            disabled={billActionLoading}
            className={`menu-billing-method-button is-primary ${billActionLoading ? "is-disabled" : ""}`}
          >
            <FileText size={17} />
            <span>
              {billActionLoading && selectedPaymentMethod === "CASH"
                ? "Preparing..."
                : "Pay with Cash"}
            </span>
          </button>
        </>
      )}
    </div>
  );

  const billingContent = (
    <>
      <div className="menu-panel-header">
        <div>
          <p className="menu-panel-kicker">Billing</p>
          <h3 className="menu-display menu-panel-title">Bill & Payment</h3>
        </div>
        <span className="menu-panel-pill is-neutral">
          {activeBill?.paymentStatus || session?.paymentRequest?.status || "Idle"}
        </span>
      </div>

      {billingError ? <p className="menu-inline-error">{billingError}</p> : null}
      {billingMessage ? <p className="menu-inline-note">{billingMessage}</p> : null}
      {feedbackSuccess ? <p className="menu-inline-note">{feedbackSuccess}</p> : null}
      {!billingMessage && customerNotice && session ? (
        <p className="menu-inline-note">{customerNotice}</p>
      ) : null}

      {activeBill ? (
        <>
          <div className="menu-bill-preview">
            <div className="menu-detail-row">
              <span>Completed items</span>
              <span>
                {RS}
                {completedOrdersTotal.toFixed(2)}
              </span>
            </div>
            <div className="menu-detail-row">
              <span>Subtotal</span>
              <span>{RS}{Number(activeBill.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="menu-detail-row">
              <span>GST</span>
              <span>{RS}{Number(activeBill.gstAmount || 0).toFixed(2)}</span>
            </div>
            <div className="menu-detail-row">
              <span>Service</span>
              <span>{RS}{Number(activeBill.serviceChargeAmount || 0).toFixed(2)}</span>
            </div>
            <div className="menu-detail-row menu-detail-row-total">
              <span>Total</span>
              <span>{RS}{Number(activeBill.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="menu-detail-row">
              <span>Method</span>
              <span>{activeBill.paymentMethod || "Not selected"}</span>
            </div>
          </div>

          {activeBill.paymentMethod === "UPI" && restaurant?.upiId ? (
            <a
              href={`upi://pay?${new URLSearchParams({
                pa: restaurant.upiId,
                pn: restaurant.name || "Restaurant",
                am: Number(activeBill.totalAmount || 0).toFixed(2),
                cu: "INR",
                tn: `Table ${tableId} Bill`,
              }).toString()}`}
              className="menu-primary-button menu-billing-link"
            >
              Open UPI App
            </a>
          ) : null}

          {activeBill.paymentMethod === "QR" && restaurant?.paymentQrUrl ? (
            <div className="menu-payment-qr-card">
              <img
                src={restaurant.paymentQrUrl}
                alt="Restaurant payment QR"
                className="menu-payment-qr-image"
              />
            </div>
          ) : null}

          <div className="menu-feedback-card">
            <div className="menu-panel-header menu-feedback-header">
              <div>
                <p className="menu-panel-kicker">Feedback</p>
                <h4 className="menu-display menu-feedback-title">Rate your dining experience</h4>
              </div>
              {activeBill.feedback ? (
                <span className="menu-panel-pill is-success">Saved</span>
              ) : (
                <span className="menu-panel-pill is-neutral">Optional</span>
              )}
            </div>

            <div className="menu-feedback-stars" role="radiogroup" aria-label="Feedback rating">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const active = starValue <= feedbackRating;
                return (
                  <button
                    key={starValue}
                    type="button"
                    className={`menu-feedback-star ${active ? "is-active" : ""}`}
                    onClick={() => setFeedbackRating(starValue)}
                    aria-label={`Rate ${starValue} star${starValue === 1 ? "" : "s"}`}
                  >
                    <Star size={18} fill={active ? "currentColor" : "none"} />
                  </button>
                );
              })}
            </div>

            <div className="menu-feedback-grid">
              <label className="menu-feedback-field">
                <span>Your name</span>
                <input
                  type="text"
                  value={feedbackName}
                  onChange={(event) => setFeedbackName(event.target.value)}
                  placeholder="Optional"
                  maxLength={80}
                  className="menu-feedback-input"
                />
              </label>

              <label className="menu-feedback-field">
                <span>Comments</span>
                <textarea
                  value={feedbackComment}
                  onChange={(event) => setFeedbackComment(event.target.value)}
                  placeholder="Tell the restaurant what went well or what can improve."
                  maxLength={500}
                  rows={4}
                  className="menu-feedback-input menu-feedback-textarea"
                />
              </label>
            </div>

            <div className="menu-feedback-footer">
              <span className="menu-feedback-caption">
                {activeBill.feedback
                  ? `Submitted on ${new Date(activeBill.feedback.submittedAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Your feedback will be visible to the restaurant admin panel."}
              </span>

              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={feedbackSubmitting || !feedbackRating}
                className={`menu-primary-button ${
                  feedbackSubmitting || !feedbackRating ? "is-disabled" : ""
                }`}
              >
                <span>{feedbackSubmitting ? "Saving..." : activeBill.feedback ? "Update Feedback" : "Submit Feedback"}</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="menu-orders-empty">
            Generate the bill here once all current cart items are placed. Payment updates
            will appear here in real time.
          </div>
          {billingActions}
        </>
      )}
    </>
  );

  return (
    <div className="menu-page">
      <div className="menu-ambient-glow" />

      <header className="menu-header">
        <div className="menu-header-mobile menu-mobile-only">
          <div className="menu-header-mobile-row">
            <div className="menu-brand">
              <span className="menu-brand-icon">x</span>
              <span className="menu-brand-text">
                {restaurant?.name || "Grab Menu"}
              </span>
            </div>
            <div className="menu-header-mobile-actions">
              <button
                type="button"
                className="menu-icon-button"
                onClick={() => setMobileSearchOpen((prev) => !prev)}
                aria-label="Search"
              >
                <Search size={18} />
              </button>
              <span className="menu-table-badge menu-table-badge--mobile">
                {mobileTableLabel}
              </span>
            </div>
          </div>

          {mobileSearchOpen ? (
            <div className="menu-mobile-search">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                className="menu-search menu-search--mobile"
              />
            </div>
          ) : null}
        </div>

        <div className={`${container} menu-header-inner menu-desktop-only`}>
          <div className="menu-header-left">
            <h1 className="menu-display menu-title">
              {restaurant?.name || "Grab Menu"}
            </h1>
          </div>

          <div className="menu-search-wrap">
            <SearchBar value={searchQuery} onChange={setSearchQuery} className="menu-search" />
          </div>

          <div className="menu-table-wrap">
            <span className="menu-table-badge">{tableLabel}</span>
          </div>
        </div>
      </header>

      <main className={`${container} menu-main`}>
        {customerError ? (
          <div className="menu-mobile-alert menu-mobile-only is-error">
            {customerError}
          </div>
        ) : customerNotice ? (
          <div className="menu-mobile-alert menu-mobile-only">
            {customerNotice}
          </div>
        ) : null}

        <section className="menu-hero">
          {heroImage ? (
            <img src={heroImage} alt="Featured dish" className="menu-hero-image" />
          ) : (
            <div className="menu-hero-placeholder" />
          )}
          <div className="menu-hero-overlay" />
          <div className="menu-hero-content">
            <h2 className="menu-display menu-hero-title">The Culinary Nocturne</h2>
            <p className="menu-hero-subtitle">
              Experience a curated journey of smoke, spice, and artisanal craft where every
              plate tells a story.
            </p>
          </div>
        </section>

        <section className="menu-status-grid">
          <article className="menu-panel">{liveOrdersContent}</article>
          <article className="menu-panel">{billingContent}</article>
        </section>

        <nav className="menu-category-nav no-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`menu-display menu-category-button ${isActive ? "is-active" : ""}`}
              >
                {cat === "Featured" ? (
                  <>
                    <span className="menu-category-label menu-category-label-mobile">All Day</span>
                    <span className="menu-category-label menu-category-label-desktop">Featured</span>
                  </>
                ) : (
                  <span className="menu-category-label">{cat}</span>
                )}
              </button>
            );
          })}
        </nav>

        <section className="menu-filter-panel">
          <div className="menu-filter-block">
            <div className="menu-filter-heading-row">
              <p className="menu-filter-heading">Food Type</p>
              <span className="menu-filter-summary">
                {filterCounts.VEG} veg • {filterCounts.NON_VEG} non-veg
              </span>
            </div>
            <div className="menu-filter-chip-row">
              {[
                { value: "ALL", label: "All" },
                { value: "VEG", label: "Veg" },
                { value: "NON_VEG", label: "Non-Veg" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setFoodTypeFilter(filter.value)}
                  className={`menu-filter-chip ${
                    foodTypeFilter === filter.value ? "is-active" : ""
                  }`}
                >
                  <span>{filter.label}</span>
                  <span className="menu-filter-chip-count">
                    {filterCounts[filter.value]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="menu-filter-toolbar">
            <label className="menu-select-field">
              <span className="menu-select-label">Cost</span>
              <select
                value={priceFilter}
                onChange={(event) => setPriceFilter(event.target.value)}
                className="menu-select-input"
              >
                <option value="ALL">All prices</option>
                <option value="BUDGET">Budget (up to {RS}200)</option>
                <option value="MID">Mid-range ({RS}201-{RS}500)</option>
                <option value="PREMIUM">Premium (above {RS}500)</option>
              </select>
            </label>

            <label className="menu-select-field">
              <span className="menu-select-label">Sort</span>
              <select
                value={priceSort}
                onChange={(event) => setPriceSort(event.target.value)}
                className="menu-select-input"
              >
                <option value="DEFAULT">Recommended</option>
                <option value="LOW_TO_HIGH">Price: Low to High</option>
                <option value="HIGH_TO_LOW">Price: High to Low</option>
              </select>
            </label>
          </div>
        </section>

        {loading ? (
          <div className="menu-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="menu-skeleton" />
            ))}
          </div>
        ) : visibleItems.length ? (
          <div className="menu-grid">
            {visibleItems.map((item) => (
              <MenuItemCard
                key={item._id}
                item={item}
                disabled={orderingDisabled}
                disabledLabel={addToCartDisabledLabel}
              />
            ))}
          </div>
        ) : (
          <div className="menu-empty">
            <p className="menu-empty-title">
              {items.length ? "No items match your filters." : "This menu is empty."}
            </p>
            <p className="menu-empty-subtitle">
              {items.length
                ? "Try another keyword, cost range, or food type."
                : "Ask the restaurant staff to add menu items for this location."}
            </p>
          </div>
        )}
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        restaurantId={restaurantId}
        restaurant={restaurant}
        tableId={tableId}
        session={session}
        sessionToken={sessionTokenRef.current}
        orderingDisabled={orderingDisabled}
        onSessionUpdate={(updatedSession) => setSession(updatedSession)}
        onStartSession={startSession}
      />

      {cartCount > 0 ? (
        <CartButton count={cartCount} total={cartTotal} onClick={() => setIsCartOpen(true)} />
      ) : null}

    </div>
  );
}
