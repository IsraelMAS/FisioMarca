# GUÍA EXPLICATIVA — FisioMarca (qué hay en cada microservicio, cómo se usa y cómo probarlo en Bruno)

> Esta guía complementa al `README.md`. Aquí se explica **el porqué y el flujo**, no solo la lista
> de endpoints. Está escrita para que puedas entender y defender el proyecto.

---

## 0. Vocabulario rápido

| Concepto | Qué es |
|---|---|
| **Microservicio** | Un programa independiente con su propia base de datos y su propio puerto. |
| **Eureka** | "Directorio telefónico": cada micro se registra con su **nombre** (`AUTH-SERVICE`, `MICRO-CATALOGO`, ...). Nadie usa IPs fijas. |
| **Gateway** | La **puerta única** de entrada. Recibe todo en el puerto 8080 y lo reparte al micro correcto buscándolo por nombre en Eureka (`lb://MICRO-RESERVAS`). |
| **JWT (token)** | Una credencial firmada que prueba quién eres. Se pide con `/auth/login` y se manda en el header `Authorization: Bearer <token>`. |
| **Resource Server** | Micro que **valida** el token (no lo emite). Todos los micros de dominio lo son. |
| **Feign** | Cliente HTTP interno: un micro llama a otro **sin pasar por el Gateway** (por ejemplo, Carrito → Reservas). |
| **REST** | APIs JSON normales (`GET`/`POST`/`PUT`/`DELETE`). |
| **SOAP** | Protocolo antiguo basado en XML; el proyecto expone uno en `Micro-Soap` como pidió la consigna. |
| **Bruno** | Cliente para probar APIs (como Postman), offline y gratis. Guarda las peticiones en archivos. |

---

## 1. Mapa general de la arquitectura

```
                          ┌──────────────────────────────┐
                          │   EUREKA  http://:8761        │  Directorio de servicios
                          └──────────────▲───────────────┘
                                         │ todos se registran aquí
   Navegador / Bruno                     │
        │                                │
        ▼                                │
   ┌─────────────────────────────────────────────┐
   │            GATEWAY  :8080                    │
   │  1) valida el JWT (JwtAuthenticationFilter)  │
   │  2) reparte por ruta usando lb://NOMBRE       │
   └───┬───────┬──────────┬───────────┬───────────┘
       │       │          │           │
 /auth/**,   /catalogo/  /reservas/   /carrito/     /ws/**
 /usuarios/**   **          **          **            │
       │       │          │           │              │
       ▼       ▼          ▼           ▼              ▼
   AUTH-SERVICE  MICRO-   MICRO-     MICRO-       MICRO-SOAP
     :8099      CATALOGO  RESERVAS   CARRITO       :8098
                  :8090     :8092      :8093
       │           │         │           │            │
   fisiomarca_  fisiomarca fisiomarca fisiomarca   fisiomarca
    usuarios    _catalogo  _reservas  _carrito      _catalogo
```

**Llamadas internas (Feign, no pasan por el Gateway):**

- `MICRO-RESERVAS` → `AUTH-SERVICE` (¿existe el cliente?) y → `MICRO-CATALOGO` (datos del servicio).
- `MICRO-CARRITO` → `AUTH-SERVICE`, `MICRO-CATALOGO` y `MICRO-RESERVAS`.

---

## 2. El JWT explicado (la parte de seguridad)

### ¿Por qué un token?
Antes (con sesiones) el servidor recordaba quién estaba logueado. En microservicios eso no escala:
cada micro es independiente. La solución es un **token firmado**: el servidor no recuerda nada, pero
el token **prueba** que fue emitido por nosotros y **nadie puede falsificarlo** sin la clave.

### ¿Cómo funciona aquí? (HS256)
1. `AUTH-SERVICE` tiene una **clave secreta** (`jwt.secret`, en Base64).
2. Al hacer login, **firma** un token con esa clave. Cualquiera puede *leer* el token, pero **no
   modificarlo** sin la clave (cambiar el rol en el token invalida la firma).
