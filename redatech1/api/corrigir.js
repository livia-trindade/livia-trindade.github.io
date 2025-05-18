export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  const { prompt } = req.body;

  // Verificação de segurança
  if (!prompt || prompt.length < 10) {
    return res.status(400).json({ erro: "Prompt ausente ou muito curto" });
  }

  console.log("🔑 API KEY:", process.env.OPENROUTER_KEY ? "✔️ Carregada" : "❌ Ausente");
  console.log("📨 Prompt recebido:", prompt.substring(0, 200));

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
          { role: "system", content: "Você é um corretor de redações do ENEM." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5
      })
    });

    if (!response.ok) {
      const erroTexto = await response.text();
      console.error("❌ Erro na API OpenRouter:", response.status, erroTexto);
      return res.status(500).json({ erro: "Erro da OpenRouter", detalhe: erroTexto });
    }

    const data = await response.json();
    const texto = data.choices?.[0]?.message?.content || "Sem resposta da IA";
    return res.status(200).json({ resposta: texto });

  } catch (error) {
    console.error("❌ Erro inesperado:", error.message);
    return res.status(500).json({ erro: "Erro interno", detalhe: error.message });
  }
}
