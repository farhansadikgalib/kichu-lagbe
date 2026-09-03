"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ChevronDown, ImageOff, Plus, Ticket } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartHydrated } from "@/components/cart/use-cart-hydrated";
import { CouponField } from "@/components/checkout/coupon-field";
import { useDeliveryCharge } from "@/hooks/use-catalog";
import { useSession } from "@/hooks/use-session";
import { apiMutate, FetchError, swrFetcher } from "@/lib/api/fetcher";
import { SERVICE } from "@/lib/constants";
import { formatBDT, formatOrderNumber } from "@/lib/format";
import { normalizePhone } from "@/lib/validation/common";
import { checkoutSchema } from "@/lib/validation/order";
import { cn } from "@/lib/utils";
import {
  selectCartCount,
  selectCartSubtotal,
  useCartStore,
} from "@/stores/cart-store";
import type { CouponValidationResult, Order, User } from "@/types";

interface FieldErrors {
  customerName?: string;
  phone?: string;
  addressDetails?: string;
  note?: string;
}

const itemsLabel = (count: number) =>
  `${count} ${count === 1 ? "item" : "items"}`;

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {children}
    </p>
  );
}

/** Small inline "reveal" link used for the optional note and coupon. */
function RevealButton({
  icon: Icon,
  onClick,
  children,
}: {
  icon: typeof Plus;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Icon className="size-4" aria-hidden />
      {children}
    </button>
  );
}

