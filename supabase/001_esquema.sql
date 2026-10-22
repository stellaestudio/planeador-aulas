-- Planeador de aulas: tabelas.
-- Cada linha pertence a um professor (owner_id = utilizador do Supabase Auth).
-- O Row Level Security garante que cada professor só vê e altera as suas linhas.
-- As ligações entre tabelas incluem o owner_id, para nunca se ligar a dados de outra pessoa.

create table public.objetivos (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  arquivado boolean not null default false,
  criado_em timestamptz not null default clock_timestamp(),
  unique (id, owner_id)
);

create table public.biblioteca_itens (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  tipo text not null check (tipo in ('movimento', 'dinamica')),
  nome text not null,
  descricao text not null default '',
  categoria text check (categoria in ('aquecimento', 'tecnica', 'coreografia', 'alongamento')),
  parent_id uuid, -- variação de outro item
  criado_em timestamptz not null default clock_timestamp(),
  unique (id, owner_id),
  foreign key (parent_id, owner_id) references public.biblioteca_itens (id, owner_id) on delete cascade
);

create table public.item_objetivos (
  item_id uuid not null,
  objetivo_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  primary key (item_id, objetivo_id),
  foreign key (item_id, owner_id) references public.biblioteca_itens (id, owner_id) on delete cascade,
  foreign key (objetivo_id, owner_id) references public.objetivos (id, owner_id) on delete cascade
);

create table public.turmas (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  dia_hora text not null default '',
  duracao_padrao integer not null default 60,
  aquecimento_padrao_id uuid,
  alongamento_padrao_id uuid,
  bailarinos text[] not null default '{}',
  criado_em timestamptz not null default clock_timestamp(),
  unique (id, owner_id),
  foreign key (aquecimento_padrao_id, owner_id) references public.biblioteca_itens (id, owner_id) on delete set null (aquecimento_padrao_id),
  foreign key (alongamento_padrao_id, owner_id) references public.biblioteca_itens (id, owner_id) on delete set null (alongamento_padrao_id)
);

create table public.turma_objetivos (
  turma_id uuid not null,
  objetivo_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  primary key (turma_id, objetivo_id),
  foreign key (turma_id, owner_id) references public.turmas (id, owner_id) on delete cascade,
  foreign key (objetivo_id, owner_id) references public.objetivos (id, owner_id) on delete cascade
);

create table public.espetaculos (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  data date not null,
  criado_em timestamptz not null default clock_timestamp(),
  unique (id, owner_id)
);

create table public.espetaculo_turmas (
  espetaculo_id uuid not null,
  turma_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  primary key (espetaculo_id, turma_id),
  foreign key (espetaculo_id, owner_id) references public.espetaculos (id, owner_id) on delete cascade,
  foreign key (turma_id, owner_id) references public.turmas (id, owner_id) on delete cascade
);

create table public.coreografias (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  turma_id uuid not null,
  nome text not null,
  criado_em timestamptz not null default clock_timestamp(),
  unique (id, owner_id),
  foreign key (turma_id, owner_id) references public.turmas (id, owner_id) on delete cascade
);

create table public.bailarinos (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  coreografia_id uuid not null,
  nome text not null,
  cor text not null,
  ordem integer not null default 0,
  unique (id, owner_id),
  foreign key (coreografia_id, owner_id) references public.coreografias (id, owner_id) on delete cascade
);

create table public.formacoes (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  coreografia_id uuid not null,
  nome text not null,
  notas text not null default '',
  ordem integer not null default 0,
  unique (id, owner_id),
  foreign key (coreografia_id, owner_id) references public.coreografias (id, owner_id) on delete cascade
);

create table public.formacao_posicoes (
  formacao_id uuid not null,
  bailarino_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  x double precision not null, -- 0-100 (% da largura do palco)
  y double precision not null, -- 0-100 (% da profundidade)
  primary key (formacao_id, bailarino_id),
  foreign key (formacao_id, owner_id) references public.formacoes (id, owner_id) on delete cascade,
  foreign key (bailarino_id, owner_id) references public.bailarinos (id, owner_id) on delete cascade
);

