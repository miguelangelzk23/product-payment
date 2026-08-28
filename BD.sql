-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public._prisma_migrations (
  id character varying NOT NULL,
  checksum character varying NOT NULL,
  finished_at timestamp with time zone,
  migration_name character varying NOT NULL,
  logs text,
  rolled_back_at timestamp with time zone,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_steps_count integer NOT NULL DEFAULT 0,
  CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.products (
  id uuid NOT NULL,
  name character varying NOT NULL,
  description text NOT NULL,
  price_in_cents integer NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.stocks (
  id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL,
  CONSTRAINT stocks_pkey PRIMARY KEY (id),
  CONSTRAINT stocks_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL,
  email character varying NOT NULL,
  full_name character varying NOT NULL,
  phone_number character varying NOT NULL,
  document_type USER-DEFINED NOT NULL,
  document_number character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL,
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL,
  reference character varying NOT NULL,
  customer_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  product_amount integer NOT NULL,
  base_fee integer NOT NULL,
  delivery_fee integer NOT NULL,
  total_amount integer NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::transaction_status,
  provider_transaction_id character varying,
  card_brand character varying,
  card_last_four character,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.deliveries (
  id uuid NOT NULL,
  transaction_id uuid NOT NULL,
  address_line character varying NOT NULL,
  city character varying NOT NULL,
  region character varying NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::delivery_status,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL,
  CONSTRAINT deliveries_pkey PRIMARY KEY (id),
  CONSTRAINT deliveries_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id)
);