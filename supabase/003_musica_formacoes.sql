-- Música da coreografia e momento de cada formação na música (aplicado a 24/10/2026).
alter table public.coreografias add column musica_path text not null default '';
alter table public.coreografias add column musica_nome text not null default '';
alter table public.formacoes add column inicio numeric;            -- segundos desde o início da música
alter table public.formacoes add column transicao numeric not null default 2; -- segundos para chegar à formação

-- Ficheiros de música: privados, cada professor só acede à sua pasta (<id do utilizador>/...).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('musicas', 'musicas', false, 52428800, array['audio/*']);

create policy "musicas: ler as minhas" on storage.objects for select to authenticated
  using (bucket_id = 'musicas' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "musicas: enviar para a minha pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'musicas' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "musicas: alterar as minhas" on storage.objects for update to authenticated
  using (bucket_id = 'musicas' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "musicas: apagar as minhas" on storage.objects for delete to authenticated
  using (bucket_id = 'musicas' and (storage.foldername(name))[1] = (select auth.uid())::text);
