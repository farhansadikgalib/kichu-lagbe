"use client";

import { useState } from "react";
import { ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, TableShell, TableStateRows } from "@/components/admin/data-table";
import { ConfirmDialog, FormDialog } from "@/components/admin/form-dialog";
import { errorMessage, useAdminProducts } from "@/components/admin/hooks";
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
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/use-catalog";
import { apiMutate } from "@/lib/api/fetcher";
import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductWithCategory } from "@/types";

const COLUMN_COUNT = 6;

interface ProductForm {
  name: string;
  slug: string;
  categoryId: string;
  price: string;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
}

const EMPTY_FORM: ProductForm = {
  name: "",
  slug: "",
  categoryId: "",
  price: "",
  description: "",
  imageUrl: "",
  isAvailable: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminProductsPage() {
  const { data: products, error, isLoading, mutate } = useAdminProducts();
  const { data: categories } = useCategories();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductWithCategory | null>(null);
  const [deleting, setDeleting] = useState<ProductWithCategory | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setDialogOpen(true);
  }

  function openEdit(product: ProductWithCategory) {
    setEditing(product);
    setForm({
      name: product.name,
      slug: product.slug,
      categoryId: String(product.categoryId),
      price: String(product.price),
      description: product.description ?? "",
      imageUrl: product.imageUrl ?? "",
      isAvailable: product.isAvailable,
    });
    setSlugTouched(true);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.categoryId) {
      toast.error("Please select a category.");
      return;
    }
    setIsSubmitting(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      categoryId: Number(form.categoryId),
      price: Number(form.price),
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      isAvailable: form.isAvailable,
    };
    try {
      if (editing) {
        await apiMutate(`/api/admin/products/${editing.id}`, {
          method: "PATCH",
          body: payload,
        });
        toast.success(`"${payload.name}" updated.`);
      } else {
        await apiMutate("/api/admin/products", { body: payload });
        toast.success(`"${payload.name}" created.`);
      }
      await mutate();
      setDialogOpen(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleAvailability(product: ProductWithCategory, isAvailable: boolean) {
    setPendingId(product.id);
    try {
      await apiMutate(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        body: { isAvailable },
      });
      toast.success(
        `"${product.name}" is now ${isAvailable ? "available" : "unavailable"}.`,
      );
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
      await apiMutate(`/api/admin/products/${deleting.id}`, { method: "DELETE" });
      toast.success(`"${deleting.name}" removed from the catalog.`);
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
      <PageHeader title="Products" description="Manage the catalog and availability.">
        <Button onClick={openAdd}>
          <Plus data-icon="inline-start" aria-hidden />
          Add product
        </Button>
      </PageHeader>

      <TableShell>
        <TableHeader>
          <TableRow>
            <TableHead>
              <span className="sr-only">Image</span>
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Available</TableHead>
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
            isEmpty={!products || products.length === 0}
            emptyMessage="No products yet. Add your first product to get started."
            skeletonRows={8}
          />
          {products?.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt=""
                    className={cn(
                      "size-10 rounded-lg object-cover",
                      !product.isAvailable && "opacity-50",
                    )}
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <ImageIcon className="size-4" aria-hidden />
                  </div>
                )}
              </TableCell>
              <TableCell
                className={cn(
                  "font-medium",
                  !product.isAvailable && "text-muted-foreground",
                )}
              >
                {product.name}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.category.name}
              </TableCell>
              <TableCell>{formatBDT(product.price)}</TableCell>
              <TableCell>
                <Switch
                  checked={product.isAvailable}
                  disabled={pendingId === product.id}
                  onCheckedChange={(checked) =>
                    void toggleAvailability(product, checked)
                  }
                  aria-label={`Toggle availability of ${product.name}`}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${product.name}`}
                    onClick={() => openEdit(product)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    aria-label={`Delete ${product.name}`}
                    onClick={() => setDeleting(product)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableShell>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit product" : "Add product"}
        description={
          editing
            ? "Update the product details below."
            : "Add a new product to the catalog."
        }
        submitLabel={editing ? "Save changes" : "Create product"}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <Label htmlFor="product-name">Name</Label>
          <Input
            id="product-name"
            value={form.name}
            required
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                name: e.target.value,
                slug: slugTouched ? f.slug : slugify(e.target.value),
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-slug">Slug</Label>
          <Input
            id="product-slug"
            value={form.slug}
            required
            pattern="[a-z0-9-]+"
            title="Lowercase letters, numbers, and hyphens only"
            onChange={(e) => {
              setSlugTouched(true);
              setForm((f) => ({ ...f, slug: e.target.value }));
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-category">Category</Label>
          <Select
            value={form.categoryId}
            onValueChange={(value) => setForm((f) => ({ ...f, categoryId: value }))}
          >
            <SelectTrigger id="product-category" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-price">Price (BDT)</Label>
          <Input
            id="product-price"
            type="number"
            min={1}
            step={1}
            value={form.price}
            required
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-description">Description (optional)</Label>
          <Textarea
            id="product-description"
            value={form.description}
            rows={3}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-image">Image URL (optional)</Label>
          <Input
            id="product-image"
            type="url"
            value={form.imageUrl}
            placeholder="https://…"
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="product-available">Available for sale</Label>
          <Switch
            id="product-available"
            checked={form.isAvailable}
            onCheckedChange={(checked) =>
              setForm((f) => ({ ...f, isAvailable: checked }))
            }
          />
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete product"
        description={
          deleting
            ? `"${deleting.name}" will be removed from the storefront and shown as unavailable. Order history is kept.`
            : ""
        }
        isPending={deleting !== null && pendingId === deleting.id}
        onConfirm={handleDelete}
      />
    </div>
  );
}
