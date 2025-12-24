import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useToast } from './ToastContext'

const CartContext = createContext()

export function CartProvider({ children }) {
  const toast = useToast?.() || { showToast: () => {} }
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

 function addToCart(product, qty = 1) {
  setItems(prev => {
    const idx = prev.findIndex(i => i.product === product._id)
    if (idx >= 0) {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty }
      toast.showToast?.(`Updated ${product.name} quantity`, 'success')
      return copy
    }
    toast.showToast?.(`Added ${product.name} to cart`, 'success')
    return [
      ...prev,
      {
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty
      }
    ]
  })
}
  function removeFromCart(productId) {
    setItems(prev => prev.filter(i => i.product !== productId))
  }

  function updateQty(productId, qty) {
    setItems(prev => prev.map(i => (i.product === productId ? { ...i, qty } : i)))
  }

  function clearCart() {
    setItems([])
  }

  const summary = useMemo(() => {
    const itemsPrice = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    const taxPrice = +(itemsPrice * 0.1).toFixed(2)
    const shippingPrice = itemsPrice > 1000 ? 0 : 100
    const totalPrice = +(itemsPrice + taxPrice + shippingPrice).toFixed(2)
    return { itemsPrice, taxPrice, shippingPrice, totalPrice }
  }, [items])

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, summary }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
