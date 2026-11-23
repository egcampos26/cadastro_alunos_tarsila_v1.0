import React, { useState, useEffect } from 'react';
import { Save, Printer, ArrowLeft, Loader2, CheckCircle2, FileText, ChevronLeft, RotateCcw, Eye, Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Student } from '../types';
import brasaoSp from '../assets/brasao-sp.png';
import { cn, maskPhone } from '../lib/utils';

interface FichaSaudeEProps {
  student: Student;
  onBack: () => void;
  onBackToCadastro?: () => void;
  isEditMode?: boolean;
}

export interface FichaSaudeEData {
  id_aluno: number;
  unidade_educacional: string;
  // Deficiência / Dificuldade
  deficiencia_fisica: boolean;
  deficiencia_mental: boolean;
  deficiencia_auditiva: boolean;
  deficiencia_visual: boolean;
  deficiencia_outras: boolean;
  deficiencia_outras_qual: string;
  tipo_deficiencia: string[];

  // Questões 1 a 8
  q1_comentario_resumido: string;
  q2_alguem_familia: string;
  q3_idade_comecou_escola: string;
  q4_dificuldade_ingressar: boolean | null;
  q4_dificuldade_ingressar_qual: string;
  q5_transporte_tipo: string;
  q6_atencao_cuidado_especial: boolean | null;
  q6_atencao_cuidado_especial_qual: string;
  q7_comunicacao: string;
  q8_comportamento: string;

  // Questão 9 - Tecnologia Assistiva
  q9_necessita_tec_assistiva: boolean | null;
  q9_mobilidade_check: boolean;
  q9_mobilidade_quais: string;
  q9_opticos_check: boolean;
  q9_opticos_quais: string;
  q9_comunicacao_check: boolean;
  q9_comunicacao_quais: string;
  q9_acessibilidade_check: boolean;
  q9_acessibilidade_qual: string;
  q9_outros_check: boolean;
  q9_outros_qual: string;

  // Questão 10 - Equipamento / Adaptação
  q10_possui_usa_frequente: boolean;
  q10_possui_usa_pouco: boolean;
  q10_motivo_usa_pouco: string;
  q10_tem_indicacao_nao_possui: boolean;
  q10_aguardando_solicitacao: boolean | null;
  q10_aguardando_onde: string;

  // Questão 11 - Atendimentos
  q11_atendimentos: Record<string, { inicio?: string; local?: string; profissional?: string; tel?: string; freq?: string }>;

  // Questão 12 - Avaliação / Tratamento anterior
  q12_avaliacao_anterior: boolean | null;
  q12_motivo_nao: string;
  q12_onde_sim: string;
  q12_profissional: string;
  q12_telefone: string;
  q12_motivo_parou: string; // 'alta' | 'abandono' | 'outro' | ''
  q12_motivo_parou_outro: string;

  // Questões 13 a 15
  q13_relacionamento_familiar: string;
  q14_rotina_fora_escola: string;
  q15_observacao_crianca: string;

  // Metadados
  responsavel_preenchimento: string;
  data_preenchimento: string;
}

export const initialFichaSaudeEData: FichaSaudeEData = {
  id_aluno: 0,
  unidade_educacional: 'EMEF TARSILA DO AMARAL',
  deficiencia_fisica: false,
  deficiencia_mental: false,
  deficiencia_auditiva: false,
  deficiencia_visual: false,
  deficiencia_outras: false,
  deficiencia_outras_qual: '',
  tipo_deficiencia: [],

  q1_comentario_resumido: '',
  q2_alguem_familia: '',
  q3_idade_comecou_escola: '',
  q4_dificuldade_ingressar: false,
  q4_dificuldade_ingressar_qual: '',
  q5_transporte_tipo: '',
  q6_atencao_cuidado_especial: false,
  q6_atencao_cuidado_especial_qual: '',
  q7_comunicacao: '',
  q8_comportamento: '',

  q9_necessita_tec_assistiva: false,
  q9_mobilidade_check: false,
  q9_mobilidade_quais: '',
  q9_opticos_check: false,
  q9_opticos_quais: '',
  q9_comunicacao_check: false,
  q9_comunicacao_quais: '',
  q9_acessibilidade_check: false,
  q9_acessibilidade_qual: '',
  q9_outros_check: false,
  q9_outros_qual: '',

  q10_possui_usa_frequente: false,
  q10_possui_usa_pouco: false,
  q10_motivo_usa_pouco: '',
  q10_tem_indicacao_nao_possui: false,
  q10_aguardando_solicitacao: false,
  q10_aguardando_onde: '',

  q11_atendimentos: {
    fisioterapia: {},
    fonoaudiologia: {},
    terapia_ocupacional: {},
    psicologia: {},
    neurologia: {},
    psiquiatria: {},
    psicopedagogia: {},
    outro_1: {},
    outro_2: {}
  },

  q12_avaliacao_anterior: false,
  q12_motivo_nao: '',
  q12_onde_sim: '',
  q12_profissional: '',
  q12_telefone: '',
  q12_motivo_parou: '',
  q12_motivo_parou_outro: '',

  q13_relacionamento_familiar: '',
  q14_rotina_fora_escola: '',
  q15_observacao_crianca: '',

  responsavel_preenchimento: '',
  data_preenchimento: new Date().toISOString().split('T')[0]
};

const ATENDIMENTOS_FIXED = [
  { key: 'fisioterapia', label: 'Fisioterapia' },
  { key: 'fonoaudiologia', label: 'Fonoaudiologia' },
  { key: 'terapia_ocupacional', label: 'Ter. Ocupacional' },
  { key: 'psicologia', label: 'Psicologia' },
  { key: 'neurologia', label: 'Neurologia' },
  { key: 'psiquiatria', label: 'Psiquiatria' },
  { key: 'psicopedagogia', label: 'Psicopedagogia' },
  { key: 'outro_1', label: 'Outro (especificar)' },
  { key: 'outro_2', label: 'Outro (especificar)' }
];

