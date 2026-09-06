"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ADDABLE_SECTION_TYPES, SECTION_META } from "@/lib/home/registry";
import type { SectionType } from "@/lib/home/schema";
import { SECTION_ICONS } from "./section-icons";

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: SectionType) => void;
}

/** Visual picker for new sections — one card per type with a one-line description. */
export function AddSectionDialog({ open, onOpenChange, onAdd }: AddSectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a section</DialogTitle>
          <DialogDescription>
            It is inserted after the selected section and opens in the editor right away.
          </DialogDescription>
        </DialogHeader>
        <ul className="grid gap-2 sm:grid-cols-2">
          {ADDABLE_SECTION_TYPES.map((type) => {
            const Icon = SECTION_ICONS[type];
            const meta = SECTION_META[type];
            return (
              <li key={type}>
                <button
                  type="button"
                  onClick={() => {
                    onAdd(type);
                    onOpenChange(false);
                  }}
                  className="flex w-full items-start gap-3 rounded-lg border border-border/60 bg-card p-3 text-left transition-colors outline-none hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{meta.label}</span>
                    <span className="block text-xs text-muted-foreground">{meta.description}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
