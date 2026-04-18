# Attrangii CRM

A modern, premium Executive Enterprise Portal and CRM built for Attrangii to streamline inventory management, track invoices, and monitor sales analytics.

## ✨ Features

- **Dynamic Dashboard**: Real-time insights including Month-to-Date (MTD) sales, a 6-month revenue chart, top-selling products, and low stock alerts.
- **Inventory Management**: Add, view, and track product stock levels, SKUs, and pricing.
- **Smart Invoice Generation**: 
  - Searchable dropdowns for quick product selection.
  - Automatic stock deduction upon invoice creation.
  - Out-of-stock warnings with override capabilities.
- **Professional PDF Export**: Generate clean, dynamic, and professional tax invoices for clients directly from the portal.
- **Payment Tracking**: Track which team member (Mehul, Simarpreet, or Dalbir) received payments for paid invoices.
- **Real-time Database**: Powered by Supabase for instant data synchronization and secure authentication.

## 🛠️ Tech Stack

- **Frontend**: Vite + Vanilla JS (with React-like state management)
- **Styling**: Tailwind CSS
- **Backend & Database**: Supabase (PostgreSQL)

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine. You will also need a Supabase project.

### 1. Clone the repository
```bash
git clone https://github.com/M-Destiny/Attrangi.git
cd Attrangi
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory using the provided `.env.example` as a template:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Seeding (Optional)
If you are setting up a fresh Supabase project, you can seed the database with the initial product inventory using the provided seed script:
```bash
npx tsx check-and-seed.ts
```

### 5. Start the Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## 📦 Deployment

This project is fully configured for deployment on [Vercel](https://vercel.com).
1. Import the repository into Vercel.
2. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Vercel Environment Variables settings.
3. Deploy!

## 📄 License
This project is proprietary and built specifically for Attrangii.
