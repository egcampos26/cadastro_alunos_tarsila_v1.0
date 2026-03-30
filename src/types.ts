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
}
