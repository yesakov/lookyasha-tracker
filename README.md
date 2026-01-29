# ⚽ Lookyasha Football Tracker

A premium, real-time web application for tracking football matches, goals, and assists within a group of friends or a small company.

## ✨ Features

- **🏆 Real-time Standings**: Instant table updates as matches finish, including Points, GD, GF, and GA.
- **👕 Professional Jersey Engine**: Hand-crafted SVG jerseys for 30+ European top clubs (Real Madrid, Barca, Dynamo Kyiv, etc.).
- **👥 Squad Manager**: Persistent player management. Create your group once and use them across multiple events.
- **👟 Advanced Stats**: Track not just scorers, but also assist leaders (Golden Boot & Assist King races).
- **🛠 Easy Editing**: Reopen matches, remove accidental goals, or delete scheduled games with a few clicks.
- **✨ Premium UI**: Responsive, mobile-first design with a dark glassmorphism aesthetic and smooth micro-animations.

## 🚀 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Backend/Database**: [Convex](https://www.convex.dev/) (Real-time Database)
- **Styling**: Vanilla CSS (Modern Design System)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🛠 Local Development

1. **Clone the repo**
2. **Install dependencies**: `npm install`
3. **Setup Convex**: Run `npx convex dev` (this will guide you through creating a free account and project)
4. **Run Next.js**: `npm run dev`

## 🌍 Deployment (Vercel + Convex)

1. **Push your code to GitHub**.
2. **Setup Convex Production**:
   - Go to the [Convex Dashboard](https://dashboard.convex.dev/).
   - Click on **Settings** -> **Deployment Keys**.
   - Copy the `CONVEX_DEPLOY_KEY`.
3. **Deploy to Vercel**:
   - Create a new project in Vercel and link your GitHub repo.
   - In the **Environment Variables** section, add:
     - `NEXT_PUBLIC_CONVEX_URL`: Your Convex production URL (found in Convex Dashboard -> Settings).
     - `CONVEX_DEPLOY_KEY`: The key you copied in the previous step.
   - Vercel will automatically build and deploy your app.
4. **Success!** Your app is now live with a real-time production database.

## 🛡 Security & Privacy

The following sensitive files are **never** committed to the public repository:
- `.env.local`: Contains your local Convex URL and keys.
- `.env.*.local`: Any local environment variations.

Make sure your `.gitignore` includes `.env*` to prevent accidental leaks.
