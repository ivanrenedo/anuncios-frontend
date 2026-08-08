"use client";

import { useEffect } from "react";
import {
  ChevronRight,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { BRANDS, type CatFilter } from "@/lib/exploreUtils";

export interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  /**
   * `drawer` (default): slide-in modal usado en móvil / pantallas estrechas.
   * `sidebar`: panel estático embebido en el layout — sin backdrop, sin
   *  animaciones, sin lock de scroll. Usado como columna izquierda del
   *  explore en escritorio.
   */
  variant?: "drawer" | "sidebar";

  activeCategory: string;
  catFilter: CatFilter;
  onOpenCategoryPicker: () => void;

  query: string;
  setQuery: (v: string) => void;
  clearSearch: () => void;

  cityFilter: string;
  setCityFilter: (v: string) => void;

  priceMin: string;
  setPriceMin: (v: string) => void;
  priceMax: string;
  setPriceMax: (v: string) => void;
  withPriceOnly: boolean;
  setWithPriceOnly: (v: boolean) => void;

  operation: string | null;
  setOperation: (v: string | null) => void;
  brandModelQuery: string;
  setBrandModelQuery: (v: string) => void;
  activeConditions: string[];
  setActiveConditions: React.Dispatch<React.SetStateAction<string[]>>;
  activeEngines: string[];
  setActiveEngines: React.Dispatch<React.SetStateAction<string[]>>;
  activeTransmissions: string[];
  setActiveTransmissions: React.Dispatch<React.SetStateAction<string[]>>;
  filterOfferType: string | null;
  setFilterOfferType: (v: string | null) => void;
  filterBedrooms: number;
  setFilterBedrooms: React.Dispatch<React.SetStateAction<number>>;
  filterBathrooms: number;
  setFilterBathrooms: React.Dispatch<React.SetStateAction<number>>;
  surfaceMin: string;
  setSurfaceMin: (v: string) => void;

  brand: string | null;
  setBrand: (v: string | null) => void;

  sellerType: "particulares" | "profesionales" | null;
  setSellerType: (v: "particulares" | "profesionales" | null) => void;

  resultCount: number;
  productsLoading: boolean;
  clearFilters: () => void;
  /** Nº de filtros activos — se muestra como pill en el header del sidebar. */
  filterCount?: number;
}

/**
 * Right-side slide-in filter drawer used by the Explore page. Contains every
 * filter the mobile FilterDrawer exposes so the web experience matches feature
 * parity: search text, category, city, price range + "solo con precio",
 * category-vertical fields (operation, brand/model, conditions, engines,
 * transmissions, offerTypes, bedrooms/bathrooms/surface) and seller type.
 * State is owned by the parent; this is a controlled component so the header
 * search input and the drawer stay in sync.
 */
