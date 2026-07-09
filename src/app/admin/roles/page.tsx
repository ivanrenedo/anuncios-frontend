"use client";

import { useState, type ReactNode } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_ROLES } from "@/graphql/queries";
import { CREATE_ROL, UPDATE_ROL, DELETE_ROL } from "@/graphql/mutations";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import Spinner from "@/components/Spinner";
import { formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/errors";
import { useAbilities } from "@/hooks/useAbilities";

interface Role {
  id: string;
  label: string;
  description?: string | null;
  createdAt?: string;
  actions?: string[];
  createdBy?: { id: string; name: string } | null;
}

const ACTIONS = [
  { value: "create", label: "Crear" },
  { value: "read", label: "Leer" },
  { value: "update", label: "Actualizar" },
  { value: "delete", label: "Borrar" },
];

const EMPTY: { label: string; description: string; actions: string[] } = {
  label: "",
  description: "",
  actions: [],
};

export default function AdminRoles() {
  const { data, loading, refetch } = useQuery(GET_ROLES) as {
    data: any;
    loading: boolean;
    refetch: () => void;
  };
  const [createRol, { loading: creating }] = useMutation(CREATE_ROL);
  const [updateRol, { loading: updating }] = useMutation(UPDATE_ROL);
  const [deleteRol, { loading: deleting }] = useMutation(DELETE_ROL);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<Role | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const roles: Role[] = data?.roles ?? [];

  const { can } = useAbilities();
  const canCreate = can("create");
  const canUpdate = can("update");
  const canDelete = can("delete");

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  };
  const openEdit = (r: Role) => {
    setEditId(r.id);
    setForm({
      label: r.label ?? "",
      description: r.description ?? "",
      actions: r.actions ?? [],
    });
    setError("");
    setShowForm(true);
  };

  const toggleAction = (value: string) =>
    setForm((f) => ({
      ...f,
      actions: f.actions.includes(value)
        ? f.actions.filter((a) => a !== value)
        : [...f.actions, value],
    }));

  const save = async () => {
    if (!form.label.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setError("");
    const input = {
      label: form.label.trim(),
      description: form.description.trim() || undefined,
      actions: form.actions,
    };
    try {
      if (editId) await updateRol({ variables: { id: editId, input } });
      else await createRol({ variables: { input } });
      setShowForm(false);
      refetch();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo guardar el rol."));
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setDeleteError("");
    try {
      await deleteRol({ variables: { id: confirm.id } });
      setConfirm(null);
      refetch();
    } catch (e) {
      setDeleteError(getErrorMessage(e, "No se pudo eliminar el rol."));
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">Roles</h1>
          <p className="mt-1 text-sm text-muted">{roles.length} roles</p>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            + Nuevo rol
          </button>
        )}
        
      </div>

      <DataTable<Role>
        loading={loading}
        data={roles}
        searchable
        searchKeys={["label", "description"]}
        searchPlaceholder="Buscar rol…"
        pageSize={10}
        emptyMessage="Sin roles. Crea el primero con “+ Nuevo rol”."
        columns={[
          {
            key: "createdAt",
            label: "Fecha de creación",
            render: (r) => formatDate(r.createdAt),
          },
          {
            key: "label",
            label: "Título",
            render: (r) => <span className="font-medium text-on-surface">{r.label}</span>,
          },
          {
            key: "description",
            label: "Descripción",
            sortable: false,
            render: (r) => (
              <span className="text-on-surface-variant">{r.description || "—"}</span>
            ),
          },
          {
            key: "perms",
            label: "Permisos",
            sortable: false,
            render: (r) =>
              r.actions && r.actions.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {r.actions.map((a) => (
                    <span
                      key={a}
                      className="rounded bg-surface-container px-1.5 py-0.5 text-[11px] font-medium text-on-surface-variant"
                    >
                      {ACTIONS.find((x) => x.value === a)?.label ?? a}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-muted">—</span>
              ),
          },
          {
            key: "createdBy",
            label: "Creado por",
            sortable: false,
            render: (r) => r.createdBy?.name || "Sistema",
          },
        ]}
        actions={canUpdate || canDelete ? (r) => (
          <div className="flex justify-end gap-2">
            {canUpdate && (<button
              onClick={() => openEdit(r)}
              className="rounded-lg border border-outline-variant/40 bg-surface-lowest px-3 py-1.5 text-xs font-medium hover:bg-surface-container"
            >
              Editar
            </button>)}
            {canDelete && (<button
              onClick={() => setConfirm(r)}
              className="rounded-lg bg-danger-soft px-3 py-1.5 text-xs font-medium text-danger"
            >
              Eliminar
            </button>)}
          </div>
        ) : undefined}
      />

      {/* Crear / editar */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? "Editar rol" : "Nuevo rol"}
      >
        <div className="space-y-4">
          <Field label="Título">
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Ej: Administrador"
              className="h-10 w-full rounded-xl border border-outline-variant/50 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>
          <Field label="Descripción">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="¿Para qué sirve este rol?"
              className="w-full rounded-xl border border-outline-variant/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field label="Permisos">
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((a) => {
                const active = form.actions.includes(a.value);
                return (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => toggleAction(a.value)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-outline-variant/50 bg-surface-lowest text-on-surface-variant"
                    }`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </Field>

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
              {creating || updating ? "Guardando…" : "Guardar"}
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
          ¿Eliminar el rol “{confirm?.label}”? Esta acción no se puede deshacer.
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-on-surface">{label}</label>
      {children}
    </div>
  );
}
