import Image from "next/image";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <Image src="/images/logo.png" alt="" width={56} height={56} className="rounded-xl" />
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="max-w-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. {BRAND.name} is
        still here for your late-night cravings.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
