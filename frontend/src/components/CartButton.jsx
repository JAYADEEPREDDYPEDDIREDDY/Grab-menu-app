import { ChevronRight, ShoppingBag } from 'lucide-react';
import './CartButton.css';

export default function CartButton({ count, total = 0, onClick, className = '' }) {
  const formattedTotal = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(total || 0);

  return (
    <div className="cart-button-overlay">
      <button
        type="button"
        onClick={onClick}
        className={`cart-button ${className}`}
      >
        <span className="cart-button-icon">
          <ShoppingBag size={18} />
          <span className="cart-button-count">
            {count}
          </span>
        </span>
        <div className="cart-button-text">
          <span className="cart-button-label">
            {count} Item{count === 1 ? '' : 's'}
          </span>
          <span className="cart-button-total">
            ₹{formattedTotal} • View Cart
          </span>
        </div>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
