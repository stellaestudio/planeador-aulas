# Planeador de aulas de dança

App para planear aulas de dança e ir juntando, ao longo do ano, uma biblioteca de movimentos e dinâmicas.
Funciona no telemóvel e no computador e pode ser instalada no ecrã inicial.

## O que já faz
- **Turmas**: duração padrão, aquecimento/alongamento padrão, objetivos, alunas.
- **Biblioteca**: movimentos (por categoria) e dinâmicas, com variações e objetivos; objetivos podem ser arquivados.
- **Aulas**: planear por blocos (aquecimento, movimentos, dinâmicas, coreografia, alongamento), com tempos opcionais e aviso se passa/falta tempo.
  - O que ficou por fazer na última aula passa sozinho para a seguinte.
  - Cada item mostra há quantas aulas está por fazer; a partir de 3 aulas fica destacado (e aparece um aviso na lista da turma).
  - Contagem decrescente para o próximo espetáculo na lista e dentro do plano da aula.
  - Durante/depois da aula: marcar feito/não feito (grava a cada toque), juntar extras, resumo para WhatsApp (copiar ou abrir no WhatsApp).
- **Espetáculos** com turmas participantes.
- **Formações 2D**: arrastar bailarinos, trajetórias, grelha, copiar formação, exportar PNG, imprimir/PDF.
- **Cópias de segurança** (ícone da disquete): descarregar e importar um ficheiro `.json`.

Os dados ficam guardados **só no browser onde se usa a app** (por enquanto). Por isso convém descarregar uma cópia de vez em quando.

## Como está organizado o código
- `src/tipos.ts`: o modelo de dados.
- `src/regras.ts`: as regras (o que passa para a aula seguinte, contagens, tempos, resumo).
- `src/dados/`: onde os dados são lidos e guardados. Para passar para o Supabase troca-se só esta pasta.
- `src/areas/<área>/`: um ecrã por área (turmas, biblioteca, aulas, espetáculos, formações, cópias).
- `src/ui.tsx`: botões, cartões e campos reutilizados.

## Correr no computador
```
npm install
npm run dev      # abre em http://localhost:5173
npm run build    # verifica os tipos e gera a versão final em dist/
```

## Publicar na Vercel
Importar este repositório na Vercel; ela deteta o Vite sozinha (build `npm run build`, pasta `dist`).
Nota: o plano Hobby da Vercel é só para uso pessoal; para vender a app é preciso o plano Pro.

## Próximos passos
1. Supabase (Postgres + login por link mágico), tabelas com `owner_id` e Row Level Security, para cada professor ter os seus dados.
2. Passar para o Supabase os dados já registados no browser (o formato já é lido por `src/dados/normalizar.ts`).
3. Aulas recorrentes e vista de calendário.
4. Depois: sugestões, PDF a sério, melhorias das formações (saídas com trajetória, zoom, seleção múltipla, animação).
