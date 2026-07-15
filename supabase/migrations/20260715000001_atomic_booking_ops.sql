-- Atomic booking operations with transaction safety.
-- All functions use SECURITY DEFINER so the caller only needs
-- EXECUTE privilege; row-level-security is bypassed intentionally
-- for internal bookkeeping.  ponytail: if multi-tenant RLS is ever
-- needed, these functions must accept tenant_id and filter by it.

-- ============================================================
-- confirm_payment_transaction(p_booking_id, p_group_id)
--   Updates booking(s) to confirmed/paid and inserts
--   contas_receber rows in a single transaction.  Skips
--   contas_receber rows that already exist for the booking(s)
--   to prevent duplicates on concurrent calls.
-- ============================================================
CREATE OR REPLACE FUNCTION public.confirm_payment_transaction(
  p_booking_id UUID DEFAULT NULL,
  p_group_id    UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID, booking_code TEXT, customer_id UUID, type TEXT,
  item_name TEXT, date TEXT, guests INT, unit_price INT,
  total INT, discount INT, final_total INT, pay_method TEXT,
  status TEXT, payment_status TEXT, pix_code TEXT, notes TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  invoice_number TEXT, invoice_issued BOOLEAN, receipt_issued BOOLEAN,
  invoice_url TEXT, voucher_url TEXT, user_id UUID,
  collaborator_id UUID, marketing_campaign_id UUID, partner_id UUID,
  public_total INT, public_unit_price INT, partner_net_price NUMERIC,
  birth_date DATE, cpf TEXT, group_id UUID
)
LANGUAGE plpgsql SECURITY DEFINER
SET statement_timeout = '30s'
AS $$
DECLARE
  v_booking_ids UUID[];
BEGIN
  -- Resolve target booking IDs
  IF p_group_id IS NOT NULL THEN
    SELECT array_agg(b.id) INTO v_booking_ids
    FROM bookings b
    WHERE b.group_id = p_group_id;
  ELSIF p_booking_id IS NOT NULL THEN
    v_booking_ids := ARRAY[p_booking_id];
  ELSE
    RAISE EXCEPTION 'p_booking_id or p_group_id required';
  END IF;

  -- Update status
  UPDATE bookings
  SET status = 'confirmada', payment_status = 'pago', updated_at = now()
  WHERE id = ANY(v_booking_ids);

  -- Insert contas_receber (skip existing)
  INSERT INTO contas_receber
    (descricao, valor, vencimento, status, categoria, cliente,
     booking_id, partner_id, recebido_em, observacoes)
  SELECT
    'Reserva ' || b.booking_code || ' - ' || b.item_name,
    b.final_total,
    COALESCE(NULLIF(b.date, '')::date, CURRENT_DATE),
    'recebido',
    CASE WHEN b.partner_id IS NOT NULL THEN 'parceiro' ELSE 'reserva' END,
    COALESCE(c.name, 'Cliente'),
    b.id,
    b.partner_id,
    CURRENT_DATE,
    'Gerado automaticamente via CRM (Reserva ' || b.booking_code || ')' ||
      CASE WHEN b.partner_id IS NOT NULL THEN ' - Venda via Parceiro' ELSE '' END
  FROM bookings b
  LEFT JOIN customers c ON c.id = b.customer_id
  WHERE b.id = ANY(v_booking_ids)
    AND NOT EXISTS (SELECT 1 FROM contas_receber cr WHERE cr.booking_id = b.id);

  -- Return updated rows
  RETURN QUERY
  SELECT b.* FROM bookings b WHERE b.id = ANY(v_booking_ids);
END;
$$;

-- ============================================================
-- cancel_booking_transaction(p_booking_id, p_group_id)
--   Marks booking(s) as cancelled and updates related
--   contas_receber in one atomic operation.
-- ============================================================
CREATE OR REPLACE FUNCTION public.cancel_booking_transaction(
  p_booking_id UUID DEFAULT NULL,
  p_group_id    UUID DEFAULT NULL
)
RETURNS TABLE (LIKE bookings)
LANGUAGE plpgsql SECURITY DEFINER
SET statement_timeout = '30s'
AS $$
DECLARE
  v_booking_ids UUID[];
BEGIN
  IF p_group_id IS NOT NULL THEN
    SELECT array_agg(id) INTO v_booking_ids FROM bookings WHERE group_id = p_group_id;
  ELSIF p_booking_id IS NOT NULL THEN
    v_booking_ids := ARRAY[p_booking_id];
  ELSE
    RAISE EXCEPTION 'p_booking_id or p_group_id required';
  END IF;

  UPDATE bookings
  SET status = 'cancelada', payment_status = 'pendente', updated_at = now()
  WHERE id = ANY(v_booking_ids);

  UPDATE contas_receber
  SET status = 'cancelado',
      observacoes = 'Reserva cancelada via CRM',
      updated_at = now()
  WHERE booking_id = ANY(v_booking_ids);

  RETURN QUERY
  SELECT b.* FROM bookings b WHERE b.id = ANY(v_booking_ids);
