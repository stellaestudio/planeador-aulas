# Planeador de aulas de dança

App para planear aulas de dança e ir juntando, ao longo do ano, uma biblioteca de movimentos e dinâmicas.
Funciona no telemóvel e no computador e pode ser instalada no ecrã inicial.

## O que já faz
- **Turmas**: modalidade, duração padrão, aquecimento/alongamento padrão, objetivos, alunas.
- **Aulas privadas**: "turma" marcada como privada (aluno/a ou par), com pacote de aulas opcional e contador ("3 de 10 aulas dadas", aviso quando está a acabar). Planeiam-se e dão-se como as turmas; o resumo para WhatsApp indica "aula 3 de 10".
- **Modalidades** (`src/modalidades.ts`): dança oriental, ballet, contemporâneo, hip hop e acrodance têm biblioteca típica; ao escolher a modalidade na turma os itens em falta entram na biblioteca. Também se pode definir uma modalidade própria e escrever logo os movimentos (um por linha ou separados por vírgulas).
- **Biblioteca**: movimentos (por categoria) e dinâmicas, com variações, objetivos e modalidade; filtro por modalidade, "Vários" para adicionar muitos de uma vez e bibliotecas típicas. Ao planear, aparecem os itens da modalidade da turma e os gerais.
- **Aulas**: planear por blocos (aquecimento, movimentos, dinâmicas, coreografia, alongamento), com tempos opcionais e aviso se passa/falta tempo.
  - O que ficou por fazer na última aula passa sozinho para a seguinte.
  - Cada item mostra há quantas aulas está por fazer; a partir de 3 aulas fica destacado (e aparece um aviso na lista da turma).
  - Contagem decrescente para o próximo espetáculo na lista e dentro do plano da aula.
  - Durante/depois da aula: marcar feito/não feito (grava a cada toque), juntar extras, "Para treinar em casa" e resumo para WhatsApp (copiar ou abrir no WhatsApp).
- **Espetáculos** com turmas participantes.
- **Formações 2D**: arrastar bailarinos, trajetórias, grelha, copiar formação, exportar PNG, imprimir/PDF.
- **Música e animação**: cada coreografia pode ter a sua música (guardada no Supabase Storage, pasta privada de cada professor); cada formação tem o momento em que muda e quanto tempo demora a transição (botão "Agora" com a música a tocar). "Ver animação" mostra os bailarinos a deslizar entre formações com a música e grava um vídeo vertical (720×1280) para descarregar ou partilhar.
- **Conta e cópias de segurança** (ícone da disquete): sair da conta, descarregar e importar um ficheiro `.json`.

Cada professor entra com o seu email (recebe um código, sem password) e os dados ficam guardados no Supabase, na sua conta: aparecem em qualquer aparelho onde entre e ninguém mais os vê. Ver `supabase/README.md` para a configuração.

## Como está organizado o código
- `src/tipos.ts`: o modelo de dados.
- `src/regras.ts`: as regras (o que passa para a aula seguinte, contagens, tempos, resumo).
- `src/dados/`: leitura e gravação no Supabase. `linhas.ts` converte entre o formato dos ecrãs e as tabelas; `armazenamento.ts` compara com o que já está gravado e só envia o que mudou.
- `supabase/`: as tabelas (SQL) e o texto do email com o código.
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
1. Aulas recorrentes e vista de calendário.
2. Ler os dados sem rede (hoje é preciso internet para abrir e gravar).
3. Depois: sugestões, PDF a sério, melhorias das formações (zoom, seleção múltipla).
