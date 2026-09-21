"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  full_name: string | null;
  role: string;
  charity_name: string | null;
  charity_percentage: number;
  subscription_status: string;
  subscription_plan: string | null;
  renewal_date: string | null;
  score_count: number;
  created_at: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");

  // Edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [charityPercentage, setCharityPercentage] = useState(10);
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (!response.ok) {
        setMessage({ text: data.error || "Unable to load users.", ok: false });
        return;
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error(error);
      setMessage({ text: "Something went wrong loading users.", ok: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function openEdit(user: User) {
    setEditingUser(user);
    setFullName(user.full_name || "");
    setCharityPercentage(Number(user.charity_percentage || 10));
    setMessage(null);
  }

  function closeEdit() {
    setEditingUser(null);
    setFullName("");
    setCharityPercentage(10);
  }

  async function saveUser() {
    if (!editingUser) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, charity_percentage: charityPercentage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error || "Unable to update user.", ok: false });
        return;
      }
      setMessage({ text: "User updated successfully. ✅", ok: true });
      closeEdit();
      await loadUsers();
    } catch {
      setMessage({ text: "Network error saving user.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      (u.full_name?.toLowerCase().includes(search.toLowerCase())) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeSubCount = users.filter((u) => u.subscription_status === "active").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const maxScoresCount = users.filter((u) => u.score_count >= 5).length;

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
            <span className="text-xs text-slate-500 dark:text-slate-400">User Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Users
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage users, subscriptions and score activity.
          </p>
        </div>
      </div>

      {/* KPI chips */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Members", val: users.length, icon: "👤", cls: "text-slate-950 dark:text-white" },
          { label: "Active Subscribers", val: activeSubCount, icon: "🎫", cls: "text-indigo-700 dark:text-indigo-400" },
          { label: "Fully Scored (5/5)", val: maxScoresCount, icon: "⛳", cls: "text-emerald-700 dark:text-emerald-400" },
          { label: "Admin Accounts", val: adminCount, icon: "👑", cls: "text-amber-700 dark:text-amber-400" },
        ].map((k) => (
          <div key={k.label} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{k.label}</span>
              <span>{k.icon}</span>
            </div>
            {loading ? (
              <div className="mt-3 h-8 w-20 animate-pulse rounded-xl bg-slate-200/60 dark:bg-slate-800" />
            ) : (
              <p className={`mt-3 text-2xl font-black tracking-tight ${k.cls}`}>{k.val}</p>
            )}
          </div>
        ))}
      </div>

      {/* Feedback Message */}
      {message && (
        <div className={`rounded-2xl border px-5 py-3 text-sm font-semibold ${
          message.ok
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
            : "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300"
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "user", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold capitalize cursor-pointer transition ${
                roleFilter === r
                  ? "bg-slate-950 text-white dark:bg-amber-600"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              }`}
            >
              {r === "all" ? `All (${users.length})` : `${r} (${users.filter((u) => u.role === r).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#0b101b] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mb-3" />
            <p className="text-sm text-slate-500">Loading users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-2xl">👤</div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No users found</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {search ? "Try a different search term." : "No members registered yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[950px]">
              <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Subscription</th>
                  <th className="px-5 py-4">Scores</th>
                  <th className="px-5 py-4">Charity</th>
                  <th className="px-5 py-4">Joined</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {user.full_name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-950 dark:text-white">
                            {user.full_name || "Unnamed User"}
                          </p>
                          <p className="mt-0.5 text-xs capitalize text-slate-500 dark:text-slate-400">
                            {user.role === "admin" ? "👑 Admin" : user.role}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Subscription */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                          user.subscription_status === "active"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          {user.subscription_status === "active" ? "✅ Active" : user.subscription_status}
                        </span>
                        {user.subscription_plan && (
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                            Plan: {user.subscription_plan}
                          </p>
                        )}
                        {user.renewal_date && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Renewal: {new Date(user.renewal_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Scores */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          user.score_count >= 5
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : user.score_count > 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          ⛳ {user.score_count} / 5
                        </span>
                      </div>
                    </td>

                    {/* Charity */}
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {user.charity_name || "Not selected"}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                          ❤️ {user.charity_percentage}%
                        </p>
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(user.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      {user.role === "user" ? (
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-amber-950/30 dark:hover:text-amber-400 cursor-pointer transition"
                        >
                          ✏️ Edit
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">👑 Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer count */}
            <div className="border-t border-slate-100 dark:border-slate-800/60 px-5 py-3">
              <p className="text-[10px] font-bold text-slate-400">
                Showing {filtered.length} of {users.length} member{users.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Edit User Profile
                </span>
                <h2 className="mt-0.5 text-lg font-black text-slate-950 dark:text-white">
                  {editingUser.full_name || "Unnamed User"}
                </h2>
                <p className="text-[10px] font-mono text-slate-400">{editingUser.id.slice(0, 20)}…</p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 cursor-pointer transition"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-amber-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Charity Contribution
                </label>
                <select
                  value={charityPercentage}
                  onChange={(e) => setCharityPercentage(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-amber-600"
                >
                  <option value={10}>10%</option>
                  <option value={20}>20%</option>
                  <option value={30}>30%</option>
                  <option value={40}>40%</option>
                  <option value={50}>50%</option>
                  <option value={75}>75%</option>
                  <option value={100}>100%</option>
                </select>
                <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                  Minimum contribution is 10%. This percentage applies to their winnings.
                </p>
              </div>

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
                onClick={closeEdit}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 cursor-pointer disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveUser}
                disabled={saving || !fullName.trim()}
                className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-500 shadow-sm cursor-pointer disabled:opacity-50 transition"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
