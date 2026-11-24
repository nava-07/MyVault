# 🛡️ MyVault — Personal Digital Locker

[![Built with React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20Tailwind-61dafb.svg)](https://react.dev/)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL%20%2B%20RLS-3ecf8e.svg)](https://supabase.com/)
[![Storage](https://img.shields.io/badge/Storage-Supabase%20Storage%20%28Private%29-3ecf8e.svg)](https://supabase.com/docs/guides/storage)
[![Auth](https://img.shields.io/badge/Auth-Supabase%20Auth-3ecf8e.svg)](https://supabase.com/docs/guides/auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**MyVault** is a secure, personal digital locker built with **React (Vite)** and **Supabase (PostgreSQL + Auth + Storage)**. It enables users to store certificates, published research papers, evaluation reports, and achievement photos, with client-side image compression, private signed URLs, and category-level ZIP downloads.

---

## 📑 Architecture Overview

- **Frontend**: React 18 (Vite) + Tailwind CSS, responsive with light/dark theme.
- **Database**: Supabase PostgreSQL for all text data (`profiles`, `categories`, `documents`) with Row Level Security (RLS).
- **Authentication**: Supabase Auth with dual login (Email OR Mobile phone number + Password).
- **File Storage**: Supabase Storage using private bucket `myvault-files` with signed URLs (600 seconds expiry).
- **Zero External Storage**: No AWS S3, Cloudflare R2, or third-party storage credentials required.

---

## 🔑 Authentication Rules

### A) Sign Up (Email Verification Required ONLY Here)
- **Fields**: Full Name, Email, Mobile Number, Password (min 8 chars with strength meter), Confirm Password.
- **Workflow**:
  1. On submit, Supabase sends a 6-digit verification code to the email.
  2. User enters the 6-digit code on the verification screen (expires in 10 minutes, with a 60-second resend cooldown).
  3. Account activates only upon code verification.
  4. Saves `full_name`, `email`, and `phone` to the `profiles` table (`phone` is unique).

### B) Login (NO Email Code, NO OTP)
- **One Field**: `"Email or Mobile number"` plus `Password`.
- **Workflow**:
  - If input contains `@`, signs in directly with `email + password`.
  - If input is a mobile number, resolves to matching email via secure server RPC `get_email_by_phone`, then signs in with `email + password`.
  - Shows generic error (`"Invalid credentials"`) so account existence is not revealed.
  - "Remember me" session management and protected routes.

### C) Forgot Password (Email Verification Code)
- User enters Email or Mobile number (resolved to its email on the server).
- Sends a 6-digit code to the email via `resetPasswordForEmail()`.
- User enters the 6-digit code (10-minute expiry, 60s cooldown).
- Shows "Set new password" screen (min 8 characters).
- Updates password via `supabase.auth.updateUser()` and redirects to login with success message.

---

## 🗄️ Database & Storage Setup (Step-by-Step)

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/) and create a project.
2. In **Project Settings** ➔ **API**, copy:
   - **Project URL** ➔ `VITE_SUPABASE_URL`
   - **Project API Keys** (`anon` `public`) ➔ `VITE_SUPABASE_ANON_KEY`

### Step 2: Run Database Migration
1. In your Supabase Dashboard, open **SQL Editor**.
2. Click **New Query**, paste the complete contents of [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql), and click **Run**.
3. This creates:
   - `profiles` table (with unique phone constraint)
   - `categories` table
   - `documents` table (with `file_path` column)
   - Indexes and Full-Text Search GIN index
   - Row Level Security (RLS) policies on all tables
   - Secure RPC function `get_email_by_phone`
   - Automatic triggers for new profile and default categories seeding
   - Private storage bucket `myvault-files` and folder-level storage RLS policies

### Step 3: Verify the Storage Bucket
1. Go to **Storage** in Supabase Dashboard.
2. Confirm the private bucket `myvault-files` is created.
3. Storage policies restrict uploads and reads to `{user_id}/*` matching `auth.uid()`.

### Step 4: Configure Email & SMTP
1. In Supabase Dashboard, go to **Authentication** ➔ **Providers** ➔ **Email**:
   - Ensure **Enable Email provider** is **ON**.
   - Ensure **Confirm email** is **ON**.
2. Go to **Authentication** ➔ **Email Templates** ➔ **Confirmation**:
   - Set Subject: `Your MyVault verification code`
   - In body, use `{{ .Token }}` to display the 6-digit verification code.
3. Set OTP expiry to `600` seconds (10 minutes) under **Authentication** ➔ **URL Configuration**.
4. Set **Site URL** to `http://localhost:5173` (or your production domain).
5. (Optional) In **Project Settings** ➔ **Authentication** ➔ **SMTP Settings**, configure your Brevo / custom SMTP credentials.

---

## 🚀 Environment Variables

Create `.env` in the root of the project with only the 2 required variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 💻 Local Development

### 1. Install Dependencies
```bash
cd myvault
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
npm run preview
```

---

## 📂 File Storage Workflow

- **Upload**: `supabase.storage.from("myvault-files").upload("{user_id}/{uuid}-{safe_filename}", file)`
- **Metadata**: Row is inserted in `documents` with `file_path`. If insert fails, uploaded file is removed.
- **View**: `supabase.storage.from("myvault-files").createSignedUrl(file_path, 600)`. Images viewable inline with zoom controls, PDFs in embedded viewer, DOCX shows preview unavailable message.
- **Download**: `createSignedUrl(file_path, 600, { download: downloadName })` where `downloadName` = cleaned document title + original file extension.
- **Delete**: Storage file is deleted via `remove([file_path])`, then database row is deleted.
- **Replace**: New file is uploaded first, database row is updated, then old file is deleted from storage.
- **Category ZIP**: Download all files in a category as a ZIP archive using `JSZip`.

---

## 🌐 Production Deployment

### Render (Static Site)
1. Push your code repository to [GitHub](https://github.com/).
2. In the [Render Dashboard](https://dashboard.render.com/), click **New +** > **Static Site**.
3. Connect your GitHub repository.
4. Fill in the build details:
   - **Name**: `myvault`
   - **Root Directory**: `myvault` (or leave empty if repository root contains `package.json`)
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
5. Add **Environment Variables** under the Environment tab:
   - `VITE_SUPABASE_URL`: `https://gsakyvjatpngmblpeetc.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `sb_publishable_imvtgYFMZpA7HBjDy_d-9w_IlQvo4wC`
6. Add **Redirects / Rewrites** (required for React Router SPA routes like `/dashboard`):
   - Under Settings > **Redirects/Rewrites**, click **Add Rule**:
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Action**: `Rewrite`
7. Click **Deploy Static Site**.

### Vercel
1. Import repository to [Vercel](https://vercel.com/).
2. Framework: **Vite**.
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. SPA routing is pre-configured via `vercel.json`.

### Netlify
1. Import repository to [Netlify](https://www.netlify.com/).
2. Build command: `npm run build`, publish directory: `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in environment variables.
4. Deploy. SPA routing is pre-configured via `public/_redirects`.

---

## 📄 License
MIT License.
