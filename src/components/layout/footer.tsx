import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion";
import { BRAND, CONTACT, SERVICE } from "@/lib/constants";

const FOOTER_LINKS = [
  { href: "/category/snacks", label: "Snacks" },
  { href: "/category/cigarettes", label: "Cigarettes" },
  { href: "/category/daily", label: "Daily Products" },
  { href: "/orders", label: "My Orders" },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-sidebar pb-24 md:pb-0">
      <Reveal
        stagger
        className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-lg font-bold">
            <Image src="/images/logo.png" alt="" width={28} height={28} className="rounded-md" />
            <span>
              Kichu<span className="text-primary">Lagbe</span>
            </span>
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">{BRAND.description}</p>
          <p className="text-sm text-muted-foreground">
            Delivery window: <span className="text-foreground">{SERVICE.window}</span>
          </p>
        </div>

        <nav aria-label="Footer" className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Explore
          </p>
          <ul className="space-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Contact
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a
                href={`mailto:${CONTACT.email}`}
                className="transition-colors hover:text-foreground"
              >
                {CONTACT.email}
              </a>
            </li>
            <li>{CONTACT.address}</li>
          </ul>
        </div>
      </Reveal>

      {/* Oversized wordmark — clipped at the baseline like a signature. */}
      <div aria-hidden className="container-page overflow-hidden select-none">
        <p className="font-heading -mb-[0.23em] bg-linear-to-b from-foreground/15 to-foreground/[0.02] bg-clip-text text-[clamp(4rem,15vw,13rem)] leading-none font-bold tracking-tight whitespace-nowrap text-transparent">
          Kichu<span className="bg-linear-to-b from-primary/40 to-primary/5 bg-clip-text">Lagbe</span>
        </p>
      </div>

      <div className="border-t border-border/60 py-4">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. {BRAND.tagline} ✨
          </p>
          <p>Made with 🌙 in Badda — open every night.</p>
        </div>
      </div>
    </footer>
  );
}
