-- =====================================================================
-- EMBUDO DE CONVERSIÓN QUIRÚRGICA — SCRIPT ÚNICO DE BASE DE DATOS
-- Versión 2: nueva lista de médicos, especialidades, tipos de paciente,
-- estados del ciclo quirúrgico, y consolidación de "Cirugías cotizadas"
-- dentro de "Oportunidades".
-- =====================================================================
-- Cómo usar este archivo:
-- 1. Entra a tu proyecto de Supabase.
-- 2. Ve a "SQL Editor" (en el menú de la izquierda).
-- 3. Crea una consulta nueva, pega TODO este archivo, y presiona "Run".
-- Este script está escrito para poder ejecutarse más de una vez sin
-- romper nada: si ya tenías la base de datos creada con la versión
-- anterior, este mismo archivo la actualiza (migra) a la nueva
-- estructura, incluidos los datos que ya hubieras cargado.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABLA: profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. TABLA: medicos
-- Lista fija de médicos de la clínica. Ya no tiene especialidad propia:
-- la especialidad se elige a nivel de cada oportunidad quirúrgica.
-- ---------------------------------------------------------------------
create table if not exists public.medicos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Migración: si la tabla ya existía con una columna "especialidad", se elimina.
alter table public.medicos drop column if exists especialidad;

-- Migración: nombre único, para poder agregar médicos nuevos con
-- "ON CONFLICT DO NOTHING" cuando alguien elige la opción "OTRO".
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'medicos_nombre_key'
  ) then
    alter table public.medicos add constraint medicos_nombre_key unique (nombre);
  end if;
end $$;

-- Se reemplaza la lista de médicos por la lista oficial entregada por la clínica.
delete from public.medicos where nombre not in (
  'JAVIER MERCADO GORDILLO', 'WINDSOR JORDAN TANINAKA', 'GABRIELA HERRERA ESPECHI',
  'ARIEL IBAÑEZ RODRIGUEZ', 'ESTELA ANGELICA MAMANI HUARACHI', 'MARCO SANTIAGO ALDANA CABRERA',
  'JAIRO AUGUSTO PRADA BARBOSA', 'DANILO RICHARD SERRANO SALAZAR', 'LISSETH IBLIN MOSCOSO ZELAYA',
  'MAURICIO LOPEZ MEJIA', 'ALEX CONDORI', 'SILVIA YEPEZ RODRIGUEZ', 'LIZETH CALLE VALDA',
  'PABLO MEDRANO', 'MARISOL CUELLAR LANUZA', 'DANIELA RAMOS', 'RAUL VELASQUEZ TORREZ',
  'OSVALDO ORTIZ UYUNI', 'GLENDA MONTAÑO', 'JUAN CARLOS RENGEL RETAMOSOS', 'JAVIER PACHECO CARVAJAL'
);

insert into public.medicos (nombre) values
  ('JAVIER MERCADO GORDILLO'), ('WINDSOR JORDAN TANINAKA'), ('GABRIELA HERRERA ESPECHI'),
  ('ARIEL IBAÑEZ RODRIGUEZ'), ('ESTELA ANGELICA MAMANI HUARACHI'), ('MARCO SANTIAGO ALDANA CABRERA'),
  ('JAIRO AUGUSTO PRADA BARBOSA'), ('DANILO RICHARD SERRANO SALAZAR'), ('LISSETH IBLIN MOSCOSO ZELAYA'),
  ('MAURICIO LOPEZ MEJIA'), ('ALEX CONDORI'), ('SILVIA YEPEZ RODRIGUEZ'), ('LIZETH CALLE VALDA'),
  ('PABLO MEDRANO'), ('MARISOL CUELLAR LANUZA'), ('DANIELA RAMOS'), ('RAUL VELASQUEZ TORREZ'),
  ('OSVALDO ORTIZ UYUNI'), ('GLENDA MONTAÑO'), ('JUAN CARLOS RENGEL RETAMOSOS'), ('JAVIER PACHECO CARVAJAL')
on conflict (nombre) do nothing;

-- ---------------------------------------------------------------------
-- 3. TABLA: oportunidades
-- Registro único de cada paciente: reemplaza y absorbe lo que antes
-- era la tabla separada "cotizaciones_quirurgicas".
-- ---------------------------------------------------------------------
create table if not exists public.oportunidades (
  id uuid primary key default gen_random_uuid(),
  paciente_nombre text not null,
  paciente_edad int,
  especialidad text not null,
  medico_id uuid references public.medicos(id) on delete set null,
  tipo_paciente text not null default 'Privado',
  seguro text,
  metodo_pago text not null default 'Efectivo',
  monto numeric(12, 2) not null default 0,
  estado text not null default 'Cirugía Cotizada',
  motivo_perdida text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migración: columna "procedimiento" (versión anterior) pasa a llamarse
-- "diagnostico_procedimiento", tal como pide la nueva estructura.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'oportunidades' and column_name = 'procedimiento'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'oportunidades' and column_name = 'diagnostico_procedimiento'
  ) then
    alter table public.oportunidades rename column procedimiento to diagnostico_procedimiento;
  end if;
