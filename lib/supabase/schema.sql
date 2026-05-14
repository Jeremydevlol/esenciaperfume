-- ═══════════════════════════════════════════════════════════════════════
-- SECRETO DIGITAL — ERP Schema
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- Extensiones
create extension if not exists "uuid-ossp";

-- ───────────────────────────────────────────────────────────────────────
-- PRODUCTOS
-- ───────────────────────────────────────────────────────────────────────
create table if not exists products (
  id            uuid primary key default uuid_generate_v4(),
  sku           text unique not null,
  name          text not null,
  brand         text not null default '',
  category      text not null default '',
  subcategory   text default '',
  tipo          text default '',        -- EDP, EDT, Colonia, etc.
  ml            integer default 0,
  price         numeric(10,2) not null default 0,
  original_price numeric(10,2) default 0,
  discount_pct  integer default 0,
  cost_price    numeric(10,2) default 0,
  image_url     text default '',
  description   text default '',
  stock         integer not null default 0,
  min_stock     integer default 5,
  active        boolean default true,
  featured      boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_products_sku on products(sku);
create index idx_products_brand on products(brand);
create index idx_products_category on products(category);
create index idx_products_active on products(active);

-- ───────────────────────────────────────────────────────────────────────
-- CLIENTES
-- ───────────────────────────────────────────────────────────────────────
create table if not exists customers (
  id            uuid primary key default uuid_generate_v4(),
  email         text unique not null,
  first_name    text not null default '',
  last_name     text not null default '',
  phone         text default '',
  dni           text default '',
  address       jsonb default '{}',
  total_orders  integer default 0,
  total_spent   numeric(10,2) default 0,
  notes         text default '',
  tags          text[] default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_customers_email on customers(email);

-- ───────────────────────────────────────────────────────────────────────
-- PEDIDOS
-- ───────────────────────────────────────────────────────────────────────
create table if not exists orders (
  id              uuid primary key default uuid_generate_v4(),
  order_number    serial unique,
  customer_id     uuid references customers(id) on delete set null,
  status          text not null default 'pending'
                    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled','returned')),
  payment_method  text default ''
                    check (payment_method in ('','tpv','paypal','contrareembolso','transferencia')),
  payment_status  text default 'pending'
                    check (payment_status in ('pending','paid','failed','refunded')),
  subtotal        numeric(10,2) default 0,
  shipping_cost   numeric(10,2) default 0,
  tax_amount      numeric(10,2) default 0,
  discount_amount numeric(10,2) default 0,
  total           numeric(10,2) default 0,
  shipping_name   text default '',
  shipping_email  text default '',
  shipping_phone  text default '',
  shipping_address jsonb default '{}',
  billing_address  jsonb default '{}',
  notes           text default '',
  internal_notes  text default '',
  payment_ref     text default '',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_orders_customer on orders(customer_id);
create index idx_orders_status on orders(status);
create index idx_orders_created on orders(created_at desc);

-- ───────────────────────────────────────────────────────────────────────
-- LÍNEAS DE PEDIDO
-- ───────────────────────────────────────────────────────────────────────
create table if not exists order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  sku         text not null,
  name        text not null,
  quantity    integer not null default 1,
  unit_price  numeric(10,2) not null default 0,
  total       numeric(10,2) not null default 0,
  created_at  timestamptz default now()
);

create index idx_order_items_order on order_items(order_id);

-- ───────────────────────────────────────────────────────────────────────
-- PROVEEDORES
-- ───────────────────────────────────────────────────────────────────────
create table if not exists suppliers (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  contact_name  text default '',
  email         text default '',
  phone         text default '',
  address       text default '',
  website       text default '',
  payment_terms text default '',
  notes         text default '',
  active        boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ───────────────────────────────────────────────────────────────────────
-- ÓRDENES DE COMPRA (a proveedores)
-- ───────────────────────────────────────────────────────────────────────
create table if not exists purchase_orders (
  id            uuid primary key default uuid_generate_v4(),
  po_number     serial unique,
  supplier_id   uuid not null references suppliers(id) on delete cascade,
  status        text default 'draft'
                  check (status in ('draft','sent','partial','received','cancelled')),
  subtotal      numeric(10,2) default 0,
  tax_amount    numeric(10,2) default 0,
  total         numeric(10,2) default 0,
  notes         text default '',
  expected_date date,
  received_date date,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists purchase_order_items (
  id                uuid primary key default uuid_generate_v4(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  product_id        uuid references products(id) on delete set null,
  sku               text not null,
  name              text not null,
  quantity          integer not null default 1,
  received_qty      integer default 0,
  unit_cost         numeric(10,2) not null default 0,
  total             numeric(10,2) not null default 0,
  created_at        timestamptz default now()
);

-- ───────────────────────────────────────────────────────────────────────
-- FACTURAS
-- ───────────────────────────────────────────────────────────────────────
create table if not exists invoices (
  id              uuid primary key default uuid_generate_v4(),
  invoice_number  text unique not null,
  order_id        uuid references orders(id) on delete set null,
  customer_id     uuid references customers(id) on delete set null,
  status          text default 'draft'
                    check (status in ('draft','sent','paid','overdue','cancelled')),
  subtotal        numeric(10,2) default 0,
  tax_rate        numeric(5,2) default 21.00,
  tax_amount      numeric(10,2) default 0,
  total           numeric(10,2) default 0,
  due_date        date,
  paid_date       date,
  notes           text default '',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_invoices_order on invoices(order_id);
create index idx_invoices_customer on invoices(customer_id);

-- ───────────────────────────────────────────────────────────────────────
-- ENVÍOS
-- ───────────────────────────────────────────────────────────────────────
create table if not exists shipments (
  id                  uuid primary key default uuid_generate_v4(),
  order_id            uuid not null references orders(id) on delete cascade,
  tracking_number     text default '',
  carrier             text default '',
  status              text default 'pending'
                        check (status in ('pending','picked_up','in_transit','out_for_delivery','delivered','returned','failed')),
  weight_kg           numeric(6,2) default 0,
  estimated_delivery  date,
  shipped_at          timestamptz,
  delivered_at        timestamptz,
  notes               text default '',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index idx_shipments_order on shipments(order_id);
create index idx_shipments_status on shipments(status);

-- ───────────────────────────────────────────────────────────────────────
-- MOVIMIENTOS DE STOCK
-- ───────────────────────────────────────────────────────────────────────
create table if not exists stock_movements (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  type        text not null check (type in ('in','out','adjustment','return')),
  quantity    integer not null,
  prev_stock  integer default 0,
  new_stock   integer default 0,
  reference   text default '',
  notes       text default '',
  created_by  text default 'system',
  created_at  timestamptz default now()
);

create index idx_stock_movements_product on stock_movements(product_id);
create index idx_stock_movements_created on stock_movements(created_at desc);

-- ───────────────────────────────────────────────────────────────────────
-- LOG DE SINCRONIZACIÓN (con ERP de Marco)
-- ───────────────────────────────────────────────────────────────────────
create table if not exists sync_log (
  id            uuid primary key default uuid_generate_v4(),
  type          text not null,        -- 'products', 'stock', 'orders'
  status        text default 'success',
  inserted      integer default 0,
  updated       integer default 0,
  deactivated   integer default 0,
  errors        jsonb default '[]',
  duration_ms   integer default 0,
  created_at    timestamptz default now()
);

create index idx_sync_log_created on sync_log(created_at desc);

-- ───────────────────────────────────────────────────────────────────────
-- VISTAS ÚTILES
-- ───────────────────────────────────────────────────────────────────────

-- Productos con stock bajo
create or replace view low_stock_products as
  select * from products
  where active = true and stock <= min_stock
  order by stock asc;

-- Resumen de ventas diarias (últimos 30 días)
create or replace view daily_sales_summary as
  select
    date_trunc('day', o.created_at)::date as day,
    count(*)::integer as num_orders,
    coalesce(sum(o.total), 0) as revenue,
    coalesce(avg(o.total), 0) as avg_order_value
  from orders o
  where o.payment_status = 'paid'
    and o.created_at >= now() - interval '30 days'
  group by 1
  order by 1 desc;

-- Top productos vendidos
create or replace view top_selling_products as
  select
    oi.sku,
    oi.name,
    sum(oi.quantity)::integer as total_sold,
    sum(oi.total) as total_revenue
  from order_items oi
  join orders o on o.id = oi.order_id
  where o.payment_status = 'paid'
  group by oi.sku, oi.name
  order by total_sold desc
  limit 20;

-- ───────────────────────────────────────────────────────────────────────
-- FUNCIONES
-- ───────────────────────────────────────────────────────────────────────

-- Auto-actualizar updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers para updated_at
create trigger trg_products_updated before update on products
  for each row execute function update_updated_at();
create trigger trg_customers_updated before update on customers
  for each row execute function update_updated_at();
create trigger trg_orders_updated before update on orders
  for each row execute function update_updated_at();
create trigger trg_suppliers_updated before update on suppliers
  for each row execute function update_updated_at();
create trigger trg_purchase_orders_updated before update on purchase_orders
  for each row execute function update_updated_at();
create trigger trg_invoices_updated before update on invoices
  for each row execute function update_updated_at();
create trigger trg_shipments_updated before update on shipments
  for each row execute function update_updated_at();

-- Actualizar stock de producto al insertar movimiento
create or replace function update_product_stock()
returns trigger as $$
begin
  if new.type = 'in' or new.type = 'return' then
    update products set stock = stock + new.quantity where id = new.product_id;
  elsif new.type = 'out' then
    update products set stock = stock - new.quantity where id = new.product_id;
  elsif new.type = 'adjustment' then
    update products set stock = new.new_stock where id = new.product_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_stock_movement_after_insert after insert on stock_movements
  for each row execute function update_product_stock();

-- Actualizar totales del cliente tras pagar pedido
create or replace function update_customer_totals()
returns trigger as $$
begin
  if new.payment_status = 'paid' and (old.payment_status is null or old.payment_status <> 'paid') then
    update customers set
      total_orders = total_orders + 1,
      total_spent = total_spent + new.total
    where id = new.customer_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_order_paid after update on orders
  for each row execute function update_customer_totals();

-- ───────────────────────────────────────────────────────────────────────
-- RLS (Row Level Security) — desactivado para admin, activar según necesidad
-- ───────────────────────────────────────────────────────────────────────
-- alter table products enable row level security;
-- alter table orders enable row level security;
-- etc.
