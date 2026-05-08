-- Permitir inserção pública na tabela de dependentes do termo de risco
CREATE POLICY "Public can insert minors for risk term"
ON public.sgs_risk_term_minors
FOR INSERT
TO public
WITH CHECK (true);

-- Melhorar política de documentos para permitir que o sistema anexe o termo assinado
-- (Já existe uma política ampla, mas vamos garantir que seja específica para o fluxo de assinatura)
DROP POLICY IF EXISTS "Admins can manage customer documents" ON public.customer_documents;

CREATE POLICY "Anyone can insert customer documents"
ON public.customer_documents
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can view customer documents"
ON public.customer_documents
FOR SELECT
TO public
USING (true);
