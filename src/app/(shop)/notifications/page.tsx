"use client";

import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client/react";
import { Bell, Check, Trash2 } from "lucide-react";
import { GET_NOTIFICATIONS } from "@/graphql/queries";
import {
  MARK_ALL_NOTIFICATIONS_READ,
  MARK_NOTIFICATION_READ,
  DELETE_ALL_NOTIFICATIONS,
} from "@/graphql/mutations";
import { useAuth } from "@/hooks/useAuth";
import { timeAgo } from "@/lib/format";
import { resolveImage } from "@/lib/config";
import Spinner from "@/components/Spinner";
import Skeleton from "@/components/Skeleton";

export default function NotificationsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data, loading, refetch } = useQuery(GET_NOTIFICATIONS, {
    skip: !isAuthenticated,
  }) as { data: any; loading: boolean; refetch: () => void };
  const [markRead] = useMutation(MARK_NOTIFICATION_READ);
  const [markAll, { loading: markingAll }] = useMutation(MARK_ALL_NOTIFICATIONS_READ);
  const [deleteAll, { loading: deletingAll }] = useMutation(DELETE_ALL_NOTIFICATIONS);

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
          className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const notifications = data?.notifications ?? [];
  const unread = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Notificaciones</h1>
          <p className="mt-1 text-sm text-muted">{unread} sin leer</p>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={async () => {
                await markAll();
                refetch();
              }}
              disabled={markingAll}
              className="flex items-center gap-1.5 rounded-full bg-surface-container px-3.5 py-2 text-sm font-semibold text-primary disabled:opacity-60"
            >
              {markingAll ? <Spinner size={15} /> : <Check size={15} />} Marcar todas
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={async () => {
                if (!confirm("¿Borrar todas las notificaciones? Esta acción no se puede deshacer.")) return;
                await deleteAll();
                refetch();
              }}
              disabled={deletingAll}
              className="flex items-center gap-1.5 rounded-full bg-surface-container px-3.5 py-2 text-sm font-semibold text-danger disabled:opacity-60"
            >
              {deletingAll ? <Spinner size={15} /> : <Trash2 size={15} />} Borrar todas
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {loading && notifications.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))
        ) : notifications.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            No tienes notificaciones.
          </p>
        ) : (
          notifications.map((n: any) => (
            <button
              key={n.id}
              onClick={async () => {
                if (!n.read) {
                  await markRead({ variables: { id: n.id } });
                  refetch();
                }
              }}
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                n.read
                  ? "border-outline-variant/30 bg-surface-lowest"
                  : "border-primary/30 bg-primary/5"
              }`}
            >
              {n.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveImage(n.avatar)}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Bell size={18} />
                </span>
              )}
              <div className="flex-1">
                <p className={`text-sm ${n.read ? "text-on-surface" : "font-bold text-on-surface"}`}>
                  {n.title}
                </p>
                {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
                <p className="mt-1 text-xs text-muted">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
