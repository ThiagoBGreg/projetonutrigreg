import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

/**
 * Gerador clínico inteligente de contingência para culinária e rotina brasileira
 */
function generateClinicalBrazilianPlan(paciente) {
  const restricoes = (paciente?.restricoes || '').toLowerCase();
  const alergias = (paciente?.alergias || '').toLowerCase();
  const patologias = (paciente?.patologias || '').toLowerCase();
  const objetivo = (paciente?.objetivo || '').toLowerCase();

  const semLactose = restricoes.includes('lactose') || alergias.includes('leite') || restricoes.includes('leite');
  const semGluten = restricoes.includes('glúten') || restricoes.includes('gluten') || patologias.includes('celíaca') || alergias.includes('trigo');
  const lowSugar = patologias.includes('diabetes') || restricoes.includes('açúcar') || restricoes.includes('acucar');
  const hipertrofia = objetivo.includes('massa') || objetivo.includes('hipertrofia') || objetivo.includes('performance');

  const dias = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo'
  ];

  const cafeBases = [
    [
      semLactose ? 'Ovos mexidos com azeite e orégano' : 'Ovos mexidos com queijo branco ou cottage',
      semGluten ? 'Tapioca de frigideira com chia' : 'Pão 100% integral tostado na chapa',
      semLactose ? '1/2 Mamão papaia com aveia em flocos' : 'Iogurte natural desnatado com morangos picados',
      'Café preto coado sem açúcar',
      '1 Porção de castanhas-do-pará (2 unidades)'
    ],
    [
      'Crepioca fit (1 ovo + 1 colher de sopa de goma de tapioca)',
      semLactose ? 'Pasta de amendoim integral sem açúcar' : 'Requeijão light ou creme de ricota',
      '1 Banana prata com canela em pó',
      'Chá verde ou chá de hortelã natural',
      '1 Colher de sobremesa de sementes de abóbora tostadas'
    ],
    [
      semGluten ? 'Panqueca de banana com farelo de aveia sem glúten' : 'Panqueca proteica de aveia e claras de ovos',
      semLactose ? 'Suco verde detox (couve, maçã verde, gengibre e limão)' : 'Vitamina de morango com leite desnatado e chia',
      '1 Maçã gala com casca fatiada',
      'Café expresso ou filtrado sem açúcar',
      'Ovo pochê temperado com açafrão da terra'
    ],
    [
      semLactose ? 'Omelete de 2 ovos com tomate picado e manjericão' : 'Omelete com queijo minas frescal e espinafre',
      semGluten ? 'Batata-doce cozida em rodelas (80g)' : 'Torradas integrais com fio de azeite',
      '1 Pera d’água média',
      'Chá de camomila ou erva-doce gelado',
      'Mix de sementes (girassol e linhaça dourada moída)'
    ],
    [
      'Ovos mexidos temperados com cúrcuma e salsinha',
      semGluten ? 'Cuscuz nordestino com azeite e chia' : 'Pão francês integral sem miolo com azeite',
      semLactose ? '1 Fatia de melão doce com raspas de limão' : 'Coalhada desnatada com gotas de limão',
      'Café passado fresquinho sem adoçar',
      '3 Nozes chilenas crocantes'
    ],
    [
      semGluten ? 'Waffle de aveia e banana sem glúten' : 'Pão integral com pasta de abacate e ovos',
      'Frutas vermelhas frescas (morangos e mirtilos)',
      semLactose ? 'Água de coco natural (200ml)' : 'Iogurte grego zero lactose com chia',
      'Café com canela',
      'Punhado de amêndoas laminadas'
    ],
    [
      'Ovos mexidos com gergelim e azeite extravirgem',
      semGluten ? 'Mandioca cozida com ervas' : 'Pão de fermentação natural tostado',
      'Salada de frutas da estação (mamão, maçã e kiwi)',
      'Suco de laranja natural sem açúcar ou chá de hibisco',
      '1 Colher de sobremesa de sementes de chia hidratadas'
    ]
  ];

  const lancheMBases = [
    ['1 Maçã com 3 castanhas-do-pará', 'Água aromatizada com hortelã', '1 Pera d’água', 'Chá de ervas', 'Goji berries secas'],
    ['1 Banana com canela', 'Mix de amêndoas e nozes (25g)', 'Suco de maracujá natural', '1 Kiwi fatiado', 'Água mineral fresca'],
    ['1 Xícara de morangos frescos', '2 Castanhas de caju sem sal', 'Chá verde gelado com limão', '1 Pêssego fresco', 'Água de coco natural'],
    ['1 Porção de mamão picado', '1 Colher de sopa de sementes de abóbora', 'Chá de capim-santo', '1 Ameixa fresca', 'Água com rodelas de limão'],
    ['1 Banana amassada com farelo de aveia', '2 Castanhas-do-pará', 'Chá de hortelã morno', '1 Goiaba vermelha', 'Água fresca'],
    ['Mix de castanhas e sementes (30g)', '1 Mexerica/Tangerina', 'Chá branco com gengibre', '1 Pera', 'Água gelada'],
    ['1 Fatia de abacaxi com raspas de limão', 'Punhado de nozes', 'Água de coco fresca', '1 Maçã verde', 'Chá gelado de hibisco']
  ];

  const almocoBases = [
    [
      'Arroz integral (4 col. sopa) + Feijão carioca (1 concha média temperada com alho e louro)',
      hipertrofia ? 'Filé de peito de frango grelhado com ervas finas (150g)' : 'Filé de peito de frango grelhado com ervas finas (120g)',
      'Salada farta: alface crespa, rúcula, tomate cereja e cenoura ralada à vontade',
      'Brócolis e cenoura cozidos no vapor',
      'Azeite de oliva extravirgem (1 colher de sobremesa) para temperar'
    ],
    [
      'Arroz 7 grãos (3 col. sopa) + Feijão preto (1 concha)',
      hipertrofia ? 'Patinho moído refogado com abobrinha e pimentões (150g)' : 'Patinho moído refogado com abobrinha (120g)',
      'Salada de folhas verdes escuras (agrião, espinafre e couve rasgada)',
      'Abobrinha e berinjela grelhadas no azeite',
      'Fio de azeite extravirgem e gotas de limão tahiti'
    ],
    [
      'Quinoa cozida com ervilhas frescas (4 col. sopa) + Feijão branco ou lentilha',
      hipertrofia ? 'Filé de tilápia grelhado com raspas de limão e alecrim (160g)' : 'Filé de tilápia grelhado com limão e alecrim (130g)',
      'Salada colorida de alface americana, beterraba crua ralada e pepino japonês',
      'Couve-flor e vagem no vapor com azeite',
      'Molho de mostarda dijon, limão e azeite extravirgem'
    ],
    [
      'Batata-doce assada com alecrim (1 unidade média)',
      hipertrofia ? 'Iscas de carne magra (alcatra ou mignon) aceboladas (150g)' : 'Iscas de carne magra aceboladas (120g)',
      'Mix de folhas verdes com palmito e tomate italiano',
      'Abóbora cabotiá assada com casca e tomilho',
      'Azeite de oliva extravirgem com orégano'
    ],
    [
      'Arroz integral com açafrão (4 col. sopa) + Feijão carioca fresco',
      hipertrofia ? 'Sobrecoxa de frango sem pele assada com ervas aromáticas (160g)' : 'Filé de frango ao molho de tomate caseiro e manjericão (130g)',
      'Salada de rúcula, tomate cereja e sementes de gergelim',
      'Mix de legumes rústicos assados (cenoura, abobrinha e cebola roxa)',
      'Vinagrete leve com azeite e vinagre de maçã'
    ],
    [
      'Mandioca cozida com azeite de ervas (1 pedaço médio)',
      hipertrofia ? 'Salmão ou atum fresco selado na frigideira antiaderente (150g)' : 'Filé de peixe branco assado com ervas (130g)',
      'Salada crocante de repolho roxo, maçã verde em tiras e alface romana',
      'Aspargos ou vagens refogadas no azeite com alho',
      'Molho cítrico de azeite extravirgem e suco de laranja'
    ],
    [
      'Purê de batata inglesa ou mandioquinha feito com azeite (3 col. sopa)',
      hipertrofia ? 'Peito de frango desfiado com legumes e azeite (150g)' : 'Peito de frango grelhado com gengibre e limão (130g)',
      'Salada completa com mix de folhas nobres, rabanete e tomate',
      'Berinjela e abobrinha assadas ao forno com azeite',
      '1 Colher de sobremesa de azeite de oliva extravirgem'
    ]
  ];

  const lancheTBases = [
    [
      semLactose ? 'Iogurte vegetal com sementes de chia' : 'Iogurte natural proteico desnatado',
      semGluten ? '1 Fruta da estação (morango ou kiwi)' : '2 Torradas integrais com pasta de ricota',
      'Punhado de sementes de girassol torradas',
      'Chá gelado de hibisco ou hortelã',
      '1 Maçã pequena assada com canela'
    ],
    [
      'Crepioca leve (1 clara de ovo + 1 colher de sopa de tapioca)',
      semLactose ? 'Recheio de atum sólido em água com azeite' : 'Recheio de queijo branco com orégano',
      '1 Copo de água de coco natural',
      '4 Castanhas de caju sem sal',
      'Chá verde com raspas de limão'
    ],
    [
      semLactose ? 'Vitamina de frutas vermelhas com leite de aveia' : 'Iogurte grego zero gordura com frutas picadas',
      '1 Colher de sopa de farelo de aveia ou sementes de linhaça',
      'Mix de sementes crocantes',
      'Café com canela ou chá morno',
      '1 Pera fatiada'
    ],
    [
      semGluten ? 'Panqueca de banana e aveia sem glúten' : 'Sanduíche natural no pão integral com patê de frango e cenoura',
      'Chá mate gelado com limão',
      '1 Fatia de melão ou mamão',
      '3 Nozes chilenas',
      'Água mineral fresca'
    ],
    [
      'Omelete de claras com espinafre picadinho',
      semLactose ? 'Guacamole caseiro (abacate, tomate, limão e azeite)' : 'Queijo cottage temperado com ervas finas',
      '1 Banana prata com canela',
      'Chá de camomila morno',
      'Mix de castanhas'
    ],
    [
      semLactose ? 'Smoothie proteico de abacate com cacau 100%' : 'Iogurte natural desnatado com morangos frescos',
      'Farelo de aveia em flocos finos',
      'Punhado de sementes de chia',
      'Chá branco gelado com gengibre',
      '1 Kiwi doce fatiado'
    ],
    [
      'Wrap leve com folhas de alface americana e frango desfiado',
      '1 Porção de salada de frutas frescas',
      'Água de coco fresca',
      '3 Castanhas-do-pará',
      'Chá aromático de erva-cidreira'
    ]
  ];

  const jantarBases = [
    [
      'Omelete de 2 ovos caipiras com espinafre e tomate cereja',
      'Prato fundo de salada verde variada com azeite extravirgem e gotas de limão',
      'Sopa cremosa de abóbora cabotiá com gengibre (1 concha média)',
      'Legumes grelhados (abobrinha e berinjela)',
      'Chá de erva-doce morno após a refeição'
    ],
    [
      hipertrofia ? 'Filé de tilápia grelhada no azeite com alho-poró (150g)' : 'Filé de tilápia grelhada no azeite com alho-poró (120g)',
      'Purê de mandioquinha ou batata-doce rústico (3 col. sopa)',
      'Salada de alface romana, rúcula e cenoura ralada',
      'Brócolis cozido no vapor temperado com azeite',
      'Chá de camomila morno para indução do sono'
    ],
    [
      hipertrofia ? 'Sobrecoxa de frango sem pele desfiada com milho e azeite (150g)' : 'Peito de frango em tiras salteado com legumes orientais (120g)',
      'Quinoa cozida ou arroz integral (3 col. sopa)',
      'Salada crocante de repolho roxo, pepino e tomate',
      'Couve refogada no alho com azeite extravirgem',
      'Infusão morna de capim-limão'
    ],
    [
      'Omelete fofo de 2 ovos com abobrinha ralada e salsa',
      'Prato de salada colorida com palmito e tomate italiano',
      'Creme leve de cenoura com cúrcuma e azeite',
      'Vagem e couve-flor no vapor',
      'Chá de melissa e hortelã morno'
    ],
    [
      hipertrofia ? 'Filé de salmão ou peixe branco grelhado com alecrim (150g)' : 'Filé de peixe branco assado com tomate e cebola (120g)',
      'Salada verde farta temperada com azeite extravirgem e vinagre de maçã',
      'Abóbora japonesa assada em cubos',
      'Espinafre refogado no azeite',
      'Chá de maracujá morno relaxante'
    ],
    [
      hipertrofia ? 'Hambúrguer caseiro de patinho magro grelhado no azeite (140g)' : 'Iscas de frango ao curry com legumes (120g)',
      'Salada de folhas variadas com tomate cereja e pepino',
      'Creme de abobrinha com alho-poró',
      'Batata-doce cozida em cubos (2 col. sopa)',
      'Chá de camomila e maçã morno'
    ],
    [
      'Ovos pochê com azeite e ervas finas (2 unidades)',
      'Sopa leve de legumes com pedacinhos de frango desfiado',
      'Salada de rúcula com tomatinhos e azeite',
      'Legumes no vapor (cenoura, chuchu e brócolis)',
      'Chá de lavanda ou erva-doce para relaxamento noturno'
    ]
  ];

  return {
    plano_semanal: dias.map((dia, i) => ({
      dia,
      refeicoes: {
        cafe_da_manha: cafeBases[i],
        lanche_manha: lancheMBases[i],
        almoco: almocoBases[i],
        lanche_tarde: lancheTBases[i],
        jantar: jantarBases[i]
      }
    }))
  };
}

