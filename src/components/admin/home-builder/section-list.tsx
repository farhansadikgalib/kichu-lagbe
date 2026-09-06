"use client";

import { useState, type DragEvent } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SECTION_META } from "@/lib/home/registry";
import { MAX_HOME_SECTIONS, type HomeSection } from "@/lib/home/schema";
import { cn } from "@/lib/utils";
import { SECTION_ICONS } from "./section-icons";

interface SectionListProps {
  sections: HomeSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onReorder: (from: number, to: number) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

interface DropTarget {
  index: number;
  edge: "before" | "after";
}

/**
 * Ordered page outline. Drag rows to reorder (arrow buttons cover keyboard
 * and touch), click to edit, and use the row menu for the rest.
 */
export function SectionList({
  sections,
  selectedId,
  onSelect,
  onToggle,
  onReorder,
  onDuplicate,
  onRemove,
  onAdd,
}: SectionListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  function handleDragOver(event: DragEvent<HTMLLIElement>, index: number) {
    if (dragIndex === null) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const edge = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    if (dropTarget?.index !== index || dropTarget.edge !== edge) setDropTarget({ index, edge });
  }

  function handleDrop() {
    if (dragIndex !== null && dropTarget) {
      let to = dropTarget.edge === "before" ? dropTarget.index : dropTarget.index + 1;
      if (to > dragIndex) to -= 1;
      if (to !== dragIndex) onReorder(dragIndex, to);
    }
    setDragIndex(null);
    setDropTarget(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border/60 bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
        <h2 className="text-sm font-semibold">
          Sections{" "}
          <span className="font-normal text-muted-foreground tabular-nums">
            {sections.length}/{MAX_HOME_SECTIONS}
          </span>
        </h2>
        <Button
          type="button"
          size="sm"
          disabled={sections.length >= MAX_HOME_SECTIONS}
          onClick={onAdd}
        >
          <Plus data-icon="inline-start" aria-hidden />
          Add
        </Button>
      </div>

      {sections.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          The page is empty. Add a section to start building.
        </p>
      ) : (
        <ol className="min-h-0 flex-1 overflow-y-auto p-1.5" aria-label="Page sections">
          {sections.map((section, index) => {
            const active = section.id === selectedId;
            const meta = SECTION_META[section.type];
            const Icon = SECTION_ICONS[section.type];
            const dropBefore = dropTarget?.index === index && dropTarget.edge === "before";
            const dropAfter = dropTarget?.index === index && dropTarget.edge === "after";
            return (
              <li
                key={section.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", section.id);
                  setDragIndex(index);
                }}
                onDragOver={(event) => handleDragOver(event, index)}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop();
                }}
                onDragEnd={handleDrop}
                className={cn(
                  "group/row relative flex items-center gap-1 rounded-lg px-1 py-1 transition-colors",
                  active ? "bg-primary/10" : "hover:bg-accent/60",
                  dragIndex === index && "opacity-40",
                  dropBefore && "before:absolute before:inset-x-2 before:-top-0.5 before:h-0.5 before:rounded before:bg-primary",
                  dropAfter && "after:absolute after:inset-x-2 after:-bottom-0.5 after:h-0.5 after:rounded after:bg-primary",
                )}
              >
                <span
                  aria-hidden
                  className="flex size-6 shrink-0 cursor-grab items-center justify-center text-muted-foreground/60 active:cursor-grabbing"
                >
                  <GripVertical className="size-4" />
                </span>
                <button
                  type="button"
                  onClick={() => onSelect(section.id)}
                  aria-current={active ? "true" : undefined}
                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md py-1 pr-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-md",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 truncate text-sm font-medium",
                        !section.enabled && "text-muted-foreground",
                      )}
                    >
                      {meta.label}
                      {!section.enabled && (
                        <EyeOff className="size-3 shrink-0" aria-label="Hidden" />
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {sectionSummary(section)}
                    </span>
                  </span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-60 group-hover/row:opacity-100 data-[state=open]:opacity-100"
                      aria-label={`Actions for ${meta.label}`}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onSelect={() => onToggle(section.id, !section.enabled)}>
                      {section.enabled ? <EyeOff /> : <Eye />}
                      {section.enabled ? "Hide on page" : "Show on page"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={sections.length >= MAX_HOME_SECTIONS}
                      onSelect={() => onDuplicate(section.id)}
                    >
                      <Copy /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={index === 0} onSelect={() => onReorder(index, index - 1)}>
                      <ChevronUp /> Move up
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={index === sections.length - 1}
                      onSelect={() => onReorder(index, index + 1)}
                    >
                      <ChevronDown /> Move down
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => onRemove(section.id)}>
                      <Trash2 /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/** One line of the section's own copy so rows can be told apart at a glance. */
export function sectionSummary(section: HomeSection) {
  switch (section.type) {
    case "marquee":
    case "stats":
      return section.content.items.map((i) => i.label).join(" · ");
    default:
      return section.content.title;
  }
}
