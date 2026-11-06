import { formatPrice, type Product } from '../../data/products'
import iconImage from '../../assets/icon-image.svg'
import iconStar from '../../assets/icon-star.svg'
import './ProductCard.css'

interface ProductCardProps {
  product: Product
  onAddToCart: (id: number) => void
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="product-card__media" style={{ background: product.imageBg }}>
        {product.image ? (
          <img className="product-card__image" src={product.image} alt={product.name} />
        ) : (
          <img src={iconImage} width="35.75" height="32.0833" alt="" />
        )}
        {product.badge && <span className="product-card__badge">{product.badge}</span>}
      </div>

      <div className="product-card__body">
        <span className="product-card__category">{product.category}</span>
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__rating">
          <img src={iconStar} width="10.2667" height="9.85833" alt="" />
          {product.rating.toFixed(1)} ({product.reviews})
        </div>

        <div className="product-card__footer">
          <span className="product-card__price">{formatPrice(product.price)}</span>
          <button type="button" className="product-card__add" onClick={() => onAddToCart(product.id)}>
            Agregar
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