end $$;
alter table public.oportunidades add column if not exists diagnostico_procedimiento text not null default '';

-- Migración: nuevos campos requeridos por la estructura actualizada.
alter table public.oportunidades add column if not exists codigo_cliente text;
alter table public.oportunidades add column if not exists fecha_probable_cirugia date;

-- Migración: número de cotización autonumérico (se genera solo, la
-- persona no tiene que escribirlo). Usa una secuencia propia de Postgres.
create sequence if not exists public.cotizacion_seq;
alter table public.oportunidades add column if not exists numero_cotizacion text;
alter table public.oportunidades
  alter column numero_cotizacion set default ('COT-' || lpad(nextval('public.cotizacion_seq')::text, 4, '0'));
update public.oportunidades
  set numero_cotizacion = 'COT-' || lpad(nextval('public.cotizacion_seq')::text, 4, '0')
  where numero_cotizacion is null;
alter table public.oportunidades alter column numero_cotizacion set not null;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'oportunidades_numero_cotizacion_key'
  ) then
    alter table public.oportunidades add constraint oportunidades_numero_cotizacion_key unique (numero_cotizacion);
  end if;
end $$;

-- Migración: normalizar valores anteriores de "tipo_paciente" a la nueva
-- nomenclatura, antes de aplicar la nueva regla de validación.
update public.oportunidades set tipo_paciente = 'Privado' where tipo_paciente = 'Particular';
update public.oportunidades set tipo_paciente = 'Asegurado o Convenio' where tipo_paciente = 'Asegurado';
alter table public.oportunidades drop constraint if exists oportunidades_tipo_paciente_check;
alter table public.oportunidades add constraint oportunidades_tipo_paciente_check
  check (tipo_paciente in ('Privado', 'Asegurado o Convenio', 'Institucional', 'Seguridad Social'));

-- Migración: normalizar especialidades antiguas a la nueva lista oficial,
-- antes de aplicar la nueva regla de validación.
update public.oportunidades set especialidad = 'Cirugía Plástica, Estética y Reparadora' where especialidad = 'Cirugía Plástica';
update public.oportunidades set especialidad = 'Cirugía Gastroenterológica y del Aparato Digestivo' where especialidad = 'Cirugía Bariátrica';
update public.oportunidades set especialidad = 'Traumatología y Cirugía Ortopédica' where especialidad = 'Traumatología';
update public.oportunidades set especialidad = 'Ginecología y Obstetricia' where especialidad = 'Ginecología';
update public.oportunidades set especialidad = 'Oftalmología (Cirugía Ocular)' where especialidad = 'Oftalmología';
alter table public.oportunidades drop constraint if exists oportunidades_especialidad_check;
alter table public.oportunidades add constraint oportunidades_especialidad_check
  check (especialidad in (
    'Cirugía Cardiovascular', 'Cirugía de Cabeza, Cuello y Maxilofacial', 'Cirugía de Mano',
    'Cirugía Gastroenterológica y del Aparato Digestivo', 'Cirugía General', 'Cirugía Oncología (Oncocirugía)',
    'Cirugía Pediátrica', 'Cirugía Plástica, Estética y Reparadora', 'Cirugía Torácica',
    'Cirugía Vascular y Angiología', 'Gastroenterología', 'Ginecología y Obstetricia',
    'Ginecología y Oncología', 'Mastología', 'Medicina Interna', 'Neurocirugía',
    'Oftalmología (Cirugía Ocular)', 'Otorrinolaringología (Cirugía de Oído, Nariz y Garganta)',
    'Pediatría', 'Proctología', 'Traumatología y Cirugía Ortopédica', 'Urología'
  ));

-- Migración: normalizar los estados antiguos (de 12 estados) a los 6
-- estados oficiales de la nueva estructura, antes de aplicar la nueva regla.
update public.oportunidades set estado = 'Cirugía Cotizada'
  where estado in ('Indicación quirúrgica', 'Pendiente de cotización', 'Cotizado', 'Presupuesto enviado');
update public.oportunidades set estado = 'Cotización con seguimiento'
  where estado in ('En seguimiento', 'Cirugía aceptada');
update public.oportunidades set estado = 'Cirugía Programada' where estado = 'Cirugía programada';
update public.oportunidades set estado = 'Cirugía postergada' where estado = 'Postergado';
update public.oportunidades set estado = 'Cirugía no convertida' where estado in ('No convertido', 'Perdido', 'Cancelado');
alter table public.oportunidades drop constraint if exists oportunidades_estado_check;
alter table public.oportunidades add constraint oportunidades_estado_check
  check (estado in (
    'Cirugía Cotizada', 'Cirugía Programada', 'Cotización con seguimiento',
    'Cirugía postergada', 'Cirugía realizada', 'Cirugía no convertida'
  ));

create index if not exists idx_oportunidades_estado on public.oportunidades(estado);
create index if not exists idx_oportunidades_especialidad on public.oportunidades(especialidad);

