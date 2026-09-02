"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, TableShell, TableStateRows } from "@/components/admin/data-table";
import { FormDialog } from "@/components/admin/form-dialog";
import { errorMessage, useAdminAreas } from "@/components/admin/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiMutate } from "@/lib/api/fetcher";
import { formatBDT } from "@/lib/format";
import type { DeliveryArea } from "@/types";

const COLUMN_COUNT = 4;

interface AreaForm {
  name: string;
  charge: string;
  isActive: boolean;
}

const EMPTY_FORM: AreaForm = { name: "", charge: "", isActive: true };

export default function AdminAreasPage() {
  const { data: areas, error, isLoading, mutate } = useAdminAreas();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryArea | null>(null);
  const [form, setForm] = useState<AreaForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(area: DeliveryArea) {
    setEditing(area);
    setForm({
      name: area.name,
      charge: String(area.charge),
      isActive: area.isActive,
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    const payload = {
      name: form.name.trim(),
      charge: Number(form.charge),
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await apiMutate(`/api/admin/areas/${editing.id}`, {
          method: "PATCH",
          body: payload,
        });
        toast.success(`"${payload.name}" updated.`);
      } else {
        await apiMutate("/api/admin/areas", { body: payload });
        toast.success(`"${payload.name}" added.`);
      }
      await mutate();
      setDialogOpen(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(area: DeliveryArea, isActive: boolean) {
    setPendingId(area.id);
    try {
      await apiMutate(`/api/admin/areas/${area.id}`, {
        method: "PATCH",
        body: { isActive },
      });
      toast.success(`"${area.name}" ${isActive ? "activated" : "deactivated"}.`);
      await mutate();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery areas"
        description="Coverage zones and their delivery charges."
      >
        <Button onClick={openAdd}>
          <Plus data-icon="inline-start" aria-hidden />
          Add area
        </Button>
      </PageHeader>

      <TableShell>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Charge</TableHead>
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
            isEmpty={!areas || areas.length === 0}
            emptyMessage="No delivery areas yet. Add one to enable checkout."
          />
          {areas?.map((area) => (
            <TableRow key={area.id}>
              <TableCell className="font-medium">{area.name}</TableCell>
              <TableCell>{formatBDT(area.charge)}</TableCell>
              <TableCell>
                <Switch
                  checked={area.isActive}
                  disabled={pendingId === area.id}
                  onCheckedChange={(checked) => void toggleActive(area, checked)}
                  aria-label={`Toggle delivery area ${area.name}`}
                />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${area.name}`}
                  onClick={() => openEdit(area)}
                >
                  <Pencil />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableShell>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit area" : "Add area"}
        description={
          editing
            ? "Update the delivery area details below."
            : "Add a delivery coverage zone with its charge."
        }
        submitLabel={editing ? "Save changes" : "Add area"}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <Label htmlFor="area-name">Name</Label>
          <Input
            id="area-name"
            value={form.name}
            required
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area-charge">Delivery charge (BDT)</Label>
          <Input
            id="area-charge"
            type="number"
            min={0}
            step={1}
            value={form.charge}
            required
            onChange={(e) => setForm((f) => ({ ...f, charge: e.target.value }))}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="area-active">Active</Label>
          <Switch
            id="area-active"
            checked={form.isActive}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
          />
        </div>
      </FormDialog>
    </div>
  );
}
