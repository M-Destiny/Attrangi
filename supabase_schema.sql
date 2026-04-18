-- Attrangii CRM - Supabase Schema

-- Tables: products, invoices, customers, suppliers

-- 1. Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  serial_number TEXT,
  category TEXT,
  brand TEXT,
  buying_price NUMERIC(10, 2) DEFAULT 0,
  selling_price NUMERIC(10, 2) DEFAULT 0,
  stock_level INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  image_url TEXT,
  supplier_id UUID REFERENCES suppliers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(10, 2) DEFAULT 0,
  tax_rate NUMERIC(5, 2) DEFAULT 18.00,
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'unpaid', -- unpaid, paid, partially_paid, overdue, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Invoice Items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  description TEXT,
  quantity INT DEFAULT 1,
  unit_price NUMERIC(10, 2) DEFAULT 0,
  total_price NUMERIC(10, 2) DEFAULT 0
);

-- Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Basic policy: Allow authenticated access (simplified for demo, should be per-org/user in production)
CREATE POLICY "Allow all to authenticated" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON invoice_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Permit all on customers" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Permit all on suppliers" ON suppliers FOR ALL TO authenticated USING (true);

-- 6. User Profiles (Linked to Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'staff',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
