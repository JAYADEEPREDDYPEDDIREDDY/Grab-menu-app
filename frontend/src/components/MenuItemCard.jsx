import { useCart } from '../context/CartContext';
import { Clock3, ShoppingBag, UtensilsCrossed } from 'lucide-react';

export default function MenuItemCard({ item, index = 0 }) {
  const { addToCart } = useCart();

  return (
    <article className="group mx-auto flex h-[492px] w-full max-w-[392px] flex-col overflow-hidden rounded-[28px] border border-white/[0.04] bg-[#221D19] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_24px_54px_rgba(0,0,0,0.26)]">
      <div className="relative mb-6 h-[260px] overflow-hidden rounded-[24px] bg-[#302A24]">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.01),rgba(0,0,0,0.10))]" />
            <div className="relative flex h-full items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black/5">
                <UtensilsCrossed size={44} className="text-[#534B43]" strokeWidth={1.7} />
              </div>
            </div>
          </>
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.00)_0%,rgba(0,0,0,0.18)_100%)]" />

        <div className="absolute bottom-4 right-4 inline-flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded-full bg-[#181411] px-3.5 text-[13px] font-semibold leading-none text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
          <Clock3 size={13} />
          <span className="leading-none">{item.prepTime || '15 min'}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-[20px] font-bold leading-[1.2] text-white">{item.name}</h3>
          <span className="whitespace-nowrap pt-0.5 text-[18px] font-semibold leading-none text-[#FF8C2B]">
            ${Number(item.price || 0).toFixed(2)}
          </span>
        </div>

        <p className="mt-3 line-clamp-2 min-h-[46px] text-[14px] leading-[1.6] text-white/70">
          {item.description || 'Freshly prepared with premium ingredients and balanced flavors.'}
        </p>

        <button
          type="button"
          onClick={() => addToCart(item)}
          className="mt-auto flex h-[48px] w-full items-center justify-center gap-2 rounded-[20px] bg-[#FF8C2B] px-5 font-semibold text-white shadow-[0_12px_26px_rgba(255,140,43,0.22)] transition-all duration-300 hover:translate-y-[-1px] hover:scale-[1.01] hover:brightness-105"
        >
          <ShoppingBag size={16} />
          <span>Add to Order</span>
        </button>
      </div>
    </article>
  );
}
