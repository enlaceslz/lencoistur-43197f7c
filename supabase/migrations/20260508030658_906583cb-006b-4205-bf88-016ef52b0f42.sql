-- Ensure columns exist in financial tables
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contas_receber' AND COLUMN_NAME = 'partner_id') THEN
        ALTER TABLE public.contas_receber ADD COLUMN partner_id UUID REFERENCES public.partners(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contas_pagar' AND COLUMN_NAME = 'collaborator_id') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN collaborator_id UUID REFERENCES public.collaborators(id);
    END IF;
END $$;

-- Function to handle financial entries from bookings
CREATE OR REPLACE FUNCTION public.handle_booking_financial_flow()
RETURNS TRIGGER AS $$
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
            COALESCE(NEW.date, CURRENT_DATE),
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
                COALESCE(NEW.date, CURRENT_DATE),
                'Mão de Obra',
                'pendente',
                NEW.collaborator_id,
                (SELECT name FROM public.collaborators WHERE id = NEW.collaborator_id)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for bookings
DROP TRIGGER IF EXISTS on_booking_financial_flow ON public.bookings;
CREATE TRIGGER on_booking_financial_flow
AFTER INSERT OR UPDATE OF status, payment_status, partner_id, collaborator_id ON public.bookings
FOR EACH ROW
WHEN (NEW.status != 'cancelada')
EXECUTE FUNCTION public.handle_booking_financial_flow();
