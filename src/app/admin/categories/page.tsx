"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Pencil,
  Trash2,
  Plus,
  CornerDownRight,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
} from "lucide-react";
import { GET_CATEGORIES } from "@/graphql/queries";
import {
  CREATE_CATEGORY,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
} from "@/graphql/mutations";
import Modal from "@/components/admin/Modal";
import Spinner from "@/components/Spinner";
import { getErrorMessage } from "@/lib/errors";
import { useAbilities } from "@/hooks/useAbilities";

interface Category {
  id: string;
  slug: string;
  label: string;
  color?: string | null;
  icon?: string | null;
  parentId?: string | null;
  sortOrder?: number;
}

const EMPTY = { label: "", slug: "", color: "#006b5e", icon: "", parentId: "" };

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminCategories() {
  const { data, loading, refetch } = useQuery(GET_CATEGORIES) as {
    data: any;
    loading: boolean;
    refetch: () => void;
  };
  const [createCategory, { loading: creating }] = useMutation(CREATE_CATEGORY);
  const [updateCategory, { loading: updating }] = useMutation(UPDATE_CATEGORY);
  const [deleteCategory, { loading: deleting }] = useMutation(DELETE_CATEGORY);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);


    const { can } = useAbilities();
    const canCreate = can("create");
    const canUpdate = can("update");
    const canDelete = can("delete");

  const categories: Category[] = data?.categories ?? [];
  const byOrder = (a: Category, b: Category) =>
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.label.localeCompare(b.label);
  const roots = categories.filter((c) => !c.parentId).sort(byOrder);
  const childrenOf = (id: string) =>
    categories.filter((c) => c.parentId === id).sort(byOrder);

  // When editing, a category that already has children must stay top-level
  // (we cap the tree at 2 levels).
  const editingHasChildren = !!editId && childrenOf(editId).length > 0;
  // Parents you can pick: top-level categories, never yourself.
  const parentOptions = roots.filter((r) => r.id !== editId);

  // ── Search + accordion + pagination (admin list) ──────────────────────────
  const PAGE_SIZE = 10;
  const q = query.trim().toLowerCase();
  const matches = (c: Category) =>
    c.label.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);

  const filteredRoots = q
    ? roots.filter((r) => matches(r) || childrenOf(r.id).some(matches))
    : roots;
  const totalPages = Math.max(1, Math.ceil(filteredRoots.length / PAGE_SIZE));
  const current = Math.min(page, totalPages - 1);
  const pageRoots = filteredRoots.slice(
    current * PAGE_SIZE,
    current * PAGE_SIZE + PAGE_SIZE,
  );

  // When searching, show only the matching subcategories (unless the parent
  // itself matched, in which case show all of them).
  const childrenToShow = (root: Category) => {
    const kids = childrenOf(root.id);
    return !q || matches(root) ? kids : kids.filter(matches);
  };
  const isOpen = (root: Category) => !!q || expanded.has(root.id);
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allExpanded = roots.length > 0 && roots.every((r) => expanded.has(r.id));
  const toggleAll = () =>
    setExpanded(allExpanded ? new Set() : new Set(roots.map((r) => r.id)));

  // Reset to the first page when the search changes.
  useEffect(() => setPage(0), [query]);

  const openCreate = (parentId = "") => {
    setEditId(null);
    setForm({ ...EMPTY, parentId });
    setSlugEdited(false);
    setError("");
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditId(c.id);
    setForm({
      label: c.label ?? "",
      slug: c.slug ?? "",
      color: c.color ?? "#006b5e",
      icon: c.icon ?? "",
      parentId: c.parentId ?? "",
    });
    setSlugEdited(true);
    setError("");
    setOpen(true);
  };

  const onLabel = (label: string) =>
    setForm((f) => ({ ...f, label, slug: slugEdited ? f.slug : slugify(label) }));

  const save = async () => {
    if (!form.label.trim() || !form.slug.trim()) {
      setError("El nombre y el slug son obligatorios.");
      return;
    }
    setError("");
    const input = {
      label: form.label.trim(),
      slug: form.slug.trim(),
      color: form.color || undefined,
      icon: form.icon.trim() || undefined,
      parentId: form.parentId || null,
    };
    try {
      if (editId) await updateCategory({ variables: { id: editId, input } });
      else await createCategory({ variables: { input } });
      setOpen(false);
      refetch();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo guardar la categoría."));
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setDeleteError("");
    try {
      await deleteCategory({ variables: { id: confirm.id } });
      setConfirm(null);
      refetch();
    } catch (e) {
      setDeleteError(getErrorMessage(e, "No se pudo eliminar la categoría."));
    }
  };

  const confirmBlocked = !!confirm && childrenOf(confirm.id).length > 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">Categorías</h1>
          <p className="mt-1 text-sm text-muted">
            {roots.length} principales · {categories.length - roots.length} subcategorías
          </p>
        </div>
        {canCreate && (<button
          onClick={() => openCreate()}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90"
        >
          <Plus size={16} /> Nueva categoría
        </button>)}
      </div>

      {/* Buscar + expandir todo */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar categoría o subcategoría…"
            className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {!q && (
          <button
            onClick={toggleAll}
            className="rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container"
          >
            {allExpanded ? "Colapsar todo" : "Expandir todo"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-container" />
          ))}
        </div>
      ) : roots.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-12 text-center text-muted">
          Aún no hay categorías. Crea la primera con “Nueva categoría”.
        </div>
      ) : filteredRoots.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-12 text-center text-muted">
          Sin resultados.
        </div>
      ) : (
        <>
        <div className="space-y-3">
          {pageRoots.map((root) => {
            const kids = childrenOf(root.id);
            const open = isOpen(root);
            return (
              <div
                key={root.id}
                className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-lowest"
              >
                {/* Categoría principal */}
                <div className="flex items-center justify-between px-4 py-3">
                  <button
                    type="button"
                    onClick={() => !q && kids.length > 0 && toggle(root.id)}
                    className={`flex min-w-0 flex-1 items-center gap-3 text-left ${
                      !q && kids.length > 0 ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    {kids.length > 0 ? (
                      open ? (
                        <ChevronDown size={16} className="shrink-0 text-muted" />
                      ) : (
                        <ChevronRight size={16} className="shrink-0 text-muted" />
                      )
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                    <span
                      className="h-9 w-9 shrink-0 rounded-xl"
                      style={{ backgroundColor: `${root.color || "#006b5e"}1a` }}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-on-surface">{root.label}</p>
                      <p className="truncate text-xs text-muted">
                        /{root.slug} · {kids.length} subcategorías
                      </p>
                    </div>
                  </button>
                  {canCreate || canUpdate || canDelete ? (<div className="flex shrink-0 gap-1.5">
                    {canCreate && (<button
                      onClick={() => openCreate(root.id)}
                      className="flex h-8 items-center gap-1 rounded-lg border border-outline-variant/40 bg-surface-lowest px-2.5 text-xs font-medium text-primary hover:bg-surface-container"
                      title="Añadir subcategoría"
                    >
                      <Plus size={13} /> Sub
                    </button>)}
                    {canUpdate && (<button
                      onClick={() => openEdit(root)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-outline-variant/40 bg-surface-lowest text-on-surface-variant hover:bg-surface-container"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>)}
                    {canDelete && (<button
                      onClick={() => setConfirm(root)}
                      className="grid h-8 w-8 place-items-center rounded-lg bg-danger-soft text-danger hover:opacity-80"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>)}
                  </div>) : undefined}
                </div>

                {/* Subcategorías */}
                {kids.length > 0 && open && (
                  <div className="divide-y divide-outline-variant/15 border-t border-outline-variant/20 bg-surface-low/40">
                    {childrenToShow(root).map((kid) => (
                      <div
                        key={kid.id}
                        className="flex items-center justify-between py-2.5 pl-8 pr-4"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <CornerDownRight size={14} className="shrink-0 text-muted" />
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: kid.color || root.color || "#006b5e" }}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-on-surface">
                              {kid.label}
                            </p>
                            <p className="truncate text-xs text-muted">/{kid.slug}</p>
                          </div>
                        </div>
                        {canUpdate || canDelete ? (<div className="flex shrink-0 gap-1.5">
                          {canUpdate && (<button
                            onClick={() => openEdit(kid)}
                            className="grid h-7 w-7 place-items-center rounded-lg border border-outline-variant/40 bg-surface-lowest text-on-surface-variant hover:bg-surface-container"
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>)}
                          {canDelete && (<button
                            onClick={() => setConfirm(kid)}
                            className="grid h-7 w-7 place-items-center rounded-lg bg-danger-soft text-danger hover:opacity-80"
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>)}
                        </div>): undefined}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted">
            <span>
              {current * PAGE_SIZE + 1}–
              {Math.min((current + 1) * PAGE_SIZE, filteredRoots.length)} de{" "}
              {filteredRoots.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(current - 1)}
                disabled={current === 0}
                className="grid h-8 w-8 place-items-center rounded-lg border border-outline-variant/50 bg-surface-lowest text-on-surface transition hover:bg-surface-container disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-medium text-on-surface">
                Página {current + 1} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(current + 1)}
                disabled={current >= totalPages - 1}
                className="grid h-8 w-8 place-items-center rounded-lg border border-outline-variant/50 bg-surface-lowest text-on-surface transition hover:bg-surface-container disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
        </>
      )}

      {/* Crear / editar */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "Editar categoría" : form.parentId ? "Nueva subcategoría" : "Nueva categoría"}
      >
        <div className="space-y-4">
          <Field label="Categoría padre">
            <select
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              disabled={editingHasChildren}
              className={inputCls}
            >
              <option value="">Ninguna (categoría principal)</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            {editingHasChildren && (
              <p className="mt-1 text-xs text-muted">
                Tiene subcategorías, así que debe seguir siendo principal.
              </p>
            )}
          </Field>
          <Field label="Nombre">
            <input
              value={form.label}
              onChange={(e) => onLabel(e.target.value)}
              placeholder="Ej: Smartphones"
              className={inputCls}
            />
          </Field>
          <Field label="Slug">
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(true);
                setForm({ ...form, slug: slugify(e.target.value) });
              }}
              placeholder="smartphones"
              className={inputCls}
            />
          </Field>
          <Field label="Color">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color || "#006b5e"}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded-lg border border-outline-variant/50 bg-surface-lowest"
              />
              <input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="#006b5e"
                className={inputCls}
              />
            </div>
          </Field>
          <Field label="Icono (opcional)">
            <input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="ShoppingBag"
              className={inputCls}
            />
          </Field>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setOpen(false)}
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
        title="Eliminar categoría"
      >
        {confirmBlocked ? (
          <p className="mb-4 text-sm text-muted">
            “{confirm?.label}” tiene subcategorías. Elimina o reasigna sus
            subcategorías antes de borrarla.
          </p>
        ) : (
          <p className="mb-4 text-sm text-muted">
            ¿Eliminar “{confirm?.label}”? Esta acción no se puede deshacer.
          </p>
        )}
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
          {!confirmBlocked && (
            <button
              onClick={doDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {deleting && <Spinner size={15} />}
              {deleting ? "Eliminando…" : "Eliminar"}
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-on-surface">
        {label}
      </label>
      {children}
    </div>
  );
}
