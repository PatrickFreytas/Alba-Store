import { useEffect, useState } from 'react'
import Login from './components/Login/Login'
import Register from './components/Register/Register'
import ForgotPassword from './components/ForgotPassword/ForgotPassword'
import ResetPassword from './components/ResetPassword/ResetPassword'
import Catalog from './components/Catalog/Catalog'
import Checkout from './components/Checkout/Checkout'
import OrderConfirmation from './components/OrderConfirmation/OrderConfirmation'
import OrderTracking from './components/OrderTracking/OrderTracking'
import AccountLayout, { type AccountSection } from './components/Account/AccountLayout'
import OrdersPage from './components/Account/OrdersPage'
import FavoritesPage from './components/Account/FavoritesPage'
import { login, register, requestPasswordReset, resetPassword, type User } from './data/auth'
import { addToCart, countItems, mergeItems, setQuantity, type CartItem, type ShippingData } from './data/cart'
import { confirmPayment, renewPaymentCode, type Order } from './data/orders'

type View =
  | 'login'
  | 'register'
  | 'forgot'
  | 'reset'
  | 'catalog'
  | 'checkout'
  | 'confirmation'
  | 'tracking'
  | AccountSection

// El enlace del correo de recuperación llega como /?reset=<token>
const initialResetToken = new URLSearchParams(window.location.search).get('reset')

