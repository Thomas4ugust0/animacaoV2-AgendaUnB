# Ampulheta

Estúdio local de reconstrução procedural do vídeo `ampulheta_minimalista.mp4`. A cena é desenhada por código em uma grade regular de pontos: máscaras da ampulheta e da areia, três faixas paramétricas e shaders de cor/transparência. O vídeo de referência aparece somente no modo de comparação.

## Abrir

Requer Node.js 22.12+ ou 24 e um navegador com WebGL2. Para exportação, Edge ou Chrome instalado; alternativamente, `npx playwright install chromium`.

```sh
npm install
npm run dev
```

Abra **http://127.0.0.1:5180/**. Se a porta estiver ocupada, execute `npm run dev -- --port 5181`.

## Usar

- **Reprodução:** reproduzir/pausar, voltar ao início, arrastar a linha do tempo e repetir. A preferência do sistema por movimento reduzido inicia a cena pausada. Espaço controla reprodução quando o foco não está em um controle.
- **Ajustes:** luminosidade, tamanho e espaçamento dos pontos, cores, escala da ampulheta, ondulação/largura das faixas, velocidade e areia. É possível ocultar ampulheta ou faixas separadamente.
- **Comparar referência:** original à esquerda, reconstrução à direita. O controle de divisão revela cada lado; a linha do tempo sincroniza a referência. A referência não é afetada pelos ajustes procedurais.
- **Modo cinema:** esconde a interface. `Esc` retorna ao estúdio.
- **Salvar ajustes / importar:** arquivos JSON portáveis. Restaurar volta à configuração calibrada padrão.
- **PNG:** captura o instante atual na resolução escolhida, sem a interface e sem a referência.
- **MP4:** renderiza desde zero usando os ajustes atuais. Um progresso indica o trabalho e um link permite baixar o arquivo pronto. O servidor deve permanecer aberto durante a exportação. Os arquivos também ficam em `output/jobs/<id>/`.

O build estático (`npm run build`, `npm run preview`) mantém a cena, comparação e PNG. Exportar MP4 pela interface exige `npm run dev`, pois a codificação ocorre no Node/FFmpeg local.

## Exportação reprodutível por linha de comando

```sh
npm run export -- --width 1860 --height 962 --fps 60 --duration 9.933333333
```

Produz `output/render/ampulheta.mp4`, uma sequência PNG e `manifest.json` com a configuração efetiva. `--config ampulheta-ajustes.json` aplica ajustes salvos. A duração padrão corresponde aos **596 quadros** do original. Cada quadro é calculado por `renderAt(índice / FPS)`, sem gravação em tempo real.

Use `--out output/minha-versao` para preservar variações; renderizações no mesmo diretório sobrescrevem os quadros correspondentes. O MP4 é H.264 em `yuv420p`, CRF 16; os PNGs preservam a referência sem perdas do renderizador.

## Verificação

```sh
npm run build
npm run verify
```

`verify` testa determinismo por hash, movimento, dimensões, presença de pontos, validação da API e uma exportação real com download e inspeção do MP4. Para testar a interface com o servidor aberto na porta 5180:

```sh
node checks/ui.mjs
```

Comparação de quadros com métricas por região:

```sh
python -m pip install -r requirements.txt
python scripts/compare-frames.py reference/first-frame.png output/render/frame-000000.png --out output/comparison
```

A imagem de diferença, sobreposição e os recortes ajudam a avaliar erros na ampulheta e nas faixas sem diluí-los no fundo preto. Métricas numéricas não certificam fidelidade perceptual.

## Referência e limites

O original tem 1860 × 962, 60 FPS, 596 quadros e não possui áudio. As medidas e observações estão em `reference/reference-analysis.md` e `.json`. `public/reference/preview.mp4` é uma transcodificação H.264 do original para reprodução no navegador; o original usa MPEG-4 Part 2, sem suporte em alguns navegadores. A transcodificação pode apresentar pequenas diferenças de compressão.

Esta implementação preserva composição, grade de pontos, proporções, azul escuro e movimentos gerais. As trajetórias secundárias, a intensidade de cada ponto e os fragmentos de reflexão são aproximações procedurais, não uma reconstrução pixel a pixel. Não replica os artefatos de compressão do original. Repetir reinicia a sequência; o vídeo de referência não tem um loop perfeitamente contínuo. Durações maiores que 9,93 s prolongam as faixas e mantêm o nível final da areia.

Para refinar a geometria, edite `src/shaders/hourglass.glsl` e `ribbons.glsl`; para alterar parâmetros padrão, `src/config.ts`. O espaço de trabalho da cena usa as coordenadas do original, mantendo a proporção com barras quando necessário. Cores dos pontos são calculadas explicitamente em sRGB, sem iluminação, bloom ou tone mapping cinematográfico.

## Estrutura

```text
src/config.ts                  Parâmetros, limites e metadados
src/scene.ts                   Renderizador e API determinística
src/geometry/dot-grid.ts       Grade estável de pontos
src/shaders/                   Máscaras, faixas e aparência dos pontos
src/main.ts, style.css         Estúdio e controles
scripts/                      Inspeção, captura, MP4, API e comparação
reference/                    Evidências e análise do original
public/reference/             Arquivos usados apenas na comparação
output/                       Quadros, vídeos e relatórios gerados
```

Detalhes dos comandos e da API em [scripts/README.md](scripts/README.md).

## Problemas de execução

- **Tela de erro WebGL2:** habilite aceleração de hardware ou use um navegador compatível.
- **FFmpeg ausente:** instale as dependências permitindo o script de `ffmpeg-static`, ou configure `FFMPEG_PATH`; para ffprobe, `FFPROBE_PATH`.
- **Navegador de captura ausente:** instale Edge/Chrome ou execute `npx playwright install chromium`.
- **Referência não carrega:** confirme a presença de `public/reference/preview.mp4`. Para recriá-la a partir do original, use `node scripts/prepare-reference.mjs --input "caminho/do/original.mp4"`.
- **Exportação após reiniciar o servidor:** o histórico em memória é reiniciado; os MP4 já gerados continuam em `output/jobs/`.

## Perfil refinado
O guia anotado em reference/shape-guide.png foi traduzido para um perfil por trechos cúbicos Hermite com tangentes contínuas. As bordas superior e inferior são curvas, os reflexos acompanham as paredes e a areia é recortada pelo mesmo perfil. A anotação branca não é desenhada. O halo discreto dos pontos da ampulheta é independente das faixas para preservar o contraste delas.

