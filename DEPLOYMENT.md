# Vertex Airtight Deployment Guide

Follow these steps to securely push the **Vertex** platform to a Public GitHub repository and deploy it to **Vercel** with maximum-security configurations.

## 🛡️ Pre-Flight Security Check
1.  **Check `.env`**: Make sure your `.env` file is NOT being tracked by git.
    - Run `git status` — if `.env` appears, DO NOT push. Simply use `git rm --cached .env`.
2.  **Sensitive Scripts**: All prototype logs and temporary scripts have been added to `.gitignore` automatically.

---

## 🏗️ Step 1: Push to GitHub (Public)

1. **Initialize Git** (if not already done):
   ```powershell
   git init
   ```
2. **Add Files**:
   ```powershell
   git add .
   ```
3. **Commit with Vertex Brand**:
   ```powershell
   git commit -m "feat: Vertex Airtight Security & Algorithmic Overhaul Final Delivery"
   ```
4. **Create Repository on GitHub**:
   - Go to [github.com/new](https://github.com/new)
   - Create a **Public** repository named `vertex-social-app`.
5. **Link and Push**:
   ```powershell
   # Replace <your-username> with your actual GitHub username
   git remote add origin https://github.com/<your-username>/vertex-social-app.git
   git branch -M main
   git push -u origin main
   ```

---

## 🚀 Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)
1.  **Login to Vercel**: [vercel.com](https://vercel.com)
2.  **Import Project**: Click "Add New" > "Project" and select your `vertex-social-app` repository.
3.  **Environment Variables**: 
    - Copy EVERY variable from your local `.env` and paste it into the **Environment Variables** section on Vercel.
    - **CRITICAL**: Ensure `NEXTAUTH_SECRET`, `NEO4J_URI`, and `CLOUDINARY_URL` are set correctly.
4.  **Deploy**: Click "Deploy" and wait for the "Vertex" build to finish.

### Option B: Via Vercel CLI
If you have the Vercel CLI installed:
```powershell
# 1. Start the link
vercel
# 2. Add secrets manually for security
vercel env add NEXTAUTH_SECRET <your-secret>
# 3. Final Deploy
vercel --prod
```

---

## 🔑 Post-Deployment: Admin Promotion
Once live, register your account at `https://your-app.vercel.app/register`. Then, to promote yourself to Admin, run this in your local terminal:

```powershell
# Replace 'YOUR_USER_ID' with the ID found in your profile URL
node -e "const { runWriteQuery } = require('./src/lib/neo4j'); runWriteQuery('MATCH (u:User {id: \"YOUR_USER_ID\"}) SET u.isAdmin = true, u.verified = true').then(() => console.log('Admin Promoted!'))"
```

---
**Vertex — Connect with Airtight Integrity.**
