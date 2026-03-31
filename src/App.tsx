import React, { useState, useEffect, FormEvent, Component, ErrorInfo, ReactNode } from 'react';
import logoEmef from './assets/logo-emef.png';

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

// ... rest of the imports and functions ...
import { supabase } from './lib/supabase';
import { Student } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, User, Phone, Mail, MapPin, Activity, CheckCircle2, AlertCircle, Loader2, Plus } from 'lucide-react';
import { cn } from './lib/utils';

// Helper to handle errors
function handleError(error: unknown) {
  console.error('Operation Error: ', error);
  throw error;
}

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMotherMain, setIsMotherMain] = useState(false);
  const [isFatherMain, setIsFatherMain] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    birthDate: '',
    gender: '',
    race: '',
    cpf: '',
    rg: '',
    rgDigit: '',
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
    healthInfo: ''
  });

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
      } catch (error) {
        console.error("Erro ao buscar CEP", error);
      }
    }
  };

  // Test connection to Supabase
  useEffect(() => {
    async function testConnection() {
      try {
        const { error } = await supabase.from('ALUNOS').select('count', { count: 'exact', head: true });
        if (error) throw error;
      } catch (error) {
        console.error("Please check your Supabase configuration.", error);
      }
    }
    testConnection();
  }, []);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);
    setFoundStudent(null);
    setIsSuccess(false);

    try {
      const { data: students, error: searchError } = await supabase
        .from('ALUNOS')
        .select(`
          *,
          DADOS_ALUNOS (*)
        `)
        .ilike('nome_aluno', searchTerm.trim())
        .limit(1);

      if (searchError) throw searchError;

      if (!students || students.length === 0) {
        setError('Aluno não encontrado, verifique se o nome completo esta correto');
      } else {
        const student = students[0];
        const extraData = student.DADOS_ALUNOS?.[0] || {};
        
        const mappedStudent: Student = {
          id: student.id_aluno.toString(),
          name: student.nome_aluno,
          class: student.serie_aluno || student.turma_aluno || '',
          period: student.periodo_aluno || '',
          birthDate: student.data_nasc_aluno || '',
          gender: student.genero_aluno || '',
          race: student.raca_aluno || '',
          cpf: student.cpf_aluno || '',
          rg: student.rg_aluno || '',
          rgDigit: student.rg_digito_aluno || '',
          guardianName: extraData.responsavel_1_aluno || '',
          guardianCpf: extraData.cpf_resp_1_aluno || '',
          guardianPhone: extraData.tel_responsavel_1_aluno || '',
          guardianWhatsapp: extraData.whatsapp_responsavel_1_aluno || '',
          guardianEmail: extraData.email_responsavel_1_aluno || '',
          motherName: extraData.responsavel_1_aluno || '', // simplified
          fatherName: extraData.responsavel_2_aluno || '',
          cep: extraData.cep_dados || '',
          street: extraData.logradouro_dados || '',
          number: extraData.numero_dados || '',
          complement: extraData.complemento_dados || '',
          neighborhood: extraData.bairro_dados || '',
          city: extraData.cidade_dados || '',
          state: extraData.estado_dados || '',
          healthInfo: student.saude_aluno || ''
        };

        setFoundStudent(mappedStudent);
        
        // Sync guardian main logic
        setIsMotherMain(!!(mappedStudent.guardianName && mappedStudent.guardianName === mappedStudent.motherName));
        setIsFatherMain(!!(mappedStudent.guardianName && mappedStudent.guardianName === mappedStudent.fatherName));
        
        setFormData({
          birthDate: mappedStudent.birthDate || '',
          gender: mappedStudent.gender || '',
          race: mappedStudent.race || '',
          cpf: mappedStudent.cpf || '',
          rg: mappedStudent.rg || '',
          rgDigit: mappedStudent.rgDigit || '',
          guardianName: mappedStudent.guardianName || '',
          guardianCpf: mappedStudent.guardianCpf || '',
          guardianPhone: mappedStudent.guardianPhone || '',
          guardianWhatsapp: mappedStudent.guardianWhatsapp || '',
          guardianEmail: mappedStudent.guardianEmail || '',
          motherName: mappedStudent.motherName || '',
          motherCpf: '', // cpf not stored separately for mother/father in this simplified mapping
          motherPhone: '',
          motherWhatsapp: '',
          motherEmail: '',
          fatherName: mappedStudent.fatherName || '',
          fatherCpf: '',
          fatherPhone: '',
          fatherWhatsapp: '',
          fatherEmail: '',
          cep: mappedStudent.cep || '',
          street: mappedStudent.street || '',
          number: mappedStudent.number || '',
          complement: mappedStudent.complement || '',
          neighborhood: mappedStudent.neighborhood || '',
          city: mappedStudent.city || '',
          state: mappedStudent.state || '',
          healthInfo: mappedStudent.healthInfo || ''
        });
      }
    } catch (err) {
      handleError(err);
      setError('Erro ao buscar aluno. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!foundStudent) return;

    const confirmSave = window.confirm("Deseja realmente salvar? Não será possível voltar ao formulário para refazer.");
    if (!confirmSave) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Update ALUNOS table
      const { error: alunoError } = await supabase
        .from('ALUNOS')
        .update({
          data_nasc_aluno: formData.birthDate,
          genero_aluno: formData.gender,
          raca_aluno: formData.race,
          cpf_aluno: formData.cpf,
          rg_aluno: formData.rg,
          rg_digito_aluno: formData.rgDigit,
          saude_aluno: formData.healthInfo
        })
        .eq('id_aluno', foundStudent.id);

      if (alunoError) throw alunoError;

      // Update DADOS_ALUNOS table
      const { error: dadosError } = await supabase
        .from('DADOS_ALUNOS')
        .upsert({
          id_aluno: foundStudent.id,
          responsavel_1_aluno: formData.guardianName,
          cpf_resp_1_aluno: formData.guardianCpf,
          tel_responsavel_1_aluno: formData.guardianPhone,
          whatsapp_responsavel_1_aluno: formData.guardianWhatsapp,
          email_responsavel_1_aluno: formData.guardianEmail,
          responsavel_2_aluno: formData.fatherName,
          cep_dados: formData.cep,
          logradouro_dados: formData.street,
          numero_dados: formData.number,
          complemento_dados: formData.complement,
          bairro_dados: formData.neighborhood,
          cidade_dados: formData.city,
          estado_dados: formData.state
        });

      if (dadosError) throw dadosError;

      setIsSuccess(true);
      setFoundStudent(null);
      setSearchTerm('');
      setFormData({
        birthDate: '',
        gender: '',
        race: '',
        cpf: '',
        rg: '',
        rgDigit: '',
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
        healthInfo: ''
      });
    } catch (err) {
      handleError(err);
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
      setFormData({
        birthDate: '',
        gender: '',
        race: '',
        cpf: '',
        rg: '',
        rgDigit: '',
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
        healthInfo: ''
      });
    }
  };


  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#212529] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-[#3b5998] border-b border-[#2d4373] py-6 px-4 sticky top-0 z-10 shadow-sm text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight uppercase">EMEF Tarsila do Amaral</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* Banner/Logo Image */}
        <div className="mb-8 flex justify-center">
          <img 
            src={logoEmef} 
            alt="EMEF Tarsila do Amaral Logo" 
            className="max-w-xs md:max-w-md h-auto rounded-3xl shadow-2xl border-8 border-white ring-1 ring-gray-100 transition-transform hover:scale-[1.02] duration-300"
            onError={(e) => {
              console.error("Erro ao carregar a logo:", e);
              // Fallback se necessário, mas o import já resolve o caminho
            }}
          />
        </div>
        <AnimatePresence mode="wait">
          {!foundStudent && !isSuccess && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100"
            >
              <div className="text-center mb-8">
                <h2 className="text-4xl font-extrabold text-[#0f254e] tracking-tight">Cadastro de Alunos</h2>
                <p className="text-gray-500 mt-3 text-lg">Digite o nome completo do aluno para acessar o formulário</p>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nome completo do aluno"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-lg"
                    required
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
                
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Buscar Aluno
                    </>
                  )}
                </button>
              </form>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}
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
                  onClick={() => setFoundStudent(null)}
                  className="text-white/70 hover:text-white text-sm underline absolute right-8 top-8"
                >
                  Voltar
                </button>
                <div className="flex flex-col items-center mb-6">
                  <span className="text-white/80 text-xs font-bold uppercase tracking-wider">
                    Nome Completo
                  </span>
                  <h2 className="text-3xl font-black text-white mt-1 uppercase text-center">{foundStudent.name}</h2>
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
                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider block mb-1">Nascimento</span>
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
                    <div className="space-y-2 md:col-span-4">
                      <label className="text-sm font-semibold text-gray-600">Data de Nascimento</label>
                      <input
                        type="date"
                        required
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-4">
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
                    <div className="space-y-2 md:col-span-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
                    <div className="space-y-2 md:col-span-5">
                      <label className="text-sm font-semibold text-gray-600">CPF</label>
                      <input
                        type="text"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-5">
                      <label className="text-sm font-semibold text-gray-600">RG</label>
                      <input
                        type="text"
                        value={formData.rg}
                        onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                        placeholder="00.000.000"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-gray-600">Dígito</label>
                      <input
                        type="text"
                        value={formData.rgDigit}
                        onChange={(e) => setFormData({ ...formData, rgDigit: e.target.value })}
                        placeholder="X"
                        maxLength={2}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                      />
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
                    {/* Responsável Principal */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <h4 className="font-bold text-[#3b5998] mb-4">Responsável Principal</h4>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="space-y-2 md:col-span-8">
                          <label className="text-sm font-semibold text-gray-600">Nome do Responsável</label>
                          <input
                            type="text"
                            required
                            value={formData.guardianName}
                            onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">CPF</label>
                          <input
                            type="text"
                            required
                            value={formData.guardianCpf}
                            onChange={(e) => setFormData({ ...formData, guardianCpf: e.target.value })}
                            placeholder="000.000.000-00"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">Telefone de Contato</label>
                          <div className="relative">
                            <input
                              type="tel"
                              required
                              value={formData.guardianPhone}
                              onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
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
                              required
                              value={formData.guardianWhatsapp}
                              onChange={(e) => setFormData({ ...formData, guardianWhatsapp: e.target.value })}
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
                              required
                              value={formData.guardianEmail}
                              onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all"
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mãe */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                        <h4 className="font-bold text-[#3b5998]">Dados da Mãe</h4>
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={isMotherMain}
                            onChange={(e) => {
                              setIsMotherMain(e.target.checked);
                              if (e.target.checked) setIsFatherMain(false);
                            }}
                            className="rounded border-gray-300 text-[#3b5998] focus:ring-[#3b5998] w-4 h-4"
                          />
                          <span className="font-medium">É a responsável principal</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="space-y-2 md:col-span-8">
                          <label className="text-sm font-semibold text-gray-600">Nome da Mãe</label>
                          <input
                            type="text"
                            value={isMotherMain ? formData.guardianName : formData.motherName}
                            onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                            disabled={isMotherMain}
                            className={cn("w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all", isMotherMain ? "bg-gray-100 text-gray-500" : "bg-white")}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">CPF da Mãe</label>
                          <input
                            type="text"
                            value={isMotherMain ? formData.guardianCpf : formData.motherCpf}
                            onChange={(e) => setFormData({ ...formData, motherCpf: e.target.value })}
                            disabled={isMotherMain}
                            placeholder="000.000.000-00"
                            className={cn("w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all", isMotherMain ? "bg-gray-100 text-gray-500" : "bg-white")}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">Telefone de Contato</label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={isMotherMain ? formData.guardianPhone : formData.motherPhone}
                              onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                              disabled={isMotherMain}
                              placeholder="(00) 00000-0000"
                              className={cn("w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all", isMotherMain ? "bg-gray-100 text-gray-500" : "bg-white")}
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">WhatsApp</label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={isMotherMain ? formData.guardianWhatsapp : formData.motherWhatsapp}
                              onChange={(e) => setFormData({ ...formData, motherWhatsapp: e.target.value })}
                              disabled={isMotherMain}
                              placeholder="(00) 00000-0000"
                              className={cn("w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all", isMotherMain ? "bg-gray-100 text-gray-500" : "bg-white")}
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">E-mail</label>
                          <div className="relative">
                            <input
                              type="email"
                              value={isMotherMain ? formData.guardianEmail : formData.motherEmail}
                              onChange={(e) => setFormData({ ...formData, motherEmail: e.target.value })}
                              disabled={isMotherMain}
                              className={cn("w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all", isMotherMain ? "bg-gray-100 text-gray-500" : "bg-white")}
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pai */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                        <h4 className="font-bold text-[#3b5998]">Dados do Pai</h4>
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={isFatherMain}
                            onChange={(e) => {
                              setIsFatherMain(e.target.checked);
                              if (e.target.checked) setIsMotherMain(false);
                            }}
                            className="rounded border-gray-300 text-[#3b5998] focus:ring-[#3b5998] w-4 h-4"
                          />
                          <span className="font-medium">É o responsável principal</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="space-y-2 md:col-span-8">
                          <label className="text-sm font-semibold text-gray-600">Nome do Pai</label>
                          <input
                            type="text"
                            value={isFatherMain ? formData.guardianName : formData.fatherName}
                            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                            disabled={isFatherMain}
                            className={cn("w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all", isFatherMain ? "bg-gray-100 text-gray-500" : "bg-white")}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">CPF do Pai</label>
                          <input
                            type="text"
                            value={isFatherMain ? formData.guardianCpf : formData.fatherCpf}
                            onChange={(e) => setFormData({ ...formData, fatherCpf: e.target.value })}
                            disabled={isFatherMain}
                            placeholder="000.000.000-00"
                            className={cn("w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all", isFatherMain ? "bg-gray-100 text-gray-500" : "bg-white")}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">Telefone de Contato</label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={isFatherMain ? formData.guardianPhone : formData.fatherPhone}
                              onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                              disabled={isFatherMain}
                              placeholder="(00) 00000-0000"
                              className={cn("w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all", isFatherMain ? "bg-gray-100 text-gray-500" : "bg-white")}
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">WhatsApp</label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={isFatherMain ? formData.guardianWhatsapp : formData.fatherWhatsapp}
                              onChange={(e) => setFormData({ ...formData, fatherWhatsapp: e.target.value })}
                              disabled={isFatherMain}
                              placeholder="(00) 00000-0000"
                              className={cn("w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all", isFatherMain ? "bg-gray-100 text-gray-500" : "bg-white")}
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <label className="text-sm font-semibold text-gray-600">E-mail</label>
                          <div className="relative">
                            <input
                              type="email"
                              value={isFatherMain ? formData.guardianEmail : formData.fatherEmail}
                              onChange={(e) => setFormData({ ...formData, fatherEmail: e.target.value })}
                              disabled={isFatherMain}
                              className={cn("w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all", isFatherMain ? "bg-gray-100 text-gray-500" : "bg-white")}
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                      </div>
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
                    <label className="text-sm font-semibold text-gray-600">Alergias ou Observações Médicas</label>
                    <textarea
                      value={formData.healthInfo}
                      onChange={(e) => setFormData({ ...formData, healthInfo: e.target.value })}
                      placeholder="Descreva se o aluno possui alergias, toma medicamentos contínuos ou outras observações..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b5998] outline-none transition-all min-h-[120px]"
                    />
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

      {/* Footer */}
      <footer className="max-w-4xl mx-auto py-12 px-4 text-center text-gray-400 text-sm">
        <p>&copy; 2026 Portal de Cadastro Escolar. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
