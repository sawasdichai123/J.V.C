# Implementation Plan — J.V.C (Jeetar Vault Core)

## 0) Overview

**Product name (brand):** J.V.C

**Full name:** Jeetar Vault Core

**Goal:** Web application for creators to **backup and organize visual works** (comic / illustration / any image-based work) with **categorization** and **search/query by work title**.

**Hosting:** Vercel

**Backend services:** Supabase

- **Auth:** Supabase Auth (email/password)
- **Database:** Supabase Postgres
- **Storage:** Supabase Storage (image originals + thumbnails)

**Initial deployment URL (Option A):** `https://jeetar-vault.vercel.app`

---

## 1) Non-Goals (for MVP)

- Offline-first / mobile native apps
- Complex team roles/permissions (beyond owner-only access)
- Advanced search engine (Elasticsearch/Meilisearch)
- Complex DRM / watermark pipeline

---

## 2) MVP Requirements (Scope)

### 2.1 Authentication

- Login / Logout
- Session persistence
- Protected routes (cannot access library without login)

### 2.2 Library & Works

- Create work (title required)
- Edit work (title/description/category/tags)
- Delete work (soft-delete recommended for safety)
- View work detail

### 2.3 Image Backup (Upload)

- Upload multiple images per work
- Store images in Supabase Storage
- Save metadata in DB (path, size, width/height optional)
- Generate thumbnails (MVP can be client-generated; later can move to server)

### 2.4 Categorization

- Category (single per work)
- Tags (multiple per work)

### 2.5 Search / Query

- Search by work title (partial match)
- Filter by category and/or tags (optional but recommended)

### 2.6 Backup & Export

- Export metadata as JSON (download)
- Provide storage path references for re-import / restore workflows

---

## 3) Architecture

### 3.1 App

**Framework:** Next.js (App Router)

- UI pages + server actions/route handlers
- Auth guards via middleware/server components

### 3.2 Data & Files

- **DB**: authoritative metadata
- **Storage**: image bytes (original + thumbnail)

Key rule: **Never store image binaries on Vercel filesystem.** Use Supabase Storage.

### 3.3 Upload Strategy

Use **signed upload** pattern (recommended):

- Client requests an upload plan (path, token)
- Client uploads directly to Supabase Storage using Supabase client
- Client calls API to confirm + write DB metadata

This avoids Vercel function timeout and large payload issues.

---

## 4) Data Model (Supabase Postgres)

> Naming can be adjusted; below is a pragmatic schema that works well with RLS and search.

### 4.1 Tables

#### `profiles`

- `id uuid primary key references auth.users(id)`
- `display_name text`
- `created_at timestamptz default now()`

#### `categories`

- `id uuid primary key default gen_random_uuid()`
- `owner_id uuid not null references auth.users(id)`
- `name text not null`
- `created_at timestamptz default now()`

Unique constraint suggestion:
- `(owner_id, name)` unique

#### `tags`

- `id uuid primary key default gen_random_uuid()`
- `owner_id uuid not null references auth.users(id)`
- `name text not null`
- `created_at timestamptz default now()`

Unique constraint suggestion:
- `(owner_id, name)` unique

#### `works`

- `id uuid primary key default gen_random_uuid()`
- `owner_id uuid not null references auth.users(id)`
- `title text not null`
- `description text`
- `category_id uuid references categories(id)`
- `cover_asset_id uuid` (optional, references `assets.id` later)
- `is_deleted boolean not null default false`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Index suggestions:
- `(owner_id, created_at desc)`
- `(owner_id, title)`

Search suggestions:
- Add `title_tsv tsvector generated always as (to_tsvector('simple', coalesce(title,''))) stored`
- Create GIN index on `title_tsv`

#### `work_tags`

- `work_id uuid not null references works(id) on delete cascade`
- `tag_id uuid not null references tags(id) on delete cascade`
- primary key `(work_id, tag_id)`

#### `assets`

- `id uuid primary key default gen_random_uuid()`
- `owner_id uuid not null references auth.users(id)`
- `work_id uuid not null references works(id) on delete cascade`
- `kind text not null` (e.g. `original`, `thumb`)
- `bucket text not null`
- `path text not null`
- `mime_type text`
- `bytes bigint`
- `width int` (optional)
- `height int` (optional)
- `sha256 text` (optional)
- `created_at timestamptz default now()`

Index suggestions:
- `(owner_id, work_id, created_at desc)`
- `(owner_id, sha256)`

---

## 5) Supabase Storage Design

### 5.1 Buckets

- Bucket: `jvc` (private)
  - `works/{workId}/original/{assetId}.{ext}`
  - `works/{workId}/thumb/{assetId}.webp`

**Why private bucket:**
- Images are backups and might be sensitive.
- App issues time-limited signed URLs for viewing.

### 5.2 Access Pattern

- Upload: authenticated user can upload only into their own work path (enforced by DB + app logic; Storage policy can be strict later)
- View: app generates signed URLs per asset

---

## 6) Security (RLS + Policies)

### 6.1 Postgres RLS

Enable RLS on all user data tables:

