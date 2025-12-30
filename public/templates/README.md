# Templates de Banners e Logos

Biblioteca de imagens pré-cadastradas para as casas escolherem.

## Estrutura de Arquivos

```
public/templates/
├── banners/
│   ├── floresta.jpg
│   ├── cosmos.jpg
│   ├── mandala.jpg
│   ├── agua.jpg
│   ├── fogo.jpg
│   ├── natureza.jpg
│   ├── por-do-sol.jpg
│   └── minimalista.jpg
└── logos/
    ├── lotus.png
    ├── arvore.png
    ├── lua.png
    └── geometria.png
```

## Especificações

### Banners (10 templates)
- **Formato**: JPG ou WebP (preferível WebP para menor tamanho)
- **Dimensões**: 1920x400px (proporção 4.8:1)
- **Peso máximo**: 150KB por imagem
- **Nomes dos arquivos**: usar exatamente os nomes listados acima

### Logos (5 templates)
- **Formato**: PNG com fundo transparente
- **Dimensões**: 200x200px (quadrado)
- **Peso máximo**: 50KB por imagem
- **Nomes dos arquivos**: usar exatamente os nomes listados acima

## Como Otimizar as Imagens

### Usando Squoosh (online)
1. Acesse https://squoosh.app
2. Arraste a imagem
3. Escolha WebP ou JPG com qualidade 80%
4. Redimensione para o tamanho correto
5. Baixe e renomeie

### Usando TinyPNG (online)
1. Acesse https://tinypng.com
2. Arraste as imagens
3. Baixe otimizadas

## Templates Configurados

Os templates estão definidos em `src/constants/templates.ts`.

### Banners Disponíveis:
1. **Padrão Claro** - `/hero-light.png` (já existe)
2. **Padrão Escuro** - `/hero-dark.png` (já existe)
3. **Floresta Sagrada** - `/templates/banners/floresta.jpg`
4. **Cosmos** - `/templates/banners/cosmos.jpg`
5. **Mandala** - `/templates/banners/mandala.jpg`
6. **Águas Sagradas** - `/templates/banners/agua.jpg`
7. **Fogo Sagrado** - `/templates/banners/fogo.jpg`
8. **Natureza** - `/templates/banners/natureza.jpg`
9. **Pôr do Sol** - `/templates/banners/por-do-sol.jpg`
10. **Minimalista** - `/templates/banners/minimalista.jpg`

### Logos Disponíveis:
1. **Logo Ahoo** - `/logo-topbar.png` (já existe)
2. **Flor de Lótus** - `/templates/logos/lotus.png`
3. **Árvore da Vida** - `/templates/logos/arvore.png`
4. **Lua Crescente** - `/templates/logos/lua.png`
5. **Geometria Sagrada** - `/templates/logos/geometria.png`

## Adicionando Novos Templates

1. Adicione a imagem na pasta correta (`banners/` ou `logos/`)
2. Edite `src/constants/templates.ts` e adicione o novo template ao array
3. Faça commit e deploy
