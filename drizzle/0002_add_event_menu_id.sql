-- Add menu_id to events for event-menu association
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'menu_id'
  ) THEN
    ALTER TABLE "events" ADD COLUMN "menu_id" uuid REFERENCES "menus"("id") ON DELETE SET NULL;
  END IF;
END $$;
