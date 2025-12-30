# Templates de Banners e Logos

Esta pasta contém os templates pré-cadastrados para as casas.

## Estrutura

```
templates/
├── banners/
│   ├── floresta-light.jpg
│   ├── floresta-dark.jpg
│   ├── cosmos-light.jpg
│   ├── cosmos-dark.jpg
│   ├── mandala-light.jpg
│   ├── mandala-dark.jpg
│   ├── agua-light.jpg
│   ├── agua-dark.jpg
│   ├── fogo-light.jpg
│   ├── fogo-dark.jpg
│   ├── minimal-light.jpg
│   ├── minimal-dark.jpg
│   ├── sunset-light.jpg
│   └── sunset-dark.jpg
└── logos/
    ├── lotus.png
    ├── arvore.png
    ├── olho.png
    ├── serpente.png
    ├── lua.png
    ├── sol.png
    └── geometria.png
```

## Especificações

### Banners
- Dimensões recomendadas: 1920x400px
- Formato: JPG ou PNG
- Versão light: cores mais claras, bom contraste com texto escuro
- Versão dark: cores mais escuras, bom contraste com texto claro

### Logos
- Dimensões recomendadas: 200x200px
- Formato: PNG com fundo transparente
- Estilo: minimalista, monocromático ou com poucas cores

## Como adicionar novos templates

1. Adicione as imagens nas pastas correspondentes
2. Atualize o arquivo `src/constants/templates.ts` com os novos templates
3. Faça commit e deploy
