-- Drop legacy trigger and functions that interfere with ticket inserts
DO $$
BEGIN
  -- Drop trigger if exists
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_safe_balance_update'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_safe_balance_update ON tickets;
  END IF;

  -- Drop functions if exist
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'safe_update_user_balance'
  ) THEN
    DROP FUNCTION IF EXISTS safe_update_user_balance();
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'deduct_user_balance'
  ) THEN
    DROP FUNCTION IF EXISTS deduct_user_balance(INT, NUMERIC, TEXT, INT);
  END IF;
END $$;


