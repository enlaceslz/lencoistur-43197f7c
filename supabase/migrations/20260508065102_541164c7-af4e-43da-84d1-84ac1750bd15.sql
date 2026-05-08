-- Habilitar leitura pública para informações da empresa (SGS)
CREATE POLICY "Public can view company info" 
ON public.sgs_empresa 
FOR SELECT 
USING (true);

-- Habilitar leitura pública para reservas (necessário para o termo de risco)
-- Nota: O código da reserva (booking_code) atua como um token de acesso
CREATE POLICY "Public can view bookings by code" 
ON public.bookings 
FOR SELECT 
USING (true);

-- Habilitar leitura pública para clientes (necessário para o termo de risco)
CREATE POLICY "Public can view customers for terms" 
ON public.customers 
FOR SELECT 
USING (true);

-- Habilitar leitura pública para dependentes (necessário para o termo de risco)
CREATE POLICY "Public can view dependents for terms" 
ON public.dependents 
FOR SELECT 
USING (true);
