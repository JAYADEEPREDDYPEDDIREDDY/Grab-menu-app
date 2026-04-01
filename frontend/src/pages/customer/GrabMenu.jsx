import { useState } from "react";

const tailwindConfig = `
  @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;700;800;900&family=Manrope:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
`;

const menuItems = [
  {
    id: 1,
    name: "Smoked Short Ribs",
    price: "₹850",
    description: "12-hour slow-cooked grain-fed beef, glazed with a reduction of dark stout and charred hickory.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAj1yVj1US-TCfnaAcJjn9D_GhEuTxYPKi4EppSuh_Gbzrq-AU7xMazhRWzfAzVXfxGUGl7ae1uX23HshxCgSMiA2Tw1C8s10NgVicrZkEFYVEcGQtAlM5lbDIN5_fMJYIrUCU8PQmw1owTC5HEM_LmpywVdavritlE5T2eFQ_yj3vi1bOz6mdT3X8HQamEoCtZ2XrUM_Wvn6IPQE5H3Az1k6ID969Q2Ibyly44_9df86htGezoscGPUYlrCGN-1QQ95-WoJbwYb8va",
    isVeg: false,
    isChefSpecial: false,
  },
  {
    id: 2,
    name: "Truffle Tagliatelle",
    price: "₹620",
    description: "Handmade pasta tossed in brown butter, white truffle oil, and aged Grana Padano shavings.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBISQHoS8pGtU7KVvt8cR7t3WtGxw9xAFFf_OVmZYuHl9oc94rf5yBlAWpt1fnERhDkYV4nfoFxjdh6_UIAkqqJ3Hq6p1T4O1AXvmB1_9etKXCGVz2wH0Wb87QSV7e6UN-nqAibE-0AeQ5nOTM4R7vs8fmm_JfuugRRogbhn-2ceHRenOn_13BE8ArD1mWWwCnq6rMvmb5FYObnZI3zPYgLP7pz6GTHbc2v3YLS3ETnGB5AQvMYA4V1GIYV9JZoItFtoaLjdIbjrw5G",
    isVeg: true,
    isChefSpecial: true,
  },
  {
    id: 3,
    name: "Fire-Roasted Bloom",
    price: "₹450",
    description: "Whole roasted organic cauliflower on a bed of spiced beet hummus and toasted pine nuts.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9c5evxFUnkvrlDKYW3s-LFdyAvRpsjceEGokatBoFzqMoE9oUzly8p_cDS_Wtz8XAk8pXcunYMClbtJ1YXmQZh6veshVr-3pFOD_MOz-ihOeivYiOKeVK0kuKqbCRMQTkE37CYn3USpbqOutE4EX0v8wxD-9Wlom8qdiaQWpbVZoxD99_Ru2E_Emv9_n7FS8XTHaXGKDUsJJSoVejIRUyw7JRt44Hg32U2H_imnZoavYZdxNC7FiCwGpO_CRRXADZisOkPZT5N4aI",
    isVeg: true,
    isChefSpecial: false,
  },
  {
    id: 4,
    name: "Burrata & Basil",
    price: "₹720",
    description: "Stone-baked artisanal crust topped with creamy burrata, pesto, and sun-blushed tomatoes.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAPSY--dKgfef3GOrhmbduUFU14w0OV2K5nKKH8RylfS5zFVxS5HilfYN61CsupmgXtotZYkAyE2UKGAuYTbFXS4WaFo4453J79WacAIq3dtPBIXqduA9iOkgN7jBMntX5uu7Wq7Raaa8pP8Qm-yDiZ9Zhwh_xbKBaukHdN5Qhg7yE9KdUKST1y-SeqhhFuD5BMzyIF1_uc9GTc52kxr1k3NyutS5oS6N2RIasDlfabucZoVzEOct1zXRmWfI9uhE_2DJcOP_WfSgsY",
    isVeg: true,
    isChefSpecial: false,
  },
  {
    id: 5,
    name: "The Nordic Bowl",
    price: "₹580",
    description: "Miso-glazed salmon, hand-picked seasonal greens, avocado, and yuzu-sesame vinaigrette.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDktg4kkcs9ea-WB4CD1JoUG4nI7cAb_6-TCHMJRQPkZFfE1EAP77FkmcVy652tOOehVHjPGV-XPqTGH6965T2bHBuB7uHqMO7wmppCCDqfh8beycqVv3yjTbOxsHShlLAmxQAFqIhslKtZcGsJdold9ao76RuYR5RIG1x1YKjGoey4lmCQquFAN6dMO-0EElngAT2pK01-sv80bDpUZdkSDU45G1IZWVSD3IImZbvraSOm16wAl9AweCEIxWbFsbO4Zv4Z20njZnk-",
    isVeg: false,
    isChefSpecial: false,
  },
  {
    id: 6,
    name: "Molten Obsidian",
    price: "₹390",
    description: "70% single-origin dark chocolate lava cake served with a tart raspberry coulis and gold leaf.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwxvXHrdVG1pls9vETgfkENa4Dyw3XXz5PdsHpdRW1w7Lse1-KsF1DSbmw50EgPZ_XvSZ53fy0vOU16Ns_sLkHY_G9DAe-pRHoBzTiTXCWxYbVYU6vIpoPLZrpE2ngeIPNDqP_dQ8yyAc9ImE9X5AH32CwY5ekRiT_13OIX2KrvCeqM9sUi1MWOvgQ0AWFAzfSPN2kTKXiNmiQIUHxuSb9MSg9rsDMmT6AYGcMcKlDqXwBU2iykxOrmWIWci-n5bs_rctoo6tEx29P",
    isVeg: true,
    isChefSpecial: false,
  },
];

