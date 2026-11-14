-- esquema inicial de gymbo
-- crea las nueve tablas del modelo de datos y la vista personal_records.
-- tablas: exercises, routines, routine_exercises, workouts, workout_sets,
--         activity_types, activities, body_weights, daily_steps.
-- consideraciones:
--   - cada fila tiene user_id (default auth.uid()) y rls con una política por operación.
--   - borrar una sesión borra sus series; borrar un ejercicio o tipo de actividad con historial está bloqueado.
--   - la vista usa security_invoker para que respete el rls de workout_sets.

-- catálogo de ejercicios
create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  name text not null check (length(trim(name)) > 0),
  muscle_group text,
  equipment text check (equipment in ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other')),
  weight_step numeric(5,2) check (weight_step > 0),
  video_url text,
  video_start_s integer check (video_start_s >= 0),
  notes text,
  archived boolean not null default false,
  -- destino de las fks compuestas (id, user_id): impiden referenciar filas de otro usuario
  unique (id, user_id)
);
-- nombre único por usuario sin distinguir mayúsculas; el índice también cubre los filtros por user_id
create unique index exercises_user_name_key on exercises (user_id, lower(name));

-- rutinas del plan; position = orden del ciclo
create table routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  name text not null check (length(trim(name)) > 0),
  position integer not null default 0,
  active boolean not null default true,
  notes text,
  unique (id, user_id)
);
create index routines_user_id_idx on routines (user_id);

-- receta de cada rutina
create table routine_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  routine_id uuid not null,
  exercise_id uuid not null,
  position integer not null default 0,
  target_sets integer check (target_sets > 0),
  rep_min integer check (rep_min > 0),
  rep_max integer check (rep_max > 0),
  default_set_type text not null default 'normal'
    check (default_set_type in ('normal', 'warmup', 'drop', 'rest_pause', 'failure')),
  rest_s integer check (rest_s >= 0),
  superset_group integer,
  check (rep_min <= rep_max),
  foreign key (routine_id, user_id) references routines (id, user_id) on delete cascade,
  foreign key (exercise_id, user_id) references exercises (id, user_id) on delete restrict
);
create index routine_exercises_user_id_idx on routine_exercises (user_id);
create index routine_exercises_routine_id_idx on routine_exercises (routine_id);
create index routine_exercises_exercise_id_idx on routine_exercises (exercise_id);

-- sesiones reales; sin rutina = sesión libre
create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null,
  routine_id uuid,
  notes text,
  unique (id, user_id),
  -- set null (routine_id): al borrar la rutina solo se vacía routine_id, no user_id
  foreign key (routine_id, user_id) references routines (id, user_id) on delete set null (routine_id)
);
create index workouts_user_date_idx on workouts (user_id, date);
create index workouts_routine_id_idx on workouts (routine_id);

-- una fila por serie; reps o seconds, nunca ambos vacíos
create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  workout_id uuid not null,
  exercise_id uuid not null,
  position integer not null default 0,
  set_number integer not null check (set_number > 0),
  reps integer check (reps >= 0),
  seconds integer check (seconds >= 0),
  weight_kg numeric(6,2) check (weight_kg >= 0),
  set_type text not null default 'normal'
    check (set_type in ('normal', 'warmup', 'drop', 'rest_pause', 'failure')),
  tempo text check (tempo in ('slow', 'explosive', 'pause')),
  superset_group integer,
  notes text,
  check (reps is not null or seconds is not null),
  foreign key (workout_id, user_id) references workouts (id, user_id) on delete cascade,
  foreign key (exercise_id, user_id) references exercises (id, user_id) on delete restrict
);
create index workout_sets_user_id_idx on workout_sets (user_id);
create index workout_sets_workout_id_idx on workout_sets (workout_id);
create index workout_sets_exercise_id_idx on workout_sets (exercise_id);

-- tipos de actividad editables; fields = qué campos pide al cargar
create table activity_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  name text not null check (length(trim(name)) > 0),
  fields text[] not null default '{}'
    check (fields <@ array['minutes', 'km', 'rounds', 'work_s', 'rest_s', 'jumps', 'best_streak']),
  archived boolean not null default false,
  unique (id, user_id)
);
create unique index activity_types_user_name_key on activity_types (user_id, lower(name));

