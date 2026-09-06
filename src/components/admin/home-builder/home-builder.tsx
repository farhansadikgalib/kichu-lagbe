"use client";

import { useCallback, useEffect, useState } from "react";
import { Redo2, RotateCcw, Undo2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/form-dialog";
import { errorMessage, useAdminHomeLayout } from "@/components/admin/hooks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiMutate } from "@/lib/api/fetcher";
import { SECTION_META } from "@/lib/home/registry";
import {
  createSection,
  DEFAULT_HOME_LAYOUT,
  duplicateSection,
  homeLayoutSchema,
  MAX_HOME_SECTIONS,
  type HomeLayout,
  type HomeSection,
  type SectionType,
} from "@/lib/home/schema";
import { cn } from "@/lib/utils";
import { AddSectionDialog } from "./add-section-dialog";
import { LivePreview, type PreviewSelection } from "./live-preview";
import { SectionInspector } from "./section-inspector";
import { SectionList } from "./section-list";
import { useLayoutHistory } from "./use-layout-history";

type Pane = "sections" | "preview" | "edit";

const PANES: Array<{ value: Pane; label: string }> = [
  { value: "sections", label: "Sections" },
  { value: "preview", label: "Preview" },
  { value: "edit", label: "Edit" },
];

function moveItem<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  );
}

/**
 * Page builder for the storefront home: outline on the left, the real page in
 * the middle (click a section to select it), properties on the right. Edits
 * are undoable and stay local until published.
 */
