"use client";

import { useEffect, useState } from "react";

type Charity = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  upcoming_event: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
};

type FormData = {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  upcoming_event: string;
  is_featured: boolean;
  is_active: boolean;
};

const emptyForm: FormData = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  upcoming_event: "",
  is_featured: false,
  is_active: true,
};

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "featured">("all");

  async function loadCharities() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/charities");
      const data = await response.json();

      if (!response.ok) {
        setMessage({ text: data.error || "Unable to load charities.", ok: false });
        return;
      }

      setCharities(data.charities || []);
    } catch (error) {
      console.error(error);
      setMessage({ text: "Something went wrong loading charities.", ok: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCharities();
  }, []);

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: editingId ? current.slug : generateSlug(value),
    }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage(null);
    setShowForm(true);
  }

  function openEdit(charity: Charity) {
    setEditingId(charity.id);
    setForm({
      name: charity.name,
      slug: charity.slug,
      description: charity.description || "",
      image_url: charity.image_url || "",
      upcoming_event: charity.upcoming_event || "",
      is_featured: charity.is_featured,
      is_active: charity.is_active,
    });
    setMessage(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveCharity() {
    if (!form.name.trim()) {
      setMessage({ text: "Charity name is required.", ok: false });
      return;
    }

    if (!form.slug.trim()) {
      setMessage({ text: "Charity slug is required.", ok: false });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const isEditing = Boolean(editingId);
      const url = isEditing
        ? `/api/admin/charities/${editingId}`
        : "/api/admin/charities";

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ text: data.error || "Unable to save charity.", ok: false });
        return;
      }

      setMessage({
        text: isEditing
          ? "Charity updated successfully. ✅"
          : "Charity created successfully. ✅",
        ok: true,
      });

      closeForm();
      await loadCharities();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Something went wrong saving charity.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function deleteCharity(id: string, name: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?`
    );

    if (!confirmed) return;

    setMessage(null);

    try {
      const response = await fetch(`/api/admin/charities/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ text: data.error || "Unable to delete charity.", ok: false });
        return;
      }

      setMessage({ text: `Charity "${name}" deleted successfully.`, ok: true });
      await loadCharities();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Something went wrong deleting charity.", ok: false });
    }
  }

  const filtered = charities.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && c.is_active) ||
      (filter === "featured" && c.is_featured);

    return matchesSearch && matchesFilter;
  });

  const featuredCount = charities.filter((c) => c.is_featured).length;
  const activeCount = charities.filter((c) => c.is_active).length;

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              👑 Admin Panel
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Charity Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Charities
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Add, edit and manage verified charity partners and campaigns.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-amber-500 cursor-pointer transition"
        >
          + Add Charity
        </button>
      </div>

      {/* KPI Chips */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Charities</span>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{charities.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Partners</span>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Featured</span>
          <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">{featuredCount}</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-2xl border px-5 py-3 text-sm font-semibold ${
            message.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search charities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "featured"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold capitalize cursor-pointer transition ${
                filter === tab
                  ? "bg-slate-950 text-white dark:bg-amber-600"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              }`}
            >
              {tab === "all" ? `All (${charities.length})` : tab === "active" ? `Active (${activeCount})` : `Featured (${featuredCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Charity cards */}
      {loading ? (
        <div className="p-16 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mb-3" />
          <p className="text-sm text-slate-500">Loading charities...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-16 text-center shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
            ❤️
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No charities found</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {search ? "Try adjusting your search criteria." : "Click '+ Add Charity' to register the first one."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((charity) => (
            <div
              key={charity.id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800/80 dark:bg-[#0b101b]"
            >
              {/* Image banner */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                {charity.image_url ? (
                  <img
                    src={charity.image_url}
                    alt={charity.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <span className="text-4xl">❤️</span>
                  </div>
                )}
                {/* Badges overlay */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  {charity.is_featured && (
                    <span className="rounded-full bg-amber-500/90 backdrop-blur-sm px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                      ★ Featured
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm backdrop-blur-sm ${
                      charity.is_active
                        ? "bg-emerald-500/90 text-white"
                        : "bg-slate-600/90 text-slate-200"
                    }`}
                  >
                    {charity.is_active ? "● Active" : "○ Inactive"}
                  </span>
                </div>
              </div>

              {/* Card content */}
              <div className="flex flex-1 flex-col p-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                    {charity.name}
                  </h2>
                  <p className="font-mono text-xs text-amber-600 dark:text-amber-400">
                    /{charity.slug}
                  </p>
                </div>

                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {charity.description || "No description provided."}
                </p>

                {charity.upcoming_event && (
                  <div className="mt-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      📅 Upcoming Event
                    </span>
                    <p className="mt-0.5 font-bold text-slate-900 dark:text-white">
                      {charity.upcoming_event}
                    </p>
                  </div>
                )}

                {/* Actions bottom */}
                <div className="mt-auto pt-6 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => openEdit(charity)}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-amber-950/30 cursor-pointer transition"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCharity(charity.id, charity.name)}
                    className="rounded-xl border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-900/40 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer transition"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {editingId ? "Update Partner" : "New Charity"}
                </p>
                <h2 className="mt-0.5 text-xl font-black text-slate-950 dark:text-white">
                  {editingId ? "Edit Charity" : "Add Charity"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-4 px-6 py-6">
              {/* Name */}
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Charity Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Helping Hands Foundation"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-amber-600"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Slug *
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    }))
                  }
                  placeholder="e.g. helping-hands-foundation"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono text-slate-900 outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-amber-600"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Brief description of the charity's mission and impact..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-amber-600"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Image URL
                </label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      image_url: e.target.value,
                    }))
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-amber-600"
                />
              </div>

              {/* Upcoming Event */}
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Upcoming Event
                </label>
                <input
                  type="text"
                  value={form.upcoming_event}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      upcoming_event: e.target.value,
                    }))
                  }
                  placeholder="e.g. Annual Charity Golf Day & Fundraiser"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-amber-600"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-col sm:flex-row gap-6 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        is_featured: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ★ Featured charity
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        is_active: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ● Active charity
                  </span>
                </label>
              </div>

              {/* In-modal error */}
              {message && !message.ok && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400">
                  {message.text}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 cursor-pointer disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCharity}
                disabled={saving || !form.name.trim() || !form.slug.trim()}
                className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-500 shadow-sm cursor-pointer disabled:opacity-50 transition"
              >
                {saving
                  ? "Saving…"
                  : editingId
                  ? "Save Changes"
                  : "Create Charity"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
