-- place_bid() pinned search_path = public, which hides pgcrypto's
-- pgp_sym_encrypt/decrypt — Supabase installs extensions into the
-- "extensions" schema. 0015 is fixed for fresh installs; this repoints the
-- already-created function without redefining it.
alter function public.place_bid(uuid, uuid, numeric, text)
  set search_path = public, extensions;