-- ---------------------------------------------------------------------
-- Se elimina la tabla "cotizaciones_quirurgicas": su información ahora
-- vive directamente en "oportunidades" (columnas numero_cotizacion,
-- codigo_cliente, diagnostico_procedimiento).
-- ---------------------------------------------------------------------
drop table if exists public.cotizaciones_quirurgicas cascade;

-- ---------------------------------------------------------------------
-- 4. TABLA: seguimientos
-- Historial de cada contacto realizado con el paciente.
-- ---------------------------------------------------------------------
create table if not exists public.seguimientos (
  id uuid primary key default gen_random_uuid(),
  oportunidad_id uuid not null references public.oportunidades(id) on delete cascade,
  fecha date not null default current_date,
  clasificacion text,
  canal text,
  responsable_id uuid references public.profiles(id),
  resultado text,
  proxima_accion text,
  fecha_proxima_accion date,
  created_at timestamptz not null default now()
);

-- Migración: columnas nuevas si la tabla ya existía en su versión anterior.
alter table public.seguimientos add column if not exists clasificacion text;
alter table public.seguimientos alter column canal drop not null;
alter table public.seguimientos alter column resultado drop not null;
alter table public.seguimientos drop column if exists observaciones;

-- Migración: normalizar canal antiguo a la nueva nomenclatura exacta.
update public.seguimientos set canal = 'Llamada Telefónica' where canal = 'Llamada telefónica';
update public.seguimientos set canal = 'Contacto presencial' where canal = 'Otro';

alter table public.seguimientos drop constraint if exists seguimientos_canal_check;
alter table public.seguimientos add constraint seguimientos_canal_check
  check (canal is null or canal in ('WhatsApp', 'Llamada Telefónica', 'Contacto presencial', 'Correo electrónico'));

alter table public.seguimientos drop constraint if exists seguimientos_clasificacion_check;
alter table public.seguimientos add constraint seguimientos_clasificacion_check
  check (clasificacion is null or clasificacion in ('Con seguimiento', 'Sin seguimiento'));

create index if not exists idx_seguimientos_oportunidad on public.seguimientos(oportunidad_id);

-- ---------------------------------------------------------------------
-- 5. FUNCIÓN AUXILIAR: is_admin()
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 6. TRIGGER: crear perfil automáticamente al registrar un usuario nuevo
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'staff'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (seguridad a nivel de fila)
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.medicos enable row level security;
alter table public.oportunidades enable row level security;
alter table public.seguimientos enable row level security;

drop policy if exists "profiles_select_propio_o_admin" on public.profiles;
create policy "profiles_select_propio_o_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_propio" on public.profiles;
create policy "profiles_update_propio"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "medicos_select_autenticado" on public.medicos;
create policy "medicos_select_autenticado"
  on public.medicos for select
  using (auth.role() = 'authenticated');

-- Cualquier persona autenticada puede agregar un médico nuevo (opción
-- "OTRO" del formulario); solo el administrador puede editarlos o
-- desactivarlos.
drop policy if exists "medicos_insert_autenticado" on public.medicos;
create policy "medicos_insert_autenticado"
  on public.medicos for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "medicos_admin_editar" on public.medicos;
create policy "medicos_admin_editar"
  on public.medicos for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "medicos_admin_eliminar" on public.medicos;
create policy "medicos_admin_eliminar"
  on public.medicos for delete
  using (public.is_admin());

drop policy if exists "oportunidades_select_autenticado" on public.oportunidades;
create policy "oportunidades_select_autenticado"
  on public.oportunidades for select
  using (auth.role() = 'authenticated');

drop policy if exists "oportunidades_insert_autenticado" on public.oportunidades;
create policy "oportunidades_insert_autenticado"
  on public.oportunidades for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "oportunidades_update_autenticado" on public.oportunidades;
create policy "oportunidades_update_autenticado"
  on public.oportunidades for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "oportunidades_delete_admin" on public.oportunidades;
create policy "oportunidades_delete_admin"
  on public.oportunidades for delete
  using (public.is_admin());

drop policy if exists "seguimientos_select_autenticado" on public.seguimientos;
create policy "seguimientos_select_autenticado"
  on public.seguimientos for select
  using (auth.role() = 'authenticated');

drop policy if exists "seguimientos_insert_autenticado" on public.seguimientos;
create policy "seguimientos_insert_autenticado"
  on public.seguimientos for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "seguimientos_update_autenticado" on public.seguimientos;
create policy "seguimientos_update_autenticado"
  on public.seguimientos for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "seguimientos_delete_admin" on public.seguimientos;
create policy "seguimientos_delete_admin"
  on public.seguimientos for delete
  using (public.is_admin());

-- =====================================================================
-- LISTO. La base de datos ya está creada / actualizada.
--
-- ÚLTIMO PASO MANUAL (solo la primera vez que se crea el proyecto):
-- Después de crear tu primer usuario administrador desde
-- "Authentication" → "Add user" en el panel de Supabase, ese usuario
-- se crea con rol "staff" por defecto. Conviértelo en administrador
-- ejecutando esta línea (cambia el correo por el que usaste):
--
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'tu_correo@ejemplo.com');
-- =====================================================================
