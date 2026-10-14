-- Profile images stay private. Only the authenticated account's photo endpoint
-- can read or write its objects; no direct client storage policies are granted.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 1048576, array['image/webp'])
on conflict (id) do nothing;
