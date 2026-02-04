-- Create conversations table
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  role text not null, -- 'doctor' or 'patient'
  text_original text not null,
  text_translated text,
  target_language text,
  audio_url text,
  session_id uuid -- helpful if we want to separate sessions later, for now optional
);

-- Enable RLS
alter table public.conversations enable row level security;

-- Policy to allow anyone to read/write for this demo
create policy "Public Access"
on public.conversations
for all
using (true)
with check (true);

-- Enable Realtime
alter publication supabase_realtime add table public.conversations;
