# 🏌️‍♂️ Digital Heroes — Golf Sweepstakes & Charity Platform

Digital Heroes is an enterprise-grade full-stack web application that unites golfers, charitable foundations, and monthly sweepstakes into a unified platform. Golfers submit their Stableford scores to enter transparent monthly draws, with every subscription and donation directly supporting vetted charity partners.

---

## 🌟 Key Features

### 👤 Golfer Member Portal
- **Authentication & Roles**: Secure authentication powered by Supabase Auth with custom role-based access control (`golfer` vs `admin`).
- **Subscription Lifecycle**: Flexible Monthly (`₹499/mo`) and Annual (`₹4,990/yr`) plans powered by Stripe Checkout and recurring Webhooks, with a self-service "Cancel at Period End" option.
- **5-Score Stableford Management**:
  - Scores restricted to valid Stableford range (`1` to `45`).
  - Strict unique-date validation (prevents duplicate scores on the same date).
  - FIFO rotation: submitting a 6th score automatically replaces the oldest score to maintain exactly 5 active scores for the draw.
- **Charity Selection & Impact**:
  - Choose a supported charity partner anytime.
  - Set a voluntary contribution percentage (minimum 10%, up to 100%).
  - Direct independent one-time donations with Stripe payment processing.
- **Sweepstakes & Winnings**:
  - View live draw eligibility status and active tickets.
  - Winner notification card with score proof upload pipeline.
  - Track lifetime winnings and payout statuses.

### 👑 Admin Management Portal (`/admin`)
- **Executive Command Center**: High-level KPI metrics across subscribers, total prize pool, total charity contributions, and active draws.
- **User Management (`/admin/users`)**: Search, filter by role, view subscription plans, score activity (`X / 5`), charity preferences, and edit golfer profiles.
- **Charity Directory CRUD (`/admin/charities`)**: Add, edit, and delete partner charities, upload logos/media, publish upcoming events, and toggle `featured` and `active` badges.
- **Draw Management Engine (`/admin/draw`)**:
  - **Random Mode**: Generates 5 unbiased random winning numbers between 1 and 45.
  - **Algorithmic Mode**: Calculates score frequencies across all active subscribers and draws numbers weighted by golf score popularity.
  - **Prize Pool Engine**: Automatically pools contributions based on active subscribers.
  - **Publishing & Result Calculation**: Evaluates all entries for 3, 4, and 5 matches.
  - **Tiered Prize Distribution**: Allocates 40% (5-match), 35% (4-match), and 25% (3-match).
  - **Jackpot Rollover**: If there are zero 5-match jackpot winners, the 40% pool automatically rolls over into `jackpot_rollover`.
- **Winner Proof Verification & Payouts (`/admin/winners`)**:
  - Inspect uploaded golfer scorecard screenshots securely via private signed URLs.
  - Review, approve, or reject proof submissions.
  - Transition payout states from `pending` to `paid`.
