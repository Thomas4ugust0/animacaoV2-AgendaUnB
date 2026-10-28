# Renderização e verificação

Os comandos abaixo são executados na raiz do projeto. `npm install` instala as dependências; para capturar quadros, é necessário Microsoft Edge, Google Chrome ou o Chromium instalado com `npx playwright install chromium`.

## Inspecionar o original

```sh
npm run inspect -- --input "C:/Users/Thomas/Downloads/ampulheta_minimalista.mp4"
```

Salva seis quadros de referência e `metadata.json` em `output/reference/`. O vídeo fornecido tem 1860 × 962 pixels, 60 FPS e 596 quadros. A duração útil da sequência é 596 / 60 = 9,933333… segundos; a duração de contêiner pode diferir ligeiramente.

## Exportar PNGs e MP4

```sh
npm run render -- --width 1860 --height 962 --fps 60 --duration 9.933333333
npm run encode -- --input output/render
```

Ou uma única operação:

```sh
npm run export -- --width 1860 --height 962 --fps 60 --duration 9.933333333
```

O renderizador inicia e encerra seu próprio servidor Vite, abre o navegador sem janela, calcula `tempo = início + índice / FPS` e captura PNGs diretamente da cena. A velocidade da máquina não altera o tempo da animação. O padrão de saída é `output/render/frame-000000.png`, com um manifesto contendo a configuração efetiva; o vídeo é `output/render/ampulheta.mp4`.

Opções adicionais:

- `--config arquivo.json`: preset salvo pelo estúdio, como objeto direto ou `{ "config": { ... } }`.
- `--start 4.5 --frames 1`: capturar exatamente um quadro no instante solicitado.
- `--out output/variante`: pasta de saída diferente.
- `--url http://127.0.0.1:5180`: usar um servidor existente.
- `--crf 16`: qualidade H.264 (menor = maior qualidade/arquivo).

Uma nova renderização no mesmo diretório sobrescreve os PNGs de índices correspondentes. O encoder respeita a quantidade de quadros do manifesto e não acrescenta quadros restantes de uma execução anterior. Preserve variações usando `--out`.

O MP4 usa H.264, BT.709, faixa limitada e `yuv420p` para reprodução comum. A compressão e a redução de resolução de cor podem modificar pontos muito pequenos e escuros; os PNGs são a referência sem perdas. Mantenha dimensões pares ao exportar MP4.

## Comparar referências

```sh
python scripts/compare-frames.py output/reference/reference-02.png output/render/frame-000238.png --out output/comparison
```

Requer `Pillow` e `numpy` (`python -m pip install Pillow numpy`). As imagens devem ter a mesma resolução. `--resize` permite explicitamente redimensionar o render, mas altera a interpretação das métricas.

Produz comparação lado a lado, sobreposição, diferença absoluta, diferença com brilho ampliado, recorte da ampulheta e métricas separadas para ampulheta e faixas. As métricas não são uma certificação de fidelidade: alinhamento temporal, compressão e posições dos pontos influenciam os valores.

## Verificar funcionamento

```sh
npm run verify
```

Verifica inicialização, determinismo por hash dos pixels, movimento, resolução, presença de pontos, erros no navegador e validações da API. Executa uma exportação real de três quadros em 620 × 320, 10 FPS, valida os metadados do MP4 e testa o download. Salva o relatório em `output/verification/report.json`. `--skip-video` omite apenas a codificação e o download.

## API local

O plugin `exportApiPlugin()` está disponível durante `npm run dev`:

- `POST /api/export`: JSON `{config, width, height, fps, duration}` → HTTP 202 `{id}`.
- `GET /api/export/:id`: `{id, status, progress, error?, downloadUrl?}`.
- `GET /api/export/:id/download`: arquivo MP4 quando concluído.

Há uma exportação por vez; a segunda recebe HTTP 409. A API aceita somente chamadas da mesma origem, dimensões pares entre 320 × 180 e 3840 × 2160, FPS inteiro de 1 a 60 e duração de 0,05 a 60 segundos. Cada exportação fica em `output/jobs/<id>/`. Reiniciar o servidor limpa o catálogo de jobs em memória, mas preserva seus arquivos no disco. A API não aceita caminhos ou comandos arbitrários do navegador.

O build estático mantém a cena e a captura PNG, mas exportação MP4 exige o servidor local. Binários podem ser configurados por `FFMPEG_PATH` e `FFPROBE_PATH`; `BROWSER_CHANNEL` permite selecionar um canal Playwright instalado.

Se a política do npm bloquear o script de instalação de `ffmpeg-static`, autorize esse pacote conforme a política local e execute `npm rebuild ffmpeg-static`, ou aponte `FFMPEG_PATH` para um FFmpeg já instalado. O projeto também procura o FFmpeg usado na análise local quando presente em `analysis/tools/`, sem depender dele em instalações novas.