3. El **Gateway** y **todos los micros** tienen **la misma clave**, así que pueden verificar la firma.
   Si el token está alterado/expirado → **401**.

### ¿Qué va dentro del token?

| Claim | Ejemplo | Para qué |
|---|---|---|
| `sub` | `juan@correo.com` | El usuario (email) |
| `roles` | `["CLIENTE"]` o `["ADMINISTRADOR"]` | Permisos. Cada micro lo convierte en `ROLE_CLIENTE` / `ROLE_ADMINISTRADOR` |
| `usuarioId` | `1` | Id del usuario |
| `nombre` | `Juan Pérez` | Para mostrar en el frontend |
| `clienteId` | `1` | Id del cliente asociado (lo usan Carrito y Reservas) |
| `iat` / `exp` | fechas | Emitido / expira (1 hora por defecto) |

> ⚠️ **Clave para entender cómo se promueve un admin:** el rol vive **dentro del token**. Si cambias tu rol en
> la base de datos, el token viejo **sigue diciendo CLIENTE**. Debes **volver a hacer login** para
> obtener un token nuevo con el rol actualizado.

---

## 3. Cada microservicio en detalle

### 3.1 `Servidor-Eureka` — puerto 8761
- Rol: registro y descubrimiento. No tiene lógica de negocio.
- Panel web: `http://localhost:8761` → ahí ves qué micros están "vivos".
- No lo consume el usuario directamente; existe para que el Gateway y Feign encuentren a los demás.

### 3.2 `Gateway` — puerto 8080
- **Toda** petición del frontend/Bruno entra por aquí.
- Filtro propio `JwtAuthenticationFilter` (validación del token con jjwt).
- Deja pasar **sin token** (público):
  - `POST /auth/login`, `POST /auth/register`, `POST /usuarios/registrar`
  - `GET /catalogo/**` (catálogo de solo lectura)
  - `/ws/**` (SOAP)
  - `OPTIONS` (preflight CORS)
- Todo lo demás exige `Authorization: Bearer <token>`; si falta o es inválido → **401** en el Gateway
  (ni siquiera llega al micro).
- Rutas (en `application.yml`):

| Ruta entrante | Va a |
|---|---|
| `/auth/**`, `/usuarios/**` | `lb://AUTH-SERVICE` |
| `/catalogo/**` | `lb://MICRO-CATALOGO` |
| `/reservas/**` | `lb://MICRO-RESERVAS` |
| `/carrito/**` | `lb://MICRO-CARRITO` |
| `/ws/**` | `lb://MICRO-SOAP` |

### 3.3 `AUTH-SERVICE` — puerto 8099 (BD `fisiomarca_usuarios`)
Es el corazón de la seguridad. Tablas: **`usuarios`** y **`clientes`**.
- **Emite** el token (login) y a la vez **valida** sus propias rutas protegidas.
- Al registrar un usuario crea **dos** filas: un `cliente` (datos de negocio: nombre, teléfono) y un
  `usuario` (credenciales: email, hash de contraseña, rol). Se enlazan por `cliente_id`.
- La contraseña se guarda **cifrada con BCrypt** (nunca en texto plano).

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| POST | `/auth/register` | público | Registra un usuario con rol `CLIENTE` |
| POST | `/auth/login` | público | Valida credenciales y **devuelve el token** |
| POST | `/usuarios/registrar` | público | Igual que `/auth/register` (alias usado por la referencia) |
| GET | `/usuarios/perfil` | token | Perfil del usuario logueado |
| PUT | `/usuarios/perfil` | token | Actualiza nombre y teléfono |
| PUT | `/usuarios/cambiar-password` | token | Cambia la contraseña (pide la actual) |
| GET | `/usuarios/clientes/existe/{id}` | público (uso interno Feign) | `true/false` si el cliente existe |
| GET | `/usuarios/clientes/buscar/{id}` | token | Datos de un cliente |
| GET | `/usuarios/lista` | token + ADMIN | Lista todos los usuarios |

