-- Auction schedule tunables — Aug 16, 2026 timing model revision.
--
-- Data-only migration: adds new pricing_engine_settings rows and updates
-- one existing value. Does NOT touch place_bid(), close_auction_lot(),
-- close_due_auction_lots(), or any other bidding/escrow/close-logic
-- function — those already read auction_auto_extend_minutes live from
-- this table (see 0015_bidding_engine.sql), so changing its value here is
-- a pure config change, not an engine change.
--
-- New model: lots drop and bidding opens simultaneously at the Monday-noon
-- drop, all week, no pre-bid state. Staggered closes begin Friday noon —
-- "high noon" is when closing STARTS, not a shared end time. Auto-extend
-- window/amount changes from 5/5 to 2/2 minutes. See CLAUDE.md, Auction
-- Format.

insert into pricing_engine_settings (key, value, description) values
  ('auction_drop_weekday', '"monday"',
   'Weekday lots drop and bidding opens, simultaneously, for every lot. No pre-bid/browse-only state.'),
  ('auction_drop_hour_et', '12',
   'Hour (24h, America/New_York) of the weekly drop — "high noon". This is the one fixed, shared clock that opens bidding.'),
  ('auction_close_weekday', '"friday"',
   'Weekday staggered lot closes begin — "high noon", the branded showdown moment.'),
  ('auction_close_hour_et', '12',
   'Hour (24h, America/New_York) staggered closes begin. Not a shared end time — the auction ends whenever the last lot closes.'),
  ('auction_stagger_minutes', '5',
   'Minutes between each lot''s scheduled close, applied when auction_start/auction_end are assigned at admin approval.');

update pricing_engine_settings
set value = '2',
    description = 'Any bid in the final N minutes extends the lot by N minutes. Changed from 5 to 2 on Aug 16, 2026 — high-noon showdown moves faster.'
where key = 'auction_auto_extend_minutes';
