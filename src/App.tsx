import React, { useState, useEffect, FormEvent, Component, ErrorInfo, ReactNode } from 'react';
import logoEmef from './assets/logo-emef.png';
import { supabase } from './lib/supabase';
import { Student, SiblingInfo, AdditionalContact, CampoModificadoEol } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, User, Users, Phone, Mail, MapPin, Activity, CheckCircle2, AlertCircle, AlertTriangle, Loader2, Calendar, FileText, Settings, Lock, Eye, EyeOff, LogIn, LogOut, GraduationCap, ChevronDown, Plus, Trash2, ArrowRight, Clock } from 'lucide-react';
import { cn, maskPhone } from './lib/utils';
import FichaSaude from './components/FichaSaude';
import FichaSaudeE from './components/FichaSaudeE';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // @ts-ignore
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-500 w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Algo deu errado</h2>
            <p className="text-gray-500 mt-2">
              Ocorreu um erro inesperado. Por favor, recarregue a página ou tente novamente mais tarde.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}

// Helper to normalize strings for comparison (remove accents, trim, uppercase)
function normalizeText(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// Helper to parse JSON safely (handles single or double-serialized JSON)
function parseJson(val: any): Record<string, any> {
  if (!val) return {};
  let current = val;
  for (let i = 0; i < 2; i++) {
    if (typeof current === 'string') {
      try {
        current = JSON.parse(current);
      } catch {
        break;
      }
    }
  }
  return typeof current === 'object' && current !== null ? current : {};
}

// Helper to format phone numbers with DDD
function formatPhone(ddd?: string, num?: string): string {
  if (!num) return '';
  const cleanNum = num.trim();
  if (!cleanNum) return '';
  if (cleanNum.includes('(')) return cleanNum;
  const cleanDdd = (ddd || '').replace(/\D/g, '');
  if (cleanDdd) {
    return `(${cleanDdd}) ${cleanNum}`;
  }
  return cleanNum;
}

// Normalizer for Race select option
function normalizeRace(race?: string): string {
  if (!race) return '';
  const r = race.trim().toUpperCase();
  if (r === 'BRANCA') return 'Branca';
  if (r === 'PRETA') return 'Preta';
  if (r === 'PARDA') return 'Parda';
  if (r === 'AMARELA') return 'Amarela';
  if (r === 'INDIGENA' || r === 'INDÍGENA') return 'Indígena';
  if (r === 'NAO DECLARADO' || r === 'NÃO DECLARADO') return 'Não Declarado';
  return race;
}

// Normalizer for Gender select option
function normalizeGender(gender?: string): string {
  if (!gender) return '';
  const g = gender.trim().toUpperCase();
  if (g.startsWith('M')) return 'Masculino';
  if (g.startsWith('F')) return 'Feminino';
  return gender;
}

const initialFormData = {
  birthDate: '',
  gender: '',
  race: '',
  // Documentos do Aluno (ALUNOS_DOCUMENTOS)
  possuiCin: false,
  cpf: '',
  rg: '',
  rgDigit: '',
  rgUf: '',
  rgOrgao: '',
  rgDate: '',
  rne: '',
  certidaoTipo: 'Certidão de Nascimento',
  certidaoModelo: 'Novo',
  certidaoMatricula: '',
  certidaoNumero: '',
  certidaoLivro: '',
  certidaoFolha: '',
  certidaoCartorio: '',
  certidaoDistrito: '',
  certidaoMunicipio: '',
  certidaoUf: '',
  certidaoDataEmissao: '',
  nis: '',
  cnsSus: '',
  guardianName: '',
  guardianCpf: '',
  guardianPhone: '',
  guardianWhatsapp: '',
  guardianEmail: '',
  motherName: '',
  motherCpf: '',
  motherPhone: '',
  motherWhatsapp: '',
  motherEmail: '',
  fatherName: '',
  fatherCpf: '',
  fatherPhone: '',
  fatherWhatsapp: '',
  fatherEmail: '',
  additionalContacts: [] as AdditionalContact[],
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  respCep: '',
  respStreet: '',
  respNumber: '',
  respComplement: '',
  respNeighborhood: '',
  respCity: '',
  respState: '',
  healthInfo: ''
};

const formatDateMask = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
};

