-- Adiciona coluna de anexo nas tabelas financeiras
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS anexo_url TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS anexo_url TEXT;

-- Cria bucket de storage se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('financeiro', 'financeiro', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket financeiro
CREATE POLICY "Acesso público aos anexos financeiros"
ON storage.objects FOR SELECT
USING (bucket_id = 'financeiro');

CREATE POLICY "Usuários autenticados podem fazer upload de anexos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'financeiro' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar anexos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'financeiro' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar anexos"
ON storage.objects FOR DELETE
USING (bucket_id = 'financeiro' AND auth.role() = 'authenticated');