# Attrangii CRM - Supabase Initialization

To make your CRM fully operational, follow these 2 simple steps:

### Step 1: Run the Database Schema
1. Go to your [Supabase Dashboard](https://app.supabase.com/).
2. Select your project.
3. Click on **SQL Editor** in the sidebar.
4. Click **New query**.
5. Copy and paste the entire content of `supabase_schema.sql` (located in your project root) into the editor.
6. Click **Run**.

### Step 2: Seed Initial Users
1. Open your app.
2. If you aren't logged in, you will see a **"Seed Initial Users"** button on the login screen.
3. Click it. It will create these 3 accounts:
   - **Admin:** `admin@attrangii.com`
   - **Manager:** `manager@attrangii.com`
   - **Sales:** `sales@attrangii.com`
   - **Password:** `attrangii123` (for all)

### That's it!
Your premium CRM is now ready with INR currency and executive dark mode.