function App() {
  const [view, setView] = useState<View>(initialResetToken ? 'reset' : 'login')
  const [resetToken, setResetToken] = useState(initialResetToken)
  const [user, setUser] = useState<User | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [favorites, setFavorites] = useState<number[]>([])
  // Solo frontend: los pedidos viven en memoria, separados por usuario
  const [ordersByUser, setOrdersByUser] = useState<Record<number, Order[]>>({})
  const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(null)
  const [checkoutDraft, setCheckoutDraft] = useState<ShippingData | null>(null)
  // A dónde volver después de iniciar sesión o registrarse (p. ej. el checkout)
  const [returnTo, setReturnTo] = useState<View | null>(null)

  const orders = user ? (ordersByUser[user.id] ?? []) : []
  const activeOrder = orders.find((o) => o.number === activeOrderNumber) ?? null

  const goTo = (next: View) => {
    setAuthError(null)
    setNotice(null)
    if (next === 'catalog') setReturnTo(null)
    if (next !== 'reset' && resetToken) {
      // Quita el token de la URL para que no quede en el historial
      window.history.replaceState(null, '', window.location.pathname)
      setResetToken(null)
    }
    setView(next)
  }

  const loginThenReturn = (target: View, screen: 'login' | 'register' = 'login') => {
    setReturnTo(target)
    goTo(screen)
  }

  const authenticate = async (request: () => Promise<User>) => {
    setSubmitting(true)
    setAuthError(null)
    try {
      setUser(await request())
      setNotice(null)
      setView(returnTo === 'checkout' && cart.length === 0 ? 'catalog' : (returnTo ?? 'catalog'))
      setReturnTo(null)
    } catch (error) {
      setAuthError((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const logout = () => {
    setUser(null)
    setActiveOrderNumber(null)
    goTo('login')
  }

  const updateOrders = (update: (list: Order[]) => Order[]) => {
    if (!user) return
    setOrdersByUser((prev) => ({ ...prev, [user.id]: update(prev[user.id] ?? []) }))
  }

  const updateActiveOrder = (update: (order: Order) => Order) =>
    updateOrders((list) => list.map((o) => (o.number === activeOrderNumber ? update(o) : o)))

  // Cada vista empieza arriba (p. ej. al ir del catálogo ya desplazado al checkout)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [view])

  const toggleFavorite = (id: number) =>
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const openOrder = (order: Order) => {
    setActiveOrderNumber(order.number)
    goTo(order.status === 'pending_payment' ? 'confirmation' : 'tracking')
  }

  if (view === 'catalog') {
    return (
      <Catalog
        user={user}
        cartCount={countItems(cart)}
        favorites={favorites}
        onAddToCart={(product) => setCart((prev) => addToCart(prev, product))}
        onToggleFavorite={toggleFavorite}
        onCartClick={() => goTo('checkout')}
        onFavoritesClick={() => goTo('favorites')}
        onAccountClick={() => (user ? goTo('orders') : goTo('login'))}
      />
    )
  }

  if (view === 'checkout') {
    return (
      <Checkout
        items={cart}
        user={user}
        initialShipping={checkoutDraft}
        onQuantityChange={(id, quantity) => setCart((prev) => setQuantity(prev, id, quantity))}
        onContinueShopping={() => goTo('catalog')}
        onOrderPlaced={(placed) => {
          updateOrders((list) => [placed, ...list])
          setActiveOrderNumber(placed.number)
          setCart([])
          setCheckoutDraft(null)
          goTo('confirmation')
        }}
        onLogin={() => loginThenReturn('checkout')}
        onRegister={() => loginThenReturn('checkout', 'register')}
      />
    )
  }

  if (view === 'confirmation' && activeOrder) {
    return (
      <OrderConfirmation
        order={activeOrder}
        onBackToCatalog={() => goTo('catalog')}
        onTrackOrder={() => goTo('tracking')}
        onConfirmPayment={() => updateActiveOrder((o) => confirmPayment(o))}
        onRenewCode={() => updateActiveOrder((o) => renewPaymentCode(o))}
        onChangeMethod={() => {
          // Se descarta el pedido pendiente y sus productos vuelven al carrito
          setCart((prev) => mergeItems(prev, activeOrder.items))
          setCheckoutDraft(activeOrder.shipping)
          updateOrders((list) => list.filter((o) => o.number !== activeOrder.number))
          setActiveOrderNumber(null)
          goTo('checkout')
        }}
      />
    )
  }

  if (view === 'tracking' && activeOrder) {
    return (
      <OrderTracking
        order={activeOrder}
        onBack={() => goTo('orders')}
        onCatalog={() => goTo('catalog')}
        onCompletePayment={() => goTo('confirmation')}
      />
    )
  }

  if (view === 'orders' || view === 'favorites' || view === 'confirmation' || view === 'tracking') {
    // confirmation/tracking sin pedido activo (p. ej. tras cerrar sesión) caen en "Mis pedidos"
    const section: AccountSection = view === 'favorites' ? 'favorites' : 'orders'
    return (
      <AccountLayout
        user={user}
        active={section}
        favoritesCount={favorites.length}
        cartCount={countItems(cart)}
        onCatalog={() => goTo('catalog')}
        onCart={() => goTo('checkout')}
        onNavigate={goTo}
        onLogout={logout}
        onLogin={() => loginThenReturn(section)}
      >
        {section === 'favorites' ? (
          <FavoritesPage
            favoriteIds={favorites}
            onToggleFavorite={toggleFavorite}
            onAddToCart={(product) => setCart((prev) => addToCart(prev, product))}
            onCatalog={() => goTo('catalog')}
          />
        ) : (
          <OrdersPage
            orders={orders}
            signedIn={user !== null}
            onOpenOrder={openOrder}
            onCatalog={() => goTo('catalog')}
            onLogin={() => loginThenReturn('orders')}
          />
        )}
      </AccountLayout>
    )
  }

  if (view === 'register') {
    return (
      <Register
        error={authError}
        submitting={submitting}
        onSubmit={({ fullName, email, password }) => authenticate(() => register(fullName, email, password))}
        onLogin={() => goTo('login')}
      />
    )
  }

  if (view === 'forgot') {
    return <ForgotPassword onSubmit={requestPasswordReset} onLogin={() => goTo('login')} />
  }

  if (view === 'reset' && resetToken) {
    return (
      <ResetPassword
        onSubmit={async (password) => {
          await resetPassword(resetToken, password)
          goTo('login')
          setNotice('Tu contraseña se actualizó. Ya puedes iniciar sesión con la nueva.')
        }}
        onRequestNewLink={() => goTo('forgot')}
      />
    )
  }

  return (
    <Login
      error={authError}
      notice={notice}
      submitting={submitting}
      onSubmit={({ email, password }) => authenticate(() => login(email, password))}
      onForgotPassword={() => goTo('forgot')}
      onGuest={() => goTo('catalog')}
      onRegister={() => goTo('register')}
    />
  )
}

export default App
