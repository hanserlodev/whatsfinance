create table if not exists users (
  id integer primary key autoincrement,
  whatsapp_number text unique not null,
  created_at text default (datetime('now'))
);

create table if not exists categories (
  id integer primary key autoincrement,
  user_id integer references users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('gasto', 'ingreso')),
  created_at text default (datetime('now'))
);

create table if not exists transactions (
  id integer primary key autoincrement,
  user_id integer references users(id) on delete cascade,
  category_id integer references categories(id),
  type text not null check (type in ('gasto', 'ingreso')),
  amount real not null,
  description text,
  raw_message text,
  occurred_at text not null default (date('now')),
  created_at text default (datetime('now'))
);

create table if not exists savings_goals (
  id integer primary key autoincrement,
  user_id integer references users(id) on delete cascade,
  name text not null,
  target_amount real not null,
  current_amount real default 0,
  target_date text,
  created_at text default (datetime('now'))
);