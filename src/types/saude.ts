export interface FichaSaudeData {
  id_ficha?: string;
  id_aluno?: number;
  
  // Informações Gerais
  q1_problema_nascimento: boolean;
  q1_qual: string;
  q2_anemia: boolean;
  q3_internado: boolean;
  q3_motivo_idade: string;
  q4_problema_saude: boolean;
  q4_qual: string;
  q5_tratamento: boolean;
  q5_qual_onde: string;
  q6_dieta: boolean;
  q6_por_que: string;
  q7_deficiencia: boolean;
  q7_qual: string;
  q7_tipo: string[]; // visual, auditiva, mental, fisica, multipla
  q8_atividade_fisica: boolean;
  q8_nao_por_que: string;
  q9_problema_familia: boolean;
  q9_qual: string;
  q10_ubs: string;
  q11_convenio: boolean;
  q11_qual: string;
  q12_medicamento_febre: string;
  q12_dose: string;
  q13_alergia: boolean;
  q13_qual: string;
  q13_tipo: string[]; // alimento, medicamento, outro
  q13_especificar: string;
  q14_vivencia: string;
  q15_emergencia_nome_1: string;
  q15_emergencia_tel_1: string;
  q15_emergencia_nome_2: string;
  q15_emergencia_tel_2: string;

  // Diagnóstico Atual
  diag_anemia: boolean;
  diag_asma: boolean;
  diag_diabetes: boolean;
  diag_desnutricao: boolean;
  diag_cardiaco: boolean;
  diag_digestivo: boolean;
  diag_neurologico: boolean;
  diag_convulsoes: boolean;
  diag_celiaca: boolean;
  diag_fenilcetonuria: boolean;
  diag_obesidade: boolean;
  diag_outra_doenca: boolean;
  diag_especificar: string;

  // Situação Vacinal
  situacao_vacinal: Record<string, {
    d1: boolean;
    d2: boolean;
    d3: boolean;
    ref1: boolean;
    ref2: boolean;
  }>;

  // Teste de Acuidade Visual
  acuidade_visual: {
    data: string;
    idade: string;
    resultado_od: string;
    resultado_oe: string;
    consulta_oftalmo_data_1: string;
    consulta_oftalmo_data_2: string;
  };
  usa_oculos: boolean;

  // Saúde Auditiva
  ouve_bem: boolean;
  atraso_fala: boolean;
  saude_auditiva_encaminhamentos: string;
  saude_auditiva_resultados: string;

  // Saúde Bucal
  saude_bucal: {
    mes_ano: string[];
    risco_carie: string[];
    fluorterapia: string[];
  };

  // Programas Sociais
  programa_social: string[]; // Bolsa Alimentação, Bolsa-Escola, Começar de Novo, Renda-Mínima, Nenhum, Outro

  responsavel_preenchimento: string;
  data_preenchimento: string;
}

export const initialFichaSaudeData: FichaSaudeData = {
  q1_problema_nascimento: false,
  q1_qual: '',
  q2_anemia: false,
  q3_internado: false,
  q3_motivo_idade: '',
  q4_problema_saude: false,
  q4_qual: '',
  q5_tratamento: false,
  q5_qual_onde: '',
  q6_dieta: false,
  q6_por_que: '',
  q7_deficiencia: false,
  q7_qual: '',
  q7_tipo: [],
  q8_atividade_fisica: true,
  q8_nao_por_que: '',
  q9_problema_familia: false,
  q9_qual: '',
  q10_ubs: '',
  q11_convenio: false,
  q11_qual: '',
  q12_medicamento_febre: '',
  q12_dose: '',
  q13_alergia: false,
  q13_qual: '',
  q13_tipo: [],
  q13_especificar: '',
  q14_vivencia: '',
  q15_emergencia_nome_1: '',
  q15_emergencia_tel_1: '',
  q15_emergencia_nome_2: '',
  q15_emergencia_tel_2: '',

  diag_anemia: false,
  diag_asma: false,
  diag_diabetes: false,
  diag_desnutricao: false,
  diag_cardiaco: false,
  diag_digestivo: false,
  diag_neurologico: false,
  diag_convulsoes: false,
  diag_celiaca: false,
  diag_fenilcetonuria: false,
  diag_obesidade: false,
  diag_outra_doenca: false,
  diag_especificar: '',

  situacao_vacinal: {
    BCG: { d1: false, d2: false, d3: false, ref1: false, ref2: false },
    Sabin: { d1: false, d2: false, d3: false, ref1: false, ref2: false },
    DPT: { d1: false, d2: false, d3: false, ref1: false, ref2: false },
    Tetravalente: { d1: false, d2: false, d3: false, ref1: false, ref2: false },
    Hib: { d1: false, d2: false, d3: false, ref1: false, ref2: false },
    Sarampo: { d1: false, d2: false, d3: false, ref1: false, ref2: false },
    TripliceViral: { d1: false, d2: false, d3: false, ref1: false, ref2: false },
    HepatiteB: { d1: false, d2: false, d3: false, ref1: false, ref2: false },
    Outra: { d1: false, d2: false, d3: false, ref1: false, ref2: false },
  },

  acuidade_visual: {
    data: '',
    idade: '',
    resultado_od: '',
    resultado_oe: '',
    consulta_oftalmo_data_1: '',
    consulta_oftalmo_data_2: '',
  },
  usa_oculos: false,

  ouve_bem: true,
  atraso_fala: false,
  saude_auditiva_encaminhamentos: '',
  saude_auditiva_resultados: '',

  saude_bucal: {
    mes_ano: ['', '', '', ''],
    risco_carie: ['', '', '', ''],
    fluorterapia: ['', '', '', ''],
  },

  programa_social: [],
  responsavel_preenchimento: '',
  data_preenchimento: ''
};