- **Reports & Analytics (`/admin/reports`)**: Audited platform analytics showing cumulative prize distribution, charity impact, and draw history.
- **Public Results Portal (`/draws`)**: Open, transparent list of all historical published draws and winning numbers for public auditing.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/) with React Server Components & Turbopack
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with responsive dark/light mode
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Storage Buckets)
- **Payment Gateway**: [Stripe](https://stripe.com/) (Checkout Sessions, Customer Subscriptions, Webhook Event Handling)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 📐 Project Assumptions (PRD Alignment)

1. **Prize Pool Contribution per Subscriber**:
   - `PRIZE_POOL_PER_SUBSCRIBER=100`: Configured as ₹100 per active subscriber by default. This satisfies the PRD requirement for a fixed per-subscriber contribution into the prize pool.
2. **Algorithmic Draw Weighting**:
   - Numbers that match submitted scores from active golfers receive higher weights proportional to their appearance frequency. Unsubmitted numbers (1–45) retain a baseline weight of 1 so all numbers remain statistically possible.
3. **Prize Allocation Tiers**:
   - 5-Match Winners: **40%** of total prize pool (divided equally among 5-match winners).
   - 4-Match Winners: **35%** of total prize pool (divided equally among 4-match winners).
   - 3-Match Winners: **25%** of total prize pool (divided equally among 3-match winners).
4. **Jackpot Rollover**:
   - If a monthly draw has no 5-match winners, the 40% jackpot pool is recorded in `jackpot_rollover` and carried forward to increase the next month's jackpot pool.

---

## 🗄️ Database Schema & Setup

Run the following SQL statements in your **Supabase SQL Editor**:

```sql
-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text default 'user' check (role in ('user', 'admin')),
  charity_id uuid,
  charity_percentage numeric default 10 check (charity_percentage >= 10 and charity_percentage <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. CHARITIES
create table if not exists public.charities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  upcoming_event text,
  is_featured boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. SUBSCRIPTIONS
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan_type text check (plan_type in ('monthly', 'yearly')),
  status text check (status in ('active', 'past_due', 'canceled', 'lapsed', 'inactive')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. SCORES
create table if not exists public.scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  score integer not null check (score >= 1 and score <= 45),
  score_date date not null,
  created_at timestamptz default now(),
  unique(user_id, score_date)
);

-- 5. DRAWS
create table if not exists public.draws (
  id uuid default gen_random_uuid() primary key,
  draw_month date unique not null,
  draw_type text default 'random' check (draw_type in ('random', 'algorithmic')),
  status text default 'draft' check (status in ('draft', 'simulated', 'published')),
  winning_numbers integer[],
  total_prize_pool numeric default 0,
  five_match_pool numeric default 0,
  four_match_pool numeric default 0,
  three_match_pool numeric default 0,
  jackpot_rollover numeric default 0,
  published_at timestamptz,
  created_at timestamptz default now()
);

-- 6. DRAW ENTRIES
create table if not exists public.draw_entries (
  id uuid default gen_random_uuid() primary key,
  draw_id uuid references public.draws(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  number_1 integer not null,
  number_2 integer not null,
  number_3 integer not null,
  number_4 integer not null,
  number_5 integer not null,
  matches_count integer default 0,
  created_at timestamptz default now(),
  unique(draw_id, user_id)
);

-- 7. WINNERS
create table if not exists public.winners (
  id uuid default gen_random_uuid() primary key,
  draw_id uuid references public.draws(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  draw_entry_id uuid references public.draw_entries(id) on delete cascade not null,
  match_type text check (match_type in ('5_match', '4_match', '3_match')),
  prize_amount numeric default 0,
  verification_status text default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  payout_status text default 'pending' check (payout_status in ('pending', 'paid')),
  created_at timestamptz default now()
);

-- 8. WINNER PROOFS
create table if not exists public.winner_proofs (
  id uuid default gen_random_uuid() primary key,
  winner_id uuid references public.winners(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  file_url text not null,
  verified boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- 9. DONATIONS
create table if not exists public.donations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  charity_id uuid references public.charities(id) on delete set null,
  amount numeric not null,
  percentage numeric default 0,
  source text default 'subscription' check (source in ('subscription', 'independent', 'prize_cut')),
  stripe_checkout_session_id text unique,
  created_at timestamptz default now()
);

-- 10. STORAGE BUCKET
insert into storage.buckets (id, name, public)
values ('winner-proofs', 'winner-proofs', false)
on conflict (id) do nothing;
```

---

## ⚙️ Environment Variables

Create a `.env.local` file with the following keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...
SUPABASE_SECRET_KEY=eyJhbGciOi...

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

# Sweepstakes Engine Parameters
PRIZE_POOL_PER_SUBSCRIBER=100
```

---

## 🚀 Getting Started Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Haman-to-thapa/digital_heroes.git
   cd digital-heroes
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run database migrations**:
   Execute the SQL schema in your Supabase SQL editor.

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

5. **Listen to Stripe Webhooks** (for local testing):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

---

## 🚢 Deployment (Vercel)

1. Push your repository to GitHub.
2. Log into [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your repository (`digital_heroes`).
4. Set the Root Directory to `./` or `digital-heroes` as appropriate.
5. In **Environment Variables**, add all keys listed in `.env.local`.
6. Click **Deploy**.
7. In the Stripe Dashboard, add your production webhook endpoint:
   `https://your-domain.vercel.app/api/stripe/webhook` with events:
   - `checkout.session.completed`
   - `customer.subscription.updated`

---

## 🧪 Official 29-Step Verification Checklist

| # | Step | Expected Result |
|---|---|---|
| 1 | **Signup** | Create a new golfer account with email & password |
| 2 | **Login** | Authenticate and redirect to `/dashboard` |
| 3 | **Profile Initialized** | Profile row created with default `user` role |
| 4 | **Charity Selection** | Select a partner charity from `/dashboard/charity` |
| 5 | **Charity Percentage** | Set contribution percentage (10%–100%) and save |
| 6 | **Monthly Subscription** | Select Monthly Plan on `/dashboard/subscription` |
| 7 | **Stripe Payment** | Complete checkout with test card `4242...` |
| 8 | **Subscription Active** | Status updates to `Active` with renewal date displayed |
| 9 | **Add 5 Scores** | Input 5 golf scores with distinct dates (`/dashboard/scores`) |
| 10 | **Duplicate Date Test** | Same date submission is rejected with validation alert |
| 11 | **6th Score FIFO** | Submitting 6th score replaces oldest score |
| 12 | **Draw Entry Created** | 5 active scores qualify as the monthly ticket |
| 13 | **Admin Login** | Log in as admin and access `/admin` |
| 14 | **Simulate Random Draw** | Generate 5 winning numbers in Random mode (`/admin/draw`) |
| 15 | **Simulate Algorithmic** | Generate 5 winning numbers weighted by score frequencies |
| 16 | **Calculate Prize Pool** | Prize pool aggregates active subscribers (`subscribers * 100`) |
| 17 | **Publish Draw** | Status shifts to `published`, numbers go live |
| 18 | **Calculate Results** | Matches counted (3, 4, 5) and winner rows created |
| 19 | **Calculate Prizes** | Prizes split: 40% (5-match), 35% (4-match), 25% (3-match) |
| 20 | **Winner Listed** | Winner row visible in `/admin/winners` |
| 21 | **Upload Proof** | Winner uploads scorecard screenshot in `/dashboard/winnings` |
| 22 | **Admin View Proof** | Admin opens uploaded scorecard in modal |
| 23 | **Approve Proof** | Admin clicks "Verify Proof" → status becomes `approved` |
| 24 | **Mark Paid** | Admin marks payout as `paid` |
| 25 | **Golfer Dashboard Update** | Golfer's **Total Winnings** reflects verified payout amount |
| 26 | **Executive Reports** | `/admin/reports` displays live platform KPIs |
| 27 | **Cancel Subscription** | Golfer clicks "Cancel at Period End", renewal cancels safely |
| 28 | **Public Results** | `/draws` displays all published draw numbers publicly |
| 29 | **Responsive Check** | Tested seamlessly across mobile, tablet, and desktop viewports |

---

## 📄 License
This project is proprietary and built for the Digital Heroes Platform. All rights reserved.
