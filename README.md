# J.V.C — Jeetar Vault Core

> Secure backup and organization for your visual works.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Auth / DB / Storage:** Supabase
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Hosting:** Vercel

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USER/jeetar-vault-core.git
cd jeetar-vault-core
npm install
```

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`
3. Go to **Storage** and create a bucket named `jvc` (set to **private**)
4. Add storage policies (see bottom of SQL file for examples)
5. Go to **Authentication > URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`

### 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase keys:

```bash
cp .env.local.example .env.local
```

### 4. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push repo to GitHub
2. Import into [vercel.com](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Update Supabase Auth redirect URLs to include `https://jeetar-vault.vercel.app/**`

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Redirect to /library
│   ├── login/page.tsx          # Login page
│   ├── auth/callback/route.ts  # Auth callback
│   └── (protected)/
│       ├── layout.tsx          # Sidebar + Header
│       ├── library/page.tsx    # Library (search + grid)
│       ├── works/new/page.tsx  # Create work
│       ├── works/[id]/page.tsx # Work detail + images
│       ├── upload/page.tsx     # Upload images
│       └── settings/page.tsx   # Profile + Export
├── components/
│   ├── layout/                 # Sidebar, Header
│   ├── works/                  # WorkCard, WorkGrid, WorkForm
│   └── upload/                 # Dropzone
├── lib/
│   ├── supabase/               # Client, Server, Middleware
│   ├── types/                  # Database types
│   └── utils.ts                # Helpers
└── middleware.ts                # Auth guard
```

## License

Private — Jeetar Team
