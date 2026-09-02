import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** Id for the h2 — pair with `aria-labelledby` on the parent section. */
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

/** Shared eyebrow + title + description block for home sections. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>
      )}
      <h2 id={id} className="mt-2 text-3xl font-bold text-balance sm:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-3 text-muted-foreground">{description}</p>}
    </div>
  );
}