export default function FilterDrawer(props: FilterDrawerProps) {
  const {
    open,
    onClose,
    variant = "drawer",
    activeCategory,
    catFilter,
    onOpenCategoryPicker,
    query,
    setQuery,
    clearSearch,
    cityFilter,
    setCityFilter,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    withPriceOnly,
    setWithPriceOnly,
    operation,
    setOperation,
    brandModelQuery,
    setBrandModelQuery,
    activeConditions,
    setActiveConditions,
    activeEngines,
    setActiveEngines,
    activeTransmissions,
    setActiveTransmissions,
    filterOfferType,
    setFilterOfferType,
    filterBedrooms,
    setFilterBedrooms,
    filterBathrooms,
    setFilterBathrooms,
    surfaceMin,
    setSurfaceMin,
    brand,
    setBrand,
    sellerType,
    setSellerType,
    resultCount,
    productsLoading,
    clearFilters,
    filterCount = 0,
  } = props;

  const CatIcon = catFilter.icon;

  // Close on Escape y lock body scroll — sólo cuando actúa como drawer modal.
  // En modo sidebar el panel forma parte del flujo normal, así que no
  // interceptamos teclas ni bloqueamos el scroll de la página.
  useEffect(() => {
    if (variant !== "drawer" || !open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, variant]);

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  const brandOptions = BRANDS[activeCategory.toLowerCase()] ?? [];
  const showBrandDropdown =
    !catFilter.label && catFilter.brandModel && brandOptions.length > 0;

  const isSidebar = variant === "sidebar";

  // Contenedores diferentes según variante — drawer usa posicionamiento fijo
  // con backdrop; sidebar es un panel estático en el flujo del layout con
  // sombra suave. Usamos max-h para no sobrepasar el viewport; el body
  // interno hace overflow-y-auto para que los filtros largos scrolleen
  // dentro del panel sin desplazar la página.
  const panelClass = isSidebar
    ? "flex max-h-[calc(100vh-7rem)] w-full flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-lowest shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]"
    : `fixed inset-y-0 right-0 z-[71] flex w-full max-w-md flex-col bg-surface-lowest shadow-2xl transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`;

  return (
    <>
      {/* Backdrop — sólo en modo drawer */}
      {!isSidebar && (
        <div
          onClick={onClose}
          className={`fixed inset-0 z-[70] bg-black/40 transition-opacity ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
      )}

      {/* Drawer / Sidebar */}
      <aside
        className={panelClass}
        aria-hidden={!isSidebar && !open}
        data-filter-variant={variant}
      >
        {/* Header — mismo look en drawer y sidebar (icono + título +
            contador + Borrar). En drawer añadimos un botón X para cerrar. */}
        <div className="flex items-center justify-between gap-2 border-b border-outline-variant/30 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <SlidersHorizontal size={16} strokeWidth={2} />
            </span>
            <h2 className="text-base font-extrabold tracking-tight text-on-surface">
              Filtros
            </h2>
            {filterCount > 0 && (
              <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-on-primary">
                {filterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {filterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-primary transition hover:opacity-70"
              >
                Borrar
              </button>
            )}
            {!isSidebar && (
              <button
                type="button"
                onClick={onClose}
                className="ml-1 grid h-8 w-8 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container"
                aria-label="Cerrar filtros"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Body — en sidebar reducimos padding y planamos los cards para
            un look editorial menos "recuadros"; en drawer conservamos el
            look "editorial" plano y sin tarjetas — la misma estética en
            móvil y desktop, sólo cambia el chrome (drawer vs. sidebar). */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 scrollbar-none hover:scrollbar-thin"
          data-flat="true"
        >
          {/* Search — en sidebar es redundante (ya lo hay arriba en la
              cabecera del explore), así que sólo aparece en drawer. */}
          {/* Nota: eliminamos el input de búsqueda interno — el explore
              siempre tiene la barra de búsqueda visible arriba, así que
              tenerla aquí también era redundante y duplicaba el estado. */}

          {/* Qué y dónde */}
          <Card title="Qué y dónde" icon={<MapPin size={16} />}>
            <Label>Categoría</Label>
            <button
              onClick={onOpenCategoryPicker}
              className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface-lowest px-3 py-3 text-left transition hover:bg-surface-container"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
                <CatIcon size={20} strokeWidth={1.8} />
              </span>
              <span className="flex-1 font-semibold text-on-surface">
                {activeCategory}
              </span>
              <ChevronRight size={18} className="text-muted" />
            </button>

            <Label>Ubicación</Label>
            <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface-lowest px-3 py-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-container text-on-surface">
                <MapPin size={18} strokeWidth={1.8} />
              </span>
              <input
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Ej: Malabo"
                className="flex-1 bg-transparent font-semibold text-on-surface outline-none placeholder:font-normal placeholder:text-muted"
              />
              {cityFilter.trim() && (
                <button
                  onClick={() => setCityFilter("")}
                  className="text-muted hover:text-on-surface"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </Card>

          {/* Precio */}
          <Card title="Precio" icon={<Tag size={16} />}>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <PriceInput
                value={priceMin}
                onChange={setPriceMin}
                placeholder="Mín"
              />
              <PriceInput
                value={priceMax}
                onChange={setPriceMax}
                placeholder="Máx"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-on-surface">
                <Tag size={14} className="text-white" />
              </span>
              <span className="flex-1 text-sm font-semibold text-on-surface">
                Solo con precio
              </span>
              <Toggle checked={withPriceOnly} onChange={setWithPriceOnly} />
            </div>
          </Card>

          {/* Category-specific (verticals) */}
          {catFilter.label && (
            <Card
              title={catFilter.label}
              icon={<CatIcon size={16} />}
              borderColor={(catFilter.color ?? undefined) + "66"}
              titleColor={catFilter.color ?? undefined}
            >
              {catFilter.operations && (
                <>
                  <Label>Operación</Label>
                  <Chips
                    options={catFilter.operations}
                    isActive={(o) => operation === o}
                    onToggle={(o) => setOperation(operation === o ? null : o)}
                  />
                </>
              )}

              {catFilter.brandModel &&
                activeCategory.toLowerCase() === "vehículos" && (
                  <>
                    <Label>Marca / Modelo</Label>
                    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface-lowest px-3 py-2.5">
                      <input
                        value={brandModelQuery}
                        onChange={(e) => setBrandModelQuery(e.target.value)}
                        placeholder="Ej: Toyota Corolla"
                        className="flex-1 bg-transparent font-semibold text-on-surface outline-none placeholder:font-normal placeholder:text-muted"
                      />
                      {brandModelQuery.trim() && (
                        <button
                          onClick={() => setBrandModelQuery("")}
                          className="text-muted hover:text-on-surface"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </>
                )}

              {catFilter.conditions && (
                <>
                  <Label>Estado</Label>
                  <Chips
                    options={catFilter.conditions}
                    isActive={(c) => activeConditions.includes(c)}
                    onToggle={(c) =>
                      setActiveConditions((prev) => toggle(prev, c))
                    }
                  />
                </>
              )}

              {catFilter.engines && (
                <>
                  <Label>Motor</Label>
                  <Chips
                    options={catFilter.engines}
                    isActive={(e) => activeEngines.includes(e)}
                    onToggle={(e) => setActiveEngines((prev) => toggle(prev, e))}
                  />
                </>
              )}

              {catFilter.transmissions && (
                <>
                  <Label>Transmisión</Label>
                  <Chips
                    options={catFilter.transmissions}
                    isActive={(t) => activeTransmissions.includes(t)}
                    onToggle={(t) =>
                      setActiveTransmissions((prev) => toggle(prev, t))
                    }
                  />
                </>
              )}

              {catFilter.offerTypes && (
                <>
                  <Label>Tipo de oferta</Label>
                  <Chips
                    options={catFilter.offerTypes}
                    isActive={(o) => filterOfferType === o}
                    onToggle={(o) =>
                      setFilterOfferType(filterOfferType === o ? null : o)
                    }
                  />
                </>
              )}

              {(catFilter.bedrooms || catFilter.bathrooms) && (
                <div className="mb-5 grid grid-cols-2 gap-3">
                  {catFilter.bedrooms && (
                    <div>
                      <Label>Habitaciones (mín.)</Label>
                      <Stepper
                        value={filterBedrooms}
                        onChange={setFilterBedrooms}
                      />
                    </div>
                  )}
                  {catFilter.bathrooms && (
                    <div>
                      <Label>Baños (mín.)</Label>
                      <Stepper
                        value={filterBathrooms}
                        onChange={setFilterBathrooms}
                      />
                    </div>
                  )}
                </div>
              )}

              {catFilter.surface && (
                <>
                  <Label>Superficie mínima (m²)</Label>
                  <PriceInput
                    value={surfaceMin}
                    onChange={setSurfaceMin}
                    placeholder="Ej: 50"
                    suffix="m²"
                  />
                </>
              )}
            </Card>
          )}

          {/* Non-vertical categories with conditions/brand */}
          {!catFilter.label && catFilter.conditions && (
            <Card title="Detalles del producto" icon={<Sparkles size={16} />}>
              {showBrandDropdown && (
                <>
                  <Label>Marca</Label>
                  <select
                    value={brand ?? ""}
                    onChange={(e) => setBrand(e.target.value || null)}
                    className="mb-5 h-11 w-full rounded-2xl border border-outline-variant/40 bg-surface-lowest px-3 text-sm font-semibold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Elegir marca</option>
                    {brandOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </>
              )}
              <Label>Estado</Label>
              <Chips
                options={catFilter.conditions}
                isActive={(c) => activeConditions.includes(c)}
                onToggle={(c) =>
                  setActiveConditions((prev) => toggle(prev, c))
                }
              />
            </Card>
          )}

          {/* Vendedor */}
          <Card title="Vendedor" icon={<Sparkles size={16} />}>
            <Chips
              options={["particulares", "profesionales"]}
              labels={{
                particulares: "Particulares",
                profesionales: "Profesionales",
              }}
              isActive={(t) => sellerType === (t as any)}
              onToggle={(t) =>
                setSellerType(sellerType === (t as any) ? null : (t as any))
              }
            />
          </Card>
        </div>

        {/* Footer — sólo en drawer: el sidebar deja los resultados a la
            derecha, así que un CTA de "ver anuncios" no aporta nada. */}
        {!isSidebar && (
          <div className="border-t border-outline-variant/40 px-4 py-3">
            <button
              onClick={onClose}
              className="flex h-13 min-h-[52px] w-full items-center justify-center rounded-2xl bg-primary text-base font-bold text-on-primary shadow-soft transition hover:bg-primary/90"
            >
              {productsLoading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <>({resultCount}) anuncios</>
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

// ─── Small building blocks ─────────────────────────────────────────────────

function Card({
  title,
  icon,
  borderColor,
  titleColor,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  borderColor?: string;
  titleColor?: string;
  children: React.ReactNode;
}) {
  // El wrapper del sidebar lleva `data-flat`. Cuando estamos dentro de él,
  // aplicamos un look plano (sin borde ni fondo, sólo divisor inferior) para
  // que la lista de secciones se lea como un panel elegante y no como una
  // pila de tarjetas. En drawer, mantenemos las tarjetas destacadas.
  return (
    <div
      className="mb-3 rounded-2xl border bg-surface-lowest p-4 [[data-flat]_&]:mb-0 [[data-flat]_&]:rounded-none [[data-flat]_&]:border-0 [[data-flat]_&]:border-b [[data-flat]_&]:border-outline-variant/25 [[data-flat]_&]:bg-transparent [[data-flat]_&]:px-0 [[data-flat]_&]:py-5 [[data-flat]_&]:last:border-b-0"
      style={{
        borderColor: borderColor || "rgb(from var(--outline-variant) r g b / 0.35)",
      }}
    >
      <div className="mb-3 flex items-center gap-2 text-on-surface-variant [[data-flat]_&]:mb-3.5 [[data-flat]_&]:gap-2">
        <span className="[[data-flat]_&]:text-primary">{icon}</span>
        <h3
          className="text-sm font-semibold [[data-flat]_&]:text-[13px] [[data-flat]_&]:font-bold [[data-flat]_&]:uppercase [[data-flat]_&]:tracking-wider [[data-flat]_&]:text-on-surface"
          style={titleColor ? { color: titleColor } : undefined}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-medium text-on-surface-variant">
      {children}
    </p>
  );
}

function Chips({
  options,
  labels,
  isActive,
  onToggle,
}: {
  options: string[];
  labels?: Record<string, string>;
  isActive: (o: string) => boolean;
  onToggle: (o: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {options.map((o) => {
        const active = isActive(o);
        return (
          <button
            key={o}
            onClick={() => onToggle(o)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              active
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : "border-outline-variant/50 bg-surface-lowest text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {labels?.[o] ?? o}
          </button>
        );
      })}
    </div>
  );
}

function PriceInput({
  value,
  onChange,
  placeholder,
  suffix = "XAF",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  suffix?: string;
}) {
  return (
    <div className="flex h-12 items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-lowest px-3">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        inputMode="numeric"
        className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-muted"
      />
      <span className="border-l border-outline-variant/60 pl-2 text-xs font-semibold text-on-surface-variant">
        {suffix}
      </span>
    </div>
  );
}

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange((v) => Math.max(0, v - 1))}
        className="grid h-10 w-10 place-items-center rounded-lg border border-outline-variant/40 bg-surface-container text-on-surface transition hover:bg-surface-high"
      >
        <Minus size={16} />
      </button>
      <span className="min-w-[28px] text-center text-lg font-bold text-on-surface">
        {value}
      </span>
      <button
        onClick={() => onChange((v) => v + 1)}
        className="grid h-10 w-10 place-items-center rounded-lg border border-outline-variant/40 bg-surface-container text-on-surface transition hover:bg-surface-high"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? "bg-primary" : "bg-surface-high"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
