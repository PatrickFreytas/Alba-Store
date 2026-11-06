export type Category = 'Tecnología' | 'Moda' | 'Hogar' | 'Accesorios'

export interface Product {
  id: number
  name: string
  category: Category
  price: number
  rating: number
  reviews: number
  badge?: string | null
  imageBg: string
  image?: string | null
  inStock: boolean
  fastShipping: boolean
}

export const categories: Category[] = ['Tecnología', 'Moda', 'Hogar', 'Accesorios']

export async function fetchProducts(signal?: AbortSignal): Promise<Product[]> {
  const res = await fetch('/api/products', { signal })
  if (!res.ok) throw new Error(`Error ${res.status} al cargar productos`)
  return res.json()
}

export function formatPrice(value: number) {
  return `S/ ${value.toFixed(2)}`
}