Cuerpo de `POST /auth/register` (o `/usuarios/registrar`):

```json
{
  "nombreCompleto": "Juan Perez",
  "email": "juan@correo.com",
  "telefono": "987654321",
  "password": "secreto123",
  "confirmarPassword": "secreto123"
}
```
Validaciones: `nombreCompleto` obligatorio (≤120), `email` válido (≤120), `password` ≥ 6,
`confirmarPassword` obligatorio y debe **coincidir** con `password`.

Respuesta de `POST /auth/login`:

```json
{
  "success": true,
  "mensaje": "Inicio de sesión correcto",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "tipo": "Bearer",
    "expiraEn": 3600000,
    "nombre": "Juan Perez",
    "rol": "CLIENTE",
    "clienteId": 1
  }
}
```

> **`clienteId` es importante:** lo necesitas para las rutas de Reservas y Carrito.

### 3.4 `Micro-Catalogo` — puerto 8090 (BD `fisiomarca_catalogo`)
Tablas: **`categorias`** y **`servicios`**.
- **Lectura pública** (GET sin token). **Escritura solo ADMIN**.
- Estas rutas las llama también `Micro-Soap` (por SQL directo) y `Reservas`/`Carrito` (por Feign).

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| GET | `/catalogo/categorias/lista` | público | Todas las categorías |
| GET | `/catalogo/categorias/buscar/{id}` | público | Una categoría |
| GET | `/catalogo/servicios/lista` | público | Todos los servicios |
| GET | `/catalogo/servicios/activos` | público | Solo los activos |
| GET | `/catalogo/servicios/filtro?q=&maxPrecio=&categoriaId=` | público | Filtro combinado (todos los parámetros opcionales) |
| GET | `/catalogo/servicios/buscar/{id}` | público | Un servicio |
| POST | `/catalogo/categorias/registrar` | ADMIN | Crea categoría |
| PUT | `/catalogo/categorias/actualizar` | ADMIN | Actualiza categoría |
| POST | `/catalogo/servicios/registrar` | ADMIN | Crea servicio |
| PUT | `/catalogo/servicios/actualizar` | ADMIN | Actualiza servicio |
| PUT | `/catalogo/servicios/estado/{id}?activo=true` | ADMIN | Activa/desactiva un servicio |

Cuerpo de `POST /catalogo/servicios/registrar`:

```json
{
  "nombre": "Masaje descontracturante",
  "descripcion": "Masaje para tensión muscular",
  "precio": 45.00,
  "duracionMinutos": 45,
  "imagenUrl": null,
  "activo": true,
  "categoriaId": 4
}
```
Validaciones: `nombre` obligatorio, `precio` ≥ 0.01, `duracionMinutos` ≥ 1, `categoriaId` obligatorio
(la categoría debe existir).

Cuerpo de `POST /catalogo/categorias/registrar`:

```json
{ "nombre": "Nueva categoría", "descripcion": "Detalle", "imagenUrl": null, "activo": true }
```

### 3.5 `Micro-Reservas` — puerto 8092 (BD `fisiomarca_reservas`)
Tabla de negocio: **`reserva`** (más su detalle `reserva_servicio`). Guarda las citas.
Reglas de negocio que aplica (¡esto vale puntos en la exposición!):
- No se puede reservar en el pasado.
- El servicio debe **existir y estar activo** (lo consulta por Feign a Catálogo).
- La reserva debe caer dentro del **horario de atención**: mañana **07:00–12:00** o tarde **14:00–19:00**.
- No se puede **cruzar** con otra reserva no cancelada (choque de horarios).
- `fechaHoraFin` se calcula sumando la **duración** de los servicios; `precioTotal` es la suma de precios.

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| POST | `/reservas/registrar` | token | Crea la reserva |
| GET | `/reservas/disponibilidad?fecha=AAAA-MM-DD&servicioIds=1,2` | token | Devuelve slots cada 30 min con `disponible: true/false` |
| GET | `/reservas/buscar/{id}` | token | Una reserva |
| GET | `/reservas/cliente/{clienteId}` | token | Reservas de un cliente |
| PUT | `/reservas/cancelar/{id}` | token | Cancela |
| PUT | `/reservas/reprogramar/{id}` | token | Cambia fecha/hora |
| GET | `/reservas/lista` | token + **ADMIN** | Todas las reservas |
| GET | `/reservas/dashboard?desde=&hasta=` | token + **ADMIN** | Métricas para el panel |
| PUT | `/reservas/atender/{id}` | token + **ADMIN** | Marca ATENDIDA |

