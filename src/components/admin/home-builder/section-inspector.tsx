"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from "lucide-react";
import { ImageUploadField } from "@/components/admin/image-upload-field";
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
import { Textarea } from "@/components/ui/textarea";
import { HomeIcon, type HomeIconName } from "@/lib/home/icons";
import { SECTION_META, type FieldDef, type ListFieldDef } from "@/lib/home/registry";
import { homeSectionSchema, type HomeSection } from "@/lib/home/schema";
import { cn } from "@/lib/utils";
import { SECTION_ICONS } from "./section-icons";

type Values = Record<string, unknown>;
/** Field path → first validation message, e.g. "chips.0.label". */
type Errors = Record<string, string>;

interface SectionInspectorProps {
  section: HomeSection;
  /** `coalesceKey` groups rapid edits of one field into a single undo step. */
  onChange: (content: HomeSection["content"], coalesceKey?: string) => void;
  onToggle: (enabled: boolean) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

function validate(section: HomeSection): Errors {
  const result = homeSectionSchema.safeParse(section);
  if (result.success) return {};
  const errors: Errors = {};
  for (const issue of result.error.issues) {
    const [root, ...rest] = issue.path;
    if (root !== "content") continue;
    const key = rest.join(".");
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

/** Property editor for the selected section, generated from the registry's field list. */
export function SectionInspector({
  section,
  onChange,
  onToggle,
  onDuplicate,
  onRemove,
}: SectionInspectorProps) {
  const meta = SECTION_META[section.type];
  const Icon = SECTION_ICONS[section.type];
  const values = section.content as unknown as Values;
  const errors = useMemo(() => validate(section), [section]);
  const errorCount = Object.keys(errors).length;

  function setValue(key: string, value: unknown, coalesce = true) {
    onChange(
      { ...values, [key]: value } as unknown as HomeSection["content"],
      coalesce ? `${section.id}.${key}` : undefined,
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold">{meta.label}</h2>
            <p className="text-xs text-muted-foreground">{meta.description}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Label className="flex items-center gap-2 text-xs font-medium">
            <Switch size="sm" checked={section.enabled} onCheckedChange={onToggle} />
            {section.enabled ? "Shown on page" : "Hidden from page"}
          </Label>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Duplicate section" onClick={onDuplicate}>
              <Copy />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              aria-label="Remove section"
              onClick={onRemove}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
        {errorCount > 0 && (
          <p role="alert" className="mt-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
            {errorCount === 1 ? "1 field needs attention" : `${errorCount} fields need attention`} before
            publishing.
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {meta.fields.map((field) =>
          field.kind === "list" ? (
            <ListField
              key={field.key}
              field={field}
              idPrefix={`${section.id}-${field.key}`}
              items={(values[field.key] as Values[] | undefined) ?? []}
              errors={errors}
              onChange={(items, coalesce) => setValue(field.key, items, coalesce)}
            />
          ) : (
            <FieldControl
              key={field.key}
              field={field}
              id={`${section.id}-${field.key}`}
              value={values[field.key]}
              error={errors[field.key]}
              onChange={(value, coalesce) => setValue(field.key, value, coalesce)}
            />
          ),
        )}
      </div>
    </div>
  );
}

interface FieldControlProps {
  field: FieldDef;
  id: string;
  value: unknown;
  error?: string;
  /** `coalesce` is false for discrete changes (toggles, selects) so each is its own undo step. */
  onChange: (value: unknown, coalesce: boolean) => void;
}

function FieldHelp({ id, help, error }: { id: string; help?: string; error?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
        {error}
      </p>
    );
  }
  return help ? <p className="text-xs text-muted-foreground">{help}</p> : null;
}

function FieldControl({ field, id, value, error, onChange }: FieldControlProps) {
  const text = typeof value === "string" ? value : value == null ? "" : String(value);
  const invalid = error ? true : undefined;
  const describedBy = error ? `${id}-error` : undefined;

  switch (field.kind) {
    case "boolean":
      return (
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={id}>{field.label}</Label>
          <Switch id={id} checked={Boolean(value)} onCheckedChange={(v) => onChange(v, false)} />
        </div>
      );
    case "image":
      return (
        <div className="space-y-1.5">
          <ImageUploadField
            id={id}
            label={field.label}
            value={text}
            onChange={(url) => onChange(url, false)}
            aspect="wide"
            hint={error ? undefined : field.help}
          />
          {error && <FieldHelp id={id} error={error} />}
        </div>
      );
    case "icon":
    case "select":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Select value={text} onValueChange={(v) => onChange(v, false)}>
            <SelectTrigger id={id} className="w-full" aria-invalid={invalid} aria-describedby={describedBy}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {field.kind === "icon" && (
                    <HomeIcon name={option.value as HomeIconName} className="size-4" />
                  )}
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldHelp id={id} help={field.help} error={error} />
        </div>
      );
    case "textarea":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Textarea
            id={id}
            rows={3}
            value={text}
            placeholder={field.placeholder}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            onChange={(e) => onChange(e.target.value, true)}
          />
          <FieldHelp id={id} help={field.help} error={error} />
        </div>
      );
    case "number":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={field.min}
            max={field.max}
            step={1}
            value={text}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value), true)}
          />
          <FieldHelp id={id} help={field.help} error={error} />
        </div>
      );
    default:
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Input
            id={id}
            value={text}
            placeholder={field.placeholder}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            onChange={(e) => onChange(e.target.value, true)}
          />
          <FieldHelp id={id} help={field.help} error={error} />
        </div>
      );
  }
}

