import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Printer, ArrowLeft, Loader2, CheckCircle2, Settings, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FichaSaudeData, initialFichaSaudeData } from '../types/saude';
import { Student } from '../types';

interface FichaSaudeProps {
  student: Student;
  onBack: () => void;
}

export interface PrintConfig {
  page1Height: number;
  page2Height: number;
  questionsSpacing: number;
  headerBoxWidth: number;
  titleLeftShift: number;
  logoWidth: number;
  logoHeight: number;
  greyBoxSubHeight: number;
  fontFamily: string;
  baseFontSize: number;
  textColor: string;
  elementHeights: Record<string, number>;
}

const defaultPrintConfig: PrintConfig = {
  page1Height: 277,
  page2Height: 277,
  questionsSpacing: 9,
  headerBoxWidth: 220,
  titleLeftShift: 32,
  logoWidth: 60,
  logoHeight: 70,
  greyBoxSubHeight: 185,
  fontFamily: 'sans-serif',
  baseFontSize: 11,
  textColor: '#000000',
  elementHeights: {},
};

export default function FichaSaude({ student, onBack }: FichaSaudeProps) {
  const [printConfig, setPrintConfig] = useState<PrintConfig>(() => {
    const saved = localStorage.getItem('@PortalTarsila:FichaSaudeB_PrintConfig');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultPrintConfig, ...parsed, elementHeights: parsed.elementHeights || {} };
    }
    return defaultPrintConfig;
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const updateConfig = (key: keyof PrintConfig, val: number) => {
    setPrintConfig(prev => {
      const next = { ...prev, [key]: val };
      localStorage.setItem('@PortalTarsila:FichaSaudeB_PrintConfig', JSON.stringify(next));
      return next;
    });
  };

  const handleResize = (e: React.MouseEvent<HTMLDivElement | HTMLTableCellElement>, keys: {w?: keyof PrintConfig, h?: keyof PrintConfig}) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (keys.w) updateConfig(keys.w, Math.round(rect.width));
    if (keys.h) updateConfig(keys.h, Math.round(rect.height));
  };

  const updateElementHeight = (id: string, height: number) => {
    setPrintConfig(prev => {
      const next = {
        ...prev,
        elementHeights: { ...prev.elementHeights, [id]: height }
      };
      localStorage.setItem('@PortalTarsila:FichaSaudeB_PrintConfig', JSON.stringify(next));
      return next;
    });
  };

  const handleElementResize = (e: React.MouseEvent<HTMLElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    updateElementHeight(id, Math.round(rect.height));
  };

  const getResizeProps = (id: string) => ({
    style: { height: printConfig.elementHeights[id] ? `${printConfig.elementHeights[id]}px` : 'auto', resize: isPreviewMode ? 'vertical' as const : 'none' as const, overflow: 'hidden' as const },
    onMouseUp: (e: React.MouseEvent<HTMLElement>) => handleElementResize(e, id),
    className: isPreviewMode ? 'hover:outline hover:outline-dashed hover:outline-blue-400' : ''
  });

  const [formData, setFormData] = useState<FichaSaudeData>({
    ...initialFichaSaudeData,
    id_aluno: Number(student.id)
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, [student.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('FICHA_SAUDE_B')
        .select('*')
        .eq('id_aluno', student.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setFormData({ 
          ...initialFichaSaudeData, 
          ...data,
          q7_tipo: data.q7_tipo || [],
          q13_tipo: data.q13_tipo || [],
          situacao_vacinal: data.situacao_vacinal || initialFichaSaudeData.situacao_vacinal,
          acuidade_visual: data.acuidade_visual || initialFichaSaudeData.acuidade_visual,
          saude_bucal: data.saude_bucal || initialFichaSaudeData.saude_bucal,
          programa_social: data.programa_social || [],
        });
      }
    } catch (error) {
      console.error('Error loading ficha de saude:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);

      const { data, error } = await supabase
        .from('FICHA_SAUDE_B')
        .upsert({
          id_aluno: student.id,
          ...formData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id_aluno' })
        .select();

      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving ficha de saude:', error);
      alert('Erro ao salvar os dados.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const updateCheckboxArray = (field: 'q7_tipo' | 'q13_tipo' | 'programa_social', value: string, checked: boolean) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      if (checked) {
        return { ...prev, [field]: [...current, value] };
      } else {
        return { ...prev, [field]: current.filter(item => item !== value) };
      }
    });
  };

  const updateVacina = (vacina: string, dose: keyof typeof initialFichaSaudeData.situacao_vacinal.BCG, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      situacao_vacinal: {
        ...prev.situacao_vacinal,
        [vacina]: {
          ...prev.situacao_vacinal[vacina],
          [dose]: checked
        }
      }
    }));
  };

  const updateSaudeBucal = (field: 'mes_ano' | 'risco_carie' | 'fluorterapia', index: number, value: string) => {
    setFormData(prev => {
      const newArray = [...prev.saude_bucal[field]];
      newArray[index] = value;
      return {
        ...prev,
        saude_bucal: {
          ...prev.saude_bucal,
          [field]: newArray
        }
      };
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-[#3b5998] animate-spin" />
      </div>
    );
  }

  const YesNoRadio = ({ checked, onChange, name }: { checked: boolean | undefined, onChange: (val: boolean) => void, name: string }) => (
    <div className="flex gap-4">
      <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={checked === false} onChange={() => onChange(false)} name={name} className="w-4 h-4 text-[#3b5998]" /> Não</label>
      <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={checked === true} onChange={() => onChange(true)} name={name} className="w-4 h-4 text-[#3b5998]" /> Sim</label>
    </div>
  );

  const PrintCheck = ({ checked, label, underline }: { checked: boolean, label?: string, underline?: boolean }) => (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span className="border border-black inline-block w-4 h-4 text-center leading-4 text-xs font-bold bg-white">{checked ? 'X' : '\u00A0'}</span>
      {label && <span className={underline ? "underline" : ""}>{label}</span>}
    </span>
  );

  const PrintLine = ({ val, width = 'flex-1' }: { val: string | undefined, width?: string }) => (
    <span className={`inline-block border-b border-black text-center min-w-[20px] ${width}`}>{val || '\u00A0'}</span>
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
      
      {/* Botões Superiores - Escondidos na impressão */}
      <div className="bg-[#3b5998] p-6 flex items-center justify-between print:hidden sticky top-0 z-20">
        <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </button>
        <h2 className="text-xl font-bold text-white uppercase">Ficha de Saúde B</h2>
        <div className="flex gap-3">
          <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors shadow-sm ${isPreviewMode ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500' : 'bg-gray-200 text-[#0f254e] hover:bg-gray-300'}`}>
            <Settings className="w-4 h-4" /> {isPreviewMode ? 'Voltar ao Formulário' : 'Visualizar Layout'}
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-white text-[#3b5998] px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors disabled:opacity-50">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg">
            <Printer className="w-4 h-4" /> Imprimir Ficha
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-green-100 text-green-700 p-3 text-center text-sm font-bold flex justify-center items-center gap-2 print:hidden">
          <CheckCircle2 className="w-4 h-4" /> Dados salvos com sucesso!
        </div>
      )}

      {isPreviewMode && (
        <>
          <div className="bg-yellow-50 text-yellow-800 p-4 text-center text-sm font-bold border-b border-yellow-200 print:hidden flex items-center justify-center gap-2">
            <Settings className="w-5 h-5" /> 
            Você está no Modo de Edição Visual. Clique e arraste o canto inferior direito de QUALQUER caixa para redimensioná-la. As alterações são salvas automaticamente!
          </div>

          <div className="fixed top-32 right-8 bg-white p-5 shadow-2xl rounded-xl z-50 border border-gray-200 print:hidden flex flex-col gap-4 w-64">
            <div className="font-bold text-gray-700 border-b pb-2 mb-2">Tipografia Global</div>
            
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Fonte do Documento</label>
              <select 
                value={printConfig.fontFamily} 
                onChange={e => updateConfig('fontFamily', e.target.value as any)}
                className="w-full border border-gray-300 rounded p-1.5 text-sm"
              >
                <option value="sans-serif">Padrão (Sans-serif)</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="'Courier New', monospace">Courier New</option>
                <option value="Roboto, sans-serif">Roboto</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Tamanho Base (px)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="range" 
                  min="8" max="16" step="0.5"
                  value={printConfig.baseFontSize} 
                  onChange={e => updateConfig('baseFontSize', Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-bold w-8 text-right">{printConfig.baseFontSize}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Cor do Texto</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={printConfig.textColor} 
                  onChange={e => updateConfig('textColor', e.target.value as any)}
                  className="w-full h-8 cursor-pointer rounded"
                />
              </div>
            </div>

            <button onClick={() => {
                 localStorage.removeItem('@PortalTarsila:FichaSaudeB_PrintConfig');
                 setPrintConfig(defaultPrintConfig);
              }} className="w-full mt-2 text-xs text-red-600 border border-red-200 rounded p-2 hover:bg-red-50 font-bold transition-colors">
                Restaurar Padrões Iniciais
            </button>
          </div>
        </>
      )}

      {/* FORMULÁRIO TELA (Screen Only) */}
      <div className={`p-4 md:p-8 max-h-[80vh] overflow-y-auto bg-gray-50 text-sm ${isPreviewMode ? 'hidden' : 'print:hidden'}`}>
        <div className="max-w-4xl mx-auto space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
          
          <section>
            <h3 className="text-xl font-bold border-b pb-2 text-[#0f254e] mb-4">Cabeçalho (Preenchimento Automático)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div><span className="font-bold text-gray-700">Aluno:</span> {student.name}</div>
              <div><span className="font-bold text-gray-700">Nº Matrícula:</span> {student.id}</div>
              <div><span className="font-bold text-gray-700">Data Nascimento:</span> {student.birthDate ? new Date(student.birthDate + 'T12:00:00').toLocaleDateString('pt-BR') : ''}</div>
              <div><span className="font-bold text-gray-700">Sexo:</span> {student.gender} | <span className="font-bold text-gray-700">Cor:</span> {student.race}</div>
              <div><span className="font-bold text-gray-700">Mãe/Responsável:</span> {student.guardianName || student.motherName}</div>
              <div><span className="font-bold text-gray-700">Fone:</span> {student.guardianPhone || student.motherPhone}</div>
              <div className="col-span-1 md:col-span-2"><span className="font-bold text-gray-700">Endereço:</span> {student.street}, {student.number} {student.complement} - {student.neighborhood}</div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold border-b pb-2 text-[#0f254e] mb-4">Informações Gerais</h3>
            <div className="space-y-4">
              
              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">1 – Teve algum problema de saúde ao nascimento?</label>
                <YesNoRadio checked={formData.q1_problema_nascimento} onChange={v => setFormData({...formData, q1_problema_nascimento: v})} name="q1" />
                {formData.q1_problema_nascimento && <input type="text" placeholder="Qual?" className="border border-gray-300 p-2 rounded-lg w-full mt-1" value={formData.q1_qual} onChange={e => setFormData({...formData, q1_qual: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                 <label className="font-semibold">2 – Teve diagnóstico de anemia nos primeiros dois anos de vida?</label>
                 <YesNoRadio checked={formData.q2_anemia} onChange={v => setFormData({...formData, q2_anemia: v})} name="q2" />
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">3 – Foi internado (a) alguma vez?</label>
                <YesNoRadio checked={formData.q3_internado} onChange={v => setFormData({...formData, q3_internado: v})} name="q3" />
                {formData.q3_internado && <input type="text" placeholder="Especificar (motivo e idade)" className="border border-gray-300 p-2 rounded-lg w-full mt-1" value={formData.q3_motivo_idade} onChange={e => setFormData({...formData, q3_motivo_idade: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">4 – Tem algum problema de saúde?</label>
                <YesNoRadio checked={formData.q4_problema_saude} onChange={v => setFormData({...formData, q4_problema_saude: v})} name="q4" />
                {formData.q4_problema_saude && <input type="text" placeholder="Qual?" className="border border-gray-300 p-2 rounded-lg w-full mt-1" value={formData.q4_qual} onChange={e => setFormData({...formData, q4_qual: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">5 – Está fazendo algum tipo de tratamento de saúde?</label>
                <YesNoRadio checked={formData.q5_tratamento} onChange={v => setFormData({...formData, q5_tratamento: v})} name="q5" />
                {formData.q5_tratamento && <input type="text" placeholder="Qual e onde?" className="border border-gray-300 p-2 rounded-lg w-full mt-1" value={formData.q5_qual_onde} onChange={e => setFormData({...formData, q5_qual_onde: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">6 – Necessita de dieta especial?</label>
                <YesNoRadio checked={formData.q6_dieta} onChange={v => setFormData({...formData, q6_dieta: v})} name="q6" />
                {formData.q6_dieta && <input type="text" placeholder="Por que?" className="border border-gray-300 p-2 rounded-lg w-full mt-1" value={formData.q6_por_que} onChange={e => setFormData({...formData, q6_por_que: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">7 – Tem algum tipo de deficiência?</label>
                <YesNoRadio checked={formData.q7_deficiencia} onChange={v => setFormData({...formData, q7_deficiencia: v})} name="q7" />
                {formData.q7_deficiencia && (
                  <div className="space-y-3 mt-2">
                    <input type="text" placeholder="Qual?" className="border border-gray-300 p-2 rounded-lg w-full" value={formData.q7_qual} onChange={e => setFormData({...formData, q7_qual: e.target.value})} />
                    <div className="flex flex-wrap gap-4">
                      {['visual', 'auditiva', 'mental', 'física', 'múltipla'].map(tipo => (
                        <label key={tipo} className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4 rounded text-[#3b5998]" checked={formData.q7_tipo.includes(tipo)} onChange={e => updateCheckboxArray('q7_tipo', tipo, e.target.checked)} />
                          {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">8 – Pode praticar atividades físicas?</label>
                <YesNoRadio checked={formData.q8_atividade_fisica} onChange={v => setFormData({...formData, q8_atividade_fisica: v})} name="q8" />
                {!formData.q8_atividade_fisica && <input type="text" placeholder="Por que não?" className="border border-gray-300 p-2 rounded-lg w-full mt-1" value={formData.q8_nao_por_que} onChange={e => setFormData({...formData, q8_nao_por_que: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">9 – Existe algum problema de saúde na família?</label>
                <YesNoRadio checked={formData.q9_problema_familia} onChange={v => setFormData({...formData, q9_problema_familia: v})} name="q9" />
                {formData.q9_problema_familia && <input type="text" placeholder="Qual?" className="border border-gray-300 p-2 rounded-lg w-full mt-1" value={formData.q9_qual} onChange={e => setFormData({...formData, q9_qual: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">10 – Qual é a Unidade Básica de Saúde que utiliza?</label>
                <input type="text" className="border border-gray-300 p-2 rounded-lg w-full" value={formData.q10_ubs} onChange={e => setFormData({...formData, q10_ubs: e.target.value})} />
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">11 – Tem Convênio Médico?</label>
                <YesNoRadio checked={formData.q11_convenio} onChange={v => setFormData({...formData, q11_convenio: v})} name="q11" />
                {formData.q11_convenio && <input type="text" placeholder="Qual?" className="border border-gray-300 p-2 rounded-lg w-full mt-1" value={formData.q11_qual} onChange={e => setFormData({...formData, q11_qual: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">12 – Em caso de febre, a escola está autorizada a medicar com:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                  <input type="text" placeholder="Medicamento" className="border border-gray-300 p-2 rounded-lg w-full" value={formData.q12_medicamento_febre} onChange={e => setFormData({...formData, q12_medicamento_febre: e.target.value})} />
                  <input type="text" placeholder="Dose" className="border border-gray-300 p-2 rounded-lg w-full" value={formData.q12_dose} onChange={e => setFormData({...formData, q12_dose: e.target.value})} />
                </div>
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">13 – Tem algum tipo de alergia?</label>
                <YesNoRadio checked={formData.q13_alergia} onChange={v => setFormData({...formData, q13_alergia: v})} name="q13" />
                {formData.q13_alergia && (
                  <div className="space-y-3 mt-2">
                    <input type="text" placeholder="Qual?" className="border border-gray-300 p-2 rounded-lg w-full" value={formData.q13_qual} onChange={e => setFormData({...formData, q13_qual: e.target.value})} />
                    <div className="flex flex-wrap gap-4">
                      {['Alimento', 'Medicamento', 'Outro'].map(tipo => (
                        <label key={tipo} className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4 rounded text-[#3b5998]" checked={formData.q13_tipo.includes(tipo)} onChange={e => updateCheckboxArray('q13_tipo', tipo, e.target.checked)} />
                          {tipo}
                        </label>
                      ))}
                    </div>
                    {formData.q13_tipo.includes('Outro') && <input type="text" placeholder="Especificar outro" className="border border-gray-300 p-2 rounded-lg w-full" value={formData.q13_especificar} onChange={e => setFormData({...formData, q13_especificar: e.target.value})} />}
                  </div>
                )}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">14 – Informação de problemas identificados na vivência escolar (ex: cognitivo, afetivo)</label>
                <textarea className="border border-gray-300 p-2 rounded-lg w-full min-h-[80px]" value={formData.q14_vivencia} onChange={e => setFormData({...formData, q14_vivencia: e.target.value})} />
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">15 – Em caso de doença, a escola deverá chamar:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                  <input type="text" placeholder="Nome 1" className="border border-gray-300 p-2 rounded-lg w-full" value={formData.q15_emergencia_nome_1} onChange={e => setFormData({...formData, q15_emergencia_nome_1: e.target.value})} />
                  <input type="text" placeholder="Telefone 1" className="border border-gray-300 p-2 rounded-lg w-full" value={formData.q15_emergencia_tel_1} onChange={e => setFormData({...formData, q15_emergencia_tel_1: e.target.value})} />
                  <input type="text" placeholder="Nome 2" className="border border-gray-300 p-2 rounded-lg w-full" value={formData.q15_emergencia_nome_2} onChange={e => setFormData({...formData, q15_emergencia_nome_2: e.target.value})} />
                  <input type="text" placeholder="Telefone 2" className="border border-gray-300 p-2 rounded-lg w-full" value={formData.q15_emergencia_tel_2} onChange={e => setFormData({...formData, q15_emergencia_tel_2: e.target.value})} />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold border-b pb-2 text-[#0f254e] mb-4">Diagnóstico Atual</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              {[
                {label: 'Anemia', field: 'diag_anemia'},
                {label: 'Doença Celíaca', field: 'diag_celiaca'},
                {label: 'Asma/ Bronquite', field: 'diag_asma'},
                {label: 'Fenilcetonúria', field: 'diag_fenilcetonuria'},
                {label: 'Diabetes', field: 'diag_diabetes'},
                {label: 'Obesidade', field: 'diag_obesidade'},
                {label: 'Desnutrição', field: 'diag_desnutricao'},
                {label: 'Problema cardíaco', field: 'diag_cardiaco'},
                {label: 'Problema digestivo', field: 'diag_digestivo'},
                {label: 'Probl. Neurológico', field: 'diag_neurologico'},
                {label: 'Convulsões/Ataques', field: 'diag_convulsoes'},
                {label: 'Outra doença', field: 'diag_outra_doenca'}
              ].map(item => (
                <div key={item.field} className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="font-medium">{item.label}</span>
                  <YesNoRadio checked={formData[item.field as keyof FichaSaudeData] as boolean} onChange={v => setFormData({...formData, [item.field]: v})} name={item.field} />
                </div>
              ))}
              <div className="col-span-1 md:col-span-2 mt-2">
                <label className="font-semibold">Especificar doença/tratamento*</label>
                <textarea className="border border-gray-300 p-2 rounded-lg w-full mt-1" value={formData.diag_especificar} onChange={e => setFormData({...formData, diag_especificar: e.target.value})} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold border-b pb-2 text-[#0f254e] mb-4">Situação Vacinal</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white text-left">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-3 border">Tipo de Vacina</th>
                    <th className="p-3 border text-center">1ª dose</th>
                    <th className="p-3 border text-center">2ª dose</th>
                    <th className="p-3 border text-center">3ª dose</th>
                    <th className="p-3 border text-center">1º reforço</th>
                    <th className="p-3 border text-center">2º reforço</th>
                  </tr>
                </thead>
                <tbody>
                  {['BCG', 'Sabin', 'DPT', 'Tetravalente', 'Hib', 'Sarampo', 'TripliceViral', 'HepatiteB', 'Outra'].map(vacina => (
                    <tr key={vacina} className="hover:bg-gray-50">
                      <td className="p-3 border font-medium">{vacina === 'TripliceViral' ? 'Tríplice viral' : vacina === 'HepatiteB' ? 'Hepatite B' : vacina}</td>
                      {(['d1', 'd2', 'd3', 'ref1', 'ref2'] as const).map(dose => (
                        <td key={dose} className="p-3 border text-center">
                          <input type="checkbox" className="w-5 h-5 rounded text-[#3b5998] cursor-pointer"
                                 checked={formData.situacao_vacinal[vacina as keyof typeof formData.situacao_vacinal]?.[dose] || false}
                                 onChange={e => updateVacina(vacina, dose, e.target.checked)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold border-b pb-2 text-[#0f254e] mb-4">Teste de Acuidade Visual</h3>
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><label className="font-semibold text-xs block">Data</label><input type="date" className="border p-2 rounded w-full" value={formData.acuidade_visual.data} onChange={e => setFormData({...formData, acuidade_visual: {...formData.acuidade_visual, data: e.target.value}})} /></div>
                <div><label className="font-semibold text-xs block">Idade</label><input type="text" className="border p-2 rounded w-full" value={formData.acuidade_visual.idade} onChange={e => setFormData({...formData, acuidade_visual: {...formData.acuidade_visual, idade: e.target.value}})} /></div>
                <div><label className="font-semibold text-xs block">Resultado OD</label><input type="text" className="border p-2 rounded w-full" value={formData.acuidade_visual.resultado_od} onChange={e => setFormData({...formData, acuidade_visual: {...formData.acuidade_visual, resultado_od: e.target.value}})} /></div>
                <div><label className="font-semibold text-xs block">Resultado OE</label><input type="text" className="border p-2 rounded w-full" value={formData.acuidade_visual.resultado_oe} onChange={e => setFormData({...formData, acuidade_visual: {...formData.acuidade_visual, resultado_oe: e.target.value}})} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-xs block">Consulta Oftalmo (Datas)</label>
                  <div className="flex gap-2">
                    <input type="date" className="border p-2 rounded w-full" value={formData.acuidade_visual.consulta_oftalmo_data_1} onChange={e => setFormData({...formData, acuidade_visual: {...formData.acuidade_visual, consulta_oftalmo_data_1: e.target.value}})} />
                    <input type="date" className="border p-2 rounded w-full" value={formData.acuidade_visual.consulta_oftalmo_data_2} onChange={e => setFormData({...formData, acuidade_visual: {...formData.acuidade_visual, consulta_oftalmo_data_2: e.target.value}})} />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-xs block mb-2">Utiliza óculos ou lentes corretivas?</label>
                  <YesNoRadio checked={formData.usa_oculos} onChange={v => setFormData({...formData, usa_oculos: v})} name="usa_oculos" />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold border-b pb-2 text-[#0f254e] mb-4">Saúde Auditiva</h3>
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-semibold text-sm block mb-2">Ouve bem?</label>
                  <YesNoRadio checked={formData.ouve_bem} onChange={v => setFormData({...formData, ouve_bem: v})} name="ouve_bem" />
                </div>
                <div>
                  <label className="font-semibold text-sm block mb-2">Tem atraso ou alteração da fala?</label>
                  <YesNoRadio checked={formData.atraso_fala} onChange={v => setFormData({...formData, atraso_fala: v})} name="atraso_fala" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                <div><label className="font-semibold text-xs block">Encaminhamentos</label><input type="text" className="border p-2 rounded w-full" value={formData.saude_auditiva_encaminhamentos} onChange={e => setFormData({...formData, saude_auditiva_encaminhamentos: e.target.value})} /></div>
                <div><label className="font-semibold text-xs block">Resultados</label><input type="text" className="border p-2 rounded w-full" value={formData.saude_auditiva_resultados} onChange={e => setFormData({...formData, saude_auditiva_resultados: e.target.value})} /></div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold border-b pb-2 text-[#0f254e] mb-4">Saúde Bucal</h3>
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="grid grid-cols-4 gap-4">
                <div className="font-semibold text-sm col-span-4">Mês/ano</div>
                {[0,1,2,3].map(i => <input key={`mes${i}`} type="month" className="border p-2 rounded w-full text-xs" value={formData.saude_bucal.mes_ano[i]} onChange={e => updateSaudeBucal('mes_ano', i, e.target.value)} />)}
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="font-semibold text-sm col-span-4">Risco de cárie <span className="text-xs font-normal text-gray-500 ml-2">(A = baixo risco, B/C = médio, D/E/F = alto)</span></div>
                {[0,1,2,3].map(i => <input key={`risco${i}`} type="text" maxLength={1} className="border p-2 rounded w-full text-center uppercase" placeholder="A-F" value={formData.saude_bucal.risco_carie[i]} onChange={e => updateSaudeBucal('risco_carie', i, e.target.value.toUpperCase())} />)}
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="font-semibold text-sm col-span-4">Fluorterapia semanal seriada (se risco D, E, F) - Datas</div>
                {[0,1,2,3].map(i => <input key={`fluor${i}`} type="date" className="border p-2 rounded w-full text-xs" value={formData.saude_bucal.fluorterapia[i]} onChange={e => updateSaudeBucal('fluorterapia', i, e.target.value)} />)}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold border-b pb-2 text-[#0f254e] mb-4">Programas Sociais</h3>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <label className="font-semibold block mb-3">A família e/ou a criança participam de algum programa social do governo?</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Bolsa Alimentação', 'Bolsa-Escola', 'Começar de Novo', 'Renda-Mínima', 'Nenhum', 'Outro'].map(prog => (
                  <label key={prog} className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 rounded text-[#3b5998]" checked={formData.programa_social.includes(prog)} onChange={e => updateCheckboxArray('programa_social', prog, e.target.checked)} />
                    {prog}
                  </label>
                ))}
              </div>
            </div>
          </section>

          <div className="flex flex-col md:flex-row gap-6 p-4 bg-blue-50/30 rounded-lg border border-blue-100">
            <div className="flex-1">
              <label className="font-semibold block mb-1">Responsável pelo preenchimento</label>
              <input type="text" placeholder="Nome do Responsável" className="border border-gray-300 p-3 rounded-lg w-full" value={formData.responsavel_preenchimento} onChange={e => setFormData({...formData, responsavel_preenchimento: e.target.value})} />
            </div>
            <div className="w-full md:w-1/3">
              <label className="font-semibold block mb-1">Data</label>
              <input type="date" className="border border-gray-300 p-3 rounded-lg w-full" value={formData.data_preenchimento} onChange={e => setFormData({...formData, data_preenchimento: e.target.value})} />
            </div>
          </div>

        </div>
      </div>

      {/* LAYOUT DE IMPRESSÃO - Réplica exata */}
      <div className={`print-container ${isPreviewMode ? 'block my-8 shadow-2xl border border-gray-300 mx-auto w-[210mm] bg-white p-[10mm] leading-tight relative' : 'hidden print:block print:w-[210mm] print:mx-auto bg-white p-[10mm] leading-tight'}`} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        <style type="text/css" media="all">
          {`
            @media print {
              @page { size: A4; margin: 0; }
            }
            .print-container {
               font-family: ${printConfig.fontFamily} !important;
               font-size: ${printConfig.baseFontSize}px !important;
               color: ${printConfig.textColor} !important;
            }
            .print-container .text-\\[11px\\] { font-size: 1em !important; }
            .print-container .text-\\[10px\\] { font-size: 0.9em !important; }
            .print-container .text-\\[13px\\] { font-size: 1.18em !important; }
            .print-container .text-\\[15px\\] { font-size: 1.36em !important; }
            .print-container .text-xs { font-size: 1.05em !important; }
            .print-container .text-sm { font-size: 1.15em !important; }
            .print-container .text-lg { font-size: 1.5em !important; }
            .print-container .text-3xl { font-size: 2.7em !important; }
            
            .print-container * {
               font-family: inherit;
               color: inherit;
            }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            ::-webkit-resizer { display: none; }
          `}
        </style>
        
        {/* === PÁGINA 1 === */}
        <div className="box-border relative break-after-page" style={{ height: `${printConfig.page1Height}mm` }}>
          <div className="ml-[28px]">
            <div className="flex justify-between items-start mb-2">
            <div onMouseUp={(e) => handleResize(e, {w: 'logoWidth', h: 'logoHeight'})} className={`border border-black flex items-center justify-center text-[10px] text-center font-bold mt-2 ${isPreviewMode ? 'hover:outline hover:outline-blue-500' : ''}`} style={{ width: `${printConfig.logoWidth}px`, height: `${printConfig.logoHeight}px`, resize: isPreviewMode ? 'both' : 'none', overflow: 'hidden' }}>
              BRASÃO
            </div>
            <div className="flex-1 text-center font-bold text-[13px] tracking-wide pt-1 relative" style={{ left: `${printConfig.titleLeftShift}px` }}>
              PREFEITURA DO MUNICÍPIO DE SÃO PAULO
              <div className="mt-1 text-[15px] tracking-widest">FICHA DE <span className="underline">SAÚDE</span> <span className="text-3xl font-black">B</span></div>
              <div className="text-xs font-bold mt-0.5">EMEI / EMEF<br/><span className="font-normal text-[11px]">(4 a 14 anos)</span></div>
            </div>
            <div onMouseUp={(e) => handleResize(e, {w: 'headerBoxWidth'})} className={`border-2 border-black p-1.5 text-[11px] h-14 font-bold mt-3 ${isPreviewMode ? 'hover:outline hover:outline-blue-500' : ''}`} style={{ width: `${printConfig.headerBoxWidth}px`, resize: isPreviewMode ? 'horizontal' : 'none', overflow: 'hidden' }}>
              Unidade Educacional<br/>
              <span className="font-normal">EMEF Tarsila do Amaral</span>
            </div>
            </div>

            <table className="w-full border-collapse border border-black text-[10px] mb-2">
              <tbody>
                <tr>
                  <td colSpan={4} className="border border-black p-1 align-top font-bold" {...getResizeProps('td_nome')}>
                    Nome<br/>
                    <span className="font-normal">{student.name}</span>
                </td>
                <td className="border border-black p-1 align-top font-bold" {...getResizeProps('td_matricula')}>
                  Nº de matrícula<br/>
                  <span className="font-normal">{student.id}</span>
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 font-bold whitespace-nowrap" {...getResizeProps('td_sexo')}>
                  sexo &nbsp; 
                  <span className="border border-black px-1.5 mx-0.5 text-center inline-block w-4 h-4 leading-4 font-bold">{student.gender === 'Masculino' ? 'X' : ''}</span> M
                  <span className="border border-black px-1.5 mx-0.5 ml-2 text-center inline-block w-4 h-4 leading-4 font-bold">{student.gender === 'Feminino' ? 'X' : ''}</span> F
                </td>
                <td className="border border-black p-1 font-bold w-1/4" {...getResizeProps('td_cor')}>
                  cor<br/>
                  <span className="font-normal">{student.race}</span>
                </td>
                <td colSpan={2} className="border border-black p-1 font-bold w-1/4" {...getResizeProps('td_nascimento')}>
                  Data de Nascimento<br/>
                  <span className="font-normal">{student.birthDate ? new Date(student.birthDate + 'T12:00:00').toLocaleDateString('pt-BR') : ''}</span>
                </td>
                <td className="border border-black p-1 font-bold w-1/4" {...getResizeProps('td_idade')}>
                  Idade<br/>
                  <span className="font-normal">
                    {student.birthDate ? Math.floor((new Date().getTime() - new Date(student.birthDate).getTime()) / 31557600000) + ' anos' : ''}
                  </span>
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="border border-black p-1 align-top font-bold" {...getResizeProps('td_mae')}>
                  Nome da mãe / responsável<br/>
                  <span className="font-normal">{student.guardianName || student.motherName}</span>
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="border border-black p-1 align-top font-bold" {...getResizeProps('td_endereco')}>
                  Endereço<br/>
                  <span className="font-normal">{student.street}, {student.number} {student.complement} - {student.neighborhood} - {student.city}</span>
                </td>
                <td className="border border-black p-1 align-top font-bold" {...getResizeProps('td_fone')}>
                  Fone<br/>
                  <span className="font-normal">{student.guardianPhone || student.motherPhone}</span>
                </td>
              </tr>
            </tbody>
          </table>
          </div>

          <div className="flex mb-2">
            <div className="w-6 mr-1 flex justify-center font-bold text-xs relative">
               <span className="-rotate-90 font-black whitespace-nowrap absolute tracking-widest text-lg top-[120px]">Informações gerais</span>
            </div>
            
            <div className="flex-1 relative">
              <div className="absolute -right-[6px] -bottom-[6px] bg-[#999999] w-full h-full z-0"></div>
              
              <div className="border border-black bg-white z-10 relative h-full p-2 px-3 text-[11px] leading-tight overflow-hidden flex flex-col" style={{ gap: `${printConfig.questionsSpacing}px` }}>
                <div {...getResizeProps('q1')}>
                  1 – Teve algum problema de saúde ao nascimento? &nbsp;&nbsp;&nbsp; 
                  <PrintCheck checked={!formData.q1_problema_nascimento} label="Não" /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <PrintCheck checked={formData.q1_problema_nascimento} label="Sim, " /> <span className="underline text-blue-800">qual ?</span> 
                  <PrintLine val={formData.q1_problema_nascimento ? formData.q1_qual : ''} width="w-48" />
                </div>
                
                <div className="pt-1" {...getResizeProps('q2')}>
                  2 – Teve diagnóstico de anemia nos primeiros dois anos de vida? &nbsp;&nbsp;&nbsp;
                  <PrintCheck checked={!formData.q2_anemia} label="Não" /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <PrintCheck checked={formData.q2_anemia} label="Sim" />
                </div>

                <div {...getResizeProps('q3')}>
                  3 – Foi internado (a) alguma vez? &nbsp;&nbsp;&nbsp;
                  <PrintCheck checked={!formData.q3_internado} label="Não" /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <PrintCheck checked={formData.q3_internado} label="Sim. Especificar (" /><strong>motivo e idade</strong>):
                  <div className="border-b border-black w-full h-4 relative -top-1"><span className="absolute bottom-0 left-0">{formData.q3_internado ? formData.q3_motivo_idade : ''}</span></div>
                </div>

                <div className="pt-0" {...getResizeProps('q4')}>
                  4 – Tem algum problema de saúde? &nbsp;&nbsp;&nbsp; 
                  <PrintCheck checked={!formData.q4_problema_saude} label="Não" /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <PrintCheck checked={formData.q4_problema_saude} label="Sim, qual?" /> <PrintLine val={formData.q4_problema_saude ? formData.q4_qual : ''} width="w-64" />
                </div>

                <div {...getResizeProps('q5')}>
                  5 – Está fazendo algum tipo de tratamento de saúde? &nbsp;&nbsp;&nbsp; 
                  <PrintCheck checked={!formData.q5_tratamento} label="Não" /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <PrintCheck checked={formData.q5_tratamento} label="Sim. Qual e onde?" />
                  <div className="border-b border-black w-full h-4 relative -top-1"><span className="absolute bottom-0 left-0">{formData.q5_tratamento ? formData.q5_qual_onde : ''}</span></div>
                </div>

                <div className="pt-0" {...getResizeProps('q6')}>
                  6 – Necessita de dieta especial? &nbsp;&nbsp;&nbsp; 
                  <PrintCheck checked={!formData.q6_dieta} label="Não" /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <PrintCheck checked={formData.q6_dieta} label="Sim, " /> <span className="underline text-blue-800">por que?</span> <PrintLine val={formData.q6_dieta ? formData.q6_por_que : ''} width="w-64" />
                </div>

                <div {...getResizeProps('q7')}>
                  7 – Tem algum tipo de deficiência? &nbsp;&nbsp;&nbsp; 
                  <PrintCheck checked={!formData.q7_deficiencia} label="Não" /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <PrintCheck checked={formData.q7_deficiencia} label="Sim, qual?" /> <PrintLine val={formData.q7_deficiencia ? formData.q7_qual : ''} width="w-64" />
                  <div className="mt-1 flex gap-4">
                    <PrintCheck checked={formData.q7_tipo.includes('visual')} label="visual" />
                    <PrintCheck checked={formData.q7_tipo.includes('auditiva')} label="auditiva" />
                    <PrintCheck checked={formData.q7_tipo.includes('mental')} label="mental" />
                    <PrintCheck checked={formData.q7_tipo.includes('física')} label="física" />
                    <PrintCheck checked={formData.q7_tipo.includes('múltipla')} label="múltipla" />
                    <PrintLine val="" width="flex-1" />
                  </div>
                </div>

                <div className="pt-0" {...getResizeProps('q8')}>
                  8 – <span className="underline text-blue-800">Pode praticar</span> atividades físicas? &nbsp;&nbsp;&nbsp; 
                  <PrintCheck checked={formData.q8_atividade_fisica} label="Sim" /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <PrintCheck checked={!formData.q8_atividade_fisica} label="Não, " /> <span className="underline text-blue-800">por que?</span> 
                  <div className="border-b border-black w-full h-4 relative -top-1"><span className="absolute bottom-0 left-0">{!formData.q8_atividade_fisica ? formData.q8_nao_por_que : ''}</span></div>
                </div>

                <div className="pt-0" {...getResizeProps('q9')}>
                  9 – Existe algum problema de saúde na <span className="underline text-blue-800">família ?</span> &nbsp;&nbsp;&nbsp; 
                  <PrintCheck checked={!formData.q9_problema_familia} label="Não" /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <PrintCheck checked={formData.q9_problema_familia} label="Sim Qual?" /> <PrintLine val={formData.q9_problema_familia ? formData.q9_qual : ''} width="w-48" />
                  <div className="border-b border-black w-full h-4"></div>
                </div>

                <div className="pt-0" {...getResizeProps('q10')}>
                  <span className="underline text-blue-800">10 – Qual é</span> a Unidade Básica de Saúde que utiliza? <PrintLine val={formData.q10_ubs} width="w-64" />
                </div>

                <div {...getResizeProps('q11')}>
                  11 – Tem Convênio Médico? &nbsp;&nbsp;&nbsp; 
                  <PrintCheck checked={!formData.q11_convenio} label="Não" /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <PrintCheck checked={formData.q11_convenio} label="Sim, qual?" /> <PrintLine val={formData.q11_convenio ? formData.q11_qual : ''} width="w-64" />
                </div>

                <div {...getResizeProps('q12')}>
                  12 – Em caso de febre, a escola está autorizada a medicar com:<br/>
                  <PrintLine val={formData.q12_medicamento_febre} width="w-1/2" /> Dose: <PrintLine val={formData.q12_dose} width="w-1/3" />
                </div>

                <div className="pt-0" {...getResizeProps('q13')}>
                  13 – Tem algum tipo de alergia? &nbsp;&nbsp;&nbsp; 
                  <PrintCheck checked={!formData.q13_alergia} label="Não" /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <PrintCheck checked={formData.q13_alergia} label="Sim, qual?" />
                  <div className="mt-1 flex gap-8">
                    <PrintCheck checked={formData.q13_tipo.includes('Alimento')} label="Alimento" /> <PrintLine val="" width="w-32" />
                    <PrintCheck checked={formData.q13_tipo.includes('Medicamento')} label="Medicamento" /> <PrintLine val="" width="w-48" />
                  </div>
                  <div className="mt-1">
                    <PrintCheck checked={formData.q13_tipo.includes('Outro')} label="Outro" /> Especificar: <PrintLine val={formData.q13_especificar} width="w-64" />
                  </div>
                </div>

                <div className="pt-0" {...getResizeProps('q14')}>
                  14 – Informação de problemas identificados na vivência escolar (ex: cognitivo, afetivo)
                  <div className="border-b border-black w-full h-4 relative"><span className="absolute bottom-0 left-0">{formData.q14_vivencia}</span></div>
                  <div className="border-b border-black w-full h-4"></div>
                </div>

                <div className="pt-0 pb-1" {...getResizeProps('q15')}>
                  15 – Em caso de doença, a escola deverá chamar:<br/>
                  <div className="flex justify-between mt-1">
                    <span className="w-2/3">Nome <PrintLine val={formData.q15_emergencia_nome_1} width="w-[80%]" /></span>
                    <span className="w-1/3">Telefone: <PrintLine val={formData.q15_emergencia_tel_1} width="w-[60%]" /></span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="w-2/3">Nome <PrintLine val={formData.q15_emergencia_nome_2} width="w-[80%]" /></span>
                    <span className="w-1/3">Telefone: <PrintLine val={formData.q15_emergencia_tel_2} width="w-[60%]" /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === PÁGINA 2 === */}
        <div className="pt-0 box-border" style={{ height: `${printConfig.page2Height}mm` }}>
          
          <div className="flex mb-3">
            <div className="w-6 mr-1 flex items-center justify-center font-bold text-xs relative">
               <span className="-rotate-90 whitespace-nowrap absolute">Diagnóstico atual</span>
            </div>
            <table className="w-full border-collapse border-2 border-black text-[10px]">
              <tbody>
                <tr>
                  <td colSpan={4} className="border border-black p-1 font-bold bg-gray-50">Tem diagnóstico de</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 w-1/4">Anemia <span className="float-right"><PrintCheck checked={!formData.diag_anemia} label="Não"/> &nbsp;&nbsp;<PrintCheck checked={formData.diag_anemia} label="Sim"/></span></td>
                  <td className="border border-black p-1 w-1/4">Doença Celíaca <span className="float-right"><PrintCheck checked={!formData.diag_celiaca} label="Não"/> &nbsp;&nbsp;<PrintCheck checked={formData.diag_celiaca} label="Sim"/></span></td>
                  <td rowSpan={4} colSpan={2} className="border-2 border-black p-1 text-center align-top relative w-1/2" {...getResizeProps('td_especificar_diag')}>
                    <div className="font-bold mb-1 border-b border-black pb-1">Especificar doença/tratamento*</div>
                    <div className="text-left">{formData.diag_especificar}</div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1">Asma/ Bronquite <span className="float-right"><PrintCheck checked={!formData.diag_asma} label="Não"/> &nbsp;&nbsp;<PrintCheck checked={formData.diag_asma} label="Sim"/></span></td>
                  <td className="border border-black p-1">Fenilcetonúria <span className="float-right"><PrintCheck checked={!formData.diag_fenilcetonuria} label="Não"/> &nbsp;&nbsp;<PrintCheck checked={formData.diag_fenilcetonuria} label="Sim"/></span></td>
                </tr>
                <tr>
                  <td className="border border-black p-1">Diabetes <span className="float-right"><PrintCheck checked={!formData.diag_diabetes} label="Não"/> &nbsp;&nbsp;<PrintCheck checked={formData.diag_diabetes} label="Sim"/></span></td>
                  <td className="border border-black p-1">Obesidade <span className="float-right"><PrintCheck checked={!formData.diag_obesidade} label="Não"/> &nbsp;&nbsp;<PrintCheck checked={formData.diag_obesidade} label="Sim"/></span></td>
                </tr>
                <tr>
                  <td className="border border-black p-1">Desnutrição <span className="float-right"><PrintCheck checked={!formData.diag_desnutricao} label="Não"/> &nbsp;&nbsp;<PrintCheck checked={formData.diag_desnutricao} label="Sim"/></span></td>
                  <td className="border-t border-b border-black p-1"></td>
                </tr>
                <tr>
                  <td className="border border-black p-1" colSpan={2}>Problema cardíaco <span className="float-right w-1/2"><PrintCheck checked={!formData.diag_cardiaco} label="Não"/> &nbsp;&nbsp;<PrintCheck checked={formData.diag_cardiaco} label="Sim*"/></span></td>
                  <td className="border-r border-black p-1" colSpan={2}></td>
                </tr>
                <tr>
                  <td className="border border-black p-1" colSpan={2}>Problema digestivo <span className="float-right w-1/2"><PrintCheck checked={!formData.diag_digestivo} label="Não"/> &nbsp;&nbsp;<PrintCheck checked={formData.diag_digestivo} label="Sim*"/></span></td>
                  <td className="border-r border-black p-1" colSpan={2}></td>
                </tr>
                <tr>
                  <td className="border border-black p-1" colSpan={2}>Probl. Neurológico <span className="float-right w-1/2"><PrintCheck checked={!formData.diag_neurologico} label="Não"/> &nbsp;&nbsp;<PrintCheck checked={formData.diag_neurologico} label="Sim*"/></span></td>
                  <td className="border-r border-black p-1" colSpan={2}></td>
                </tr>
                <tr>
                  <td className="border border-black p-1" colSpan={2}>Convulsões/Ataques <span className="float-right w-1/2"><PrintCheck checked={!formData.diag_convulsoes} label="Não"/> &nbsp;&nbsp;<PrintCheck checked={formData.diag_convulsoes} label="Sim*"/></span></td>
                  <td className="border-r border-black p-1" colSpan={2}></td>
                </tr>
                <tr>
                  <td colSpan={4} className="border border-black p-1 h-6" {...getResizeProps('td_outra_doenca')}>Outra doença * <span className="ml-2 font-bold">{formData.diag_outra_doenca ? 'Sim' : ''}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex mb-3">
            <div className="w-6 mr-1 flex items-center justify-center font-bold text-xs relative">
               <span className="-rotate-90 whitespace-nowrap absolute">Situação vacinal</span>
            </div>
            <div className="w-full">
              <table className="w-full border-collapse border border-black text-[10px] text-center">
                <thead>
                  <tr className="font-bold">
                    <td className="border border-black p-1 text-left w-1/4">Tipo de Vacina</td>
                    <td className="border border-black p-1">1ª dose</td>
                    <td className="border border-black p-1">2ª dose</td>
                    <td className="border border-black p-1">3ª dose</td>
                    <td className="border border-black p-1">1º reforço</td>
                    <td className="border border-black p-1">2º reforço</td>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {id: 'BCG', label: 'BCG', grayOut: ['ref1', 'ref2']},
                    {id: 'Sabin', label: 'Sabin', grayOut: []},
                    {id: 'DPT', label: 'DPT (Tríplice)', grayOut: ['ref2']},
                    {id: 'Tetravalente', label: 'Tetravalente (DPT+Hib)', grayOut: []},
                    {id: 'Hib', label: <span className="underline text-red-800">Hib</span>, grayOut: []},
                    {id: 'Sarampo', label: 'Sarampo', grayOut: []},
                    {id: 'TripliceViral', label: 'Tríplice viral', grayOut: []},
                    {id: 'HepatiteB', label: 'Hepatite B', grayOut: []},
                    {id: 'Outra', label: 'Outra (qual):', grayOut: []}
                  ].map(vac => {
                    const rowData = formData.situacao_vacinal[vac.id as keyof typeof formData.situacao_vacinal];
                    return (
                      <tr key={vac.id}>
                        <td className="border border-black p-1 text-left font-bold">{vac.label}</td>
                        <td className={`border border-black p-1 ${vac.grayOut.includes('d1') ? 'bg-gray-300' : ''}`}>{!vac.grayOut.includes('d1') && rowData?.d1 ? 'X' : ''}</td>
                        <td className={`border border-black p-1 ${vac.grayOut.includes('d2') ? 'bg-gray-300' : ''}`}>{!vac.grayOut.includes('d2') && rowData?.d2 ? 'X' : ''}</td>
                        <td className={`border border-black p-1 ${vac.grayOut.includes('d3') ? 'bg-gray-300' : ''}`}>{!vac.grayOut.includes('d3') && rowData?.d3 ? 'X' : ''}</td>
                        <td className={`border border-black p-1 ${vac.grayOut.includes('ref1') ? 'bg-gray-300' : ''}`}>{!vac.grayOut.includes('ref1') && rowData?.ref1 ? 'X' : ''}</td>
                        <td className={`border border-black p-1 ${vac.grayOut.includes('ref2') ? 'bg-gray-300' : ''}`}>{!vac.grayOut.includes('ref2') && rowData?.ref2 ? 'X' : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="text-center text-[9px] mt-0.5">(Assinalar com X as vacinas recebidas)</div>
            </div>
          </div>

          <div className="flex mb-3">
            <div className="w-6 mr-1 flex items-center justify-center font-bold text-[10px] leading-tight relative">
               <span className="-rotate-90 whitespace-nowrap absolute leading-[10px]">Teste de<br/>Acuidade<br/>Visual</span>
            </div>
            <table className="w-full border-collapse border border-black text-[10px] text-center">
              <tbody>
                <tr className="font-bold">
                  <td className="border border-black p-1 w-[15%]">Data</td>
                  <td className="border border-black p-1 w-[15%]">Idade</td>
                  <td className="border border-black p-1 w-[20%]">Resultado OD</td>
                  <td className="border border-black p-1 w-[20%]">Resultado OE</td>
                  <td className="border border-black p-1 w-[30%]">Consulta <span className="underline text-red-800">Oftalmo</span></td>
                </tr>
                <tr>
                  <td className="border border-black p-1 h-5">{formData.acuidade_visual.data ? new Date(formData.acuidade_visual.data + 'T12:00:00').toLocaleDateString('pt-BR') : ''}</td>
                  <td className="border border-black p-1">{formData.acuidade_visual.idade}</td>
                  <td className="border border-black p-1">{formData.acuidade_visual.resultado_od}</td>
                  <td className="border border-black p-1">{formData.acuidade_visual.resultado_oe}</td>
                  <td className="border border-black p-1 text-left px-2">Data {formData.acuidade_visual.consulta_oftalmo_data_1 ? new Date(formData.acuidade_visual.consulta_oftalmo_data_1 + 'T12:00:00').toLocaleDateString('pt-BR') : '    /    /'}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 h-5"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1 text-left px-2">Data {formData.acuidade_visual.consulta_oftalmo_data_2 ? new Date(formData.acuidade_visual.consulta_oftalmo_data_2 + 'T12:00:00').toLocaleDateString('pt-BR') : '    /    /'}</td>
                </tr>
                <tr>
                  <td colSpan={5} className="border border-black p-1 text-left font-bold">
                    Utiliza óculos ou lentes <span className="underline text-blue-800">corretivas ?</span> &nbsp;&nbsp;
                    <PrintCheck checked={!formData.usa_oculos} label="Não"/> &nbsp;&nbsp;&nbsp;&nbsp;
                    <PrintCheck checked={formData.usa_oculos} label="Sim"/> <span className="font-normal text-[9px] underline text-blue-800 ml-1">Neste caso, realizar o teste c/ o óculos</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex mb-4">
            <div className="w-6 mr-1 flex items-center justify-center font-bold text-[10px] relative">
               <span className="-rotate-90 whitespace-nowrap absolute">Saúde<br/>Auditiva</span>
            </div>
            <table className="w-full border-collapse border border-black text-[10px]">
              <tbody>
                <tr>
                  <td className="border border-black p-1 border-r-0 w-[55%]"></td>
                  <td className="border border-black p-1 font-bold text-center w-[25%]">Encaminhamentos</td>
                  <td className="border border-black p-1 font-bold text-center w-[20%]">Resultados</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-bold">
                    Ouve bem? &nbsp;&nbsp; <PrintCheck checked={!formData.ouve_bem} label="Não"/> &nbsp;&nbsp;&nbsp;&nbsp; <PrintCheck checked={formData.ouve_bem} label="Sim"/>
                  </td>
                  <td className="border border-black p-1 text-center" rowSpan={2}>{formData.saude_auditiva_encaminhamentos}</td>
                  <td className="border border-black p-1 text-center" rowSpan={2}>{formData.saude_auditiva_resultados}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-bold">
                    Tem atraso ou alteração da fala? &nbsp;&nbsp; <PrintCheck checked={!formData.atraso_fala} label="Não"/> &nbsp;&nbsp;&nbsp;&nbsp; <PrintCheck checked={formData.atraso_fala} label="Sim"/>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex mb-4">
            <div className="w-6 mr-1 flex items-center justify-center font-bold text-[10px] relative">
               <span className="-rotate-90 whitespace-nowrap absolute">Saúde Bucal</span>
            </div>
            <div className="w-full flex flex-col justify-between">
              <table className="w-full border-collapse border border-black text-[10px] text-center mb-1">
                <tbody>
                  <tr>
                    <td className="border border-black p-1 text-left font-bold w-[20%]">Mês/ano</td>
                    <td className="border border-black p-1 w-[20%]">{formData.saude_bucal.mes_ano[0] || '____/____'}</td>
                    <td className="border border-black p-1 w-[20%]">{formData.saude_bucal.mes_ano[1] || '____/____'}</td>
                    <td className="border border-black p-1 w-[20%]">{formData.saude_bucal.mes_ano[2] || '____/____'}</td>
                    <td className="border border-black p-1 w-[20%]">{formData.saude_bucal.mes_ano[3] || '____/____'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 text-left font-bold">Risco de cárie</td>
                    <td className="border border-black p-1">{formData.saude_bucal.risco_carie[0]}</td>
                    <td className="border border-black p-1">{formData.saude_bucal.risco_carie[1]}</td>
                    <td className="border border-black p-1">{formData.saude_bucal.risco_carie[2]}</td>
                    <td className="border border-black p-1">{formData.saude_bucal.risco_carie[3]}</td>
                  </tr>
                </tbody>
              </table>
              <div className="text-center text-[9px] mb-2">A = baixo risco&nbsp;&nbsp; B, C = médio risco&nbsp;&nbsp; D, E, F = alto risco</div>
              
              <table className="w-full border-collapse border border-black text-[10px]">
                <tbody>
                  <tr>
                    <td colSpan={4} className="border border-black p-1 font-bold"><span className="underline text-red-800">Fluorterapia</span> semanal seriada, se risco D, E, F</td>
                  </tr>
                  <tr className="text-center h-8 align-top">
                    <td className="border border-black p-0.5 text-left text-[8px]">Data<br/><div className="text-center text-[10px] mt-1">{formData.saude_bucal.fluorterapia[0] ? new Date(formData.saude_bucal.fluorterapia[0] + 'T12:00:00').toLocaleDateString('pt-BR') : '___/___/_____'}</div></td>
                    <td className="border border-black p-0.5 text-left text-[8px]">Data<br/><div className="text-center text-[10px] mt-1">{formData.saude_bucal.fluorterapia[1] ? new Date(formData.saude_bucal.fluorterapia[1] + 'T12:00:00').toLocaleDateString('pt-BR') : '___/___/_____'}</div></td>
                    <td className="border border-black p-0.5 text-left text-[8px]">Data<br/><div className="text-center text-[10px] mt-1">{formData.saude_bucal.fluorterapia[2] ? new Date(formData.saude_bucal.fluorterapia[2] + 'T12:00:00').toLocaleDateString('pt-BR') : '___/___/_____'}</div></td>
                    <td className="border border-black p-0.5 text-left text-[8px]">Data<br/><div className="text-center text-[10px] mt-1">{formData.saude_bucal.fluorterapia[3] ? new Date(formData.saude_bucal.fluorterapia[3] + 'T12:00:00').toLocaleDateString('pt-BR') : '___/___/_____'}</div></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex mb-3">
            <div className="w-6 mr-1 flex items-center justify-center font-bold text-[10px] relative">
               <span className="-rotate-90 whitespace-nowrap absolute">Programas<br/>Sociais</span>
            </div>
            <div className="w-full border border-black p-2 font-bold text-[10px]">
              <div className="mb-1">A família e/ou a criança participam de algum programa social do governo?</div>
              <div className="grid grid-cols-3 gap-2 font-normal">
                <div><PrintCheck checked={formData.programa_social.includes('Bolsa Alimentação')} /> Bolsa Alimentação</div>
                <div><PrintCheck checked={formData.programa_social.includes('Bolsa-Escola')} /> Bolsa- Escola</div>
                <div><PrintCheck checked={formData.programa_social.includes('Começar de Novo')} /> Começar de Novo</div>
                <div><PrintCheck checked={formData.programa_social.includes('Renda-Mínima')} /> Renda- Mínima</div>
                <div><PrintCheck checked={formData.programa_social.includes('Nenhum')} /> Nenhum</div>
                <div><PrintCheck checked={formData.programa_social.includes('Outro')} /> Outro</div>
              </div>
            </div>
          </div>

          <div className="mt-8 font-bold flex justify-between text-sm">
            <span>Responsável pelo preenchimento: <span className="underline">{formData.responsavel_preenchimento || '__________________________________________'}</span></span>
            <span>Data <span className="underline">{formData.data_preenchimento ? new Date(formData.data_preenchimento + 'T12:00:00').toLocaleDateString('pt-BR') : '__ / __ / ____'}</span></span>
          </div>

          <div className="mt-8 font-bold text-base text-center w-full pb-2">
            OBS: Criança ou adolescente portador de deficiência, preencher Ficha E
          </div>

        </div>
      </div>
    </div>
  );
}
