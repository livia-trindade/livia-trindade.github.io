class CorretorRedacao {
  constructor() {
    this.redacoes = {
      notas1000: "",
      variadas: ""
    };
    this.init();
  }

  async init() {
    try {
      await this.carregarRedacoes();
      console.log("Redações carregadas com sucesso");
    } catch (error) {
      console.error("Erro ao carregar redações:", error);
    }
  }

  async carregarRedacoes() {
    const [r1, r2] = await Promise.all([
      fetch("redacoes_notas_1000.txt"),
      fetch("redacoes_variadas.txt")
    ]);
    
    if (!r1.ok || !r2.ok) throw new Error("Falha ao carregar redações");
    
    this.redacoes.notas1000 = await r1.text();
    this.redacoes.variadas = await r2.text();
  }

  formatarResposta(resposta) {
    // Primeiro remove todos os marcadores de formatação
    let textoFormatado = resposta
      .replace(/\*\*/g, '')  // Remove negrito
      .replace(/\*/g, '')    // Remove itálico
      .replace(/__/g, '')    // Remove sublinhado
      .replace(/~~/g, '')    // Remove riscado
      .replace(/```/g, '')   // Remove blocos de código
      .replace(/`/g, '')     // Remove código inline
      .replace(/---+/g, '')  // Remove linhas divisórias
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')  // Remove links markdown
      .replace(/<\/?[^>]+(>|$)/g, '');     // Remove tags HTML

    // Melhora a formatação dos títulos e seções
    textoFormatado = textoFormatado
      .replace(/(Nota Final: \d+\/1000)/, '===== $1 =====\n\n')
      .replace(/(Detalhamento por Competência:)/, '\n$1\n\n')
      .replace(/(Competência [IVXLCDM]+ \(.*?\): \d+\/200)/g, '\n$1\n')
      .replace(/(Pontos Fortes:|Ajustes:)/g, '\n$1\n')
      .replace(/(Recomendações para Melhoria:|Observação Final:)/g, '\n\n$1\n\n');

    // Adiciona quebras de linha para itens numerados
    textoFormatado = textoFormatado.replace(/(\d+\.)\s/g, '\n$1 ');

    // Remove múltiplas quebras de linha consecutivas
    textoFormatado = textoFormatado.replace(/\n{3,}/g, '\n\n');

    return textoFormatado.trim();
  }

  async function corrigirRedacao() {
  try {
    const response = await fetch('https://api-redacao-enem.vercel.app/api/corrigir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: "Texto da redação..." })
    });
    
    if (!response.ok) throw new Error('Erro na API');
    
    const data = await response.json();
    console.log(data.data.resposta);
  } catch (error) {
    console.error("Erro:", error);
  }
}

  criarPrompt(tema, redacao) {
    return `Você é um assistente especializado em correção de redações do ENEM. Sua tarefa é avaliar a redação do usuário com base nas 5 competências oficiais do exame, fornecendo um feedback detalhado e atribuindo uma nota de 0 a 1000.
A redação deve ter, no mínimo, 7 linhas, caso contrário, ela terá nota 0.
Competência I: Domínio da Norma Culta da Língua Portuguesa
- Avalie a gramática, a estrutura sintática e a adequação ao registro formal.
- Critérios de Pontuação:  
  - 0: Desconhecimento da modalidade escrita formal.  
  - 40: Domínio precário, com desvios frequentes.  
  - 80: Domínio insuficiente, com muitos desvios.  
  - 120: Domínio mediano, com alguns desvios.  
  - 160: Bom domínio, com poucos desvios.  
  - 200: Excelente domínio, sem desvios significativos.  

Competência II: Compreensão da Proposta de Redação
- Avalie se o candidato compreendeu o tema e a estrutura dissertativo-argumentativa.  
- Critérios de Pontuação:  
  - 0: Fuga ao tema ou inadequação à estrutura.  
  - 40: Tangenciamento do tema ou domínio precário da estrutura.  
  - 80: Cópia dos textos motivadores ou domínio insuficiente da estrutura.  
  - 120: Argumentação previsível e domínio mediano da estrutura.  
  - 160: Argumentação consistente e bom domínio da estrutura.  
  - 200: Argumentação consistente, repertório produtivo e excelente domínio da estrutura.  

Competência III: Seleção e Organização de Argumentos
- Avalie a capacidade de selecionar, relacionar e interpretar informações em defesa de um ponto de vista.  
- Critérios de Pontuação:  
  - 0: Informações irrelevantes ou sem defesa de um ponto de vista.  
  - 40: Informações pouco relacionadas ao tema ou incoerentes.  
  - 80: Informações limitadas aos textos motivadores ou desorganizadas.  
  - 120: Informações relevantes, mas pouco organizadas.  
  - 160: Informações bem relacionadas e com indícios de autoria.  
  - 200: Informações consistentes, organizadas e com autoria clara.  

Competência IV: Coesão e Coerência Textual
- Avalie a articulação entre as partes do texto, o uso de conectores e a estrutura lógica.  
- Critérios de Pontuação:  
  - 0: Ausência de articulação entre as partes do texto.  
  - 40: Articulação precária.  
  - 80: Articulação insuficiente, com muitas inadequações.  
  - 120: Articulação mediana, com algumas inadequações.  
  - 160: Boa articulação e repertório diversificado de conectivos.  
  - 200: Articulação excelente e repertório variado de conectivos.  

Competência V: Proposta de Intervenção
- Avalie a solução apresentada para o problema abordado, considerando respeito aos direitos humanos.  
- Critérios de Pontuação:  
  - 0: Proposta ausente ou desconectada do tema.  
  - 40: Proposta vaga ou precária.  
  - 80: Proposta insuficiente e sem articulação com a discussão.  
  - 120: Proposta mediana e articulada com a discussão.  
  - 160: Proposta bem elaborada e coerente.  
  - 200: Proposta detalhada, bem desenvolvida e articulada com o texto.

Redações Nota 1000:
${this.redacoes.notas1000}

Redações Variadas:
${this.redacoes.variadas}

Tema: ${tema}

Redação do Usuário:
${redacao}`;
  }

  toggleLoading(loading) {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.style.display = loading ? "inline" : "none";
    }
  }

    baixarPDF() {
    const resultado = document.getElementById("resultado").innerText.trim();
    
    // Verifica se é a versão do professor
    const turmaInput = document.getElementById("turma");
    const alunoInput = document.getElementById("aluno");
    
    const turma = turmaInput ? turmaInput.value.trim() : null;
    const aluno = alunoInput ? alunoInput.value.trim() : null;
    const tema = document.getElementById("tema").value.trim();

    if (!resultado || resultado.includes("aguarde") || resultado.includes("Aguardando")) {
      alert("Nenhum resultado disponível para exportar.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const hoje = new Date().toLocaleDateString("pt-BR");
    
    // Configuração do cabeçalho
    doc.setFontSize(14);
    doc.text("Avaliação da Redação - ENEM", 10, 10);
    doc.setFontSize(10);
    
    // Adiciona turma e aluno se existirem
    let infoLine = `Data: ${hoje} | Tema: ${tema}`;
    if (turma && aluno) {
      infoLine = `Aluno: ${aluno} | Turma: ${turma} | ${infoLine}`;
    }
    doc.text(infoLine, 10, 18);
    
    // Conteúdo da redação
    doc.setFontSize(12);
    const linhas = doc.splitTextToSize(resultado, 180);
    doc.text(linhas, 10, 30);
    
    // Nome do arquivo
    let nomeArquivo;
    if (turma && aluno) {
      nomeArquivo = `Correcao_${aluno}_${turma}`.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    } else {
      nomeArquivo = `Correcao_${tema}`.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    }
    doc.save(`${nomeArquivo}.pdf`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.corretor = new CorretorRedacao();
});
