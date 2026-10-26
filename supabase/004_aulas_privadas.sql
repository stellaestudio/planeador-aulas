-- Aulas privadas (aplicado a 24/10/2026).
-- Uma aula privada é uma "turma" marcada como privada, com pacote de aulas opcional.
alter table public.turmas add column privada boolean not null default false;
alter table public.turmas add column pacote integer; -- n.º de aulas contratadas (null = sem pacote)
-- Trabalho para casa / notas para o aluno em cada aula.
alter table public.aulas add column para_casa text not null default '';
