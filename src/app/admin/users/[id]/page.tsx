"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { GET_ROLES, GET_USER } from "@/graphql/queries";
import Badge from "@/components/admin/Badge";
import UserActivity from "@/components/admin/UserActivity";
import Skeleton from "@/components/Skeleton";
import { resolveImage } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { ArrowLeft, BadgeCheck, Mail, Phone, MapPin } from "lucide-react";

export default function AdminUserProfile() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const { data: rolesData } = useQuery(GET_ROLES) as { data: any };
  const router = useRouter();

  const { data, loading } = useQuery(GET_USER, {
    variables: { id },
    skip: !id,
  }) as { data: any; loading: boolean };
  const user = data?.user;

   const roleLabel =
    (rolesData?.roles ?? []).find((r: any) => r.id === user?.rolId)?.label ?? "USER";

  if (loading && !user) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }
  if (!user) {
    return <p className="text-muted">Usuario no encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-on-surface"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      {/* Cabecera: portada + avatar */}
      <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-lowest shadow-soft">
        <div className="h-32 bg-linear-to-br from-gray-900 via-gray-800 to-[#004940]">
          {user.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveImage(user.coverUrl)} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end gap-4">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveImage(user.avatarUrl)}
                alt=""
                className="h-24 w-24 rounded-2xl border-4 border-surface-lowest object-cover"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-2xl border-4 border-surface-lowest bg-primary/15 text-3xl font-extrabold text-primary">
                {user.name?.charAt(0)}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              {roleLabel && <Badge variant="verified">{roleLabel}</Badge>}
              <Badge variant={user.permission === "GRANTED" ? "active" : "draft"}>
                {user.permission === "GRANTED" ? "Acceso concedido" : "Acceso denegado"}
              </Badge>
              {user.verified && (
                <span className="inline-flex items-center gap-1 text-primary">
                  <BadgeCheck size={18} />
                  <span className="text-xs font-semibold">Verificado</span>
                </span>
              )}
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-extrabold text-on-surface">{user.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1">
                <Mail size={14} /> {user.email}
              </span>
              {user.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone size={14} /> {user.phone}
                </span>
              )}
              {user.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {user.location}
                </span>
              )}
              <span>Miembro desde {formatDate(user.createdAt)}</span>
            </div>
            {user.bio && (
              <p className="mt-3 max-w-2xl text-sm text-on-surface-variant">{user.bio}</p>
            )}
          </div>
        </div>
      </div>

      <UserActivity userId={id} onOpenUser={(uid) => router.push(`/admin/users/${uid}`)} />
    </div>
  );
}
