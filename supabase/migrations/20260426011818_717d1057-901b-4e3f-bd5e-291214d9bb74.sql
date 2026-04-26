ALTER TABLE public.sgs_risks DROP CONSTRAINT IF EXISTS sgs_risks_stage_check;
ALTER TABLE public.sgs_risks ADD CONSTRAINT sgs_risks_stage_check 
CHECK (stage = ANY (ARRAY[
  'venda_recepcao', 
  'trajeto_ida', 
  'passeio_dunas', 
  'travessia_rios', 
  'paradas', 
  'trajeto_volta', 
  'banho_lagoas', 
  'passeio_barco', 
  'trilhas', 
  'retorno', 
  'pos_passeio'
]));