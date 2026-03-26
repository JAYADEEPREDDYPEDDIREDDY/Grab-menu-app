import { ShoppingBag } from 'lucide-react';

export default function CartButton({ count, onClick, className = '' }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      <button
        type="button"
        onClick={onClick}
        className={`pointer-events-auto absolute bottom-7 right-6 flex h-[58px] items-center gap-3 rounded-full bg-[#FF7A00] px-8 text-white shadow-[0_18px_42px_rgba(255,122,0,0.34)] transition-all duration-300 hover:scale-[1.03] hover:brightness-105 md:bottom-8 md:right-12 ${className}`}
      >
        <span className="relative">
          <ShoppingBag size={19} />
          {count > 0 ? (
            <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-black text-[#FF8C2B]">
              {count}
            </span>
          ) : null}
        </span>
        <span className="text-[17px] font-bold tracking-wide">Cart</span>
      </button>
    </div>
  );
}
