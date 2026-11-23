import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Printer, ArrowLeft, Loader2, CheckCircle2, Settings, X, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, RotateCcw, PenLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FichaSaudeData, initialFichaSaudeData } from '../types/saude';
import { Student } from '../types';
import { cn } from '../lib/utils';

interface FichaSaudeProps {
  student: Student;
  onBack: () => void;
  isEditMode?: boolean;
}

export interface ElementStyle {
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textAlign?: string;
  textWrap?: string;
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
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
  textAlign: string;
  textWrap: string;
  globalIsBold: boolean;
  globalIsItalic: boolean;
  globalIsUnderline: boolean;
  elementHeights: Record<string, number>;
  elementStyles: Record<string, ElementStyle>;
}


const isFieldEmpty = (value: string | number | undefined | null) => {
  if (value === undefined || value === null) return true;
  const str = String(value).trim();
  if (str === '') return true;
  const digitsOnly = str.replace(/\D/g, '');
  if (digitsOnly.length > 1 && /^0+$/.test(digitsOnly)) return true;
  return false;
};

const getSaudeFieldClass = (value: string | number | undefined | null, extra: string = '') => {
  const empty = isFieldEmpty(value);
  return cn(
    "border p-2 rounded-lg w-full transition-all outline-none",
    empty 
      ? "bg-red-500/10 border-red-300 placeholder:text-gray-400 focus:bg-red-500/[0.08] focus:border-red-400 focus:ring-2 focus:ring-red-200" 
      : "bg-white border-gray-300 focus:border-[#3b5998] focus:ring-2 focus:ring-[#3b5998]/20",
    extra
  );
};

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
  textAlign: 'left',
  textWrap: 'normal',
  globalIsBold: false,
  globalIsItalic: false,
  globalIsUnderline: false,
  elementHeights: {},
  elementStyles: {},
};

export const UBS_BUTANTA_LIST = [
  'UBS Jardim Jaqueline',
  'UBS Jardim Alvorada',
  'UBS Rio Pequeno',
  'UBS Butantã (CSE Samuel Pessoa)',
  'UBS São Jorge',
  'UBS Paulo VI',
  'UBS Jardim Sarah',
  'UBS Jardim D\'Abril',
  'UBS Vila Dalva',
  'UBS Jardim Peri-Peri',
  'UBS Caxingui',
  'UBS Vila Sônia',
  'UBS Real Parque',
  'UBS Jardim Colombo',
  'UBS Vila Regina'
];

