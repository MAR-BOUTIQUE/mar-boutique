-- Programación automática con pg_cron en Supabase
-- Requiere extensión habilitada: Supabase Dashboard → Database → Extensions → pg_cron → Enable
--
-- INSTRUCCIONES:
-- 1. Habilitar pg_cron en Supabase Dashboard → Database → Extensions
-- 2. Ejecutar este script en el SQL Editor
-- 3. Verificar con: SELECT * FROM cron.job;

-- Eliminar trabajos previos si existen (evitar duplicados)
SELECT cron.unschedule('release-expired-reservations') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'release-expired-reservations'
);
SELECT cron.unschedule('cancel-expired-orders') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cancel-expired-orders'
);

-- Liberar reservas expiradas cada minuto — RB-CHK-01, RB-PED-02
-- (el stock bloqueado por carrito se libera automáticamente a los 10 min)
SELECT cron.schedule(
  'release-expired-reservations',
  '* * * * *',
  'SELECT release_expired_reservations()'
);

-- Cancelar pedidos sin pago confirmado pasados 30 minutos — RB-PED-02
-- Corre cada 5 minutos para no dejar pedidos zombie demasiado tiempo
SELECT cron.schedule(
  'cancel-expired-orders',
  '*/5 * * * *',
  'SELECT cancel_expired_orders()'
);