END;
$$;

-- ============================================================
-- update_booking_customer_transaction(p_booking_id, p_customer_id,
--   p_customer_data JSONB, p_items JSONB, p_companions JSONB)
--   Updates customer record, synchronises booking items
--   (insert/update/delete), and inserts companions, all in a
--   single transaction.  Returns the affected booking rows.
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_booking_customer_transaction(
  p_booking_id   UUID,
  p_customer_id  UUID,
  p_customer_data JSONB,
  p_items        JSONB,     -- array of item objects
  p_companions   JSONB      -- array of companion objects
)
RETURNS TABLE (LIKE bookings)
LANGUAGE plpgsql SECURITY DEFINER
SET statement_timeout = '30s'
AS $$
DECLARE
  v_group_id UUID;
  v_item     JSONB;
  v_booking_ids UUID[];
BEGIN
  -- 1. Update customer
  UPDATE customers
  SET
    name       = COALESCE(p_customer_data->>'customerName', name),
    email      = COALESCE(p_customer_data->>'customerEmail', email),
    phone      = COALESCE(p_customer_data->>'customerPhone', phone),
    cpf        = COALESCE(p_customer_data->>'cpf', cpf),
    passport   = COALESCE(p_customer_data->>'passport', passport),
    country    = COALESCE(p_customer_data->>'country', country),
    birth_date = COALESCE((p_customer_data->>'birthDate')::date, birth_date)
  WHERE id = p_customer_id;

  -- 2. Determine group_id from current booking
  SELECT b.group_id INTO v_group_id FROM bookings b WHERE b.id = p_booking_id;

  -- 3. Process items
  IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' THEN

    -- Collect all booking IDs in the same group
    IF v_group_id IS NOT NULL THEN
      SELECT array_agg(b2.id) INTO v_booking_ids
      FROM bookings b2 WHERE b2.group_id = v_group_id;
    ELSE
      v_booking_ids := ARRAY[p_booking_id];
    END IF;

    -- Delete items no longer present
    IF v_group_id IS NOT NULL THEN
      DELETE FROM bookings
      WHERE group_id = v_group_id
        AND id NOT IN (
          SELECT value->>'id' FROM jsonb_array_elements(p_items) AS v(value)
          WHERE value->>'id' IS NOT NULL AND length(value->>'id') > 20
        )
        AND id <> ALL (ARRAY(SELECT value->>'id' FROM jsonb_array_elements(p_items) AS v1(value) WHERE v1.value->>'id' IS NOT NULL AND length(v1.value->>'id') > 20));
    END IF;

    -- Insert or update each item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      IF v_item->>'id' IS NULL OR length(v_item->>'id') < 20 THEN
        -- New item
        INSERT INTO bookings (
          booking_code, customer_id, type, item_name, date, guests,
          pay_method, unit_price, total, discount, final_total,
          public_unit_price, public_total, partner_net_price,
          notes, collaborator_id, partner_id, birth_date, cpf,
          group_id, status, payment_status, pix_code, created_at, updated_at
        ) VALUES (
          'RES-' || EXTRACT(YEAR FROM now())::text || '-' ||
            LPAD(floor(random()*9999+1)::text, 4, '0'),
          p_customer_id,
          v_item->>'type',
          v_item->>'itemName',
          v_item->>'date',
          (v_item->>'guests')::int,
          COALESCE(p_customer_data->>'payMethod', 'pix'),
          (v_item->>'unitPrice')::int,
          CASE WHEN v_item->>'itemName' LIKE '%(Privativo)%'
            THEN (v_item->>'unitPrice')::int
            ELSE (v_item->>'unitPrice')::int * (v_item->>'guests')::int END,
          COALESCE((v_item->>'discount')::int, 0),
          (CASE WHEN v_item->>'itemName' LIKE '%(Privativo)%'
            THEN (v_item->>'unitPrice')::int
            ELSE (v_item->>'unitPrice')::int * (v_item->>'guests')::int END)
            - COALESCE((v_item->>'discount')::int, 0),
          (v_item->>'publicUnitPrice')::int,
          CASE WHEN v_item->>'itemName' LIKE '%(Privativo)%'
            THEN (v_item->>'publicUnitPrice')::int
            ELSE (v_item->>'publicUnitPrice')::int * (v_item->>'guests')::int END,
          (v_item->>'partnerNetPrice')::numeric,
          p_customer_data->>'notes',
          CASE WHEN p_customer_data->>'collaboratorId' = 'none' THEN NULL
               ELSE p_customer_data->>'collaboratorId' END,
          CASE WHEN p_customer_data->>'partnerId' = 'none' THEN NULL
               ELSE p_customer_data->>'partnerId' END,
          (p_customer_data->>'birthDate')::date,
          p_customer_data->>'cpf',
          COALESCE(v_group_id, gen_random_uuid()),
          'pendente', 'pendente', NULL, now(), now()
        );
      ELSE
        -- Update existing item
        UPDATE bookings SET
          type              = v_item->>'type',
          item_name         = v_item->>'itemName',
          date              = v_item->>'date',
          guests            = (v_item->>'guests')::int,
          unit_price        = (v_item->>'unitPrice')::int,
          total             = CASE WHEN v_item->>'itemName' LIKE '%(Privativo)%'
                                THEN (v_item->>'unitPrice')::int
                                ELSE (v_item->>'unitPrice')::int * (v_item->>'guests')::int END,
          discount          = COALESCE((v_item->>'discount')::int, 0),
          final_total       = (CASE WHEN v_item->>'itemName' LIKE '%(Privativo)%'
                                THEN (v_item->>'unitPrice')::int
                                ELSE (v_item->>'unitPrice')::int * (v_item->>'guests')::int END)
                              - COALESCE((v_item->>'discount')::int, 0),
          public_unit_price = (v_item->>'publicUnitPrice')::int,
          public_total      = CASE WHEN v_item->>'itemName' LIKE '%(Privativo)%'
                                THEN (v_item->>'publicUnitPrice')::int
                                ELSE (v_item->>'publicUnitPrice')::int * (v_item->>'guests')::int END,
          partner_net_price = (v_item->>'partnerNetPrice')::numeric,
          notes             = p_customer_data->>'notes',
          collaborator_id   = CASE WHEN p_customer_data->>'collaboratorId' = 'none'
                                THEN NULL ELSE p_customer_data->>'collaboratorId' END,
          partner_id        = CASE WHEN p_customer_data->>'partnerId' = 'none'
                                THEN NULL ELSE p_customer_data->>'partnerId' END,
          updated_at        = now()
        WHERE id = (v_item->>'id')::uuid;
      END IF;
    END LOOP;
  END IF;

  -- 4. Insert companions (dependents)
  IF p_companions IS NOT NULL AND jsonb_typeof(p_companions) = 'array' THEN
    INSERT INTO dependents (customer_id, name, cpf, birth_date, relationship)
    SELECT
      p_customer_id,
      v.value->>'name',
      v.value->>'cpf',
      (v.value->>'birthDate')::date,
      COALESCE(v.value->>'relationship', 'Acompanhante')
    FROM jsonb_array_elements(p_companions) AS v(value)
    WHERE v.value->>'name' IS NOT NULL AND v.value->>'name' != '';
  END IF;

  -- Return affected bookings
  RETURN QUERY
  SELECT b2.* FROM bookings b2
  WHERE b2.id = p_booking_id
     OR (v_group_id IS NOT NULL AND b2.group_id = v_group_id);
