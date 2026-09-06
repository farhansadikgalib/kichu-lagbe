"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MAX_VARIANTS } from "@/lib/validation/catalog";

/** Form-side shape: numbers stay strings until submit, like the rest of the form. */
export interface VariantDraft {
  id?: string;
  name: string;
  price: string;
  isAvailable: boolean;
}

export const EMPTY_VARIANT: VariantDraft = { name: "", price: "", isAvailable: true };

interface ProductVariantsEditorProps {
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
}

/** Repeatable option rows (name + price + on-sale) inside the product form. */
export function ProductVariantsEditor({ variants, onChange }: ProductVariantsEditorProps) {
  function update(index: number, patch: Partial<VariantDraft>) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  return (
    <fieldset className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <legend className="text-sm font-medium">Options</legend>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={variants.length >= MAX_VARIANTS}
          onClick={() => onChange([...variants, EMPTY_VARIANT])}
        >
          <Plus data-icon="inline-start" aria-hidden />
          Add option
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Sizes, packs or flavours, each with its own price. Leave empty to sell at the base price.
      </p>

      {variants.length > 0 && (
        <ul className="space-y-2">
          {variants.map((variant, index) => (
            <li
              key={variant.id ?? index}
              className="grid grid-cols-[minmax(0,1fr)_7rem_auto_auto] items-end gap-3 rounded-lg border border-border/60 bg-muted/30 p-3"
            >
              <div className="space-y-1">
                <Label htmlFor={`variant-name-${index}`} className="text-xs">
                  Name
                </Label>
                <Input
                  id={`variant-name-${index}`}
                  value={variant.name}
                  required
                  placeholder="e.g. Pack of 20"
                  onChange={(e) => update(index, { name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`variant-price-${index}`} className="text-xs">
                  Price
                </Label>
                <Input
                  id={`variant-price-${index}`}
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={variant.price}
                  required
                  onChange={(e) => update(index, { price: e.target.value })}
                />
              </div>
              <div className="flex flex-col items-center gap-1 pb-1">
                <Label htmlFor={`variant-available-${index}`} className="text-xs">
                  On sale
                </Label>
                <Switch
                  id={`variant-available-${index}`}
                  checked={variant.isAvailable}
                  onCheckedChange={(checked) => update(index, { isAvailable: checked })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mb-0.5 text-muted-foreground hover:text-destructive"
                aria-label={`Remove option ${variant.name || index + 1}`}
                onClick={() => onChange(variants.filter((_, i) => i !== index))}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