- `categories`, `tags`, `works`, `work_tags`, `assets`

Policies (baseline):

- SELECT/INSERT/UPDATE/DELETE where `owner_id = auth.uid()`
- For `work_tags`: ensure the `works.owner_id = auth.uid()` and `tags.owner_id = auth.uid()`

### 6.2 Storage Policies

MVP approach:
- Use **private bucket**.
- Client uses Supabase Auth token; app issues signed URLs for reads.

If implementing Storage RLS now:
- Limit `insert` objects to authenticated users.
- For `select`, prefer signed URL reads rather than public read.

---

## 7) UI/UX Plan (Pages)

### 7.1 Public

- `/login`
  - Email/password
  - Remember session

### 7.2 Protected

- `/` (Library)
  - Search bar (title)
  - Work cards grid
  - Filter: category, tags (optional)

- `/works/new`
  - Create new work form

- `/works/[id]`
  - Work detail
  - Tabs:
    - Images
    - Settings (edit title/category/tags)

- `/upload`
  - Select work
  - Drag/drop multiple files
  - Progress per file

- `/settings`
  - Profile (display name)
  - Export metadata (download JSON)

---

## 8) API / Server Routes Plan (Next.js Route Handlers)

> Exact file paths depend on project structure; these are logical endpoints.

### 8.1 Auth

- Supabase Auth handled mostly on client with SSR support.

### 8.2 Works

- `GET /api/works` list works with search params
- `POST /api/works` create work
- `PATCH /api/works/:id` update work
- `DELETE /api/works/:id` soft delete

### 8.3 Tags/Categories

- `GET /api/tags`, `POST /api/tags`
- `GET /api/categories`, `POST /api/categories`

### 8.4 Upload

- `POST /api/uploads/plan`
  - Input: `workId`, files metadata (name, size, mime)
  - Output: target storage `path` per file, and DB `assetId`s

- `POST /api/uploads/commit`
  - Input: `assetId`, `path`, `bytes`, `mime`, `sha256` (optional)
  - Writes metadata + verifies the object exists (optional)

### 8.5 Assets (Read)

- `POST /api/assets/signed-url`
  - Input: `assetId`
  - Output: signed URL (expires 60-300s)

### 8.6 Export

- `GET /api/export/metadata`
  - Output: JSON dump with categories/tags/works/assets relations

---

## 9) Search Implementation

### 9.1 MVP (Simple)

- Use SQL `ILIKE` on `works.title`
- Query: `?q=...`

### 9.2 Recommended (Better)

- Add `tsvector` generated column on `works` and a GIN index
- Use `plainto_tsquery` with `@@`

---

## 10) Thumbnail Strategy

### 10.1 MVP (Client-side)

- Generate thumb on client using canvas
- Upload thumb as `kind = 'thumb'` to storage

Pros:
- No extra backend compute

Cons:
- Client CPU usage; different devices vary

### 10.2 Later (Server-side)

- Use Supabase Edge Function or separate worker to generate thumbs

---

## 11) Implementation Milestones

### Milestone 1 — Repo & Baseline App

- Create repo: `jeetar-vault-core`
- Setup Next.js + UI framework
- Setup Supabase project
- Verify local dev and Vercel deploy pipeline

### Milestone 2 — Auth + Protected Routes

- Implement login page
- Implement middleware/auth guard
- Create `profiles` table and profile bootstrap

### Milestone 3 — Works CRUD + Library UI

- Works create/edit/list
- Category/tag creation
- Basic search by title

### Milestone 4 — Upload + Storage + Asset Metadata

- Create bucket `jvc`
- Implement upload plan/commit flow
- Save `assets` metadata
- Work detail shows image grid with signed URLs

### Milestone 5 — Export Metadata (Backup)

- Add export endpoint
- UI button to download JSON
- Document restore strategy (manual for MVP)

### Milestone 6 — Hardening

- Improve RLS policies
- Add dedup hash (optional)
- Add rate limits (optional)
- Error handling and audit logs (optional)

---

## 12) Dev Setup

### 12.1 Required ENV

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose to client)
- `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000` / `https://jeetar-vault.vercel.app`)

### 12.2 Supabase Settings

- Auth Providers: Email
- URL Configuration:
  - Site URL: `https://jeetar-vault.vercel.app`
  - Additional Redirect URLs:
    - `https://jeetar-vault.vercel.app/**`
    - `http://localhost:3000/**`

---

## 13) Vercel Deployment

- Import repo into Vercel
- Configure environment variables in Vercel project
- Deploy preview and production
- Validate auth redirects and storage signed URL access

---

## 14) Acceptance Criteria (MVP)

- User can login
- User can create a work, assign category/tags
- User can upload multiple images into a work and see them in work detail
- User can search works by title
- User can export metadata JSON successfully

---

## 15) Next Enhancements (Post-MVP)

- Full-text search tuning (ranking, prefix)
- Chapter/album grouping within work
- Bulk tag operations
- Sharing links (time-limited, per work)
- Activity log
- Storage lifecycle rules
- Import workflow (rebuild DB from metadata + storage paths)
