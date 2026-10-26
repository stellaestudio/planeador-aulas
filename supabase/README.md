# Supabase — projeto "Planeador de aulas"

Projeto `xxdsxcdpounzjgutrlln` (região eu-west-1, organização Stellae Studio, plano gratuito).
Separado do projeto da app de gestão do estúdio.

## Tabelas
`001_esquema.sql` (aplicado a 22/10/2026) , `002_modalidades.sql`, `003_musica_formacoes.sql` e `004_aulas_privadas.sql` (aplicados a 24/10/2026). O 003 cria o espaço privado `musicas` no Storage (cada professor só acede à sua pasta). Todas as tabelas têm `owner_id` (o professor) e Row Level
Security: cada professor só vê e altera as suas linhas. As ligações entre tabelas incluem o `owner_id`,
por isso não é possível ligar dados de professores diferentes.

## Entrada sem password (configurar uma vez no painel do Supabase)
A app pede o email e envia um **código** (que também traz um link). O código é o mais prático
na app instalada no telemóvel, porque o link abre no browser e não na app.

1. **Authentication → URL Configuration**
   - *Site URL*: o endereço da Vercel (ex.: `https://planeador-aulas.vercel.app`).
   - *Redirect URLs*: acrescentar o mesmo endereço e `http://localhost:5173`.
2. **Authentication → Email Templates**: em **Magic Link** e em **Confirm signup**, colar o texto
   de `emails/codigo.html` (assunto: `O teu código para o Planeador de aulas`). Sem isto o email
   só traz o link, sem código.
3. **Emails para outros professores**: o envio de emails que vem com o Supabase só entrega a
   membros da organização e poucos por hora. Para outros professores, configurar um SMTP próprio
   em **Authentication → Emails → SMTP Settings** (ex.: Resend ou Brevo, ambos têm plano gratuito).
