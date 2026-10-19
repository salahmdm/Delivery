create extension if not exists pgcrypto;
create table workers(id uuid primary key default gen_random_uuid(), name text unique not null, pin text not null, role text default 'worker', rate_type text default 'paper', rate numeric default 0);
create table routes(id uuid primary key default gen_random_uuid(), name text not null, price_per_paper numeric default 0, flat_month numeric default 0, fuel numeric default 0, taxes numeric default 0, vehicle numeric default 0, other numeric default 0);
create table declarations(id uuid primary key default gen_random_uuid(), worker_id uuid references workers on delete cascade, route_id uuid references routes on delete cascade, day date not null, count int not null, note text, status text default 'pending');
alter table workers enable row level security; alter table routes enable row level security; alter table declarations enable row level security;
create policy a on workers for all using(true) with check(true);
create policy a on routes for all using(true) with check(true);
create policy a on declarations for all using(true) with check(true);
insert into workers(name,pin,role) values('Patron','1234','admin');