create table public.aulas (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  turma_id uuid not null,
  data date not null,
  objetivo_dia text not null default '',
  duracao integer not null default 60,
  estado text not null default 'planeada' check (estado in ('planeada', 'dada')),
  aquecimento_id uuid,
  aquecimento_tempo numeric,
  alongamento_id uuid,
  alongamento_tempo numeric,
  coreografia_id uuid,
  coreografia_tempo numeric,
  criado_em timestamptz not null default clock_timestamp(),
  unique (id, owner_id),
  foreign key (turma_id, owner_id) references public.turmas (id, owner_id) on delete cascade,
  foreign key (aquecimento_id, owner_id) references public.biblioteca_itens (id, owner_id) on delete set null (aquecimento_id),
  foreign key (alongamento_id, owner_id) references public.biblioteca_itens (id, owner_id) on delete set null (alongamento_id),
  foreign key (coreografia_id, owner_id) references public.coreografias (id, owner_id) on delete set null (coreografia_id)
);

-- Movimentos e dinâmicas de cada aula.
create table public.aula_itens (
  aula_id uuid not null,
  bloco text not null check (bloco in ('movimentos', 'dinamicas')),
  item_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  ordem integer not null default 0,
  feito boolean, -- null = ainda por marcar
  tempo numeric,
  extra boolean not null default false,
  primary key (aula_id, bloco, item_id),
  foreign key (aula_id, owner_id) references public.aulas (id, owner_id) on delete cascade,
  foreign key (item_id, owner_id) references public.biblioteca_itens (id, owner_id) on delete cascade
);

-- Índices para as ligações (o Postgres não os cria sozinho).
create index on public.objetivos (owner_id);
create index on public.biblioteca_itens (owner_id);
create index on public.biblioteca_itens (parent_id, owner_id);
create index on public.item_objetivos (owner_id);
create index on public.item_objetivos (item_id, owner_id);
create index on public.item_objetivos (objetivo_id, owner_id);
create index on public.turmas (owner_id);
create index on public.turmas (aquecimento_padrao_id, owner_id);
create index on public.turmas (alongamento_padrao_id, owner_id);
create index on public.turma_objetivos (owner_id);
create index on public.turma_objetivos (turma_id, owner_id);
create index on public.turma_objetivos (objetivo_id, owner_id);
create index on public.espetaculos (owner_id);
create index on public.espetaculo_turmas (owner_id);
create index on public.espetaculo_turmas (espetaculo_id, owner_id);
create index on public.espetaculo_turmas (turma_id, owner_id);
create index on public.coreografias (owner_id);
create index on public.coreografias (turma_id, owner_id);
create index on public.bailarinos (owner_id);
create index on public.bailarinos (coreografia_id, owner_id);
create index on public.formacoes (owner_id);
create index on public.formacoes (coreografia_id, owner_id);
create index on public.formacao_posicoes (owner_id);
create index on public.formacao_posicoes (formacao_id, owner_id);
create index on public.formacao_posicoes (bailarino_id, owner_id);
create index on public.aulas (owner_id);
create index on public.aulas (turma_id, owner_id);
create index on public.aulas (aquecimento_id, owner_id);
create index on public.aulas (alongamento_id, owner_id);
create index on public.aulas (coreografia_id, owner_id);
create index on public.aula_itens (owner_id);
create index on public.aula_itens (aula_id, owner_id);
create index on public.aula_itens (item_id, owner_id);

-- Row Level Security: cada professor só vê e altera o que é seu.
do $$
declare
  t text;
begin
  foreach t in array array[
    'objetivos', 'biblioteca_itens', 'item_objetivos', 'turmas', 'turma_objetivos',
    'espetaculos', 'espetaculo_turmas', 'coreografias', 'bailarinos', 'formacoes',
    'formacao_posicoes', 'aulas', 'aula_itens'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "dono" on public.%I for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))',
      t
    );
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;
