-- Fynnox Puzzle Worlds — Cloud-Speicher
-- Festgelegt am 17.08.2026, siehe docs/04-datenmodell.md, Abschnitt „Cloud-Speicher".
--
-- Einmal im SQL-Editor des Supabase-Projekts ausführen.
--
-- Grundgedanke: Der `anon key` steht im ausgelieferten JavaScript und ist damit
-- öffentlich. Läge auf `saves` eine gewöhnliche Lesefreigabe, könnte jeder alle
-- Spielstände abrufen. Deshalb sind beide Tabellen für `anon` vollständig
-- gesperrt, und erreichbar sind ausschließlich vier Funktionen, die jeweils
-- genau EINE Zeile über ihren Schlüssel anfassen.

-- ---------------------------------------------------------------- Tabellen --

create table if not exists public.saves (
  cloud_id   uuid primary key,
  data       jsonb       not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.pairings (
  code       text        primary key,
  cloud_id   uuid        not null,
  expires_at timestamptz not null
);

create index if not exists pairings_expires_at_idx on public.pairings (expires_at);

-- ----------------------------------------------------------- Abriegelung ----
-- RLS an, aber KEINE Policy: Damit kommt `anon` an keine einzige Zeile heran.
-- Die Funktionen unten laufen als `security definer` und umgehen das gezielt.

alter table public.saves    enable row level security;
alter table public.pairings enable row level security;

revoke all on public.saves    from anon, authenticated;
revoke all on public.pairings from anon, authenticated;

-- ---------------------------------------------------------- Spielstände -----

create or replace function public.save_load(p_cloud_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select data from public.saves where cloud_id = p_cloud_id;
$$;

create or replace function public.save_store(p_cloud_id uuid, p_data jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.saves (cloud_id, data, updated_at)
  values (p_cloud_id, p_data, now())
  on conflict (cloud_id) do update
    set data = excluded.data,
        updated_at = now();
$$;

-- ------------------------------------------------------------- Kopplung -----
-- Sechs Zeichen aus einem Alphabet ohne 0/O und 1/I — die verwechselt man beim
-- Abtippen. Der Code lebt 15 Minuten und wird beim Einlösen sofort gelöscht.

create or replace function public.pair_create(p_cloud_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_try  int := 0;
begin
  -- Abgelaufene Codes bei der Gelegenheit wegräumen; ein eigener Zeitplan wäre
  -- für ein Familienprojekt Überbau.
  delete from public.pairings where expires_at < now();

  loop
    v_try := v_try + 1;
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;

    begin
      insert into public.pairings (code, cloud_id, expires_at)
      values (v_code, p_cloud_id, now() + interval '15 minutes');
      return v_code;
    exception when unique_violation then
      if v_try >= 10 then
        raise exception 'Kein freier Kopplungscode gefunden';
      end if;
    end;
  end loop;
end;
$$;

create or replace function public.pair_redeem(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cloud_id uuid;
begin
  delete from public.pairings
   where code = upper(trim(p_code))
     and expires_at >= now()
  returning cloud_id into v_cloud_id;

  return v_cloud_id;  -- null, wenn der Code falsch oder abgelaufen war
end;
$$;

-- --------------------------------------------------------------- Rechte -----

grant execute on function public.save_load(uuid)         to anon, authenticated;
grant execute on function public.save_store(uuid, jsonb) to anon, authenticated;
grant execute on function public.pair_create(uuid)       to anon, authenticated;
grant execute on function public.pair_redeem(text)       to anon, authenticated;
