export default function CategoryFilter({ categories, activeCategory, onChange }) {
  return (
    <div className="flex flex-wrap gap-4 px-2 py-2">
      {categories.map((category) => {
        const isActive = category === activeCategory;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`min-h-[52px] rounded-full border px-6 text-[15px] font-semibold transition-all duration-300 ${
              isActive
                ? 'border-transparent bg-[#FF8C2B] text-white shadow-[0_12px_24px_rgba(255,140,43,0.28)]'
                : 'border-white/[0.05] bg-[#1A1715] text-[#DDD7CF] hover:bg-[#221F1C] hover:text-white'
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
