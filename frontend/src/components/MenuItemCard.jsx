import { useCart } from '../context/CartContext';
import { UtensilsCrossed } from 'lucide-react';
import './MenuItemCard.css';

const RS = '\u20B9';

export default function MenuItemCard({ item, disabled = false, disabledLabel = 'Add to Cart' }) {
  const { addToCart } = useCart();
  const isVeg = item.isVeg !== false;
  const badgeToneClass = isVeg ? 'is-veg' : 'is-non-veg';
  const priceLabel = Number(item.price || 0).toLocaleString('en-IN');

  return (
    <article className="menu-item-card">
      <div className="menu-item-media">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="menu-item-image"
          />
        ) : (
          <>
            <div className="menu-item-placeholder">
              <div className="menu-item-placeholder-icon">
                <UtensilsCrossed size={34} className="menu-item-placeholder-icon-svg" strokeWidth={1.6} />
              </div>
            </div>
          </>
        )}

        <div className="menu-item-media-overlay" />

        <div className="menu-item-badge-wrap">
          <span className={`menu-item-badge ${badgeToneClass}`} />
        </div>

        {item.isPopular ? (
          <div className="menu-item-special">
            Chef&apos;s Special
          </div>
        ) : null}
      </div>

      <div className="menu-item-body">
        <div className="menu-item-header">
          <h3 className="menu-display menu-item-title">
            {item.name}
          </h3>
          <span className="menu-display menu-item-price">
            {RS}
            {priceLabel}
          </span>
        </div>

        <p className="menu-item-description">
          {item.description || 'A signature dish crafted with rich flavors and seasonal ingredients.'}
        </p>

        <button
          type="button"
          onClick={() => addToCart(item)}
          disabled={disabled}
          className={`menu-item-button ${disabled ? 'is-disabled' : ''}`}
        >
          <span>{disabled ? disabledLabel : 'Add to Cart'}</span>
        </button>
      </div>
    </article>
  );
}