-- actividades; todos los campos opcionales
create table activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null,
  activity_type_id uuid not null,
  minutes numeric(6,1) check (minutes >= 0),
  km numeric(6,2) check (km >= 0),
  rounds integer check (rounds >= 0),
  work_s integer check (work_s >= 0),
  rest_s integer check (rest_s >= 0),
  jumps integer check (jumps >= 0),
  best_streak integer check (best_streak >= 0),
  notes text,
  foreign key (activity_type_id, user_id) references activity_types (id, user_id) on delete restrict
);
create index activities_user_date_idx on activities (user_id, date);
create index activities_activity_type_id_idx on activities (activity_type_id);

-- pesajes
create table body_weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null,
  kg numeric(5,2) not null check (kg > 0)
);
create index body_weights_user_date_idx on body_weights (user_id, date);

-- pasos, uno por usuario y fecha (el unique también sirve de índice por user_id)
create table daily_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null,
  steps integer not null check (steps >= 0),
  unique (user_id, date)
);

-- rls en todas las tablas
alter table exercises enable row level security;
alter table routines enable row level security;
alter table routine_exercises enable row level security;
alter table workouts enable row level security;
alter table workout_sets enable row level security;
alter table activity_types enable row level security;
alter table activities enable row level security;
alter table body_weights enable row level security;
alter table daily_steps enable row level security;

-- políticas de exercises
create policy "usuarios leen sus ejercicios" on exercises
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "usuarios crean sus ejercicios" on exercises
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "usuarios editan sus ejercicios" on exercises
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "usuarios borran sus ejercicios" on exercises
  for delete to authenticated using ((select auth.uid()) = user_id);

-- políticas de routines
create policy "usuarios leen sus rutinas" on routines
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "usuarios crean sus rutinas" on routines
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "usuarios editan sus rutinas" on routines
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "usuarios borran sus rutinas" on routines
  for delete to authenticated using ((select auth.uid()) = user_id);

-- políticas de routine_exercises
create policy "usuarios leen sus recetas" on routine_exercises
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "usuarios crean sus recetas" on routine_exercises
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "usuarios editan sus recetas" on routine_exercises
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "usuarios borran sus recetas" on routine_exercises
  for delete to authenticated using ((select auth.uid()) = user_id);

-- políticas de workouts
create policy "usuarios leen sus sesiones" on workouts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "usuarios crean sus sesiones" on workouts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "usuarios editan sus sesiones" on workouts
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "usuarios borran sus sesiones" on workouts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- políticas de workout_sets
create policy "usuarios leen sus series" on workout_sets
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "usuarios crean sus series" on workout_sets
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "usuarios editan sus series" on workout_sets
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "usuarios borran sus series" on workout_sets
  for delete to authenticated using ((select auth.uid()) = user_id);

-- políticas de activity_types
create policy "usuarios leen sus tipos de actividad" on activity_types
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "usuarios crean sus tipos de actividad" on activity_types
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "usuarios editan sus tipos de actividad" on activity_types
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "usuarios borran sus tipos de actividad" on activity_types
  for delete to authenticated using ((select auth.uid()) = user_id);

-- políticas de activities
create policy "usuarios leen sus actividades" on activities
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "usuarios crean sus actividades" on activities
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "usuarios editan sus actividades" on activities
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "usuarios borran sus actividades" on activities
  for delete to authenticated using ((select auth.uid()) = user_id);

-- políticas de body_weights
create policy "usuarios leen sus pesajes" on body_weights
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "usuarios crean sus pesajes" on body_weights
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "usuarios editan sus pesajes" on body_weights
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "usuarios borran sus pesajes" on body_weights
  for delete to authenticated using ((select auth.uid()) = user_id);

-- políticas de daily_steps
create policy "usuarios leen sus pasos" on daily_steps
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "usuarios crean sus pasos" on daily_steps
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "usuarios editan sus pasos" on daily_steps
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "usuarios borran sus pasos" on daily_steps
  for delete to authenticated using ((select auth.uid()) = user_id);

-- récords por ejercicio, sin calentamiento. 1rm estimado con epley, solo series de 1 a 12 reps.
-- security_invoker: la vista corre con los permisos de quien consulta, así aplica el rls de workout_sets.
create view personal_records with (security_invoker = true) as
select
  user_id,
  exercise_id,
  max(weight_kg) as best_weight_kg,
  max(weight_kg * (1 + reps / 30.0)) filter (where reps between 1 and 12) as best_e1rm_kg,
  max(reps) as most_reps
from workout_sets
where set_type <> 'warmup'
group by user_id, exercise_id;

-- defensa en profundidad: anon no toca ninguna tabla; truncate saltea rls, así que nadie lo tiene por la api
revoke all on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