export default function FichaSaude({ student, onBack, isEditMode = false }: FichaSaudeProps) {
  const [printConfig, setPrintConfig] = useState<PrintConfig>(() => {
    const saved = localStorage.getItem('@PortalTarsila:FichaSaudeB_PrintConfig');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...defaultPrintConfig, 
        ...parsed, 
        elementHeights: parsed.elementHeights || {},
        elementStyles: parsed.elementStyles || {}
      };
    }
    return defaultPrintConfig;
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const emergencyOptions = [
    student.motherName ? {
      label: `Mãe: ${student.motherName}`,
      name: student.motherName,
      phone: student.motherPhone || student.motherWhatsapp || ''
    } : null,
    student.fatherName ? {
      label: `Pai: ${student.fatherName}`,
      name: student.fatherName,
      phone: student.fatherPhone || student.fatherWhatsapp || ''
    } : null,
    (student.guardianName && student.guardianName !== student.motherName && student.guardianName !== student.fatherName) ? {
      label: `Responsável: ${student.guardianName}`,
      name: student.guardianName,
      phone: student.guardianPhone || student.guardianWhatsapp || ''
    } : null,
  ].filter(Boolean) as { label: string; name: string; phone: string }[];

  const responsibleOptions = [
    student.motherName ? {
      label: `Mãe: ${student.motherName}`,
      name: student.motherName,
    } : null,
    student.fatherName ? {
      label: `Pai: ${student.fatherName}`,
      name: student.fatherName,
    } : null,
    (student.guardianName && student.guardianName !== student.motherName && student.guardianName !== student.fatherName) ? {
      label: `Responsável: ${student.guardianName}`,
      name: student.guardianName,
    } : null,
  ].filter(Boolean) as { label: string; name: string }[];

  useEffect(() => {
    if (!isEditMode && isPreviewMode) {
      setIsPreviewMode(false);
    }
  }, [isEditMode, isPreviewMode]);

  const updateConfig = (key: keyof PrintConfig, val: any) => {
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

  const updateElementStyle = (id: string, styleUpdates: Partial<ElementStyle>) => {
    setPrintConfig(prev => {
      const next = {
        ...prev,
        elementStyles: {
          ...prev.elementStyles,
          [id]: { ...(prev.elementStyles[id] || {}), ...styleUpdates }
        }
      };
      localStorage.setItem('@PortalTarsila:FichaSaudeB_PrintConfig', JSON.stringify(next));
      return next;
    });
  };

  const handleElementResize = (e: React.MouseEvent<HTMLElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    updateElementHeight(id, Math.round(rect.height));
  };

  const getResizeProps = (id: string, baseClassName: string = '') => {
    const isSelected = isPreviewMode && selectedElementId === id;
    
    return {
      id,
      onClick: (e: React.MouseEvent) => {
        if (isPreviewMode) {
          e.stopPropagation();
          setSelectedElementId(id);
        }
      },
      style: { 
        height: printConfig.elementHeights[id] ? `${printConfig.elementHeights[id]}px` : 'auto', 
        resize: isPreviewMode ? 'vertical' as const : 'none' as const, 
        overflow: 'hidden' as const 
      },
      onMouseUp: (e: React.MouseEvent<HTMLElement>) => handleElementResize(e, id),
      className: `${baseClassName} ${isPreviewMode ? 'hover:outline hover:outline-dashed hover:outline-blue-400 cursor-pointer' : ''} ${isSelected ? 'outline outline-2 outline-blue-600 ring-4 ring-blue-200 z-10 relative' : ''}`.trim()
    };
  };

  const [formData, setFormData] = useState<FichaSaudeData>({
    ...initialFichaSaudeData,
    id_aluno: Number(student.id),
    data_preenchimento: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCustomResponsavel, setIsCustomResponsavel] = useState(false);

  useEffect(() => {
    loadData();
  }, [student.id]);

  useEffect(() => {
    document.body.classList.add('no-scrollbar');
    document.documentElement.classList.add('no-scrollbar');
    return () => {
      document.body.classList.remove('no-scrollbar');
      document.documentElement.classList.remove('no-scrollbar');
    };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ALUNOS_FICHA_SAUDE_B')
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
          programa_social: data.programa_social || [],
          data_preenchimento: data.data_preenchimento || new Date().toISOString().split('T')[0]
        });
      } else {
        setFormData(prev => ({
          ...prev,
          data_preenchimento: prev.data_preenchimento || new Date().toISOString().split('T')[0]
        }));
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

      const { id_ficha, ...validData } = formData as any;
      // Garante que campos descontinuados não sejam enviados
      delete validData.situacao_vacinal;
      delete validData.acuidade_visual;
      delete validData.usa_oculos;
      delete validData.ouve_bem;
      delete validData.atraso_fala;
      delete validData.saude_auditiva_encaminhamentos;
      delete validData.saude_auditiva_resultados;
      delete validData.saude_bucal;

      const { data, error } = await supabase
        .from('ALUNOS_FICHA_SAUDE_B')
        .upsert({
          id_aluno: Number(student.id),
          ...validData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id_aluno' })
        .select();

      if (error) throw error;

      // Sincroniza status_cadastro na tabela ALUNOS
      await supabase
        .from('ALUNOS')
        .update({
          status_cadastro: 'salva',
          data_cadastro_salvo: new Date().toISOString()
        })
        .eq('id_aluno', student.id);
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
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden no-scrollbar ficha-saude-view print:shadow-none print:border-none print:m-0 print:p-0">
      
      {/* Botões Superiores - Cabeçalho responsivo e limpo */}
      <div className="bg-[#3b5998] px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3 print:hidden sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            type="button"
            onClick={onBack} 
            className="flex items-center gap-1.5 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm font-semibold shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> <span>Voltar</span>
          </button>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white uppercase tracking-wide truncate">
            Ficha de Saúde B
          </h2>
        </div>

        {/* Botões visíveis SOMENTE no Modo Edição */}
        {isEditMode ? (
          <div className="flex items-center gap-2 shrink-0">
            <button 
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)} 
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer",
                isPreviewMode 
                  ? "bg-yellow-400 text-yellow-950 hover:bg-yellow-500" 
                  : "bg-white text-[#0f254e] hover:bg-gray-100"
              )}
            >
              <Settings className="w-4 h-4" />
              <span>{isPreviewMode ? 'Voltar ao Formulário' : 'Visualizar Layout'}</span>
            </button>
            <button 
              type="button"
              onClick={handlePrint} 
              className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ficha</span>
            </button>
          </div>
        ) : (
          <div className="hidden sm:flex items-center text-white/70 text-xs font-medium">
            <span>EMEF Tarsila do Amaral</span>
          </div>
        )}
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

          <div className="fixed top-32 right-8 bg-white shadow-2xl rounded-xl z-50 border border-gray-200 print:hidden flex flex-col w-72 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button 
                onClick={() => setSelectedElementId(null)}
                className={`flex-1 py-3 text-xs font-bold transition-colors ${!selectedElementId ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
              >
                Documento
              </button>
              <button 
                className={`flex-1 py-3 text-xs font-bold transition-colors ${selectedElementId ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'bg-gray-50 text-gray-500 opacity-60 cursor-not-allowed'}`}
                title="Clique em uma caixa no documento para ativá-la"
              >
                Caixa Atual
              </button>
            </div>
            
            <div className="p-4 flex flex-col gap-4 max-h-[65vh] overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {!selectedElementId ? (
                <>
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
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Estilo de Texto Global</label>
                    <div className="flex gap-2">
                      <button onClick={() => updateConfig('globalIsBold', !printConfig.globalIsBold)} className={`flex-1 flex justify-center p-2 rounded border ${printConfig.globalIsBold ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-gray-50 border-gray-200'}`}><Bold size={16} /></button>
                      <button onClick={() => updateConfig('globalIsItalic', !printConfig.globalIsItalic)} className={`flex-1 flex justify-center p-2 rounded border ${printConfig.globalIsItalic ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-gray-50 border-gray-200'}`}><Italic size={16} /></button>
                      <button onClick={() => updateConfig('globalIsUnderline', !printConfig.globalIsUnderline)} className={`flex-1 flex justify-center p-2 rounded border ${printConfig.globalIsUnderline ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-gray-50 border-gray-200'}`}><Underline size={16} /></button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Alinhamento Global</label>
                    <select 
                      value={printConfig.textAlign} 
                      onChange={e => updateConfig('textAlign', e.target.value)}
                      className="w-full border border-gray-300 rounded p-1.5 text-sm"
                    >
                      <option value="left">Esquerda (Padrão)</option>
                      <option value="justify">Justificado</option>
                      <option value="center">Centralizado</option>
                      <option value="right">Direita</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Quebra de Texto Global</label>
                    <select 
                      value={printConfig.textWrap} 
                      onChange={e => updateConfig('textWrap', e.target.value)}
                      className="w-full border border-gray-300 rounded p-1.5 text-sm"
                    >
                      <option value="normal">Normal (Padrão)</option>
                      <option value="nowrap">Não Quebrar (Linha única)</option>
                      <option value="break-spaces">Quebrar com Espaços</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Cor do Texto</label>
                    <input 
                      type="color" 
                      value={printConfig.textColor} 
                      onChange={e => updateConfig('textColor', e.target.value as any)}
                      className="w-full h-8 cursor-pointer rounded"
                    />
                  </div>

                  <button onClick={() => {
                      if (window.confirm('Tem certeza de que deseja apagar todas as personalizações e restaurar a Ficha para os padrões iniciais? Essa ação não pode ser desfeita.')) {
                        localStorage.removeItem('@PortalTarsila:FichaSaudeB_PrintConfig');
                        setPrintConfig(defaultPrintConfig);
                        setSelectedElementId(null);
                      }
                    }} className="w-full mt-2 text-xs text-red-600 border border-red-200 rounded p-2 hover:bg-red-50 font-bold transition-colors">
                      Restaurar Padrões Iniciais
                  </button>
                </>
              ) : (() => {
                const id = selectedElementId as string;
                const style = printConfig.elementStyles[id] || {};
                return (
                  <>
                    <div className="bg-blue-50 text-blue-800 text-xs p-2 rounded mb-1 border border-blue-100 flex justify-between items-center font-bold">
                      Caixa Ativa
                      <button onClick={() => setSelectedElementId(null)} className="hover:text-blue-900"><X size={14}/></button>
                    </div>
                    
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Estilo da Caixa</label>
                      <div className="flex gap-2">
                        <button onClick={() => updateElementStyle(id, { isBold: style.isBold === undefined ? !printConfig.globalIsBold : !style.isBold })} className={`flex-1 flex justify-center p-2 rounded border transition-colors ${style.isBold ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`} title="Negrito"><Bold size={16} /></button>
                        <button onClick={() => updateElementStyle(id, { isItalic: style.isItalic === undefined ? !printConfig.globalIsItalic : !style.isItalic })} className={`flex-1 flex justify-center p-2 rounded border transition-colors ${style.isItalic ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`} title="Itálico"><Italic size={16} /></button>
                        <button onClick={() => updateElementStyle(id, { isUnderline: style.isUnderline === undefined ? !printConfig.globalIsUnderline : !style.isUnderline })} className={`flex-1 flex justify-center p-2 rounded border transition-colors ${style.isUnderline ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`} title="Sublinhado"><Underline size={16} /></button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Fonte da Caixa</label>
                      <select 
                        value={style.fontFamily || ''} 
                        onChange={e => updateElementStyle(id, { fontFamily: e.target.value })}
                        className="w-full border border-gray-300 rounded p-1.5 text-sm"
                      >
                        <option value="">Usar Global</option>
                        <option value="sans-serif">Padrão (Sans-serif)</option>
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="'Courier New', monospace">Courier New</option>
                        <option value="Roboto, sans-serif">Roboto</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Tamanho da Fonte (px)</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" 
                          min="8" max="24" step="0.5"
                          value={style.fontSize || printConfig.baseFontSize} 
                          onChange={e => updateElementStyle(id, { fontSize: Number(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-sm font-bold w-8 text-right">{style.fontSize || printConfig.baseFontSize}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Cor do Texto</label>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="color" 
                          value={style.textColor || printConfig.textColor} 
                          onChange={e => updateElementStyle(id, { textColor: e.target.value })}
                          className="w-full h-8 cursor-pointer rounded"
                        />
                        {style.textColor && (
                          <button onClick={() => updateElementStyle(id, { textColor: undefined })} className="text-xs text-red-500 border border-red-200 rounded px-2 h-8 hover:bg-red-50">Resetar</button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Alinhamento da Caixa</label>
                      <div className="flex gap-2">
                        <button onClick={() => updateElementStyle(id, { textAlign: 'left' })} className={`flex-1 flex justify-center p-2 rounded border transition-colors ${style.textAlign === 'left' ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}><AlignLeft size={16} /></button>
                        <button onClick={() => updateElementStyle(id, { textAlign: 'center' })} className={`flex-1 flex justify-center p-2 rounded border transition-colors ${style.textAlign === 'center' ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}><AlignCenter size={16} /></button>
                        <button onClick={() => updateElementStyle(id, { textAlign: 'right' })} className={`flex-1 flex justify-center p-2 rounded border transition-colors ${style.textAlign === 'right' ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}><AlignRight size={16} /></button>
                        <button onClick={() => updateElementStyle(id, { textAlign: 'justify' })} className={`flex-1 flex justify-center p-2 rounded border transition-colors ${style.textAlign === 'justify' ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}><AlignJustify size={16} /></button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Quebra de Texto</label>
                      <select 
                        value={style.textWrap || ''} 
                        onChange={e => updateElementStyle(id, { textWrap: e.target.value })}
                        className="w-full border border-gray-300 rounded p-1.5 text-sm"
                      >
                        <option value="">Usar Global</option>
                        <option value="normal">Normal</option>
                        <option value="nowrap">Não Quebrar (Linha única)</option>
                        <option value="break-spaces">Quebrar com Espaços</option>
                      </select>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* FORMULÁRIO TELA (Screen Only) */}
      <div 
        className={`p-4 md:p-8 max-h-[80vh] overflow-y-auto no-scrollbar bg-gray-50 text-sm ${isPreviewMode ? 'hidden' : 'print:hidden'}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
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
                {formData.q1_problema_nascimento && <input type="text" placeholder="Qual?" className={getSaudeFieldClass(formData.q1_qual, "mt-1")} value={formData.q1_qual} onChange={e => setFormData({...formData, q1_qual: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                 <label className="font-semibold">2 – Teve diagnóstico de anemia nos primeiros dois anos de vida?</label>
                 <YesNoRadio checked={formData.q2_anemia} onChange={v => setFormData({...formData, q2_anemia: v})} name="q2" />
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">3 – Foi internado (a) alguma vez?</label>
                <YesNoRadio checked={formData.q3_internado} onChange={v => setFormData({...formData, q3_internado: v})} name="q3" />
                {formData.q3_internado && <input type="text" placeholder="Especificar (motivo e idade)" className={getSaudeFieldClass(formData.q3_motivo_idade, "mt-1")} value={formData.q3_motivo_idade} onChange={e => setFormData({...formData, q3_motivo_idade: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">4 – Tem algum problema de saúde?</label>
                <YesNoRadio checked={formData.q4_problema_saude} onChange={v => setFormData({...formData, q4_problema_saude: v})} name="q4" />
                {formData.q4_problema_saude && <input type="text" placeholder="Qual?" className={getSaudeFieldClass(formData.q4_qual, "mt-1")} value={formData.q4_qual} onChange={e => setFormData({...formData, q4_qual: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">5 – Está fazendo algum tipo de tratamento de saúde?</label>
                <YesNoRadio checked={formData.q5_tratamento} onChange={v => setFormData({...formData, q5_tratamento: v})} name="q5" />
                {formData.q5_tratamento && <input type="text" placeholder="Qual e onde?" className={getSaudeFieldClass(formData.q5_qual_onde, "mt-1")} value={formData.q5_qual_onde} onChange={e => setFormData({...formData, q5_qual_onde: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">6 – Necessita de dieta especial?</label>
                <YesNoRadio checked={formData.q6_dieta} onChange={v => setFormData({...formData, q6_dieta: v})} name="q6" />
                {formData.q6_dieta && <input type="text" placeholder="Por que?" className={getSaudeFieldClass(formData.q6_por_que, "mt-1")} value={formData.q6_por_que} onChange={e => setFormData({...formData, q6_por_que: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">7 – Tem algum tipo de deficiência?</label>
                <YesNoRadio checked={formData.q7_deficiencia} onChange={v => setFormData({...formData, q7_deficiencia: v})} name="q7" />
                {formData.q7_deficiencia && (
                  <div className="space-y-3 mt-2">
                    <input type="text" placeholder="Qual?" className={getSaudeFieldClass(formData.q7_qual)} value={formData.q7_qual} onChange={e => setFormData({...formData, q7_qual: e.target.value})} />
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
                {!formData.q8_atividade_fisica && <input type="text" placeholder="Por que não?" className={getSaudeFieldClass(formData.q8_nao_por_que, "mt-1")} value={formData.q8_nao_por_que} onChange={e => setFormData({...formData, q8_nao_por_que: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">9 – Existe algum problema de saúde na família?</label>
                <YesNoRadio checked={formData.q9_problema_familia} onChange={v => setFormData({...formData, q9_problema_familia: v})} name="q9" />
                {formData.q9_problema_familia && <input type="text" placeholder="Qual?" className={getSaudeFieldClass(formData.q9_qual, "mt-1")} value={formData.q9_qual} onChange={e => setFormData({...formData, q9_qual: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">10 – Qual é a Unidade Básica de Saúde que utiliza?</label>
                <div className="space-y-2">
                  <select
                    value={UBS_BUTANTA_LIST.includes(formData.q10_ubs) ? formData.q10_ubs : (formData.q10_ubs ? 'OUTRA' : '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'OUTRA') {
                        if (UBS_BUTANTA_LIST.includes(formData.q10_ubs)) {
                          setFormData({ ...formData, q10_ubs: '' });
                        }
                      } else {
                        setFormData({ ...formData, q10_ubs: val });
                      }
                    }}
                    className={getSaudeFieldClass(formData.q10_ubs)}
                  >
                    <option value="">Selecione a UBS do Butantã...</option>
                    {UBS_BUTANTA_LIST.map((ubs) => (
                      <option key={ubs} value={ubs}>
                        {ubs === 'UBS Jardim Jaqueline' ? '⭐ UBS Jardim Jaqueline (Referência da Escola)' : ubs}
                      </option>
                    ))}
                    <option value="OUTRA">Outra Unidade de Saúde (digitar abaixo)</option>
                  </select>

                  {(!UBS_BUTANTA_LIST.includes(formData.q10_ubs) || formData.q10_ubs === '') && (
                    <input
                      type="text"
                      placeholder="Ou digite o nome de outra UBS/Posto de Saúde..."
                      className={getSaudeFieldClass(formData.q10_ubs)}
                      value={formData.q10_ubs}
                      onChange={(e) => setFormData({ ...formData, q10_ubs: e.target.value })}
                    />
                  )}
                </div>
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">11 – Tem Convênio Médico?</label>
                <YesNoRadio checked={formData.q11_convenio} onChange={v => setFormData({...formData, q11_convenio: v})} name="q11" />
                {formData.q11_convenio && <input type="text" placeholder="Qual?" className={getSaudeFieldClass(formData.q11_qual, "mt-1")} value={formData.q11_qual} onChange={e => setFormData({...formData, q11_qual: e.target.value})} />}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">12 – Em caso de febre, a escola está autorizada a medicar com:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                  <input type="text" placeholder="Medicamento" className={getSaudeFieldClass(formData.q12_medicamento_febre)} value={formData.q12_medicamento_febre} onChange={e => setFormData({...formData, q12_medicamento_febre: e.target.value})} />
                  <input type="text" placeholder="Dose" className={getSaudeFieldClass(formData.q12_dose)} value={formData.q12_dose} onChange={e => setFormData({...formData, q12_dose: e.target.value})} />
                </div>
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">13 – Tem algum tipo de alergia?</label>
                <YesNoRadio checked={formData.q13_alergia} onChange={v => setFormData({...formData, q13_alergia: v})} name="q13" />
                {formData.q13_alergia && (
                  <div className="space-y-3 mt-2">
                    <input type="text" placeholder="Qual?" className={getSaudeFieldClass(formData.q13_qual)} value={formData.q13_qual} onChange={e => setFormData({...formData, q13_qual: e.target.value})} />
                    <div className="flex flex-wrap gap-4">
                      {['Alimento', 'Medicamento', 'Outro'].map(tipo => (
                        <label key={tipo} className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4 rounded text-[#3b5998]" checked={formData.q13_tipo.includes(tipo)} onChange={e => updateCheckboxArray('q13_tipo', tipo, e.target.checked)} />
                          {tipo}
                        </label>
                      ))}
                    </div>
                    {formData.q13_tipo.includes('Outro') && <input type="text" placeholder="Especificar outro" className={getSaudeFieldClass(formData.q13_especificar)} value={formData.q13_especificar} onChange={e => setFormData({...formData, q13_especificar: e.target.value})} />}
                  </div>
                )}
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">14 – Informação de problemas identificados na vivência escolar (ex: cognitivo, afetivo)</label>
                <textarea className={getSaudeFieldClass(formData.q14_vivencia, "min-h-[80px]")} value={formData.q14_vivencia} onChange={e => setFormData({...formData, q14_vivencia: e.target.value})} />
              </div>

              <div className="grid gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="font-semibold">15 – Em caso de doença, a escola deverá chamar:</label>

                {/* Contato 1 */}
                <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Contato Principal (1)</span>
                    {emergencyOptions.length > 0 && (
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const opt = emergencyOptions.find(o => o.name === val);
                          if (opt) {
                            setFormData(prev => ({
                              ...prev,
                              q15_emergencia_nome_1: opt.name,
                              q15_emergencia_tel_1: opt.phone || prev.q15_emergencia_tel_1
                            }));
                          }
                        }}
                        className="text-xs bg-blue-50/70 border border-blue-200 text-[#0f254e] rounded-lg px-2.5 py-1 font-medium outline-none cursor-pointer hover:bg-blue-100 transition-colors"
                      >
                        <option value="">Preencher rápido (Mãe / Pai / Responsável)...</option>
                        {emergencyOptions.map(opt => (
                          <option key={`c1-${opt.name}`} value={opt.name}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nome do Contato 1"
                      className={getSaudeFieldClass(formData.q15_emergencia_nome_1)}
                      value={formData.q15_emergencia_nome_1}
                      onChange={e => setFormData({ ...formData, q15_emergencia_nome_1: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Telefone do Contato 1"
                      className={getSaudeFieldClass(formData.q15_emergencia_tel_1)}
                      value={formData.q15_emergencia_tel_1}
                      onChange={e => setFormData({ ...formData, q15_emergencia_tel_1: e.target.value })}
                    />
                  </div>
                </div>

                {/* Contato 2 */}
                <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-2 mt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Contato Secundário (2)</span>
                    {emergencyOptions.length > 0 && (
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const opt = emergencyOptions.find(o => o.name === val);
                          if (opt) {
                            setFormData(prev => ({
                              ...prev,
                              q15_emergencia_nome_2: opt.name,
                              q15_emergencia_tel_2: opt.phone || prev.q15_emergencia_tel_2
                            }));
                          }
                        }}
                        className="text-xs bg-blue-50/70 border border-blue-200 text-[#0f254e] rounded-lg px-2.5 py-1 font-medium outline-none cursor-pointer hover:bg-blue-100 transition-colors"
                      >
                        <option value="">Preencher rápido (Mãe / Pai / Responsável)...</option>
                        {emergencyOptions.map(opt => (
                          <option key={`c2-${opt.name}`} value={opt.name}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nome do Contato 2"
                      className={getSaudeFieldClass(formData.q15_emergencia_nome_2)}
                      value={formData.q15_emergencia_nome_2}
                      onChange={e => setFormData({ ...formData, q15_emergencia_nome_2: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Telefone do Contato 2"
                      className={getSaudeFieldClass(formData.q15_emergencia_tel_2)}
                      value={formData.q15_emergencia_tel_2}
                      onChange={e => setFormData({ ...formData, q15_emergencia_tel_2: e.target.value })}
                    />
                  </div>
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
            <h3 className="text-xl font-bold border-b pb-2 text-[#0f254e] mb-4">Programas Sociais</h3>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <label className="font-semibold block mb-3">A família e/ou a criança participam de algum programa social do governo?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {['Bolsa Família', 'Bolsa Alimentação', 'Bolsa-Escola', 'Começar de Novo', 'Renda-Mínima', 'Nenhum', 'Outro'].map(prog => (
                  <label key={prog} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white rounded-md transition-colors">
                    <input type="checkbox" className="w-4 h-4 rounded text-[#3b5998]" checked={formData.programa_social.includes(prog)} onChange={e => updateCheckboxArray('programa_social', prog, e.target.checked)} />
                    <span className="text-sm font-medium">{prog}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <div className="flex flex-col md:flex-row gap-6 p-4 bg-blue-50/30 rounded-lg border border-blue-100">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="font-semibold block">Responsável pelo preenchimento</label>
                {!isCustomResponsavel ? (
                  <button
                    type="button"
                    onClick={() => setIsCustomResponsavel(true)}
                    className="text-xs text-[#3b5998] hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    <span>+ Outro responsável</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCustomResponsavel(false)}
                    className="text-xs text-[#3b5998] hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Selecionar da lista</span>
                  </button>
                )}
              </div>

              {!isCustomResponsavel ? (
                <select
                  value={formData.responsavel_preenchimento}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__OUTRO__') {
                      setIsCustomResponsavel(true);
                    } else {
                      setFormData(prev => ({ ...prev, responsavel_preenchimento: val }));
                    }
                  }}
                  className={getSaudeFieldClass(formData.responsavel_preenchimento, "p-3 bg-white text-sm cursor-pointer")}
                >
                  <option value="">Selecione o responsável pelo preenchimento...</option>
                  {responsibleOptions.map(opt => (
                    <option key={`resp-${opt.name}`} value={opt.name}>{opt.label}</option>
                  ))}
                  {formData.responsavel_preenchimento && !responsibleOptions.some(opt => opt.name === formData.responsavel_preenchimento) && (
                    <option value={formData.responsavel_preenchimento}>
                      Outro: {formData.responsavel_preenchimento}
                    </option>
                  )}
                  <option value="__OUTRO__">➕ Adicionar outro responsável (digitar)...</option>
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Digite o nome do outro responsável..." 
                    className={getSaudeFieldClass(formData.responsavel_preenchimento, "p-3 bg-white text-sm")} 
                    value={formData.responsavel_preenchimento} 
                    onChange={e => setFormData({...formData, responsavel_preenchimento: e.target.value})} 
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomResponsavel(false)}
                    title="Voltar para a lista suspensa"
                    className="px-3.5 py-3 bg-gray-100 hover:bg-gray-200 text-[#0f254e] font-semibold text-xs rounded-lg flex items-center gap-1.5 border border-gray-300 transition-colors shrink-0 shadow-sm cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Lista</span>
                  </button>
                </div>
              )}
            </div>
            <div className="w-full md:w-1/3 space-y-2">
              <label className="font-semibold block mb-1">Data</label>
              <input 
                type="date" 
                className={getSaudeFieldClass(formData.data_preenchimento, "p-3 bg-white text-sm")} 
                value={formData.data_preenchimento} 
                onChange={e => setFormData({...formData, data_preenchimento: e.target.value})} 
              />
            </div>
          </div>

        
          {/* Alerta de salvamento no fim do formulário */}
          {saveSuccess && (
            <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl text-center text-sm font-bold flex justify-center items-center gap-2 print:hidden shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-green-600" /> Dados salvos com sucesso no sistema!
            </div>
          )}

          {/* Botão Salvar no fim da página */}
          <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <button
              type="button"
              onClick={onBack}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-300 transition-all flex items-center justify-center gap-2 shadow-sm text-sm sm:text-base order-2 sm:order-1 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar ao Início
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#3b5998] hover:bg-[#2d4373] text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 order-1 sm:order-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando dados...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Ficha de Saúde
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* LAYOUT DE IMPRESSÃO - Réplica exata */}
      <div className={`print-container ${isPreviewMode ? 'block my-8 shadow-2xl border border-gray-300 mx-auto w-[210mm] bg-white p-[10mm] leading-tight relative' : 'hidden print:block print:w-[210mm] print:mx-auto bg-white p-[10mm] leading-tight'}`} onClick={() => isPreviewMode && setSelectedElementId(null)} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        <style type="text/css" media="all">
          {`
            @media print {
              @page { size: A4 portrait; margin: 15mm; }
              body { margin: 0; padding: 0; }
              .print-hidden { display: none !important; }
              * { overflow: visible !important; }
              .print-container { overflow: visible !important; }
            }
            .break-after-page {
               page-break-after: always;
               break-after: page;
            }
            .print-container {
               font-family: ${printConfig.fontFamily} !important;
               font-size: ${printConfig.baseFontSize}px !important;
               color: ${printConfig.textColor} !important;
               text-align: ${printConfig.textAlign} !important;
               white-space: ${printConfig.textWrap} !important;
               ${printConfig.globalIsBold ? 'font-weight: bold !important;' : ''}
               ${printConfig.globalIsItalic ? 'font-style: italic !important;' : ''}
               ${printConfig.globalIsUnderline ? 'text-decoration: underline !important;' : ''}
            }
            .print-container .text-\\[11px\\] { font-size: 1em !important; }
            .print-container .text-\\[10px\\] { font-size: 0.9em !important; }
            .print-container .text-\\[13px\\] { font-size: 1.18em !important; }
            .print-container .text-\\[15px\\] { font-size: 1.36em !important; }
            .print-container .text-xs { font-size: 1.05em !important; }
            .print-container .text-sm { font-size: 1.15em !important; }
            .print-container .text-lg { font-size: 1.5em !important; }
            .print-container .text-3xl { font-size: 2.7em !important; }
            
            ${Object.entries(printConfig.elementStyles).map(([id, style]: [string, any]) => `
              #${id} {
                ${style.isBold !== undefined ? `font-weight: ${style.isBold ? 'bold' : 'normal'} !important;` : ''}
                ${style.isItalic !== undefined ? `font-style: ${style.isItalic ? 'italic' : 'normal'} !important;` : ''}
                ${style.isUnderline !== undefined ? `text-decoration: ${style.isUnderline ? 'underline' : 'none'} !important;` : ''}
                ${style.textAlign ? `text-align: ${style.textAlign} !important;` : ''}
                ${style.textWrap ? `white-space: ${style.textWrap} !important;` : ''}
                ${style.fontFamily ? `font-family: ${style.fontFamily} !important;` : ''}
                ${style.fontSize ? `font-size: ${style.fontSize}px !important;` : ''}
                ${style.textColor ? `color: ${style.textColor} !important;` : ''}
              }
            `).join('\n')}
            
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
                  <td colSpan={4} {...getResizeProps('td_nome', "border border-black px-1 pt-0 pb-1 align-top font-bold")}>
                    <div className="text-[0.85em] leading-tight">Nome</div>
                    <span className="font-normal">{student.name}</span>
                </td>
                <td {...getResizeProps('td_matricula', "border border-black px-1 pt-0 pb-1 align-top font-bold")}>
                  <div className="text-[0.85em] leading-tight">Nº de matrícula</div>
                  <span className="font-normal">{student.id}</span>
                </td>
              </tr>
              <tr>
                <td {...getResizeProps('td_sexo', "border border-black px-1 pt-0 pb-1 align-top font-bold whitespace-nowrap")}>
                  <div className="text-[0.85em] leading-tight mb-0.5">sexo</div>
                  <div className="flex items-center">
                    <span className="relative border border-black text-center inline-block w-4 h-4 leading-4 font-bold mx-1 text-xs">
                      M
                      {student.gender === 'Masculino' && <span className="absolute inset-0 flex items-center justify-center font-black">X</span>}
                    </span>
                    <span className="relative border border-black text-center inline-block w-4 h-4 leading-4 font-bold mx-1 ml-2 text-xs">
                      F
                      {student.gender === 'Feminino' && <span className="absolute inset-0 flex items-center justify-center font-black">X</span>}
                    </span>
                  </div>
                </td>
                <td {...getResizeProps('td_cor', "border border-black px-1 pt-0 pb-1 align-top font-bold w-1/4")}>
                  <div className="text-[0.85em] leading-tight">cor</div>
                  <span className="font-normal">{student.race}</span>
                </td>
                <td colSpan={2} {...getResizeProps('td_nascimento', "border border-black px-1 pt-0 pb-1 align-top font-bold w-1/4")}>
                  <div className="text-[0.85em] leading-tight">Data de Nascimento</div>
                  <span className="font-normal">{student.birthDate ? new Date(student.birthDate + 'T12:00:00').toLocaleDateString('pt-BR') : ''}</span>
                </td>
                <td {...getResizeProps('td_idade', "border border-black px-1 pt-0 pb-1 align-top font-bold w-1/4")}>
                  <div className="text-[0.85em] leading-tight">Idade</div>
                  <span className="font-normal">
                    {student.birthDate ? Math.floor((new Date().getTime() - new Date(student.birthDate).getTime()) / 31557600000) + ' anos' : ''}
                  </span>
                </td>
              </tr>
              <tr>
                <td colSpan={5} {...getResizeProps('td_mae', "border border-black px-1 pt-0 pb-1 align-top font-bold")}>
                  <div className="text-[0.85em] leading-tight">Nome da mãe / responsável</div>
                  <span className="font-normal">{student.guardianName || student.motherName}</span>
                </td>
              </tr>
              <tr>
                <td colSpan={4} {...getResizeProps('td_endereco', "border border-black px-1 pt-0 pb-1 align-top font-bold")}>
                  <div className="text-[0.85em] leading-tight">Endereço</div>
                  <span className="font-normal">{student.street}, {student.number} {student.complement} - {student.neighborhood} - {student.city}</span>
                </td>
                <td {...getResizeProps('td_fone', "border border-black px-1 pt-0 pb-1 align-top font-bold")}>
                  <div className="text-[0.85em] leading-tight">Fone</div>
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
                
                <div {...getResizeProps('q2', "pt-1")}>
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

                <div {...getResizeProps('q4', "pt-0")}>
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

                <div {...getResizeProps('q6', "pt-0")}>
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

                <div {...getResizeProps('q8', "pt-0")}>
                  8 – <span className="underline text-blue-800">Pode praticar</span> atividades físicas? &nbsp;&nbsp;&nbsp; 
                  <PrintCheck checked={formData.q8_atividade_fisica} label="Sim" /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <PrintCheck checked={!formData.q8_atividade_fisica} label="Não, " /> <span className="underline text-blue-800">por que?</span> 
                  <div className="border-b border-black w-full h-4 relative -top-1"><span className="absolute bottom-0 left-0">{!formData.q8_atividade_fisica ? formData.q8_nao_por_que : ''}</span></div>
                </div>

                <div {...getResizeProps('q9', "pt-0")}>
                  9 – Existe algum problema de saúde na <span className="underline text-blue-800">família ?</span> &nbsp;&nbsp;&nbsp; 
                  <PrintCheck checked={!formData.q9_problema_familia} label="Não" /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <PrintCheck checked={formData.q9_problema_familia} label="Sim Qual?" /> <PrintLine val={formData.q9_problema_familia ? formData.q9_qual : ''} width="w-48" />
                  <div className="border-b border-black w-full h-4"></div>
                </div>

                <div {...getResizeProps('q10', "pt-0")}>
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

                <div {...getResizeProps('q13', "pt-0")}>
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

                <div {...getResizeProps('q14', "pt-0")}>
                  14 – Informação de problemas identificados na vivência escolar (ex: cognitivo, afetivo)
                  <div className="border-b border-black w-full h-4 relative"><span className="absolute bottom-0 left-0">{formData.q14_vivencia}</span></div>
                  <div className="border-b border-black w-full h-4"></div>
                </div>

                <div {...getResizeProps('q15', "pt-0 pb-1")}>
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
                  <td colSpan={2} rowSpan={4} {...getResizeProps('td_especificar_diag', "border-2 border-black p-1 text-center align-top relative w-1/2")}>
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
                  <td colSpan={4} {...getResizeProps('td_outra_doenca', "border border-black p-1 h-6")}>Outra doença * <span className="ml-2 font-bold">{formData.diag_outra_doenca ? 'Sim' : ''}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex mb-3">
            <div className="w-6 mr-1 flex items-center justify-center font-bold text-[10px] relative">
               <span className="-rotate-90 whitespace-nowrap absolute">Programas<br/>Sociais</span>
            </div>
            <div className="w-full border border-black p-2 font-bold text-[10px]">
              <div className="mb-1">A família e/ou a criança participam de algum programa social do governo?</div>
              <div className="grid grid-cols-4 gap-2 font-normal">
                <div><PrintCheck checked={formData.programa_social.includes('Bolsa Família')} /> Bolsa Família</div>
                <div><PrintCheck checked={formData.programa_social.includes('Bolsa Alimentação')} /> Bolsa Alimentação</div>
                <div><PrintCheck checked={formData.programa_social.includes('Bolsa-Escola')} /> Bolsa-Escola</div>
                <div><PrintCheck checked={formData.programa_social.includes('Começar de Novo')} /> Começar de Novo</div>
                <div><PrintCheck checked={formData.programa_social.includes('Renda-Mínima')} /> Renda-Mínima</div>
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
