"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/data-table";
import { errorMessage, useAdminDelivery } from "@/components/admin/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiMutate } from "@/lib/api/fetcher";
import { SERVICE } from "@/lib/constants";
import { formatBDT } from "@/lib/format";
import type { DeliverySettings } from "@/types";

export default function AdminDeliveryPage() {
  const { data, error, isLoading, mutate } = useAdminDelivery();
  // `null` until the admin types: the field mirrors the saved value, so no
  // effect is needed to copy server state into local state.
  const [draft, setDraft] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charge = draft ?? (data ? String(data.charge) : "");
  const dirty = data !== undefined && draft !== null && draft !== String(data.charge);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const saved = await apiMutate<DeliverySettings>("/api/admin/delivery", {
        method: "PATCH",
        body: { charge: Number(charge) },
      });
      await mutate(saved, { revalidate: false });
      setDraft(null);
      toast.success(`Delivery charge set to ${formatBDT(saved.charge)}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery"
        description={`One flat charge for every order across ${SERVICE.area}.`}
      />

      <form onSubmit={handleSubmit} className="max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Delivery charge</CardTitle>
            <CardDescription>
              Applied to new orders immediately. Orders already placed keep the charge they were
              confirmed with.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="delivery-charge">Charge (BDT)</Label>
            {isLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Input
                id="delivery-charge"
                type="number"
                min={0}
                max={1000}
                step={1}
                inputMode="numeric"
                value={charge}
                required
                onChange={(e) => setDraft(e.target.value)}
              />
            )}
            {error && <p className="text-xs text-destructive">{errorMessage(error)}</p>}
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={!dirty || isSubmitting || charge === ""}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