Cuerpo de `POST /reservas/registrar`:

```json
{
  "clienteId": 1,
  "fechaHoraInicio": "2026-10-20T10:00:00",
  "servicioIds": [1, 4],
  "notas": "Primera sesión"
}
```

Estados de una reserva: `PROGRAMADA` → (`ATENDIDA` | `CANCELADA`).

### 3.6 `Micro-Carrito` — puerto 8093 (BD `fisiomarca_carrito`)
Tablas: **`carrito`** y **`carrito_item`**. Todas sus rutas exigen token.
Flujo: agregas servicios al carrito y al **confirmar** el micro crea una **reserva** llamando por Feign
a `MICRO-RESERVAS` (reusando toda su lógica). Si la reserva sale bien, **vacía el carrito**.

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/carrito/{clienteId}` | Ver el carrito (con total y duración) |
| POST | `/carrito/items` | Agregar servicio (si ya existe, suma cantidad) |
| PUT | `/carrito/{clienteId}/items/{itemId}?cantidad=N` | Cambiar cantidad |
| DELETE | `/carrito/{clienteId}/items/{itemId}` | Quitar un item |
| DELETE | `/carrito/{clienteId}/vaciar` | Vaciar |
| POST | `/carrito/{clienteId}/confirmar` | Convierte el carrito en reserva |

Cuerpo de `POST /carrito/items`:

```json
{ "clienteId": 1, "servicioId": 1, "cantidad": 2 }
```

Cuerpo de `POST /carrito/{clienteId}/confirmar`:

```json
{ "fechaHoraInicio": "2026-10-20T10:00:00", "notas": "Reserva desde carrito" }
```
> El micro toma la `fechaHoraInicio` y arma los `servicioIds` repetidos según la cantidad.
> El carrito reenvía tu mismo token de `Authorization` a Reservas.

### 3.7 `Micro-Soap` — puerto 8098
- Servicio **SOAP** (Spring Web Services, contract-first) pedido por la consigna.
- No usa JPA: lee/escribe la tabla `servicios` de `fisiomarca_catalogo` con `JdbcTemplate`.
- Es **público** (sin token), igual que en la referencia del profesor.
- WSDL: `http://localhost:8098/ws/servicio.wsdl` (o por el Gateway: `http://localhost:8080/ws/servicio.wsdl`).

Operaciones (namespace `http://fisiomarca.com/soap`):

| Operación | Entrada | Salida |
|---|---|---|
| `getServiciosRequest` | (vacío) | `getServiciosResponse` con `lista` de servicios |
| `getServicioRequest` | `<id>` | `getServicioResponse` con `bean` |
| `postServicioRequest` | `bean` (servicio) | `postServicioResponse` con `estado` (nº de filas insertadas) |

---

## 4. Los flujos explicados

### Flujo A — Registro y obtención del token
1. `POST /auth/register` → se crean `cliente` + `usuario` (rol CLIENTE, password con BCrypt).
2. `POST /auth/login` → AUTH-SERVICE valida con `DaoAuthenticationProvider` (compara el BCrypt) y
   **firma un JWT**.
3. El frontend guarda el token y lo envía en cada petición: `Authorization: Bearer <token>`.
4. El **Gateway** valida la firma; si es válida, reenvía al micro. El micro **vuelve a validar** (defensa
   en profundidad) y además revisa el **rol** para las rutas de admin.

