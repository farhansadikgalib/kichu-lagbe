export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-sidebar pb-24 md:pb-0">
      {/* Oversized wordmark — clipped at the baseline like a signature. */}
      <div aria-hidden className="container-page overflow-hidden pt-8 select-none">
        <p className="font-heading -mb-[0.23em] bg-linear-to-b from-foreground/15 to-foreground/[0.02] bg-clip-text text-[clamp(4rem,15vw,13rem)] leading-none font-bold tracking-tight whitespace-nowrap text-transparent">
          Kichu<span className="bg-linear-to-b from-primary/40 to-primary/5 bg-clip-text">Lagbe</span>
        </p>
      </div>
    </footer>
  );
}
