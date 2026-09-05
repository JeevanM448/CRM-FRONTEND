-- Shiny Stone Sales OS - Supabase Schema
-- Run this in your Supabase SQL editor

create extension if not exists "uuid-ossp";

create type user_role as enum ('admin', 'sales_manager', 'salesperson', 'viewer');
create type deal_stage as enum ('new', 'qualified', 'quotation', 'negotiation', 'won', 'lost');
create type entity_status as enum ('active', 'inactive', 'pending', 'completed', 'cancelled');
create type po_status as enum ('pending', 'received', 'approved', 'processing', 'completed', 'cancelled');

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  role user_role not null default 'salesperson',
  department text,
  avatar text,
  title text,
  status entity_status not null default 'active',
  last_active timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  industry text,
  location text,
  owner_id uuid references users(id),
  contact_name text,
  contact_email text,
  contact_phone text,
  revenue numeric default 0,
  status entity_status not null default 'active',
  last_activity timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  company_id uuid references customers(id) on delete cascade,
  designation text,
  email text,
  phone text,
  owner_id uuid references users(id),
  status entity_status not null default 'active',
  last_contact timestamptz,
  created_at timestamptz default now()
);

create table if not exists deals (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  customer_id uuid references customers(id) on delete cascade,
  owner_id uuid references users(id),
  value numeric not null default 0,
  stage deal_stage not null default 'new',
  probability integer default 0,
  expected_close date,
  last_activity timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  po_number text unique not null,
  customer_id uuid references customers(id),
  deal_id uuid references deals(id),
  amount numeric not null,
  po_date date,
  delivery_date date,
  status po_status not null default 'pending',
  owner_id uuid references users(id),
  created_at timestamptz default now()
);

create table if not exists follow_ups (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  customer_id uuid references customers(id),
  deal_id uuid references deals(id),
  due_date timestamptz not null,
  status text not null default 'upcoming',
  owner_id uuid references users(id),
  created_at timestamptz default now()
);

create table if not exists activities (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  title text not null,
  description text,
  entity_type text,
  entity_id uuid,
  created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table users enable row level security;
alter table customers enable row level security;
alter table contacts enable row level security;
alter table deals enable row level security;
alter table purchase_orders enable row level security;
alter table follow_ups enable row level security;
alter table activities enable row level security;

-- Example policies (customize based on auth setup)
-- create policy "Users can read own profile" on users for select using (auth.uid() = id);
