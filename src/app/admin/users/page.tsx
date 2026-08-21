"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_USERS, GET_ROLES } from "@/graphql/queries";
import {
  CREATE_USER,
  ADMIN_UPDATE_USER,
  DELETE_USER,
  SUSPEND_USER,
  UNSUSPEND_USER,
} from "@/graphql/mutations";
import DataTable from "@/components/admin/DataTable";
import Badge from "@/components/admin/Badge";
import Modal from "@/components/admin/Modal";
import ExportButton from "@/components/admin/ExportButton";
import { formatDate } from "@/lib/format";
import { resolveImage } from "@/lib/config";
import { useAbilities } from "@/hooks/useAbilities";

import {
  MapPin,
  Calendar,
  ShieldCheck,
  KeyRound,
  Pencil,
  Trash2,
  User,
  Mail,
  ExternalLink,
  Ban,
  RotateCcw,
} from "lucide-react";
import Spinner from "@/components/Spinner";
import { getErrorMessage } from "@/lib/errors";

interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  verified?: boolean;
  location?: string | null;
  rolId?: string | null;
  permission?: string;
  suspended?: boolean;
  suspendedReason?: string | null;
  isBusiness?: boolean;
  createdAt?: string;
}

interface Role {
  id: string;
  label: string;
}

const EMPTY_FORM = {
  name: "",
  email: "",
  location: "",
  rolId: "",
  pin: "",
  verified: false,
  permission: "DENIED",
  isBusiness: false,
};

