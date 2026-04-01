import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useCart } from "../../context/CartContext";
import MenuItemCard from "../../components/MenuItemCard";
import CartDrawer from "../../components/CartDrawer";
import SearchBar from "../../components/SearchBar";
import CartButton from "../../components/CartButton";
import { SOCKET_BASE_URL, getApiUrl } from "../../config/api";
import "./Menu.css";

const container = "menu-container";

export default function Menu() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("table");
  const restaurantId = searchParams.get("restaurant");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Featured");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { cartCount, cartTotal } = useCart();

  const parsedTableNumber = Number.parseInt(tableId || "", 10);
  const tableLabel = Number.isFinite(parsedTableNumber)
    ? `Table #${parsedTableNumber}`
    : "Table";

  useEffect(() => {
    if (!restaurantId) return;

    const fetchMenu = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          getApiUrl(`/api/menu?restaurantId=${restaurantId}`)
        );
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [restaurantId]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        items
          .map((item) => (item.category || "Others").trim())
          .filter(Boolean)
      )
    );
    return ["Featured", ...unique];
  }, [items]);

  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = items;

    if (activeCategory !== "Featured") {
      list = list.filter(
        (item) => (item.category || "Others").trim() === activeCategory
      );
    }

    if (!q) return list;

    return list.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    );
  }, [activeCategory, items, searchQuery]);

  const heroImage = useMemo(() => {
    const popular = items.find((item) => item.isPopular && item.image);
    const withImage = items.find((item) => item.image);
    return popular?.image || withImage?.image || "";
  }, [items]);

  useEffect(() => {
    const socket = io(SOCKET_BASE_URL);
    return () => socket.disconnect();
  }, []);

  return (
    <div className="menu-page">
      <div className="menu-ambient-glow" />

      <header className="menu-header">
        <div className={`${container} menu-header-inner`}>
          <div className="menu-header-left">
            <h1 className="menu-display menu-title">
              Grab Menu
            </h1>

          </div>

          <div className="menu-search-wrap">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              className="menu-search"
            />
          </div>

          <div className="menu-table-wrap">
            <span className="menu-table-badge">
              {tableLabel}
            </span>
          </div>
        </div>
      </header>

      <main className={`${container} menu-main`}>
        <section className="menu-hero">
          {heroImage ? (
            <img
              src={heroImage}
              alt="Featured dish"
              className="menu-hero-image"
            />
          ) : (
            <div className="menu-hero-placeholder" />
          )}
          <div className="menu-hero-overlay" />
          <div className="menu-hero-content">
            <h2 className="menu-display menu-hero-title">
              The Culinary Nocturne
            </h2>
            <p className="menu-hero-subtitle">
              Experience a curated journey of smoke, spice, and artisanal craft where every plate tells a story.
            </p>
          </div>
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
                {cat}
              </button>
            );
          })}
        </nav>

        {loading ? (
          <div className="menu-grid">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="menu-skeleton"
              />
            ))}
          </div>
        ) : visibleItems.length ? (
          <div className="menu-grid">
            {visibleItems.map((item) => (
              <MenuItemCard key={item._id} item={item} />
            ))}
          </div>
        ) : (
          <div className="menu-empty">
            <p className="menu-empty-title">
              {items.length ? "No items match your search." : "This menu is empty."}
            </p>
            <p className="menu-empty-subtitle">
              {items.length
                ? "Try another keyword or switch categories."
                : "Ask the restaurant staff to add menu items for this location."}
            </p>
          </div>
        )}
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        restaurantId={restaurantId}
        tableId={tableId}
      />

      {cartCount > 0 ? (
        <CartButton
          count={cartCount}
          total={cartTotal}
          onClick={() => setIsCartOpen(true)}
        />
      ) : null}
    </div>
  );
}
