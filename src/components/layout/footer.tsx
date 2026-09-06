import Link from "next/link";
import { BRAND, CONTACT } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-sidebar pb-24 md:pb-0">
      <nav
        aria-label="Legal"
        className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-6 text-xs text-muted-foreground"
      >
        <p>
          © {new Date().getFullYear()} {BRAND.name}
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy Policy
          </Link>
          <a href={`mailto:${CONTACT.email}`} className="transition-colors hover:text-foreground">
            Contact
          </a>
        </div>
      </nav>

      {/* Oversized wordmark — clipped at the baseline like a signature. */}
      <div aria-hidden className="container-page overflow-hidden pt-4 select-none">
        <p className="font-heading -mb-[0.23em] bg-linear-to-b from-foreground/15 to-foreground/[0.02] bg-clip-text text-[clamp(4rem,15vw,13rem)] leading-none font-bold tracking-tight whitespace-nowrap text-transparent">
          Kichu<span className="bg-linear-to-b from-primary/40 to-primary/5 bg-clip-text">Lagbe</span>
        </p>
      </div>
    </footer>
  );
}
