import type { ReactNode } from 'react'
import logoBag from '../../assets/logo-bag.svg'
import './AuthLayout.css'

interface AuthLayoutProps {
  title: string
  description: string
  footer: ReactNode
  children: ReactNode
}

function AuthLayout({ title, description, footer, children }: AuthLayoutProps) {
  return (
    <div className="auth">
      <aside className="auth-brand">
        <div className="auth-logo">
          <div className="auth-logo__mark">
            <img src={logoBag} width="13.0167" height="16.6833" alt="" />
          </div>
          <span className="auth-logo__text">Alba Store</span>
        </div>

        <div className="auth-hero">
          <h1 className="auth-hero__title">{title}</h1>
          <p className="auth-hero__text">{description}</p>
        </div>

        {footer}
      </aside>

      <main className="auth-main">{children}</main>
    </div>
  )
}

export default AuthLayout
