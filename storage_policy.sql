-- Make sure the bucket exists (idempotent-ish check not easy in pure SQL without extensions, so assuming it exists or user created it)
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;

-- Allow public access to the 'audio' bucket
create policy "Public Access Audio"
on storage.objects for all
using ( bucket_id = 'audio' )
with check ( bucket_id = 'audio' );