### Flujo B — Ver el catálogo (público)
Bruno/Navegador → `GET /catalogo/servicios/activos` → Gateway (no pide token para GET /catalogo) →
MICRO-CATALOGO → devuelve JSON. **Sin token.**

### Flujo C — Reservar directo (reserva "de un tirón")
1. `GET /reservas/disponibilidad?fecha=...&servicioIds=1,4` (con token) → el micro pide a Catálogo la
   duración de cada servicio y arma los slots libres.
2. Eliges un slot disponible y haces `POST /reservas/registrar` (con token).
3. El micro valida cliente (Feign AUTH), servicios (Feign Catálogo), horario y cruce, y guarda la reserva.

### Flujo D — Reservar por carrito
1. `POST /carrito/items` (varias veces) — el micro valida el servicio contra el catálogo y guarda el precio.
2. `GET /carrito/{clienteId}` → ves items, total y duración.
3. `POST /carrito/{clienteId}/confirmar` con la fecha → el micro arma la reserva y la **delega** a
   `MICRO-RESERVAS` (Feign, enviando tu token). Si tiene éxito, **vacía el carrito**.

### Flujo E — Administración
Un `ADMINISTRADOR` puede además: crear/editar categorías y servicios, ver `lista`/`dashboard` de
reservas y marcar reservas como atendidas.

---

## 5. Cómo se crea un administrador

**Problema:** el sistema **solo** crea usuarios con rol `CLIENTE`. No hay endpoint para "hacerme admin",
¡y está bien!: si existiera, cualquiera podría hacerse administrador.

**Solución práctica para la demo/exposición:** `SQL/01-fisiomarca.sql` ya trae `admin@fisiomarca.com / Admin123`.
Para promover otra cuenta: registrarla normalmente y luego **cambiarle el rol a mano en la base de datos**:

```sql
USE fisiomarca_usuarios;
UPDATE usuarios
SET rol = 'ADMINISTRADOR'
WHERE email = 'admin@fisiomarca.com';
```

**Pasos exactos:**

1. Registra el usuario normalmente:
   `POST /auth/register` con `{"email":"admin@fisiomarca.com", ...}`.
2. En el `UPDATE` de arriba **cambia el correo** por el que registraste.
3. Ejecútalo en Workbench o DBeaver.
4. **Vuelve a hacer `POST /auth/login`** con ese usuario. ← *Este paso es el que suele olvidarse.*
   El token anterior seguía diciendo `CLIENTE`; el nuevo ya trae `"roles":["ADMINISTRADOR"]`.
5. Ahora ese token sí puede usar las rutas de admin (crear servicios, ver `/reservas/lista`, etc.).

> Si no vuelves a loguearte, te dará **403 Forbidden** aunque ya seas admin en la base de datos.

---

## 6. Preparación (una sola vez)

1. **MySQL** encendido.
2. Ejecutar `SQL/01-fisiomarca.sql` y luego `SQL/02-estados-pagos.sql` (crean las 4 bases con sus tablas y datos demo).
3. Arrancar en este orden (cada uno en su carpeta, con la clave de MySQL):
   ```
   Servidor-Eureka (8761) → AUTH-SERVICE (8099) → Gateway (8080) →
   Micro-Catalogo (8090) → Micro-Soap (8098) → Micro-Reservas (8092) → Micro-Carrito (8093)
   ```
   En PowerShell, por ejemplo:
   ```powershell
   $env:DB_USUARIOS_PASSWORD="root"; mvn spring-boot:run   # en AUTH-SERVICE
   ```
   (Repite con `DB_CATALOGO_PASSWORD`, `DB_RESERVAS_PASSWORD`, `DB_CARRITO_PASSWORD`, `DB_SOAP_PASSWORD`.)
4. Verifica en `http://localhost:8761` que aparezcan los 6 servicios.
5. Entra a http://localhost:3000/login con `admin@fisiomarca.com / Admin123`.

> **Truco:** con Docker se levanta todo de una: `docker compose up -d` (ver README §0).

---

## 7. Bruno: colección paso a paso

