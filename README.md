# VidyaMitraScholarship Portal

Official independent scholarship application and verification portal. Built with React, TypeScript, Tailwind CSS, Vite, and Supabase.

---

## 🚀 Key Features

* **Student Registration & Login:** Email/password authentication with Supabase Auth.
* **Student Dashboard:**
  * **Available Scholarships:** View official scholarships published by the administrator.
  * **Apply for Scholarship:** Complete 6-part application form (Personal, Education, Eligibility, Bank details, Document upload, and Declarations).
  * **Status Tracker:** Live tracking of overall status (`Pending`, `Under Review`, `Documents Required`, `Eligible`, `Not Eligible`, `Approved`, `Rejected`), eligibility verification, and document verification count.
  * **Official Remarks:** View feedback and instructions from the administrator.
* **Administrator Console:**
  * **Metrics:** Live counters for registered students, applications received, pending verifications, approved, and rejected.
  * **Scholarship Publishing:** Add, edit, and delete scholarship schemes (Starts with 0 scholarships).
  * **Verification Workflow:** Inspect full student dossiers, individually verify uploaded documents, verify eligibility, and approve or reject applications.
* **Zero Hardcoded Secrets:** Only public anon credentials and Supabase URL are used client-side; no service-role keys are exposed.

---

## 🛠️ Technology Stack

* **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
* **Backend & Database:** Supabase (PostgreSQL, Supabase Auth, Supabase Storage)
* **Hosting:** GitHub Pages (Free static hosting)

---

## 📋 Supabase Database Setup

1. Create a free project at [Supabase](https://supabase.com/).
2. In your Supabase dashboard, navigate to **SQL Editor** -> **New query**.
3. Copy the entire contents of `supabase-schema.sql` from this repository and click **Run**.
4. Go to **Authentication** -> **Users** and click **Add user**:
   * Email: `admin@vidyamitra.com` (or your preferred admin email)
   * Password: Create a secure password
5. In **SQL Editor**, run this query to assign administrator privileges:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@vidyamitra.com';
   ```

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-public-anon-key"
```

> **Note:** Only use the public `anon` key. Never expose your `service_role` key!

---

## 📦 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Create production build
npm run build
```

---

## 🌐 Deploy to GitHub Pages (Free)

### Method 1: Automated Deployment via GitHub Actions (Recommended)

1. Push your repository to GitHub.
2. In your GitHub repository, go to **Settings** -> **Secrets and variables** -> **Actions**.
3. Add two repository secrets:
   * `VITE_SUPABASE_URL`: Your Supabase Project URL
   * `VITE_SUPABASE_ANON_KEY`: Your Supabase public `anon` key
4. Go to **Settings** -> **Pages**:
   * Under **Build and deployment** -> **Source**, select **GitHub Actions**.
5. When you push to the `main` branch, the workflow (`.github/workflows/deploy.yml`) will automatically build and deploy your portal!

### Method 2: Manual Build & Push to `gh-pages`

```bash
# 1. Create .env with your Supabase credentials
# 2. Run build
npm run build

# 3. Deploy the dist/ directory to the gh-pages branch
npx gh-pages -d dist
```
Cloudflare deployment update
