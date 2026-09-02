import Image from "next/image";
import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <Image src="/images/logo.png" alt="" width={56} height={56} className="rounded-xl" />
      <WifiOff className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="max-w-sm text-muted-foreground">
        KichuLagbe needs an internet connection. Check your network and try again.
      </p>
    </main>
  );
}
