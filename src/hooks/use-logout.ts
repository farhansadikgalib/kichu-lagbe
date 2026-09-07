"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { apiMutate } from "@/lib/api/fetcher";
import { useCartStore } from "@/stores/cart-store";

/** Ends the session, clears the cached user and cart, and returns to the storefront. */
export function useLogout() {
  const router = useRouter();
  const { mutate } = useSession();

  return async function logout() {
    try {
      await apiMutate("/api/auth/logout");
      await mutate(null);
      useCartStore.getState().clear();
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not log out. Please try again.");
    }
  };
}
