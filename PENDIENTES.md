# Pendientes — Mar Boutique
> Última actualización: 23 mayo 2026

---

## 🔴 Bloqueantes (sin esto no se puede lanzar el 20 mayo)

- [ ] **Páginas legales** — crear `/terminos` y `/privacidad` (Ley 1581/2012, enlazadas desde checkout)
- [x] **`/seguimiento` roto para guests** — migrado a `createServiceClient()`, guests y clientes registrados pueden rastrear pedidos
- [x] **Grid de productos en Home** — carga los 4 productos más recientes con status `published` desde la BD
- [ ] **Verificar dominio `marboutique.co` en Resend** — sin esto los emails solo llegan a `juancamilo965@gmail.com`, clientas reales no reciben nada
- [ ] **Keys de Wompi en producción** — las actuales son sandbox (`pub_test_...`), cambiar antes del lanzamiento

---

## 🟡 Importantes (degradan experiencia si faltan)

- [x] **Botón "Aplicar" cupón en checkout** — conectado a `/api/checkout/coupon`, valida y aplica el descuento
- [ ] **Email al cambiar estado del pedido** — `sendOrderStatusEmail()` existe pero el API route `/api/admin/orders/[id]/status` no la llama; la clienta no recibe notificación cuando el admin cambia el estado
- [ ] **Edición de perfil** — `/cuenta/perfil` puede estar solo en lectura, verificar que guarda cambios de nombre/teléfono
- [ ] **Gestión de direcciones** — `/cuenta/direcciones` puede estar solo en lectura, verificar CRUD
- [ ] **Activar rol admin para María Angélica y María Isabel** — cuando se tengan sus correos, ejecutar UPDATE en `auth.users`

---

## ✅ Completado

- [x] Popup de bienvenida — aparece 1.8s después de la primera visita, ofrece cupón `BIENVENIDA10` (10% primer pedido), solo a usuarios no registrados, se guarda en localStorage
- [x] Cupón `BIENVENIDA10` — creado en BD (percentage 10%, scope global, 1 uso por cliente, vigente hasta 2030)
- [x] API `/api/checkout/coupon` — valida código, verifica límites de uso, retorna descuento
- [x] Email de bienvenida — incluye bloque con cupón `BIENVENIDA10` y asunto actualizado
- [x] RLS fix — `createServiceClient` usa `@supabase/supabase-js` directo (no cookies), bypasea RLS correctamente
- [x] Imágenes de productos — `remotePatterns` en `next.config.ts` para Supabase Storage
- [x] Catálogo `/catalogo` — fix `useSearchParams` + Suspense + `CatalogSortSelect` client component
- [x] Página `/colecciones`
- [x] Botón WhatsApp flotante (+573042346723) en todo el storefront
- [x] Iconos redes sociales en footer (Instagram, Facebook, TikTok, Email)
- [x] Protección `/admin` por rol (`app_metadata.role === 'admin'`) — middleware + layout
- [x] Variables de entorno Wompi en Vercel (`NEXT_PUBLIC_WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`)
- [x] Fix firma Wompi checkout — `createHash` SHA-256 plano (no HMAC)
- [x] Fix firma webhook Wompi — mismo fix SHA-256
- [x] Fix webhook: variable `tx` muerta eliminada, `release_expired_reservations` fuera del loop
- [x] Fix `createServiceClient` — removido `await` innecesario en checkout y webhook
- [x] Pedidos en cuenta cliente — fix lookup por email + vinculación `auth_user_id`
- [x] Checkout prefill — datos precargados si el usuario está logueado
- [x] Fix inventario — `cart_session_id` guardado en pedido y usado en `confirm_stock_sale`
- [x] Emails transaccionales — 5 plantillas diseñadas (confirmación, admin, pago rechazado, cambio de estado, bienvenida)
- [x] Email de bienvenida — enviado desde auth callback al confirmar cuenta
- [x] `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAILS` — configurados en Vercel
- [x] Migración `20260512000001_orders_cart_session.sql` — columna `cart_session_id` en orders
- [x] Rol admin aplicado en Supabase para `juancamilo965@gmail.com`
- [x] `NEXT_PUBLIC_SITE_URL` actualizado a `https://mar-boutique.vercel.app` en Vercel
- [x] Supabase Auth URL Configuration — Site URL y Redirect URLs apuntando a producción

---

## 🟢 Fase 2 (post-lanzamiento)

- [ ] Google Analytics 4 + Meta Pixel — scripts en layout
- [ ] Métricas reales en dashboard admin (hoy puede mostrar datos hardcodeados)
- [ ] WhatsApp Business API para notificaciones automáticas
- [ ] Módulo de devoluciones
- [ ] Recordatorio carrito abandonado
- [ ] "Avísame cuando regrese" en productos agotados
- [ ] Wishlist avanzada — vista admin, campañas dirigidas
- [ ] Blog con editor enriquecido
- [ ] Integración agregador logístico
- [ ] Reportes avanzados
- [ ] Sección Best Sellers — admin marca productos como best seller, sección dedicada en el storefront