interface ListFieldProps {
  field: ListFieldDef;
  idPrefix: string;
  items: Values[];
  errors: Errors;
  onChange: (items: Values[], coalesce: boolean) => void;
}

/** First text-ish value of an item, for its collapsed header. */
function itemTitle(field: ListFieldDef, item: Values) {
  for (const sub of field.fields) {
    if (sub.kind === "text" || sub.kind === "textarea") {
      const v = item[sub.key];
      if (typeof v === "string" && v.trim()) return v;
    }
  }
  return null;
}

/** Repeatable rows (chips, steps, tiles…): collapsible, reorderable, with add/remove. */
function ListField({ field, idPrefix, items, errors, onChange }: ListFieldProps) {
  const min = field.min ?? 0;
  const [open, setOpen] = useState<Set<number>>(() => new Set(items.length <= 3 ? items.keys() : []));
  const listError = errors[field.key];

  function toggle(index: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next, false);
  }

  function add() {
    onChange([...items, { ...field.newItem }], false);
    setOpen((prev) => new Set(prev).add(items.length));
  }

  return (
    <fieldset className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <legend className="text-sm font-medium">
          {field.label}{" "}
          <span className="font-normal text-muted-foreground tabular-nums">
            {items.length}/{field.max}
          </span>
        </legend>
        <Button type="button" variant="outline" size="xs" disabled={items.length >= field.max} onClick={add}>
          <Plus data-icon="inline-start" aria-hidden />
          Add {field.itemLabel.toLowerCase()}
        </Button>
      </div>
      {listError && (
        <p role="alert" className="text-xs text-destructive">
          {listError}
        </p>
      )}
      {items.length === 0 && !listError && (
        <p className="text-xs text-muted-foreground">None yet.</p>
      )}
      {items.map((item, index) => {
        const expanded = open.has(index);
        const prefix = `${field.key}.${index}.`;
        const itemHasError = Object.keys(errors).some((k) => k.startsWith(prefix));
        return (
          <div
            key={index}
            className={cn(
              "rounded-lg border bg-muted/30",
              itemHasError ? "border-destructive/50" : "border-border/60",
            )}
          >
            <div className="flex items-center gap-1 pr-1 pl-2">
              <button
                type="button"
                onClick={() => toggle(index)}
                aria-expanded={expanded}
                className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ChevronDown
                  className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", !expanded && "-rotate-90")}
                  aria-hidden
                />
                <span className="truncate text-xs">
                  <span className="font-semibold text-muted-foreground uppercase">
                    {field.itemLabel} {index + 1}
                  </span>
                  {itemTitle(field, item) && (
                    <span className="text-foreground"> · {itemTitle(field, item)}</span>
                  )}
                </span>
              </button>
              <Button type="button" variant="ghost" size="icon-xs" disabled={index === 0} aria-label={`Move ${field.itemLabel} ${index + 1} up`} onClick={() => move(index, index - 1)}>
                <ChevronUp />
              </Button>
              <Button type="button" variant="ghost" size="icon-xs" disabled={index === items.length - 1} aria-label={`Move ${field.itemLabel} ${index + 1} down`} onClick={() => move(index, index + 1)}>
                <ChevronDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                disabled={items.length <= min}
                aria-label={`Remove ${field.itemLabel} ${index + 1}`}
                onClick={() => onChange(items.filter((_, i) => i !== index), false)}
              >
                <Trash2 />
              </Button>
            </div>
            {expanded && (
              <div className="space-y-3 border-t border-border/60 p-3">
                {field.fields.map((sub) => (
                  <FieldControl
                    key={sub.key}
                    field={sub}
                    id={`${idPrefix}-${index}-${sub.key}`}
                    value={item[sub.key]}
                    error={errors[`${prefix}${sub.key}`]}
                    onChange={(value, coalesce) =>
                      onChange(
                        items.map((row, i) => (i === index ? { ...row, [sub.key]: value } : row)),
                        coalesce,
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