END;
$$;

-- ============================================================
-- mark_term_signed_transaction(p_booking_id)
--   Upserts an sgs_risk_terms row for the given booking.
--   Safe against concurrent calls via unique constraint on
--   booking_id (added below).
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_term_signed_transaction(
  p_booking_id UUID
)
RETURNS sgs_risk_terms
LANGUAGE plpgsql SECURITY DEFINER
SET statement_timeout = '30s'
AS $$
DECLARE
  v_customer_name TEXT;
  v_phone         TEXT;
  v_tour_name     TEXT;
  v_customer_id   UUID;
  v_term          sgs_risk_terms;
BEGIN
  SELECT c.name, c.phone, b.item_name, b.customer_id
    INTO v_customer_name, v_phone, v_tour_name, v_customer_id
  FROM bookings b
  LEFT JOIN customers c ON c.id = b.customer_id
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  INSERT INTO sgs_risk_terms
    (booking_id, customer_id, customer_name, phone, tour_name,
     accepted, signed_at_counter, signed_at, term_date,
     risks_informed, cancellation_policy)
  VALUES
    (p_booking_id, v_customer_id, v_customer_name, v_phone, v_tour_name,
     true, true, now(), CURRENT_DATE,
     ARRAY[]::text[], '')
  ON CONFLICT (booking_id) DO UPDATE SET
    accepted          = true,
    signed_at_counter = true,
    signed_at         = now()
  RETURNING * INTO v_term;

  RETURN v_term;
END;
$$;

-- ============================================================
-- Add unique constraint on sgs_risk_terms.booking_id to
-- prevent duplicates and enable ON CONFLICT upsert above.
-- No duplicates exist in current data (verified).
-- ============================================================
ALTER TABLE public.sgs_risk_terms
  ADD CONSTRAINT sgs_risk_terms_booking_id_unique
  UNIQUE (booking_id);

-- Grant execute to anon, authenticated (as needed by the app)
GRANT EXECUTE ON FUNCTION public.confirm_payment_transaction(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking_transaction(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_booking_customer_transaction(UUID, UUID, JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_term_signed_transaction(UUID) TO anon, authenticated;
