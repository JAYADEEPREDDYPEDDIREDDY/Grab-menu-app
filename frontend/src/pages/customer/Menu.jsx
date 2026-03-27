import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import MenuItemCard from '../../components/MenuItemCard';
import CartDrawer from '../../components/CartDrawer';
import SearchBar from '../../components/SearchBar';
import CategoryFilter from '../../components/CategoryFilter';
import CartButton from '../../components/CartButton';
import { getApiUrl } from '../../config/api';

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

export default function Menu() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');
  const restaurantParam = searchParams.get('restaurant');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(restaurantParam || '');
  const [restaurantError, setRestaurantError] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const { cartCount, clearCart } = useCart();
  const previousRestaurantRef = useRef('');
  const parsedTableNumber = Number.parseInt(tableId || '', 10);
  const hasValidTableNumber = Number.isInteger(parsedTableNumber) && parsedTableNumber > 0;

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

    if (
      previousRestaurantRef.current &&
      previousRestaurantRef.current !== restaurantId
    ) {
      clearCart();
    }

    previousRestaurantRef.current = restaurantId;
  }, [clearCart, restaurantId]);

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
        <div className="mx-auto flex w-full max-w-[1320px] justify-center">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </section>

      <div className="relative mx-auto flex w-full max-w-[1320px] flex-col items-center px-6 pt-12 md:px-12">
        <main className="relative w-full">
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
                  {visibleItems.map((item, index) => (
                    <MenuItemCard key={item._id} item={item} index={index} />
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
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        restaurantId={restaurantId}
      />
      <CartButton count={cartCount} onClick={() => setIsCartOpen(true)} />
    </div>
  );
}
