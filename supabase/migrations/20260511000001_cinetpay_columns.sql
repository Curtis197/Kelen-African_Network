-- Add CinetPay tracking columns to payments table
alter table payments
  add column if not exists cinetpay_payment_method text,
  add column if not exists orange_money_pay_token   text,
  add column if not exists orange_money_txn_id      text;