const PAGE_SIZE = 50;

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, refetch } = useQuery(GET_USERS, {
    variables: {
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
      query: debounced || undefined,
    },
  }) as {
    data: any;
    loading: boolean;
    refetch: () => void;
  };
  const { data: rolesData } = useQuery(GET_ROLES) as { data: any };
  const [createUser, { loading: creating }] = useMutation(CREATE_USER);
  const [adminUpdateUser, { loading: updating }] = useMutation(ADMIN_UPDATE_USER);
  const [deleteUser, { loading: deleting }] = useMutation(DELETE_USER);
  const [suspendUser, { loading: suspending }] = useMutation(SUSPEND_USER);
  const [unsuspendUser, { loading: unsuspending }] = useMutation(UNSUSPEND_USER);
  const router = useRouter();
  const { can, isSuperAdmin } = useAbilities();
  const canCreate = can("create");
  const canUpdate = can("update");
  const canDelete = can("delete");

  const [selected, setSelected] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const users: User[] = data?.users ?? [];
  const roles: Role[] = rolesData?.roles ?? [];
  const detailRole =
    roles.find((r) => r.id === selected?.rolId)?.label ?? null;

  const roleNameById = useMemo(() => {
    const m: Record<string, string> = {};
    roles.forEach((r) => (m[r.id] = r.label));
    return m;
  }, [roles]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditId(u.id);
    setForm({
      name: u.name ?? "",
      email: u.email ?? "",
      location: u.location ?? "",
      rolId: u.rolId ?? "",
      pin: "",
      verified: !!u.verified,
      permission: u.permission ?? "DENIED",
      isBusiness: !!u.isBusiness,
    });
    setError("");
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError("El nombre y el email son obligatorios.");
      return;
    }
    setError("");
    try {
      if (editId) {
        await adminUpdateUser({
          variables: {
            id: editId,
            input: {
              name: form.name.trim(),
              email: form.email.trim(),
              location: form.location.trim() || null,
              rolId: form.rolId || "",
              verified: form.verified,
              permission: form.permission,
              isBusiness: form.isBusiness,
              ...(isSuperAdmin && form.pin.trim()
                ? { pin: form.pin.trim() }
                : {}),
            },
          },
        });
      } else {
        await createUser({
          variables: {
            input: {
              name: form.name.trim(),
              email: form.email.trim(),
              location: form.location.trim() || undefined,
              rolId: form.rolId || undefined,
            },
          },
        });
      }
      setShowForm(false);
      refetch();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo guardar el usuario."));
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setDeleteError("");
    try {
      await deleteUser({ variables: { id: confirm.id } });
      setConfirm(null);
      refetch();
    } catch (e) {
      setDeleteError(getErrorMessage(e, "No se pudo eliminar el usuario."));
    }
  };

  const toggleVerified = async (u: User) => {
    try {
      await adminUpdateUser({
        variables: { id: u.id, input: { verified: !u.verified } },
      });
      refetch();
    } catch {
      /* ignore */
    }
  };

  const toggleSuspension = async (u: User) => {
    try {
      if (u.suspended) {
        await unsuspendUser({ variables: { id: u.id } });
      } else {
        const reason =
          window.prompt(
            `Motivo de la suspensión de "${u.name}" (opcional):`,
          ) ?? undefined;
        await suspendUser({ variables: { id: u.id, reason } });
      }
      setSelected(null);
      refetch();
    } catch {
      /* ignore */
    }
  };

  const togglePermission = async (u: User) => {
    const next = u.permission === "GRANTED" ? "DENIED" : "GRANTED";
    try {
      await adminUpdateUser({
        variables: { id: u.id, input: { permission: next } },
      });
      refetch();
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">Usuarios</h1>
          <p className="mt-1 text-sm text-muted">{users.length} usuarios</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton model="users" />
          {canCreate && (
            <button
              onClick={openCreate}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90"
            >
              + Nuevo usuario
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <input
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full max-w-md rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <DataTable<User>
        loading={loading}
        data={users}
        pageSize={PAGE_SIZE}
        onRowClick={(u) => setSelected(u)}
        columns={[
          {
            key: "name",
            label: "Usuario",
            render: (u) => (
              <div className="flex items-center gap-3">
                {u.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveImage(u.avatarUrl)} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {u.name?.charAt(0) ?? "?"}
                  </div>
                )}
                <div>
                  <p className="font-medium text-on-surface">{u.name}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: "verified",
            label: "Estado",
            sortable: false,
            render: (u) =>
              u.suspended ? (
                <Badge variant="draft">Suspendido</Badge>
              ) : canUpdate ? (
                <button
                  type="button"
                  title="Clic para cambiar"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVerified(u);
                  }}
                  className="cursor-pointer transition hover:opacity-80"
                >
                  <Badge variant={u.verified ? "verified" : "unverified"}>
                    {u.verified ? "Verificado" : "Sin verificar"}
                  </Badge>
                </button>
              ) : (
                <Badge variant={u.verified ? "verified" : "unverified"}>
                  {u.verified ? "Verificado" : "Sin verificar"}
                </Badge>
              ),
          },
          {
            key: "permission",
            label: "Acceso",
            sortable: false,
            render: (u) =>
              canUpdate ? (
                <button
                  type="button"
                  title="Clic para cambiar"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePermission(u);
                  }}
                  className="cursor-pointer transition hover:opacity-80"
                >
                  <Badge variant={u.permission === "GRANTED" ? "active" : "draft"}>
                    {u.permission === "GRANTED" ? "Concedido" : "Denegado"}
                  </Badge>
                </button>
              ) : (
                <Badge variant={u.permission === "GRANTED" ? "active" : "draft"}>
                  {u.permission === "GRANTED" ? "Concedido" : "Denegado"}
                </Badge>
              ),
          },
          {
            key: "rol",
            label: "Rol",
            sortable: false,
            render: (u) =>
              u.rolId ? (
                <Badge variant="verified">{roleNameById[u.rolId] ?? "—"}</Badge>
              ) : (
                <Badge variant="verified">USER</Badge>
              ),
          },
          { key: "location", label: "Ubicación", render: (u) => u.location || "-" },
          { key: "createdAt", label: "Registro", render: (u) => formatDate(u.createdAt) },
        ]}
        actions={
          canUpdate || canDelete
            ? (u) => (
                <div className="flex justify-end gap-2">
                  {canUpdate && (
                    <button
                      onClick={() => openEdit(u)}
                      className="rounded-lg border border-outline-variant/40 bg-surface-lowest px-3 py-1.5 text-xs font-medium hover:bg-surface-container"
                    >
                      Editar
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setConfirm(u)}
                      className="rounded-lg bg-danger-soft px-3 py-1.5 text-xs font-medium text-danger"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              )
            : undefined
        }
      />

      {/* Server pagination */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          className="h-9 rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm font-medium transition hover:bg-surface-container disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-sm text-muted">Página {page + 1}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={users.length < PAGE_SIZE || loading}
          className="h-9 rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm font-medium transition hover:bg-surface-container disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>

      {/* Detalle de usuario */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle de usuario" wide>
        {selected && (
          <div className="space-y-5">
            {/* Encabezado tipo perfil */}
            <div className="overflow-hidden rounded-xl border border-outline-variant/30">
              <div className="h-16 bg-linear-to-br from-gray-900 via-gray-800 to-[#004940]" />
              <div className="px-4 pb-4">
                <div className="-mt-8 flex items-end gap-3">
                  {selected.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImage(selected.avatarUrl)}
                      alt=""
                      className="h-16 w-16 rounded-2xl border-4 border-surface-lowest object-cover"
                    />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-2xl border-4 border-surface-lowest bg-primary/15 text-xl font-extrabold text-primary">
                      {selected.name?.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 pb-1">
                    <p className="truncate text-base font-extrabold text-on-tertiary">{selected.name}</p>
                    <p className="truncate text-sm text-muted">{selected.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detailRole && <Badge variant="verified">{detailRole}</Badge>}
                  <Badge variant={selected.permission === "GRANTED" ? "active" : "draft"}>
                    {selected.permission === "GRANTED" ? "Acceso concedido" : "Acceso denegado"}
                  </Badge>
                  <Badge variant={selected.verified ? "verified" : "unverified"}>
                    {selected.verified ? "Verificado" : "Sin verificar"}
                  </Badge>
                  {selected.suspended && <Badge variant="draft">Suspendido</Badge>}
                </div>
                {selected.suspended && selected.suspendedReason && (
                  <p className="mt-2 text-xs text-danger">
                    Motivo: {selected.suspendedReason}
                  </p>
                )}
              </div>
            </div>

            {/* Detalles */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCard icon={<MapPin size={16} />} label="Ubicación" value={selected.location || "—"} />
              <InfoCard icon={<Calendar size={16} />} label="Miembro desde" value={formatDate(selected.createdAt)} />
              <InfoCard icon={<ShieldCheck size={16} />} label="Rol" value={detailRole || "Sin rol"} />
              <InfoCard
                icon={<KeyRound size={16} />}
                label="Acceso al panel"
                value={selected.permission === "GRANTED" ? "Concedido" : "Denegado"}
              />
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4">
              <button
                onClick={() => router.push(`/admin/users/${selected.id}`)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90"
              >
                <ExternalLink size={15} /> Ir a perfil
              </button>
              {(canUpdate || canDelete) && (
                <div className="flex gap-2">
                  {canUpdate && (
                    <button
                      onClick={() => toggleSuspension(selected)}
                      disabled={suspending || unsuspending}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
                        selected.suspended
                          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                          : "bg-danger-soft text-danger hover:opacity-90"
                      }`}
                    >
                      {selected.suspended ? <RotateCcw size={15} /> : <Ban size={15} />}
                      {suspending || unsuspending
                        ? "Guardando…"
                        : selected.suspended
                          ? "Reactivar"
                          : "Suspender"}
                    </button>
                  )}
                  {canUpdate && (
                    <button
                      onClick={() => {
                        const u = selected;
                        setSelected(null);
                        if (u) openEdit(u);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 py-2 text-sm font-medium hover:bg-surface-container"
                    >
                      <Pencil size={15} /> Editar
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        const u = selected;
                        setSelected(null);
                        if (u) setConfirm(u);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-danger-soft px-4 py-2 text-sm font-medium text-danger"
                    >
                      <Trash2 size={15} /> Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Crear / editar usuario */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? "Editar usuario" : "Nuevo usuario"}
      >
        <div className="space-y-5">
          <div className="space-y-4">
            <Input
              label="Nombre"
              icon={<User size={16} />}
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Ej: María N."
            />
            <Input
              label="Email"
              type="email"
              icon={<Mail size={16} />}
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="usuario@ejemplo.com"
            />
            <Input
              label="Ubicación (Ciudad)"
              icon={<MapPin size={16} />}
              value={form.location}
              onChange={(v) => setForm({ ...form, location: v })}
              placeholder="Ej: Malabo, Bata…"
            />
            <Select
              label="Rol"
              value={form.rolId}
              onChange={(v) => setForm({ ...form, rolId: v })}
              options={[
                { value: "", label: "Sin rol" },
                ...roles.map((r) => ({ value: r.id, label: r.label })),
              ]}
            />
          </div>

          {editId && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Acceso al panel
              </p>
              <div className="space-y-4 rounded-xl border border-outline-variant/30 p-4">
                {isSuperAdmin && (
                  <div>
                    <Input
                      label="Nuevo PIN admin"
                      icon={<KeyRound size={16} />}
                      value={form.pin}
                      onChange={(v) =>
                        setForm({
                          ...form,
                          pin: v.replace(/\D/g, "").slice(0, 12),
                        })
                      }
                      placeholder="Dejar vacío para no cambiar"
                    />
                    <p className="mt-1 text-xs text-muted">
                      Solo SUPER_ADMIN puede cambiar este PIN. Debe tener entre
                      4 y 12 dígitos.
                    </p>
                  </div>
                )}
                <div className="divide-y divide-outline-variant/30">
                <ToggleRow
                  label="Verificado"
                  description="Marca la cuenta como verificada"
                  checked={form.verified}
                  onChange={(v) => setForm({ ...form, verified: v })}
                />
                <ToggleRow
                  label="Acceso al panel de administración"
                  description="Permitir iniciar sesión en el panel"
                  checked={form.permission === "GRANTED"}
                  onChange={(v) =>
                    setForm({ ...form, permission: v ? "GRANTED" : "DENIED" })
                  }
                />
                <ToggleRow
                  label="Cuenta de negocio"
                  description="Su teléfono y email se usan como contacto oficial en la app móvil (planes, boosts, ayuda). Solo un usuario puede tener este rol a la vez."
                  checked={form.isBusiness}
                  onChange={(v) => setForm({ ...form, isBusiness: v })}
                />
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl bg-surface-container px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={creating || updating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
            >
              {(creating || updating) && <Spinner size={15} />}
              {creating || updating ? "Guardando…" : editId ? "Guardar" : "Crear"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmar borrado */}
      <Modal
        open={!!confirm}
        onClose={() => {
          setConfirm(null);
          setDeleteError("");
        }}
        title="Confirmar eliminación"
      >
        <p className="mb-4 text-sm text-muted">
          ¿Eliminar a “{confirm?.name}”? Se borrarán también sus anuncios,
          favoritos y reseñas. Esta acción no se puede deshacer.
        </p>
        {deleteError && <p className="mb-4 text-sm text-danger">{deleteError}</p>}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setConfirm(null);
              setDeleteError("");
            }}
            className="rounded-xl bg-surface-container px-4 py-2 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={doDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {deleting && <Spinner size={15} />}
            {deleting ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-outline-variant/30 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="truncate text-sm font-semibold text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-on-surface">{label}</p>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-primary" : "bg-outline-variant/60"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface-lowest shadow transition-all ${
            checked ? "left-5.5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-on-surface">{label}</label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-10 w-full rounded-xl border border-outline-variant/50 ${
            icon ? "pl-9 pr-3" : "px-3"
          } text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20`}
        />
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-on-surface">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