/** Single-card checkout: details, order, totals. Optional bits stay hidden until asked for. */
export function CheckoutView() {
  const router = useRouter();
  const { user } = useSession();
  // Saved profile phone pre-fills the field; the session user only carries a name.
  const { data: profile } = useSWR<User>(
    user ? "/api/auth/profile" : null,
    swrFetcher,
  );
  const {
    data: delivery,
    error: deliveryError,
    mutate: retryDelivery,
  } = useDeliveryCharge();

  const items = useCartStore((s) => s.items);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const clearCart = useCartStore((s) => s.clear);

  // Name and phone default to the account until the field is edited.
  const [nameInput, setNameInput] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState<string | null>(null);
  const name = nameInput ?? user?.name ?? "";
  const phone =
    phoneInput ?? (profile?.phone ? normalizePhone(profile.phone) : "");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [coupon, setCoupon] = useState<CouponValidationResult | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Guards: wait for cart hydration; don't bounce to /cart right after placing.
  const hydrated = useCartHydrated();
  const placedRef = useRef(false);
  useEffect(() => {
    if (hydrated && items.length === 0 && !placedRef.current)
      router.replace("/cart");
  }, [hydrated, items.length, router]);

  // One flat charge across the coverage area; null until it has loaded.
  const deliveryCharge = delivery?.charge ?? null;
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const total = subtotal + (deliveryCharge ?? 0) - discount;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = checkoutSchema.safeParse({
      customerName: name,
      phone,
      addressDetails: address,
      note: note.trim() || undefined,
      couponCode: coupon?.code,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    });
    if (!parsed.success) {
      const fe = z.flattenError(parsed.error).fieldErrors;
      setErrors({
        customerName: fe.customerName?.[0],
        phone: fe.phone?.[0],
        addressDetails: fe.addressDetails?.[0],
        note: fe.note?.[0],
      });
      if (fe.note) setShowNote(true);
      toast.error("Please fix the highlighted fields");
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const order = await apiMutate<Order>("/api/orders", {
        body: parsed.data,
      });
      placedRef.current = true;
      clearCart();
      toast.success(`Order ${formatOrderNumber(order.orderNumber)} placed!`, {
        description:
          "We'll confirm it shortly. Track progress on the order page.",
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      toast.error(
        err instanceof FetchError ? err.message : "Could not place the order",
      );
      setSubmitting(false);
    }
  }

  if (!hydrated || items.length === 0) {
    return (
      <div className="container-page max-w-xl py-6 md:py-10">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-9 w-48" />
        <Skeleton className="mt-5 h-[26rem] w-full" />
      </div>
    );
  }

  const placeLabel = submitting
    ? "Placing order…"
    : `Place order · ${formatBDT(total)}`;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="container-page max-w-xl pt-5 pb-36 md:pt-10 md:pb-16">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Checkout
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Almost there{" "}
              <span className="text-lg font-medium text-muted-foreground tabular-nums">
                · {itemsLabel(count)}
              </span>
            </h1>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            <Link href="/cart">Edit bag</Link>
          </Button>
        </div>

        <Card className="mt-4 gap-0 p-0">
          {/* Who and where */}
          <div className="space-y-3 p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="checkout-name">Name</Label>
                <Input
                  id="checkout-name"
                  value={name}
                  onChange={(e) => setNameInput(e.target.value)}
                  autoComplete="name"
                  placeholder="Your name"
                  aria-invalid={errors.customerName ? true : undefined}
                  aria-describedby={
                    errors.customerName ? "checkout-name-error" : undefined
                  }
                />
                <FieldError id="checkout-name-error">
                  {errors.customerName}
                </FieldError>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="checkout-phone">Phone</Label>
                <PhoneInput
                  id="checkout-phone"
                  value={phone}
                  onValueChange={setPhoneInput}
                  aria-invalid={errors.phone ? true : undefined}
                  aria-describedby={
                    errors.phone ? "checkout-phone-error" : undefined
                  }
                />
                <FieldError id="checkout-phone-error">
                  {errors.phone}
                </FieldError>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkout-address">
                Address{" "}
                <span className="font-normal text-muted-foreground">
                  in {SERVICE.area}
                </span>
              </Label>
              <Input
                id="checkout-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House, road, block, flat"
                autoComplete="street-address"
                aria-invalid={errors.addressDetails ? true : undefined}
                aria-describedby={
                  errors.addressDetails ? "checkout-address-error" : undefined
                }
              />
              <FieldError id="checkout-address-error">
                {errors.addressDetails}
              </FieldError>
            </div>
            {showNote ? (
              <div className="space-y-1.5">
                <Label htmlFor="checkout-note">Note for the rider</Label>
                <Input
                  id="checkout-note"
                  autoFocus
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Gate code, landmark, call on arrival"
                  aria-invalid={errors.note ? true : undefined}
                  aria-describedby={
                    errors.note ? "checkout-note-error" : undefined
                  }
                />
                <FieldError id="checkout-note-error">{errors.note}</FieldError>
              </div>
            ) : (
              <RevealButton icon={Plus} onClick={() => setShowNote(true)}>
                Add a note for the rider
              </RevealButton>
            )}
          </div>

          {/* What */}
          <div className="border-t border-border/70 px-4 py-3 sm:px-5">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                <span className="font-medium">
                  Your order{" "}
                  <span className="font-normal text-muted-foreground tabular-nums">
                    · {itemsLabel(count)}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  Details
                  <ChevronDown
                    className="size-4 transition-transform duration-200 group-open:rotate-180"
                    aria-hidden
                  />
                </span>
              </summary>
              <ul className="mt-2 space-y-1.5">
                {items.map((item) => (
                  <li
                    key={item.productId}
                    className="flex items-center gap-2.5 text-sm"
                  >
                    <div className="relative size-7 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt=""
                          fill
                          sizes="28px"
                          className="object-cover"
                          unoptimized={item.imageUrl.startsWith("http")}
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-muted-foreground">
                          <ImageOff className="size-3" aria-hidden />
                        </span>
                      )}
                    </div>
                    <p className="min-w-0 flex-1 truncate">
                      {item.name}
                      <span className="text-muted-foreground tabular-nums">
                        {" "}
                        × {item.quantity}
                      </span>
                    </p>
                    <p className="shrink-0 tabular-nums">
                      {formatBDT(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          </div>

          {/* Coupon and totals */}
          <div className="space-y-3 border-t border-border/70 p-4 sm:p-5">
            {showCoupon || coupon ? (
              <CouponField
                subtotal={subtotal}
                applied={coupon}
                onApply={setCoupon}
                onRemove={() => setCoupon(null)}
              />
            ) : (
              <RevealButton icon={Ticket} onClick={() => setShowCoupon(true)}>
                Have a coupon?
              </RevealButton>
            )}

            <dl className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatBDT(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">
                  Delivery · {SERVICE.area}
                </dt>
                <dd className="tabular-nums">
                  {deliveryError ? (
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      className="h-auto p-0 text-destructive"
                      onClick={() => retryDelivery()}
                    >
                      Retry
                    </Button>
                  ) : deliveryCharge === null ? (
                    <Skeleton className="inline-block h-4 w-10 align-middle" />
                  ) : (
                    formatBDT(deliveryCharge)
                  )}
                </dd>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between gap-4 text-emerald-400">
                  <dt>Coupon{coupon?.code ? ` · ${coupon.code}` : ""}</dt>
                  <dd className="tabular-nums">−{formatBDT(discount)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 border-t border-border pt-2.5">
                <dt className="font-semibold">Total</dt>
                <dd className="font-heading text-2xl font-bold tabular-nums">
                  {formatBDT(total)}
                </dd>
              </div>
            </dl>

            <Button
              type="submit"
              size="lg"
              className="hidden w-full md:inline-flex"
              disabled={submitting}
            >
              {placeLabel}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              💵 Cash at the door · ⚡ ~{SERVICE.avgDeliveryMinutes} min ·
              prices confirmed by the server
            </p>
          </div>
        </Card>
      </div>

      {/* Phone: place-order stays glued above the bottom nav. */}
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4rem)] z-40 px-3 md:hidden">
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className={cn(
            "h-13 w-full justify-between rounded-2xl px-5 text-base shadow-xl shadow-primary/30",
            submitting && "justify-center",
          )}
        >
          {submitting ? (
            placeLabel
          ) : (
            <>
              <span>Place order</span>
              <span className="tabular-nums">{formatBDT(total)}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