const parseDateToISO = (value: string) => {
  const clean = value.trim();
  if (clean.includes('/')) {
    const [day, month, year] = clean.split('/');
    if (day && month && year && year.length === 4) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return clean;
};

interface EolFieldDefinition {
  key: keyof typeof initialFormData;
  label: string;
  categoria: string;
  type?: 'phone' | 'doc' | 'date' | 'text';
}

const EOL_TRACKED_FIELDS: EolFieldDefinition[] = [
  // Dados Gerais
  { key: 'birthDate', label: 'Data de Nascimento', categoria: 'Dados Gerais', type: 'date' },
  { key: 'gender', label: 'Sexo / Gênero', categoria: 'Dados Gerais' },
  { key: 'race', label: 'Raça / Cor', categoria: 'Dados Gerais' },

  // Documentos
  { key: 'cpf', label: 'CPF do Aluno', categoria: 'Documentos', type: 'doc' },
  { key: 'rg', label: 'RG do Aluno', categoria: 'Documentos', type: 'doc' },
  { key: 'rgDigit', label: 'Dígito do RG', categoria: 'Documentos' },
  { key: 'rgUf', label: 'UF do RG', categoria: 'Documentos' },
  { key: 'rgOrgao', label: 'Órgão Emissor do RG', categoria: 'Documentos' },
  { key: 'rgDate', label: 'Data de Emissão do RG', categoria: 'Documentos', type: 'date' },
  { key: 'rne', label: 'RNE', categoria: 'Documentos' },
  { key: 'certidaoTipo', label: 'Tipo de Certidão', categoria: 'Documentos' },
  { key: 'certidaoModelo', label: 'Modelo da Certidão', categoria: 'Documentos' },
  { key: 'certidaoMatricula', label: 'Matrícula da Certidão', categoria: 'Documentos', type: 'doc' },
  { key: 'certidaoNumero', label: 'Número da Certidão', categoria: 'Documentos', type: 'doc' },
  { key: 'certidaoLivro', label: 'Livro da Certidão', categoria: 'Documentos' },
  { key: 'certidaoFolha', label: 'Folha da Certidão', categoria: 'Documentos' },
  { key: 'certidaoCartorio', label: 'Cartório da Certidão', categoria: 'Documentos' },
  { key: 'certidaoDistrito', label: 'Distrito da Certidão', categoria: 'Documentos' },
  { key: 'certidaoMunicipio', label: 'Município da Certidão', categoria: 'Documentos' },
  { key: 'certidaoUf', label: 'UF da Certidão', categoria: 'Documentos' },
  { key: 'certidaoDataEmissao', label: 'Data de Emissão da Certidão', categoria: 'Documentos', type: 'date' },
  { key: 'nis', label: 'NIS', categoria: 'Documentos', type: 'doc' },
  { key: 'cnsSus', label: 'Cartão SUS', categoria: 'Documentos', type: 'doc' },

  // Endereço
  { key: 'cep', label: 'CEP (Aluno)', categoria: 'Endereço', type: 'doc' },
  { key: 'street', label: 'Logradouro (Aluno)', categoria: 'Endereço' },
  { key: 'number', label: 'Número (Aluno)', categoria: 'Endereço' },
  { key: 'complement', label: 'Complemento (Aluno)', categoria: 'Endereço' },
  { key: 'neighborhood', label: 'Bairro (Aluno)', categoria: 'Endereço' },
  { key: 'city', label: 'Município (Aluno)', categoria: 'Endereço' },
  { key: 'state', label: 'Estado (Aluno)', categoria: 'Endereço' },

  // Mãe
  { key: 'motherName', label: 'Nome da Mãe', categoria: 'Filiação 1' },
  { key: 'motherCpf', label: 'CPF da Mãe', categoria: 'Filiação 1', type: 'doc' },
  { key: 'motherPhone', label: 'Celular da Mãe', categoria: 'Filiação 1', type: 'phone' },
  { key: 'motherWhatsapp', label: 'WhatsApp da Mãe', categoria: 'Filiação 1', type: 'phone' },
  { key: 'motherEmail', label: 'E-mail da Mãe', categoria: 'Filiação 1' },

  // Pai
  { key: 'fatherName', label: 'Nome do Pai', categoria: 'Filiação 2' },
  { key: 'fatherCpf', label: 'CPF do Pai', categoria: 'Filiação 2', type: 'doc' },
  { key: 'fatherPhone', label: 'Celular do Pai', categoria: 'Filiação 2', type: 'phone' },
  { key: 'fatherWhatsapp', label: 'WhatsApp do Pai', categoria: 'Filiação 2', type: 'phone' },
  { key: 'fatherEmail', label: 'E-mail do Pai', categoria: 'Filiação 2' },

  // Responsável Legal
  { key: 'guardianName', label: 'Nome do Responsável', categoria: 'Responsável' },
  { key: 'guardianCpf', label: 'CPF do Responsável', categoria: 'Responsável', type: 'doc' },
  { key: 'guardianPhone', label: 'Celular do Responsável', categoria: 'Responsável', type: 'phone' },
  { key: 'guardianWhatsapp', label: 'WhatsApp do Responsável', categoria: 'Responsável', type: 'phone' },
  { key: 'guardianEmail', label: 'E-mail do Responsável', categoria: 'Responsável' },

  // Endereço Responsável (se diferente)
  { key: 'respCep', label: 'CEP do Responsável', categoria: 'Endereço Responsável', type: 'doc' },
  { key: 'respStreet', label: 'Logradouro do Responsável', categoria: 'Endereço Responsável' },
  { key: 'respNumber', label: 'Número do Responsável', categoria: 'Endereço Responsável' },
  { key: 'respComplement', label: 'Complemento do Responsável', categoria: 'Endereço Responsável' },
  { key: 'respNeighborhood', label: 'Bairro do Responsável', categoria: 'Endereço Responsável' },
  { key: 'respCity', label: 'Município do Responsável', categoria: 'Endereço Responsável' },
  { key: 'respState', label: 'Estado do Responsável', categoria: 'Endereço Responsável' },
];

export const calculateStudentEolDivergences = (
  original: typeof initialFormData | null,
  current: typeof initialFormData,
  options?: {
    isMotherMain?: boolean;
    isFatherMain?: boolean;
    motherSameWhatsapp?: boolean;
    fatherSameWhatsapp?: boolean;
    guardianSameWhatsapp?: boolean;
  }
): CampoModificadoEol[] => {
  if (!original) return [];

  const isBlank = (val: any): boolean => {
    if (val === undefined || val === null) return true;
    const str = String(val).trim();
    if (str === '' || str === '-' || str === '--' || str === '---') return true;
    const lower = str.toLowerCase();
    return lower === 'n/a' || lower === 'null' || lower === 'undefined' || lower === '(vazio)' || lower === '(em branco)';
  };

  const changed: CampoModificadoEol[] = [];

  for (const meta of EOL_TRACKED_FIELDS) {
    let rawOld = original[meta.key];
    let rawNew = current[meta.key];

    // Ajustar whatsapps efetivos com base no toggle "mesmo número"
    if (meta.key === 'motherWhatsapp' && options?.motherSameWhatsapp) {
      rawNew = current.motherPhone;
    }
    if (meta.key === 'fatherWhatsapp' && options?.fatherSameWhatsapp) {
      rawNew = current.fatherPhone;
    }
    if (meta.key === 'guardianWhatsapp' && options?.guardianSameWhatsapp) {
      rawNew = current.guardianPhone;
    }

    const oldBlank = isBlank(rawOld);
    const newBlank = isBlank(rawNew);

    if (oldBlank && newBlank) continue;

    const oldStr = !oldBlank ? String(rawOld).trim() : '';
    const newStr = !newBlank ? String(rawNew).trim() : '';

    // 1. DADO APAGADO / EXCLUÍDO
    if (!oldBlank && newBlank) {
      changed.push({
        campo: meta.label,
        valor: '(Apagado / Excluído)',
        valorAnterior: oldStr,
        categoria: meta.categoria,
        acao: 'apagado'
      });
      continue;
    }

    // 2. NOVO DADO ADICIONADO
    if (oldBlank && !newBlank) {
      changed.push({
        campo: meta.label,
        valor: newStr,
        valorAnterior: '(Vazio)',
        categoria: meta.categoria,
        acao: 'adicionado'
      });
      continue;
    }

    // 3. COMPARAR DE FORMA INTELIGENTE
    if (meta.type === 'phone') {
      const digitsOld = oldStr.replace(/\D/g, '');
      const digitsNew = newStr.replace(/\D/g, '');
      if (digitsOld && digitsNew && digitsOld === digitsNew) continue;
    } else if (meta.type === 'doc') {
      const cleanOld = oldStr.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const cleanNew = newStr.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (cleanOld && cleanNew && cleanOld === cleanNew) continue;
    } else if (meta.type === 'date') {
      const dOld = oldStr.slice(0, 10);
      const dNew = newStr.slice(0, 10);
      if (dOld === dNew) continue;
    } else {
      if (oldStr.trim().toLowerCase() === newStr.trim().toLowerCase()) continue;
    }

    changed.push({
      campo: meta.label,
      valor: newStr,
      valorAnterior: oldStr,
      categoria: meta.categoria,
      acao: 'alterado'
    });
  }

  // CIN (Carteira de Identidade Nacional)
  if (original.possuiCin !== current.possuiCin) {
    changed.push({
      campo: 'Possui apenas CIN (sem RG estadual)',
      valor: current.possuiCin ? 'Sim (RG Dispensado)' : 'Não (Possui RG Civil)',
      valorAnterior: original.possuiCin ? 'Sim' : 'Não',
      categoria: 'Documentos',
      acao: 'alterado'
    });
  }

  // Contatos Adicionais
  const oldContatos = Array.isArray(original.additionalContacts) ? original.additionalContacts : [];
  const newContatos = Array.isArray(current.additionalContacts) ? current.additionalContacts : [];
  if (JSON.stringify(oldContatos) !== JSON.stringify(newContatos)) {
    if (oldContatos.length === 0 && newContatos.length > 0) {
      changed.push({
        campo: 'Contatos Adicionais',
        valor: `${newContatos.length} contato(s): ` + newContatos.map((c: any) => `${c.name} (${c.relationship} - ${c.phone})`).join(', '),
        valorAnterior: '(Nenhum)',
        categoria: 'Contatos',
        acao: 'adicionado'
      });
    } else if (oldContatos.length > 0 && newContatos.length === 0) {
      changed.push({
        campo: 'Contatos Adicionais',
        valor: '(Apagado / Excluído)',
        valorAnterior: `${oldContatos.length} contato(s)`,
        categoria: 'Contatos',
        acao: 'apagado'
      });
    } else {
      changed.push({
        campo: 'Contatos Adicionais',
        valor: `${newContatos.length} contato(s): ` + newContatos.map((c: any) => `${c.name} (${c.relationship} - ${c.phone})`).join(', '),
        valorAnterior: `${oldContatos.length} contato(s)`,
        categoria: 'Contatos',
        acao: 'alterado'
      });
    }
  }

  return changed;
};

const isFieldEmpty = (value: string | number | undefined | null) => {
  if (value === undefined || value === null) return true;
  const str = String(value).trim();
  if (str === '') return true;
  // Considera sequências apenas de zeros e pontuação como vazio (ex: "000.000.000-00", "00.000.000", "00000-000")
  const digitsOnly = str.replace(/\D/g, '');
  if (digitsOnly.length > 1 && /^0+$/.test(digitsOnly)) return true;
  return false;
};

const getFieldClass = (
  value: string | number | undefined | null,
  extra: string = '',
  isOptional: boolean = false
) => {
  const empty = !isOptional && isFieldEmpty(value);
  return cn(
    "w-full px-4 py-3 rounded-lg outline-none transition-all duration-150 text-gray-800",
    empty
      ? "bg-red-500/10 border border-red-300 placeholder:text-gray-400 focus:bg-red-500/[0.08] focus:border-red-400 focus:ring-2 focus:ring-red-200"
      : "bg-white border border-gray-200 focus:ring-2 focus:ring-[#3b5998] focus:border-transparent",
    extra
  );
};

interface TurmaOption {
  key: string;
  label: string;
  serie: string;
  turma: string;
}

const DEFAULT_TURMAS: TurmaOption[] = [
  { key: '1º_A', label: '1º Ano A', serie: '1º', turma: 'A' },
  { key: '1º_B', label: '1º Ano B', serie: '1º', turma: 'B' },
  { key: '1º_C', label: '1º Ano C', serie: '1º', turma: 'C' },
  { key: '2º_A', label: '2º Ano A', serie: '2º', turma: 'A' },
  { key: '2º_B', label: '2º Ano B', serie: '2º', turma: 'B' },
  { key: '2º_C', label: '2º Ano C', serie: '2º', turma: 'C' },
  { key: '3º_A', label: '3º Ano A', serie: '3º', turma: 'A' },
  { key: '3º_B', label: '3º Ano B', serie: '3º', turma: 'B' },
  { key: '3º_C', label: '3º Ano C', serie: '3º', turma: 'C' },
  { key: '4º_A', label: '4º Ano A', serie: '4º', turma: 'A' },
  { key: '4º_B', label: '4º Ano B', serie: '4º', turma: 'B' },
  { key: '4º_C', label: '4º Ano C', serie: '4º', turma: 'C' },
  { key: '5º_A', label: '5º Ano A', serie: '5º', turma: 'A' },
  { key: '5º_B', label: '5º Ano B', serie: '5º', turma: 'B' },
  { key: '5º_C', label: '5º Ano C', serie: '5º', turma: 'C' },
  { key: '6º_A', label: '6º Ano A', serie: '6º', turma: 'A' },
  { key: '6º_B', label: '6º Ano B', serie: '6º', turma: 'B' },
  { key: '6º_C', label: '6º Ano C', serie: '6º', turma: 'C' },
  { key: '7º_A', label: '7º Ano A', serie: '7º', turma: 'A' },
  { key: '7º_B', label: '7º Ano B', serie: '7º', turma: 'B' },
  { key: '7º_C', label: '7º Ano C', serie: '7º', turma: 'C' },
  { key: '8º_A', label: '8º Ano A', serie: '8º', turma: 'A' },
  { key: '8º_B', label: '8º Ano B', serie: '8º', turma: 'B' },
  { key: '8º_C', label: '8º Ano C', serie: '8º', turma: 'C' },
  { key: '9º_A', label: '9º Ano A', serie: '9º', turma: 'A' },
  { key: '9º_B', label: '9º Ano B', serie: '9º', turma: 'B' },
  { key: '9º_C', label: '9º Ano C', serie: '9º', turma: 'C' },
];

export default function App() {
  // Autenticação
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('@PortalTarsila:Auth') === 'true';
  });
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Turmas e Alunos
  const [turmasList, setTurmasList] = useState<TurmaOption[]>(DEFAULT_TURMAS);
  const [selectedTurmaKey, setSelectedTurmaKey] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [turmaStudents, setTurmaStudents] = useState<{ id_aluno: number; nome_aluno: string; isSalvo: boolean }[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);
  const [originalSnapshot, setOriginalSnapshot] = useState<typeof initialFormData | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMotherMain, setIsMotherMain] = useState(false);
  const [isFatherMain, setIsFatherMain] = useState(false);
  const [sameAddressAsStudent, setSameAddressAsStudent] = useState(true);
  const [motherSameWhatsapp, setMotherSameWhatsapp] = useState(true);
  const [fatherSameWhatsapp, setFatherSameWhatsapp] = useState(true);
  const [guardianSameWhatsapp, setGuardianSameWhatsapp] = useState(true);
  const [siblings, setSiblings] = useState<SiblingInfo[]>([]);
  const [currentView, setCurrentView] = useState<'main' | 'saude' | 'saudeE'>('main');
  const [isEditMode, setIsEditMode] = useState<boolean>(() => {
    return localStorage.getItem('@PortalTarsila:EditMode') === 'true';
  });

  const toggleEditMode = () => {
    setIsEditMode(prev => {
      const next = !prev;
      localStorage.setItem('@PortalTarsila:EditMode', String(next));
      if (selectedTurmaKey) {
        fetchTurmaStudents(selectedTurmaKey, next);
      }
      return next;
    });
  };

  // Form state
  const [formData, setFormData] = useState(initialFormData);

  const resetAllFormState = () => {
    setFormData(initialFormData);
    setOriginalSnapshot(null);
    setIsMotherMain(false);
    setIsFatherMain(false);
    setSameAddressAsStudent(true);
    setMotherSameWhatsapp(true);
    setFatherSameWhatsapp(true);
    setGuardianSameWhatsapp(true);
    setSiblings([]);
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanUser = loginUser.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanUser || !cleanPass) {
      setLoginError('Por favor, preencha o usuário e a senha.');
      return;
    }

    if (cleanUser === 'tarsila' && cleanPass === 'T@rsila') {
      setIsAuthenticated(true);
      localStorage.setItem('@PortalTarsila:Auth', 'true');
      setLoginError(null);
      setLoginUser('');
      setLoginPassword('');
    } else {
      setLoginError('Usuário ou senha incorretos. Verifique suas credenciais.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('@PortalTarsila:Auth');
    setFoundStudent(null);
    setSelectedTurmaKey('');
    setSelectedStudentId('');
    setTurmaStudents([]);
    setError(null);
    setLoginError(null);
  };

  const fetchTurmaStudents = async (turmaKey: string, _editMode?: boolean) => {
    if (!turmaKey) {
      setTurmaStudents([]);
      return;
    }

    const selectedTurmaObj = turmasList.find(t => t.key === turmaKey);
    if (!selectedTurmaObj) return;

    setIsLoadingStudents(true);
    try {
      const { data, error: stErr } = await supabase
        .from('ALUNOS')
        .select('id_aluno, nome_aluno, status_cadastro, ALUNOS_MATRICULAS!inner(serie_aluno, turma_aluno, ano_letivo_aluno)')
        .eq('ALUNOS_MATRICULAS.ano_letivo_aluno', 2026)
        .eq('ALUNOS_MATRICULAS.serie_aluno', selectedTurmaObj.serie)
        .eq('ALUNOS_MATRICULAS.turma_aluno', selectedTurmaObj.turma)
        .order('nome_aluno');

      if (stErr) throw stErr;

      const uniqueStudents: { id_aluno: number; nome_aluno: string; isSalvo: boolean }[] = [];
      const seenIds = new Set<number>();
      (data || []).forEach((item: any) => {
        const isSalvo = (item.status_cadastro || '').toLowerCase() === 'salva' || (item.status_cadastro || '').toLowerCase() === 'concluido';

        if (!seenIds.has(item.id_aluno)) {
          seenIds.add(item.id_aluno);
          uniqueStudents.push({
            id_aluno: item.id_aluno,
            nome_aluno: item.nome_aluno,
            isSalvo
          });
        }
      });

      setTurmaStudents(uniqueStudents);
    } catch (err) {
      console.error('Erro ao buscar alunos da turma:', err);
      setError('Erro ao carregar a lista de alunos desta turma.');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleTurmaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const turmaKey = e.target.value;
    setSelectedTurmaKey(turmaKey);
    setSelectedStudentId('');
    setError(null);
    await fetchTurmaStudents(turmaKey, isEditMode);
  };

  // Sincronizar turmas ativas do banco no ano letivo 2026
  useEffect(() => {
    async function loadTurmas() {
      try {
        const { data, error: tErr } = await supabase
          .from('ALUNOS_MATRICULAS')
          .select('serie_aluno, turma_aluno')
          .eq('ano_letivo_aluno', 2026);

        if (!tErr && data && data.length > 0) {
          const unique = new Map<string, TurmaOption>();
          data.forEach(item => {
            const s = (item.serie_aluno || '').trim();
            const t = (item.turma_aluno || '').trim();
            if (s && t) {
              const key = `${s}_${t}`;
              if (!unique.has(key)) {
                const serieLabel = s.toLowerCase().includes('ano') ? s : `${s} Ano`;
                unique.set(key, {
                  key,
                  label: `${serieLabel} ${t}`,
                  serie: s,
                  turma: t
                });
              }
            }
          });

          if (unique.size > 0) {
            const sorted = Array.from(unique.values()).sort((a, b) =>
              a.label.localeCompare(b.label, 'pt-BR', { numeric: true })
            );
            setTurmasList(sorted);
          }
        }
      } catch (err) {
        console.warn('Erro ao sincronizar turmas do banco, mantendo padrão:', err);
      }
    }
    loadTurmas();
  }, []);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, cep: e.target.value }));

    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || ''
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      }
    }
  };

  const handleRespCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, respCep: e.target.value }));

    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            respStreet: data.logradouro || '',
            respNeighborhood: data.bairro || '',
            respCity: data.localidade || '',
            respState: data.uf || ''
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP do responsável", err);
      }
    }
  };

  // Test connection to Supabase
  useEffect(() => {
    async function testConnection() {
      try {
        const { error } = await supabase.from('ALUNOS').select('count', { count: 'exact', head: true });
        if (error) throw error;
      } catch (err) {
        console.error("Please check your Supabase configuration.", err);
      }
    }
    testConnection();
  }, []);

  // Guarantee scroll to top whenever changing screens or loading a student
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 50);
    return () => clearTimeout(timer);
  }, [foundStudent?.id, currentView, isSuccess]);

  const loadStudentById = async (studentId: number) => {
    setIsSearching(true);
    setError(null);
    setFoundStudent(null);
    setIsSuccess(false);

    try {
      const { data: matched, error: searchError } = await supabase
        .from('ALUNOS')
        .select(`
          *,
          ALUNOS_DADOS_GERAIS (*),
          ALUNOS_DOCUMENTOS (*),
          ALUNOS_ENDERECOS (*),
          ALUNOS_MATRICULAS (*),
          ALUNOS_CONTATOS (*),
          ALUNOS_DADOS_SAUDE (*),
          ALUNOS_RESPONSAVEL (*),
          ALUNOS_VACINACAO (*)
        `)
        .eq('id_aluno', studentId)
        .single();

      if (searchError || !matched) {
        throw searchError || new Error('Aluno não encontrado.');
      }

      // Helper to extract first item of array or single object
      const getSingle = (val: any): any => (Array.isArray(val) ? val[0] : val) || {};

      const dadosGerais = getSingle(matched.ALUNOS_DADOS_GERAIS);
      const documentos = getSingle(matched.ALUNOS_DOCUMENTOS);
      const enderecos = getSingle(matched.ALUNOS_ENDERECOS);
      const contatos = getSingle(matched.ALUNOS_CONTATOS);
      const respRecord = getSingle(matched.ALUNOS_RESPONSAVEL);
      const dadosCompletos = parseJson(contatos.dados_completos);

      const matriculas = Array.isArray(matched.ALUNOS_MATRICULAS)
        ? matched.ALUNOS_MATRICULAS
        : (matched.ALUNOS_MATRICULAS ? [matched.ALUNOS_MATRICULAS] : []);
      const matricula = matriculas.find((m: any) => m.ano_letivo_aluno === 2026 || m.ano_letivo === 2026) || matriculas[0] || {};

      let motherPhone = formatPhone(dadosCompletos.tel_filiacao1_pessoal_ddd, dadosCompletos.tel_filiacao1_pessoal_numero)
        || formatPhone(dadosCompletos.tel_filiacao1_residencial_ddd, dadosCompletos.tel_filiacao1_residencial_numero);

      let fatherPhone = formatPhone(dadosCompletos.tel_filiacao2_pessoal_ddd, dadosCompletos.tel_filiacao2_pessoal_numero)
        || formatPhone(dadosCompletos.tel_filiacao2_residencial_ddd, dadosCompletos.tel_filiacao2_residencial_numero);

      const respPhone = formatPhone(dadosCompletos.tel_responsavel_pessoal_ddd, dadosCompletos.tel_responsavel_pessoal_numero)
        || formatPhone(dadosCompletos.tel_responsavel_residencial_ddd, dadosCompletos.tel_responsavel_residencial_numero);

      const motherName = (dadosGerais.filiacao1_aluno || '').trim();
      let motherCpf = (dadosGerais.cpf_filiacao_1_aluno || '').trim();

      const fatherName = (dadosGerais.filiacao2_aluno || '').trim();
      let fatherCpf = (dadosGerais.cpf_filiacao_2_aluno || '').trim();

      const respTipo = (respRecord.responsavel_aluno || '').trim();
      const respNome = (respRecord.nome_responsavel_aluno || '').trim();
      const respCpf = (respRecord.cpf_responsavel_aluno || '').trim();

      // Retrieve stored WhatsApp values from database if present
      const motherWhatsappDb = (respRecord.whatsapp_mae || contatos.whatsapp_mae || dadosCompletos.whatsapp_mae || '').trim();
      const fatherWhatsappDb = (respRecord.whatsapp_pai || contatos.whatsapp_pai || dadosCompletos.whatsapp_pai || '').trim();
      const guardianWhatsappDb = (respRecord.whatsapp_responsavel || contatos.whatsapp_responsavel || dadosCompletos.whatsapp_responsavel || '').trim();

      // Check ALUNOS_RESPONSAVEL to determine if mother, father, or someone else was the registered guardian
      let initialMotherMain = false;
      let initialFatherMain = false;
      let initialGuardianName = '';
      let initialGuardianCpf = '';
      let initialGuardianPhone = '';
      let initialGuardianWhatsapp = '';
      let initialGuardianEmail = '';

      const isRespMother = respTipo === 'Filiação 1' || (motherName && respNome && normalizeText(respNome) === normalizeText(motherName));
      const isRespFather = respTipo === 'Filiação 2' || (fatherName && respNome && normalizeText(respNome) === normalizeText(fatherName));

      if (isRespMother) {
        initialMotherMain = true;
        initialFatherMain = false;
        if (!motherCpf && respCpf) {
          motherCpf = respCpf;
        }
        if (!motherPhone && respPhone) {
          motherPhone = respPhone;
        }
      } else if (isRespFather) {
        initialMotherMain = false;
        initialFatherMain = true;
        if (!fatherCpf && respCpf) {
          fatherCpf = respCpf;
        }
        if (!fatherPhone && respPhone) {
          fatherPhone = respPhone;
        }
      } else if (respNome) {
        // Another person (e.g. grandmother, aunt, tutor legal) is registered as the main guardian
        initialMotherMain = false;
        initialFatherMain = false;
        initialGuardianName = respNome;
        initialGuardianCpf = respCpf;
        initialGuardianPhone = respPhone || motherPhone || fatherPhone || '';
        initialGuardianWhatsapp = guardianWhatsappDb || respPhone || motherPhone || fatherPhone || '';
        initialGuardianEmail = contatos.email_responsavel || '';
      } else {
        // Fallback: Default to mother if exists, else father
        if (motherName) {
          initialMotherMain = true;
          initialFatherMain = false;
        } else if (fatherName) {
          initialMotherMain = false;
          initialFatherMain = true;
        }
      }

      setIsMotherMain(initialMotherMain);
      setIsFatherMain(initialFatherMain);

      const activeGuardianName = initialMotherMain ? motherName : (initialFatherMain ? fatherName : initialGuardianName);
      const activeGuardianCpf = initialMotherMain ? motherCpf : (initialFatherMain ? fatherCpf : initialGuardianCpf);
      const activeGuardianPhone = initialMotherMain ? (motherPhone || respPhone) : (initialFatherMain ? (fatherPhone || respPhone) : initialGuardianPhone);
      const activeGuardianEmail = initialMotherMain ? (contatos.email_responsavel || '') : (initialFatherMain ? (contatos.email_responsavel || '') : initialGuardianEmail);

      // Initialize WhatsApp and "Mesmo do celular" flags
      const finalMotherWhatsapp = motherWhatsappDb || motherPhone || '';
      const finalMotherSame = !motherWhatsappDb || (motherPhone && motherWhatsappDb === motherPhone);

      const finalFatherWhatsapp = fatherWhatsappDb || fatherPhone || '';
      const finalFatherSame = !fatherWhatsappDb || (fatherPhone && fatherWhatsappDb === fatherPhone);

      const finalGuardianPhoneVal = initialGuardianPhone || '';
      const finalGuardianWhatsappVal = guardianWhatsappDb || finalGuardianPhoneVal;
      const finalGuardianSame = !guardianWhatsappDb || (finalGuardianPhoneVal && guardianWhatsappDb === finalGuardianPhoneVal);

      setMotherSameWhatsapp(Boolean(finalMotherSame));
      setFatherSameWhatsapp(Boolean(finalFatherSame));
      setGuardianSameWhatsapp(Boolean(finalGuardianSame));

      // Fetch siblings if student has id_familia
      let loadedSiblings: SiblingInfo[] = [];
      if (matched.id_familia) {
        try {
          const { data: sibs } = await supabase
            .from('ALUNOS')
            .select(`
              id_aluno,
              nome_aluno,
              data_nasc_aluno,
              ALUNOS_MATRICULAS (
                ano_letivo_aluno,
                serie_aluno,
                turma_aluno,
                periodo_aluno,
                situacao_matricula
              )
            `)
            .eq('id_familia', matched.id_familia)
            .neq('id_aluno', matched.id_aluno);

          if (sibs && sibs.length > 0) {
            loadedSiblings = sibs.map((s: any) => {
              const matriculasList = Array.isArray(s.ALUNOS_MATRICULAS) ? s.ALUNOS_MATRICULAS : (s.ALUNOS_MATRICULAS ? [s.ALUNOS_MATRICULAS] : []);
              const mat = matriculasList.find((m: any) => m.ano_letivo_aluno === 2026 || m.ano_letivo === 2026) || matriculasList[0] || {};
              return {
                id: String(s.id_aluno),
                name: s.nome_aluno,
                class: mat.turma_aluno || '',
                grade: mat.serie_aluno || '',
                period: mat.periodo_aluno || '',
                birthDate: s.data_nasc_aluno || ''
              };
            });
          }
        } catch (sibErr) {
          console.warn('Erro ao buscar irmãos:', sibErr);
        }
      }
      setSiblings(loadedSiblings);

      const addressCep = enderecos.cep_aluno || respRecord.cep_responsavel_aluno || '';
      const addressStreet = enderecos.logradouro_aluno || [respRecord.logradouro_responsavel_aluno, respRecord.endereco_responsavel_aluno].filter(Boolean).join(' ') || '';
      const addressNumber = enderecos.numero_aluno || respRecord.numero_end_responsavel_aluno || '';
      const addressComplement = enderecos.complemento_aluno || respRecord.complemento_end_responsavel_aluno || '';
      const addressNeighborhood = enderecos.bairro_aluno || respRecord.bairro_responsavel_aluno || '';
      const addressCity = enderecos.cidade_aluno || respRecord.municipio_responsavel_aluno || 'São Paulo';
      const addressState = enderecos.estado_aluno || respRecord.uf_responsavel_aluno || 'SP';

      const studentRg = (documentos.rg_aluno === 'Não' || documentos.rg_aluno === 'Sim') ? '' : (documentos.rg_aluno || '');
      const studentRgDigit = (documentos.rg_digito_aluno === 'Sim' || documentos.rg_digito_aluno === 'Não') ? '' : (documentos.rg_digito_aluno || '');
      const studentRgUf = documentos.rg_uf_aluno?.includes('-->') ? '' : (documentos.rg_uf_aluno || '');
      const studentRgOrgao = documentos.rg_orgao_emissao_aluno?.includes('-->') ? '' : (documentos.rg_orgao_emissao_aluno || '');
      const studentRgDate = documentos.rg_data_emissao_aluno || '';
      const studentRne = (documentos.rne_aluno === 'Não' || documentos.rne_aluno === 'Sim') ? '' : (documentos.rne_aluno || '');
      const studentPossuiCin = Boolean(documentos.possui_cin);
      const loadedContatosAdicionais: AdditionalContact[] = Array.isArray(contatos.contatos_adicionais)
        ? contatos.contatos_adicionais
        : (Array.isArray(dadosCompletos.contatos_adicionais) ? dadosCompletos.contatos_adicionais : []);

      const certModelo = (documentos.certidao_nasc_modelo_aluno === 'Antigo' || (!documentos.certidao_nasc_matricula_aluno && documentos.certidao_nasc_numero_aluno)) ? 'Antigo' : 'Novo';

      const birthDate = matched.data_nasc_aluno || dadosGerais.data_nasc_aluno || '';
      const turmaFormatada = [matricula.serie_aluno, matricula.turma_aluno].filter(Boolean).join(' ');

      const isSameAddress = respRecord.mesmo_end_responsavel_aluno !== 'Não';
      setSameAddressAsStudent(isSameAddress);

      const respStreetFromDb = [respRecord.logradouro_responsavel_aluno, respRecord.endereco_responsavel_aluno].filter(Boolean).join(' ') || respRecord.endereco_responsavel_aluno || '';

      // Dados de Vacinação e Situação do DVA
      const vacRecords = Array.isArray(matched.ALUNOS_VACINACAO)
        ? matched.ALUNOS_VACINACAO
        : (matched.ALUNOS_VACINACAO ? [matched.ALUNOS_VACINACAO] : []);
      let vacinacao = vacRecords[0] || null;

      if (!vacinacao && matched.cod_eol_aluno) {
        try {
          const { data: vacByEol } = await supabase
            .from('ALUNOS_VACINACAO')
            .select('*')
            .eq('cod_eol', matched.cod_eol_aluno)
            .maybeSingle();
          if (vacByEol) vacinacao = vacByEol;
        } catch (vacErr) {
          console.warn('Erro ao buscar vacinação por cod_eol:', vacErr);
        }
      }

      const dvaStatus = (vacinacao?.situacao_vacinacao || 'Pendente').trim();
      const dvaDataRetorno = (vacinacao?.data_retorno_dva || '').trim();
      const dvaAtualizacao = (vacinacao?.atualizacao_operador_data || '').trim();

      const mappedStudent: Student = {
        id: matched.id_aluno.toString(),
        name: matched.nome_aluno,
        class: turmaFormatada,
        period: matricula.periodo_aluno || '',
        birthDate: birthDate,
        gender: normalizeGender(dadosGerais.genero_aluno),
        race: normalizeRace(dadosGerais.raca_aluno),
        cpf: documentos.cpf_aluno || '',
        rg: studentRg,
        rgDigit: studentRgDigit,
        possuiCin: studentPossuiCin,
        additionalContacts: loadedContatosAdicionais,
        guardianName: activeGuardianName,
        guardianCpf: activeGuardianCpf,
        guardianPhone: activeGuardianPhone,
        guardianWhatsapp: activeGuardianPhone,
        guardianEmail: activeGuardianEmail,
        motherName: motherName,
        motherCpf: motherCpf,
        motherPhone: motherPhone,
        motherWhatsapp: finalMotherWhatsapp,
        motherEmail: initialMotherMain ? (contatos.email_responsavel || '') : '',
        fatherName: fatherName,
        fatherCpf: fatherCpf,
        fatherPhone: fatherPhone,
        fatherWhatsapp: finalFatherWhatsapp,
        fatherEmail: initialFatherMain ? (contatos.email_responsavel || '') : '',
        cep: addressCep,
        street: addressStreet,
        number: addressNumber,
        complement: addressComplement,
        neighborhood: addressNeighborhood,
        city: addressCity,
        state: addressState,
        healthInfo: '',
        id_familia: matched.id_familia || null,
        siblings: loadedSiblings,
        dvaStatus: dvaStatus,
        dvaDataRetorno: dvaDataRetorno,
        dvaAtualizacao: dvaAtualizacao
      };

      setFoundStudent(mappedStudent);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });

      const loadedFormData = {
        birthDate: birthDate,
        gender: normalizeGender(dadosGerais.genero_aluno),
        race: normalizeRace(dadosGerais.raca_aluno),
        possuiCin: studentPossuiCin,
        cpf: documentos.cpf_aluno || '',
        rg: studentRg,
        rgDigit: studentRgDigit,
        rgUf: studentRgUf,
        rgOrgao: studentRgOrgao,
        rgDate: studentRgDate,
        rne: studentRne,
        certidaoTipo: documentos.tipo_certidao_civil_aluno || 'Certidão de Nascimento',
        certidaoModelo: certModelo,
        certidaoMatricula: documentos.certidao_nasc_matricula_aluno || '',
        certidaoNumero: documentos.certidao_nasc_numero_aluno || '',
        certidaoLivro: documentos.certidao_nasc_livro_aluno || '',
        certidaoFolha: documentos.certidao_nasc_folha_aluno || '',
        certidaoCartorio: documentos.certidao_nasc_cartorio_aluno || '',
        certidaoDistrito: documentos.certidao_nasc_distrito_aluno || '',
        certidaoMunicipio: documentos.certidao_nasc_municipio_aluno || '',
        certidaoUf: documentos.certidao_nasc_uf_aluno || '',
        certidaoDataEmissao: documentos.certidao_nasc_dt_emissao_aluno || '',
        nis: documentos.nis_aluno || '',
        cnsSus: documentos.cns_sus_aluno || '',
        guardianName: initialGuardianName,
        guardianCpf: initialGuardianCpf,
        guardianPhone: maskPhone(finalGuardianPhoneVal),
        guardianWhatsapp: maskPhone(finalGuardianWhatsappVal),
        guardianEmail: initialGuardianEmail,
        motherName: motherName,
        motherCpf: motherCpf,
        motherPhone: maskPhone(motherPhone),
        motherWhatsapp: maskPhone(finalMotherWhatsapp),
        motherEmail: initialMotherMain ? (contatos.email_responsavel || '') : '',
        fatherName: fatherName,
        fatherCpf: fatherCpf,
        fatherPhone: maskPhone(fatherPhone),
        fatherWhatsapp: maskPhone(finalFatherWhatsapp),
        fatherEmail: initialFatherMain ? (contatos.email_responsavel || '') : '',
        additionalContacts: loadedContatosAdicionais,
        cep: addressCep,
        street: addressStreet,
        number: addressNumber,
        complement: addressComplement,
        neighborhood: addressNeighborhood,
        city: addressCity,
        state: addressState,
        respCep: !isSameAddress ? (respRecord.cep_responsavel_aluno || '') : '',
        respStreet: !isSameAddress ? respStreetFromDb : '',
        respNumber: !isSameAddress ? (respRecord.numero_end_responsavel_aluno || '') : '',
        respComplement: !isSameAddress ? (respRecord.complemento_end_responsavel_aluno || '') : '',
        respNeighborhood: !isSameAddress ? (respRecord.bairro_responsavel_aluno || '') : '',
        respCity: !isSameAddress ? (respRecord.municipio_responsavel_aluno || 'São Paulo') : '',
        respState: !isSameAddress ? (respRecord.uf_responsavel_aluno || 'SP') : '',
        healthInfo: ''
      };

      setFormData(loadedFormData);
      setOriginalSnapshot(loadedFormData);
    } catch (err) {
      console.error('Erro ao carregar dados do aluno:', err);
      setError('Erro ao carregar os dados do aluno. Por favor, tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAccessStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Por favor, selecione um aluno para acessar o cadastro.');
      return;
    }
    await loadStudentById(Number(selectedStudentId));
  };

  const handleOpenSaude = () => {
    if (foundStudent) {
      const activeGuardianName = isMotherMain 
        ? formData.motherName 
        : (isFatherMain ? formData.fatherName : formData.guardianName);
      const activeGuardianPhone = isMotherMain 
        ? formData.motherPhone 
        : (isFatherMain ? formData.fatherPhone : formData.guardianPhone);

      setFoundStudent({
        ...foundStudent,
        guardianName: activeGuardianName,
        guardianPhone: activeGuardianPhone,
        guardianWhatsapp: activeGuardianPhone,
        motherName: formData.motherName,
        motherPhone: formData.motherPhone,
        fatherName: formData.fatherName,
        fatherPhone: formData.fatherPhone,
        gender: formData.gender,
        race: formData.race,
        cpf: formData.cpf,
        rg: formData.rg,
        rgDigit: formData.rgDigit,
        cep: formData.cep,
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
      });
    }
    setCurrentView('saude');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!foundStudent) return;

    const confirmSave = window.confirm("Deseja salvar as informações cadastrais do aluno? O cadastro permanecerá disponível para novas edições e atualizações a qualquer momento.");
    if (!confirmSave) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const studentId = Number(foundStudent.id);

      // Determine who is the primary guardian
      let finalGuardianName = '';
      let finalGuardianCpf = '';
      let finalGuardianPhone = '';
      let finalGuardianWhatsapp = '';
      let finalGuardianEmail = '';
      let respTipo = 'Outro Responsável';

      if (isMotherMain) {
        respTipo = 'Filiação 1';
        finalGuardianName = formData.motherName;
        finalGuardianCpf = formData.motherCpf;
        finalGuardianPhone = formData.motherPhone;
        finalGuardianWhatsapp = formData.motherWhatsapp;
        finalGuardianEmail = formData.motherEmail;
      } else if (isFatherMain) {
        respTipo = 'Filiação 2';
        finalGuardianName = formData.fatherName;
        finalGuardianCpf = formData.fatherCpf;
        finalGuardianPhone = formData.fatherPhone;
        finalGuardianWhatsapp = formData.fatherWhatsapp;
        finalGuardianEmail = formData.fatherEmail;
      } else {
        respTipo = 'Outro Responsável';
        finalGuardianName = formData.guardianName;
        finalGuardianCpf = formData.guardianCpf;
        finalGuardianPhone = formData.guardianPhone;
        finalGuardianWhatsapp = formData.guardianWhatsapp;
        finalGuardianEmail = formData.guardianEmail;
      }

      // 1. Calcular divergências em relação ao snapshot inicial carregado do banco
      const newDivergences = calculateStudentEolDivergences(originalSnapshot, formData, {
        isMotherMain,
        isFatherMain,
        motherSameWhatsapp,
        fatherSameWhatsapp,
        guardianSameWhatsapp
      });

      // Carregar divergências pré-existentes para mesclar sem perder histórico de alterações pendentes
      const { data: currentAlunoRow } = await supabase
        .from('ALUNOS')
        .select('campos_modificados_eol, pendente_eol')
        .eq('id_aluno', studentId)
        .maybeSingle();

      let existingDivergences: CampoModificadoEol[] = [];
      if (currentAlunoRow?.campos_modificados_eol) {
        try {
          existingDivergences = typeof currentAlunoRow.campos_modificados_eol === 'string'
            ? JSON.parse(currentAlunoRow.campos_modificados_eol)
            : currentAlunoRow.campos_modificados_eol;
        } catch {
          existingDivergences = [];
        }
      }

      // Mescla as divergências (a mais recente substitui a do mesmo campo, ou adiciona novo campo)
      const mergedDivergencesMap = new Map<string, CampoModificadoEol>();
      existingDivergences.forEach(item => {
        if (item && item.campo) mergedDivergencesMap.set(item.campo, item);
      });
      newDivergences.forEach(item => {
        if (item && item.campo) mergedDivergencesMap.set(item.campo, item);
      });
      const finalDivergences = Array.from(mergedDivergencesMap.values());

      // 2. Atualizar ALUNOS com status_cadastro = 'salva', data e sinalização para o EOL
      const alunosUpdate: Record<string, any> = {
        status_cadastro: 'salva',
        data_cadastro_salvo: new Date().toISOString()
      };
      if (formData.birthDate) {
        alunosUpdate.data_nasc_aluno = formData.birthDate;
      }
      if (finalDivergences.length > 0) {
        alunosUpdate.pendente_eol = true;
        alunosUpdate.campos_modificados_eol = finalDivergences;
      }
      await supabase
        .from('ALUNOS')
        .update(alunosUpdate)
        .eq('id_aluno', studentId);

      // 2. Upsert ALUNOS_DADOS_GERAIS
      const { error: errorGerais } = await supabase
        .from('ALUNOS_DADOS_GERAIS')
        .upsert({
          id_aluno: studentId,
          nome_aluno: foundStudent.name,
          data_nasc_aluno: formData.birthDate || null,
          genero_aluno: formData.gender || null,
          raca_aluno: formData.race || null,
          filiacao1_aluno: formData.motherName || '',
          cpf_filiacao_1_aluno: formData.motherCpf || '',
          filiacao2_aluno: formData.fatherName || '',
          cpf_filiacao_2_aluno: formData.fatherCpf || '',
        }, { onConflict: 'id_aluno' });

      if (errorGerais) throw errorGerais;

      // 3. Upsert ALUNOS_DOCUMENTOS
      const { error: errorDocs } = await supabase
        .from('ALUNOS_DOCUMENTOS')
        .upsert({
          id_aluno: studentId,
          possui_cin: formData.possuiCin || false,
          cpf_aluno: formData.cpf || null,
          rg_aluno: formData.possuiCin ? null : (formData.rg || null),
          rg_digito_aluno: formData.possuiCin ? null : (formData.rgDigit || null),
          rg_uf_aluno: formData.possuiCin ? null : (formData.rgUf || null),
          rg_orgao_emissao_aluno: formData.possuiCin ? null : (formData.rgOrgao || null),
          rg_data_emissao_aluno: formData.rgDate || null,
          rne_aluno: formData.rne || null,
          tipo_certidao_civil_aluno: formData.certidaoTipo || 'Certidão de Nascimento',
          certidao_nasc_modelo_aluno: formData.certidaoModelo || 'Novo',
          certidao_nasc_matricula_aluno: formData.certidaoModelo === 'Novo' ? (formData.certidaoMatricula || null) : null,
          certidao_nasc_numero_aluno: formData.certidaoModelo === 'Antigo' ? (formData.certidaoNumero || null) : null,
          certidao_nasc_livro_aluno: formData.certidaoModelo === 'Antigo' ? (formData.certidaoLivro || null) : null,
          certidao_nasc_folha_aluno: formData.certidaoModelo === 'Antigo' ? (formData.certidaoFolha || null) : null,
          certidao_nasc_cartorio_aluno: formData.certidaoCartorio || null,
          certidao_nasc_distrito_aluno: formData.certidaoDistrito || null,
          certidao_nasc_municipio_aluno: formData.certidaoMunicipio || null,
          certidao_nasc_uf_aluno: formData.certidaoUf || null,
          certidao_nasc_dt_emissao_aluno: formData.certidaoDataEmissao || null,
          nis_aluno: formData.nis || null,
          cns_sus_aluno: formData.cnsSus || null,
        }, { onConflict: 'id_aluno' });

      if (errorDocs) throw errorDocs;

      // 4. Update / Insert ALUNOS_ENDERECOS
      const { data: existingAddress } = await supabase
        .from('ALUNOS_ENDERECOS')
        .select('id')
        .eq('id_aluno', studentId)
        .limit(1);

      const addressPayload = {
        id_aluno: studentId,
        cep_aluno: formData.cep,
        logradouro_aluno: formData.street,
        numero_aluno: formData.number,
        complemento_aluno: formData.complement,
        bairro_aluno: formData.neighborhood,
        cidade_aluno: formData.city,
        estado_aluno: formData.state,
        tipo_endereco: 'aluno'
      };

      if (existingAddress && existingAddress.length > 0) {
        const { error: addrErr } = await supabase
          .from('ALUNOS_ENDERECOS')
          .update(addressPayload)
          .eq('id_aluno', studentId);
        if (addrErr) throw addrErr;
      } else {
        const { error: addrErr } = await supabase
          .from('ALUNOS_ENDERECOS')
          .insert(addressPayload);
        if (addrErr) throw addrErr;
      }

      // 5. Update / Upsert ALUNOS_RESPONSAVEL
      if (finalGuardianName) {
        const respMesmoEnd = sameAddressAsStudent ? 'Sim' : 'Não';
        const finalRespCep = sameAddressAsStudent ? formData.cep : (formData.respCep || formData.cep);
        const finalRespStreet = sameAddressAsStudent ? formData.street : (formData.respStreet || formData.street);
        const finalRespNumber = sameAddressAsStudent ? formData.number : (formData.respNumber || formData.number);
        const finalRespComplement = sameAddressAsStudent ? formData.complement : (formData.respComplement || formData.complement);
        const finalRespNeighborhood = sameAddressAsStudent ? formData.neighborhood : (formData.respNeighborhood || formData.neighborhood);
        const finalRespCity = sameAddressAsStudent ? formData.city : (formData.respCity || formData.city);
        const finalRespState = sameAddressAsStudent ? formData.state : (formData.respState || formData.state);

        const effectiveMotherWhatsapp = (motherSameWhatsapp ? formData.motherPhone : formData.motherWhatsapp) || null;
        const effectiveFatherWhatsapp = (fatherSameWhatsapp ? formData.fatherPhone : formData.fatherWhatsapp) || null;
        const effectiveGuardianWhatsapp = (guardianSameWhatsapp ? finalGuardianPhone : finalGuardianWhatsapp) || null;

        const { error: respErr } = await supabase
          .from('ALUNOS_RESPONSAVEL')
          .upsert({
            id_aluno: studentId,
            nome_aluno: foundStudent.name,
            responsavel_aluno: respTipo,
            nome_responsavel_aluno: finalGuardianName,
            cpf_responsavel_aluno: finalGuardianCpf || null,
            celular_mae: formData.motherPhone || null,
            whatsapp_mae: effectiveMotherWhatsapp,
            celular_pai: formData.fatherPhone || null,
            whatsapp_pai: effectiveFatherWhatsapp,
            celular_responsavel: finalGuardianPhone || null,
            whatsapp_responsavel: effectiveGuardianWhatsapp,
            mesmo_end_responsavel_aluno: respMesmoEnd,
            cep_responsavel_aluno: finalRespCep,
            logradouro_responsavel_aluno: finalRespStreet?.split(' ')[0] || 'Rua',
            endereco_responsavel_aluno: finalRespStreet,
            numero_end_responsavel_aluno: finalRespNumber,
            complemento_end_responsavel_aluno: finalRespComplement,
            bairro_responsavel_aluno: finalRespNeighborhood,
            municipio_responsavel_aluno: finalRespCity,
            uf_responsavel_aluno: finalRespState,
          }, { onConflict: 'id_aluno' });

        if (respErr) throw respErr;
      }

      // 6. Update / Upsert ALUNOS_CONTATOS
      const { data: existingContatos } = await supabase
        .from('ALUNOS_CONTATOS')
        .select('dados_completos')
        .eq('id_aluno', studentId)
        .maybeSingle();

      const dadosCompletos = parseJson(existingContatos?.dados_completos);

      const effectiveMotherWhatsapp = (motherSameWhatsapp ? formData.motherPhone : formData.motherWhatsapp) || null;
      const effectiveFatherWhatsapp = (fatherSameWhatsapp ? formData.fatherPhone : formData.fatherWhatsapp) || null;
      const effectiveGuardianWhatsapp = (guardianSameWhatsapp ? finalGuardianPhone : finalGuardianWhatsapp) || null;

      if (formData.motherPhone) {
        dadosCompletos.tel_filiacao1_pessoal_numero = formData.motherPhone;
        dadosCompletos.tel_filiacao1_pessoal_tipo = 'Celular';
      }
      if (formData.fatherPhone) {
        dadosCompletos.tel_filiacao2_pessoal_numero = formData.fatherPhone;
        dadosCompletos.tel_filiacao2_pessoal_tipo = 'Celular';
      }
      if (finalGuardianPhone) {
        dadosCompletos.tel_responsavel_pessoal_numero = finalGuardianPhone;
        dadosCompletos.tel_responsavel_pessoal_tipo = 'Celular';
      }

      dadosCompletos.whatsapp_mae = effectiveMotherWhatsapp;
      dadosCompletos.whatsapp_pai = effectiveFatherWhatsapp;
      dadosCompletos.whatsapp_responsavel = effectiveGuardianWhatsapp;
      dadosCompletos.contatos_adicionais = formData.additionalContacts || [];

      const emailResponsavel = finalGuardianEmail || formData.motherEmail || formData.fatherEmail || null;

      const { error: contatosErr } = await supabase
        .from('ALUNOS_CONTATOS')
        .upsert({
          id_aluno: studentId,
          email_responsavel: emailResponsavel,
          whatsapp_mae: effectiveMotherWhatsapp,
          whatsapp_pai: effectiveFatherWhatsapp,
          whatsapp_responsavel: effectiveGuardianWhatsapp,
          contatos_adicionais: formData.additionalContacts || [],
          dados_completos: JSON.stringify(dadosCompletos)
        }, { onConflict: 'id_aluno' });

      if (contatosErr) throw contatosErr;

      setIsSuccess(true);
      setFoundStudent(null);
      // Mantém o aluno na lista da turma e marca em verde como salvo!
      setTurmaStudents(prev => prev.map(s => s.id_aluno === studentId ? { ...s, isSalvo: true } : s));
      setSelectedStudentId(String(studentId));
      resetAllFormState();
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (err) {
      console.error('Save error:', err);
      setError('Erro ao salvar informações. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const confirmCancel = window.confirm("Deseja realmente cancelar o preenchimento? Todos os dados não salvos serão perdidos.");
    if (confirmCancel) {
      setFoundStudent(null);
      setSelectedStudentId('');
      resetAllFormState();
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  const renderDifferentAddressFields = (title: string) => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="mt-6 pt-6 border-t border-gray-200 overflow-hidden"
    >
      <h5 className="text-sm font-bold text-[#0f254e] flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-[#3b5998]" />
        {title}
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="space-y-2 md:col-span-4">
          <label className="text-sm font-semibold text-gray-600">CEP do Responsável</label>
          <input
            type="text"
            maxLength={9}
            value={formData.respCep}
            onChange={handleRespCepChange}
            placeholder="00000-000"
            className={getFieldClass(formData.respCep)}
          />
        </div>
        <div className="space-y-2 md:col-span-8">
          <label className="text-sm font-semibold text-gray-600">Rua</label>
          <input
            type="text"
            value={formData.respStreet}
            onChange={(e) => setFormData({ ...formData, respStreet: e.target.value })}
            placeholder="Nome da rua / logradouro"
            className={getFieldClass(formData.respStreet)}
          />
        </div>
        <div className="space-y-2 md:col-span-3">
          <label className="text-sm font-semibold text-gray-600">Número</label>
          <input
            type="text"
            value={formData.respNumber}
            onChange={(e) => setFormData({ ...formData, respNumber: e.target.value })}
            placeholder="Nº"
            className={getFieldClass(formData.respNumber)}
          />
        </div>
        <div className="space-y-2 md:col-span-4">
          <label className="text-sm font-semibold text-gray-600">Complemento</label>
          <input
            type="text"
            value={formData.respComplement}
            onChange={(e) => setFormData({ ...formData, respComplement: e.target.value })}
            placeholder="Apto, Bloco, etc."
            className={getFieldClass(formData.respComplement)}
          />
        </div>
        <div className="space-y-2 md:col-span-5">
          <label className="text-sm font-semibold text-gray-600">Bairro</label>
          <input
            type="text"
            value={formData.respNeighborhood}
            onChange={(e) => setFormData({ ...formData, respNeighborhood: e.target.value })}
            placeholder="Bairro"
            className={getFieldClass(formData.respNeighborhood)}
          />
        </div>
        <div className="space-y-2 md:col-span-9">
          <label className="text-sm font-semibold text-gray-600">Cidade</label>
          <input
            type="text"
            value={formData.respCity}
            onChange={(e) => setFormData({ ...formData, respCity: e.target.value })}
            placeholder="Cidade"
            className={getFieldClass(formData.respCity)}
          />
        </div>
        <div className="space-y-2 md:col-span-3">
          <label className="text-sm font-semibold text-gray-600">UF</label>
          <input
            type="text"
            maxLength={2}
            value={formData.respState}
            onChange={(e) => setFormData({ ...formData, respState: e.target.value.toUpperCase() })}
            placeholder="UF"
            className={getFieldClass(formData.respState, "uppercase font-bold text-center")}
          />
        </div>
      </div>
    </motion.div>
  );

    const isInitialSearch = !foundStudent && !isSuccess && currentView === 'main';
  const isFullScreenView = !isAuthenticated || isInitialSearch || isSuccess;

  return (
    <div className={cn(
      "bg-[#F8F9FA] text-[#212529] font-sans selection:bg-blue-100 print:bg-white",
      isFullScreenView ? "h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between" : "min-h-screen"
    )}>
      {/* Header */}
      <header className={cn(
        "bg-[#3b5998] border-b border-[#2d4373] px-4 sticky top-0 z-30 shadow-sm text-white print:hidden shrink-0",
        isFullScreenView ? "py-2 sm:py-3" : "py-4 sm:py-5"
      )}>
        <div className="max-w-4xl mx-auto relative flex items-center justify-center">
          <h1 className={cn(
            "font-bold tracking-tight uppercase text-center",
            isFullScreenView ? "text-base sm:text-lg md:text-xl" : "text-xl sm:text-2xl"
          )}>
            EMEF Tarsila do Amaral
          </h1>

          {/* Botões no canto superior direito */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
            {/* Engrenagem para alternar Modo Edição (visível quando logado) */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={toggleEditMode}
                title={isEditMode ? "Modo Edição Ativado (Clique para desativar)" : "Ativar Modo Edição"}
                aria-label="Alternar Modo Edição"
                className={cn(
                  "p-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer",
                  isEditMode
                    ? "bg-yellow-400 text-yellow-950 shadow-md ring-2 ring-yellow-200 hover:bg-yellow-500"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                <Settings className="w-5 h-5" />
                {isEditMode && (
                  <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
                    Edição
                  </span>
                )}
              </button>
            )}

            {/* Botão Sair / Logout (visível quando logado) */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                title="Sair do sistema"
                aria-label="Sair"
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
                  Sair
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {currentView === 'saude' && foundStudent ? (
        <main className="max-w-4xl mx-auto py-8 px-4 ficha-saude-view no-scrollbar">
          <FichaSaude
            student={foundStudent}
            onBack={() => {
              setCurrentView('main');
              if (selectedTurmaKey) {
                fetchTurmaStudents(selectedTurmaKey, isEditMode);
              }
            }}
            onOpenFichaE={() => {
              setCurrentView('saudeE');
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }}
            isEditMode={isEditMode}
          />
        </main>
      ) : currentView === 'saudeE' && foundStudent ? (
        <main className="max-w-4xl mx-auto py-8 px-4 ficha-saude-view no-scrollbar">
          <FichaSaudeE
            student={foundStudent}
            onBack={() => {
              setCurrentView('saude');
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }}
            onBackToCadastro={() => {
              setCurrentView('main');
              if (selectedTurmaKey) {
                fetchTurmaStudents(selectedTurmaKey, isEditMode);
              }
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }}
            isEditMode={isEditMode}
          />
        </main>
      ) : (
        <main className={cn(
          "print:hidden w-full",
          isFullScreenView 
            ? "flex-1 min-h-0 flex items-center justify-center p-2 sm:p-4 max-w-5xl mx-auto overflow-hidden" 
            : "max-w-4xl mx-auto py-8 px-4"
        )}>
          <AnimatePresence mode="wait">
            {/* Tela 1: Login de Acesso */}
            {!isAuthenticated ? (
              <motion.div
                key="login-container"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl mx-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 md:gap-8 items-center w-full">
                  {/* Banner/Logo Image */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center text-center">
                    <img 
                      src={logoEmef} 
                      alt="EMEF Tarsila do Amaral Logo" 
                      className="max-h-24 sm:max-h-36 md:max-h-56 lg:max-h-64 w-auto object-contain rounded-2xl shadow-xl border-4 border-white ring-1 ring-gray-100 transition-transform hover:scale-[1.02] duration-300"
                      onError={(e) => {
                        console.error("Erro ao carregar a logo:", e);
                      }}
                    />
                  </div>

                  {/* Login Card */}
                  <div className="md:col-span-7 bg-white rounded-2xl p-4 sm:p-6 md:p-7 shadow-xl border border-gray-100 flex flex-col justify-center">
                    <div className="text-center md:text-left mb-3 sm:mb-4">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#3b5998] tracking-tight">
                        Acesso ao Sistema
                      </h2>
                      <p className="text-gray-600 mt-1 text-xs sm:text-sm">
                        Informe seu usuário e senha para acessar o <strong>Cadastro de Alunos</strong>
                      </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                      <div className="space-y-1 text-left">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                          Usuário
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={loginUser}
                            onChange={(e) => setLoginUser(e.target.value)}
                            placeholder="Digite o usuário"
                            autoComplete="username"
                            className="w-full pl-10 sm:pl-11 pr-3 py-2 sm:py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3b5998] focus:border-transparent transition-all outline-none text-sm sm:text-base text-gray-800"
                            required
                          />
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                          Senha
                        </label>
                        <div className="relative">
                          <input
                            type={showLoginPassword ? "text" : "password"}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Digite a senha"
                            autoComplete="current-password"
                            className="w-full pl-10 sm:pl-11 pr-11 py-2 sm:py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3b5998] focus:border-transparent transition-all outline-none text-sm sm:text-base text-gray-800"
                            required
                          />
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition-colors"
                            title={showLoginPassword ? "Ocultar senha" : "Exibir senha"}
                          >
                            {showLoginPassword ? (
                              <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                            ) : (
                              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white font-bold py-2.5 sm:py-3 md:py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base mt-2 cursor-pointer"
                      >
                        <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Entrar no Sistema</span>
                      </button>
                    </form>

                    {loginError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-red-600 text-left text-xs sm:text-sm"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p className="font-medium">{loginError}</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : !foundStudent && !isSuccess ? (
              /* Tela 2: Seleção de Turma e Aluno */
              <motion.div
                key="student-select-container"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl mx-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 md:gap-8 items-center w-full">
                  {/* Banner/Logo Image */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center text-center">
                    <img 
                      src={logoEmef} 
                      alt="EMEF Tarsila do Amaral Logo" 
                      className="max-h-24 sm:max-h-36 md:max-h-56 lg:max-h-64 w-auto object-contain rounded-2xl shadow-xl border-4 border-white ring-1 ring-gray-100 transition-transform hover:scale-[1.02] duration-300"
                      onError={(e) => {
                        console.error("Erro ao carregar a logo:", e);
                      }}
                    />
                  </div>

                  {/* Form Card */}
                  <div className="md:col-span-7 bg-white rounded-2xl p-4 sm:p-6 md:p-7 shadow-xl border border-gray-100 flex flex-col justify-center">
                    <div className="text-center md:text-left mb-3 sm:mb-4">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#3b5998] tracking-tight">Cadastro de Alunos</h2>
                      <p className="text-gray-600 mt-1 text-xs sm:text-sm">
                        Selecione a <strong>série e turma</strong> e em seguida escolha o <strong>aluno</strong> para acessar o cadastro
                      </p>
                    </div>

                    <form onSubmit={handleAccessStudent} className="space-y-3 sm:space-y-4">
                      {/* Dropdown 1: Série e Turma */}
                      <div className="space-y-1 text-left">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                          Série e Turma
                        </label>
                        <div className="relative">
                          <select
                            value={selectedTurmaKey}
                            onChange={handleTurmaChange}
                            className="w-full pl-10 sm:pl-11 pr-8 py-2 sm:py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3b5998] focus:border-transparent transition-all outline-none text-sm sm:text-base text-gray-800 appearance-none cursor-pointer"
                            required
                          >
                            <option value="">Selecione uma turma...</option>
                            {turmasList.map((t) => (
                              <option key={t.key} value={t.key}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                          <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                        </div>
                      </div>

                      {/* Dropdown 2: Nome do Aluno */}
                      <div className="space-y-1 text-left">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                          Nome Completo do Aluno
                        </label>
                        <div className="relative">
                          <select
                            value={selectedStudentId}
                            onChange={(e) => {
                              setSelectedStudentId(e.target.value);
                              setError(null);
                            }}
                            disabled={!selectedTurmaKey || isLoadingStudents}
                            className="w-full pl-10 sm:pl-11 pr-8 py-2 sm:py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3b5998] focus:border-transparent transition-all outline-none text-sm sm:text-base text-gray-800 appearance-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
                            required
                          >
                            <option value="">
                              {isLoadingStudents
                                ? 'Carregando lista de alunos...'
                                : !selectedTurmaKey
                                ? 'Primeiro selecione a turma acima'
                                : turmaStudents.length === 0
                                ? 'Nenhum aluno encontrado nesta turma'
                                : 'Selecione o aluno...'}
                            </option>
                            {turmaStudents.map((st) => (
                              <option
                                key={st.id_aluno}
                                value={st.id_aluno}
                                className={st.isSalvo ? "text-emerald-700 font-bold bg-emerald-50" : ""}
                                style={st.isSalvo ? { color: '#047857', fontWeight: 700, backgroundColor: '#ecfdf5' } : undefined}
                              >
                                {st.isSalvo ? `🟢 ${st.nome_aluno} (Salvo)` : st.nome_aluno}
                              </option>
                            ))}
                          </select>
                          {isLoadingStudents ? (
                            <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3b5998] w-4 h-4 sm:w-5 sm:h-5 animate-spin pointer-events-none" />
                          ) : (
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                          )}
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                        </div>

                        {selectedStudentId && (() => {
                          const currentSelected = turmaStudents.find(s => String(s.id_aluno) === selectedStudentId);
                          if (!currentSelected) return null;
                          return (
                            <div className={cn(
                              "mt-2 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border transition-all",
                              currentSelected.isSalvo 
                                ? "bg-emerald-50 border-emerald-300 text-emerald-900" 
                                : "bg-amber-50 border-amber-200 text-amber-900"
                            )}>
                              <div className="flex items-center gap-2">
                                {currentSelected.isSalvo ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Cadastro <strong>já salvo</strong>. Pode ser aberto para alterações e novas atualizações.</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Cadastro <strong>pendente de validação/salvamento</strong>.</span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {selectedTurmaKey && turmaStudents.length > 0 && (
                          <div className="mt-2.5 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs flex items-center justify-between text-gray-700">
                            <div className="flex items-center gap-1.5 font-medium">
                              <span>Alunos da Turma:</span>
                              <span className="font-bold text-gray-900">
                                {turmaStudents.filter(s => s.isSalvo).length} de {turmaStudents.length} salvos
                              </span>
                            </div>
                            <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                              {Math.round((turmaStudents.filter(s => s.isSalvo).length / turmaStudents.length) * 100)}% concluído
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <button
                        type="submit"
                        disabled={!selectedStudentId || isSearching}
                        className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white font-bold py-2.5 sm:py-3 md:py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base mt-2 cursor-pointer"
                      >
                        {isSearching ? (
                          <>
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            <span>Carregando dados do aluno...</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>
                              {turmaStudents.find(s => String(s.id_aluno) === selectedStudentId)?.isSalvo
                                ? 'Abrir / Atualizar Cadastro do Aluno'
                                : 'Acessar Cadastro do Aluno'}
                            </span>
                          </>
                        )}
                      </button>
                    </form>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-red-600 text-left text-xs sm:text-sm"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p className="font-medium">{error}</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : null}

          {foundStudent && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <div className="bg-[#3b5998] p-8 relative rounded-t-2xl">
                <button 
                  onClick={() => {
                    setFoundStudent(null);
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  }}
                  className="text-white/70 hover:text-white text-sm underline absolute right-8 top-8"
                >
                  Voltar
                </button>
                <div className="flex flex-col items-center mb-6">
                  <span className="text-white/80 text-xs font-bold uppercase tracking-wider">
                    Nome Completo
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-white mt-1 uppercase text-center">{foundStudent.name}</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6">
                  <div className="bg-white/10 border border-white/20 rounded-xl p-3 sm:p-4 text-center shadow-sm backdrop-blur-sm flex flex-col justify-center min-h-[92px]">
                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider block mb-1">Ano/Turma</span>
                    <span className="text-lg sm:text-xl font-black text-white">{foundStudent.class || '-'}</span>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-xl p-3 sm:p-4 text-center shadow-sm backdrop-blur-sm flex flex-col justify-center min-h-[92px]">
                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider block mb-1">Período</span>
                    <span className="text-lg sm:text-xl font-black text-white">{foundStudent.period || '-'}</span>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-xl p-3 sm:p-4 text-center shadow-sm backdrop-blur-sm flex flex-col justify-center min-h-[92px]">
                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider block mb-1">Data de Nascimento</span>
                    <span className="text-lg sm:text-xl font-black text-white">
                      {foundStudent.birthDate ? new Date(foundStudent.birthDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                    </span>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-xl p-3 sm:p-4 text-center shadow-sm backdrop-blur-sm flex flex-col items-center justify-center min-h-[92px]">
                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider block mb-1">Status DVA (Vacina)</span>
                    {(() => {
                      const status = (foundStudent.dvaStatus || '').toLowerCase();
                      const isEmDia = status.includes('dia');
                      const isEmAtraso = status.includes('atraso');

                      if (isEmDia) {
                        return (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-sm tracking-wide">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-white" />
                              EM DIA
                            </span>
                            {foundStudent.dvaDataRetorno ? (
                              <span className="text-[10px] font-semibold text-emerald-200 mt-1">
                                Retorno: {foundStudent.dvaDataRetorno}
                              </span>
                            ) : (
                              <span className="text-[10px] text-white/70 mt-1">Regular</span>
                            )}
                          </div>
                        );
                      } else if (isEmAtraso) {
                        return (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm tracking-wide">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-white" />
                              EM ATRASO
                            </span>
                            {foundStudent.dvaDataRetorno ? (
                              <span className="text-[10px] font-semibold text-rose-200 mt-1">
                                Retorno: {foundStudent.dvaDataRetorno}
                              </span>
                            ) : (
                              <span className="text-[10px] text-white/70 mt-1">Irregular</span>
                            )}
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-sm tracking-wide">
                              <Clock className="w-3.5 h-3.5 shrink-0 text-white" />
                              {foundStudent.dvaStatus ? foundStudent.dvaStatus.toUpperCase() : 'PENDENTE'}
                            </span>
                            <span className="text-[10px] text-white/70 mt-1">
                              {foundStudent.dvaDataRetorno ? `Retorno: ${foundStudent.dvaDataRetorno}` : 'Não entregue'}
                            </span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* Banner de Irmãos / Vínculo Familiar */}
                {siblings && siblings.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#3b5998] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-[#0f254e] text-base">
                            Irmãos Matriculados na Escola ({siblings.length})
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#3b5998]">
                            Grupo Familiar Vinculado
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Identificamos que este(a) aluno(a) possui irmão(s) com cadastro vinculado na escola:
                        </p>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {siblings.map((sib) => (
                            <div key={sib.id} className="bg-white/95 border border-blue-100 rounded-xl p-3 shadow-xs flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#3b5998] flex items-center justify-center font-bold text-xs shrink-0">
                                {sib.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate" title={sib.name}>{sib.name}</p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {sib.grade ? `${sib.grade.replace('°', 'º')} ${sib.class || ''}` : 'Turma ativa'} {sib.period ? `• ${sib.period}` : ''}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Aluno Info */}
                <section>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-[#0f254e]">
                    <User className="w-5 h-5 text-[#3b5998]" />
                    Informações do Aluno
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="space-y-2 md:col-span-6">
                      <label className="text-sm font-semibold text-gray-600">Gênero</label>
                      <select
                        required
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className={getFieldClass(formData.gender, "appearance-none")}
                      >
                        <option value="" disabled>Selecione...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-6">
                      <label className="text-sm font-semibold text-gray-600">Autodeclaração de Raça/Cor</label>
                      <select
                        required
                        value={formData.race}
                        onChange={(e) => setFormData({ ...formData, race: e.target.value })}
                        className={getFieldClass(formData.race, "appearance-none")}
                      >
                        <option value="" disabled>Selecione...</option>
                        <option value="Branca">Branca</option>
                        <option value="Preta">Preta</option>
                        <option value="Parda">Parda</option>
                        <option value="Amarela">Amarela</option>
                        <option value="Indígena">Indígena</option>
                        <option value="Não Declarado">Não Declarado</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Documentos do Aluno */}
                <section className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-[#0f254e]">
                      <FileText className="w-5 h-5 text-[#3b5998]" />
                      Documentos do Aluno
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-md shadow-sm">
                      Tabela ALUNOS_DOCUMENTOS
                    </span>
                  </div>

                  {/* Grupo 1: RG e CPF */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <h4 className="text-sm font-bold text-[#3b5998] uppercase tracking-wider">
                        {formData.possuiCin ? 'CPF e CIN' : 'RG e CPF'}
                      </h4>
                      <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0f254e] bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 px-3 py-1.5 rounded-xl cursor-pointer select-none transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.possuiCin}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              possuiCin: checked
                            }));
                          }}
                          className="w-4 h-4 rounded text-[#3b5998] focus:ring-[#3b5998] cursor-pointer"
                        />
                        <span>Aluno possui apenas CIN (Carteira de Identidade Nacional - sem RG)</span>
                      </label>
                    </div>

                    {formData.possuiCin ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">
                            CPF
                          </label>
                          <input
                            type="text"
                            value={formData.cpf}
                            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                            placeholder="000.000.000-00"
                            className={getFieldClass(formData.cpf)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">
                            Data de Emissão do CIN
                          </label>
                          <input
                            type="date"
                            value={formData.rgDate ? formData.rgDate.split('T')[0] : ''}
                            onChange={(e) => setFormData({ ...formData, rgDate: e.target.value })}
                            className={getFieldClass(formData.rgDate)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-700">
                            CPF
                          </label>
                          <input
                            type="text"
                            value={formData.cpf}
                            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                            placeholder="000.000.000-00"
                            className={getFieldClass(formData.cpf)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-3">
                          <label className="text-sm font-semibold text-gray-700">
                            RG
                          </label>
                          <input
                            type="text"
                            value={formData.rg}
                            onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                            placeholder="00.000.000"
                            className={getFieldClass(formData.rg)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-1">
                          <label className="text-sm font-semibold text-gray-700">
                            Dígito
                          </label>
                          <input
                            type="text"
                            value={formData.rgDigit}
                            onChange={(e) => setFormData({ ...formData, rgDigit: e.target.value.toUpperCase() })}
                            placeholder="X"
                            maxLength={2}
                            className={getFieldClass(
                              formData.rgDigit,
                              "px-3 text-center font-bold uppercase"
                            )}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-1">
                          <label className="text-sm font-semibold text-gray-700">
                            UF RG
                          </label>
                          <input
                            type="text"
                            value={formData.rgUf}
                            onChange={(e) => setFormData({ ...formData, rgUf: e.target.value.toUpperCase() })}
                            placeholder="SP"
                            maxLength={2}
                            className={getFieldClass(
                              formData.rgUf,
                              "px-2 text-center uppercase font-bold"
                            )}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-3">
                          <label className="text-sm font-semibold text-gray-700">
                            Órgão Emissor
                          </label>
                          <input
                            type="text"
                            value={formData.rgOrgao}
                            onChange={(e) => setFormData({ ...formData, rgOrgao: e.target.value.toUpperCase() })}
                            placeholder="Ex: SSP, Policia Civil"
                            className={getFieldClass(
                              formData.rgOrgao,
                              "uppercase"
                            )}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-700">
                            Data de Emissão do RG
                          </label>
                          <input
                            type="date"
                            value={formData.rgDate ? formData.rgDate.split('T')[0] : ''}
                            onChange={(e) => setFormData({ ...formData, rgDate: e.target.value })}
                            className={getFieldClass(formData.rgDate)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Grupo 2: Certidão de Registro Civil */}
                  <div className="pt-4 border-t border-slate-200/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <h4 className="text-sm font-bold text-[#3b5998] uppercase tracking-wider">
                        Certidão de Registro Civil
                      </h4>
                      <div className="flex items-center gap-4 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                        <span className="text-xs font-semibold text-gray-600">Modelo da Certidão:</span>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700">
                          <input
                            type="radio"
                            name="certidaoModelo"
                            value="Novo"
                            checked={formData.certidaoModelo === 'Novo'}
                            onChange={() => setFormData({ ...formData, certidaoModelo: 'Novo' })}
                            className="text-[#3b5998] focus:ring-[#3b5998]"
                          />
                          Novo (com Matrícula)
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700">
                          <input
                            type="radio"
                            name="certidaoModelo"
                            value="Antigo"
                            checked={formData.certidaoModelo === 'Antigo'}
                            onChange={() => setFormData({ ...formData, certidaoModelo: 'Antigo' })}
                            className="text-[#3b5998] focus:ring-[#3b5998]"
                          />
                          Antigo (Termo/Livro/Folha)
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="space-y-2 md:col-span-4">
                        <label className="text-sm font-semibold text-gray-700">Tipo de Certidão</label>
                        <select
                          value={formData.certidaoTipo}
                          onChange={(e) => setFormData({ ...formData, certidaoTipo: e.target.value })}
                          className={getFieldClass(formData.certidaoTipo)}
                        >
                          <option value="Certidão de Nascimento">Certidão de Nascimento</option>
                          <option value="Certidão de Casamento">Certidão de Casamento</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>

                      {formData.certidaoModelo === 'Novo' ? (
                        <div className="space-y-2 md:col-span-8">
                          <label className="text-sm font-semibold text-gray-700">
                            Número da Matrícula (32 dígitos)
                          </label>
                          <input
                            type="text"
                            value={formData.certidaoMatricula}
                            onChange={(e) => setFormData({ ...formData, certidaoMatricula: e.target.value })}
                            placeholder="000000 00 00 0000 0 00000 000 0000000 00"
                            maxLength={40}
                            className={getFieldClass(formData.certidaoMatricula, "font-mono tracking-wide")}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2 md:col-span-3">
                            <label className="text-sm font-semibold text-gray-700">Termo / Número</label>
                            <input
                              type="text"
                              value={formData.certidaoNumero}
                              onChange={(e) => setFormData({ ...formData, certidaoNumero: e.target.value })}
                              placeholder="Número do termo"
                              className={getFieldClass(formData.certidaoNumero)}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-gray-700">Livro</label>
                            <input
                              type="text"
                              value={formData.certidaoLivro}
                              onChange={(e) => setFormData({ ...formData, certidaoLivro: e.target.value })}
                              placeholder="Livro"
                              className={getFieldClass(formData.certidaoLivro)}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-3">
                            <label className="text-sm font-semibold text-gray-700">Folha</label>
                            <input
                              type="text"
                              value={formData.certidaoFolha}
                              onChange={(e) => setFormData({ ...formData, certidaoFolha: e.target.value })}
                              placeholder="Folha"
                              className={getFieldClass(formData.certidaoFolha)}
                            />
                          </div>
                        </>
                      )}

                      <div className="space-y-2 md:col-span-6">
                        <label className="text-sm font-semibold text-gray-700">Nome do Cartório</label>
                        <input
                          type="text"
                          value={formData.certidaoCartorio}
                          onChange={(e) => setFormData({ ...formData, certidaoCartorio: e.target.value })}
                          placeholder="Ex: Oficial de Registro Civil das Pessoas Naturais"
                          className={getFieldClass(formData.certidaoCartorio)}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-6">
                        <label className="text-sm font-semibold text-gray-700">Distrito / Subdistrito</label>
                        <input
                          type="text"
                          value={formData.certidaoDistrito}
                          onChange={(e) => setFormData({ ...formData, certidaoDistrito: e.target.value })}
                          placeholder="Ex: Butantã, Santo Amaro, etc."
                          className={getFieldClass(formData.certidaoDistrito)}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-5">
                        <label className="text-sm font-semibold text-gray-700">Município da Certidão</label>
                        <input
                          type="text"
                          value={formData.certidaoMunicipio}
                          onChange={(e) => setFormData({ ...formData, certidaoMunicipio: e.target.value })}
                          placeholder="Município onde foi registrada"
                          className={getFieldClass(formData.certidaoMunicipio)}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700">UF Certidão</label>
                        <input
                          type="text"
                          value={formData.certidaoUf}
                          onChange={(e) => setFormData({ ...formData, certidaoUf: e.target.value.toUpperCase() })}
                          placeholder="SP"
                          maxLength={2}
                          className={getFieldClass(formData.certidaoUf, "px-2 text-center uppercase font-bold")}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-5">
                        <label className="text-sm font-semibold text-gray-700">Data de Emissão da Certidão</label>
                        <input
                          type="date"
                          value={formData.certidaoDataEmissao ? formData.certidaoDataEmissao.split('T')[0] : ''}
                          onChange={(e) => setFormData({ ...formData, certidaoDataEmissao: e.target.value })}
                          className={getFieldClass(formData.certidaoDataEmissao)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Grupo 3: Cadastros Sociais e Saúde */}
                  <div className="pt-4 border-t border-slate-200/80">
                    <h4 className="text-sm font-bold text-[#3b5998] uppercase tracking-wider mb-3">
                      Outros Cadastros (SUS, NIS, RNE)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="space-y-2 md:col-span-4">
                        <label className="text-sm font-semibold text-gray-700">Cartão SUS (CNS)</label>
                        <input
                          type="text"
                          value={formData.cnsSus}
                          onChange={(e) => setFormData({ ...formData, cnsSus: e.target.value })}
                          placeholder="000 0000 0000 0000"
                          className={getFieldClass(formData.cnsSus, "font-mono")}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-4">
                        <label className="text-sm font-semibold text-gray-700">NIS / PIS</label>
                        <input
                          type="text"
                          value={formData.nis}
                          onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                          placeholder="000.00000.00-0"
                          className={getFieldClass(formData.nis, "font-mono")}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-4">
                        <label className="text-sm font-semibold text-gray-700">RNE / CRNM (Estrangeiro)</label>
                        <input
                          type="text"
                          value={formData.rne}
                          onChange={(e) => setFormData({ ...formData, rne: e.target.value })}
                          placeholder="Registro Nacional de Estrangeiro"
                          className={getFieldClass(formData.rne)}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Endereço Info */}
                <section>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-[#0f254e]">
                    <MapPin className="w-5 h-5 text-[#3b5998]" />
                    Endereço Residencial
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="space-y-2 md:col-span-4">
                      <label className="text-sm font-semibold text-gray-600">CEP</label>
                      <input
                        type="text"
                        required
                        maxLength={9}
                        value={formData.cep}
                        onChange={handleCepChange}
                        placeholder="00000-000"
                        className={getFieldClass(formData.cep)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-8">
                      <label className="text-sm font-semibold text-gray-600">Rua</label>
                      <input
                        type="text"
                        required
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        className={getFieldClass(formData.street)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <label className="text-sm font-semibold text-gray-600">Número</label>
                      <input
                        type="text"
                        required
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        className={getFieldClass(formData.number)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-4">
                      <label className="text-sm font-semibold text-gray-600">Complemento</label>
                      <input
                        type="text"
                        value={formData.complement}
                        onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                        placeholder="Apto, Bloco, etc."
                        className={getFieldClass(formData.complement)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-5">
                      <label className="text-sm font-semibold text-gray-600">Bairro</label>
                      <input
                        type="text"
                        required
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        className={getFieldClass(formData.neighborhood)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-9">
                      <label className="text-sm font-semibold text-gray-600">Cidade</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className={getFieldClass(formData.city)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <label className="text-sm font-semibold text-gray-600">UF</label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                        className={getFieldClass(formData.state, "uppercase font-bold text-center")}
                      />
                    </div>
                  </div>
                </section>

                {/* Responsáveis Info */}
                <section>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-[#0f254e]">
                    <User className="w-5 h-5 text-[#3b5998]" />
                    Informações dos Responsáveis
                  </h3>
                  
                  <div className="space-y-6">
                    {/* 1. Dados da Mãe */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 flex-wrap">
                        <h4 className="font-bold text-[#3b5998]">Dados da Mãe</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                            <input
                              type="checkbox"
                              checked={isMotherMain}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setIsMotherMain(checked);
                                if (checked) {
                                  setIsFatherMain(false);
                                }
                              }}
                              className="rounded border-gray-300 text-[#3b5998] focus:ring-[#3b5998] w-4 h-4"
                            />
                            <span className="font-medium">É a responsável principal</span>
                          </label>

                          <AnimatePresence>
                            {isMotherMain && (
                              <motion.label
                                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-blue-50/70 px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm hover:bg-blue-100/70 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={sameAddressAsStudent}
                                  onChange={(e) => setSameAddressAsStudent(e.target.checked)}
                                  className="rounded border-blue-300 text-[#3b5998] focus:ring-[#3b5998] w-4 h-4"
                                />
                                <span className="font-medium text-[#0f254e]">O endereço é o mesmo do aluno</span>
                              </motion.label>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="space-y-2 md:col-span-8">
                          <label className="text-sm font-semibold text-gray-600">Nome da Mãe</label>
                          <input
                            type="text"
                            value={formData.motherName}
                            onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                            placeholder="Nome completo da mãe"
                            className={getFieldClass(formData.motherName)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">CPF da Mãe</label>
                          <input
                            type="text"
                            value={formData.motherCpf}
                            onChange={(e) => setFormData({ ...formData, motherCpf: e.target.value })}
                            placeholder="000.000.000-00"
                            className={getFieldClass(formData.motherCpf)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">Telefone Celular</label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={formData.motherPhone}
                              onChange={(e) => {
                                const val = maskPhone(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  motherPhone: val,
                                  motherWhatsapp: motherSameWhatsapp ? val : prev.motherWhatsapp
                                }));
                              }}
                              placeholder="(00) 00000-0000"
                              className={getFieldClass(formData.motherPhone, "pl-10 pr-4")}
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-600">WhatsApp</label>
                            <label className="inline-flex items-center gap-1.5 text-xs text-[#3b5998] font-semibold cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={motherSameWhatsapp}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setMotherSameWhatsapp(checked);
                                  if (checked) {
                                    setFormData(prev => ({ ...prev, motherWhatsapp: prev.motherPhone }));
                                  }
                                }}
                                className="rounded border-gray-300 text-[#3b5998] focus:ring-[#3b5998] w-3.5 h-3.5 cursor-pointer"
                              />
                              <span>Mesmo do celular</span>
                            </label>
                          </div>
                          <div className="relative">
                            <input
                              type="tel"
                              disabled={motherSameWhatsapp}
                              value={motherSameWhatsapp ? formData.motherPhone : formData.motherWhatsapp}
                              onChange={(e) => setFormData({ ...formData, motherWhatsapp: maskPhone(e.target.value) })}
                              placeholder="(00) 00000-0000"
                              className={getFieldClass(
                                motherSameWhatsapp ? formData.motherPhone : formData.motherWhatsapp,
                                cn("pl-10 pr-4", motherSameWhatsapp && "bg-gray-100/80 text-gray-600 cursor-not-allowed")
                              )}
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">E-mail</label>
                          <div className="relative">
                            <input
                              type="email"
                              value={formData.motherEmail}
                              onChange={(e) => setFormData({ ...formData, motherEmail: e.target.value })}
                              placeholder="exemplo@email.com"
                              className={getFieldClass(formData.motherEmail, "pl-10 pr-4")}
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isMotherMain && !sameAddressAsStudent && renderDifferentAddressFields("Endereço da Mãe (Diferente do Aluno)")}
                      </AnimatePresence>
                    </div>

                    {/* 2. Dados do Pai */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 flex-wrap">
                        <h4 className="font-bold text-[#3b5998]">Dados do Pai</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                            <input
                              type="checkbox"
                              checked={isFatherMain}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setIsFatherMain(checked);
                                if (checked) {
                                  setIsMotherMain(false);
                                }
                              }}
                              className="rounded border-gray-300 text-[#3b5998] focus:ring-[#3b5998] w-4 h-4"
                            />
                            <span className="font-medium">É o responsável principal</span>
                          </label>

                          <AnimatePresence>
                            {isFatherMain && (
                              <motion.label
                                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-blue-50/70 px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm hover:bg-blue-100/70 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={sameAddressAsStudent}
                                  onChange={(e) => setSameAddressAsStudent(e.target.checked)}
                                  className="rounded border-blue-300 text-[#3b5998] focus:ring-[#3b5998] w-4 h-4"
                                />
                                <span className="font-medium text-[#0f254e]">O endereço é o mesmo do aluno</span>
                              </motion.label>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="space-y-2 md:col-span-8">
                          <label className="text-sm font-semibold text-gray-600">Nome do Pai</label>
                          <input
                            type="text"
                            value={formData.fatherName}
                            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                            placeholder="Nome completo do pai"
                            className={getFieldClass(formData.fatherName)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">CPF do Pai</label>
                          <input
                            type="text"
                            value={formData.fatherCpf}
                            onChange={(e) => setFormData({ ...formData, fatherCpf: e.target.value })}
                            placeholder="000.000.000-00"
                            className={getFieldClass(formData.fatherCpf)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">Telefone Celular</label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={formData.fatherPhone}
                              onChange={(e) => {
                                const val = maskPhone(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  fatherPhone: val,
                                  fatherWhatsapp: fatherSameWhatsapp ? val : prev.fatherWhatsapp
                                }));
                              }}
                              placeholder="(00) 00000-0000"
                              className={getFieldClass(formData.fatherPhone, "pl-10 pr-4")}
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-600">WhatsApp</label>
                            <label className="inline-flex items-center gap-1.5 text-xs text-[#3b5998] font-semibold cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={fatherSameWhatsapp}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setFatherSameWhatsapp(checked);
                                  if (checked) {
                                    setFormData(prev => ({ ...prev, fatherWhatsapp: prev.fatherPhone }));
                                  }
                                }}
                                className="rounded border-gray-300 text-[#3b5998] focus:ring-[#3b5998] w-3.5 h-3.5 cursor-pointer"
                              />
                              <span>Mesmo do celular</span>
                            </label>
                          </div>
                          <div className="relative">
                            <input
                              type="tel"
                              disabled={fatherSameWhatsapp}
                              value={fatherSameWhatsapp ? formData.fatherPhone : formData.fatherWhatsapp}
                              onChange={(e) => setFormData({ ...formData, fatherWhatsapp: maskPhone(e.target.value) })}
                              placeholder="(00) 00000-0000"
                              className={getFieldClass(
                                fatherSameWhatsapp ? formData.fatherPhone : formData.fatherWhatsapp,
                                cn("pl-10 pr-4", fatherSameWhatsapp && "bg-gray-100/80 text-gray-600 cursor-not-allowed")
                              )}
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">E-mail</label>
                          <div className="relative">
                            <input
                              type="email"
                              value={formData.fatherEmail}
                              onChange={(e) => setFormData({ ...formData, fatherEmail: e.target.value })}
                              placeholder="exemplo@email.com"
                              className={getFieldClass(formData.fatherEmail, "pl-10 pr-4")}
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isFatherMain && !sameAddressAsStudent && renderDifferentAddressFields("Endereço do Pai (Diferente do Aluno)")}
                      </AnimatePresence>
                    </div>

                    {/* 3. Dados do Responsável (Aparece SOMENTE se nem a mãe nem o pai estiverem marcados como responsável) */}
                    <AnimatePresence>
                      {!isMotherMain && !isFatherMain && (
                        <motion.div
                          key="outro-responsavel"
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          transition={{ duration: 0.25 }}
                          className="bg-amber-50/70 p-6 rounded-xl border border-amber-200/80 shadow-sm overflow-hidden"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 flex-wrap">
                            <div>
                              <h4 className="font-bold text-[#3b5998] text-base">Responsável Principal (Outro Responsável)</h4>
                              <p className="text-xs text-gray-600 mt-1">
                                Preencha os dados do responsável legal (ex: avó, avô, tio, tia, tutor legal).
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
                              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-amber-300 shadow-sm hover:bg-amber-50 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={sameAddressAsStudent}
                                  onChange={(e) => setSameAddressAsStudent(e.target.checked)}
                                  className="rounded border-amber-300 text-[#3b5998] focus:ring-[#3b5998] w-4 h-4"
                                />
                                <span className="font-medium text-[#0f254e]">O endereço é o mesmo do aluno</span>
                              </label>
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
                                Outro Responsável
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="space-y-2 md:col-span-8">
                              <label className="text-sm font-semibold text-gray-700">Nome do Responsável</label>
                              <input
                                type="text"
                                required={!isMotherMain && !isFatherMain}
                                value={formData.guardianName}
                                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                                placeholder="Nome completo do responsável legal"
                                className={getFieldClass(formData.guardianName)}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-4">
                              <label className="text-sm font-semibold text-gray-700">CPF do Responsável</label>
                              <input
                                type="text"
                                required={!isMotherMain && !isFatherMain}
                                value={formData.guardianCpf}
                                onChange={(e) => setFormData({ ...formData, guardianCpf: e.target.value })}
                                placeholder="000.000.000-00"
                                className={getFieldClass(formData.guardianCpf)}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-4">
                              <label className="text-sm font-semibold text-gray-700">Telefone Celular</label>
                              <div className="relative">
                                <input
                                  type="tel"
                                  required={!isMotherMain && !isFatherMain}
                                  value={formData.guardianPhone}
                                  onChange={(e) => {
                                    const val = maskPhone(e.target.value);
                                    setFormData(prev => ({
                                      ...prev,
                                      guardianPhone: val,
                                      guardianWhatsapp: guardianSameWhatsapp ? val : prev.guardianWhatsapp
                                    }));
                                  }}
                                  placeholder="(00) 00000-0000"
                                  className={getFieldClass(formData.guardianPhone, "pl-10 pr-4")}
                                />
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                              </div>
                            </div>
                            <div className="space-y-2 md:col-span-4">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-700">WhatsApp</label>
                                <label className="inline-flex items-center gap-1.5 text-xs text-[#3b5998] font-semibold cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={guardianSameWhatsapp}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setGuardianSameWhatsapp(checked);
                                      if (checked) {
                                        setFormData(prev => ({ ...prev, guardianWhatsapp: prev.guardianPhone }));
                                      }
                                    }}
                                    className="rounded border-gray-300 text-[#3b5998] focus:ring-[#3b5998] w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <span>Mesmo do celular</span>
                                </label>
                              </div>
                              <div className="relative">
                                <input
                                  type="tel"
                                  disabled={guardianSameWhatsapp}
                                  required={!isMotherMain && !isFatherMain && !guardianSameWhatsapp}
                                  value={guardianSameWhatsapp ? formData.guardianPhone : formData.guardianWhatsapp}
                                  onChange={(e) => setFormData({ ...formData, guardianWhatsapp: maskPhone(e.target.value) })}
                                  placeholder="(00) 00000-0000"
                                  className={getFieldClass(
                                    guardianSameWhatsapp ? formData.guardianPhone : formData.guardianWhatsapp,
                                    cn("pl-10 pr-4", guardianSameWhatsapp && "bg-gray-100/80 text-gray-600 cursor-not-allowed")
                                  )}
                                />
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                              </div>
                            </div>
                            <div className="space-y-2 md:col-span-4">
                              <label className="text-sm font-semibold text-gray-700">E-mail</label>
                              <div className="relative">
                                <input
                                  type="email"
                                  value={formData.guardianEmail}
                                  onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                                  placeholder="exemplo@email.com"
                                  className={getFieldClass(formData.guardianEmail, "pl-10 pr-4")}
                                />
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {!sameAddressAsStudent && renderDifferentAddressFields("Endereço do Responsável (Diferente do Aluno)")}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* 4. Outros Contatos / Telefones de Emergência Adicionais (Sem ser Mãe, Pai ou Responsável) */}
                    <div className="bg-slate-50/80 p-5 sm:p-6 rounded-xl border border-slate-200 mt-4 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                        <div>
                          <h4 className="font-bold text-[#3b5998] flex items-center gap-2 text-sm sm:text-base">
                            <Users className="w-4 h-4" />
                            Outros Contatos e Pessoas Autorizadas
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Adicione outros contatos para avisos ou emergências (avós, tios, vizinhos, cuidadores).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newContact: AdditionalContact = {
                              id: Date.now().toString(),
                              name: '',
                              relationship: '',
                              phone: '',
                              whatsapp: '',
                              sameWhatsapp: true
                            };
                            setFormData(prev => ({
                              ...prev,
                              additionalContacts: [...(prev.additionalContacts || []), newContact]
                            }));
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#3b5998] hover:bg-[#2d4373] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer self-start sm:self-center shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Adicionar Outro Contato</span>
                        </button>
                      </div>

                      {(!formData.additionalContacts || formData.additionalContacts.length === 0) ? (
                        <div className="text-center py-6 text-gray-400 text-xs sm:text-sm border border-dashed border-gray-300 rounded-lg bg-white/50">
                          Nenhum contato adicional incluído. Clique no botão acima para adicionar pessoas de apoio / emergência.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {formData.additionalContacts.map((contact, index) => (
                            <div key={contact.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative">
                              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                <span className="text-xs font-bold text-[#0f254e] uppercase tracking-wider flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-[#3b5998]" />
                                  Contato Adicional #{index + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      additionalContacts: prev.additionalContacts.filter(c => c.id !== contact.id)
                                    }));
                                  }}
                                  className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remover</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="space-y-1 md:col-span-4">
                                  <label className="text-xs font-semibold text-gray-600">Nome Completo</label>
                                  <input
                                    type="text"
                                    placeholder="Nome da pessoa"
                                    value={contact.name}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFormData(prev => ({
                                        ...prev,
                                        additionalContacts: prev.additionalContacts.map(c =>
                                          c.id === contact.id ? { ...c, name: val } : c
                                        )
                                      }));
                                    }}
                                    className={getFieldClass(contact.name, "py-2 text-sm")}
                                  />
                                </div>

                                <div className="space-y-1 md:col-span-3">
                                  <label className="text-xs font-semibold text-gray-600">Vínculo / Parentesco</label>
                                  <input
                                    type="text"
                                    placeholder="Ex: Avó, Tio, Vizinho(a), Padrinho"
                                    value={contact.relationship}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFormData(prev => ({
                                        ...prev,
                                        additionalContacts: prev.additionalContacts.map(c =>
                                          c.id === contact.id ? { ...c, relationship: val } : c
                                        )
                                      }));
                                    }}
                                    className={getFieldClass(contact.relationship, "py-2 text-sm")}
                                  />
                                </div>

                                <div className="space-y-1 md:col-span-2">
                                  <label className="text-xs font-semibold text-gray-600">Telefone</label>
                                  <input
                                    type="tel"
                                    placeholder="(00) 00000-0000"
                                    value={contact.phone}
                                    onChange={(e) => {
                                      const val = maskPhone(e.target.value);
                                      setFormData(prev => ({
                                        ...prev,
                                        additionalContacts: prev.additionalContacts.map(c =>
                                          c.id === contact.id
                                            ? { ...c, phone: val, whatsapp: c.sameWhatsapp ? val : c.whatsapp }
                                            : c
                                        )
                                      }));
                                    }}
                                    className={getFieldClass(contact.phone, "py-2 text-sm")}
                                  />
                                </div>

                                <div className="space-y-1 md:col-span-3">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-gray-600">WhatsApp</label>
                                    <label className="inline-flex items-center gap-1 text-[11px] text-[#3b5998] font-semibold cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={contact.sameWhatsapp}
                                        onChange={(e) => {
                                          const chk = e.target.checked;
                                          setFormData(prev => ({
                                            ...prev,
                                            additionalContacts: prev.additionalContacts.map(c =>
                                              c.id === contact.id
                                                ? { ...c, sameWhatsapp: chk, whatsapp: chk ? c.phone : c.whatsapp }
                                                : c
                                            )
                                          }));
                                        }}
                                        className="w-3 h-3 text-[#3b5998] rounded cursor-pointer"
                                      />
                                      <span>Mesmo do tel</span>
                                    </label>
                                  </div>
                                  <input
                                    type="tel"
                                    placeholder="(00) 00000-0000"
                                    disabled={contact.sameWhatsapp}
                                    value={contact.sameWhatsapp ? contact.phone : contact.whatsapp}
                                    onChange={(e) => {
                                      const val = maskPhone(e.target.value);
                                      setFormData(prev => ({
                                        ...prev,
                                        additionalContacts: prev.additionalContacts.map(c =>
                                          c.id === contact.id ? { ...c, whatsapp: val } : c
                                        )
                                      }));
                                    }}
                                    className={getFieldClass(
                                      contact.sameWhatsapp ? contact.phone : contact.whatsapp,
                                      cn("py-2 text-sm", contact.sameWhatsapp && "bg-gray-100 text-gray-500 cursor-not-allowed")
                                    )}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Saúde Info */}
                <section>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-[#0f254e]">
                    <Activity className="w-5 h-5 text-[#3b5998]" />
                    Informações de Saúde
                  </h3>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleOpenSaude}
                      className="w-full bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#1967d2] border border-[#a8c7fa] font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Activity className="w-5 h-5" />
                      Acessar Informações de Saúde
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Clique no botão acima para preencher ou visualizar as informações de saúde em uma nova página.
                    </p>
                  </div>
                </section>

                {/* Termo de Ciência e Proteção de Dados (LGPD) */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs sm:text-sm text-blue-950 leading-relaxed flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[#3b5998] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1 text-[#0f254e]">Transparência e Tratamento de Dados (LGPD):</span>
                    Os dados cadastrais e a fotografia do estudante serão tratados pela unidade escolar para fins exclusivos de identificação institucional, controle de frequência, segurança escolar e gestão pedagógica no sistema interno da escola, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
                  </div>
                </div>

                <div className="pt-6 border-top border-gray-100 flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-500 font-bold py-4 rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-2 bg-[#3b5998] hover:bg-[#2d4373] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Finalizar Cadastro
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {isSuccess && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 sm:p-10 shadow-xl border border-gray-100 text-center max-w-md mx-auto"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <CheckCircle2 className="text-green-500 w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Cadastro Salvo com Sucesso!</h2>
              <p className="text-gray-600 mt-3 text-sm sm:text-base max-w-sm mx-auto">
                As informações foram salvas no sistema e sincronizadas com a Central de Divergências EOL. O aluno permanece na lista (marcado em verde) para futuras consultas ou novas alterações.
              </p>
              <button
                onClick={() => setIsSuccess(false)}
                className="mt-6 px-8 py-3 bg-[#3b5998] hover:bg-[#2d4373] text-white font-bold rounded-xl transition-all text-sm sm:text-base shadow-md cursor-pointer"
              >
                Voltar para a Lista de Alunos
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      )}

      {/* Footer */}
      <footer className={cn(
        "text-center text-gray-400 print:hidden shrink-0",
        isFullScreenView ? "py-2 sm:py-2.5 px-4 text-xs" : "max-w-4xl mx-auto py-12 px-4 text-sm"
      )}>
        <p>&copy; 2026 Portal de Cadastro Escolar. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
