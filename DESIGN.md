---
name: Ampulheta Studio
description: Reconstrução procedural de uma ampulheta pontilhada azul em fundo quase preto.
colors:
  scene-blue: "#36549c"
  scene-black: "#000102"
  studio-background: "#111217"
  surface: "#191a21"
  line: "#2c2e38"
  text: "#e3e5ec"
  muted: "#a0a5b6"
  accent: "#a9bcf4"
  focus: "#b9caff"
  primary-background: "#b3c3ee"
  primary-hover: "#cad6f5"
  primary-text: "#101728"
  field-background: "#13141a"
  field-border: "#363946"
  field-text: "#e3e7f2"
typography:
  title:
    fontFamily: 'Inter, "Segoe UI", sans-serif'
    fontSize: "20px"
    fontWeight: 550
    letterSpacing: "-.025em"
  heading:
    fontFamily: 'Inter, "Segoe UI", sans-serif'
    fontSize: "15px"
    fontWeight: 550
  body:
    fontFamily: 'Inter, "Segoe UI", sans-serif'
    fontSize: "13px"
  control:
    fontFamily: 'Inter, "Segoe UI", sans-serif'
    fontSize: "12px"
  label:
    fontFamily: 'Inter, "Segoe UI", sans-serif'
    fontSize: "11px"
  note:
    fontFamily: 'Inter, "Segoe UI", sans-serif'
    fontSize: "10px"
    lineHeight: 1.6
rounded:
  small: "3px"
  control: "4px"
  quiet: "5px"
  notice: "6px"
spacing:
  compact: "8px"
  row: "12px"
  group: "16px"
  panel: "20px"
  section: "24px"
  viewer: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary-background}"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.control}"
    typography: "{typography.control}"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.primary-text}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "#d1d8eb"
    rounded: "{rounded.control}"
    typography: "{typography.control}"
    width: "100%"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.quiet}"
    padding: "8px 10px"
    typography: "{typography.control}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    padding: "4px"
    typography: "{typography.label}"
  field:
    backgroundColor: "{colors.field-background}"
    textColor: "{colors.field-text}"
    rounded: "{rounded.control}"
    padding: "9px"
    typography: "{typography.label}"
    width: "100%"
  inspector:
    backgroundColor: "{colors.surface}"
    padding: "24px 20px 20px"
---

# Design System: Ampulheta Studio

## Overview

**Creative North Star: "Ampulheta pontilhada azul escura"**

A referência fornecida define o mundo visual: uma ampulheta central feita de pontos azuis discretos, cercada por faixas onduladas sobre fundo quase preto. A luminosidade é contida e a forma emerge da distribuição dos pontos e dos reflexos fragmentados. A reconstrução é uma aproximação controlada, sem promessa de identidade pixel a pixel.

O estúdio usa superfícies escuras, linhas finas e tipografia compacta para manter a atenção na composição. A interface de operação fica fora da imagem renderizada e exportada. Os nomes dos tokens descrevem valores observados no código; não introduzem uma nova direção artística.

**Key Characteristics:**

- Pontos azuis regulares, brilho discreto e fundo quase preto.
- Câmaras arredondadas, gargalo contínuo e bordas curvas.
- Interface compacta com controles nativos e números tabulares.
- Separação entre composição e ferramentas de operação.

## Colors

A paleta combina o azul profundo da cena com cinzas azulados na interface e um acento claro reservado aos controles.

### Primary

- **Scene Blue:** cor padrão dos pontos; a intensidade varia dentro da cena.
- **Accent:** links, controles de faixa e seleção ativa.
- **Primary Background / Primary Hover:** ação principal de exportação, com texto escuro.
- **Focus:** contorno visível de navegação por teclado.

### Neutral

- **Scene Black:** fundo da composição, também usado no palco de prévia.
- **Studio Background / Surface:** base do estúdio e painel de ajustes.
- **Line / Field Border:** separação discreta entre regiões e limites de campos.
- **Text / Muted:** texto principal e informação secundária.
- **Field Background / Field Text:** campos numéricos e seletores.

**The Scene Boundary Rule.** A paleta da interface não deve aumentar o brilho da composição exportada.

## Typography

Inter, com Segoe UI e sans-serif como alternativas, é a única família declarada. Não há fonte display separada nem fonte monoespaçada obrigatória. A hierarquia é funcional e compacta.

- **Title:** identidade do estúdio; reduz para 18px na largura móvel.
- **Heading:** título do painel.
- **Control:** botões, abas e títulos de grupos.
- **Label:** parâmetros, tempo e informação operacional; vários rótulos passam a 12px no móvel.
- **Note:** instruções e detalhes auxiliares.

