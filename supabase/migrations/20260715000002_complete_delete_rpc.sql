-- Atomic complete_booking and delete_booking operations.
-- All functions use SECURITY DEFINER (see sibling migration).

-- ============================================================
-- complete_booking_transaction(p_booking_id)
--   Marks booking "concluida", creates collaborator commission
--   (if applicable) or operational cost contas_pagar.
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_booking_transaction(
  p_booking_id UUID
)
RETURNS bookings
LANGUAGE plpgsql SECURITY DEFINER
SET statement_timeout = '30s'
AS $$
DECLARE
  v_booking bookings;
  v_collab  collaborators;
  v_commission_amount INT;
  v_description TEXT;
  v_amount NUMERIC;
BEGIN
  -- Lock and fetch booking
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  -- Update status
  UPDATE bookings SET status = 'concluida', updated_at = now()
  WHERE id = p_booking_id;

  -- Handle collaborator commission or operational cost
  IF v_booking.collaborator_id IS NOT NULL THEN
    SELECT * INTO v_collab
    FROM collaborators
    WHERE id = v_booking.collaborator_id;

    IF FOUND THEN
      IF v_collab.payment_type = 'commission' THEN
        v_commission_amount := round((v_booking.final_total * v_collab.payment_value) / 100);
      ELSIF v_collab.payment_type IN ('per_tour', 'daily') THEN
        v_commission_amount := v_collab.payment_value * 100;
      ELSE
        v_commission_amount := 0;
      END IF;

      IF v_commission_amount > 0 THEN
        v_description := 'Comissão/Pagamento: ' || v_booking.item_name || ' (Reserva ' || v_booking.booking_code || ')';
        v_amount := v_commission_amount / 100.0;

        INSERT INTO collaborator_payments
          (collaborator_id, booking_id, amount, description, due_date, status)
        VALUES
          (v_collab.id, p_booking_id, v_amount, v_description, CURRENT_DATE, 'pending');

        INSERT INTO contas_pagar
          (descricao, valor, vencimento, status, categoria, fornecedor,
           booking_id, collaborator_id,
           observacoes)
        VALUES
          ('Colaborador: ' || v_collab.name || ' - ' || v_description,
           v_amount, CURRENT_DATE, 'pendente', 'comissão', v_collab.name,
           p_booking_id, v_collab.id,
           'Gerado automaticamente na conclusão da reserva ' || v_booking.booking_code);
      END IF;
    END IF;
  ELSE
    INSERT INTO contas_pagar
      (descricao, valor, vencimento, status, categoria, fornecedor,
       booking_id,
       observacoes)
    VALUES
      ('Custo Operacional: ' || v_booking.item_name || ' (Reserva ' || v_booking.booking_code || ')',
       round(v_booking.final_total * 0.4) / 100.0,
       CURRENT_DATE, 'pendente', 'operacional', 'Operação Interna',
       p_booking_id,
       'Gerado automaticamente na conclusão da reserva ' || v_booking.booking_code);
  END IF;

  RETURN v_booking;
END;
$$;

-- ============================================================
-- delete_booking_transaction(p_booking_id, p_group_id)
--   Deletes booking(s) and all related financial records.
--   Handles both single and group deletions atomically.
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_booking_transaction(
  p_booking_id UUID DEFAULT NULL,
  p_group_id    UUID DEFAULT NULL
)
RETURNS VOID
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

  -- Delete financial records (must precede booking delete for non-cascade FKs)
  DELETE FROM contas_receber WHERE booking_id = ANY(v_booking_ids);
  DELETE FROM contas_pagar WHERE booking_id = ANY(v_booking_ids);
  DELETE FROM collaborator_payments WHERE booking_id = ANY(v_booking_ids);

  -- Delete bookings (cascade handles sgs_risk_terms, etc.)
  DELETE FROM bookings WHERE id = ANY(v_booking_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_booking_transaction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_booking_transaction(UUID, UUID) TO authenticated;
