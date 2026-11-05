import type { Product } from '../../data/products'
import iconImage from '../../assets/icon-image.svg'
import './ProductThumb.css'

interface ProductThumbProps {
  product: Product
  size?: number
}

/** Miniatura cuadrada de un producto: su imagen o el ícono genérico sobre su color de fondo. */
function ProductThumb({ product, size = 56 }: ProductThumbProps) {
  return (
    <span className="product-thumb" style={{ width: size, height: size, background: product.imageBg }}>
      {product.image ? (
        <img src={product.image} alt="" />
      ) : (
        <img src={iconImage} width={size * 0.39} height={size * 0.35} alt="" />
      )}
    </span>
  )
}

export default ProductThumb
