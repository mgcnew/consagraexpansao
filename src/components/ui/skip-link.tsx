export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:rounded-br-md focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Pular para o conteúdo principal
    </a>
  );
}