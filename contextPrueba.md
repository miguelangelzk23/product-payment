# Checkout de producto con pasarela de pagos

Contexto del proyecto para el agente de código. Léelo completo antes de escribir código.

> **Regla del repositorio:** el nombre comercial de la pasarela de pagos NO debe aparecer en
> ningún archivo versionado (código, comentarios, nombres de carpeta, commits, README).
> Referirse siempre a ella como "la pasarela" o `PAYMENT_GATEWAY`. Las URLs y llaves reales
> viven únicamente en `.env`, que está en `.gitignore`.

---

## 1. Objetivo

Aplicación de checkout de un solo producto. El cliente ve un producto con su stock, paga con
tarjeta de crédito a través de una pasarela externa en modo sandbox, y al finalizar se
actualiza el inventario y se registra la entrega.

El flujo tiene 5 pantallas:

1. Página de producto
2. Formulario de tarjeta de crédito + datos de entrega
3. Resumen del pago (con desglose de montos)
4. Estado final de la transacción
5. Regreso a la página de producto con el stock actualizado

---

## 2. Stack y decisiones ya tomadas

**No cambiar estas decisiones sin consultar.**

| Capa | Tecnología |
|---|---|
| Backend | NestJS + TypeScript |
| Arquitectura backend | **Capas tradicionales de NestJS** (controller → service → repository). NO hexagonal. |
| ORM | Prisma |
| Base de datos | PostgreSQL en Supabase |
| Frontend | React (SPA) + Redux Toolkit |
| Persistencia de estado | `redux-persist` sobre localStorage |
| Tests | Jest (backend y frontend), objetivo > 80% de cobertura |
| Validación | `class-validator` + `ValidationPipe` global con `whitelist: true` |

### Estructura de carpetas del backend

```
src/
  prisma/
    prisma.service.ts
  products/
    products.controller.ts
    products.service.ts
    products.repository.ts
    dto/
  transactions/
    transactions.controller.ts
    transactions.service.ts
    transactions.repository.ts
    dto/
  payments/
    payments.service.ts        # cliente HTTP de la pasarela
    payments.types.ts
  common/
    result.ts                  # Result<T, E> para ROP
    errors/
```

### Railway Oriented Programming

Los **services** devuelven `Result<T, E>` en vez de lanzar excepciones para los errores de
negocio esperados (sin stock, producto inexistente, pago rechazado). Los **controllers**
traducen ese `Result` al código HTTP correspondiente. Las excepciones se reservan para fallos
realmente inesperados.

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

---

## 3. Modelo de datos

Ya está creado y migrado. **No modificar el esquema sin consultar.**

```
PRODUCTS ||--|| STOCKS          (1:1)
PRODUCTS ||--o{ TRANSACTIONS    (1:N)
CUSTOMERS ||--o{ TRANSACTIONS   (1:N)
TRANSACTIONS ||--|| DELIVERIES  (1:1)
```

**products** — `id`, `name` (unique), `description`, `price_in_cents`, `image_url`, timestamps

**stocks** — `id`, `product_id` (unique, FK), `quantity`, `updated_at`

**customers** — `id`, `email` (unique), `full_name`, `phone_number`, `document_type` (enum
`CC|CE|NIT|PP`), `document_number`, timestamps. Unique compuesto en
(`document_type`, `document_number`).

**transactions** — `id`, `reference` (unique), `customer_id` (FK), `product_id` (FK),
`quantity`, `product_amount`, `base_fee`, `delivery_fee`, `total_amount`,
`status` (enum `PENDING|APPROVED|DECLINED`), `provider_transaction_id`, `card_brand`,
`card_last_four`, timestamps.
CHECK: `total_amount = product_amount + base_fee + delivery_fee`

**deliveries** — `id`, `transaction_id` (unique, FK), `address_line`, `city`, `region`,
`status` (enum `PENDING|ASSIGNED`), timestamps

### Reglas invariantes del modelo

- **Todos los montos son enteros en centavos.** Nunca `float`, nunca `decimal` en el código.
- **Nunca persistir el número completo de tarjeta, el CVV ni la fecha de expiración.**
  Solo `card_brand` y `card_last_four`. La tarjeta se tokeniza en el frontend contra la
  pasarela; el backend solo recibe y usa el token.
- Los montos guardados son un *snapshot* del momento de la compra. No se recalculan al leer.
- La dirección vive en `deliveries`, no en `customers`: es un dato de esa compra, no del cliente.

---

## 4. Endpoints

### Ya implementados

- `GET /products` — lista de productos con su stock disponible
- `GET /products/:id` — detalle de un producto

### Por implementar (en este orden)

#### `POST /transactions`

Crea la transacción en `PENDING` y devuelve el número de transacción.

Request:
```json
{
  "productId": "uuid",
  "quantity": 1,
  "customer": {
    "email": "string",
    "fullName": "string",
    "phoneNumber": "string",
    "documentType": "CC",
    "documentNumber": "string"
  },
  "delivery": {
    "addressLine": "string",
    "city": "string",
    "region": "string"
  }
}
```

Response `201`:
```json
{
  "reference": "string",
  "status": "PENDING",
  "amounts": {
    "productAmount": 0,
    "baseFee": 0,
    "deliveryFee": 0,
    "totalAmount": 0
  }
}
```

Lógica, todo dentro de un `prisma.$transaction`:
1. Validar que el producto exista → si no, `404`
2. Validar `quantity > 0` y que haya stock suficiente → si no, `409`
3. Upsert del cliente por `email`
4. **Calcular los montos en el backend** leyendo `price_in_cents` de la base de datos.
   Nunca confiar en montos enviados por el cliente.
