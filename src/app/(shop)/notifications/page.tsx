"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCircle,
  Flag,
  Heart,
  Info,
  Megaphone,
  MessageCircle,
  ShoppingBag,
  Star,
  Tag,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useDeleteAllNotifications,
  useDeleteNotification,
  useMarkAllRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/useNotifications";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { timeAgo } from "@/lib/format";
import { resolveImage } from "@/lib/config";
import Spinner from "@/components/Spinner";
import Skeleton from "@/components/Skeleton";
import { notificationHref } from "@/components/NotificationsDropdown";

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

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { notifications, loading, refetch } = useNotifications();
  const { markRead } = useMarkNotificationRead();
  const { markAllRead, loading: markingAll } = useMarkAllRead();
  const { remove } = useDeleteNotification();
  const { deleteAll, loading: deletingAll } = useDeleteAllNotifications();

  // Refresh when returning to the tab — matches mobile's on-focus behavior.
  useRefetchOnFocus([refetch]);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="px-6 py-28 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <Bell size={28} />
        </div>
        <p className="mt-4 text-lg font-bold">Tus notificaciones</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Inicia sesión para recibir avisos sobre tus anuncios y favoritos.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary/90"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const unread = notifications.filter((n: any) => !n.read).length;

  const handleClick = async (n: any) => {
    if (!n.read) await markRead(n.id);
    const href = notificationHref(n);
    if (href) router.push(href);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Notificaciones
          </h1>
          <p className="mt-1 text-sm text-muted">
            {unread === 0 ? "Todo al día" : `${unread} sin leer`}
          </p>
        </div>
        <div className="items-center gap-2 hidden md:flex">
          {unread > 0 && (
            <button
              onClick={() => markAllRead()}
              disabled={markingAll}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3.5 py-2 text-sm font-semibold text-primary transition hover:bg-surface-high disabled:opacity-60"
            >
              {markingAll ? <Spinner size={15} /> : <Check size={15} />}{" "}
              Marcar todas
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (
                  !confirm(
                    "¿Borrar todas las notificaciones? Esta acción no se puede deshacer.",
                  )
                )
                  return;
                deleteAll();
              }}
              disabled={deletingAll}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3.5 py-2 text-sm font-semibold text-danger transition hover:bg-surface-high disabled:opacity-60"
            >
              {deletingAll ? <Spinner size={15} /> : <Trash2 size={15} />}{" "}
              Borrar todas
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="items-center gap-2 flex md:hidden mb-3 ">
          {unread > 0 && (
            <button
              onClick={() => markAllRead()}
              disabled={markingAll}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3.5 py-2 text-sm font-semibold text-primary transition hover:bg-surface-high disabled:opacity-60"
            >
              {markingAll ? <Spinner size={15} /> : <Check size={15} />}{" "}
              Marcar todas
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (
                  !confirm(
                    "¿Borrar todas las notificaciones? Esta acción no se puede deshacer.",
                  )
                )
                  return;
                deleteAll();
              }}
              disabled={deletingAll}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3.5 py-2 text-sm font-semibold text-danger transition hover:bg-surface-high disabled:opacity-60"
            >
              {deletingAll ? <Spinner size={15} /> : <Trash2 size={15} />}{" "}
              Borrar todas
            </button>
          )}
        </div>
        {loading && notifications.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <span className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary/70">
              <Bell size={30} strokeWidth={1.2} />
            </span>
            <p className="text-sm font-semibold text-on-surface">Todo al día</p>
            <p className="mt-0.5 text-xs text-muted">
              No tienes notificaciones pendientes.
            </p>
          </div>
        ) : (
          notifications.map((n: any) => {
            const { Icon, className } =
              ICONS[n.type as NotifType] ?? ICONS.message;
            return (
              <div
                key={n.id}
                className={`group flex items-start gap-3 rounded-xl border p-4 transition hover:shadow-soft ${
                  n.read
                    ? "border-outline-variant/30 bg-surface-lowest"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <button
                  onClick={() => handleClick(n)}
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
                        n.read ? "text-on-surface" : "font-bold text-on-surface"
                      }`}
                    >
                      {n.title}
                    </span>
                    {n.body && (
                      <span className="mt-0.5 block text-sm leading-snug text-muted">
                        {n.body}
                      </span>
                    )}
                    <span className="mt-1 block text-xs text-muted">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
                <button
                  onClick={() => remove(n.id)}
                  aria-label="Eliminar notificación"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted opacity-0 transition group-hover:opacity-100 hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
