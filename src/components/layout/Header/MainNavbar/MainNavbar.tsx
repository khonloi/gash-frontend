'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  ShoppingBag,
  MapPin,
  ChevronDown,
  ChevronRight,
  User,
  Zap,
  Menu,
  X
} from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { CartSidebar } from '@/components/ui/CartSidebar/CartSidebar'
import styles from './MainNavbar.module.css'

export function MainNavbar() {
  const items = useCartStore((state) => state.getTotalItems())
  const [searchQuery, setSearchQuery] = useState('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isDrawerOpen])

  const navLinks = [
    { name: 'Trending', href: '#', hasDropdown: true },
    { name: 'Men', href: '#', hasDropdown: true },
    { name: 'Women', href: '#', hasDropdown: true },
    { name: 'Kids', href: '#', hasDropdown: true },
    { name: 'Accessories', href: '#', hasDropdown: true },
    { name: 'Brands', href: '#', hasDropdown: true },
    { name: 'Sale', href: '#', hasDropdown: true, isHighlight: true },
  ]

  const closeDrawer = () => setIsDrawerOpen(false)

  return (
    <>
      <div className={styles.navbar}>
        <div className={`container ${styles.navContainer}`}>
          {/* Brand Logo */}
          <Link href="/" className={styles.logo} onClick={closeDrawer}>
            <Zap className={styles.logoIcon} fill="var(--color-primary-green)" size={28} />
            <span className={styles.logoText}>JOCK<span className={styles.logoGreen}>SPORTS</span></span>
          </Link>

          {/* Desktop Navigation Categories */}
          <nav className={styles.categories}>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`${styles.navItem} ${link.isHighlight ? styles.highlightItem : ''}`}
              >
                <span>{link.name}</span>
                {link.hasDropdown && <ChevronDown size={14} className={styles.chevron} />}
              </Link>
            ))}
          </nav>

          {/* Desktop Search Input Bar */}
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Search products, brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button className={styles.searchBtn} aria-label="Search">
              <Search size={18} />
            </button>
          </div>

          {/* Desktop Action Icons */}
          <div className={styles.actions}>
            {/* Account Icon */}
            <Link href="#" className={styles.actionIcon} title="Account">
              <User size={22} />
            </Link>

            {/* Store Location */}
            <Link href="#" className={styles.actionIcon} title="Find a Store">
              <MapPin size={22} />
            </Link>

            {/* Cart Bag */}
            <button className={styles.cartIconWrapper} onClick={() => setIsCartSidebarOpen(true)} aria-label="Open cart">
              <ShoppingBag size={22} className={styles.icon} />
              {mounted && items > 0 && <span className={styles.cartBadge}>{items}</span>}
            </button>

            {/* Flag / Language */}
            <div className={styles.countryFlag} title="English (US)">
              <span className={styles.flagIcon}>🇺🇸</span>
              <ChevronDown size={12} />
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open Navigation Menu"
          >
            <Menu size={28} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`${styles.drawerOverlay} ${isDrawerOpen ? styles.overlayVisible : ''}`}
        onClick={closeDrawer}
      />

      {/* Mobile Navigation Drawer */}
      <aside className={`${styles.mobileDrawer} ${isDrawerOpen ? styles.drawerOpen : ''}`}>
        {/* Drawer Header */}
        <div className={styles.drawerHeader}>
          <Link href="/" className={styles.logo} onClick={closeDrawer}>
            <Zap className={styles.logoIcon} fill="var(--color-primary-green)" size={24} />
            <span className={styles.logoText}>JOCK<span className={styles.logoGreen}>SPORTS</span></span>
          </Link>
          <button className={styles.closeBtn} onClick={closeDrawer} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>

        {/* Drawer Search */}
        <div className={styles.drawerSearch}>
          <input
            type="text"
            placeholder="Search products, brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.drawerSearchInput}
          />
          <button className={styles.drawerSearchBtn} aria-label="Search">
            <Search size={18} />
          </button>
        </div>

        {/* Drawer Links */}
        <nav className={styles.drawerNav}>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={closeDrawer}
              className={`${styles.drawerNavItem} ${link.isHighlight ? styles.drawerHighlightItem : ''}`}
            >
              <span>{link.name}</span>
              <ChevronRight size={18} className={styles.drawerChevron} />
            </Link>
          ))}
        </nav>

        {/* Drawer Actions */}
        <div className={styles.drawerFooter}>
          <button 
            className={styles.drawerActionItem} 
            onClick={() => {
              closeDrawer()
              setIsCartSidebarOpen(true)
            }}
          >
            <div className={styles.drawerActionIconWrap}>
              <ShoppingBag size={20} />
              {mounted && items > 0 && <span className={styles.drawerCartBadge}>{items}</span>}
            </div>
            <span>Shopping Cart ({mounted ? items : 0} {(mounted ? items : 0) === 1 ? 'item' : 'items'})</span>
          </button>

          <Link href="#" className={styles.drawerActionItem} onClick={closeDrawer}>
            <User size={20} />
            <span>My Account / Sign In</span>
          </Link>

          <Link href="#" className={styles.drawerActionItem} onClick={closeDrawer}>
            <MapPin size={20} />
            <span>Find a Store</span>
          </Link>

          <div className={styles.drawerLanguageItem}>
            <span className={styles.flagIcon}>🇺🇸</span>
            <span>English (US)</span>
          </div>
        </div>
      </aside>

      <CartSidebar 
        isOpen={isCartSidebarOpen} 
        onClose={() => setIsCartSidebarOpen(false)} 
      />
    </>
  )
}
