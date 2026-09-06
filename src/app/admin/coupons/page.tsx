"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, TableShell, TableStateRows } from "@/components/admin/data-table";
import { ConfirmDialog, FormDialog } from "@/components/admin/form-dialog";
import { errorMessage, useAdminCoupons } from "@/components/admin/hooks";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiMutate } from "@/lib/api/fetcher";
import { formatBDT, formatDate } from "@/lib/format";
import type { Coupon, CouponType } from "@/types";

const COLUMN_COUNT = 7;

interface CouponForm {
  code: string;
  type: CouponType;
  value: string;
  minOrder: string;
  isActive: boolean;
  expiresAt: string;
}

const EMPTY_FORM: CouponForm = {
  code: "",
  type: "fixed",
  value: "",
  minOrder: "0",
  isActive: true,
  expiresAt: "",
};

/** ISO/Date → value for a datetime-local input (local time, minutes precision). */
function toDatetimeLocal(value: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatCouponValue(coupon: Coupon) {
  return coupon.type === "percent" ? `${coupon.value}%` : formatBDT(coupon.value);
}

export default function AdminCouponsPage() {
  const { data: coupons, error, isLoading, mutate } = useAdminCoupons();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(coupon: Coupon) {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minOrder: String(coupon.minOrder),
      isActive: coupon.isActive,
      expiresAt: toDatetimeLocal(coupon.expiresAt),
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    const payload = {
      code: form.code.trim(),
      type: form.type,
      value: Number(form.value),
      minOrder: Number(form.minOrder || 0),
      isActive: form.isActive,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };
    try {
      if (editing) {
        await apiMutate(`/api/admin/coupons/${editing.id}`, {
          method: "PATCH",
          body: payload,
        });
        toast.success(`Coupon ${payload.code} updated.`);
      } else {
        await apiMutate("/api/admin/coupons", { body: payload });
        toast.success(`Coupon ${payload.code} created.`);
      }
      await mutate();
      setDialogOpen(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(coupon: Coupon, isActive: boolean) {
    setPendingId(coupon.id);
    try {
      await apiMutate(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        body: { isActive },
      });
      toast.success(`Coupon ${coupon.code} ${isActive ? "activated" : "deactivated"}.`);
      await mutate();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setPendingId(deleting.id);
    try {
      await apiMutate(`/api/admin/coupons/${deleting.id}`, { method: "DELETE" });
      toast.success(`Coupon ${deleting.code} deleted.`);
      await mutate();
      setDeleting(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons" description="Create and manage discount codes.">
        <Button onClick={openAdd}>
          <Plus data-icon="inline-start" aria-hidden />
          Add coupon
        </Button>
      </PageHeader>

      <TableShell>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead className="hidden md:table-cell">Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="hidden lg:table-cell">Min order</TableHead>
            <TableHead className="hidden sm:table-cell">Expires</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableStateRows
            colSpan={COLUMN_COUNT}
            isLoading={isLoading}
            error={error}
            isEmpty={!coupons || coupons.length === 0}
            emptyMessage="No coupons yet. Create one to offer discounts."
          />
          {coupons?.map((coupon) => {
            const expired =
              coupon.expiresAt !== null && new Date(coupon.expiresAt) < new Date();
            return (
              <TableRow key={coupon.id}>
                <TableCell className="font-mono font-medium">
                  {coupon.code}
                  <span
                    className={`mt-0.5 block text-xs font-normal sm:hidden ${expired ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {coupon.expiresAt
                      ? `${expired ? "Expired " : ""}${formatDate(coupon.expiresAt)}`
                      : "Never expires"}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline">
                    {coupon.type === "percent" ? "Percent" : "Fixed"}
                  </Badge>
                </TableCell>
                <TableCell>{formatCouponValue(coupon)}</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {coupon.minOrder > 0 ? formatBDT(coupon.minOrder) : "—"}
                </TableCell>
                <TableCell
                  className={`hidden sm:table-cell ${expired ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {coupon.expiresAt
                    ? `${expired ? "Expired " : ""}${formatDate(coupon.expiresAt)}`
                    : "Never"}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={coupon.isActive}
                    disabled={pendingId === coupon.id}
                    onCheckedChange={(checked) => void toggleActive(coupon, checked)}
                    aria-label={`Toggle coupon ${coupon.code}`}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit coupon ${coupon.code}`}
                      onClick={() => openEdit(coupon)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Delete coupon ${coupon.code}`}
                      onClick={() => setDeleting(coupon)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </TableShell>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit coupon" : "Add coupon"}
        description={
          editing
            ? "Update the coupon details below."
            : "Create a discount code customers can apply at checkout."
        }
        submitLabel={editing ? "Save changes" : "Create coupon"}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <Label htmlFor="coupon-code">Code</Label>
          <Input
            id="coupon-code"
            value={form.code}
            required
            pattern="[A-Z0-9]+"
            title="Uppercase letters and digits only"
            className="font-mono uppercase"
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
              }))
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="coupon-type">Type</Label>
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, type: value as CouponType }))
              }
            >
              <SelectTrigger id="coupon-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed (BDT)</SelectItem>
                <SelectItem value="percent">Percent (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-value">
              {form.type === "percent" ? "Value (%)" : "Value (BDT)"}
            </Label>
            <Input
              id="coupon-value"
              type="number"
              min={1}
              max={form.type === "percent" ? 100 : undefined}
              step={1}
              value={form.value}
              required
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="coupon-min-order">Minimum order (BDT)</Label>
          <Input
            id="coupon-min-order"
            type="number"
            min={0}
            step={1}
            value={form.minOrder}
            required
            onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coupon-expires">Expires at (optional)</Label>
          <Input
            id="coupon-expires"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="coupon-active">Active</Label>
          <Switch
            id="coupon-active"
            checked={form.isActive}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
          />
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete coupon"
        description={
          deleting
            ? `Coupon ${deleting.code} will be permanently deleted and can no longer be applied at checkout.`
            : ""
        }
        isPending={deleting !== null && pendingId === deleting.id}
        onConfirm={handleDelete}
      />
    </div>
  );
}
