"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Bell,
  CheckCircle,
  Flag,
  Heart,
  Info,
  Loader2,
  Megaphone,
  MessageCircle,
  ShoppingBag,
  Star,
  Tag,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import {
  useNotifications,
  useMarkAllRead,
  useMarkNotificationRead,
  useDeleteAllNotifications,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { resolveImage } from "@/lib/config";
import { timeAgo } from "@/lib/format";
import Skeleton from "@/components/Skeleton";

type NotifType =
  | "like"
  | "sale"
  | "price"
  | "message"
  | "verified"
  | "report"
  | "follow"
  | "marketing"
  | "review"
  | "system"
  | "security"
  | "alert";

const ICONS: Record<
  NotifType,
  { Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; className: string }
> = {
  message: { Icon: MessageCircle, className: "bg-secondary/15 text-secondary" },
  like: { Icon: Heart, className: "bg-danger/15 text-danger" },
  price: { Icon: Tag, className: "bg-primary/15 text-primary" },
  sale: { Icon: ShoppingBag, className: "bg-primary/15 text-primary" },
  verified: { Icon: CheckCircle, className: "bg-primary/15 text-primary" },
  report: { Icon: Flag, className: "bg-danger/15 text-danger" },
  follow: { Icon: UserPlus, className: "bg-secondary/15 text-secondary" },
  marketing: { Icon: Megaphone, className: "bg-primary/15 text-primary" },
  review: { Icon: Star, className: "bg-primary/15 text-primary" },
  system: { Icon: Info, className: "bg-secondary/15 text-secondary" },
  security: { Icon: Flag, className: "bg-danger/15 text-danger" },
  alert: { Icon: Bell, className: "bg-primary/15 text-primary" },
};

/**
 * Given a notification, return the shop route it should deep-link into.
 * Mirrors the branches in mobile/components/NotificationsModal.handleNotifPress
 * so alerts, follows, reviews and marketing pushes end up on the same screen
 * regardless of which surface the user was on.
 */
export function notificationHref(n: any): string | null {
  const t: NotifType = n.type || "message";
  switch (t) {
    case "like":
    case "price":
    case "alert":
      return n.relatedProductId ? `/product/${n.relatedProductId}` : null;
    case "follow":
      if (n.relatedProductId) return `/product/${n.relatedProductId}`;
      if (n.relatedUserId) return `/user/${n.relatedUserId}`;
      return null;
    case "review":
      return n.relatedUserId ? `/user/${n.relatedUserId}` : null;
    case "report":
      if (n.relatedProductId) return `/product/${n.relatedProductId}`;
      if (n.relatedUserId) return `/user/${n.relatedUserId}`;
      return null;
    case "marketing": {
      const parts: string[] = [];
      if (n.sectionId) parts.push(`sectionId=${encodeURIComponent(n.sectionId)}`);
      if (n.filterCat) parts.push(`filterCat=${encodeURIComponent(n.filterCat)}`);
      return parts.length ? `/explore?${parts.join("&")}` : null;
    }
    case "system":
      if (n.filterCat === "plans") return "/plans";
      if (n.relatedProductId) return `/product/${n.relatedProductId}`;
      return null;
    default:
      return null;
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Anchor rect (viewport coords). If omitted, the dropdown pins to the top-right. */
  anchor?: { top: number; right: number } | null;
}

/**
 * Header-anchored notifications dropdown. Uses the same list + swipe-to-delete
 * primitives as the mobile modal but rendered as a compact popover for
 * desktop. On mobile the same route (/notifications) is used, and the bell
 * icon in the mobile header opens the full page instead of this popover.
 */
export default function NotificationsDropdown({ open, onClose, anchor }: Props) {
  const { notifications, loading, refetch } = useNotifications();
  const { markRead } = useMarkNotificationRead();
  const { markAllRead, loading: markingAll } = useMarkAllRead();
  const { remove } = useDeleteNotification();
  const { deleteAll, loading: deletingAll } = useDeleteAllNotifications();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus, Escape, outside-click.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    // Use pointerdown so we don't race with the bell button's own click.
    setTimeout(() => window.addEventListener("mousedown", onDown), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open, onClose]);

  // Keep the list fresh when the tab regains focus. Cheap because the
  // dropdown only mounts when open.
  useRefetchOnFocus([refetch]);

  const unread = notifications.filter((n: any) => !n.read).length;

  const handleItemClick = async (n: any) => {
    if (!n.read) await markRead(n.id);
    const href = notificationHref(n);
    onClose();
    if (href) router.push(href);
  };

  if (!open) return null;

  const posStyle = anchor
    ? { top: anchor.top, right: anchor.right }
    : { top: 60, right: 16 };

  return (
    <>
      {/* Invisible backdrop so mobile touches close the popover */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[55] sm:hidden"
        aria-hidden
      />
      <div
        ref={containerRef}
        style={posStyle}
        className="fixed z-[60] w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-outline-variant/40 bg-surface-lowest shadow-card sm:w-96"
        role="dialog"
        aria-label="Notificaciones"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-on-surface">
              Notificaciones
            </h2>
            {unread > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  if (!confirm("¿Borrar todas las notificaciones?")) return;
                  await deleteAll();
                }}
                disabled={deletingAll}
                aria-label="Borrar todas"
                className="grid h-8 w-8 place-items-center rounded-full text-danger hover:bg-danger/10 disabled:opacity-60"
              >
                {deletingAll ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="grid h-8 w-8 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Mark all read row */}
        <div className="flex justify-end px-4 py-1.5">
          {unread > 0 ? (
            <button
              onClick={() => markAllRead()}
              disabled={markingAll}
              className="text-xs font-semibold text-secondary hover:text-primary disabled:opacity-60"
            >
              {markingAll ? "Marcando…" : "Leer todo"}
            </button>
          ) : (
            <span className="h-4" />
          )}
        </div>

        {/* List */}
        <div className="max-h-[70vh] overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="space-y-3 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-2/3 rounded" />
                    <Skeleton className="h-3 w-full rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary/70">
                <Bell size={28} strokeWidth={1.2} />
              </span>
              <p className="text-sm font-semibold text-on-surface">
                Todo al día
              </p>
              <p className="mt-0.5 text-xs text-muted">
                No tienes notificaciones pendientes.
              </p>
            </div>
          ) : (
            notifications.map((n: any) => {
              const { Icon, className } = ICONS[n.type as NotifType] ?? ICONS.message;
              return (
                <div
                  key={n.id}
                  className={`group flex items-start gap-3 border-b border-outline-variant/20 px-4 py-3 transition ${
                    n.read ? "bg-surface-lowest" : "bg-primary/5"
                  } hover:bg-surface-container/70`}
                >
                  <button
                    onClick={() => handleItemClick(n)}
                    className="flex flex-1 items-start gap-3 text-left"
                  >
                    {n.avatar ? (
                      <span className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveImage(n.avatar)}
                          alt=""
                          className="h-11 w-11 rounded-full border border-outline-variant/40 object-cover"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-surface-lowest ${className}`}
                        >
                          <Icon size={10} strokeWidth={2} />
                        </span>
                      </span>
                    ) : (
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${className}`}
                      >
                        <Icon size={20} strokeWidth={1.6} />
                      </span>
                    )}
                    <span className="flex-1">
                      <span
                        className={`block text-sm ${
                          n.read ? "text-on-surface" : "font-semibold text-on-surface"
                        }`}
                      >
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-1 block text-[11px] text-muted">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                    )}
                  </button>
                  <button
                    onClick={() => remove(n.id)}
                    aria-label="Eliminar notificación"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted opacity-0 transition group-hover:opacity-100 hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer link */}
        <div className="border-t border-outline-variant/30 px-4 py-2 text-center">
          <Link
            href="/notifications"
            onClick={onClose}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Ver todas
          </Link>
        </div>
      </div>
    </>
  );
}
