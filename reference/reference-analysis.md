# Análise da referência

Fonte local: `ampulheta_minimalista.mp4`. A cópia `original.mp4` serve exclusivamente à inspeção e comparação; não deve ser usada como textura da reconstrução.

## Metadados verificados

- 1860 × 962 pixels; proporção aproximada 1,9335:1.
- 596 quadros a 60 FPS; duração exata pelo número de quadros: 9,933333 s.
- MPEG-4 Simple Profile, `mp4v`, `yuv420p`; sem áudio.
- `first-frame.png` é o quadro de índice zero. As imagens numeradas em `frames/` são amostras representativas extraídas com `fps=1`.

## Forma

A ampulheta fica em x ≈ 930, entre y ≈ 216 e 805; largura máxima ≈ 320 pixels. A forma ocupa cerca de 17,2% da largura e 61,2% da altura do vídeo. O gargalo fica aproximadamente em (930, 510). A câmera é fixa, sem rotação ou zoom observado.

A grade é regular, com pontos separados por aproximadamente 7 pixels em ambos os eixos. O núcleo tem 1–2 pixels e o halo discreto ocupa cerca de 3–4 pixels. A silhueta não é desenhada como uma linha contínua: realces aparecem em pequenas regiões nas laterais superiores, cantos, laterais inferiores e bordas. Grandes regiões do recipiente permanecem quase pretas.

A areia superior forma um cone invertido com topo horizontal. No começo, o topo fica em y ≈ 365; aos nove segundos, fica em y ≈ 398. A pilha inferior sobe levemente, mantendo uma base larga perto de y ≈ 776. Um fluxo estreito de pontos conecta o gargalo à pilha.

## Faixas e movimento

Há pelo menos três trajetórias onduladas sobrepostas, geralmente com duas a quatro fileiras de pontos por faixa. Ocupam principalmente y ≈ 480–675, cruzando toda a largura da imagem. As faixas se propagam lateralmente; fase, separação e amplitude aparente mudam. Comprimentos de onda na faixa aproximada de 900–1350 pixels são um ponto de partida, não uma medição exata.

Não há rotação da ampulheta, virada, esvaziamento completo ou reinício dentro do trecho. A animação deve preservar a silhueta e mover a areia lentamente, enquanto as faixas conduzem a maior parte do movimento.

## Cor e luminosidade

O fundo dominante é RGB (0,1,4) ou (0,2,2). Entre pixels selecionados com B > 35 e B > 1,3R, a mediana por canal é (10,24,62), o percentil 90 é (53,73,118) e o percentil 99 é (73,94,147). Os máximos por canal no quadro analisado são (94,110,172). Esses números descrevem o arquivo decodificado, incluindo a compressão.

A composição é extremamente escura. As folhas de contato foram clareadas exclusivamente para inspeção e não devem orientar a intensidade final.

## Arquivos de inspeção

- `first-frame.png`: quadro inicial sem alteração.
- `frames/frame-01.png` a `frame-10.png`: amostras sem alteração.
- `contact-sheet-bright.png`: folha de contato com brilho ×6.
- `hourglass-progress-bright.png`: recortes da ampulheta com brilho ×5.
- `first-hourglass-bright.png`: recorte ampliado do quadro inicial com brilho ×4.
- `attached-image.png`: imagem originalmente anexada pelo usuário.
- `reference-analysis.json`: medidas e metadados legíveis por código.

## Reprodução da extração

O executável instalado para esta sessão está em `analysis/tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe`. Ele foi obtido por `pip install --target analysis/tools imageio-ffmpeg`. Esse diretório de ferramentas pode ser ignorado pelo Git.

```text
ffmpeg -i reference/original.mp4 -frames:v 1 reference/first-frame.png
ffmpeg -i reference/original.mp4 -vf fps=1 reference/frames/frame-%02d.png
```
