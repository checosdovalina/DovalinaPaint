-- Añadir nuevas columnas a la tabla service_orders
ALTER TABLE service_orders 
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS signed_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS materials_required TEXT,
  ADD COLUMN IF NOT EXISTS special_instructions TEXT,
  ADD COLUMN IF NOT EXISTS safety_requirements TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to INTEGER,
  ADD COLUMN IF NOT EXISTS assigned_type TEXT;

-- Actualizar el nombre de la columna signature_date a signed_date (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'signature_date') THEN
    ALTER TABLE service_orders RENAME COLUMN signature_date TO signed_date;
  END IF;
END
$$;
