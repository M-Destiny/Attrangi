import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const exampleProducts = [
  {
    name: "ATSB01",
    sku: "ATSB01",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 280,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATTX01",
    sku: "ATTX01",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 250,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATTX02",
    sku: "ATTX02",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 250,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATTX03",
    sku: "ATTX03",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 250,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATTX04",
    sku: "ATTX04",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 250,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATTX05",
    sku: "ATTX05",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 300,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATCT01",
    sku: "ATCT01",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 280,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATVGCT01",
    sku: "ATVGCT01",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 300,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATMV01",
    sku: "ATMV01",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 350,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATTX06",
    sku: "ATTX06",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 300,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATTX07",
    sku: "ATTX07",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 250,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATGB01",
    sku: "ATGB01",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 320,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATDS01",
    sku: "ATDS01",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 280,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATDS02",
    sku: "ATDS02",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 280,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATDS03",
    sku: "ATDS03",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 300,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATJK01",
    sku: "ATJK01",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 320,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATDB01",
    sku: "ATDB01",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 320,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATDB02",
    sku: "ATDB02",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 350,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATGD01",
    sku: "ATGD01",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 350,
    buying_price: 0,
    stock_level: 5
  },
  {
    name: "ATPM01",
    sku: "ATPM01",
    category: "Pins",
    brand: "Attrangii",
    selling_price: 280,
    buying_price: 0,
    stock_level: 5
  }
];

async function seedProducts() {
  console.log('Authenticating...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'Destiny@attrangi.com',
    password: 'attrangii123'
  });
  
  if (authError) {
    console.log('Login failed, trying to sign up...');
    const { error: signUpError } = await supabase.auth.signUp({
      email: 'Destiny@attrangi.com',
      password: 'attrangii123'
    });
    if (signUpError) {
      console.error('Failed to create account:', signUpError.message);
      return;
    }
    // Try to login again
    await supabase.auth.signInWithPassword({
      email: 'Destiny@attrangi.com',
      password: 'attrangii123'
    });
  }

  console.log('Checking Supabase products table...');
  const { data, error } = await supabase.from('products').select('id').limit(1);

  if (error) {
    console.error('Error checking products table. The schema might not be initialized: ', error.message);
    return;
  }

  console.log('Inserting example products...');
  for (const product of exampleProducts) {
    const { data: existing } = await supabase.from('products').select('id').eq('sku', product.sku).single();
    if (!existing) {
      const { error: insertError } = await supabase.from('products').insert([product]);
      if (insertError) {
         console.error('Error inserting product:', insertError.message);
      } else {
         console.log(`Inserted: ${product.name}`);
      }
    } else {
      const { error: updateError } = await supabase.from('products').update({ name: product.name }).eq('sku', product.sku);
      if (updateError) {
         console.error('Error updating product:', updateError.message);
      } else {
         console.log(`Updated: ${product.name}`);
      }
    }
  }
  console.log('Done!');
}

seedProducts();
