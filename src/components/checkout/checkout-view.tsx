"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Reveal } from "@/components/motion";
import { useCartHydrated } from "@/components/cart/use-cart-hydrated";
import { CouponField } from "@/components/checkout/coupon-field";
import { OrderSummary } from "@/components/checkout/order-summary";
import { PaymentMethod } from "@/components/checkout/payment-method";
import { useDeliveryAreas } from "@/hooks/use-catalog";
import { useSession } from "@/hooks/use-session";
import { apiMutate, FetchError } from "@/lib/api/fetcher";
import { formatBDT, formatOrderNumber } from "@/lib/format";
import { checkoutSchema } from "@/lib/validation/order";
import { selectCartCount, selectCartSubtotal, useCartStore } from "@/stores/cart-store";
import type { CouponValidationResult, Order } from "@/types";

interface FieldErrors {
  customerName?: string;
  phone?: string;
  areaId?: string;
  addressDetails?: string;
  note?: string;
}

/** Checkout page: delivery details form, coupon, live totals, and order placement. */
export function CheckoutView() {
  const router = useRouter();
  const { user } = useSession();
  const { data: areas, error: areasError, isLoading: areasLoading, mutate: retryAreas } =
    useDeliveryAreas();

  const items = useCartStore((s) => s.items);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const clearCart = useCartStore((s) => s.clear);

  // Name defaults to the session user's name until the field is edited.
  const [nameInput, setNameInput] = useState<string | null>(null);
  const name = nameInput ?? user?.name ?? "";
  const [phone, setPhone] = useState("");
  const [areaId, setAreaId] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [coupon, setCoupon] = useState<CouponValidationResult | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Guards: wait for cart hydration; don't bounce to /cart right after placing.
  const hydrated = useCartHydrated();
  const placedRef = useRef(false);
  useEffect(() => {
    if (hydrated && items.length === 0 && !placedRef.current) router.replace("/cart");
  }, [hydrated, items.length, router]);

  const activeAreas = areas?.filter((a) => a.isActive) ?? [];
  const selectedArea = activeAreas.find((a) => String(a.id) === areaId) ?? null;
  const deliveryCharge = selectedArea ? selectedArea.charge : null;
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const total = subtotal + (deliveryCharge ?? 0) - discount;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = checkoutSchema.safeParse({
      customerName: name,
      phone,
      areaId: areaId ? Number(areaId) : 0,
      addressDetails: address,
      note: note.trim() || undefined,
      couponCode: coupon?.code,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
    if (!parsed.success) {
      const fe = z.flattenError(parsed.error).fieldErrors;
      setErrors({
        customerName: fe.customerName?.[0],
        phone: fe.phone?.[0],
        areaId: fe.areaId?.[0],
        addressDetails: fe.addressDetails?.[0],
        note: fe.note?.[0],
      });
      toast.error("Please fix the highlighted fields");
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const order = await apiMutate<Order>("/api/orders", { body: parsed.data });
      placedRef.current = true;
      clearCart();
      toast.success(`Order ${formatOrderNumber(order.orderNumber)} placed!`, {
        description: "We'll confirm it shortly — track progress on the order page.",
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      toast.error(err instanceof FetchError ? err.message : "Could not place the order");
      setSubmitting(false);
    }
  }

  if (!hydrated || items.length === 0) {
    return (
      <div className="container-page py-8 md:py-12">
        <Skeleton className="h-8 w-44" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-12">
      <Reveal>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cash on delivery — average delivery in ~30 minutes.
        </p>
      </Reveal>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
          <Reveal>
            <Card>
              <CardHeader>
                <CardTitle>Delivery details</CardTitle>
                <CardDescription>Where should we bring your order?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="checkout-name">Full name</Label>
                    <Input
                      id="checkout-name"
                      value={name}
                      onChange={(e) => setNameInput(e.target.value)}
                      autoComplete="name"
                      aria-invalid={errors.customerName ? true : undefined}
                      aria-describedby={errors.customerName ? "checkout-name-error" : undefined}
                    />
                    {errors.customerName && (
                      <p id="checkout-name-error" role="alert" className="text-xs text-destructive">
                        {errors.customerName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkout-phone">Phone number</Label>
                    <Input
                      id="checkout-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      autoComplete="tel"
                      aria-invalid={errors.phone ? true : undefined}
                      aria-describedby={errors.phone ? "checkout-phone-error" : undefined}
                    />
                    {errors.phone && (
                      <p id="checkout-phone-error" role="alert" className="text-xs text-destructive">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkout-area">Delivery area</Label>
                  <Select value={areaId} onValueChange={setAreaId}>
                    <SelectTrigger
                      id="checkout-area"
                      className="w-full"
                      aria-invalid={errors.areaId ? true : undefined}
                      aria-describedby={errors.areaId ? "checkout-area-error" : undefined}
                    >
                      <SelectValue
                        placeholder={areasLoading ? "Loading areas…" : "Select your area"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAreas.map((area) => (
                        <SelectItem key={area.id} value={String(area.id)}>
                          {area.name} — {formatBDT(area.charge)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.areaId && (
                    <p id="checkout-area-error" role="alert" className="text-xs text-destructive">
                      {errors.areaId}
                    </p>
                  )}
                  {areasError && (
                    <p className="text-xs text-destructive">
                      Couldn&apos;t load delivery areas.{" "}
                      <Button
                        type="button"
                        variant="link"
                        size="xs"
                        className="h-auto p-0"
                        onClick={() => retryAreas()}
                      >
                        Retry
                      </Button>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkout-address">Address details</Label>
                  <Textarea
                    id="checkout-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Block, road, building, apartment…"
                    rows={3}
                    autoComplete="street-address"
                    aria-invalid={errors.addressDetails ? true : undefined}
                    aria-describedby={errors.addressDetails ? "checkout-address-error" : undefined}
                  />
                  {errors.addressDetails && (
                    <p id="checkout-address-error" role="alert" className="text-xs text-destructive">
                      {errors.addressDetails}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkout-note">
                    Note for the rider{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="checkout-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Gate code, landmark, call on arrival…"
                    rows={2}
                    aria-invalid={errors.note ? true : undefined}
                  />
                  {errors.note && (
                    <p role="alert" className="text-xs text-destructive">
                      {errors.note}
                    </p>
                  )}
                </div>

                <Separator />
                <PaymentMethod />
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <OrderSummary
              itemCount={count}
              subtotal={subtotal}
              deliveryCharge={deliveryCharge}
              discount={discount}
              couponCode={coupon?.code}
              total={total}
              submitting={submitting}
            >
              <CouponField
                subtotal={subtotal}
                applied={coupon}
                onApply={setCoupon}
                onRemove={() => setCoupon(null)}
              />
            </OrderSummary>
          </Reveal>
        </div>
      </form>
    </div>
  );
}
