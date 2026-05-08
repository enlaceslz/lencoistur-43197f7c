CREATE OR REPLACE FUNCTION public.handle_booking_financial_flow()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_partner_commission NUMERIC;
    v_collab_payment NUMERIC;
    v_item_name TEXT;
BEGIN
    -- Get item name for description
    v_item_name := COALESCE(NEW.item_name, 'Reserva');

    -- 1. Partner Logic (Receivables / Commission)
    -- If booking has a partner, it might represent a commission to receive or a full sale via partner
    IF NEW.partner_id IS NOT NULL THEN
        -- Check if partner has a specific commission rate
        SELECT commission_rate INTO v_partner_commission FROM public.partners WHERE id = NEW.partner_id;
        
        -- Logic: If it's a partner booking, we usually have a receivable from them
        -- We'll create a record in contas_receber for the total value if not paid, 
        -- or just track the commission if that's the business model.
        -- For now, let's track the total receivable from partner.
        INSERT INTO public.contas_receber (
            descricao,
            valor,
            vencimento,
            categoria,
            status,
            partner_id,
            cliente
        ) VALUES (
            'Reserva via Parceiro: ' || v_item_name || ' (' || NEW.booking_code || ')',
            NEW.final_total,
            COALESCE(NULLIF(NEW.date, '')::date, CURRENT_DATE),
            'Comissão/Parceria',
            CASE WHEN NEW.payment_status = 'pago' THEN 'recebido' ELSE 'pendente' END,
            NEW.partner_id,
            (SELECT name FROM public.partners WHERE id = NEW.partner_id)
        );
    END IF;

    -- 2. Collaborator Logic (Payables / Service Cost)
    -- If booking has a collaborator assigned (driver, guide, etc.)
    IF NEW.collaborator_id IS NOT NULL THEN
        -- Get collaborator payment info
        SELECT payment_value INTO v_collab_payment FROM public.collaborators WHERE id = NEW.collaborator_id;
        
        IF v_collab_payment > 0 THEN
            INSERT INTO public.contas_pagar (
                descricao,
                valor,
                vencimento,
                categoria,
                status,
                collaborator_id,
                fornecedor
            ) VALUES (
                'Serviço Colaborador: ' || v_item_name || ' (' || NEW.booking_code || ')',
                v_collab_payment,
                COALESCE(NULLIF(NEW.date, '')::date, CURRENT_DATE),
                'Mão de Obra',
                'pendente',
                NEW.collaborator_id,
                (SELECT name FROM public.collaborators WHERE id = NEW.collaborator_id)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;