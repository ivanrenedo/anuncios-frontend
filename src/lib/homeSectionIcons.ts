import type { LucideIcon } from "lucide-react";
import {
  Clock,
  Crown,
  Flame,
  Heart,
  Image,
  LayoutGrid,
  Star,
  Tag,
  TrendingUp,
} from "lucide-react";

export const DEFAULT_HOME_SECTION_ICON = Star;
export const DEFAULT_HOME_SECTION_ICON_TONE = "bg-primary/10 text-primary";

export const HOME_SECTION_ICON_MAP: Record<string, LucideIcon> = {
  flame: Flame,
  clock: Clock,
  tag: Tag,
  star: Star,
  "trending-up": TrendingUp,
  heart: Heart,
  image: Image,
  "layout-grid": LayoutGrid,
  crown: Crown,
};

export const HOME_SECTION_ICON_OPTIONS = Object.keys(HOME_SECTION_ICON_MAP);

export const HOME_SECTION_ICON_TONES: Record<string, string> = {
  flame: "bg-orange-600/15 text-orange-700 dark:text-orange-300",
  clock: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  tag: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  star: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  "trending-up": "bg-teal-500/15 text-teal-600 dark:text-teal-300",
  heart: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  image: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  "layout-grid": "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  crown: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
};

export function getHomeSectionIcon(name?: string | null) {
  const key = name?.trim();
  if (!key) return undefined;
  return HOME_SECTION_ICON_MAP[key] ?? DEFAULT_HOME_SECTION_ICON;
}

export function getHomeSectionIconTone(name?: string | null) {
  const key = name?.trim();
  if (!key) return DEFAULT_HOME_SECTION_ICON_TONE;
  return HOME_SECTION_ICON_TONES[key] ?? DEFAULT_HOME_SECTION_ICON_TONE;
}
