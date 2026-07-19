-- Stripe Connect escrow. Charge pattern: separate charges and transfers —
-- buyer is charged in full at checkout on the platform account (the escrow
-- moment), funds sit in the platform balance, and the seller transfer
-- (final_price - commission) fires when inspection closes: buyer early
-- approval or 72-hour expiry. Destination charges are unsuitable for
-- hold-and-release (funds would auto-transfer at payment time).

alter table transactions
  add column stripe_checkout_session_id text,
  add column stripe_transfer_id text,
  add column stripe_refund_id text,
  -- Buyer-paid processing fee (2.9% + $0.30), captured for the books
  add column buyer_fee_amount numeric,
  add column paid_at timestamptz,
  add column shipped_at timestamptz,
  add column delivered_at timestamptz,
  add column released_at timestamptz;

-- Cached go-live readiness: v2 recipient capability
-- (configuration.recipient.capabilities.stripe_balance.stripe_transfers).
-- Cache only — release re-checks against the Stripe API before transferring.
alter table sellers
  add column stripe_transfers_active boolean not null default false;

insert into pricing_engine_settings (key, value, description) values
  ('buyer_processing_fee_pct', '2.9',
   'Buyer-paid payment processing percentage, added at checkout.'),
  ('buyer_processing_fee_fixed_cents', '30',
   'Buyer-paid fixed processing fee in cents, added at checkout.');

-- transition_transaction — the only way a transaction changes status.
-- Enforces the Week 2 state machine: illegal edges are rejected, legal ones
-- stamp their timestamps atomically under a row lock. Escrow-relevant side
-- effects (Stripe transfer, refund) live in the API layer, which calls this
-- BEFORE acting so an illegal transition can never move money.
create or replace function public.transition_transaction(
  p_transaction_id uuid,
  p_to text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t record;
  allowed text[];
  window_hours int;
begin
  select * into t from transactions where id = p_transaction_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'transaction_not_found');
  end if;

  allowed := case t.status
    when 'pending_payment'   then array['payment_captured', 'cancelled']
    when 'payment_captured'  then array['awaiting_shipment', 'disputed', 'refunded']
    when 'awaiting_shipment' then array['shipped', 'disputed']
    when 'shipped'           then array['delivered', 'disputed']
    when 'delivered'         then array['inspection_open', 'disputed']
    when 'inspection_open'   then array['inspection_closed', 'disputed']
    when 'inspection_closed' then array['released', 'disputed']
    when 'disputed'          then array['dispute_resolved']
    when 'dispute_resolved'  then array['released', 'refunded']
    else array[]::text[]  -- released / refunded / cancelled are terminal
  end;

  if not (p_to = any(allowed)) then
    return jsonb_build_object(
      'ok', false, 'error', 'illegal_transition',
      'from', t.status, 'to', p_to, 'allowed', to_jsonb(allowed)
    );
  end if;

  update transactions set status = p_to where id = p_transaction_id;

  if p_to = 'payment_captured' then
    update transactions set paid_at = now() where id = p_transaction_id;
  elsif p_to = 'shipped' then
    update transactions set shipped_at = now() where id = p_transaction_id;
  elsif p_to = 'delivered' then
    update transactions set delivered_at = now() where id = p_transaction_id;
  elsif p_to = 'inspection_open' then
    select value::text::int into window_hours
    from pricing_engine_settings where key = 'inspection_window_hours';
    update transactions
    set inspection_deadline = now() + make_interval(hours => coalesce(window_hours, 72))
    where id = p_transaction_id;
  elsif p_to = 'released' then
    update transactions set released_at = now() where id = p_transaction_id;
  end if;

  return jsonb_build_object('ok', true, 'from', t.status, 'to', p_to);
end;
$$;

revoke execute on function public.transition_transaction(uuid, text) from public, anon, authenticated;
grant execute on function public.transition_transaction(uuid, text) to service_role;
