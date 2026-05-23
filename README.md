# Attrangii CRM

A modern, premium Executive Enterprise Portal and CRM built for Attrangii to streamline inventory management, track invoices, and monitor sales analytics.

## ✨ Features

- **Dynamic Dashboard**: Real-time insights including Month-to-Date (MTD) sales, a dynamic monthly revenue chart, top-selling products, and low stock alerts.
- **Time-Aware Greeting Engine**: Displays dynamic time-of-day greetings ("Morning", "Afternoon", or "Evening") based on local system time.
- **Comprehensive Reports & Performance Analytics View**: Dedicated interactive dashboard displaying key sales insights:
  - **Category Split**: Visualizes total inventory stock value distribution across categories (**Jewelry**, **Accessories**, **Apparel**).
  - **Member Collections**: Displays total revenue collected per team member (**MEHUL**, **SIMARPREET**, **DALBIR**).
  - **Outstanding Balance Breakdown**: Multi-segment visual comparison showing Paid vs. Pending outstanding revenues.
- **Advanced Dynamic Multi-Filter Controls**: Filter dashboard statistics and reports instantly by date range presets ("This Month", "Last 30 Days", "Last 6 Months", "All Time"), Custom Date Ranges (with start and end date calendars), and team members.
- **Fixed Stretched Layouts & Phone Compatibility**: Responsive CSS layout adjustments utilizing custom viewport utility classes (`md:w-auto`, `md:w-44`, `md:w-40`) ensuring filter widgets size compactly on desktops while scaling beautifully on mobile screens.
- **Interactive Revenue Momentum Chart**: Dynamic, actual-data-driven bar chart rendering based on real monthly billing statistics.
- **Inventory Management**: Add, view, and track product stock levels, SKUs, and pricing.
- **Comprehensive Invoice Lifecycle (Create, Edit, Delete)**:
  - **Smart Invoice Generation**: Searchable dropdowns for quick product selection, automated billing formulas, and instant draft updates.
  - **Full Edit Mode**: Re-populate invoice forms, modify items, quantities, client info, tax, or discounts, and persist changes directly to the database.
  - **Safe Deletion Mode**: Delete invoices securely with cascading cleanup in database records.
- **Inventory Sync & Stock Safeguards**:
  - **Automatic Stock Deductions**: Deducts item stock levels immediately upon new invoice creation.
  - **Stock Restorations on Update/Delete**: Automatically restores previous stock allocations back to active inventory when an invoice is edited or deleted.
  - **Intelligent Stock Validation**: Factoring in already-allocated quantities when validating stock levels during updates, ensuring users are never blocked by their own invoice's stock allocation.
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