export function HomeBuilder() {
  const { data: published, error, isLoading, mutate } = useAdminHomeLayout();
  const history = useLayoutHistory(published);
  const layout = history.draft ?? published ?? null;

  const [selection, setSelection] = useState<PreviewSelection>({ id: null, scroll: false });
  const [pane, setPane] = useState<Pane>("preview");
  const [adding, setAdding] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selected = layout?.sections.find((s) => s.id === selection.id) ?? null;

  /* ------------------------------- Editing ------------------------------- */

  const commit = useCallback(
    (sections: HomeSection[], coalesceKey?: string) => {
      if (!layout) return;
      history.set({ ...layout, sections }, coalesceKey);
    },
    [layout, history],
  );

  function updateSection(id: string, patch: Partial<HomeSection>, coalesceKey?: string) {
    if (!layout) return;
    commit(
      layout.sections.map((s) => (s.id === id ? ({ ...s, ...patch } as HomeSection) : s)),
      coalesceKey,
    );
  }

  /** Select from the outline or inspector: the preview scrolls to it. */
  function selectAndReveal(id: string | null) {
    setSelection({ id, scroll: true });
    if (id) setPane("edit");
  }

  function insertSection(section: HomeSection) {
    if (!layout) return;
    if (layout.sections.length >= MAX_HOME_SECTIONS) {
      toast.error(`A page can have at most ${MAX_HOME_SECTIONS} sections.`);
      return;
    }
    const at = selection.id ? layout.sections.findIndex((s) => s.id === selection.id) + 1 : layout.sections.length;
    const next = [...layout.sections];
    next.splice(at || layout.sections.length, 0, section);
    commit(next);
    selectAndReveal(section.id);
  }

  function addSection(type: SectionType) {
    insertSection(createSection(type));
  }

  function duplicate(id: string) {
    const source = layout?.sections.find((s) => s.id === id);
    if (!source) return;
    setSelection({ id, scroll: false });
    insertSection(duplicateSection(source));
    toast.success(`${SECTION_META[source.type].label} duplicated.`);
  }

  function remove(id: string) {
    const target = layout?.sections.find((s) => s.id === id);
    if (!layout || !target) return;
    commit(layout.sections.filter((s) => s.id !== id));
    if (selection.id === id) setSelection({ id: null, scroll: false });
    toast(`${SECTION_META[target.type].label} removed`, {
      action: { label: "Undo", onClick: () => history.undo() },
    });
  }

  function reorder(from: number, to: number) {
    if (!layout) return;
    commit(moveItem(layout.sections, from, to));
  }

  /* ------------------------------ Publishing ----------------------------- */

  const publish = useCallback(async () => {
    if (!layout || !history.dirty || isSaving) return;
    const parsed = homeLayoutSchema.safeParse(layout);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const section = layout.sections[Number(issue.path[1])];
      toast.error(
        section
          ? `${SECTION_META[section.type].label}: ${issue.path.slice(3).join(" › ") || "section"} — ${issue.message}`
          : issue.message,
      );
      if (section) selectAndReveal(section.id);
      return;
    }
    setIsSaving(true);
    try {
      const saved = await apiMutate<HomeLayout>("/api/admin/home", { method: "PUT", body: parsed.data });
      await mutate(saved, { revalidate: false });
      history.reset();
      toast.success("Home page published.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }, [layout, history, isSaving, mutate]);

  /* ------------------------------ Shortcuts ------------------------------ */

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      const key = event.key.toLowerCase();
      if (key === "s") {
        event.preventDefault();
        void publish();
      } else if (!isEditableTarget(event.target)) {
        if (key === "z" && !event.shiftKey) {
          event.preventDefault();
          history.undo();
        } else if ((key === "z" && event.shiftKey) || key === "y") {
          event.preventDefault();
          history.redo();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [publish, history]);

  // Unpublished edits live only in this tab.
  useEffect(() => {
    if (!history.dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [history.dirty]);

  /* -------------------------------- Render ------------------------------- */

  return (
    <div className="flex flex-col gap-4 xl:h-[calc(100dvh-7rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Home page</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Click a section in the preview or the outline to edit it. Changes go live when you publish.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Undo" title="Undo (⌘Z)" disabled={!history.canUndo || isSaving} onClick={history.undo}>
            <Undo2 />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Redo" title="Redo (⇧⌘Z)" disabled={!history.canRedo || isSaving} onClick={history.redo}>
            <Redo2 />
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={!layout || isSaving} onClick={() => setConfirmRestore(true)}>
            <RotateCcw data-icon="inline-start" aria-hidden />
            Restore defaults
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!history.dirty || isSaving} onClick={history.reset}>
            Discard
          </Button>
          <Button type="button" size="sm" title="Publish (⌘S)" disabled={!history.dirty || isSaving} onClick={() => void publish()}>
            <Upload data-icon="inline-start" aria-hidden />
            {isSaving ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-border/60 bg-card p-6 text-center text-sm text-destructive">
          Couldn&apos;t load the home page layout. Please check your connection and try again.
        </div>
      ) : isLoading || !layout ? (
        <div className="grid gap-4 xl:grid-cols-[17rem_minmax(0,1fr)_22rem]">
          <Skeleton className="h-96" />
          <Skeleton className="h-[70dvh]" />
          <Skeleton className="hidden h-96 xl:block" />
        </div>
      ) : (
        <>
          <Tabs value={pane} onValueChange={(value) => setPane(value as Pane)} className="xl:hidden">
            <TabsList className="w-full" aria-label="Builder panes">
              {PANES.map((p) => (
                <TabsTrigger key={p.value} value={p.value}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[17rem_minmax(0,1fr)_22rem]">
            <div className={cn("min-h-0 xl:block", pane !== "sections" && "hidden")}>
              <SectionList
                sections={layout.sections}
                selectedId={selection.id}
                onSelect={selectAndReveal}
                onToggle={(id, enabled) => updateSection(id, { enabled })}
                onReorder={reorder}
                onDuplicate={duplicate}
                onRemove={remove}
                onAdd={() => setAdding(true)}
              />
            </div>

            <LivePreview
              className={cn("min-h-0 xl:flex", pane !== "preview" && "hidden")}
              layout={layout}
              dirty={history.dirty}
              selection={selection}
              onSelect={(id) => setSelection({ id, scroll: false })}
            />

            <div className={cn("min-h-0 xl:block", pane !== "edit" && "hidden")}>
              {selected ? (
                <SectionInspector
                  key={selected.id}
                  section={selected}
                  onChange={(content, coalesceKey) =>
                    updateSection(selected.id, { content } as Partial<HomeSection>, coalesceKey)
                  }
                  onToggle={(enabled) => updateSection(selected.id, { enabled })}
                  onDuplicate={() => duplicate(selected.id)}
                  onRemove={() => remove(selected.id)}
                />
              ) : (
                <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 text-center">
                  <p className="text-sm font-medium">Nothing selected</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Click a section in the preview, or pick one from the outline, to edit its copy and images.
                  </p>
                  <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setAdding(true)}>
                    Add a section
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <AddSectionDialog open={adding} onOpenChange={setAdding} onAdd={addSection} />

      <ConfirmDialog
        open={confirmRestore}
        onOpenChange={setConfirmRestore}
        title="Restore the default home page?"
        description="Every section is replaced with the shipped layout and copy. Nothing changes on the live site until you publish, and you can undo this."
        confirmLabel="Restore defaults"
        onConfirm={() => {
          history.set(structuredClone(DEFAULT_HOME_LAYOUT));
          setSelection({ id: null, scroll: false });
          setConfirmRestore(false);
        }}
      />
    </div>
  );
}