### 7.1 Preparar Bruno
1. Instala Bruno (`https://www.usebruno.com`) y crea una **Collection** llamada `FisioMarca`.
2. Crea un **Environment** llamado `local` con estas variables:

   | Variable | Valor | Secreto |
   |---|---|---|
   | `baseUrl` | `http://localhost:8080` | no |
   | `token` | *(vacío, se llena solo)* | **sí** |
   | `clienteId` | `1` | no |

3. Selecciona el entorno `local` arriba a la derecha.

### 7.2 Guardar el token automáticamente
En la petición **Login** → pestaña **Script** → **Post Response**:

```javascript
bru.setEnvVar("token", res.body.data.token);
bru.setEnvVar("clienteId", res.body.data.clienteId);
```

Y en las peticiones protegidas, en **Auth → Bearer Token**, pon `{{token}}`
(o header `Authorization: Bearer {{token}}`).

### 7.3 Orden de peticiones (lo que debes hacer)

**① Catálogo público (sin token)** — comprueba que el Gateway deja pasar.
```
GET {{baseUrl}}/catalogo/servicios/activos
```
✅ Esperado: `200` con `data` = lista de servicios.

**② Registro**
```
POST {{baseUrl}}/auth/register
Content-Type: application/json

{ "nombreCompleto":"Juan Perez","email":"juan@correo.com","telefono":"987654321",
  "password":"secreto123","confirmarPassword":"secreto123" }
```
✅ Esperado: `201` con `data.id` y `data.clienteId`.

**③ Login** (aquí corre el script que guarda el token)
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{ "email":"juan@correo.com", "password":"secreto123" }
```
✅ Esperado: `200` con `data.token`, `data.rol = "CLIENTE"`, `data.clienteId`.

**④ Perfil (con token)**
```
GET {{baseUrl}}/usuarios/perfil        Auth: Bearer {{token}}
```
✅ Esperado: `200`. ❌ Si quitas el token → `401`.

**⑤ Prueba de seguridad (debe fallar)**
```
POST {{baseUrl}}/catalogo/servicios/registrar        Auth: Bearer {{token}}   (rol CLIENTE)
```
✅ Esperado: `403 Forbidden` (el rol CLIENTE no puede). Sin token → `401`.

**⑥ Convertirte en admin**
- Ejecuta el `UPDATE` de la sección 5 (con tu correo).
- **Repite el Login (③)** para obtener el token nuevo.
- Repite **⑤**. ✅ Ahora esperado: `201` (se creó el servicio).

**⑦ Reservas (con token del cliente)**
```
GET {{baseUrl}}/reservas/disponibilidad?fecha=2026-10-20&servicioIds=1,4
```
✅ Esperado: `200` con `horarios` (`hora`, `disponible`).
```
POST {{baseUrl}}/reservas/registrar
{ "clienteId":{{clienteId}}, "fechaHoraInicio":"2026-10-20T10:00:00",
  "servicioIds":[1,4], "notas":"Prueba" }
```
✅ Esperado: `201` con `estado = "PROGRAMADA"`.

**⑧ Carrito (con token del cliente)**
```
POST {{baseUrl}}/carrito/items
{ "clienteId":{{clienteId}}, "servicioId":5, "cantidad":1 }
```
✅ `201`. Luego:
```
GET {{baseUrl}}/carrito/{{clienteId}}          → 200 (items, total, duración)
POST {{baseUrl}}/carrito/{{clienteId}}/confirmar
{ "fechaHoraInicio":"2026-10-21T15:00:00", "notas":"Desde carrito" }
```
✅ Esperado: `201` con la reserva; y si vuelves a `GET /carrito/{{clienteId}}` → carrito **vacío**.

**⑨ SOAP**
- Opción Bruno: crea una petición de tipo **SOAP** apuntando a
  `{{baseUrl}}/ws` con acción `getServiciosRequest`, o al WSDL `{{baseUrl}}/ws/servicio.wsdl`.
- Opción navegador: abre `http://localhost:8080/ws/servicio.wsdl` para ver el contrato.
- Ejemplo de sobre (envelope) para listar:
```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:fis="http://fisiomarca.com/soap">
  <soapenv:Header/>
  <soapenv:Body>
    <fis:getServiciosRequest/>
  </soapenv:Body>
</soapenv:Envelope>
```
✅ Esperado: `200` con `getServiciosResponse` y la `lista` de servicios.

