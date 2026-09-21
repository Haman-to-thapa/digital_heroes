import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-gray-200 bg-white p-5 md:block dark:border-gray-800 dark:bg-gray-900">
        <Link
          href="/dashboard"
          className="block text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
        >
          Digital <span className="text-emerald-600 dark:text-emerald-400">Heroes</span>
        </Link>

        <nav className="mt-8 space-y-2">
          <Link
            href="/dashboard"
            className="block rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition"
          >
            Dashboard
          </Link>

          <Link
            href="/dashboard/scores"
            className="block rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition"
          >
            Golf Scores
          </Link>

          <Link
            href="/dashboard/charity"
            className="block rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition"
          >
            Charity
          </Link>

          <Link
            href="/dashboard/subscription"
            className="block rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition"
          >
            Subscription
          </Link>

          <Link
            href="/dashboard/draw"
            className="block rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition"
          >
            Monthly Draw
          </Link>
        </nav>

        {/* Sidebar Footer Link */}
        <div className="absolute bottom-5 left-5 right-5 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Link
            href="/"
            className="block text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
          >
            ← Back to Homepage
          </Link>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="border-b border-gray-200 bg-white p-4 md:hidden dark:border-gray-800 dark:bg-gray-900">
        <details className="group">
          <summary className="cursor-pointer font-semibold list-none flex items-center justify-between text-gray-900 dark:text-white">
            <span>Digital Heroes — Menu</span>
            <span className="text-gray-500 transition group-open:rotate-180">▼</span>
          </summary>

          <nav className="mt-4 space-y-2">
            <Link
              href="/dashboard"
              className="block rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/scores"
              className="block rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Golf Scores
            </Link>

            <Link
              href="/dashboard/charity"
              className="block rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Charity
            </Link>

            <Link
              href="/dashboard/subscription"
              className="block rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Subscription
            </Link>

            <Link
              href="/dashboard/draw"
              className="block rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Monthly Draw
            </Link>

            <Link
              href="/"
              className="block rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              ← Back to Homepage
            </Link>
          </nav>
        </details>
      </div>

      {/* Main Content */}
      <main className="md:ml-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
