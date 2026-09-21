import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors">
      {/* Hero Section */}
      <section className="bg-gray-50/80 border-b border-gray-100 dark:bg-gray-900/40 dark:border-gray-800">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 shadow-sm dark:bg-emerald-950 dark:text-emerald-400">
              Play. Participate. Give back.
            </span>

            <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-6xl">
              Your score can create a <span className="text-emerald-600 dark:text-emerald-400">bigger impact</span>.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600 dark:text-gray-300">
              Track your golf performance, join monthly sweepstakes draws, and support a verified charity that matters to you.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-emerald-500 cursor-pointer"
              >
                Subscribe & Join
              </Link>

              <Link
                href="/charities"
                className="rounded-xl border border-gray-300 bg-white px-6 py-3.5 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Explore Charities
              </Link>
            </div>
          </div>

          {/* How It Works Card */}
          <div className="rounded-3xl border border-gray-200/80 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              HOW IT WORKS
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                  01
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Subscribe
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Choose a flexible monthly or discounted yearly plan.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                  02
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Enter your scores
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Keep your latest five Stableford scores (1–45) updated.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                  03
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Support a cause
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Direct a minimum of 10% of subscription to your chosen charity.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                  04
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Join the monthly draw
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Automatic entry into monthly sweepstakes for 3, 4, and 5-number match tiers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Charity Impact Section */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-2xl">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
            CHARITY FIRST
          </span>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Your membership supports a cause you choose.
          </h2>

          <p className="mt-4 text-base text-gray-600 dark:text-gray-300 leading-relaxed">
            Select a verified charity and decide how much of your subscription you want to direct toward charitable contribution.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl dark:bg-emerald-950/60">
              🎗️
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
              Choose your charity
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Browse our directory of verified community organizations and select the cause you care about most.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl dark:bg-emerald-950/60">
              📊
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
              Minimum 10%
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Your subscription contribution starts at a mandatory PRD minimum of 10% straight to charity.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl dark:bg-emerald-950/60">
              ❤️
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
              Increase your impact
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Optionally scale your contribution to 20%, 30%, 50%, or even 100% of your membership fees.
            </p>
          </div>
        </div>
      </section>

      {/* Monthly Draw Prize Tiers */}
      <section className="border-t border-gray-100 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
              MONTHLY DRAW
            </span>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Three ways to match.
            </h2>

            <p className="mt-4 text-base text-gray-600 dark:text-gray-300">
              The monthly draw distributes the prize pool across three distinct winning tiers:
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-950 dark:text-amber-400">
                5-NUMBER MATCH
              </span>
              <h3 className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white">
                40%
              </h3>
              <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Jackpot Tier (With Rollover)
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                If unclaimed, rolls over to next month.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                4-NUMBER MATCH
              </span>
              <h3 className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white">
                35%
              </h3>
              <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Prize Pool Tier
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Split equally among all 4-match winners.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                3-NUMBER MATCH
              </span>
              <h3 className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white">
                25%
              </h3>
              <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Prize Pool Tier
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Split equally among all 3-match winners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-tr from-emerald-950 via-gray-950 to-black px-8 py-16 text-white shadow-xl md:px-14 border border-emerald-900/40">
          <h2 className="max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
            Ready to become a Digital Hero?
          </h2>

          <p className="mt-4 max-w-xl text-base text-gray-300 leading-relaxed">
            Subscribe, log your Stableford golf scores, participate in monthly prize draws, and generate real charitable impact.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-xl bg-emerald-500 px-8 py-3.5 font-bold text-black shadow-lg transition hover:bg-emerald-400"
            >
              Get Started Now &rarr;
            </Link>
            <Link
              href="/charities"
              className="rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Explore Charities
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-gray-500 dark:text-gray-400 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-900 dark:text-white">Digital Heroes</span>
            <span>© 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/charities" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              Charities
            </Link>
            <Link href="/dashboard/subscription" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              Plans
            </Link>
            <Link href="/login" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
