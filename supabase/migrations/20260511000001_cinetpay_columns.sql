-- Add Flutterwave tracking columns to payments table
alter table payments
  add column if not exists flutterwave_txn_id       text,
  add column if not exists flutterwave_payment_type  text;
