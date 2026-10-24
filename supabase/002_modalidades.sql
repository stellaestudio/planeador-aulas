-- Modalidade da turma e dos itens da biblioteca (aplicado a 24/10/2026).
-- Valores: '' (geral), 'oriental', 'ballet', 'contemporaneo', 'hiphop', 'acrodance' ou um nome escrito pela professora.
alter table public.turmas add column modalidade text not null default '';
alter table public.biblioteca_itens add column modalidade text not null default '';
