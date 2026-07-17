import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 hidden border-t border-outline-variant/40 bg-surface-lowest sm:block">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-sm font-extrabold text-on-primary">
              M
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              Market EG
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted">
            El marketplace de Guinea Ecuatorial. Compra y vende cerca de ti, de
            forma fácil y segura.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-on-surface">Explorar</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/" className="hover:text-primary">Inicio</Link></li>
            <li><Link href="/categories" className="hover:text-primary">Categorías</Link></li>
            <li><Link href="/explore" className="hover:text-primary">Buscar</Link></li>
            <li><Link href="/saved" className="hover:text-primary">Favoritos</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-on-surface">Cuenta</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/post" className="hover:text-primary">Vender</Link></li>
            <li><Link href="/profile" className="hover:text-primary">Mi perfil</Link></li>
            <li><Link href="/login" className="hover:text-primary">Iniciar sesión</Link></li>
            <li><Link href="/admin" className="hover:text-primary">Panel admin</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-on-surface">Información</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/plans" className="hover:text-primary">Planes</Link></li>
            <li><Link href="/help" className="hover:text-primary">Ayuda</Link></li>
            <li><Link href="/terms" className="hover:text-primary">Términos</Link></li>
            <li><Link href="/privacy" className="hover:text-primary">Privacidad</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-outline-variant/40 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Market EG · Guinea Ecuatorial
      </div>
    </footer>
  );
}
