-- Profiles table to store user-specific business info
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  business_name text,
  full_name text,
  email text,
  cis_number text,
  vat_number text,
  trade_type text default 'electrician', -- 'electrician' or 'plumber'
  gas_safe_number text,
  niceic_number text,
  company_address text,
  company_phone text,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'trialing',
  trial_ends_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table profiles enable row level security;
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

-- Customers table
create table customers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  email text,
  phone text,
  address text,
  address_line1 text,
  address_line2 text,
  city text,
  postcode text,
  is_cis_contractor boolean default false,
  is_vat_registered boolean default false,
  site_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on customers
alter table customers enable row level security;
create policy "Users can manage their own customers" on customers for all using (auth.uid() = user_id);

-- Jobs table
create table jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  customer_id uuid references customers on delete cascade not null,
  title text not null,
  description text,
  status text check (status in ('draft', 'scheduled', 'completed', 'cancelled')) default 'draft',
  trade_type text, -- 'electrician' or 'plumber'
  site_address text,
  site_notes text,
  scheduled_date timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on jobs
alter table jobs enable row level security;
create policy "Users can manage their own jobs" on jobs for all using (auth.uid() = user_id);

-- Invoices table (also used for quotes / documents)
create table invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  job_id uuid references jobs on delete set null,
  customer_id uuid references customers on delete cascade not null,
  invoice_number text not null,
  type text check (type in ('quote', 'invoice')) default 'invoice',
  status text check (status in ('draft', 'sent', 'paid', 'overdue')) default 'draft',
  issue_date date default current_date,
  due_date date,
  vat_reverse_charge boolean default false,
  reverse_charge_wording text,
  cis_rate decimal(5,2) default 20.00, -- 20, 30, or 0
  labour_total decimal(10,2) default 0,
  materials_total decimal(10,2) default 0,
  cis_deduction_amount decimal(10,2) default 0,
  vat_amount decimal(10,2) default 0,
  net_total decimal(10,2) default 0,
  gross_total decimal(10,2) default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on invoices
alter table invoices enable row level security;
create policy "Users can manage their own invoices" on invoices for all using (auth.uid() = user_id);

-- Line Items table
create table line_items (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references invoices on delete cascade not null,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null,
  type text check (type in ('labour', 'materials')) not null,
  vat_rate numeric default 0.2, -- Standard UK VAT 20%
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on line_items
alter table line_items enable row level security;
create policy "Users can manage their own line items" on line_items for all 
using (exists (select 1 from invoices where invoices.id = line_items.invoice_id and invoices.user_id = auth.uid()));

-- Automatically update updated_at on change
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on profiles for each row execute procedure update_updated_at_column();
create trigger update_customers_updated_at before update on customers for each row execute procedure update_updated_at_column();
create trigger update_jobs_updated_at before update on jobs for each row execute procedure update_updated_at_column();
create trigger update_invoices_updated_at before update on invoices for each row execute procedure update_updated_at_column();
create trigger update_line_items_updated_at before update on line_items for each row execute procedure update_updated_at_column();

-- Profile trigger on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
