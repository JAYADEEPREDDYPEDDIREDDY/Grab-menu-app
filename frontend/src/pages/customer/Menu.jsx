import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import MenuItemCard from '../../components/MenuItemCard';
import CartDrawer from '../../components/CartDrawer';
import SearchBar from '../../components/SearchBar';
import CategoryFilter from '../../components/CategoryFilter';
import CartButton from '../../components/CartButton';
import { SOCKET_BASE_URL, getApiUrl } from '../../config/api';

const categoryLabels = {
  'main course': 'Main Course',
  main: 'Main Course',
  mains: 'Main Course',
  starter: 'Starter',
  starters: 'Starter',
  sta: 'Starter',
  drinks: 'Drinks',
  drink: 'Drinks',
};

const createSessionToken = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const formatCategoryLabel = (category) => {
  if (!category) return 'Chef Special';
  const normalizedCategory = category.toLowerCase().trim();
  return (
    categoryLabels[normalizedCategory] ||
    category
      .split(/[\s-]+/)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ')
  );
};

const normalizeMenu = (sourceItems) =>
  sourceItems.map((item, index) => ({
    ...item,
    prepTime: item.prepTime || `${8 + (index % 4) * 4} min`,
    categoryLabel: formatCategoryLabel(item.category),
  }));

const normalizeSessionCart = (cartItems = []) =>
  (Array.isArray(cartItems) ? cartItems : []).map((item) => ({
    _id: String(item.menuItemId || item._id || item.name),
    name: item.name,
    price: Number(item.price || 0),
    quantity: Math.max(1, Number(item.quantity) || 1),
  }));

const statusTone = {
  Pending: 'bg-[#2A241F] text-[#FBBF24]',
  Preparing: 'bg-[#1E2635] text-[#60A5FA]',
  Ready: 'bg-[#163226] text-[#4ADE80]',
  Completed: 'bg-[#153122] text-[#22C55E]',
};

const formatClock = (value) =>
  new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

