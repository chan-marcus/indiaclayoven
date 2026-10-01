"use client";

import Image from "next/image";
import { DishImage } from "@/components/ui/DishImage";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/lib/dashboard-data";
import { reportFailure } from "@/lib/restaurant-data";
import { shrinkImage } from "@/lib/shrink-image";
import { addOnLabel, choicesSummary, fromPrice, hasPricedChoices } from "@/lib/pricing";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { currency } from "@/lib/format";
import type { MenuItem, OptionGroup } from "@/lib/types";
import { IconChevronRight, IconClose, IconEdit, IconPlus, IconSearch, IconTrash } from "@/components/ui/icons";

export default function MenuManagerPage() {
  const {
    items,
    categories,
    optionGroups,
    toggleAvailability,
    updateItem,
    addItem,
    deleteItem,
    addCategory,
    deleteOptionGroup,
    setOptionGroupOnItems,
    uploadItemImage,
    removeItemImage,
  } = useDashboard();

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<MenuItem | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  /** The option group being edited (null while adding one) and its dishes. */
  const [groupEditor, setGroupEditor] = useState<{
    group: OptionGroup | null;
    itemIds: string[];
    /** Lets the dish editor underneath catch up after a save. */
    onSaved?: GroupSaved;
  } | null>(null);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<OptionGroup | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (categoryFilter === "all" || i.categoryId === categoryFilter) &&
        (!q || i.name.toLowerCase().includes(q)),
    );
  }, [items, query, categoryFilter]);

  // The table is grouped under a header per category, in menu order.
  const sections = useMemo(() => {
    const known = new Set(categories.map((c) => c.id));
    const out = categories.map((c) => ({
      id: c.id,
      name: c.name,
      dishes: rows.filter((r) => r.categoryId === c.id),
    }));
    const other = rows.filter((r) => !known.has(r.categoryId));
    if (other.length) out.push({ id: "other", name: "Other", dishes: other });
    return out.filter((s) => s.dishes.length > 0);
  }, [rows, categories]);
  const priceText = (item: MenuItem) =>
    `${hasPricedChoices(item, optionGroups) ? "From " : ""}${currency(fromPrice(item, optionGroups))}`;
  const groupsOf = (item: MenuItem) => optionGroups.filter((g) => item.optionGroupIds.includes(g.id));
  const usedBy = (groupId: string) => items.filter((i) => i.optionGroupIds.includes(groupId));

  // Selection only ever covers dishes on screen, so a bulk change can't
  // reach a dish the owner can't see.
  const visibleSelected = rows.filter((r) => selected.has(r.id)).map((r) => r.id);
  const allVisibleSelected = rows.length > 0 && visibleSelected.length === rows.length;
  const toggleRow = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleSection = (ids: string[], on: boolean) =>
    setSelected((s) => {
      const next = new Set(s);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  const toggleAllVisible = () =>
    setSelected(allVisibleSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const filterBy = (fn: () => void) => {
    fn();
    setSelected(new Set());
  };

  const newCategory = () => {
    const name = window.prompt("Name your new category (e.g. Weekend Specials)");
    if (name?.trim()) addCategory(name.trim());
  };

  return (
    <div className={`container-page py-8 ${visibleSelected.length ? "pb-36" : ""}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Your menu</h1>
          <p className="mt-2 text-[0.9375rem] text-ink-500">
            Change a price, mark something sold out, or add a dish. It updates your website
            immediately.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={newCategory} className="btn btn-secondary btn-sm">
            <IconPlus className="h-4 w-4" />
            Add Category
          </button>
          <button type="button" onClick={() => setCreating(true)} className="btn btn-primary btn-sm">
            <IconPlus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Option groups */}
      <section className="mt-6 rounded-sm border border-cream-300 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Options</h2>
            <p className="mt-1 text-[0.875rem] text-ink-500">
              Choices a customer makes when ordering, like a spice level.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setGroupEditor({ group: null, itemIds: [] })}
            className="btn btn-secondary btn-sm"
          >
            <IconPlus className="h-4 w-4" />
            Add Options
          </button>
        </div>

        {optionGroups.length === 0 ? (
          <p className="mt-4 rounded-sm bg-cream-100 px-4 py-3 text-[0.875rem] text-ink-500">
            None yet. Add one, such as Spice level with Mild, Medium, Hot and Extra Hot.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-cream-200 border-t border-cream-200">
            {optionGroups.map((g) => {
              const n = usedBy(g.id).length;
              return (
                <li key={g.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9375rem] font-medium">
                      {g.name}
                      {g.setsPrice && (
                        <span className="ml-2 rounded-xs bg-gold-soft px-1.5 py-0.5 align-middle text-[0.6875rem] font-normal whitespace-nowrap text-ink-700">
                          Price per dish
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[0.8125rem] text-ink-500">{choicesSummary(g)}</p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {n === 0 ? "Not on any dishes yet" : `On ${n} ${n === 1 ? "dish" : "dishes"}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGroupEditor({ group: g, itemIds: usedBy(g.id).map((i) => i.id) })}
                    aria-label={`Edit ${g.name}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xs text-ink-500 transition-colors hover:bg-cream-100 hover:text-ink"
                  >
                    <IconEdit className="h-[1.125rem] w-[1.125rem]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteGroup(g)}
                    aria-label={`Delete ${g.name}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xs text-ink-400 transition-colors hover:bg-danger/8 hover:text-danger"
                  >
                    <IconTrash className="h-[1.125rem] w-[1.125rem]" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => filterBy(() => setQuery(e.target.value))}
            placeholder="Find a dish…"
            aria-label="Search your menu"
            className="field-input pl-11"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => filterBy(() => setCategoryFilter(e.target.value))}
          aria-label="Filter by category"
          className="field-input sm:w-56"
        >
          <option value="all">All categories ({items.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({items.filter((i) => i.categoryId === c.id).length})
            </option>
          ))}
        </select>
      </div>

      {/* The table, deliberately spreadsheet-plain */}
      <div className="mt-5 overflow-hidden rounded-sm border border-cream-300 bg-white">
        <div className="hidden grid-cols-[1.25rem_3.5rem_1fr_6rem_7rem_5rem] items-center gap-4 border-b border-cream-200 bg-cream-100/60 px-4 py-2.5 text-[0.6875rem] font-medium tracking-[0.12em] text-ink-400 uppercase lg:grid">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
            aria-label={`Select all ${rows.length} dishes shown`}
            className="h-4 w-4 accent-[#6b2318]"
          />
          <span />
          <span>Item</span>
          <span>Price</span>
          <span>Available</span>
          <span className="text-right">Edit</span>
        </div>

        {/* Select all, on screens without the header row */}
        {rows.length > 0 && (
          <label className="flex cursor-pointer items-center gap-3 border-b border-cream-200 bg-cream-100/60 px-4 py-2.5 text-[0.8125rem] text-ink-500 lg:hidden">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAllVisible}
              className="h-4 w-4 accent-[#6b2318]"
            />
            Select all {rows.length} shown
          </label>
        )}

        <div className="divide-y divide-cream-200">
          {sections.map((section) => {
            const ids = section.dishes.map((d) => d.id);
            const n = ids.filter((id) => selected.has(id)).length;
            return (
              <Fragment key={section.id}>
                <div className="flex items-center gap-3 bg-cream-200/50 px-4 py-2.5 lg:gap-4">
                  <TriCheckbox
                    checked={n === ids.length}
                    indeterminate={n > 0 && n < ids.length}
                    onChange={(on) => toggleSection(ids, on)}
                    label={`Select all ${section.name}`}
                  />
                  <h2 className="font-display text-[1.0625rem] leading-snug">{section.name}</h2>
                  <span className="ml-auto text-xs whitespace-nowrap text-ink-400">
                    {ids.length} {ids.length === 1 ? "dish" : "dishes"}
                  </span>
                </div>
                {section.dishes.map((item) => {
                  const groups = groupsOf(item);
                  return (
                    <div
                      key={item.id}
                      className={`px-4 py-3 lg:grid lg:grid-cols-[1.25rem_3.5rem_1fr_6rem_7rem_5rem] lg:items-center lg:gap-4 ${
                        selected.has(item.id) ? "bg-gold-soft/35" : ""
                      }`}
                    >
                      {/* lg:contents dissolves this wrapper into the grid on desktop */}
                      <div className="flex gap-3 lg:contents">
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleRow(item.id)}
                          aria-label={`Select ${item.name}`}
                          className="mt-3.5 h-4 w-4 shrink-0 accent-[#6b2318] lg:mt-0"
                        />
                        <button
                          type="button"
                          onClick={() => setEditing(item)}
                          aria-label={`Change the photo for ${item.name}`}
                          title="Change photo"
                          className="relative h-11 w-11 shrink-0 overflow-hidden rounded-sm bg-cream-100 transition-opacity hover:opacity-80"
                        >
                          <DishImage src={item.image} alt="" sizes="44px" />
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className="text-[0.9375rem] leading-snug font-medium lg:truncate">
                            {item.name}
                          </p>
                          <p className="line-clamp-1 text-[0.8125rem] text-ink-500 lg:truncate">
                            {item.description ?? <span className="italic">No description</span>}
                          </p>
                          {groups.length > 0 && (
                            <p className="mt-0.5 truncate text-xs text-gold">
                              Options: {groups.map((g) => g.name).join(", ")}
                            </p>
                          )}
                          {/* Price inline on small screens */}
                          <p className="mt-1 text-[0.8125rem] text-ink-400 lg:hidden">
                            {priceText(item)}
                          </p>
                        </div>
                      </div>

                      <p className="hidden text-[0.9375rem] tabular-nums lg:block">
                        {priceText(item)}
                      </p>

                      {/* Availability toggle */}
                      <div className="hidden lg:block">
                        <AvailabilityToggle
                          on={item.available}
                          onChange={() => toggleAvailability(item.id)}
                          label={item.name}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2 border-t border-cream-200 pt-3 lg:mt-0 lg:gap-1 lg:border-0 lg:pt-0">
                        <div className="mr-auto lg:hidden">
                          <AvailabilityToggle
                            on={item.available}
                            onChange={() => toggleAvailability(item.id)}
                            label={item.name}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditing(item)}
                          aria-label={`Edit ${item.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-xs text-ink-500 transition-colors hover:bg-cream-100 hover:text-ink"
                        >
                          <IconEdit className="h-[1.125rem] w-[1.125rem]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(item)}
                          aria-label={`Delete ${item.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-xs text-ink-400 transition-colors hover:bg-danger/8 hover:text-danger"
                        >
                          <IconTrash className="h-[1.125rem] w-[1.125rem]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            );
          })}

          {rows.length === 0 && (
            <p className="p-8 text-center text-ink-500">No dishes match that.</p>
          )}
        </div>
      </div>

      <p className="mt-4 text-[0.8125rem] text-ink-400">
        Showing {rows.length} of {items.length} dishes.
      </p>

      {visibleSelected.length > 0 && (
        <BulkOptionsBar
          count={visibleSelected.length}
          groups={optionGroups}
          countWith={(groupId) => rows.filter((r) => selected.has(r.id) && r.optionGroupIds.includes(groupId)).length}
          onApply={async (groupId, attached) => {
            try {
              await setOptionGroupOnItems(groupId, visibleSelected, attached);
              setSelected(new Set());
            } catch (err) {
              reportFailure("update those dishes", err);
            }
          }}
          onNewGroup={() => setGroupEditor({ group: null, itemIds: visibleSelected })}
          onClear={() => setSelected(new Set())}
        />
      )}

      {(editing || creating) && (
        <ItemEditor
          item={editing}
          categories={categories}
          optionGroups={optionGroups}
          openGroupEditor={(g, onSaved) =>
            setGroupEditor({
              group: g,
              // A new option starts ticked for the dish it was added from.
              itemIds: g ? usedBy(g.id).map((i) => i.id) : editing ? [editing.id] : [],
              onSaved,
            })
          }
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={async (patch, photo) => {
            if (editing) {
              await updateItem(editing.id, patch);
              if (photo === "remove") await removeItemImage(editing.id);
              else if (photo) await uploadItemImage(editing.id, photo);
            } else {
              const created = await addItem({
                name: patch.name ?? "New dish",
                description: patch.description,
                price: patch.price ?? 0,
                categoryId: patch.categoryId ?? categories[0].id,
                available: patch.available ?? true,
                optionGroupIds: patch.optionGroupIds ?? [],
                choicePrices: patch.choicePrices ?? {},
              });
              if (created && photo instanceof Blob) await uploadItemImage(created.id, photo);
            }
            setEditing(null);
            setCreating(false);
          }}
        />
      )}

      {groupEditor && (
        <OptionGroupEditor
          group={groupEditor.group}
          initialItemIds={groupEditor.itemIds}
          onClose={() => setGroupEditor(null)}
          onSaved={(id, itemIds) => {
            groupEditor.onSaved?.(id, itemIds);
            setGroupEditor(null);
            setSelected(new Set());
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete “${confirmDelete.name}”?`}
          body={
            <>
              <span className="block">It comes off your website now.</span>
              {confirmDelete.image && <span className="block">Its photo is deleted too.</span>}
              <span className="block">This can’t be undone.</span>
            </>
          }
          confirmLabel="Delete dish"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteItem(confirmDelete.id);
            setConfirmDelete(null);
          }}
        />
      )}

      {confirmDeleteGroup && (
        <ConfirmDialog
          title={`Delete “${confirmDeleteGroup.name}”?`}
          body={
            <>
              <span className="block">{usedByText(usedBy(confirmDeleteGroup.id).length)}</span>
              <span className="block">Past orders keep their choices.</span>
              <span className="block">This can’t be undone.</span>
            </>
          }
          confirmLabel="Delete option"
          onCancel={() => setConfirmDeleteGroup(null)}
          onConfirm={async () => {
            const g = confirmDeleteGroup;
            setConfirmDeleteGroup(null);
            try {
              await deleteOptionGroup(g.id);
            } catch (err) {
              reportFailure("delete that option", err);
            }
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const usedByText = (n: number) =>
  n === 0
    ? "It isn’t on any dishes yet."
    : `It comes off the ${n} ${n === 1 ? "dish that uses" : "dishes that use"} it.`;

/** Turns "Mild, Medium, Hot" (or one per line) into a clean list. */
function parseChoices(raw: string): string[] {
  const out: string[] = [];
  for (const part of raw.split(/[,\n]/)) {
    const o = part.replace(/\s+/g, " ").trim();
    if (o && !out.some((x) => x.toLowerCase() === o.toLowerCase())) out.push(o);
  }
  return out;
}

function BulkOptionsBar({
  count,
  groups,
  countWith,
  onApply,
  onNewGroup,
  onClear,
}: {
  count: number;
  groups: OptionGroup[];
  /** How many of the selected dishes already have this option. */
  countWith: (groupId: string) => number;
  onApply: (groupId: string, attached: boolean) => Promise<void>;
  onNewGroup: () => void;
  onClear: () => void;
}) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const current = groups.some((g) => g.id === groupId) ? groupId : (groups[0]?.id ?? "");
  const currentGroup = groups.find((g) => g.id === current);
  const removable = current ? countWith(current) : 0;

  const apply = async (attached: boolean) => {
    setBusy(true);
    await onApply(current, attached);
    setBusy(false);
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-cream-300 bg-cream/95 backdrop-blur">
        <div className="container-page flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
          <span className="text-[0.875rem] font-medium whitespace-nowrap">
            {count} {count === 1 ? "dish" : "dishes"} selected
          </span>
          {groups.length > 0 ? (
            <>
              <select
                value={current}
                onChange={(e) => setGroupId(e.target.value)}
                aria-label="Option to add or remove"
                className="field-input h-9 w-auto max-w-[12rem] py-0 text-[0.875rem]"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <button type="button" disabled={busy} onClick={() => apply(true)} className="btn btn-primary btn-sm">
                Add to dishes
              </button>
              <button
                type="button"
                disabled={busy || removable === 0}
                title={removable === 0 ? "None of the selected dishes have this option" : undefined}
                onClick={() => setConfirmRemove(true)}
                className="btn btn-secondary btn-sm"
              >
                Remove
              </button>
            </>
          ) : (
            <button type="button" onClick={onNewGroup} className="btn btn-primary btn-sm">
              <IconPlus className="h-4 w-4" />
              Add Options
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            className="ml-auto text-[0.8125rem] text-ink-500 underline-offset-4 hover:text-ink hover:underline"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Outside the bar: its backdrop blur would trap a fixed dialog inside it. */}
      {confirmRemove && currentGroup && (
        <ConfirmDialog
          title={`Remove “${currentGroup.name}” from ${removable} ${removable === 1 ? "dish" : "dishes"}?`}
          body={
            <>
              <span className="block">Customers won’t be asked for it.</span>
              <span className="block">You can add it back at any time.</span>
            </>
          }
          confirmLabel="Remove"
          onCancel={() => setConfirmRemove(false)}
          onConfirm={async () => {
            setConfirmRemove(false);
            await apply(false);
          }}
        />
      )}
    </>
  );
}

function OptionGroupEditor({
  group,
  initialItemIds,
  onClose,
  onSaved,
}: {
  group: OptionGroup | null;
  initialItemIds: string[];
  onClose: () => void;
  onSaved: GroupSaved;
}) {
  const { items, categories, addOptionGroup, updateOptionGroup, setOptionGroupOnItems } = useDashboard();
  const [name, setName] = useState(group?.name ?? "");
  const [choicesRaw, setChoicesRaw] = useState(group?.options.join(", ") ?? "");
  /** Extra charge typed for each choice, keyed by its lowercase name so it survives edits to the list. */
  const [extras, setExtras] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (group?.options ?? []).map((o, i) => [o.toLowerCase(), group!.prices[i] ? group!.prices[i].toFixed(2) : ""]),
    ),
  );
  const [picked, setPicked] = useState<Set<string>>(new Set(initialItemIds));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  /** Extra charges are tucked away until the owner opens them. */
  const [showExtras, setShowExtras] = useState(false);
  /** Each choice has its own price, set on each dish (Half $15, Whole $26). */
  const [setsPrice, setSetsPrice] = useState(group?.setsPrice ?? false);

  const choices = parseChoices(choicesRaw);
  // Shown beside the closed section so charges already set aren't missed.
  const extrasSummary = choices
    .map((c) => [c, Number((extras[c.toLowerCase()] ?? "").replace(/[$\s]/g, ""))] as const)
    .filter(([, n]) => n > 0)
    .map(([c, n]) => `${c} ${addOnLabel(n)}`)
    .join(" · ");

  const toggle = (ids: string[], on: boolean) =>
    setPicked((s) => {
      const next = new Set(s);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const prices = choices.map((c) => {
        const raw = (extras[c.toLowerCase()] ?? "").replace(/[$\s]/g, "");
        const n = raw === "" ? 0 : Number(raw);
        if (!Number.isFinite(n) || n < 0) throw new Error(`The extra charge for ${c} must be an amount, like 4.00`);
        return Math.round(n * 100) / 100;
      });
      const input = { name: name.trim(), options: choices, prices, setsPrice };
      let id = group?.id;
      if (id) await updateOptionGroup(id, input);
      else id = (await addOptionGroup(input)).id;

      const before = new Set(group ? initialItemIds : []);
      const add = [...picked].filter((i) => !before.has(i));
      const remove = [...before].filter((i) => !picked.has(i));
      if (add.length) await setOptionGroupOnItems(id, add, true);
      if (remove.length) await setOptionGroupOnItems(id, remove, false);
      onSaved(id, [...picked]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 animate-fade-in bg-ink/45" />
      <form
        onSubmit={save}
        className="relative flex max-h-[92vh] w-full animate-slide-up flex-col rounded-t-md bg-cream sm:max-w-xl sm:animate-rise sm:rounded-sm"
      >
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="font-display text-2xl">{group ? "Edit options" : "Add options"}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-xs hover:bg-cream-100"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid min-h-0 gap-4 overflow-y-auto px-6">
          <div>
            <label htmlFor="g-name" className="field-label">
              Name
            </label>
            <input
              id="g-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Spice level"
              maxLength={60}
              className="field-input"
              required
            />
          </div>
          <div>
            <label htmlFor="g-choices" className="field-label">
              Choices
            </label>
            <input
              id="g-choices"
              value={choicesRaw}
              onChange={(e) => setChoicesRaw(e.target.value)}
              placeholder="Mild, Medium, Hot, Extra Hot"
              className="field-input"
              required
            />
            <p className="mt-1.5 text-xs text-ink-400">Put a comma between each choice.</p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-cream-300 bg-white p-3.5">
            <input
              type="checkbox"
              checked={setsPrice}
              onChange={(e) => setSetsPrice(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#6b2318]"
            />
            <span className="min-w-0">
              <span className="block text-[0.9375rem]">Each choice has its own price</span>
              <span className="block text-xs text-ink-500">Like Half $15 and Whole $26.</span>
              <span className="block text-xs text-ink-500">You set the prices on each dish.</span>
            </span>
          </label>

          {choices.length > 0 && !setsPrice && (
            <div>
              <button
                type="button"
                onClick={() => setShowExtras((v) => !v)}
                aria-expanded={showExtras}
                aria-controls="g-extras"
                className={`field-label flex w-full items-center gap-1.5 text-left transition-colors hover:text-ink ${
                  showExtras ? "" : "mb-0"
                }`}
              >
                <IconChevronRight
                  className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${showExtras ? "rotate-90" : ""}`}
                />
                <span className="whitespace-nowrap">
                  Extra charge <span className="normal-case">(optional)</span>
                </span>
                {!showExtras && extrasSummary && (
                  <span className="ml-auto min-w-0 truncate pl-3 tracking-normal text-ink-700 normal-case tabular-nums">
                    {extrasSummary}
                  </span>
                )}
              </button>
              {showExtras && (
                <fieldset id="g-extras">
                  <legend className="sr-only">Extra charge for each choice</legend>
                  <div className="divide-y divide-cream-200 rounded-sm border border-cream-300 bg-white">
                    {choices.map((c) => {
                      const key = c.toLowerCase();
                      return (
                        <label key={key} className="flex items-center gap-3 px-3.5 py-2">
                          <span className="min-w-0 flex-1 truncate text-[0.9375rem]">{c}</span>
                          <span className="text-[0.875rem] text-ink-400">+$</span>
                          <input
                            value={extras[key] ?? ""}
                            onChange={(e) => setExtras((x) => ({ ...x, [key]: e.target.value }))}
                            inputMode="decimal"
                            placeholder="0.00"
                            aria-label={`Extra charge for ${c}`}
                            className="field-input h-9 w-24 py-0 text-right tabular-nums"
                          />
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-xs text-ink-400">Leave blank if it costs nothing extra.</p>
                </fieldset>
              )}
            </div>
          )}

          <fieldset>
            <legend className="field-label">
              Dishes <span className="normal-case">({picked.size} selected)</span>
            </legend>
            <div className="max-h-72 overflow-y-auto rounded-sm border border-cream-300 bg-white">
              {categories.map((c) => {
                const dishes = items.filter((i) => i.categoryId === c.id);
                if (dishes.length === 0) return null;
                const ids = dishes.map((d) => d.id);
                const n = ids.filter((id) => picked.has(id)).length;
                return (
                  <div key={c.id} className="border-b border-cream-200 last:border-0">
                    <label className="sticky top-0 flex cursor-pointer items-center gap-3 bg-cream-100 px-3.5 py-2 text-[0.8125rem] font-medium">
                      <TriCheckbox
                        checked={n === ids.length}
                        indeterminate={n > 0 && n < ids.length}
                        onChange={(on) => toggle(ids, on)}
                      />
                      <span className="flex-1">{c.name}</span>
                      <span className="font-normal text-ink-400">All {ids.length}</span>
                    </label>
                    <div className="grid gap-x-4 px-3.5 py-1.5 sm:grid-cols-2">
                      {dishes.map((d) => (
                        <label key={d.id} className="flex cursor-pointer items-center gap-3 py-1.5 text-[0.875rem]">
                          <input
                            type="checkbox"
                            checked={picked.has(d.id)}
                            onChange={(e) => toggle([d.id], e.target.checked)}
                            className="h-4 w-4 shrink-0 accent-[#6b2318]"
                          />
                          <span className="min-w-0 truncate">{d.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="rounded-sm bg-danger/8 px-3.5 py-2.5 text-[0.875rem] text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 p-6">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={saving || choices.length === 0} className="btn btn-primary flex-1">
            {saving ? "Saving…" : group ? "Save changes" : "Add options"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TriCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (on: boolean) => void;
  label?: string;
}) {
  return (
    <input
      type="checkbox"
      ref={(el) => {
        if (el) el.indeterminate = indeterminate;
      }}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={label}
      className="h-4 w-4 shrink-0 accent-[#6b2318]"
    />
  );
}

/* ------------------------------------------------------------------ */

function AvailabilityToggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${label} is ${on ? "available" : "sold out"}`}
      onClick={onChange}
      className="flex items-center gap-2"
    >
      <span
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${
          on ? "bg-success" : "bg-ink-400/45"
        }`}
      >
        {/* left-0.5 anchors the knob; without it the element falls at its
            static position and slides out of the track. */}
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            on ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      <span
        className={`text-[0.8125rem] whitespace-nowrap ${
          on ? "text-ink-500" : "text-danger"
        }`}
      >
        {on ? "Available" : "Sold out"}
      </span>
    </button>
  );
}

/** Called after an option group is saved, with the dishes it's now on. */
type GroupSaved = (groupId: string, itemIds: string[]) => void;

function ItemEditor({
  item,
  categories,
  optionGroups,
  openGroupEditor,
  onClose,
  onSave,
}: {
  item: MenuItem | null;
  categories: { id: string; name: string }[];
  optionGroups: OptionGroup[];
  /** Opens the shared option editor above this one; null adds a new option. */
  openGroupEditor: (group: OptionGroup | null, onSaved: GroupSaved) => void;
  onClose: () => void;
  /** `photo` is a new, already-resized picture, "remove" to take it off, or null to leave it. */
  onSave: (patch: Partial<MenuItem>, photo: Blob | "remove" | null) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: item?.name ?? "",
    description: item?.description ?? "",
    price: item ? String(item.price) : "",
    categoryId: item?.categoryId ?? categories[0].id,
    available: item?.available ?? true,
  });
  // Until the owner ticks or unticks an option here, follow the saved dish,
  // so changes made through Edit (which can add or remove this dish) show
  // straight away and aren't overwritten on save.
  const { items } = useDashboard();
  const savedGroupIds = items.find((i) => i.id === item?.id)?.optionGroupIds ?? [];
  const [pickedGroupIds, setPickedGroupIds] = useState<string[] | null>(null);
  const groupIds = pickedGroupIds ?? savedGroupIds;

  // A size option (Half / Whole) replaces the single price with one per choice.
  const size = optionGroups.find((g) => g.setsPrice && groupIds.includes(g.id));
  const savedChoicePrices = items.find((i) => i.id === item?.id)?.choicePrices ?? {};
  /** Typed size prices: option id → choice → text. */
  const [sizeDraft, setSizeDraft] = useState<Record<string, Record<string, string>>>({});
  const [sizeError, setSizeError] = useState("");
  const sizeValue = (g: OptionGroup, choice: string, i: number) => {
    const typed = sizeDraft[g.id]?.[choice];
    if (typed !== undefined) return typed;
    const saved = savedChoicePrices[g.id]?.[i] ?? (form.price ? Number(form.price) : null);
    return saved === null || !Number.isFinite(saved) ? "" : saved.toFixed(2);
  };

  // Once the owner has ticked boxes here, keep those picks in step with what
  // the option editor just saved for this dish.
  const followGroup =
    (added: boolean): GroupSaved =>
    (id, itemIds) => {
      if (!item) {
        // A dish not saved yet: an option added from it starts ticked.
        if (added) setPickedGroupIds((cur) => [...(cur ?? []), id]);
        return;
      }
      const on = itemIds.includes(item.id);
      setPickedGroupIds((cur) =>
        cur === null ? null : on ? [...cur.filter((x) => x !== id), id] : cur.filter((x) => x !== id),
      );
    };
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  /** The owner pressed Remove on the dish's saved photo. */
  const [removePhoto, setRemovePhoto] = useState(false);
  const hasPhoto = Boolean(photoUrl || (item?.image && !removePhoto));

  const dropPhoto = () => {
    setPhoto(null);
    setPhotoUrl(null);
    setPhotoError("");
    if (item?.image) setRemovePhoto(true);
  };
  const [photoError, setPhotoError] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Free the preview's memory when it's replaced or the editor closes.
  useEffect(() => () => void (photoUrl && URL.revokeObjectURL(photoUrl)), [photoUrl]);

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError("");
    setPreparing(true);
    try {
      const small = await shrinkImage(file);
      if (small.size > 4 * 1024 * 1024) throw new Error("That photo is too large. Use one under 4 MB.");
      setPhoto(small);
      setPhotoUrl(URL.createObjectURL(small));
      setRemovePhoto(false);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : String(err));
    } finally {
      setPreparing(false);
    }
  };

  const categoryField = (
    <div>
      <label htmlFor="i-cat" className="field-label">
        Category
      </label>
      <select
        id="i-cat"
        value={form.categoryId}
        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
        className="field-input"
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    let sizes: number[] | null = null;
    if (size) {
      sizes = size.options.map((o, i) => Number(sizeValue(size, o, i).replace(/[$\s]/g, "")));
      const bad = size.options.find((o, i) => !sizeValue(size, o, i).trim() || !Number.isFinite(sizes![i]) || sizes![i] < 0);
      if (bad) {
        setSizeError(`Enter a price for ${bad}, like 15.00`);
        return;
      }
      setSizeError("");
    }
    setSaving(true);
    await onSave({
      name: form.name.trim(),
      description: form.description.trim(),
      // With sizes, the dish is listed at its cheapest one.
      price: sizes ? Math.min(...sizes) : Number(form.price) || 0,
      categoryId: form.categoryId,
      available: form.available,
      ...(pickedGroupIds && { optionGroupIds: pickedGroupIds }),
      ...(size && sizes && { choicePrices: { [size.id]: sizes } }),
    }, photo ?? (removePhoto ? "remove" : null));
  };

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 animate-fade-in bg-ink/45" />
      <form
        onSubmit={save}
        className="relative max-h-[92vh] w-full animate-slide-up overflow-y-auto rounded-t-md bg-cream p-6 sm:max-w-lg sm:animate-rise sm:rounded-sm"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{item ? "Edit dish" : "Add a dish"}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-xs hover:bg-cream-100"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <div>
            <span className="field-label">Photo</span>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-cream-200">
                {photoUrl ? (
                  <Image src={photoUrl} alt="" fill sizes="96px" unoptimized className="object-cover" />
                ) : (
                  <DishImage src={removePhoto ? undefined : item?.image} alt="" sizes="96px" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <label className="btn btn-secondary btn-sm cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-gold">
                    <input type="file" accept="image/*" onChange={pickPhoto} className="sr-only" />
                    {preparing ? "Preparing…" : hasPhoto ? "Change photo" : "Upload photo"}
                  </label>
                  {hasPhoto && (
                    <button
                      type="button"
                      onClick={dropPhoto}
                      className="text-[0.8125rem] text-ink-500 underline-offset-4 hover:text-danger hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-ink-400">
                  {photoUrl
                    ? "Save to use this photo."
                    : removePhoto
                      ? "Removed when you save."
                      : "JPG or PNG, any size."}
                </p>
              </div>
            </div>
            {photoError && (
              <p role="alert" className="mt-2 text-[0.8125rem] text-danger">
                {photoError}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="i-name" className="field-label">
              Name
            </label>
            <input
              id="i-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="field-input"
              required
            />
          </div>
          <div>
            <label htmlFor="i-desc" className="field-label">
              Description
            </label>
            <textarea
              id="i-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="field-input"
            />
          </div>
          {size ? (
            <>
              <fieldset>
                <legend className="field-label">Price for each choice</legend>
                <div className="divide-y divide-cream-200 rounded-sm border border-cream-300 bg-white">
                  {size.options.map((o, i) => (
                    <label key={o} className="flex items-center gap-3 px-3.5 py-2">
                      <span className="min-w-0 flex-1 truncate text-[0.9375rem]">{o}</span>
                      <span className="text-[0.875rem] text-ink-400">$</span>
                      <input
                        value={sizeValue(size, o, i)}
                        onChange={(e) =>
                          setSizeDraft((d) => ({ ...d, [size.id]: { ...d[size.id], [o]: e.target.value } }))
                        }
                        inputMode="decimal"
                        placeholder="0.00"
                        aria-label={`Price for ${o}`}
                        className="field-input h-9 w-24 py-0 text-right tabular-nums"
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-ink-400">Set by the {size.name} option below.</p>
                {sizeError && (
                  <p role="alert" className="mt-1.5 text-[0.8125rem] text-danger">
                    {sizeError}
                  </p>
                )}
              </fieldset>
              {categoryField}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="i-price" className="field-label">
                  Price
                </label>
                <input
                  id="i-price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="field-input"
                  inputMode="decimal"
                  placeholder="0.00"
                  required
                />
              </div>
              {categoryField}
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-cream-300 bg-white p-3.5">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => setForm({ ...form, available: e.target.checked })}
              className="h-4 w-4 accent-[#476b45]"
            />
            <span className="text-[0.9375rem]">Available to order right now</span>
          </label>

          <fieldset>
            <legend className="field-label">Options the customer picks</legend>
            <div className="grid gap-2">
              {optionGroups.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center gap-2 rounded-sm border border-cream-300 bg-white pr-2"
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-2.5 pl-3.5">
                    <input
                      type="checkbox"
                      checked={groupIds.includes(g.id)}
                      onChange={(e) =>
                        setPickedGroupIds(
                          e.target.checked
                            ? [
                                // Only one option can set the price; ticking another swaps it.
                                ...groupIds.filter(
                                  (x) => x !== g.id && !(g.setsPrice && optionGroups.find((o) => o.id === x)?.setsPrice),
                                ),
                                g.id,
                              ]
                            : groupIds.filter((x) => x !== g.id),
                        )
                      }
                      className="h-4 w-4 shrink-0 accent-[#6b2318]"
                    />
                    <span className="min-w-0">
                      <span className="block text-[0.9375rem]">{g.name}</span>
                      <span className="block truncate text-xs text-ink-500">{choicesSummary(g)}</span>
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => openGroupEditor(g, followGroup(false))}
                    aria-label={`Edit ${g.name}`}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xs px-2.5 text-[0.8125rem] text-ink-500 transition-colors hover:bg-cream-100 hover:text-ink"
                  >
                    <IconEdit className="h-4 w-4" />
                    Edit
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => openGroupEditor(null, followGroup(true))}
                className="inline-flex items-center gap-1.5 justify-self-start rounded-xs px-1 py-1.5 text-[0.8125rem] text-ink-500 transition-colors hover:text-ink"
              >
                <IconPlus className="h-4 w-4" />
                Add Options
              </button>
            </div>
          </fieldset>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={saving || preparing} className="btn btn-primary flex-1">
            {saving ? "Saving…" : item ? "Save changes" : "Add to menu"}
          </button>
        </div>
      </form>
    </div>
  );
}
