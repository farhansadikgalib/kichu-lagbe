"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { mutate as mutateGlobal } from "swr";
import {
  PageHeader,
  TablePagination,
  TableSearchInput,
  TableShell,
  TableStateRows,
} from "@/components/admin/data-table";
import { ConfirmDialog, FormDialog } from "@/components/admin/form-dialog";
import { errorMessage, useAdminProducts } from "@/components/admin/hooks";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import {
  ProductVariantsEditor,
  type VariantDraft,
} from "@/components/admin/product-variants-editor";
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
import { formatBDT, formatDate } from "@/lib/format";
import { isExternalImage } from "@/lib/media/url";
import { startingPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { ProductWithCategory } from "@/types";

const COLUMN_COUNT = 7;
const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

interface ProductForm {
  name: string;
  slug: string;
  categoryId: string;
  price: string;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  variants: VariantDraft[];
}

const EMPTY_FORM: ProductForm = {
  name: "",
  slug: "",
  categoryId: "",
  price: "",
  description: "",
  imageUrl: "",
  isAvailable: true,
  variants: [],
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

/** Small uppercase divider label inside the product form. */
function FormSection({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
  );
}

function optionsLabel(count: number) {
  return `${count} ${count === 1 ? "option" : "options"}`;
}

export default function AdminProductsPage() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, error, isLoading } = useAdminProducts({
    search,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: categories } = useCategories();

  const products = data?.items ?? [];

  /** Re-fetch every cached product page, not just the one on screen. */
  const refreshProducts = () =>
    mutateGlobal((key) => typeof key === "string" && key.startsWith("/api/admin/products"));

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
      variants: product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: String(v.price),
        isAvailable: v.isAvailable,
      })),
    });
    setSlugTouched(true);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.categoryId) {
      toast.error("Please select a category.");
      return;
    }
    if (form.variants.some((v) => !v.name.trim() || !v.price)) {
      toast.error("Every option needs a name and a price.");
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
      variants: form.variants.map((v) => ({
        id: v.id,
        name: v.name.trim(),
        price: Number(v.price),
        isAvailable: v.isAvailable,
      })),
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
        // New products sort first, so show the first unfiltered page.
        setQuery("");
        setSearch("");
        setPage(1);
      }
      await refreshProducts();
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
      await refreshProducts();
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
      toast.success(`"${deleting.name}" deleted.`);
      await refreshProducts();
      setDeleting(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description="Manage the catalog, options, and availability.">
        <Button onClick={openAdd}>
          <Plus data-icon="inline-start" aria-hidden />
          Add product
        </Button>
      </PageHeader>

      <TableSearchInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search products by name"
        className="sm:max-w-sm"
      />

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
            <TableHead>Updated</TableHead>
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
            isEmpty={products.length === 0}
            emptyMessage={
              search
                ? `No products match "${search}".`
                : "No products yet. Add your first product to get started."
            }
            skeletonRows={8}
          />
          {products.map((product) => (
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
              <TableCell className="tabular-nums">
                {product.variants.length > 0 ? (
                  <>
                    <span className="text-muted-foreground">from </span>
                    {formatBDT(startingPrice(product))}
                    <span className="block text-xs text-muted-foreground">
                      {optionsLabel(product.variants.length)}
                    </span>
                  </>
                ) : (
                  formatBDT(product.price)
                )}
              </TableCell>
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
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(product.updatedAt)}
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
      {data && <TablePagination pageInfo={data.pageInfo} onPageChange={setPage} />}

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        size="xl"
        title={editing ? `Edit ${editing.name}` : "Add product"}
        description={
          editing
            ? "Changes apply to the storefront as soon as you save."
            : "Fill in the details, add a photo, and optionally sizes or packs with their own prices."
        }
        submitLabel={editing ? "Save changes" : "Create product"}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      >
        <div className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-4">
            <FormSection title="Details" />
            <div className="space-y-2">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={form.name}
                required
                autoFocus={!editing}
                placeholder="e.g. Lays Classic 50g"
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
              <p className="text-xs text-muted-foreground">
                Generated from the name; lowercase letters, numbers and hyphens only.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="product-price">
                  {form.variants.length > 0 ? "Base price (BDT)" : "Price (BDT)"}
                </Label>
                <Input
                  id="product-price"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={form.price}
                  required
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
                {form.variants.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Customers pay the option price; this is the fallback and the &quot;from&quot; price.
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Description (optional)</Label>
              <Textarea
                id="product-description"
                value={form.description}
                rows={4}
                placeholder="What is it, how big is it, anything the rider should know."
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-5">
            <FormSection title="Photo" />
            <ImageUploadField
              id="product-image"
              label="Product image"
              layout="stacked"
              value={form.imageUrl}
              onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))}
              hint={
                isExternalImage(form.imageUrl)
                  ? "External images are shown as-is, without optimisation."
                  : "JPEG, PNG or WebP up to 4MB. Square images look best."
              }
            />
            <FormSection title="Availability" />
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
              <div>
                <Label htmlFor="product-available">Available for sale</Label>
                <p className="text-xs text-muted-foreground">
                  Hidden products stay in order history.
                </p>
              </div>
              <Switch
                id="product-available"
                checked={form.isAvailable}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isAvailable: checked }))
                }
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 pt-4">
          <ProductVariantsEditor
            variants={form.variants}
            onChange={(variants) => setForm((f) => ({ ...f, variants }))}
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
