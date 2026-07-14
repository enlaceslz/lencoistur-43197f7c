export interface PartnerType {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
}

export interface Partner {
  id: string;
  name: string;
  type: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  commission_rate: number | null;
  active: boolean;
  cpf_cnpj: string | null;
  address: string | null;
  cnh: string | null;
  cnh_validade: string | null;
  cadastur: string | null;
  remuneration_type: string | null;
  remuneration_value: number | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  bank_pix_key: string | null;
  credit_limit: number | null;
  tags: string[] | null;
}

export const DEFAULT_PARTNER_TYPES: PartnerType[] = [
  { id: "1", name: "hotel", label: "Hotel/Pousada", icon: "Building2", color: "blue" },
  { id: "2", name: "guia", label: "Guia de Turismo", icon: "Compass", color: "green" },
  { id: "3", name: "motorista", label: "Motorista", icon: "Car", color: "amber" },
  { id: "4", name: "agencia", label: "Agência", icon: "Users", color: "purple" },
  { id: "5", name: "restaurante", label: "Restaurante", icon: "Utensils", color: "rose" },
];
