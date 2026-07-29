import { ParsedTransaction } from './regex-parser';

interface NimToolCall {
  function: { name: string; arguments: string };
}

interface NimChoice {
  message: { content: string; tool_calls?: NimToolCall[] };
}

interface NimResponse {
  choices: NimChoice[];
}

export async function parseByNim(
  text: string,
  categories: string[]
): Promise<ParsedTransaction | null> {
  const apiKey = process.env.NIM_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const model = process.env.NIM_MODEL || 'meta/llama-3.1-70b-instruct';

  try {
    const catContext = 'Categorias disponibles: ' + categories.join(', ') + '. Usa solo esas categorias.';

    const body = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'Eres un asistente que extrae transacciones financieras. ' + catContext },
        { role: 'user', content: text }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'registrar_transaccion',
          description: 'Extrae los datos de una transaccion financiera de un mensaje en lenguaje natural',
          parameters: {
            type: 'object',
            properties: {
              tipo: { type: 'string', enum: ['gasto', 'ingreso'] },
              monto: { type: 'number' },
              categoria: { type: 'string' },
              descripcion: { type: 'string' },
              es_correccion: { type: 'boolean', description: 'true si el usuario esta corrigiendo el ultimo registro' },
              confianza: { type: 'string', enum: ['alta', 'media', 'baja'] }
            },
            required: ['tipo', 'monto', 'categoria', 'confianza']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'registrar_transaccion' } }
    });

    const res = await fetch(baseUrl + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: body,
    });

    if (!res.ok) return null;

    const data = await res.json() as NimResponse;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== 'registrar_transaccion') return null;

    const args = JSON.parse(toolCall.function.arguments);

    return {
      type: args.tipo,
      amount: args.monto,
      category: args.categoria,
      description: args.descripcion,
      isCorrection: args.es_correccion || false,
      confidence: args.confianza || 'media',
    };
  } catch {
    return null;
  }
}
