export default async function handler(req, res) {
  // Configurações de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Resposta pré-flight para OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validação do método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      code: 'METHOD_NOT_ALLOWED',
      message: 'Apenas requisições POST são permitidas'
    });
  }

  // Validação do corpo da requisição
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_BODY',
      message: 'Corpo da requisição inválido'
    });
  }

  const { prompt } = req.body;

  // Validação do prompt
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_PROMPT',
      message: 'O prompt deve ser uma string com pelo menos 10 caracteres'
    });
  }

  try {
    // Configuração da chamada para a API OpenRouter
    const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://api-redacao-enem.vercel.app', // Opcional: identifique seu site
        'X-Title': 'Corretor ENEM' // Opcional: identifique seu app
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
          {
            role: "system",
            content: "Você é um corretor especializado em redações do ENEM. Avalie com base nas 5 competências oficiais e forneça feedback detalhado."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 2000
      }),
      timeout: 25000 // 25 segundos
    });

    // Tratamento da resposta da API
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(
        `OpenRouter API error: ${apiResponse.status} - ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const data = await apiResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Resposta da API não contém conteúdo válido');
    }

    // Cache control para otimização
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');

    // Resposta de sucesso
    return res.status(200).json({
      status: 'success',
      data: {
        resposta: content,
        metadata: {
          model: data.model,
          usage: data.usage
        }
      }
    });

  } catch (error) {
    // Log detalhado do erro (aparece nos logs do Vercel)
    console.error('Error in corrigir.js:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Resposta de erro padronizada
    return res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro ao processar a correção',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
