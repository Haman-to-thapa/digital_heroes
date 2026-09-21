import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fcfcfd] text-slate-900 transition-colors duration-200 dark:bg-[#080c14] dark:text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/70 pt-16 pb-24 dark:border-slate-800/80 sm:pt-24 sm:pb-32">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl dark:from-emerald-500/15 dark:via-cyan-500/5" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Vision & Copy */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                A new era of purpose-driven golf
              </div>

              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl leading-[1.12]">
                Play the game you love. <br />
                <span className="font-serif italic font-normal text-emerald-700 dark:text-emerald-400">
                  Fund the causes that count.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                Digital Heroes turns your regular rounds of golf into monthly charity funding. Post your Stableford scores, enter transparent cash draws, and direct real donations to verified non-profits.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/signup"
                  className="rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
                >
                  Start Membership
                </Link>

                <Link
                  href="/charities"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80"
                >
                  Explore Charities
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-10 flex flex-wrap items-center gap-6 pt-6 border-t border-slate-200/70 dark:border-slate-800/70 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>10% min. to verified charity</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Stableford scoring (1–45)</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Encrypted Stripe billing</span>
                </div>
              </div>
            </div>

            {/* Right Column: How it Works Preview */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-7">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                    The Loop
                  </span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    Four Simple Steps
                  </span>
                </div>

                <div className="mt-5 space-y-3.5">
                  <div className="group rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-slate-100/70 dark:border-slate-800/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/70">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        1. Join on a monthly or yearly plan
                      </h3>
                      <span className="text-xs font-mono text-slate-400">01</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Choose flexible monthly enrollment or a discounted annual pass.
                    </p>
                  </div>

                  <div className="group rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-slate-100/70 dark:border-slate-800/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/70">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        2. Post your 5 latest scores
                      </h3>
                      <span className="text-xs font-mono text-slate-400">02</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Log your Stableford points from any regulation course.
                    </p>
                  </div>

                  <div className="group rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-slate-100/70 dark:border-slate-800/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/70">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        3. Allocate your charity share
                      </h3>
                      <span className="text-xs font-mono text-slate-400">03</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      At least 10% of every subscription goes directly to your selected cause.
                    </p>
                  </div>

                  <div className="group rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-slate-100/70 dark:border-slate-800/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/70">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        4. Enter the monthly draw
                      </h3>
                      <span className="text-xs font-mono text-slate-400">04</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Automatic sweepstakes entry with 3, 4, and 5-number cash tiers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Philanthropy First */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
              Community Impact
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Charity is at the center of every swing.
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Unlike traditional commercial sweepstakes, Digital Heroes gives subscribers direct ownership over where their contributions go. You choose the organization and the percentage.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                01 / Choice
              </span>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                Vetted Charity Directory
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Pick from organizations focused on community education, youth empowerment, or environmental conservation.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                02 / Foundation
              </span>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                10% Minimum Commitment
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Every single membership begins with a baseline 10% charity contribution automatically carved out of your fee.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                03 / Scale
              </span>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                Optional Higher Contribution
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Increase your percentage to 20%, 30%, 50%, or 100% from your personal dashboard at any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Prize Tiers (Transparent Mathematics) */}
      <section className="border-y border-slate-200/80 bg-slate-50/60 py-20 dark:border-slate-800/80 dark:bg-slate-900/30 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                Transparent Returns
              </span>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Monthly Draw Prize Tiers
              </h2>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
                Three clearly structured match levels derived from total active subscribers.
              </p>
            </div>

            <span className="inline-flex self-start rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Split equally if multiple winners
            </span>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {/* 5-Match */}
            <div className="relative rounded-2xl border border-emerald-500/30 bg-white p-7 shadow-xs dark:border-emerald-500/20 dark:bg-slate-900/80">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <span>5-Number Match</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 dark:bg-emerald-950/60">Jackpot</span>
              </div>
              <div className="mt-5 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
                40%
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                of total monthly prize pool
              </p>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
                Unclaimed jackpot rolls over to the following month.
              </div>
            </div>

            {/* 4-Match */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900/80">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                4-Number Match
              </div>
              <div className="mt-5 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
                35%
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                of total monthly prize pool
              </p>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
                Evenly distributed across all verified 4-match entries.
              </div>
            </div>

            {/* 3-Match */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900/80">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                3-Number Match
              </div>
              <div className="mt-5 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
                25%
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                of total monthly prize pool
              </p>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
                Evenly distributed across all verified 3-match entries.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-900/5 bg-slate-950 px-8 py-14 text-white shadow-xl dark:border-slate-800 sm:px-12 sm:py-16">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Ready to play with purpose?
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300">
                Sign up, enter your five latest Stableford rounds, choose your non-profit cause, and join this month&apos;s sweepstakes.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400"
                >
                  Create Your Account
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                >
                  Member Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-10 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">Digital Heroes</span>
            <span className="ml-2">© 2026. Built with purpose.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/charities" className="transition hover:text-slate-900 dark:hover:text-white">
              Charities
            </Link>
            <Link href="/dashboard/subscription" className="transition hover:text-slate-900 dark:hover:text-white">
              Subscription
            </Link>
            <Link href="/login" className="transition hover:text-slate-900 dark:hover:text-white">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
