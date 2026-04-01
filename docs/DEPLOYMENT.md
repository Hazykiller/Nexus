# Vertex Airtight Deployment Guide

Follow these steps to securely push the **Vertex** platform to a Public GitHub repository and deploy it to **Vercel** with maximum-security configurations.

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
   git commit -m "feat: Vertex Airtight Security & Performance Overhaul Final Delivery"
   ```
4. **Link and Push**:
   ```powershell
   # Replace <your-username> with your actual GitHub username
   git remote add origin https://github.com/<your-username>/vertex-social-app.git
   git branch -M main
   git push -u origin main
   ```

## 🚀 Step 2: Deploy to Vercel

1. **Login to Vercel**: [vercel.com](https://vercel.com)
2. **Import Project**: Click "Add New" > "Project" and select your repository.
3. **Environment Variables**: 
   - Copy EVERY variable from your local `.env`.
   - **CRITICAL**: Ensure `NEXTAUTH_SECRET`, `NEO4J_URI`, and `RESEND_API_KEY` are set correctly.
4. **Deploy**: Click "Deploy" and wait for the "Vertex" build to finish.

---
**Vertex — Connect with Airtight Integrity.**