export default function Menu() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');
  const restaurantParam = searchParams.get('restaurant');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(restaurantParam || '');
  const [restaurantProfile, setRestaurantProfile] = useState(null);
  const [restaurantError, setRestaurantError] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionLoading, setSessionLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [sessionToken, setSessionToken] = useState('');
  const [personsInput, setPersonsInput] = useState('2');
  const [sessionError, setSessionError] = useState('');
  const [sessionNotice, setSessionNotice] = useState('');
  const [tableLockedMessage, setTableLockedMessage] = useState('');
  const [sessionOrders, setSessionOrders] = useState([]);
  const [startingSession, setStartingSession] = useState(false);
  const previousRestaurantRef = useRef('');
  const [isCartOpenLocked, setIsCartOpenLocked] = useState(false);

  const {
    cartCount,
    clearCart,
    replaceCart,
    setCartPersistenceKey,
    clearPersistedCart,
  } = useCart();

  const parsedTableNumber = Number.parseInt(tableId || '', 10);
  const hasValidTableNumber = Number.isInteger(parsedTableNumber) && parsedTableNumber > 0;
  const sessionTableId = String(session?.tableId?._id || session?.tableId || '');

  const sessionStorageBase = useMemo(() => {
    if (!restaurantId || !hasValidTableNumber) {
      return '';
    }

    return `grab-menu:${restaurantId}:table:${parsedTableNumber}`;
  }, [hasValidTableNumber, parsedTableNumber, restaurantId]);

  const cartStorageKey = sessionStorageBase ? `${sessionStorageBase}:cart` : '';
  const tokenStorageKey = sessionStorageBase ? `${sessionStorageBase}:token` : '';
  const personsStorageKey = sessionStorageBase ? `${sessionStorageBase}:persons` : '';
  const handleSessionUpdate = useCallback((nextSession) => {
    setSession(nextSession);
  }, []);
  const saveGuestCount = useCallback(() => {
    const nextGuests = Math.max(1, Number(personsInput) || 1);
    setPersonsInput(String(nextGuests));

    if (personsStorageKey) {
      localStorage.setItem(personsStorageKey, String(nextGuests));
    }

    setSessionNotice(
      `Guest count saved for ${nextGuests} guest${nextGuests === 1 ? '' : 's'}. Your session will start automatically when the first order is placed.`
    );
    setSessionError('');
  }, [personsInput, personsStorageKey]);

  const startSession = useCallback(async () => {
    if (!tableId || !restaurantId || !sessionToken) {
      throw new Error('Table session missing. Please refresh and try again.');
    }

    setStartingSession(true);
    setSessionError('');
    setSessionNotice('');

    try {
      const response = await fetch(getApiUrl('/api/session/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          restaurantId,
          persons: Number(personsInput) || 0,
          sessionToken,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 423) {
        setTableLockedMessage(
          data.message || 'This table is currently active. You cannot place a new order.'
        );
        clearPersistedCart();
        throw new Error(data.message || 'This table is currently active.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to start session');
      }

      localStorage.setItem(personsStorageKey, String(Number(personsInput) || 1));
      setRestaurantProfile(data.restaurant || null);
      setSession(data.session);
      replaceCart(normalizeSessionCart(data.session?.cartItems));
      setTableLockedMessage('');
      setSessionNotice(
        `Session started for ${data.session?.persons || Number(personsInput) || 1} guest${
          Number(data.session?.persons || personsInput || 1) === 1 ? '' : 's'
        }.`
      );

      return data.session;
    } catch (error) {
      console.error(error);
      setSessionError(error.message || 'Failed to start session');
      throw error;
    } finally {
      setStartingSession(false);
      setSessionLoading(false);
    }
  }, [
    clearPersistedCart,
    personsInput,
    personsStorageKey,
    replaceCart,
    restaurantId,
    sessionToken,
    tableId,
  ]);

  useEffect(() => {
    setCartPersistenceKey(cartStorageKey);
  }, [cartStorageKey, setCartPersistenceKey]);

  useEffect(() => {
    if (!tokenStorageKey) {
      setSessionToken('');
      return;
    }

    let token = localStorage.getItem(tokenStorageKey);
    if (!token) {
      token = createSessionToken();
      localStorage.setItem(tokenStorageKey, token);
    }

    setSessionToken(token);
  }, [tokenStorageKey]);

  useEffect(() => {
    if (personsStorageKey) {
      const storedPersons = localStorage.getItem(personsStorageKey);
      if (storedPersons) {
        setPersonsInput(storedPersons);
      }
    }
  }, [personsStorageKey]);

  useEffect(() => {
    if (!tableId || !hasValidTableNumber) {
      if (!tableId) {
        return;
      }

      setRestaurantError('This QR code has an invalid table number. Please scan a valid table QR.');
      setLoading(false);
      return;
    }

    if (restaurantParam) {
      setRestaurantId(restaurantParam);
      return;
    }

    const resolveRestaurant = async () => {
      try {
        const response = await fetch(getApiUrl(`/api/tables/${tableId}`));
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load table');
        }

        if (!data.restaurantId) {
          throw new Error('This QR code is not linked to a restaurant yet.');
        }

        setRestaurantId(data.restaurantId);
      } catch (error) {
        console.error(error);
        setRestaurantError(error.message || 'Unable to resolve restaurant');
      }
    };

    resolveRestaurant();
  }, [hasValidTableNumber, restaurantParam, tableId]);

  useEffect(() => {
    if (!restaurantId) {
      if (!restaurantError) {
        setLoading(false);
      }
      return;
    }

    const fetchMenu = async () => {
      try {
        setLoading(true);
        const response = await fetch(getApiUrl(`/api/menu?restaurantId=${restaurantId}`));
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load menu');
        }

        setItems(normalizeMenu(Array.isArray(data) ? data : []));
      } catch (error) {
        console.error('Failed to load menu', error);
        setRestaurantError(error.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [restaurantError, restaurantId]);

  useEffect(() => {
    if (!restaurantId) {
      return;
    }

    if (previousRestaurantRef.current && previousRestaurantRef.current !== restaurantId) {
      clearCart();
    }

    previousRestaurantRef.current = restaurantId;
  }, [clearCart, restaurantId]);

  useEffect(() => {
    if (!restaurantId || !sessionToken || !tableId || !hasValidTableNumber) {
      return;
    }

    let ignore = false;

    const restoreSession = async () => {
      try {
        setSessionLoading(true);
        setSessionError('');

        const response = await fetch(
          getApiUrl(
            `/api/session/table/${tableId}?restaurantId=${encodeURIComponent(
              restaurantId
            )}&sessionToken=${encodeURIComponent(sessionToken)}`
          )
        );

        const data = await response.json().catch(() => ({}));

        if (ignore) {
          return;
        }

        if (response.status === 423) {
          setSession(null);
          setTableLockedMessage(
            data.message || 'This table is currently active. You cannot place a new order.'
          );
          setSessionNotice('');
          clearPersistedCart();
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || 'Failed to restore table session');
        }

        setTableLockedMessage('');

        if (data.restaurant) {
          setRestaurantProfile(data.restaurant);
        }

        if (data.session) {
          setSession(data.session);
          replaceCart(normalizeSessionCart(data.session.cartItems));
          setPersonsInput(String(data.session.persons || 2));
          localStorage.setItem(personsStorageKey, String(data.session.persons || 2));
          setSessionNotice(
            data.session.status === 'BILLING'
              ? 'Billing is in progress for this table. Ordering is paused until payment is completed.'
              : `Session restored for ${data.session.persons} guest${
                  data.session.persons === 1 ? '' : 's'
                }.`
          );
          return;
        }

        setSession(null);
        clearPersistedCart();
        setSessionNotice('Start your table session to begin ordering.');
      } catch (error) {
        if (!ignore) {
          console.error(error);
          setSessionError(error.message || 'Unable to restore your table session');
        }
      } finally {
        if (!ignore) {
          setSessionLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      ignore = true;
    };
  }, [
    clearPersistedCart,
    hasValidTableNumber,
    personsStorageKey,
    replaceCart,
    restaurantId,
    sessionToken,
    tableId,
  ]);

  useEffect(() => {
    if (!session?._id || !sessionToken) {
      setSessionOrders([]);
      return;
    }

    let ignore = false;

    const fetchSessionOrders = async () => {
      try {
        const response = await fetch(
          getApiUrl(
            `/api/orders/session/${session._id}?sessionToken=${encodeURIComponent(sessionToken)}`
          )
        );
        const data = await response.json().catch(() => []);

        if (ignore) {
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load ordered items');
        }

        setSessionOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!ignore) {
          console.error(error);
        }
      }
    };

    fetchSessionOrders();

    return () => {
      ignore = true;
    };
  }, [session?._id, sessionToken]);

  useEffect(() => {
    if (!restaurantId || !tableId) {
      return;
    }

    const socket = io(SOCKET_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('sessionUpdate', (nextSession) => {
      const nextTableId = String(nextSession?.tableId?._id || nextSession?.tableId || '');
      const nextTableNumber = Number(nextSession?.tableId?.tableNumber || 0);

      if (
        nextTableId !== sessionTableId &&
        nextTableNumber !== parsedTableNumber
      ) {
        return;
      }

      if (nextSession.sessionToken === sessionToken) {
        if (!nextSession.isActive || nextSession.status === 'COMPLETED') {
          setSession(null);
          setSessionOrders([]);
          setSessionNotice('This table session has been completed. You can start a fresh session now.');
          clearPersistedCart();
          return;
        }

        setSession(nextSession);
        setTableLockedMessage('');
      } else if (nextSession.isActive) {
        setTableLockedMessage('This table is currently active. You cannot place a new order.');
        clearPersistedCart();
        setIsCartOpenLocked(true);
      }
    });

    socket.on('newOrder', (order) => {
      const orderTableNumber = Number(order?.tableId?.tableNumber || 0);
      if (orderTableNumber !== parsedTableNumber) {
        return;
      }

      setSessionOrders((current) => [order, ...current.filter((item) => item._id !== order._id)]);
    });

    socket.on('orderStatusUpdate', (updatedOrder) => {
      const orderTableNumber = Number(updatedOrder?.tableId?.tableNumber || 0);
      if (orderTableNumber !== parsedTableNumber) {
        return;
      }

      setSessionOrders((current) =>
        current.map((item) => (item._id === updatedOrder._id ? updatedOrder : item))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [clearPersistedCart, parsedTableNumber, restaurantId, sessionTableId, sessionToken, tableId]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.categoryLabel).filter(Boolean)));
    return ['All Items', ...unique];
  }, [items]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === 'All Items' || item.categoryLabel === activeCategory;
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        (item.description || '').toLowerCase().includes(normalizedQuery) ||
        (item.categoryLabel || '').toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, items, searchQuery]);

  const billingInProgress = session?.status === 'BILLING';
  const hasLockedTableMessage = Boolean(tableLockedMessage);
  const orderingDisabled = billingInProgress || hasLockedTableMessage;
  const disabledLabel = billingInProgress
    ? 'Billing In Progress'
    : hasLockedTableMessage
      ? 'Table Locked'
      : '';

  if (!tableId || !hasValidTableNumber) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#1E1B18_0%,#12100E_100%)] px-4 text-center text-white">
        <div className="w-full max-w-lg rounded-[24px] border border-red-500/10 bg-[#1A1715]/90 p-8 shadow-[0_28px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <h2 className="mb-3 text-2xl font-bold text-red-300">Invalid Table</h2>
          <p className="text-[#A1A1AA]">
            Please scan the QR code on your table to open the menu and place an order.
          </p>
        </div>
      </div>
    );
  }

  if (restaurantError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#1E1B18_0%,#12100E_100%)] px-4 text-center text-white">
        <div className="w-full max-w-lg rounded-[24px] border border-red-500/10 bg-[#1A1715]/90 p-8 shadow-[0_28px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <h2 className="mb-3 text-2xl font-bold text-red-300">Restaurant Not Available</h2>
          <p className="text-[#A1A1AA]">{restaurantError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#1E1B18_0%,#12100E_100%)] pb-32 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,140,43,0.08),transparent_22%)]" />

      <section className="relative border-b border-white/[0.04] bg-[linear-gradient(180deg,rgba(36,28,23,0.92)_0%,rgba(30,24,20,0.82)_100%)] px-6 py-[60px] md:px-12">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center gap-5">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <div className="w-full max-w-[860px] space-y-3">
            {sessionLoading ? (
              <div className="rounded-[18px] border border-white/[0.05] bg-[#1A1715]/90 px-5 py-4 text-sm text-[#D0C2B5]">
                Checking your table session...
              </div>
            ) : null}

            {tableLockedMessage ? (
              <div className="rounded-[18px] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                {tableLockedMessage}
              </div>
            ) : null}

            {sessionError ? (
              <div className="rounded-[18px] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                {sessionError}
              </div>
            ) : null}

            {sessionNotice ? (
              <div className="rounded-[18px] border border-[#FF8C2B]/15 bg-[#1A1715]/90 px-5 py-4 text-sm text-[#E8D9CA]">
                <div className="font-semibold text-white">
                  Table {parsedTableNumber}
                  {session?.persons ? ` | ${session.persons} guest${session.persons === 1 ? '' : 's'}` : ''}
                </div>
                <p className="mt-1 text-[#BBAE9F]">{sessionNotice}</p>
                {session?.orders?.length ? (
                  <p className="mt-2 text-[#FFB76A]">
                    Previous orders in this session: {session.orders.length}
                  </p>
                ) : null}
              </div>
            ) : null}

            {!session && !tableLockedMessage && !sessionLoading ? (
              <div className="rounded-[22px] border border-white/[0.05] bg-[#1A1715]/95 p-5 shadow-[0_18px_42px_rgba(0,0,0,0.2)]">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-white">Enter Guest Count</h2>
                  <p className="mt-1 text-sm text-[#AFA39A]">
                    Enter the number of persons at the table. The session will start automatically when the first order is placed.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="number"
                    min="1"
                    value={personsInput}
                    onChange={(event) => setPersonsInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        saveGuestCount();
                      }
                    }}
                    className="h-[52px] flex-1 rounded-[16px] border border-white/[0.06] bg-[#14110F] px-4 text-white outline-none placeholder:text-[#746A61]"
                    placeholder="Number of persons"
                  />
                  <button
                    type="button"
                    onClick={saveGuestCount}
                    disabled={startingSession}
                    className="h-[52px] rounded-[16px] px-6 font-semibold text-white transition-all bg-[linear-gradient(135deg,#FF8C2B,#FF5E00)] shadow-[0_18px_40px_rgba(255,110,10,0.24)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#6E6258] disabled:opacity-70"
                  >
                    Enter
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-[#8E8378]">
                    The session will be created automatically when you place your first order.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="relative mx-auto flex w-full max-w-[1320px] flex-col items-center px-6 pt-12 md:px-12">
        <main className="relative w-full">
          {sessionOrders.length ? (
            <div className="mx-auto mb-10 w-full max-w-[1100px] rounded-[22px] border border-white/[0.05] bg-[#1A1715]/95 p-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-white">Ordered Items</h3>
                  <p className="mt-1 text-sm text-[#AFA39A]">
                    Track everything this table has already ordered and the live kitchen status.
                  </p>
                </div>
                <div className="rounded-full bg-white/[0.04] px-3 py-1 text-sm font-semibold text-[#FFB76A]">
                  {sessionOrders.length} order{sessionOrders.length === 1 ? '' : 's'}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {sessionOrders.map((order) => (
                  <div
                    key={order._id}
                    className="rounded-[18px] border border-white/[0.05] bg-[#201C19] p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Order #{order._id?.slice(-4)?.padStart(4, '0')}
                        </p>
                        <p className="mt-1 text-xs text-[#A79B8F]">
                          Placed at {formatClock(order.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          statusTone[order.status] || 'bg-[#2A241F] text-white'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(order.items || []).map((orderedItem, index) => (
                        <div
                          key={`${order._id}-${index}`}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <div className="min-w-0">
                            <span className="mr-2 font-semibold text-[#FFB76A]">
                              {orderedItem.quantity}x
                            </span>
                            <span className="text-white">
                              {orderedItem.menuItemId?.name || 'Menu item'}
                            </span>
                          </div>
                          <span className="shrink-0 font-semibold text-[#FF8C2B]">
                            ₹
                            {(
                              Number(orderedItem.quantity || 0) *
                              Number(orderedItem.priceAtTimeOfOrder || 0)
                            ).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mb-[64px] flex w-full justify-center">
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onChange={setActiveCategory}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="h-11 w-11 animate-spin rounded-full border-[4px] border-[#FF8C2B] border-t-transparent" />
            </div>
          ) : (
            <div key={activeCategory} className="animate-fade-in">
              {visibleItems.length ? (
                <div className="mx-auto grid grid-cols-1 justify-items-center gap-10 px-4 md:grid-cols-2 md:px-8 xl:grid-cols-3 xl:px-10">
                  {visibleItems.map((item) => (
                    <MenuItemCard
                      key={item._id}
                      item={item}
                      disabled={orderingDisabled}
                      disabledLabel={disabledLabel}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-10 rounded-[20px] border border-white/5 bg-[#1A1715] px-6 py-16 text-center text-[#A1A1AA] shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
                  <p className="text-lg font-semibold text-white">
                    {items.length ? 'No items match your search.' : 'This restaurant menu is empty.'}
                  </p>
                  <p className="mt-2">
                    {items.length
                      ? 'Try a different keyword or switch to another category.'
                      : 'Ask the restaurant staff to add menu items for this location.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <CartDrawer
        isOpen={isCartOpen && !isCartOpenLocked}
        onClose={() => {
          setIsCartOpen(false);
          setIsCartOpenLocked(false);
        }}
        restaurantId={restaurantId}
        restaurant={restaurantProfile}
        tableId={tableId}
        session={session}
        sessionToken={sessionToken}
        orderingDisabled={orderingDisabled}
        onSessionUpdate={handleSessionUpdate}
        onStartSession={startSession}
        personsInput={personsInput}
      />
      <CartButton count={cartCount} onClick={() => setIsCartOpen(true)} />
    </div>
  );
}
