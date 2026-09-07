"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { apiMutate } from "@/lib/api/fetcher";

/** Ends the session, clears the cached user, and returns to the storefront. */
export function useLogout() {
  const router = useRouter();
  const { mutate } = useSession();

  return async function logout() {
    try {
      await apiMutate("/api/auth/logout");
      await mutate(null);
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not log out. Please try again.");
    }
  };
}
