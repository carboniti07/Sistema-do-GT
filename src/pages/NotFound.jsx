import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404: rota inexistente:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-6">
      <div className="text-center">
        <h1 className="mb-2 text-5xl font-bold">404</h1>
        <p className="mb-6 text-base text-muted-foreground">Página não encontrada</p>

        <Link
          to="/cadastro"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-white transition-colors hover:bg-[hsl(var(--primary-hover))]"
        >
          Voltar para o cadastro
        </Link>
      </div>
    </div>
  );
}
