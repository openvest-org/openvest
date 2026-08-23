# Contribuindo com o OpenVest

Contribuições são bem-vindas. Como o OpenVest ainda está em estágio inicial, mudanças pequenas e focadas ajudam a manter a evolução do projeto simples de revisar.

## Stack

- **Nuxt 4, Vue 3 e TypeScript:** estrutura da aplicação, páginas e tipagem.
- **Nuxt UI e Tailwind CSS 4:** componentes visuais e pequenos ajustes de layout. A preferência é reutilizar componentes do Nuxt UI e manter as classes utilitárias curtas.
- **Lucide via Iconify:** ícones da interface.
- **IndexedDB:** perfil e progresso do usuário são armazenados localmente no navegador, sem depender de uma conta ou servidor.
- **JSON e Fetch API:** questões, estímulos e índices ficam em `content/`, são publicados em `/data` e carregados sob demanda. Isso mantém o conteúdo independente do framework e preparado para uma futura API.
- **Node.js:** scripts de importação e adaptação das questões do ENEM.
- **ESLint e vue-tsc:** análise estática e verificação de tipos.
- **pnpm:** gerenciamento de dependências e execução dos scripts.

## Organização do projeto

- `app/pages/`: páginas da aplicação.
- `app/composables/`: estado e regras reutilizáveis, como perfil e catálogo de questões.
- `app/types/` e `app/utils/`: tipos e utilitários compartilhados.
- `content/`: conteúdo estruturado e índices consumidos pela aplicação.
- `schemas/`: contratos dos arquivos de conteúdo.
- `scripts/`: ferramentas de importação e geração de dados.
- `public/`: arquivos estáticos, incluindo imagens utilizadas pelas questões.

## Antes de enviar uma mudança

1. Crie uma branch a partir da versão mais recente do projeto.
2. Instale as dependências com `pnpm install` e execute o ambiente com `pnpm dev`.
3. Faça uma alteração focada e, quando necessário, inclua os respectivos tipos, schemas ou dados de teste.
4. Execute `pnpm lint`, `pnpm typecheck` e `pnpm build`.
5. Abra um pull request explicando o problema, a solução e como a mudança foi verificada.

## Commits

O projeto utiliza a especificação [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/) para manter o histórico claro e facilitar futuras automações de versionamento e changelog.

```text
<tipo>[escopo opcional]: <descrição>
```

Exemplos:

```text
feat(questoes): adiciona filtro por instituição
fix(perfil): corrige o registro de respostas corretas
docs(readme): detalha o fluxo de contribuição
```

Utilize principalmente `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci` e `chore`, escolhendo o tipo que melhor representa a mudança.

Enquanto a arquitetura for local-first, evite introduzir dependências obrigatórias de backend. Mudanças no formato das questões devem preservar o carregamento sob demanda e manter os arquivos de conteúdo utilizáveis fora do Nuxt.
