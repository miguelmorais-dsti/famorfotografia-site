# Famorfotografia Site

Landing page com galeria de fotos e formularios reais de inquiry para `famorfotografia`.

## Executar localmente (com formularios reais)

No terminal, dentro desta pasta:

```bash
node server.js
```

Depois abre:

`http://localhost:8080`

As submissões ficam guardadas em:

`data/inquiries.ndjson`

Se quiseres apenas preview estatico (sem gravar formularios), podes usar:

```bash
python3 -m http.server 8080
```

## Atualizar fotos (scrape)

Para voltar a extrair fotos publicas do Instagram e reconstruir a galeria local:

```bash
./scripts/fetch_instagram_photos.sh 120 12 1
```

Parametros:

- `120`: total maximo de fotos desejadas
- `12`: maximo de fotos por post (aproveita carrosseis)
- `1`: numero maximo de paginas/cursors a tentar (janela publica atual)

## Estrutura

- `index.html`: estrutura da pagina
- `styles.css`: estilo e responsividade
- `gallery-data.js`: lista de imagens locais usadas na galeria
- `main.js`: render da galeria + lightbox
- `server.js`: servidor HTTP + endpoint `POST /api/inquiry`
- `packs/`: paginas dedicadas de venda por pacote
- `scripts/fetch_instagram_photos.sh`: scraper de fotos publicas do Instagram
- `assets/photos/`: imagens descarregadas e `manifest.json`
- `data/inquiries.ndjson`: leads recebidos pelos formularios

## Fontes usadas

- Perfil Casamentos.pt: `https://www.casamentos.pt/fotografo-casamento/famor-fotografia--e118616`
- Instagram: `https://www.instagram.com/famorfotografia/`
- Facebook: `https://www.facebook.com/famorfotografia`