5. Crear la transacción en `PENDING`
6. Crear la entrega en `PENDING`

El `reference` se genera en el backend (UUID o `TX-<timestamp>-<random>`).

#### `POST /transactions/:reference/pay`

Ejecuta el cobro contra la pasarela.

Request: `{ "cardToken": "string", "acceptanceToken": "string", "installments": 1 }`

Lógica:
1. Cargar la transacción por `reference`. Si ya está en estado final → `409` (idempotencia básica)
2. Llamar a `PaymentsService.charge()`
3. Si el resultado es aprobado, dentro de un solo `prisma.$transaction`:
   - `transactions.status = 'APPROVED'`, guardar `provider_transaction_id`, `card_brand`, `card_last_four`
   - Descontar stock con `updateMany` condicional (ver abajo)
   - `deliveries.status = 'ASSIGNED'`
4. Si fue rechazado: `transactions.status = 'DECLINED'`. El stock no se toca y la entrega
   se queda en `PENDING`.

**Descuento de stock seguro ante concurrencia** — usar exactamente este patrón:

```typescript
const { count } = await tx.stock.updateMany({
  where: { productId, quantity: { gte: qty } },
  data: { quantity: { decrement: qty } },
});
if (count === 0) return err(new InsufficientStockError());
```

Nunca leer el stock y luego escribirlo en dos pasos separados.

#### `GET /transactions/:reference`

Devuelve la transacción con su cliente, producto y entrega. Es el endpoint que permite al
frontend reconstruir el estado tras un refresh.

---

## 5. Integración con la pasarela

Todo encapsulado en `payments/payments.service.ts`. Ningún otro archivo llama a la pasarela
directamente.

Variables de entorno (nunca hardcodear):

```
PAYMENT_GATEWAY_BASE_URL=
PAYMENT_GATEWAY_PUBLIC_KEY=
PAYMENT_GATEWAY_PRIVATE_KEY=
PAYMENT_GATEWAY_INTEGRITY_SECRET=
BASE_FEE_IN_CENTS=500000
DELIVERY_FEE_IN_CENTS=1200000
```

Secuencia del cobro:

1. **Token de aceptación** — `GET /merchants/{publicKey}`, extraer `presigned_acceptance.acceptance_token`
2. **Tokenización de la tarjeta** — se hace **en el frontend** con la llave pública.
   El backend solo recibe el token resultante.
3. **Firma de integridad** — SHA-256 de la concatenación
   `reference + amountInCents + currency + integritySecret`
4. **Crear la transacción** — `POST /transactions` con el token de la tarjeta, el monto,
   la moneda `COP`, la referencia, el `acceptance_token` y la firma
5. **Polling del estado** — la pasarela responde `PENDING` de inmediato.
   Consultar `GET /transactions/{id}` cada ~1.5s hasta obtener `APPROVED`, `DECLINED`,
   `VOIDED` o `ERROR`, con un máximo de ~10 intentos y un timeout total.

Mapear `VOIDED` y `ERROR` a `DECLINED` en nuestro dominio.

**Entorno sandbox únicamente.** No hay transacciones con dinero real.

---

## 6. Frontend

- SPA en React con Redux Toolkit. El estado del checkout es una máquina de 5 pasos.
- Persistir en localStorage: el paso actual, el `reference` y los datos del formulario.
  Al recargar, rehidratar y consultar `GET /transactions/:reference` para reconciliar.
- **Nunca persistir el número de tarjeta ni el CVV en Redux ni en localStorage.**
- Diseño mobile-first. Referencia mínima: iPhone SE (2020), 375×667 pt de viewport.
  Responsive hacia arriba usando flexbox/grid.
- Detección de marca de tarjeta por BIN para mostrar el logo (VISA empieza en 4;
  MasterCard en 51-55 o 2221-2720).
- Validar la tarjeta con el algoritmo de Luhn antes de tokenizar.
- El resumen de pago va en un componente **backdrop** (patrón de Material Design).

---

## 7. Tests

Objetivo: **más del 80% de cobertura** en backend y frontend. Es el rubro de mayor peso.

- Escribir el test en el mismo commit que el código que prueba.
- Backend: tests unitarios de los services mockeando los repositories y `PaymentsService`.
  Cubrir los caminos de error, no solo el feliz: sin stock, producto inexistente,
  pago rechazado, transacción ya pagada.
- Frontend: tests de reducers, selectores y componentes con React Testing Library.
- Incluir la salida de `jest --coverage` en el README final.

---

## 8. Seguridad

- RLS activo en todas las tablas de Supabase, sin políticas. La API se conecta como rol
  `postgres` y no está sujeta a RLS.
- Helmet para cabeceras de seguridad, CORS restringido al dominio del frontend.
- HTTPS en producción.
- `ValidationPipe` global con `whitelist: true` y `forbidNonWhitelisted: true`.
- Ningún secreto en el repositorio. `.env` en `.gitignore`, con un `.env.example` sin valores.

---

## 9. Convenciones

- Commits en inglés, formato convencional (`feat:`, `fix:`, `test:`, `chore:`).
- Una rama por feature, merge vía pull request.
- Nombres de código en inglés; los mensajes de error de cara al usuario en español.
- Prisma usa `camelCase` en el cliente y `snake_case` en la base de datos vía `@map`.

---

## 10. Entregables finales

- README con el modelo de datos, la colección de Postman o URL de Swagger, y los resultados
  de cobertura.
- Repositorio público en GitHub con historial de commits real.
- Aplicación y API desplegadas en un proveedor cloud, funcionando y conectadas entre sí.