const categories = ["Featured", "Breakfast", "Starters", "Main Course", "Drinks", "Desserts"];

const navItems = [
  { icon: "home", label: "Home", active: true },
  { icon: "search", label: "Search", active: false },
  { icon: "receipt_long", label: "Orders", active: false },
  { icon: "shopping_cart", label: "Cart", active: false },
];

function VegBadge({ isVeg }) {
  return (
    <span
      className="flex items-center justify-center w-7 h-7 rounded-lg"
      style={{
        background: "rgba(21,19,17,0.8)",
        backdropFilter: "blur(8px)",
        border: isVeg ? "1.5px solid rgba(34,197,94,0.6)" : "1.5px solid rgba(239,68,68,0.6)",
      }}
    >
      <span
        className="block w-2.5 h-2.5 rounded-full"
        style={{ background: isVeg ? "#22c55e" : "#ef4444" }}
      />
    </span>
  );
}

function MenuCard({ item, onAdd, added }) {
  return (
    <div
      className="group rounded-xl overflow-hidden flex flex-col transition-all duration-300"
      style={{
        background: "#1d1b19",
        transform: "translateY(0)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 16px 48px rgba(255,140,43,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <VegBadge isVeg={item.isVeg} />
        </div>
        {item.isChefSpecial && (
          <div className="absolute bottom-3 right-3">
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-tighter"
              style={{
                background: "rgba(255,183,133,0.92)",
                color: "#502500",
                fontFamily: "Epilogue, sans-serif",
              }}
            >
              Chef's Special
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3
            className="text-lg font-bold tracking-tight"
            style={{ color: "#e8e1dd", fontFamily: "Epilogue, sans-serif" }}
          >
            {item.name}
          </h3>
          <span
            className="font-extrabold text-base"
            style={{
              fontFamily: "Epilogue, sans-serif",
              background: "linear-gradient(135deg, #FF8C2B, #FF5E00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {item.price}
          </span>
        </div>
        <p
          className="text-sm mb-5 flex-1 font-medium leading-relaxed"
          style={{
            color: "#ddc1b0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.description}
        </p>
        <button
          onClick={() => onAdd(item)}
          className="w-full py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300"
          style={{
            fontFamily: "Epilogue, sans-serif",
            background: added ? "linear-gradient(135deg, #FF8C2B, #FF5E00)" : "#2c2927",
            color: added ? "#301400" : "#ffb785",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            if (!added) {
              e.currentTarget.style.background = "linear-gradient(135deg, #FF8C2B, #FF5E00)";
              e.currentTarget.style.color = "#301400";
            }
          }}
          onMouseLeave={(e) => {
            if (!added) {
              e.currentTarget.style.background = "#2c2927";
              e.currentTarget.style.color = "#ffb785";
            }
          }}
        >
          <span>{added ? "Added!" : "Add to Cart"}</span>
          <span className="material-symbols-outlined text-lg" style={{ fontSize: "18px" }}>
            {added ? "check_circle" : "shopping_basket"}
          </span>
        </button>
      </div>
    </div>
  );
}

export default function GrabMenu() {
  const [activeCategory, setActiveCategory] = useState("Featured");
  const [cart, setCart] = useState([]);
  const [addedItems, setAddedItems] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.id === item.id);
      if (exists) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => setAddedItems((prev) => ({ ...prev, [item.id]: false })), 1500);
  };

  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);
  const cartTotal = cart.reduce((sum, c) => {
    const price = parseInt(c.price.replace("₹", ""));
    return sum + price * c.qty;
  }, 0);

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;700;800;900&family=Manrope:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-family: 'Material Symbols Outlined';
          font-style: normal;
          display: inline-block;
          line-height: 1;
          vertical-align: middle;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #151311; }
      `}</style>

      <div style={{ background: "#151311", minHeight: "100vh", color: "#e8e1dd", fontFamily: "Manrope, sans-serif" }}>

        {/* Header */}
        <header
          className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4"
          style={{
            background: "linear-gradient(to bottom, rgba(21,19,17,0.95), rgba(21,19,17,0))",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="flex items-center gap-6">
            <h1
              className="text-xl"
              style={{ fontFamily: "Epilogue, sans-serif", fontWeight: 900, color: "#e8e1dd", letterSpacing: "-0.5px" }}
            >
              Grab Menu
            </h1>
            <div
              className="hidden md:flex items-center px-4 py-2 rounded-full"
              style={{
                background: "#1d1b19",
                border: "1px solid rgba(164,140,125,0.2)",
                width: "320px",
              }}
            >
              <span className="material-symbols-outlined mr-2" style={{ color: "#ddc1b0", fontSize: "18px" }}>search</span>
              <input
                type="text"
                placeholder="Search for dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "14px",
                  color: "#e8e1dd",
                  width: "100%",
                }}
              />
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{
              background: "linear-gradient(135deg, #FF8C2B, #FF5E00)",
              boxShadow: "0 0 15px rgba(255,140,43,0.3)",
            }}
          >
            <span className="material-symbols-outlined text-sm" style={{ color: "#301400", fontSize: "16px" }}>table_restaurant</span>
            <span style={{ color: "#301400", fontFamily: "Epilogue, sans-serif", fontWeight: 700, fontSize: "14px", letterSpacing: "0.5px" }}>
              Table #12
            </span>
          </div>
        </header>

        {/* Main */}
        <main className="pt-24 pb-32 px-6" style={{ maxWidth: "1280px", margin: "0 auto" }}>

          {/* Hero */}
          <section
            className="mb-12 relative overflow-hidden group"
            style={{ height: "260px", borderRadius: "24px" }}
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXtqGQqdSREb-hgP-9TtdVfc9dtSMtDqHuAaFifUiWk-tsIdDuqxcnbPcNW-pDok_ZkxYGY0ZMBz0mwAXS3i7YCDWbbKlFTjrTUSjPJoj0DYVrO94BYLbQwW5gN942oTv-bYFdPkOpIX9Li2E7lFxv3L4SnqhPEplV2VEcqE5WEtxXLvdYB5ffP4Fs8n30uORWxEOA63_o2XrNynHv_rTMjKBmjMgQzJIkH_ZvGFakeE-PXb-2sXesH_GLe9xY-Gx0WGg9dFKbia7t"
              alt="Featured culinary experience"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              className="absolute inset-0 flex flex-col justify-end p-8"
              style={{ background: "linear-gradient(to top, #151311 0%, rgba(21,19,17,0.4) 60%, transparent 100%)" }}
            >
              <h2
                className="mb-2"
                style={{
                  fontFamily: "Epilogue, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(2rem, 5vw, 3rem)",
                  letterSpacing: "-1px",
                  color: "#e8e1dd",
                }}
              >
                The Culinary Nocturne
              </h2>
              <p className="font-medium leading-relaxed" style={{ color: "#ddc1b0", maxWidth: "480px", fontSize: "14px" }}>
                Experience a curated journey of smoke, spice, and artisanal craft where every plate tells a story.
              </p>
            </div>
          </section>

          {/* Category Chips */}
          <nav
            className="flex overflow-x-auto no-scrollbar gap-3 mb-12 sticky z-40 py-4 -mx-6 px-6"
            style={{ top: "72px", background: "rgba(21,19,17,0.6)", backdropFilter: "blur(12px)" }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200"
                style={{
                  fontFamily: "Epilogue, sans-serif",
                  background:
                    activeCategory === cat
                      ? "linear-gradient(135deg, #FF8C2B, #FF5E00)"
                      : "#373432",
                  color: activeCategory === cat ? "#301400" : "#ddc1b0",
                  boxShadow: activeCategory === cat ? "0 8px 20px rgba(255,140,43,0.25)" : "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {cat}
              </button>
            ))}
          </nav>

          {/* Menu Grid */}
          <div
            className="grid gap-8"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
          >
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onAdd={handleAddToCart}
                added={!!addedItems[item.id]}
              />
            ))}
          </div>
        </main>

        {/* Floating Cart Button */}
        {cartCount > 0 && (
          <button
            className="fixed z-50 flex items-center gap-4 px-6 py-4 rounded-full"
            style={{
              bottom: "80px",
              right: "32px",
              background: "linear-gradient(135deg, #FF8C2B, #FF5E00)",
              boxShadow: "0 12px 40px rgba(255,94,0,0.4)",
              border: "none",
              cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          >
            <div className="relative">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "24px", color: "#301400", fontVariationSettings: "'FILL' 1" }}
              >
                shopping_cart
              </span>
              <span
                className="absolute flex items-center justify-center"
                style={{
                  top: "-4px",
                  right: "-4px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "9999px",
                  background: "#301400",
                  color: "#FF8C2B",
                  fontSize: "10px",
                  fontWeight: 900,
                }}
              >
                {cartCount}
              </span>
            </div>
            <div className="flex flex-col items-start leading-none">
              <span style={{ fontFamily: "Epilogue, sans-serif", fontWeight: 800, fontSize: "14px", color: "#301400", letterSpacing: "-0.3px" }}>
                {cartCount} {cartCount === 1 ? "Item" : "Items"}
              </span>
              <span style={{ fontFamily: "Manrope, sans-serif", fontSize: "10px", fontWeight: 700, color: "rgba(48,20,0,0.75)", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                ₹{cartTotal} • View Cart
              </span>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#301400" }}>
              chevron_right
            </span>
          </button>
        )}

        {/* Bottom Nav (Mobile) */}
        <nav
          className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-5 pt-2"
          style={{
            background: "rgba(21,19,17,0.85)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px 24px 0 0",
            boxShadow: "0 -8px 32px rgba(255,140,43,0.1)",
          }}
        >
          {navItems.map((nav) => (
            <a
              key={nav.label}
              href="#"
              className="flex flex-col items-center justify-center p-2"
              style={{ textDecoration: "none" }}
            >
              {nav.active ? (
                <div
                  className="flex flex-col items-center justify-center rounded-full p-3 mb-1"
                  style={{
                    background: "linear-gradient(135deg, #FF8C2B, #FF5E00)",
                    boxShadow: "0 0 20px rgba(255,140,43,0.4)",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "22px", color: "#301400", fontVariationSettings: "'FILL' 1" }}
                  >
                    {nav.icon}
                  </span>
                  <span style={{ color: "#301400", fontSize: "9px", fontFamily: "Manrope, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>
                    {nav.label}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "rgba(232,225,221,0.5)" }}>
                    {nav.icon}
                  </span>
                  <span style={{ color: "rgba(232,225,221,0.5)", fontSize: "9px", fontFamily: "Manrope, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>
                    {nav.label}
                  </span>
                </div>
              )}
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}