Valores de tempo, dimensões e parâmetros usam números tabulares. Os estilos não declaram uma altura de linha global; preserve as alturas explícitas apenas onde existem.

## Layout

O cabeçalho tem 84px de altura. A área de trabalho usa uma coluna fluida para o visualizador e um painel lateral de 290px. O visualizador é aderente ao topo, com margem interna horizontal de 28px; sua barra de ferramentas tem 70px de altura.

O palco preserva a proporção 1860:962. A cena ocupa esse retângulo sem distorção, com transporte e informação abaixo. A comparação usa uma referência recortada sobre parte do palco e uma linha vertical; os rótulos de comparação pertencem à interface.

Acima de 1700px, o painel passa a 320px e a margem do visualizador a 40px. Até 1050px, o painel passa a 260px e a margem a 20px; informações auxiliares são reduzidas. Até 760px, o layout vira uma coluna, o cabeçalho mede 74px e o painel fica abaixo da prévia. Campos têm altura mínima de 40px e os botões de exportação, 42px nessa faixa.

O modo cinema oculta o cabeçalho, painel, transporte e ferramentas; a composição mantém sua proporção dentro da janela. O botão de saída pertence ao modo de visualização. A captura usa somente o canvas.

## Elevation & Depth

A interface se organiza principalmente por superfícies tonais e divisórias. O palco usa sombra difusa (0 12px 40px #0003); avisos temporários usam sombra mais compacta (0 6px 24px #0004). Não há um sistema de cartões elevados.

Na cena, profundidade vem da densidade luminosa dos pontos, das paredes curvas e dos reflexos incompletos. Evite converter essa profundidade sugerida em vidro fotorealista ou brilho neon.

## Shapes

Os controles têm cantos pequenos e discretos; o palco é retangular e recorta seu conteúdo. Divisórias e bordas de campos têm espessura de 1px. O foco usa contorno de 2px com afastamento de 4px.

A ampulheta tem duas câmaras arredondadas conectadas por um gargalo aberto e suave. O perfil implementado usa segmentos cúbicos de Hermite com continuidade de raio e tangente. As bordas superior e inferior são curvas. A imagem anotada em reference/shape-guide.png orienta a silhueta; sua marcação branca não faz parte da obra.

A malha regular de pontos e sua franja discreta preservam o caráter pontilhado. As faixas onduladas devem manter a mesma linguagem de luz e pontos da ampulheta.

## Components

### Buttons

A ação principal usa preenchimento claro e peso 600; ações secundárias usam contorno, e ações quietas usam fundo transparente. Botões de exportação têm altura mínima de 38px no desktop. Ícones normalmente medem 17px. Botões de transporte têm área de 30px, com o controle de reprodução em 34px.

Hover altera cor ou fundo em 0,15s. Botões desabilitados usam opacidade 0,55 e cursor de espera. A preferência por movimento reduzido remove as transições da interface.

### Fields and parameters

Seletores e campos numéricos têm fundo escuro, borda fina e altura mínima de 35px no desktop. Parâmetros usam rótulo à esquerda e valor tabular à direita, com um controle de faixa ocupando a linha seguinte. Seleção de cor usa uma amostra compacta ao lado de seu valor textual. Preserve os controles nativos, seus rótulos e o foco visível.

### Tabs and groups

Abas são transparentes, separadas por espaço e uma linha de base. A aba ativa usa texto claro e sublinhado de acento com 2px. Os grupos de ajustes usam disclosure nativo, divisória inferior e seta discreta; a seta gira quando o grupo fecha.

### Preview, comparison and transport

O palco contém a cena. A comparação divide referência e reconstrução sem modificar o render procedural. O transporte combina reprodução, tempo tabular, linha do tempo e repetição. Essas ferramentas ficam fora do canvas exportado.

### Notices and export progress

Avisos temporários usam superfície clara, texto escuro, cantos discretos e largura limitada a 600px ou 90vw. O progresso de exportação usa barra fina de 5px, texto auxiliar e link de download. Mensagens longas podem quebrar linha.

## Do's and Don'ts

### Do:

- Do preservar a referência escura, os pontos regulares e a luminosidade contida.
- Do manter câmaras arredondadas e transições suaves no gargalo.
- Do manter controles, textos e rótulos de comparação fora da composição exportada.
- Do preservar foco visível, controles nativos e números tabulares.
- Do descrever o resultado como aproximação controlada da referência.

### Don't:

- Don't reproduzir o contorno branco da imagem anotada na cena.
- Don't acrescentar neon, vidro fotorealista ou decoração sem relação com a referência.
- Don't distorcer a proporção do palco para preencher o espaço disponível.
- Don't substituir a renderização procedural pelo vídeo de referência.

