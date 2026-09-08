import {
  CreditCard,
  ShoppingCart,
  Pill,
  Dumbbell,
  Utensils,
  Shirt,
  Fuel,
  Star,
  Gift,
  Heart,
  type LucideIcon,
} from 'lucide-react'
import type { CardIcon } from '../types'

const ICONS: Record<CardIcon, LucideIcon> = {
  card: CreditCard,
  'shopping-cart': ShoppingCart,
  pill: Pill,
  dumbbell: Dumbbell,
  utensils: Utensils,
  shirt: Shirt,
  fuel: Fuel,
  star: Star,
  gift: Gift,
  heart: Heart,
}

export function IconGlyph({
  icon,
  size = 20,
  className,
}: {
  icon: string
  size?: number
  className?: string
}) {
  const Icon = ICONS[icon as CardIcon] ?? CreditCard
  return <Icon size={size} className={className} strokeWidth={1.9} />
}
