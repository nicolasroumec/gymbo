-- grupos musculares editables
-- crea muscle_groups (lista propia de cada usuario) y cambia exercises.muscle_group (texto)
-- por muscle_group_id (referencia), para que las métricas por grupo no dependan de cómo se escribe.
-- tablas: muscle_groups (nueva), exercises (cambia una columna).
-- consideraciones:
--   - block agrupa en empuje / tirón / piernas / core / otro para el balance de entrenamiento.
--   - un grupo con ejercicios no se puede borrar (on delete restrict): se archiva.
--   - fk compuesta (id, user_id), como en el esquema inicial, para no referenciar grupos de otro usuario.

-- grupos musculares
create table muscle_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  name text not null check (length(trim(name)) > 0),
  block text not null default 'other' check (block in ('push', 'pull', 'legs', 'core', 'other')),
  archived boolean not null default false,
  unique (id, user_id)
);
-- nombre único por usuario sin distinguir mayúsculas; también cubre los filtros por user_id
create unique index muscle_groups_user_name_key on muscle_groups (user_id, lower(name));

alter table muscle_groups enable row level security;

create policy "usuarios leen sus grupos musculares" on muscle_groups
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "usuarios crean sus grupos musculares" on muscle_groups
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "usuarios editan sus grupos musculares" on muscle_groups
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "usuarios borran sus grupos musculares" on muscle_groups
  for delete to authenticated using ((select auth.uid()) = user_id);

-- igual que en el esquema inicial: anon sin acceso, nadie trunca por la api
revoke all on muscle_groups from anon;
revoke truncate, references, trigger on muscle_groups from authenticated;

-- exercises: el grupo pasa de texto libre a referencia.
-- drop column: se pierde exercises.muscle_group; la tabla está vacía (catálogo todavía sin pantalla), no hay datos.
-- guarda: si hubiera filas, aborta en vez de borrar la columna.
do $$
begin
  if exists (select 1 from exercises) then
    raise exception 'exercises tiene filas: migrar muscle_group a muscle_group_id antes de borrar la columna';
  end if;
end $$;
alter table exercises drop column muscle_group;
alter table exercises add column muscle_group_id uuid not null;
alter table exercises add foreign key (muscle_group_id, user_id)
  references muscle_groups (id, user_id) on delete restrict;
create index exercises_muscle_group_id_idx on exercises (muscle_group_id);