---

## 8. Cómo saber que TODO está correcto

### 8.1 Señales de que arrancó bien
- `http://localhost:8761` muestra registrados: `GATEWAY`, `AUTH-SERVICE`, `MICRO-CATALOGO`,
  `MICRO-SOAP`, `MICRO-RESERVAS`, `MICRO-CARRITO`.
- Los 7 procesos dicen `Started ... in X seconds` sin errores.

### 8.2 Tabla de códigos esperados

| Situación | Código | Significado |
|---|---|---|
| Petición correcta con datos | `200` / `201` | OK / creado |
| Sin token en ruta protegida | `401` | No autenticado (lo corta el Gateway) |
| Token inválido/expirado | `401` | Firma o `exp` incorrectos |
| Token válido pero rol CLIENTE en ruta admin | `403` | Autenticado sin permiso |
| Regla de negocio (cruce, correo repetido, horario) | `400` | `BusinessException` |
| Recurso inexistente (`/buscar/999`) | `404` | No encontrado |
| `503 Service Unavailable` justo al arrancar | `503` | Eureka aún no propagó; espera ~30s |

### 8.3 Checklist de "todo funciona"
- [ ] `GET /catalogo/servicios/activos` sin token → `200`.
- [ ] `POST /auth/register` → `201`.
- [ ] `POST /auth/login` → `200` con `token`.
- [ ] `GET /usuarios/perfil` con token → `200`; sin token → `401`.
- [ ] `POST /catalogo/servicios/registrar` con CLIENTE → `403`; tras promover + re-login → `201`.
- [ ] `GET /reservas/disponibilidad` → `200` con slots.
- [ ] `POST /reservas/registrar` → `201`.
- [ ] `POST /carrito/items` → `201` y `confirmar` → `201` (y carrito vacío).
- [ ] `GET /ws/servicio.wsdl` → `200` y `getServicios` responde XML.

---

## 9. Problemas típicos y su causa

| Síntoma | Causa probable | Solución |
|---|---|---|
| `503` en todo nada más arrancar | Eureka aún no propaga (tarda ~30 s) | Espera y reintenta |
| `401` con un token que "parece" bueno | `JWT_SECRET` distinto entre servicios, o token expirado | Verifica el secreto/env y vuelve a loguearte |
| `403` aunque ya eres admin | No volviste a hacer login (el token viejo traía CLIENTE) | Re-login |
| `500` en cualquier micro | BD no creada, o clave de MySQL incorrecta | Ejecuta `SQL/01-fisiomarca.sql` y pon las `DB_*_PASSWORD` |
| `400 "El correo ya está registrado"` | El email ya existe en `usuarios` o `clientes` | Usa otro email |
| `400 "El horario seleccionado ya está ocupado"` | Cruce con otra reserva | Elige otro horario |
| `400` sobre horario de atención | Fuera de 07:00–12:00 / 14:00–19:00 | Elige un horario válido |
| El SOAP no responde | Micro-Soap sin arrancar o ruta mal | Verifica puerto 8098 y `/ws/servicio.wsdl` |

---

## 10. Datos demo del catálogo

`SQL/01-fisiomarca.sql` inserta **5 categorías** y **17 servicios** (Post operatorio, Parálisis
facial, Desgarros, Lumbalgia, Piedras calientes, Cervicalgia, ACV, Lesión de ligamentos, Masaje
reductor, Ventosas, Vendaje neuromuscular, Relajante, Descontracturante, Descarga muscular,
Evaluación postural, Ejercicios preventivos, Esguince de tobillo).

> Úsalo después de arrancar `Micro-Catalogo` (necesitas que Hibernate ya haya creado las tablas).
