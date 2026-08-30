CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('user','agent','admin')),
  telegram_id BIGINT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  display_name TEXT NOT NULL DEFAULT '',
  mobile_number TEXT,
  avatar_url TEXT,
  completed_trades INTEGER NOT NULL DEFAULT 0,
  success_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  blocked BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('ATM QR','YONO Cash')),
  rate NUMERIC(12,2) NOT NULL CHECK (rate > 0),
  min_inr NUMERIC(14,2) NOT NULL CHECK (min_inr > 0),
  max_inr NUMERIC(14,2) NOT NULL,
  available_usdt NUMERIC(18,6) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (max_inr >= min_inr)
);

CREATE TABLE IF NOT EXISTS trade_orders (
  id UUID PRIMARY KEY,
  public_number BIGSERIAL UNIQUE,
  offer_id UUID NOT NULL REFERENCES offers(id),
  user_id UUID NOT NULL REFERENCES accounts(id),
  agent_id UUID NOT NULL REFERENCES accounts(id),
  side TEXT NOT NULL DEFAULT 'buy' CHECK (side IN ('buy','sell')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('ATM QR','YONO Cash')),
  amount_inr NUMERIC(14,2) NOT NULL CHECK (amount_inr > 0),
  rate NUMERIC(12,2) NOT NULL CHECK (rate > 0),
  amount_usdt NUMERIC(18,6) NOT NULL CHECK (amount_usdt > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','completed')),
  cancelled_by UUID REFERENCES accounts(id),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_blocks (
  agent_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (agent_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES accounts(id),
  kind TEXT NOT NULL DEFAULT 'text' CHECK (kind IN ('text','image','system')),
  body TEXT,
  image_id UUID,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','delivered','seen')),
  delivered_at TIMESTAMPTZ,
  seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (body IS NOT NULL OR image_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  content BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hero_banners (
  id UUID PRIMARY KEY,
  image_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sell_posts (
  id UUID PRIMARY KEY,
  message TEXT NOT NULL,
  price TEXT NOT NULL,
  link TEXT NOT NULL,
  image_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS offers_active_idx ON offers(active, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_user_idx ON trade_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_agent_idx ON trade_orders(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_order_idx ON messages(order_id, created_at);
CREATE INDEX IF NOT EXISTS orders_cleanup_idx ON trade_orders(closed_at) WHERE closed_at IS NOT NULL;
