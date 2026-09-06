import {
  Banknote,
  Bike,
  Cigarette,
  Clock,
  Clock3,
  Coffee,
  Flame,
  Gift,
  Heart,
  MapPin,
  Moon,
  MoonStar,
  PackageCheck,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Zap,
} from "lucide-react";

/**
 * Icons an admin can pick for home page items. Stored by name so the layout
 * JSON stays serialisable and the client bundle only carries this set.
 */
export const HOME_ICONS = {
  bike: Bike,
  moon: Moon,
  "moon-star": MoonStar,
  banknote: Banknote,
  "map-pin": MapPin,
  clock: Clock,
  "clock-3": Clock3,
  sparkles: Sparkles,
  search: Search,
  "shopping-bag": ShoppingBag,
  "package-check": PackageCheck,
  zap: Zap,
  star: Star,
  gift: Gift,
  truck: Truck,
  phone: Phone,
  heart: Heart,
  "shield-check": ShieldCheck,
  flame: Flame,
  coffee: Coffee,
  cigarette: Cigarette,
} as const;

export type HomeIconName = keyof typeof HOME_ICONS;

export const HOME_ICON_NAMES = Object.keys(HOME_ICONS) as [HomeIconName, ...HomeIconName[]];

interface HomeIconProps {
  name: HomeIconName;
  className?: string;
}

/** Renders a registry icon; unknown names (older layouts) fall back to a spark. */
export function HomeIcon({ name, className }: HomeIconProps) {
  const Icon = HOME_ICONS[name] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
