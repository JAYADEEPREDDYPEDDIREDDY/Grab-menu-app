import { useCart } from '../context/CartContext';
import { Minus, Plus, UtensilsCrossed } from 'lucide-react';
import './MenuItemCard.css';

const RS = '\u20B9';

export default function MenuItemCard({ item, disabled = false, disabledLabel = 'Add to Cart' }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const badgeToneClass = item.isVeg === true ? 'is-veg' : item.isVeg === false ? 'is-non-veg' : '';
  const priceLabel = Number(item.price || 0).toLocaleString('en-IN');
  const cartItem = cart.find((entry) => entry._id === item._id);
  const quantity = Number(cartItem?.quantity || 0);

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

        {badgeToneClass ? (
          <div className={`menu-item-badge-wrap ${badgeToneClass}`}>
            <span className={`menu-item-badge ${badgeToneClass}`} />
          </div>
        ) : null}

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

        {quantity > 0 && !disabled ? (
          <div className="menu-item-quantity-bar">
            <button
              type="button"
              onClick={() => updateQuantity(item._id, -1)}
              className="menu-item-quantity-button"
              aria-label={`Remove one ${item.name}`}
            >
              <Minus size={16} />
            </button>
            <span className="menu-item-quantity-value">{quantity} added</span>
            <button
              type="button"
              onClick={() => addToCart(item)}
              className="menu-item-quantity-button is-primary"
              aria-label={`Add one more ${item.name}`}
            >
              <Plus size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => addToCart(item)}
            disabled={disabled}
            aria-label={disabled ? disabledLabel : 'Add to Cart'}
            className={`menu-item-button ${disabled ? 'is-disabled' : ''}`}
          >
            <span className="menu-item-button-label">
              {disabled ? disabledLabel : 'Add to Cart'}
            </span>
            <span className="menu-item-button-icon">+</span>
          </button>
        )}
      </div>
    </article>
  );
}