export default function FichaSaudeE({ student, onBack, onBackToCadastro }: FichaSaudeEProps) {
  const [formData, setFormData] = useState<FichaSaudeEData>({
    ...initialFichaSaudeEData,
    id_aluno: Number(student.id),
    responsavel_preenchimento: student.guardianName || student.motherName || student.fatherName || '',
    data_preenchimento: new Date().toISOString().split('T')[0]
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isCustomResponsavel, setIsCustomResponsavel] = useState(false);

  const responsibleOptions = [
    student.motherName ? { label: `Mãe: ${student.motherName}`, name: student.motherName } : null,
    student.fatherName ? { label: `Pai: ${student.fatherName}`, name: student.fatherName } : null,
    (student.guardianName && student.guardianName !== student.motherName && student.guardianName !== student.fatherName) ? {
      label: `Responsável: ${student.guardianName}`,
      name: student.guardianName
    } : null,
  ].filter(Boolean) as { label: string; name: string }[];

  useEffect(() => {
    loadData();
  }, [student.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ALUNOS_FICHA_SAUDE_E')
        .select('*')
        .eq('id_aluno', student.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Compatibilidade com possíveis campos alternativos
        setFormData({
          ...initialFichaSaudeEData,
          ...data,
          unidade_educacional: data.unidade_educacional || 'EMEF TARSILA DO AMARAL',
          deficiencia_fisica: Boolean(data.deficiencia_fisica || data.tipo_deficiencia?.includes('Física')),
          deficiencia_mental: Boolean(data.deficiencia_mental || data.tipo_deficiencia?.includes('Mental')),
          deficiencia_auditiva: Boolean(data.deficiencia_auditiva || data.tipo_deficiencia?.includes('Auditiva')),
          deficiencia_visual: Boolean(data.deficiencia_visual || data.tipo_deficiencia?.includes('Visual')),
          deficiencia_outras: Boolean(data.deficiencia_outras || data.tipo_deficiencia?.includes('Outras')),
          deficiencia_outras_qual: data.deficiencia_outras_qual || data.tipo_deficiencia_outra || '',
          q1_comentario_resumido: data.q1_comentario_resumido || data.q1_descricao || '',
          q2_alguem_familia: data.q2_alguem_familia || data.q2_familia_deficiencia || '',
          q3_idade_comecou_escola: data.q3_idade_comecou_escola || data.q3_idade_inicio_escola || '',
          q4_dificuldade_ingressar: data.q4_dificuldade_ingressar !== undefined ? data.q4_dificuldade_ingressar : data.q4_dificuldade_escola,
          q4_dificuldade_ingressar_qual: data.q4_dificuldade_ingressar_qual || data.q4_dificuldade_qual || '',
          q5_transporte_tipo: data.q5_transporte_tipo || data.q5_tipo_transporte || '',
          q6_atencao_cuidado_especial: data.q6_atencao_cuidado_especial !== undefined ? data.q6_atencao_cuidado_especial : data.q6_cuidado_especial,
          q6_atencao_cuidado_especial_qual: data.q6_atencao_cuidado_especial_qual || data.q6_cuidado_qual || '',
          q9_necessita_tec_assistiva: data.q9_necessita_tec_assistiva !== undefined ? data.q9_necessita_tec_assistiva : data.q9_tecnologia_assistiva,
          q9_mobilidade_quais: data.q9_mobilidade_quais || data.q9_recursos_mobilidade || '',
          q9_opticos_quais: data.q9_opticos_quais || data.q9_recursos_opticos || '',
          q9_comunicacao_quais: data.q9_comunicacao_quais || data.q9_recursos_comunicacao || '',
          q9_acessibilidade_qual: data.q9_acessibilidade_qual || data.q9_acessibilidade_espaco || '',
          q9_outros_qual: data.q9_outros_qual || data.q9_outros || '',
          q10_motivo_usa_pouco: data.q10_motivo_usa_pouco || data.q10_motivo_pouco_uso || '',
          q11_atendimentos: data.q11_atendimentos || initialFichaSaudeEData.q11_atendimentos,
          q12_avaliacao_anterior: data.q12_avaliacao_anterior !== undefined ? data.q12_avaliacao_anterior : data.q12_passou_tratamento,
          q15_observacao_crianca: data.q15_observacao_crianca || data.q15_observacoes || '',
          data_preenchimento: data.data_preenchimento || new Date().toISOString().split('T')[0],
          responsavel_preenchimento: data.responsavel_preenchimento || student.guardianName || student.motherName || student.fatherName || ''
        });

        if (data.responsavel_preenchimento && !responsibleOptions.some(o => o.name === data.responsavel_preenchimento)) {
          setIsCustomResponsavel(true);
        }
      } else {
        const defaultResp = student.guardianName || student.motherName || student.fatherName || '';
        setFormData(prev => ({
          ...prev,
          responsavel_preenchimento: defaultResp,
          data_preenchimento: new Date().toISOString().split('T')[0]
        }));
      }
    } catch (err) {
      console.error('Erro ao carregar Ficha de Saúde E:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);

      // Sincroniza tipo_deficiencia array e campos legados para máxima compatibilidade
      const activeDeficiencias: string[] = [];
      if (formData.deficiencia_fisica) activeDeficiencias.push('Física');
      if (formData.deficiencia_mental) activeDeficiencias.push('Mental');
      if (formData.deficiencia_auditiva) activeDeficiencias.push('Auditiva');
      if (formData.deficiencia_visual) activeDeficiencias.push('Visual');
      if (formData.deficiencia_outras) activeDeficiencias.push('Outras');

      const payload = {
        id_aluno: Number(student.id),
        unidade_educacional: formData.unidade_educacional || 'EMEF TARSILA DO AMARAL',
        deficiencia_fisica: formData.deficiencia_fisica,
        deficiencia_mental: formData.deficiencia_mental,
        deficiencia_auditiva: formData.deficiencia_auditiva,
        deficiencia_visual: formData.deficiencia_visual,
        deficiencia_outras: formData.deficiencia_outras,
        deficiencia_outras_qual: formData.deficiencia_outras_qual,
        tipo_deficiencia: activeDeficiencias,

        q1_comentario_resumido: formData.q1_comentario_resumido,
        q1_descricao: formData.q1_comentario_resumido,

        q2_alguem_familia: formData.q2_alguem_familia,
        q2_familia_deficiencia: formData.q2_alguem_familia,

        q3_idade_comecou_escola: formData.q3_idade_comecou_escola,
        q3_idade_inicio_escola: formData.q3_idade_comecou_escola,

        q4_dificuldade_ingressar: formData.q4_dificuldade_ingressar,
        q4_dificuldade_escola: formData.q4_dificuldade_ingressar,
        q4_dificuldade_ingressar_qual: formData.q4_dificuldade_ingressar_qual,
        q4_dificuldade_qual: formData.q4_dificuldade_ingressar_qual,

        q5_transporte_tipo: formData.q5_transporte_tipo,
        q5_tipo_transporte: formData.q5_transporte_tipo,

        q6_atencao_cuidado_especial: formData.q6_atencao_cuidado_especial,
        q6_cuidado_especial: formData.q6_atencao_cuidado_especial,
        q6_atencao_cuidado_especial_qual: formData.q6_atencao_cuidado_especial_qual,
        q6_cuidado_qual: formData.q6_atencao_cuidado_especial_qual,

        q7_comunicacao: formData.q7_comunicacao,
        q8_comportamento: formData.q8_comportamento,

        q9_necessita_tec_assistiva: formData.q9_necessita_tec_assistiva,
        q9_tecnologia_assistiva: formData.q9_necessita_tec_assistiva,
        q9_mobilidade_check: formData.q9_mobilidade_check,
        q9_mobilidade_quais: formData.q9_mobilidade_quais,
        q9_recursos_mobilidade: formData.q9_mobilidade_quais,
        q9_opticos_check: formData.q9_opticos_check,
        q9_opticos_quais: formData.q9_opticos_quais,
        q9_recursos_opticos: formData.q9_opticos_quais,
        q9_comunicacao_check: formData.q9_comunicacao_check,
        q9_comunicacao_quais: formData.q9_comunicacao_quais,
        q9_recursos_comunicacao: formData.q9_comunicacao_quais,
        q9_acessibilidade_check: formData.q9_acessibilidade_check,
        q9_acessibilidade_qual: formData.q9_acessibilidade_qual,
        q9_acessibilidade_espaco: formData.q9_acessibilidade_qual,
        q9_outros_check: formData.q9_outros_check,
        q9_outros_qual: formData.q9_outros_qual,
        q9_outros: formData.q9_outros_qual,

        q10_possui_usa_frequente: formData.q10_possui_usa_frequente,
        q10_possui_usa_pouco: formData.q10_possui_usa_pouco,
        q10_motivo_usa_pouco: formData.q10_motivo_usa_pouco,
        q10_motivo_pouco_uso: formData.q10_motivo_usa_pouco,
        q10_tem_indicacao_nao_possui: formData.q10_tem_indicacao_nao_possui,
        q10_aguardando_solicitacao: formData.q10_aguardando_solicitacao,
        q10_aguardando_onde: formData.q10_aguardando_onde,

        q11_atendimentos: formData.q11_atendimentos,

        q12_avaliacao_anterior: formData.q12_avaliacao_anterior,
        q12_passou_tratamento: formData.q12_avaliacao_anterior,
        q12_motivo_nao: formData.q12_motivo_nao,
        q12_onde_sim: formData.q12_onde_sim,
        q12_profissional: formData.q12_profissional,
        q12_telefone: formData.q12_telefone,
        q12_motivo_parou: formData.q12_motivo_parou,
        q12_motivo_parou_outro: formData.q12_motivo_parou_outro,

        q13_relacionamento_familiar: formData.q13_relacionamento_familiar,
        q14_rotina_fora_escola: formData.q14_rotina_fora_escola,
        q15_observacao_crianca: formData.q15_observacao_crianca,
        q15_observacoes: formData.q15_observacao_crianca,

        responsavel_preenchimento: formData.responsavel_preenchimento,
        data_preenchimento: formData.data_preenchimento,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('ALUNOS_FICHA_SAUDE_E')
        .upsert(payload, { onConflict: 'id_aluno' });

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onBack();
      }, 1200);
    } catch (err) {
      console.error('Erro ao salvar Ficha de Saúde E:', err);
      alert('Erro ao salvar dados da Ficha de Saúde E.');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return '';
    const b = new Date(birthDate + 'T12:00:00');
    if (isNaN(b.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) {
      age--;
    }
    return age > 0 ? `${age} anos` : '';
  };

  const updateAtendimento = (key: string, field: string, val: string) => {
    setFormData(prev => ({
      ...prev,
      q11_atendimentos: {
        ...prev.q11_atendimentos,
        [key]: {
          ...(prev.q11_atendimentos[key] || {}),
          [field]: val
        }
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3">
        <Loader2 className="w-10 h-10 text-purple-700 animate-spin" />
        <span className="text-sm font-semibold text-gray-600">Carregando Ficha de Saúde E...</span>
      </div>
    );
  }

  const YesNoRadio = ({ checked, onChange, name }: { checked: boolean | null, onChange: (v: boolean) => void, name: string }) => (
    <div className="flex items-center gap-4 text-sm font-medium">
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input type="radio" checked={checked === false} onChange={() => onChange(false)} name={name} className="w-4 h-4 text-purple-700 focus:ring-purple-600" />
        <span className="text-gray-800">Não</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input type="radio" checked={checked === true} onChange={() => onChange(true)} name={name} className="w-4 h-4 text-purple-700 focus:ring-purple-600" />
        <span className="text-gray-800">Sim</span>
      </label>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
      
      {/* Barra Superior de Ações */}
      <div className="bg-[#4a154b] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-md print:hidden text-white">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Voltar (Ficha B)</span>
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide truncate">
              Ficha de Saúde E
            </h2>
            <span className="text-[11px] text-purple-200 block truncate">
              Informações Complementares para Educandos com Deficiência (CEFAI / SME-SP)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex bg-purple-900/60 p-1 rounded-lg border border-purple-700/50">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={cn(
                "px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === 'form' ? "bg-white text-purple-950 shadow" : "text-purple-200 hover:text-white"
              )}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Formulário</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={cn(
                "px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === 'preview' ? "bg-white text-purple-950 shadow" : "text-purple-200 hover:text-white"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visualizar Impressão</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir Ficha E</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-white text-purple-950 hover:bg-purple-50 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-extrabold shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">Salvar</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-green-100 border-b border-green-300 text-green-800 p-3 text-center text-sm font-bold flex justify-center items-center gap-2 print:hidden shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600" /> Dados da Ficha de Saúde E salvos com sucesso no sistema!
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. MODO FORMULÁRIO INTERATIVO                                   */}
      {/* ============================================================== */}
      {activeTab === 'form' && (
        <div className="p-4 sm:p-8 space-y-6 print:hidden">

          {/* Cabeçalho do Aluno */}
          <div className="p-5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-purple-200 pb-2">
              <h3 className="font-bold text-purple-950 text-sm sm:text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-700" />
                Prefeitura do Município de São Paulo - Ficha E
              </h3>
              <span className="text-xs font-bold px-3 py-1 bg-purple-200/80 text-purple-900 rounded-lg">
                EMEF TARSILA DO AMARAL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Estudante:</span>
                <strong className="text-gray-900 uppercase font-bold">{student.name}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Nascimento / Idade:</span>
                <strong className="text-gray-900">
                  {student.birthDate ? new Date(student.birthDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não informada'}
                  {student.birthDate && ` (${calculateAge(student.birthDate)})`}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Sexo / Cor:</span>
                <strong className="text-gray-900">{student.gender || '-'} | {student.race || '-'}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Mãe / Responsável:</span>
                <strong className="text-gray-900 uppercase font-bold">{student.motherName || student.guardianName || student.fatherName || '-'}</strong>
              </div>
            </div>
          </div>

          {/* Deficiência Apresentada */}
          <section className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-purple-950 text-sm uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
              <span>Deficiência / Dificuldade Apresentada</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={formData.deficiencia_fisica}
                  onChange={e => setFormData({ ...formData, deficiencia_fisica: e.target.checked })}
                  className="w-4 h-4 text-purple-700 rounded"
                />
                <span>Física</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={formData.deficiencia_mental}
                  onChange={e => setFormData({ ...formData, deficiencia_mental: e.target.checked })}
                  className="w-4 h-4 text-purple-700 rounded"
                />
                <span>Mental</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={formData.deficiencia_auditiva}
                  onChange={e => setFormData({ ...formData, deficiencia_auditiva: e.target.checked })}
                  className="w-4 h-4 text-purple-700 rounded"
                />
                <span>Auditiva</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={formData.deficiencia_visual}
                  onChange={e => setFormData({ ...formData, deficiencia_visual: e.target.checked })}
                  className="w-4 h-4 text-purple-700 rounded"
                />
                <span>Visual</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={formData.deficiencia_outras}
                  onChange={e => setFormData({ ...formData, deficiencia_outras: e.target.checked })}
                  className="w-4 h-4 text-purple-700 rounded"
                />
                <span>Outras</span>
              </label>
            </div>

            {formData.deficiencia_outras && (
              <input
                type="text"
                placeholder="Qual outra deficiência ou dificuldade?"
                value={formData.deficiencia_outras_qual}
                onChange={e => setFormData({ ...formData, deficiencia_outras_qual: e.target.value })}
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-200 outline-none"
              />
            )}

            <div className="space-y-1.5 pt-2">
              <label className="font-semibold text-xs sm:text-sm text-gray-900 block">
                1. Comente resumidamente a(s) dificuldade/deficiência(s) apresentada(s):
              </label>
              <textarea
                rows={3}
                value={formData.q1_comentario_resumido}
                onChange={e => setFormData({ ...formData, q1_comentario_resumido: e.target.value })}
                placeholder="Descreva as principais características, diagnóstico ou necessidades apresentadas pelo educando..."
                className="w-full border border-gray-300 p-3 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
              />
            </div>
          </section>

          {/* Histórico Escolar e Apoios */}
          <section className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-purple-950 text-sm uppercase tracking-wider border-b border-gray-100 pb-2">
              Histórico Familiar e Escolar
            </h4>

            <div className="space-y-1.5">
              <label className="font-semibold text-xs sm:text-sm text-gray-900 block">
                2. Tem mais alguém na família que apresenta algum tipo de deficiência? Qual o grau de parentesco e deficiência apresentada?
              </label>
              <input
                type="text"
                value={formData.q2_alguem_familia}
                onChange={e => setFormData({ ...formData, q2_alguem_familia: e.target.value })}
                placeholder="Ex: Não, ou Sim, irmão com TEA..."
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-200 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-xs sm:text-sm text-gray-900 block">
                  3. Com que idade começou a freqüentar escola?
                </label>
                <input
                  type="text"
                  value={formData.q3_idade_comecou_escola}
                  onChange={e => setFormData({ ...formData, q3_idade_comecou_escola: e.target.value })}
                  placeholder="Ex: 4 anos, 6 anos..."
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-xs sm:text-sm text-gray-900 block">
                  5. Que tipo de transporte utiliza para chegar à escola?
                </label>
                <input
                  type="text"
                  value={formData.q5_transporte_tipo}
                  onChange={e => setFormData({ ...formData, q5_transporte_tipo: e.target.value })}
                  placeholder="Ex: A pé, TEG (Transporte Escolar Gratuito), Ônibus comum, Carro..."
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <label className="font-semibold text-xs sm:text-sm text-gray-900">
                  4. Teve dificuldade em ingressar ou freqüentar a escola?
                </label>
                <YesNoRadio checked={formData.q4_dificuldade_ingressar} onChange={v => setFormData({ ...formData, q4_dificuldade_ingressar: v })} name="q4" />
              </div>
              {formData.q4_dificuldade_ingressar && (
                <input
                  type="text"
                  placeholder="Qual dificuldade?"
                  value={formData.q4_dificuldade_ingressar_qual}
                  onChange={e => setFormData({ ...formData, q4_dificuldade_ingressar_qual: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-200 outline-none mt-1"
                />
              )}
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <label className="font-semibold text-xs sm:text-sm text-gray-900">
                  6. Em relação à deficiência apresentada, necessita alguma atenção/cuidado especial?
                </label>
                <YesNoRadio checked={formData.q6_atencao_cuidado_especial} onChange={v => setFormData({ ...formData, q6_atencao_cuidado_especial: v })} name="q6" />
              </div>
              {formData.q6_atencao_cuidado_especial && (
                <input
                  type="text"
                  placeholder="Qual atenção / cuidado especial?"
                  value={formData.q6_atencao_cuidado_especial_qual}
                  onChange={e => setFormData({ ...formData, q6_atencao_cuidado_especial_qual: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-200 outline-none mt-1"
                />
              )}
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="font-semibold text-xs sm:text-sm text-gray-900 block">
                7. Como o educando / a educanda se comunica? Apresenta alguma dificuldade? Explique:
              </label>
              <textarea
                rows={2}
                value={formData.q7_comunicacao}
                onChange={e => setFormData({ ...formData, q7_comunicacao: e.target.value })}
                placeholder="Ex: Comunicação verbal clara, ou utiliza gestos, prancha de comunicação, fala poucas palavras..."
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-200 outline-none"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="font-semibold text-xs sm:text-sm text-gray-900 block">
                8. Existe alguma preocupação referente ao comportamento? Explique. Cite características que considera importante:
              </label>
              <textarea
                rows={3}
                value={formData.q8_comportamento}
                onChange={e => setFormData({ ...formData, q8_comportamento: e.target.value })}
                placeholder="Ex: Interação com colegas, foco nas atividades, agitação, momentos de crise ou desregulação, preferências..."
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-200 outline-none"
              />
            </div>
          </section>

          {/* Tecnologia Assistiva e Equipamentos */}
          <section className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-purple-950 text-sm uppercase tracking-wider border-b border-gray-100 pb-2">
              Recursos de Tecnologia Assistiva e Equipamentos (Questões 9 e 10)
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <label className="font-semibold text-xs sm:text-sm text-gray-900">
                  9. Necessita de recurso de tecnologia assistiva (órteses, próteses, equipamentos, adaptações ou outras ajudas técnicas)?
                </label>
                <YesNoRadio checked={formData.q9_necessita_tec_assistiva} onChange={v => setFormData({ ...formData, q9_necessita_tec_assistiva: v })} name="q9" />
              </div>

              {formData.q9_necessita_tec_assistiva && (
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-3">
                  <span className="text-xs font-bold text-purple-900 block uppercase">
                    Assinale os recursos necessários:
                  </span>

                  {/* Mobilidade */}
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-800">
                      <input
                        type="checkbox"
                        checked={formData.q9_mobilidade_check}
                        onChange={e => setFormData({ ...formData, q9_mobilidade_check: e.target.checked })}
                        className="w-4 h-4 text-purple-700 rounded"
                      />
                      <span>Recursos para mobilidade e adequação postural (cadeira de rodas, muletas, andador, bengala, órteses, próteses...)</span>
                    </label>
                    {formData.q9_mobilidade_check && (
                      <input
                        type="text"
                        placeholder="Quais recursos de mobilidade?"
                        value={formData.q9_mobilidade_quais}
                        onChange={e => setFormData({ ...formData, q9_mobilidade_quais: e.target.value })}
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
                      />
                    )}
                  </div>

                  {/* Ópticos */}
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-800">
                      <input
                        type="checkbox"
                        checked={formData.q9_opticos_check}
                        onChange={e => setFormData({ ...formData, q9_opticos_check: e.target.checked })}
                        className="w-4 h-4 text-purple-700 rounded"
                      />
                      <span>Recursos ópticos (lupa, lentes...)</span>
                    </label>
                    {formData.q9_opticos_check && (
                      <input
                        type="text"
                        placeholder="Quais recursos ópticos?"
                        value={formData.q9_opticos_quais}
                        onChange={e => setFormData({ ...formData, q9_opticos_quais: e.target.value })}
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
                      />
                    )}
                  </div>

                  {/* Comunicação */}
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-800">
                      <input
                        type="checkbox"
                        checked={formData.q9_comunicacao_check}
                        onChange={e => setFormData({ ...formData, q9_comunicacao_check: e.target.checked })}
                        className="w-4 h-4 text-purple-700 rounded"
                      />
                      <span>Recursos de comunicação (aparelho auditivo, sistemas alternativos/suplementares, LIBRAS, Braille...)</span>
                    </label>
                    {formData.q9_comunicacao_check && (
                      <input
                        type="text"
                        placeholder="Quais recursos de comunicação?"
                        value={formData.q9_comunicacao_quais}
                        onChange={e => setFormData({ ...formData, q9_comunicacao_quais: e.target.value })}
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
                      />
                    )}
                  </div>

                  {/* Acessibilidade */}
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-800">
                      <input
                        type="checkbox"
                        checked={formData.q9_acessibilidade_check}
                        onChange={e => setFormData({ ...formData, q9_acessibilidade_check: e.target.checked })}
                        className="w-4 h-4 text-purple-700 rounded"
                      />
                      <span>Acessibilidade do espaço físico e mobiliário escolar?</span>
                    </label>
                    {formData.q9_acessibilidade_check && (
                      <input
                        type="text"
                        placeholder="O quê?"
                        value={formData.q9_acessibilidade_qual}
                        onChange={e => setFormData({ ...formData, q9_acessibilidade_qual: e.target.value })}
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
                      />
                    )}
                  </div>

                  {/* Outros */}
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-800">
                      <input
                        type="checkbox"
                        checked={formData.q9_outros_check}
                        onChange={e => setFormData({ ...formData, q9_outros_check: e.target.checked })}
                        className="w-4 h-4 text-purple-700 rounded"
                      />
                      <span>Outros</span>
                    </label>
                    {formData.q9_outros_check && (
                      <input
                        type="text"
                        placeholder="Especifique outros recursos..."
                        value={formData.q9_outros_qual}
                        onChange={e => setFormData({ ...formData, q9_outros_qual: e.target.value })}
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Questão 10 */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <label className="font-semibold text-xs sm:text-sm text-gray-900 block">
                10. Caso necessite de algum tipo de equipamento/adaptação:
              </label>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800 font-medium">
                  <input
                    type="checkbox"
                    checked={formData.q10_possui_usa_frequente}
                    onChange={e => setFormData({ ...formData, q10_possui_usa_frequente: e.target.checked })}
                    className="w-4 h-4 text-purple-700 rounded"
                  />
                  <span>Possui o equipamento próprio e usa freqüentemente</span>
                </label>

                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800 font-medium">
                    <input
                      type="checkbox"
                      checked={formData.q10_possui_usa_pouco}
                      onChange={e => setFormData({ ...formData, q10_possui_usa_pouco: e.target.checked })}
                      className="w-4 h-4 text-purple-700 rounded"
                    />
                    <span>Possui, mas não usa ou usa pouco</span>
                  </label>
                  {formData.q10_possui_usa_pouco && (
                    <input
                      type="text"
                      placeholder="Motivo de usar pouco ou não usar:"
                      value={formData.q10_motivo_usa_pouco}
                      onChange={e => setFormData({ ...formData, q10_motivo_usa_pouco: e.target.value })}
                      className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white ml-6"
                    />
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800 font-medium">
                  <input
                    type="checkbox"
                    checked={formData.q10_tem_indicacao_nao_possui}
                    onChange={e => setFormData({ ...formData, q10_tem_indicacao_nao_possui: e.target.checked })}
                    className="w-4 h-4 text-purple-700 rounded"
                  />
                  <span>Tem indicação, mas não possui</span>
                </label>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <span className="text-xs sm:text-sm text-gray-800 font-semibold">
                      Se não possui, fez solicitação e está aguardando para adquirir o equipamento em algum local?
                    </span>
                    <YesNoRadio
                      checked={formData.q10_aguardando_solicitacao}
                      onChange={v => setFormData({ ...formData, q10_aguardando_solicitacao: v })}
                      name="q10_solic"
                    />
                  </div>
                  {formData.q10_aguardando_solicitacao && (
                    <input
                      type="text"
                      placeholder="Onde solicitou?"
                      value={formData.q10_aguardando_onde}
                      onChange={e => setFormData({ ...formData, q10_aguardando_onde: e.target.value })}
                      className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
                    />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Atendimentos Terapêuticos e Médicos (Questão 11) */}
          <section className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-purple-950 text-sm uppercase tracking-wider border-b border-gray-100 pb-2">
              11. Está em atendimento de:
            </h4>
            <p className="text-xs text-gray-500">
              Preencha os atendimentos terapêuticos e de saúde em que o estudante está vinculado:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-purple-50 text-purple-950 uppercase font-bold text-[11px]">
                  <tr>
                    <th className="p-2.5 border-b border-gray-200">Especialidade</th>
                    <th className="p-2.5 border-b border-gray-200">Início</th>
                    <th className="p-2.5 border-b border-gray-200">Local</th>
                    <th className="p-2.5 border-b border-gray-200">Nome Profissional</th>
                    <th className="p-2.5 border-b border-gray-200">Tel. Contato</th>
                    <th className="p-2.5 border-b border-gray-200">Freqüência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {ATENDIMENTOS_FIXED.map(item => {
                    const at = formData.q11_atendimentos?.[item.key] || {};
                    return (
                      <tr key={`form-${item.key}`} className="hover:bg-purple-50/20">
                        <td className="p-2 font-bold text-gray-800 whitespace-nowrap">{item.label}</td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="Ex: 03/2024"
                            value={at.inicio || ''}
                            onChange={e => updateAtendimento(item.key, 'inicio', e.target.value)}
                            className="w-24 border border-gray-300 p-1.5 rounded text-xs bg-white"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="Clínica / UBS / CER..."
                            value={at.local || ''}
                            onChange={e => updateAtendimento(item.key, 'local', e.target.value)}
                            className="w-full min-w-[120px] border border-gray-300 p-1.5 rounded text-xs bg-white"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="Nome do profissional"
                            value={at.profissional || ''}
                            onChange={e => updateAtendimento(item.key, 'profissional', e.target.value)}
                            className="w-full min-w-[130px] border border-gray-300 p-1.5 rounded text-xs bg-white"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="(00) 00000-0000"
                            value={at.tel || ''}
                            onChange={e => updateAtendimento(item.key, 'tel', maskPhone(e.target.value))}
                            className="w-32 border border-gray-300 p-1.5 rounded text-xs bg-white"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="Ex: 2x semana"
                            value={at.freq || ''}
                            onChange={e => updateAtendimento(item.key, 'freq', e.target.value)}
                            className="w-28 border border-gray-300 p-1.5 rounded text-xs bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Atendimento Anterior (Questão 12) */}
          <section className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-purple-950 text-sm uppercase tracking-wider border-b border-gray-100 pb-2">
              12. Avaliação ou Tratamento Anterior
            </h4>

            <div className="space-y-3">
              <label className="font-semibold text-xs sm:text-sm text-gray-900 block">
                Se atualmente não está em nenhum desses atendimentos, alguma vez passou por avaliação ou tratamento?
              </label>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="radio"
                    name="q12_avaliacao"
                    checked={formData.q12_avaliacao_anterior === false}
                    onChange={() => setFormData({ ...formData, q12_avaliacao_anterior: false })}
                    className="w-4 h-4 text-purple-700"
                  />
                  <span>Não</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="radio"
                    name="q12_avaliacao"
                    checked={formData.q12_avaliacao_anterior === true}
                    onChange={() => setFormData({ ...formData, q12_avaliacao_anterior: true })}
                    className="w-4 h-4 text-purple-700"
                  />
                  <span>Sim</span>
                </label>
              </div>

              {formData.q12_avaliacao_anterior === false && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Por quê?</label>
                  <input
                    type="text"
                    value={formData.q12_motivo_nao}
                    onChange={e => setFormData({ ...formData, q12_motivo_nao: e.target.value })}
                    placeholder="Explique o motivo de nunca ter passado por avaliação..."
                    className="w-full border border-gray-300 p-2.5 rounded-xl text-sm bg-white"
                  />
                </div>
              )}

              {formData.q12_avaliacao_anterior === true && (
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Onde?</label>
                      <input
                        type="text"
                        value={formData.q12_onde_sim}
                        onChange={e => setFormData({ ...formData, q12_onde_sim: e.target.value })}
                        placeholder="Local / Instituição"
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Nome Profissional para Contato</label>
                      <input
                        type="text"
                        value={formData.q12_profissional}
                        onChange={e => setFormData({ ...formData, q12_profissional: e.target.value })}
                        placeholder="Nome do profissional"
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Telefone</label>
                      <input
                        type="text"
                        value={formData.q12_telefone}
                        onChange={e => setFormData({ ...formData, q12_telefone: maskPhone(e.target.value) })}
                        placeholder="(00) 00000-0000"
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-gray-800 block">Por que parou o atendimento?</label>
                    <div className="flex flex-wrap items-center gap-4">
                      {['Alta', 'Abandono', 'Outro'].map(motivo => (
                        <label key={motivo} className="flex items-center gap-1.5 cursor-pointer text-sm font-medium">
                          <input
                            type="radio"
                            name="motivo_parou"
                            checked={formData.q12_motivo_parou.toLowerCase() === motivo.toLowerCase()}
                            onChange={() => setFormData({ ...formData, q12_motivo_parou: motivo.toLowerCase() })}
                            className="w-4 h-4 text-purple-700"
                          />
                          <span>{motivo}</span>
                        </label>
                      ))}
                    </div>

                    {formData.q12_motivo_parou === 'outro' && (
                      <input
                        type="text"
                        value={formData.q12_motivo_parou_outro}
                        onChange={e => setFormData({ ...formData, q12_motivo_parou_outro: e.target.value })}
                        placeholder="Descreva o motivo pelo qual parou..."
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white mt-1"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Questões 13 a 15 - Família e Rotina */}
          <section className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-purple-950 text-sm uppercase tracking-wider border-b border-gray-100 pb-2">
              Família, Rotina e Observações
            </h4>

            <div className="space-y-1.5">
              <label className="font-semibold text-xs sm:text-sm text-gray-900 block">
                13. Relacionamento Familiar: Quem mora na casa? Como é o relacionamento do educando/da educanda com os familiares?
              </label>
              <textarea
                rows={3}
                value={formData.q13_relacionamento_familiar}
                onChange={e => setFormData({ ...formData, q13_relacionamento_familiar: e.target.value })}
                placeholder="Ex: Mora com a mãe e dois irmãos. Convívio harmonioso, muito apegado à mãe..."
                className="w-full border border-gray-300 p-3 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-200 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-xs sm:text-sm text-gray-900 block">
                14. Quando não está na escola, onde e com quem costuma ficar? O que costuma e gosta de fazer? O que a família acha que o educando faz bem, com maior facilidade?
              </label>
              <textarea
                rows={3}
                value={formData.q14_rotina_fora_escola}
                onChange={e => setFormData({ ...formData, q14_rotina_fora_escola: e.target.value })}
                placeholder="Ex: Fica em casa com os avós. Gosta de desenhar, ouvir música, jogos de montar. Tem facilidade com tecnologia e raciocínio visual..."
                className="w-full border border-gray-300 p-3 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-200 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-xs sm:text-sm text-gray-900 block">
                15. Existe mais alguma observação que você gostaria de fazer com relação à criança/adolescente?
              </label>
              <textarea
                rows={3}
                value={formData.q15_observacao_crianca}
                onChange={e => setFormData({ ...formData, q15_observacao_crianca: e.target.value })}
                placeholder="Observações complementares, orientações específicas para a equipe escolar e professores..."
                className="w-full border border-gray-300 p-3 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-200 outline-none"
              />
            </div>
          </section>

          {/* Responsável pelo Preenchimento e Data */}
          <div className="p-5 bg-purple-50/70 rounded-2xl border border-purple-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs sm:text-sm text-gray-900 block">
                  Responsável pelo preenchimento
                </label>
                {!isCustomResponsavel && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomResponsavel(true);
                      setFormData({ ...formData, responsavel_preenchimento: '' });
                    }}
                    className="text-xs text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
                  >
                    + Outro responsável
                  </button>
                )}
              </div>

              {!isCustomResponsavel ? (
                <select
                  value={formData.responsavel_preenchimento}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '__OUTRO__') {
                      setIsCustomResponsavel(true);
                      setFormData({ ...formData, responsavel_preenchimento: '' });
                    } else {
                      setFormData({ ...formData, responsavel_preenchimento: val });
                    }
                  }}
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-purple-300 font-medium"
                >
                  <option value="">Selecione o responsável pelo preenchimento...</option>
                  {responsibleOptions.map(opt => (
                    <option key={opt.name} value={opt.name}>{opt.label}</option>
                  ))}
                  {formData.responsavel_preenchimento && !responsibleOptions.some(o => o.name === formData.responsavel_preenchimento) && (
                    <option value={formData.responsavel_preenchimento}>Outro: {formData.responsavel_preenchimento}</option>
                  )}
                  <option value="__OUTRO__">➕ Adicionar outro responsável (digitar)...</option>
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Digite o nome completo do responsável..."
                    value={formData.responsavel_preenchimento}
                    onChange={e => setFormData({ ...formData, responsavel_preenchimento: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-purple-300 font-medium"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomResponsavel(false)}
                    className="px-3.5 py-3 bg-gray-100 hover:bg-gray-200 text-purple-950 font-bold text-xs rounded-xl border border-gray-300 transition-colors shrink-0 shadow-sm cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Lista</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-xs sm:text-sm text-gray-900 block">
                Data do preenchimento
              </label>
              <input
                type="date"
                value={formData.data_preenchimento}
                onChange={e => setFormData({ ...formData, data_preenchimento: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-purple-300 font-medium"
              />
            </div>
          </div>

          {/* Botões Finais de Ação */}
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-300 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer shadow-sm order-2 sm:order-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Ficha de Saúde B</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto px-8 py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 cursor-pointer order-1 sm:order-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Salvando Ficha E...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Salvar Ficha de Saúde E</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. RÉPLICA EXATA DO MODELO OFICIAL (IMPRESSÃO / PREVIEW)       */}
      {/* ============================================================== */}
      <div className={cn(
        "bg-white font-sans text-black leading-normal",
        activeTab === 'preview' ? "block p-4 sm:p-10 max-w-[210mm] mx-auto shadow-2xl border border-gray-300 my-8" : "hidden print:block print:w-[210mm] print:mx-auto print:p-0 print:m-0"
      )}>
        <style type="text/css" media="all">
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-hide { display: none !important; }
              * { box-sizing: border-box; }
            }
            .page-break {
              page-break-after: always;
              break-after: page;
            }
            .ruled-line {
              border-bottom: 1px solid #111;
              min-height: 18px;
              width: 100%;
            }
          `}
        </style>

        {/* ---------------- PÁGINA 1 ---------------- */}
        <div className="page-break flex flex-col justify-between" style={{ minHeight: '277mm' }}>
          <div>
            {/* Topo: Brasão + Título + Caixa Unidade Educacional */}
            <div className="flex items-start justify-between gap-2 mb-2 pb-1">
              {/* Brasão */}
              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                <img src={brasaoSp} alt="Brasão PMSP" className="max-h-16 max-w-16 object-contain" />
              </div>

              {/* Título Centralizado */}
              <div className="flex-1 text-center px-1">
                <h1 className="font-bold text-[13px] uppercase tracking-wide leading-tight">
                  PREFEITURA DO MUNICÍPIO DE SÃO PAULO
                </h1>

                <div className="flex items-center justify-center gap-3 my-0.5">
                  <span className="font-bold text-[12px] uppercase">FICHA</span>
                  <span className="font-extrabold text-[28px] leading-none" style={{ fontFamily: 'Arial, sans-serif' }}>E</span>
                  <div className="text-left font-bold text-[9.5px] uppercase leading-tight">
                    INFORMAÇÕES COMPLEMENTARES PARA EDUCANDOS<br />
                    E EDUCANDAS COM DEFICIÊNCIA
                  </div>
                </div>

                <div className="text-[9px] font-bold text-gray-800 tracking-wider">
                  CEI / EMEI / EMEF / EMEFM / EMEE
                </div>
              </div>

              {/* Caixa Unidade Educacional */}
              <div className="w-56 border border-black p-1 text-[9.5px] shrink-0" style={{ minHeight: '45px' }}>
                <span className="font-normal block text-[9px]">Unidade Educacional</span>
                <span className="font-bold text-[10px] block mt-1 uppercase">
                  {formData.unidade_educacional || 'EMEF TARSILA DO AMARAL'}
                </span>
              </div>
            </div>

            {/* Quadro de Dados do Educando */}
            <div className="border border-black text-[10px] mb-2">
              {/* Linha 1: Nome */}
              <div className="p-1 border-b border-black">
                <span className="font-normal">Nome: </span>
                <span className="font-bold uppercase tracking-wide">{student.name}</span>
              </div>

              {/* Linha 2: Sexo / Cor / Data Nasc / Idade */}
              <div className="grid grid-cols-12 border-b border-black divide-x divide-black text-[9.5px]">
                <div className="col-span-3 p-1 flex items-center gap-2">
                  <span>Sexo</span>
                  <span className="inline-flex items-center gap-1 font-bold">
                    [{student.gender?.toLowerCase() === 'masculino' ? 'X' : ' '}] Masc.
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold">
                    [{student.gender?.toLowerCase() === 'feminino' ? 'X' : ' '}] Fem.
                  </span>
                </div>
                <div className="col-span-2 p-1">
                  <span>Cor: </span>
                  <span className="font-bold">{student.race || ''}</span>
                </div>
                <div className="col-span-4 p-1">
                  <span>Data de Nascimento: </span>
                  <span className="font-bold">
                    {student.birthDate ? new Date(student.birthDate + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
                  </span>
                </div>
                <div className="col-span-3 p-1">
                  <span>Idade: </span>
                  <span className="font-bold">{calculateAge(student.birthDate)}</span>
                </div>
              </div>

              {/* Linha 3: Nome da mãe/responsável */}
              <div className="p-1 text-[9.5px]">
                <span>Nome da mãe/responsável: </span>
                <span className="font-bold uppercase">
                  {student.motherName || student.guardianName || student.fatherName || ''}
                </span>
              </div>
            </div>

            {/* Quadro Principal com Perguntas de 1 a 9 */}
            <div className="border border-black text-[10px] divide-y divide-black">
              
              {/* Deficiência/dificuldade */}
              <div className="p-1.5 font-bold text-[9.5px] flex items-center justify-between flex-wrap gap-1">
                <span>Deficiência/dificuldade:</span>
                <span className="font-normal">
                  ({formData.deficiencia_fisica ? 'X' : ' '}) Física &nbsp;&nbsp;
                  ({formData.deficiencia_mental ? 'X' : ' '}) Mental &nbsp;&nbsp;
                  ({formData.deficiencia_auditiva ? 'X' : ' '}) Auditiva &nbsp;&nbsp;
                  ({formData.deficiencia_visual ? 'X' : ' '}) Visual &nbsp;&nbsp;
                  ({formData.deficiencia_outras ? 'X' : ' '}) Outras {formData.deficiencia_outras_qual && `(${formData.deficiencia_outras_qual})`}
                </span>
              </div>

              {/* Questão 1 */}
              <div className="p-1.5 space-y-1">
                <div className="font-normal leading-tight">
                  1. Comente resumidamente a(s) dificuldade/deficiência(s) apresentada(s):
                </div>
                <div className="text-[9.5px] font-bold text-gray-900 leading-relaxed min-h-[16mm] pt-0.5">
                  {formData.q1_comentario_resumido || (
                    <div className="space-y-3 pt-2">
                      <div className="ruled-line"></div>
                      <div className="ruled-line"></div>
                      <div className="ruled-line"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Questão 2 */}
              <div className="p-1.5 space-y-1">
                <div className="font-normal leading-tight">
                  2. Tem mais alguém na família que apresenta algum tipo de deficiência?
                  Qual o grau de parentesco e deficiência apresentada?
                </div>
                <div className="text-[9.5px] font-bold text-gray-900 min-h-[12mm] pt-0.5">
                  {formData.q2_alguem_familia || (
                    <div className="space-y-3 pt-2">
                      <div className="ruled-line"></div>
                      <div className="ruled-line"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Questão 3 */}
              <div className="p-1.5 flex items-center justify-between">
                <div className="font-normal">
                  3. Com que idade começou a freqüentar escola? &nbsp;
                  <span className="font-bold underline">{formData.q3_idade_comecou_escola || '___________________________'}</span>
                </div>
              </div>

              {/* Questão 4 */}
              <div className="p-1.5 space-y-1">
                <div className="font-normal flex items-center flex-wrap gap-2">
                  <span>4. Teve dificuldade em ingressar ou freqüentar a escola?</span>
                  <span>({formData.q4_dificuldade_ingressar === false ? 'X' : ' '}) Não</span>
                  <span>({formData.q4_dificuldade_ingressar === true ? 'X' : ' '}) Sim. Qual?</span>
                  <span className="font-bold underline">{formData.q4_dificuldade_ingressar ? formData.q4_dificuldade_ingressar_qual : ''}</span>
                </div>
                {!formData.q4_dificuldade_ingressar_qual && (
                  <div className="space-y-2.5 pt-1">
                    <div className="ruled-line"></div>
                  </div>
                )}
              </div>

              {/* Questão 5 */}
              <div className="p-1.5 space-y-1">
                <div className="font-normal">
                  5. Que tipo de transporte utiliza para chegar à escola? &nbsp;
                  <span className="font-bold underline">{formData.q5_transporte_tipo || ''}</span>
                </div>
                {!formData.q5_transporte_tipo && (
                  <div className="space-y-2.5 pt-1">
                    <div className="ruled-line"></div>
                  </div>
                )}
              </div>

              {/* Questão 6 */}
              <div className="p-1.5 space-y-1">
                <div className="font-normal flex items-center flex-wrap gap-2">
                  <span>6. Em relação à deficiência apresentada, necessita alguma atenção/cuidado especial?</span>
                  <span>({formData.q6_atencao_cuidado_especial === false ? 'X' : ' '}) Não</span>
                  <span>({formData.q6_atencao_cuidado_especial === true ? 'X' : ' '}) Sim. Qual?</span>
                  <span className="font-bold underline">{formData.q6_atencao_cuidado_especial ? formData.q6_atencao_cuidado_especial_qual : ''}</span>
                </div>
                {!formData.q6_atencao_cuidado_especial_qual && (
                  <div className="space-y-2.5 pt-1">
                    <div className="ruled-line"></div>
                  </div>
                )}
              </div>

              {/* Questão 7 */}
              <div className="p-1.5 space-y-1">
                <div className="font-normal leading-tight">
                  7. Como o educando / a educanda se comunica? Apresenta alguma dificuldade? Explique.
                </div>
                <div className="text-[9.5px] font-bold text-gray-900 leading-relaxed min-h-[14mm] pt-0.5">
                  {formData.q7_comunicacao || (
                    <div className="space-y-3 pt-2">
                      <div className="ruled-line"></div>
                      <div className="ruled-line"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Questão 8 */}
              <div className="p-1.5 space-y-1">
                <div className="font-normal leading-tight">
                  8. Existe alguma preocupação referente ao comportamento? Explique. Cite características do educando / da educanda que você considera importante:
                </div>
                <div className="text-[9.5px] font-bold text-gray-900 leading-relaxed min-h-[18mm] pt-0.5">
                  {formData.q8_comportamento || (
                    <div className="space-y-3 pt-2">
                      <div className="ruled-line"></div>
                      <div className="ruled-line"></div>
                      <div className="ruled-line"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Questão 9 */}
              <div className="p-1.5 space-y-1">
                <div className="font-normal leading-tight">
                  9. Necessita de recurso de tecnologia assistiva (órteses, próteses, equipamentos, adaptações ou outras ajudas técnicas) para realizar suas atividades? Assinale-o(s):
                </div>
                <div className="flex items-center gap-6 pt-1 font-bold">
                  <span>({formData.q9_necessita_tec_assistiva === false ? 'X' : ' '}) Não</span>
                  <span>({formData.q9_necessita_tec_assistiva === true ? 'X' : ' '}) Sim.</span>
                </div>
              </div>

            </div>
          </div>

          <div className="text-right text-[8.5px] text-gray-500 pt-1">
            Página 1 de 2
          </div>
        </div>

        {/* ---------------- PÁGINA 2 ---------------- */}
        <div className="flex flex-col justify-between pt-1" style={{ minHeight: '277mm' }}>
          <div>
            {/* Caixa externa da Página 2 */}
            <div className="border border-black text-[10px] divide-y divide-black">
              
              {/* Sub-itens da Questão 9 */}
              <div className="p-1.5 space-y-1.5">
                <div>
                  ({formData.q9_mobilidade_check ? 'X' : ' '}) Recursos para mobilidade e adequação postural (cadeira de rodas, muletas, andador, bengala, órteses, próteses...)
                  <br />
                  Quais? <span className="font-bold underline">{formData.q9_mobilidade_quais || '_______________________________________________________________________________________'}</span>
                </div>
                <div>
                  ({formData.q9_opticos_check ? 'X' : ' '}) Recursos ópticos (lupa, lentes, ...)
                  <br />
                  Quais? <span className="font-bold underline">{formData.q9_opticos_quais || '_______________________________________________________________________________________'}</span>
                </div>
                <div>
                  ({formData.q9_comunicacao_check ? 'X' : ' '}) Recursos de comunicação (aparelho auditivo, sistemas de comunicação alternativo e/ou suplementar, LIBRAS, BRAILLE...)
                  <br />
                  Quais? <span className="font-bold underline">{formData.q9_comunicacao_quais || '_______________________________________________________________________________________'}</span>
                </div>
                <div>
                  ({formData.q9_acessibilidade_check ? 'X' : ' '}) Acessibilidade do espaço físico e mobiliário escolar?
                  <br />
                  O quê? <span className="font-bold underline">{formData.q9_acessibilidade_qual || '_______________________________________________________________________________________'}</span>
                </div>
                <div>
                  ({formData.q9_outros_check ? 'X' : ' '}) Outros: <span className="font-bold underline">{formData.q9_outros_qual || '_____________________________________________________________________________________________'}</span>
                </div>
              </div>

              {/* Questão 10 */}
              <div className="p-1.5 space-y-1">
                <div className="font-normal">10. Caso necessite de algum tipo de equipamento/adaptação:</div>
                <div className="space-y-1 pl-1">
                  <div>({formData.q10_possui_usa_frequente ? 'X' : ' '}) Possui o equipamento próprio e usa freqüentemente</div>
                  <div>
                    ({formData.q10_possui_usa_pouco ? 'X' : ' '}) Possui, mas não usa ou usa pouco. Motivo: &nbsp;
                    <span className="font-bold underline">{formData.q10_motivo_usa_pouco || '_________________________________________________________________'}</span>
                  </div>
                  <div>({formData.q10_tem_indicacao_nao_possui ? 'X' : ' '}) Tem indicação, mas não possui.</div>
                  <div className="pt-0.5">
                    Se não possui, fez solicitação e está aguardando para adquirir o equipamento em algum local?
                    <br />
                    ({formData.q10_aguardando_solicitacao === false ? 'X' : ' '}) Não &nbsp;&nbsp;&nbsp;&nbsp;
                    ({formData.q10_aguardando_solicitacao === true ? 'X' : ' '}) Sim. Onde? &nbsp;
                    <span className="font-bold underline">{formData.q10_aguardando_onde || '___________________________________________________________________________'}</span>
                  </div>
                </div>
              </div>

              {/* Questão 11 - Tabela Oficial de Atendimentos */}
              <div className="p-1.5 space-y-1">
                <div className="font-normal mb-1">11. Está em atendimento de:</div>
                <table className="w-full border-collapse border border-black text-[9px] text-center">
                  <thead>
                    <tr className="border-b border-black font-bold">
                      <th className="border border-black p-1 text-left w-28">Especialidade</th>
                      <th className="border border-black p-1 w-16">Início</th>
                      <th className="border border-black p-1">Local</th>
                      <th className="border border-black p-1">Nome Profissional</th>
                      <th className="border border-black p-1 w-24">Tel. Contato</th>
                      <th className="border border-black p-1 w-28">Freqüência atendimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ATENDIMENTOS_FIXED.map(item => {
                      const at = formData.q11_atendimentos?.[item.key] || {};
                      return (
                        <tr key={`print-row-${item.key}`} className="border-b border-black">
                          <td className="border border-black p-1 text-left font-semibold">
                            {item.label}
                          </td>
                          <td className="border border-black p-1 font-bold">
                            {at.inicio || '____ / ____'}
                          </td>
                          <td className="border border-black p-1 font-bold text-left px-1.5">
                            {at.local || ''}
                          </td>
                          <td className="border border-black p-1 font-bold text-left px-1.5">
                            {at.profissional || ''}
                          </td>
                          <td className="border border-black p-1 font-bold">
                            {at.tel || ''}
                          </td>
                          <td className="border border-black p-1 font-bold text-left px-1.5">
                            {at.freq || ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Questão 12 */}
              <div className="p-1.5 space-y-1">
                <div className="font-normal leading-tight">
                  12. Se atualmente não está em nenhum desses atendimentos, alguma vez passou por avaliação ou tratamento?
                </div>
                <div className="pl-1 space-y-1">
                  <div>
                    ({formData.q12_avaliacao_anterior === false ? 'X' : ' '}) Não. Porquê? &nbsp;
                    <span className="font-bold underline">{formData.q12_avaliacao_anterior === false ? formData.q12_motivo_nao : '___________________________________________________________________________________'}</span>
                  </div>
                  <div>
                    ({formData.q12_avaliacao_anterior === true ? 'X' : ' '}) Sim. Onde? &nbsp;
                    <span className="font-bold underline">{formData.q12_avaliacao_anterior === true ? formData.q12_onde_sim : '___________________________________________________________________________________'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>
                      Nome profissional para contato: &nbsp;
                      <span className="font-bold underline">{formData.q12_profissional || '________________________________________________'}</span>
                    </span>
                    <span>
                      Telefone: &nbsp;
                      <span className="font-bold underline">{formData.q12_telefone || '______________________'}</span>
                    </span>
                  </div>
                  <div className="pt-0.5">
                    Por que parou o atendimento? &nbsp;&nbsp;
                    ({formData.q12_motivo_parou === 'alta' ? 'X' : ' '}) Alta &nbsp;&nbsp;&nbsp;&nbsp;
                    ({formData.q12_motivo_parou === 'abandono' ? 'X' : ' '}) Abandono &nbsp;&nbsp;&nbsp;&nbsp;
                    ({formData.q12_motivo_parou === 'outro' ? 'X' : ' '}) Outro: &nbsp;
                    <span className="font-bold underline">{formData.q12_motivo_parou_outro || '_______________________________________________'}</span>
                  </div>
                </div>
              </div>

              {/* Questão 13 */}
              <div className="p-1.5 space-y-1">
                <div className="font-normal leading-tight">
                  13. Relacionamento Familiar: Quem mora na casa? Como é o relacionamento do educando/da educanda com os familiares?
                </div>
                <div className="text-[9.5px] font-bold text-gray-900 leading-relaxed min-h-[14mm] pt-0.5">
                  {formData.q13_relacionamento_familiar || (
                    <div className="space-y-3 pt-2">
                      <div className="ruled-line"></div>
                      <div className="ruled-line"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Questão 14 */}
              <div className="p-1.5 space-y-1">
                <div className="font-normal leading-tight">
                  14. Quando não está na escola, onde e com quem costuma ficar? O que costuma e gosta de fazer? O que a família acha que o educando/ a educanda faz bem, com maior facilidade?
                </div>
                <div className="text-[9.5px] font-bold text-gray-900 leading-relaxed min-h-[16mm] pt-0.5">
                  {formData.q14_rotina_fora_escola || (
                    <div className="space-y-3 pt-2">
                      <div className="ruled-line"></div>
                      <div className="ruled-line"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Questão 15 */}
              <div className="p-1.5 space-y-1">
                <div className="font-normal leading-tight">
                  15. Existe mais alguma observação que você gostaria de fazer com relação à criança/adolescente?
                </div>
                <div className="text-[9.5px] font-bold text-gray-900 leading-relaxed min-h-[14mm] pt-0.5">
                  {formData.q15_observacao_crianca || (
                    <div className="space-y-3 pt-2">
                      <div className="ruled-line"></div>
                      <div className="ruled-line"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé / Assinatura */}
              <div className="p-3 pt-4 flex items-end justify-between text-[10px]">
                <div className="flex-1 mr-6">
                  <span>Resp. pelo preenchimento: &nbsp;</span>
                  <span className="font-bold underline uppercase">
                    {formData.responsavel_preenchimento || '__________________________________________________________________'}
                  </span>
                </div>
                <div className="shrink-0">
                  <span>Data: &nbsp;</span>
                  <span className="font-bold underline">
                    {formData.data_preenchimento ? new Date(formData.data_preenchimento + 'T12:00:00').toLocaleDateString('pt-BR') : '_____ / _____ / _________'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          <div className="text-right text-[8.5px] text-gray-500 pt-1">
            Página 2 de 2
          </div>
        </div>

      </div>

    </div>
  );
}
