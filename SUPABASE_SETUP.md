# Supabase Setup Guide

To use the Cybercrime Reporting AI Assistant with Supabase, follow these steps:

## 1. Create Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create the complaints table
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  crime_type TEXT NOT NULL,
  description TEXT NOT NULL,
  suspect_info TEXT,
  transaction_id TEXT,
  incident_date TIMESTAMP WITH TIME ZONE,
  evidence_url TEXT,
  ocr_text TEXT,
  pdf_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
```

## 2. Create Storage Buckets

Go to **Storage** in your Supabase dashboard and create two **Public** buckets:

1.  **`evidence-images`**: For storing uploaded screenshot evidence.
2.  **`complaint-reports`**: For storing generated PDF reports.

Make sure these are set to **Public** so the frontend can download the evidence and reports directly.

## 3. Environment Variables

Update your `.env` file in the project root with your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-is-required-for-storage-uploads
```

> [!IMPORTANT]
> Use the **Service Role Key** (not the anon key) for `SUPABASE_SERVICE_KEY` to allow the backend to bypass RLS and upload files to storage.
