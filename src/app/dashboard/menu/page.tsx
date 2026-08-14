"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useDashboard } from "@/lib/restaurant-data";
import { currency } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { IconClose, IconEdit, IconPlus, IconSearch, IconTrash } from "@/components/ui/icons";

export default function MenuManagerPage() {
  const {
    items,
    categories,
    toggleAvailability,
    updateItem,
    addItem,
    deleteItem,
    addCategory,
  } = useDashboard();

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<MenuItem | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (categoryFilter === "all" || i.categoryId === categoryFilter) &&
        (!q || i.name.toLowerCase().includes(q)),
    );
  }, [items, query, categoryFilter]);

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  const newCategory = () => {
    const name = window.prompt("Name your new category (e.g. Weekend Specials)");
    if (name?.trim()) addCategory(name.trim());
  };

  return (
    <div className="container-page py-8">
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

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a dish…"
            aria-label="Search your menu"
            className="field-input pl-11"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
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

      {/* The table — deliberately spreadsheet-plain */}
      <div className="mt-5 overflow-hidden rounded-sm border border-cream-300 bg-white">
        <div className="hidden grid-cols-[3.5rem_1fr_9rem_6rem_7rem_5rem] items-center gap-4 border-b border-cream-200 bg-cream-100/60 px-4 py-2.5 text-[0.6875rem] font-medium tracking-[0.12em] text-ink-400 uppercase lg:grid">
          <span />
          <span>Item</span>
          <span>Category</span>
          <span>Price</span>
          <span>Available</span>
          <span className="text-right">Edit</span>
        </div>

        <div className="divide-y divide-cream-200">
          {rows.map((item) => (
            <div
              key={item.id}
              className="px-4 py-3 lg:grid lg:grid-cols-[3.5rem_1fr_9rem_6rem_7rem_5rem] lg:items-center lg:gap-4"
            >
              {/* lg:contents dissolves this wrapper into the grid on desktop */}
              <div className="flex gap-3 lg:contents">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-sm bg-cream-100">
                  <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] leading-snug font-medium lg:truncate">
                    {item.name}
                  </p>
                  <p className="line-clamp-1 text-[0.8125rem] text-ink-500 lg:truncate">
                    {item.description ?? <span className="italic">No description</span>}
                  </p>
                  {/* Category + price inline on small screens */}
                  <p className="mt-1 text-[0.8125rem] text-ink-400 lg:hidden">
                    {catName(item.categoryId)} · {currency(item.price)}
                  </p>
                </div>
              </div>

              <p className="hidden text-[0.875rem] text-ink-500 lg:block">
                {catName(item.categoryId)}
              </p>

              <p className="hidden text-[0.9375rem] tabular-nums lg:block">
                {currency(item.price)}
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
          ))}

          {rows.length === 0 && (
            <p className="p-8 text-center text-ink-500">No dishes match that.</p>
          )}
        </div>
      </div>

      <p className="mt-4 text-[0.8125rem] text-ink-400">
        Showing {rows.length} of {items.length} dishes.
      </p>

      {(editing || creating) && (
        <ItemEditor
          item={editing}
          categories={categories}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(patch) => {
            if (editing) updateItem(editing.id, patch);
            else
              addItem({
                name: patch.name ?? "New dish",
                description: patch.description,
                price: patch.price ?? 0,
                categoryId: patch.categoryId ?? categories[0].id,
                image: patch.image ?? "/images/curry-spread.jpg",
                available: patch.available ?? true,
                badges: [],
              });
            setEditing(null);
            setCreating(false);
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Remove “${confirmDelete.name}”?`}
          body="This takes it off your website straight away. You can always add it back."
          confirmLabel="Remove dish"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteItem(confirmDelete.id);
            setConfirmDelete(null);
          }}
        />
      )}
    </div>
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

function ItemEditor({
  item,
  categories,
  onClose,
  onSave,
}: {
  item: MenuItem | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSave: (patch: Partial<MenuItem>) => void;
}) {
  const [form, setForm] = useState({
    name: item?.name ?? "",
    description: item?.description ?? "",
    price: item ? String(item.price) : "",
    categoryId: item?.categoryId ?? categories[0].id,
    available: item?.available ?? true,
  });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price) || 0,
      categoryId: form.categoryId,
      available: form.available,
    });
  };

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 animate-fade-in bg-ink/45" />
      <form
        onSubmit={save}
        className="relative w-full animate-slide-up rounded-t-md bg-cream p-6 sm:max-w-lg sm:animate-rise sm:rounded-sm"
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
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-cream-300 bg-white p-3.5">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => setForm({ ...form, available: e.target.checked })}
              className="h-4 w-4 accent-[#476b45]"
            />
            <span className="text-[0.9375rem]">Available to order right now</span>
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary flex-1">
            {item ? "Save changes" : "Add to menu"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <button type="button" aria-label="Cancel" onClick={onCancel} className="absolute inset-0 animate-fade-in bg-ink/45" />
      <div className="relative w-full max-w-sm animate-rise rounded-sm bg-cream p-6">
        <h2 className="font-display text-xl">{title}</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-500">{body}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="btn btn-secondary flex-1">
            Keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn flex-1 bg-danger text-cream hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
