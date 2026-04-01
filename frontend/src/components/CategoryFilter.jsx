export default function CategoryFilter({ categories, activeCategory, onChange }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 px-2 py-1">
      {categories.map((category) => {
        const isActive = category === activeCategory;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`min-h-[44px] rounded-full border px-5 text-[14px] font-semibold tracking-wide transition-all duration-300 ${
              isActive
                ? 'border-transparent bg-[#FF8C2B] text-white shadow-[0_10px_20px_rgba(255,140,43,0.24)]'
                : 'border-white/[0.06] bg-[#1A1715] text-[#D6CEC6] hover:bg-[#24201C] hover:text-white'
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