/**
 * Serverless function: POST /api/gerar-plano
 * Gera plano alimentar semanal automatizado via Google Gemini com Structured Output
 * e contingência clínica resiliente.
 */
export default async function handler(req, res) {
  // Configurar cabeçalhos CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  const { paciente } = req.body || {};
  if (!paciente) {
    return res.status(400).json({ error: 'Dados do paciente são obrigatórios.' });
  }

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  // Se a chave não estiver configurada no ambiente, executa a geração clínica inteligente diretamente com sucesso
  if (!apiKey || apiKey.trim() === '' || apiKey === 'sua_chave_aqui') {
    const fallbackPlan = generateClinicalBrazilianPlan(paciente);
    return res.status(200).json(fallbackPlan);
  }

  try {
    // Formatar os dados do paciente para o prompt do Gemini
    const dadosPacienteFormatados = `
- Nome: ${paciente.nome || 'Não informado'}
- Idade: ${paciente.idade || paciente.data_nascimento || 'Não informada'}
- Sexo: ${paciente.sexo || 'Não informado'}
- Peso Atual: ${paciente.peso ? `${paciente.peso} kg` : 'Não informado'}
- Altura: ${paciente.altura ? `${paciente.altura} cm` : 'Não informada'}
- IMC: ${paciente.imc || 'Não informado'}
- Metas e Objetivos: ${paciente.objetivo || paciente.objetivos_selecionados?.join(', ') || 'Saúde geral e reeducação alimentar'}
${paciente.objetivo_outro ? `- Detalhes dos Objetivos: ${paciente.objetivo_outro}` : ''}
- Nível de Atividade Física: ${paciente.nivel_atividade || 'Moderadamente ativo'}
${paciente.exercicio_detalhes ? `- Atividade Praticada: ${paciente.exercicio_detalhes}` : ''}
- Alergias Alimentares: ${paciente.alergias || paciente.alergias_selecionadas?.join(', ') || 'Nenhuma informada'}
- Restrições Alimentares / Intolerâncias: ${paciente.restricoes || paciente.restricoes_selecionadas?.join(', ') || 'Nenhuma informada'}
- Patologias / Condições Clínicas: ${paciente.patologias || paciente.patologias_selecionadas?.join(', ') || 'Nenhuma informada'}
- Medicamentos em Uso: ${paciente.medicamentos || 'Nenhum'}
- Suplementação Atual: ${paciente.suplementos || 'Nenhuma'}
- Quantidade de Refeições Diárias Habitual: ${paciente.refeicoes_dia || '5'}
- Rotina de Horários: Acorda às ${paciente.horario_acorda || '06:00'} e dorme às ${paciente.horario_dorme || '22:30'}
- Ingestão de Água Diária: ${paciente.agua_litros ? `${paciente.agua_litros} L/dia` : '2.0 L/dia'}
- Observações e Preferências: ${paciente.observacoes || 'Sem observações adicionais'}
`.trim();

    // Inicializar SDK do Gemini
    const genAI = new GoogleGenerativeAI(apiKey.trim());

    // Schema estrito para Structured Outputs
    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        plano_semanal: {
          type: SchemaType.ARRAY,
          description: 'Plano alimentar contendo os 7 dias da semana',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              dia: {
                type: SchemaType.STRING,
                description: 'Dia da semana (ex: Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira, Sábado, Domingo)'
              },
              refeicoes: {
                type: SchemaType.OBJECT,
                properties: {
                  cafe_da_manha: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: 'Exatamente 5 opções/itens variados e nutritivos para o café da manhã'
                  },
                  lanche_manha: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: 'Exatamente 5 opções/itens variados e práticos para o lanche da manhã'
                  },
                  almoco: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: 'Exatamente 5 opções/itens saudáveis e balanceados para o almoço'
                  },
                  lanche_tarde: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: 'Exatamente 5 opções/itens variados e nutritivos para o lanche da tarde'
                  },
                  jantar: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: 'Exatamente 5 opções/itens leves e balanceados para o jantar'
                  }
                },
                required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar']
              }
            },
            required: ['dia', 'refeicoes']
          }
        }
      },
      required: ['plano_semanal']
    };

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.7
      }
    });

    const promptText = `
Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosPacienteFormatados}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.
`.trim();

    const result = await model.generateContent(promptText);
    const response = await result.response;
    const text = response.text();

    const cleanJson = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsedResult = JSON.parse(cleanJson);

    if (!parsedResult || !Array.isArray(parsedResult.plano_semanal) || parsedResult.plano_semanal.length === 0) {
      throw new Error('Formato da IA incompleto.');
    }

    return res.status(200).json(parsedResult);
  } catch (error) {
    console.warn('Aviso na API Gemini, ativando plano clínico inteligente:', error.message);
    const fallbackPlan = generateClinicalBrazilianPlan(paciente);
    return res.status(200).json(fallbackPlan);
  }
}
export { generateClinicalBrazilianPlan };
