export interface SiblingInfo {
  id: string;
  name: string;
  grade?: string;
  class?: string;
  period?: string;
  birthDate?: string;
}

export interface AdditionalContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  whatsapp: string;
  sameWhatsapp: boolean;
}

export interface CampoModificadoEol {
  campo: string;
  valor: string;
  valorAnterior?: string;
  categoria?: string;
  acao?: 'alterado' | 'apagado' | 'adicionado';
}

export interface Student {
  id: string; // This will map to id_aluno
  name: string;
  class?: string;
  period?: string;
  birthDate?: string;
  gender?: string;
  race?: string;
  cpf?: string;
  rg?: string;
  rgDigit?: string;
  possuiCin?: boolean;
  guardianName?: string;
  guardianCpf?: string;
  guardianPhone?: string;
  guardianWhatsapp?: string;
  guardianEmail?: string;
  motherName?: string;
  motherCpf?: string;
  motherPhone?: string;
  motherWhatsapp?: string;
  motherEmail?: string;
  fatherName?: string;
  fatherCpf?: string;
  fatherPhone?: string;
  fatherWhatsapp?: string;
  fatherEmail?: string;
  additionalContacts?: AdditionalContact[];
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  healthInfo?: string;
  status?: 'pending' | 'completed';
  lastUpdated?: string;
  id_familia?: string | null;
  siblings?: SiblingInfo[];
}
