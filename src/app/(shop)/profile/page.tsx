"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  BadgeCheck,
  MapPin,
  Mail,
  Phone,
  Plus,
  Edit3,
  Crown,
  Star,
  ShieldCheck,
  Eye,
  Users,
  UserPlus,
  Package,
  ChevronDown,
  ChevronUp,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  PRODUCTS_BY_SELLER,
  FOLLOWERS_COUNT,
  FOLLOWING_COUNT,
  MY_VERIFICATION_REQUEST,
} from "@/graphql/queries";
import { REQUEST_VERIFICATION, DELETE_MY_ACCOUNT } from "@/graphql/mutations";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { resolveImage } from "@/lib/config";
import { formatDate } from "@/lib/format";
import ProductGrid from "@/components/ProductGrid";
import PhoneVerificationModal from "@/components/PhoneVerificationModal";
import Skeleton from "@/components/Skeleton";
import type { Product } from "@/lib/types";

type Tab = "active" | "sold" | "inactive";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: prodData, loading: prodLoading } = useQuery(PRODUCTS_BY_SELLER, {
    variables: { sellerId: user?.id ?? "" },
    skip: !user?.id,
    fetchPolicy: "cache-and-network",
  }) as { data: any; loading: boolean };

  const { data: followersData } = useQuery(FOLLOWERS_COUNT, {
    variables: { userId: user?.id ?? "" },
    skip: !user?.id,
  }) as { data: any };

  const { data: followingData } = useQuery(FOLLOWING_COUNT, {
    variables: { userId: user?.id ?? "" },
    skip: !user?.id,
  }) as { data: any };

  const { data: verificationData, refetch: refetchVerification } = useQuery(
    MY_VERIFICATION_REQUEST,
    { skip: !isAuthenticated, fetchPolicy: "cache-and-network" },
  ) as { data: any; refetch: () => void };

  const [requestVerification, { loading: requestingVerification }] = useMutation(
    REQUEST_VERIFICATION,
    {
      refetchQueries: ["MyVerificationRequest"],
      awaitRefetchQueries: true,
    },
  );

  const [deleteMyAccount, { loading: deletingAccount }] = useMutation(DELETE_MY_ACCOUNT);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="px-6 py-28 text-center">
        <p className="text-lg font-bold">Tu perfil</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Inicia sesión para ver tu perfil, tus anuncios y tus favoritos.
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

  if (authLoading || profileLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-0 sm:px-6">
        <Skeleton className="h-32 w-full rounded-b-3xl sm:h-48" />
        <div className="px-4">
          <Skeleton className="-mt-12 h-24 w-24 rounded-full border-4" />
          <Skeleton className="mt-3 h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 px-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const p = profile;
  const products: Product[] = prodData?.productsBySeller ?? [];
  const totalViews = products.reduce((s, pr) => s + (pr.views ?? 0), 0);
  const followersCount = followersData?.followersCount ?? 0;
  const followingCount = followingData?.followingCount ?? 0;
  const verificationRequest = verificationData?.myVerificationRequest;

  const activeProducts = products.filter((pr) => pr.status === "active");
  const soldProducts = products.filter((pr) => pr.status === "sold");
  const inactiveProducts = products.filter((pr) => pr.status === "inactive");

  const tabProducts =
    activeTab === "active"
      ? activeProducts
      : activeTab === "sold"
        ? soldProducts
        : inactiveProducts;

  const planLabel =
    p?.effectivePlan === "PREMIUM" || p?.plan === "PREMIUM"
      ? "Premium"
      : p?.effectivePlan === "STAR" || p?.plan === "STAR"
        ? "Star"
        : null;

  const handleDeleteAccount = async () => {
    try {
      await deleteMyAccount();
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
      logout();
      router.push("/");
    } catch {
      alert("Error al eliminar la cuenta. Inténtalo de nuevo.");
    }
  };

  const handleRequestVerification = async () => {
    try {
      await requestVerification();
      refetchVerification();
    } catch {
      alert("Error al solicitar la verificación.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl pb-8">
      {/* Cover photo */}
      <div className="relative">
        {p?.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveImage(p.coverUrl)}
            alt=""
            className="h-32 w-full rounded-b-3xl object-cover sm:h-48"
          />
        ) : (
          <div className="h-32 w-full rounded-b-3xl bg-gradient-to-br from-primary via-primary/80 to-secondary sm:h-48" />
        )}

        {/* Avatar overlapping cover */}
        <div className="absolute -bottom-12 left-4 sm:left-6">
          {p?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImage(p.avatarUrl)}
              alt=""
              className="h-24 w-24 rounded-full border-4 border-surface object-cover shadow-card"
            />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-surface bg-primary/15 text-3xl font-extrabold text-primary shadow-card">
              {p?.name?.charAt(0) ?? "?"}
            </div>
          )}
        </div>
      </div>

      {/* User info block */}
      <div className="mt-14 px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-on-surface">{p?.name}</h1>
              {p?.verified && (
                <BadgeCheck size={20} className="fill-primary text-white" strokeWidth={0} />
              )}
              {planLabel && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    planLabel === "Premium"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                  }`}
                >
                  {planLabel === "Premium" ? <Crown size={12} /> : <Star size={12} />}
                  {planLabel}
                </span>
              )}
            </div>

            {p?.bio && (
              <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">{p.bio}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
              {p?.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {p.location}
                </span>
              )}
              {p?.showEmail && p?.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail size={14} /> {p.email}
                </span>
              )}
              {p?.showPhone && p?.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone size={14} /> {p.phone}
                </span>
              )}
              {p?.createdAt && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} /> Miembro desde {formatDate(p.createdAt)}
                </span>
              )}
            </div>

            {/* Verification status inline */}
            {p?.verified ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={14} /> Cuenta verificada
              </p>
            ) : (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                <ShieldCheck size={14} /> Cuenta no verificada
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/edit-profile"
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-4 py-2 text-sm font-bold text-on-surface transition hover:bg-surface-high"
            >
              <Edit3 size={16} /> Editar perfil
            </Link>
            <Link
              href="/plans"
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-4 py-2 text-sm font-bold text-on-surface transition hover:bg-surface-high"
            >
              <Crown size={16} /> Planes
            </Link>
            <Link
              href="/post"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary"
            >
              <Plus size={16} /> Vender
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-6 grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <StatCard icon={<Package size={20} />} label="Anuncios" value={products.length} />
        <StatCard icon={<Users size={20} />} label="Seguidores" value={followersCount} />
        <StatCard icon={<UserPlus size={20} />} label="Siguiendo" value={followingCount} />
        <StatCard icon={<Eye size={20} />} label="Vistas totales" value={totalViews} />
      </div>

      {/* Verification request section */}
      {!p?.verified && (
        <div className="mx-4 mt-6 rounded-xl border border-outline-variant/30 bg-surface-lowest p-5 sm:mx-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-on-surface">
            <ShieldCheck size={18} /> Verificar cuenta
          </h3>
          {!verificationRequest ? (
            <div className="mt-3">
              <p className="text-sm text-muted">
                Solicita la verificación para obtener la insignia de cuenta verificada.
              </p>
              <button
                onClick={handleRequestVerification}
                disabled={requestingVerification}
                className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-60"
              >
                {requestingVerification ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShieldCheck size={16} />
                )}
                Solicitar verificación
              </button>
            </div>
          ) : (
            <div className="mt-3">
              {verificationRequest.status === "pending" && (
                <p className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <Clock size={16} /> Solicitud en revisión (enviada {formatDate(verificationRequest.createdAt)})
                </p>
              )}
              {verificationRequest.status === "approved" && (
                <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={16} /> Verificación aprobada
                </p>
              )}
              {verificationRequest.status === "rejected" && (
                <div>
                  <p className="flex items-center gap-2 text-sm text-danger">
                    <XCircle size={16} /> Solicitud rechazada
                  </p>
                  {verificationRequest.rejectedReason && (
                    <p className="mt-1 text-sm text-muted">
                      Motivo: {verificationRequest.rejectedReason}
                    </p>
                  )}
                  <button
                    onClick={handleRequestVerification}
                    disabled={requestingVerification}
                    className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-60"
                  >
                    {requestingVerification ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={16} />
                    )}
                    Solicitar de nuevo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Product tabs */}
      <div className="mt-8 px-4 sm:px-6">
        <div className="flex items-center gap-1 rounded-xl bg-surface-container p-1">
          {([
            { key: "active" as Tab, label: "Activos", count: activeProducts.length },
            { key: "sold" as Tab, label: "Vendidos", count: soldProducts.length },
            { key: "inactive" as Tab, label: "Inactivos", count: inactiveProducts.length },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                activeTab === tab.key
                  ? "bg-surface-lowest text-on-surface shadow-sm"
                  : "text-muted hover:text-on-surface-variant"
              }`}
            >
              {tab.label}{" "}
              <span
                className={`ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  activeTab === tab.key
                    ? "bg-primary/15 text-primary"
                    : "bg-surface-high text-muted"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {!prodLoading && tabProducts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-muted">
              {activeTab === "active" ? (
                <>
                  No tienes anuncios activos.{" "}
                  <Link href="/post" className="font-semibold text-primary">
                    Publica tu primer anuncio
                  </Link>
                  .
                </>
              ) : activeTab === "sold" ? (
                "No tienes productos vendidos."
              ) : (
                "No tienes anuncios inactivos."
              )}
            </p>
          </div>
        ) : (
          <ProductGrid products={tabProducts} loading={prodLoading} />
        )}
      </div>

      {/* Settings section */}
      <div className="mx-4 mt-10 sm:mx-6">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-lowest px-5 py-4 text-sm font-bold text-on-surface transition hover:bg-surface-container"
        >
          <span>Ajustes de cuenta</span>
          {settingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {settingsOpen && (
          <div className="mt-2 rounded-xl border border-outline-variant/30 bg-surface-lowest p-5">
            <button
              onClick={() => setPhoneModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-surface-container px-4 py-2 text-sm font-bold text-on-surface transition hover:bg-surface-high"
            >
              <Phone size={16} />
              {user?.phone ? "Cambiar teléfono" : "Verificar teléfono"}
            </button>

            <div className="mt-6 border-t border-outline-variant/30 pt-5">
              <h4 className="flex items-center gap-2 text-sm font-bold text-danger">
                <AlertTriangle size={16} /> Zona peligrosa
              </h4>
              <p className="mt-1 text-sm text-muted">
                Esta acción eliminará permanentemente tu cuenta, tus anuncios y todos
                tus datos. No se puede deshacer.
              </p>

              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="mt-3 flex items-center gap-1.5 rounded-lg bg-danger-soft px-4 py-2 text-sm font-bold text-danger transition hover:opacity-80"
                >
                  <Trash2 size={16} /> Eliminar cuenta
                </button>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                    className="flex items-center gap-1.5 rounded-lg bg-danger px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {deletingAccount ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Confirmar eliminación
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="rounded-lg bg-surface-container px-4 py-2 text-sm font-bold text-on-surface transition hover:bg-surface-high"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {phoneModalOpen && (
        <PhoneVerificationModal onClose={() => setPhoneModalOpen(false)} />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 text-center">
      <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-on-surface">
        {value.toLocaleString("es")}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
