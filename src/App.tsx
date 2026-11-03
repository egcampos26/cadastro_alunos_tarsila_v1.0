import React, { useState, useEffect, FormEvent, Component, ErrorInfo, ReactNode } from 'react';
import logoEmef from './assets/logo-emef.png';
import { supabase } from './lib/supabase';
import { Student } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, User, Phone, Mail, MapPin, Activity, CheckCircle2, AlertCircle, Loader2, Calendar, FileText } from 'lucide-react';
import { cn } from './lib/utils';
import FichaSaude from './components/FichaSaude';

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

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBirthDate, setSearchBirthDate] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMotherMain, setIsMotherMain] = useState(false);
  const [isFatherMain, setIsFatherMain] = useState(false);
  const [sameAddressAsStudent, setSameAddressAsStudent] = useState(true);
  const [currentView, setCurrentView] = useState<'main' | 'saude'>('main');

  // Form state
  const [formData, setFormData] = useState(initialFormData);

  const resetAllFormState = () => {
    setFormData(initialFormData);
    setIsMotherMain(false);
    setIsFatherMain(false);
    setSameAddressAsStudent(true);
  };

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

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();

    const cleanInputName = normalizeText(searchTerm);
    if (!cleanInputName) {
      setError('Por favor, informe o nome completo do aluno.');
      return;
    }

    if (!searchBirthDate) {
      setError('Por favor, informe a data de nascimento do aluno.');
      return;
    }

    setIsSearching(true);
    setError(null);
    setFoundStudent(null);
    setIsSuccess(false);

    try {
      // 1. Search in ALUNOS by data_nasc_aluno and join actual related tables
      const { data: studentsByDate, error: searchError } = await supabase
        .from('ALUNOS')
        .select(`
          *,
          ALUNOS_DADOS_GERAIS (*),
          ALUNOS_DOCUMENTOS (*),
          ALUNOS_ENDERECOS (*),
          ALUNOS_MATRICULAS (*),
          ALUNOS_CONTATOS (*),
          ALUNOS_DADOS_SAUDE (*),
          ALUNOS_RESPONSAVEL (*)
        `)
        .eq('data_nasc_aluno', searchBirthDate);

      if (searchError) throw searchError;

      // Find student whose normalized name matches
      let matched = studentsByDate?.find(
        (s: any) => normalizeText(s.nome_aluno) === cleanInputName
      );

      // Partial match fallback if student full name differs slightly (e.g. compound surname)
      if (!matched && studentsByDate && studentsByDate.length > 0) {
        matched = studentsByDate.find((s: any) => {
          const sName = normalizeText(s.nome_aluno);
          return sName.includes(cleanInputName) || cleanInputName.includes(sName);
        });
      }

      // If still not matched, check if the student exists by name to give accurate and helpful feedback
      if (!matched) {
        const firstName = cleanInputName.split(' ')[0];
        const { data: nameCandidates } = await supabase
          .from('ALUNOS')
          .select(`
            *,
            ALUNOS_DADOS_GERAIS (*),
            ALUNOS_DOCUMENTOS (*),
            ALUNOS_ENDERECOS (*),
            ALUNOS_MATRICULAS (*),
            ALUNOS_CONTATOS (*),
            ALUNOS_DADOS_SAUDE (*),
            ALUNOS_RESPONSAVEL (*)
          `)
          .ilike('nome_aluno', `%${firstName}%`);

        const nameMatch = nameCandidates?.find((s: any) => {
          const sName = normalizeText(s.nome_aluno);
          return sName === cleanInputName || sName.includes(cleanInputName) || cleanInputName.includes(sName);
        });

        if (nameMatch) {
          if (!nameMatch.data_nasc_aluno) {
            // Student is in the database but without a birth date yet.
            // Allow access and let them register the date of birth!
            matched = nameMatch;
          } else {
            setError('A data de nascimento informada não confere com o cadastro do aluno. Verifique a data informada.');
            return;
          }
        } else {
          setError('Aluno não encontrado. Verifique se o nome completo foi digitado corretamente.');
          return;
        }
      }

      if (!matched) {
        setError('Aluno não encontrado com os dados informados. Verifique o nome completo e a data de nascimento.');
        return;
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
        initialGuardianWhatsapp = respPhone || motherPhone || fatherPhone || '';
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

      const certModelo = (documentos.certidao_nasc_modelo_aluno === 'Antigo' || (!documentos.certidao_nasc_matricula_aluno && documentos.certidao_nasc_numero_aluno)) ? 'Antigo' : 'Novo';

      const birthDate = matched.data_nasc_aluno || dadosGerais.data_nasc_aluno || searchBirthDate;
      const turmaFormatada = [matricula.serie_aluno, matricula.turma_aluno].filter(Boolean).join(' ');

      const isSameAddress = respRecord.mesmo_end_responsavel_aluno !== 'Não';
      setSameAddressAsStudent(isSameAddress);

      const respStreetFromDb = [respRecord.logradouro_responsavel_aluno, respRecord.endereco_responsavel_aluno].filter(Boolean).join(' ') || respRecord.endereco_responsavel_aluno || '';

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
        guardianName: activeGuardianName,
        guardianCpf: activeGuardianCpf,
        guardianPhone: activeGuardianPhone,
        guardianWhatsapp: activeGuardianPhone,
        guardianEmail: activeGuardianEmail,
        motherName: motherName,
        motherCpf: motherCpf,
        motherPhone: motherPhone,
        motherWhatsapp: motherPhone,
        motherEmail: initialMotherMain ? (contatos.email_responsavel || '') : '',
        fatherName: fatherName,
        fatherCpf: fatherCpf,
        fatherPhone: fatherPhone,
        fatherWhatsapp: fatherPhone,
        fatherEmail: initialFatherMain ? (contatos.email_responsavel || '') : '',
        cep: addressCep,
        street: addressStreet,
        number: addressNumber,
        complement: addressComplement,
        neighborhood: addressNeighborhood,
        city: addressCity,
        state: addressState,
        healthInfo: ''
      };

      setFoundStudent(mappedStudent);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });

      setFormData({
        birthDate: birthDate,
        gender: normalizeGender(dadosGerais.genero_aluno),
        race: normalizeRace(dadosGerais.raca_aluno),
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
        guardianPhone: initialGuardianPhone,
        guardianWhatsapp: initialGuardianWhatsapp,
        guardianEmail: initialGuardianEmail,
        motherName: motherName,
        motherCpf: motherCpf,
        motherPhone: motherPhone,
        motherWhatsapp: motherPhone,
        motherEmail: initialMotherMain ? (contatos.email_responsavel || '') : '',
        fatherName: fatherName,
        fatherCpf: fatherCpf,
        fatherPhone: fatherPhone,
        fatherWhatsapp: fatherPhone,
        fatherEmail: initialFatherMain ? (contatos.email_responsavel || '') : '',
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
      });
    } catch (err) {
      console.error('Search error:', err);
      setError('Erro ao buscar aluno. Por favor, tente novamente.');
    } finally {
      setIsSearching(false);
    }
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

    const confirmSave = window.confirm("Deseja realmente salvar? Não será possível voltar ao formulário para refazer.");
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

      // 1. Update ALUNOS birth date and mark status_cadastro as 'salva'
      const alunosUpdate: Record<string, any> = {
        status_cadastro: 'salva',
        data_cadastro_salvo: new Date().toISOString()
      };
      if (formData.birthDate) {
        alunosUpdate.data_nasc_aluno = formData.birthDate;
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
          cpf_aluno: formData.cpf || null,
          rg_aluno: formData.rg || null,
          rg_digito_aluno: formData.rgDigit || null,
          rg_uf_aluno: formData.rgUf || null,
          rg_orgao_emissao_aluno: formData.rgOrgao || null,
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

        const { error: respErr } = await supabase
          .from('ALUNOS_RESPONSAVEL')
          .upsert({
            id_aluno: studentId,
            nome_aluno: foundStudent.name,
            responsavel_aluno: respTipo,
            nome_responsavel_aluno: finalGuardianName,
            cpf_responsavel_aluno: finalGuardianCpf || null,
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

      const emailResponsavel = finalGuardianEmail || formData.motherEmail || formData.fatherEmail || null;

      const { error: contatosErr } = await supabase
        .from('ALUNOS_CONTATOS')
        .upsert({
          id_aluno: studentId,
          email_responsavel: emailResponsavel,
          dados_completos: JSON.stringify(dadosCompletos)
        }, { onConflict: 'id_aluno' });

      if (contatosErr) throw contatosErr;

      setIsSuccess(true);
      setFoundStudent(null);
      setSearchTerm('');
      setSearchBirthDate('');
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
      setSearchTerm('');
      setSearchBirthDate('');
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
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
          />
        </div>
        <div className="space-y-2 md:col-span-8">
          <label className="text-sm font-semibold text-gray-600">Rua</label>
          <input
            type="text"
            value={formData.respStreet}
            onChange={(e) => setFormData({ ...formData, respStreet: e.target.value })}
            placeholder="Nome da rua / logradouro"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
          />
        </div>
        <div className="space-y-2 md:col-span-3">
          <label className="text-sm font-semibold text-gray-600">Número</label>
          <input
            type="text"
            value={formData.respNumber}
            onChange={(e) => setFormData({ ...formData, respNumber: e.target.value })}
            placeholder="Nº"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
          />
        </div>
        <div className="space-y-2 md:col-span-4">
          <label className="text-sm font-semibold text-gray-600">Complemento</label>
          <input
            type="text"
            value={formData.respComplement}
            onChange={(e) => setFormData({ ...formData, respComplement: e.target.value })}
            placeholder="Apto, Bloco, etc."
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
          />
        </div>
        <div className="space-y-2 md:col-span-5">
          <label className="text-sm font-semibold text-gray-600">Bairro</label>
          <input
            type="text"
            value={formData.respNeighborhood}
            onChange={(e) => setFormData({ ...formData, respNeighborhood: e.target.value })}
            placeholder="Bairro"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
          />
        </div>
        <div className="space-y-2 md:col-span-9">
          <label className="text-sm font-semibold text-gray-600">Cidade</label>
          <input
            type="text"
            value={formData.respCity}
            onChange={(e) => setFormData({ ...formData, respCity: e.target.value })}
            placeholder="Cidade"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
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
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all uppercase"
          />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#212529] font-sans selection:bg-blue-100 print:bg-white">
      {/* Header */}
      <header className="bg-[#3b5998] border-b border-[#2d4373] py-6 px-4 sticky top-0 z-10 shadow-sm text-white text-center print:hidden">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight uppercase">EMEF Tarsila do Amaral</h1>
        </div>
      </header>

      {currentView === 'saude' && foundStudent ? (
        <main className="max-w-4xl mx-auto py-8 px-4 ficha-saude-view no-scrollbar">
          <FichaSaude student={foundStudent} onBack={() => setCurrentView('main')} />
        </main>
      ) : (
        <main className="max-w-4xl mx-auto py-8 px-4 print:hidden">
          <AnimatePresence mode="wait">
            {!foundStudent && !isSuccess && (
            <motion.div
              key="search-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Banner/Logo Image */}
              <div className="mb-8 flex justify-center">
                <img 
                  src={logoEmef} 
                  alt="EMEF Tarsila do Amaral Logo" 
                  className="max-w-xs md:max-w-md h-auto rounded-3xl shadow-2xl border-8 border-white ring-1 ring-gray-100 transition-transform hover:scale-[1.02] duration-300"
                  onError={(e) => {
                    console.error("Erro ao carregar a logo:", e);
                  }}
                />
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-[#3b5998] tracking-tight">Cadastro de Alunos</h2>
                  <p className="text-gray-600 mt-3 text-base md:text-lg">
                    Informe o <strong>nome completo</strong> e a <strong>data de nascimento</strong> do aluno para acessar o cadastro
                  </p>
                </div>

                <form onSubmit={handleSearch} className="space-y-5">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-sm font-semibold text-gray-700">
                      Nome completo do aluno
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ex: Anthony de Jesus Feitoza"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3b5998] focus:border-transparent transition-all outline-none text-lg"
                        required
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-sm font-semibold text-gray-700">
                      Data de nascimento do aluno
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={searchBirthDate}
                        onChange={(e) => setSearchBirthDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        min="1990-01-01"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3b5998] focus:border-transparent transition-all outline-none text-lg text-gray-800"
                        required
                      />
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verificando cadastro...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        Acessar Cadastro do Aluno
                      </>
                    )}
                  </button>
                </form>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-left"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-center shadow-sm backdrop-blur-sm">
                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider block mb-1">Ano/Turma</span>
                    <span className="text-xl font-black text-white">{foundStudent.class || '-'}</span>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-center shadow-sm backdrop-blur-sm">
                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider block mb-1">Período</span>
                    <span className="text-xl font-black text-white">{foundStudent.period || '-'}</span>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-center shadow-sm backdrop-blur-sm">
                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider block mb-1">Data de Nascimento</span>
                    <span className="text-xl font-black text-white">
                      {foundStudent.birthDate ? new Date(foundStudent.birthDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8">
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
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all appearance-none"
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
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all appearance-none"
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
                    <h4 className="text-sm font-bold text-[#3b5998] uppercase tracking-wider mb-3">RG e CPF</h4>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="space-y-2 md:col-span-4">
                        <label className="text-sm font-semibold text-gray-700">CPF</label>
                        <input
                          type="text"
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <label className="text-sm font-semibold text-gray-700">RG</label>
                        <input
                          type="text"
                          value={formData.rg}
                          onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                          placeholder="00.000.000"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-gray-800"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <label className="text-sm font-semibold text-gray-700">Dígito</label>
                        <input
                          type="text"
                          value={formData.rgDigit}
                          onChange={(e) => setFormData({ ...formData, rgDigit: e.target.value.toUpperCase() })}
                          placeholder="X"
                          maxLength={2}
                          className="w-full px-3 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-center font-bold text-gray-800 uppercase"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <label className="text-sm font-semibold text-gray-700">UF RG</label>
                        <input
                          type="text"
                          value={formData.rgUf}
                          onChange={(e) => setFormData({ ...formData, rgUf: e.target.value.toUpperCase() })}
                          placeholder="SP"
                          maxLength={2}
                          className="w-full px-2 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-center uppercase text-gray-800 font-bold"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <label className="text-sm font-semibold text-gray-700">Órgão Emissor</label>
                        <input
                          type="text"
                          value={formData.rgOrgao}
                          onChange={(e) => setFormData({ ...formData, rgOrgao: e.target.value.toUpperCase() })}
                          placeholder="Ex: SSP, Policia Civil"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all uppercase text-gray-800"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-4">
                        <label className="text-sm font-semibold text-gray-700">Data de Emissão do RG</label>
                        <input
                          type="date"
                          value={formData.rgDate ? formData.rgDate.split('T')[0] : ''}
                          onChange={(e) => setFormData({ ...formData, rgDate: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-gray-800"
                        />
                      </div>
                    </div>
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
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-gray-800"
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
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all font-mono tracking-wide text-gray-800"
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
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-gray-800"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-gray-700">Livro</label>
                            <input
                              type="text"
                              value={formData.certidaoLivro}
                              onChange={(e) => setFormData({ ...formData, certidaoLivro: e.target.value })}
                              placeholder="Livro"
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-gray-800"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-3">
                            <label className="text-sm font-semibold text-gray-700">Folha</label>
                            <input
                              type="text"
                              value={formData.certidaoFolha}
                              onChange={(e) => setFormData({ ...formData, certidaoFolha: e.target.value })}
                              placeholder="Folha"
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-gray-800"
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
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-gray-800"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-6">
                        <label className="text-sm font-semibold text-gray-700">Distrito / Subdistrito</label>
                        <input
                          type="text"
                          value={formData.certidaoDistrito}
                          onChange={(e) => setFormData({ ...formData, certidaoDistrito: e.target.value })}
                          placeholder="Ex: Butantã, Santo Amaro, etc."
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-gray-800"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-5">
                        <label className="text-sm font-semibold text-gray-700">Município da Certidão</label>
                        <input
                          type="text"
                          value={formData.certidaoMunicipio}
                          onChange={(e) => setFormData({ ...formData, certidaoMunicipio: e.target.value })}
                          placeholder="Município onde foi registrada"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-gray-800"
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
                          className="w-full px-2 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-center uppercase text-gray-800 font-bold"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-5">
                        <label className="text-sm font-semibold text-gray-700">Data de Emissão da Certidão</label>
                        <input
                          type="date"
                          value={formData.certidaoDataEmissao ? formData.certidaoDataEmissao.split('T')[0] : ''}
                          onChange={(e) => setFormData({ ...formData, certidaoDataEmissao: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-gray-800"
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
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-gray-800 font-mono"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-4">
                        <label className="text-sm font-semibold text-gray-700">NIS / PIS</label>
                        <input
                          type="text"
                          value={formData.nis}
                          onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                          placeholder="000.00000.00-0"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-gray-800 font-mono"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-4">
                        <label className="text-sm font-semibold text-gray-700">RNE / CRNM (Estrangeiro)</label>
                        <input
                          type="text"
                          value={formData.rne}
                          onChange={(e) => setFormData({ ...formData, rne: e.target.value })}
                          placeholder="Registro Nacional de Estrangeiro"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all text-gray-800"
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
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-8">
                      <label className="text-sm font-semibold text-gray-600">Rua</label>
                      <input
                        type="text"
                        required
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <label className="text-sm font-semibold text-gray-600">Número</label>
                      <input
                        type="text"
                        required
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-4">
                      <label className="text-sm font-semibold text-gray-600">Complemento</label>
                      <input
                        type="text"
                        value={formData.complement}
                        onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                        placeholder="Apto, Bloco, etc."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-5">
                      <label className="text-sm font-semibold text-gray-600">Bairro</label>
                      <input
                        type="text"
                        required
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-9">
                      <label className="text-sm font-semibold text-gray-600">Cidade</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
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
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all uppercase"
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
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">CPF da Mãe</label>
                          <input
                            type="text"
                            value={formData.motherCpf}
                            onChange={(e) => setFormData({ ...formData, motherCpf: e.target.value })}
                            placeholder="000.000.000-00"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">Telefone de Contato</label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={formData.motherPhone}
                              onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                              placeholder="(00) 00000-0000"
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">WhatsApp</label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={formData.motherWhatsapp}
                              onChange={(e) => setFormData({ ...formData, motherWhatsapp: e.target.value })}
                              placeholder="(00) 00000-0000"
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
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
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
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
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">CPF do Pai</label>
                          <input
                            type="text"
                            value={formData.fatherCpf}
                            onChange={(e) => setFormData({ ...formData, fatherCpf: e.target.value })}
                            placeholder="000.000.000-00"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">Telefone de Contato</label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={formData.fatherPhone}
                              onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                              placeholder="(00) 00000-0000"
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">WhatsApp</label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={formData.fatherWhatsapp}
                              onChange={(e) => setFormData({ ...formData, fatherWhatsapp: e.target.value })}
                              placeholder="(00) 00000-0000"
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
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
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
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
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
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
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-4">
                              <label className="text-sm font-semibold text-gray-700">Telefone de Contato</label>
                              <div className="relative">
                                <input
                                  type="tel"
                                  required={!isMotherMain && !isFatherMain}
                                  value={formData.guardianPhone}
                                  onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                                  placeholder="(00) 00000-0000"
                                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                                />
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                              </div>
                            </div>
                            <div className="space-y-2 md:col-span-4">
                              <label className="text-sm font-semibold text-gray-700">WhatsApp</label>
                              <div className="relative">
                                <input
                                  type="tel"
                                  required={!isMotherMain && !isFatherMain}
                                  value={formData.guardianWhatsapp}
                                  onChange={(e) => setFormData({ ...formData, guardianWhatsapp: e.target.value })}
                                  placeholder="(00) 00000-0000"
                                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
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
                                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
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
              className="bg-white rounded-2xl p-12 shadow-xl border border-gray-100 text-center"
            >
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-green-500 w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Cadastro Concluído!</h2>
              <p className="text-gray-500 mt-4 text-lg max-w-md mx-auto">
                As informações foram enviadas com sucesso para a secretaria da escola.
              </p>
              <button
                onClick={() => setIsSuccess(false)}
                className="mt-8 px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
              >
                Voltar ao Início
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      )}

      {/* Footer */}
      <footer className="max-w-4xl mx-auto py-12 px-4 text-center text-gray-400 text-sm print:hidden">
        <p>&copy; 2026 Portal de Cadastro Escolar. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
