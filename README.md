# 🩺 FisioMarca

**Plataforma web para un centro de fisioterapia y rehabilitación en Lima, Perú.** Los pacientes consultan tratamientos, arman su carrito, reservan sesiones con horario real y pagan online. La clínica gestiona agenda, fisioterapeutas, salas, historial clínico y pagos desde un panel de administración.

> Proyecto académico construido con **arquitectura de microservicios Spring Boot** + **frontend Next.js**, todo levantable con **un solo comando de Docker**.

---

## Índice

1. [Objetivo](#1-objetivo)
2. [Funcionalidades](#2-funcionalidades)
3. [Herramientas y tecnologías](#3-herramientas-y-tecnologías)
4. [Arquitectura](#4-arquitectura)
5. [Puesta en marcha con Docker (paso a paso)](#5-puesta-en-marcha-con-docker-paso-a-paso)
6. [Recorrido guiado de la demo](#6-recorrido-guiado-de-la-demo)
7. [Uso diario de Docker](#7-uso-diario-de-docker)
8. [Configuración opcional (.env) y asistente IA](#8-configuración-opcional-env-y-asistente-ia)
9. [Rutas del sitio](#9-rutas-del-sitio)
10. [API a través del Gateway](#10-api-a-través-del-gateway)
11. [Seguridad (JWT)](#11-seguridad-jwt)
12. [Servicio SOAP](#12-servicio-soap)
13. [Base de datos y datos demo](#13-base-de-datos-y-datos-demo)
14. [Probar la API con curl](#14-probar-la-api-con-curl)
15. [Estructura del proyecto](#15-estructura-del-proyecto)
16. [Solución de problemas](#16-solución-de-problemas)
17. [Ejecutar sin Docker (opcional)](#17-ejecutar-sin-docker-opcional)

---

## 1. Objetivo

Digitalizar la atención de un centro de fisioterapia aplicando una arquitectura de **microservicios** real:

- **Para el paciente:** encontrar el tratamiento adecuado a su molestia, reservar en horarios disponibles y pagar sin llamar ni hacer cola.
- **Para la clínica:** organizar la agenda sin choques de horario, controlar pagos pendientes y cancelaciones, y llevar el historial clínico de cada paciente.
- **Académico:** aplicar Service Discovery (Eureka), API Gateway, seguridad con JWT, comunicación entre servicios (Feign), un servicio **SOAP** junto a servicios **REST**, y despliegue con **contenedores Docker**.

---

## 2. Funcionalidades

### Paciente
- Catálogo de **17 tratamientos** en 5 categorías, con búsqueda por nombre y filtro por categoría.
- **Carrito** de sesiones y **agendamiento**: elige día y hora de cada sesión sobre la disponibilidad real.
- **Pago online** (simulado para la demo) con tarjeta, Yape o Plin. Los horarios quedan apartados mientras paga.
- **Mis citas:** ver el estado de cada cita, retomar pagos pendientes y cancelar. **Mi evolución** (en Perfil): gráfico del dolor (escala EVA) sesión a sesión.
- Reglas de negocio: máx. 4 sesiones por compra, 1 sesión por día, máx. 4 citas activas.

### Administrador
- **Panel** con métricas (citas, ingresos, tasa de cancelación, tratamientos más pedidos).
- **Agenda** por fisioterapeuta y sala, con reprogramación de citas. **Citas** con pestañas por estado: pago pendiente, programadas, en atención, atendidas, canceladas y expiradas.
- **Historial clínico**, **transacciones**, **equipo** (fisioterapeutas y salas), **usuarios** y **catálogo**.
- Exportación a **PDF** y **Excel**. **SOAP Explorer** para probar el servicio SOAP desde el navegador.

### Para todos
- **Modo claro / oscuro** (botón ☀/🌙), recordado por navegador.
- **Asistente virtual "Marca"** con botones rápidos (📅 horarios, 🩺 ¿qué te duele?, 💡 recomendaciones) y botón de **WhatsApp**.

---

## 3. Herramientas y tecnologías

| Capa | Tecnologías |
|------|-------------|
| **Backend** | Java 17 · Spring Boot 4.1 · Spring Cloud 2025.1 (Eureka, Gateway WebFlux, OpenFeign, LoadBalancer) · Spring Security + OAuth2 Resource Server · JJWT (HS256) · Spring Data JPA / Hibernate · Spring Web Services + JAXB (SOAP) · ModelMapper · Lombok · Maven |
| **Base de datos** | MySQL 8.4 (4 bases, una por dominio) |
| **Frontend** | Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5 · Tailwind CSS 4 · Framer Motion · Recharts · React Hook Form + Zod · Lucide Icons · jsPDF · ExcelJS |
| **IA (opcional)** | Claude (Anthropic SDK) para el asistente; sin clave funciona en modo local |
| **Infraestructura** | Docker · Docker Compose · imágenes multi-stage (`eclipse-temurin:17-jre-alpine`, `node:24-alpine`, `mysql:8.4`) |
| **Herramientas** | Git / GitHub · VS Code · Spring Tool Suite · MySQL Workbench · Bruno (pruebas de API) |

---

## 4. Arquitectura

```
                    Navegador  ──────────────►  Frontend Next.js  :3000
                        │
                        │  JSON / XML + JWT
                        ▼
               ┌──────────────────┐        ┌───────────────────┐
               │  Gateway  :8080  │◄──────►│  Eureka  :8761    │  registro de servicios
               │  valida el JWT   │        └─────────▲─────────┘
               └──┬────┬────┬────┬┴───┐              │ todos se registran
                  │    │    │    │    │              │
     /auth  ┌─────▼┐ ┌─▼────┴┐ ┌─▼────┴┐ ┌────▼───┐ ┌──▼─────┐
  /usuarios │ AUTH │ │CATÁLO-│ │RESER- │ │CARRITO │ │  SOAP  │
            │ 8099 │ │GO 8090│ │VAS8092│ │  8093  │ │  8098  │
            └──┬───┘ └──┬────┘ └──┬────┘ └───┬────┘ └───┬────┘
               │        │  Feign ◄┴──────────┘          │
               ▼        ▼         ▼             ▼        ▼
           usuarios  catálogo  reservas      carrito  catálogo     ← MySQL :3306
```

| Módulo | Puerto | Responsabilidad |
|--------|--------|-----------------|
| `Servidor-Eureka` | 8761 | Registro y descubrimiento de servicios |
| `Gateway` | 8080 | Punto de entrada único, rutas y validación del JWT |
| `AUTH-SERVICE` | 8099 | Login, registro y usuarios; **emite el JWT** |
| `Micro-Catalogo` | 8090 | Categorías y tratamientos (REST) |
| `Micro-Reservas` | 8092 | Agenda, reservas, pagos, equipo e historial clínico (REST) |
| `Micro-Carrito` | 8093 | Carrito; al confirmar crea la reserva vía Feign |
| `Micro-Soap` | 8098 | Catálogo expuesto por **SOAP** |
| `frontend` | 3000 | Sitio del paciente + panel admin |

**Comunicación interna (Feign, sin pasar por el Gateway):** Reservas → AUTH (¿existe el cliente?) y → Catálogo (precio y duración); Carrito → AUTH, → Catálogo y → Reservas (convierte el carrito en reserva reenviando el token).

---

## 5. Puesta en marcha con Docker (paso a paso)

> **Docker es la forma recomendada.** No necesitas instalar Java, Maven, Node ni MySQL: todo corre en contenedores.

### Paso 1 · Instalar Docker Desktop
1. Descarga **Docker Desktop** desde https://www.docker.com/products/docker-desktop e instálalo (en Windows acepta activar **WSL 2** si lo pide y reinicia).
2. Ábrelo y espera a que diga **"Engine running"**.
3. En **Settings → Resources** asigna al menos **4 GB de RAM** (recomendado 6 GB).

### Paso 2 · Obtener el proyecto
```powershell
git clone <url-del-repositorio> FisioMarca
cd FisioMarca
```
(o copia la carpeta del proyecto y abre una terminal dentro de ella).

### Paso 3 · Levantar todo
```powershell
docker compose up --build -d
```
La **primera vez** tarda ~5-10 minutos: descarga las imágenes base, compila los 7 microservicios y el frontend, y crea la base de datos con los datos demo. Las siguientes veces tarda segundos.

### Paso 4 · Esperar a que esté listo
```powershell
docker compose ps
```
Espera a que todos los servicios digan **`healthy`** (1-2 minutos tras el build). El orden de arranque es automático:

```
mysql ─┬─► auth · catálogo · soap · reservas · carrito ─┐
eureka ┴─► gateway ──────────────────────────────────────┴─► frontend
```

### Paso 5 · Abrir la aplicación

| Qué | Dirección |
|-----|-----------|
| 🌐 **Sitio web** | **http://localhost:3000** |
| Gateway (API) | http://localhost:8080 |
| Panel de Eureka | http://localhost:8761 |
| MySQL (Workbench) | `localhost:3307` · usuario `root` · clave `mysql` |

### Cuentas demo

| Rol | Correo | Contraseña |
|-----|--------|-----------|
| Administrador | `admin@fisiomarca.com` | `Admin123` |
| Paciente | `lucia.fernandez@pacientes.fisiomarca.pe` | `Paciente123` |
| Otros 19 pacientes | `<nombre.apellido>@pacientes.fisiomarca.pe` | `Paciente123` |

---

## 6. Recorrido guiado de la demo

1. **Visitante:** entra a http://localhost:3000, revisa **Servicios** y **Categorías**, cambia el tema con ☀/🌙 y abre el asistente (botón ✨ abajo a la derecha).
2. **Paciente:** inicia sesión como Lucía → añade sesiones al **carrito** → **Agendar y pagar** → elige días y horas → paga con datos de prueba → revisa **Mis citas** y **Perfil → Mi evolución**.
3. **Administrador:** inicia sesión como admin → **Panel** (métricas) → **Agenda** → **Citas** (revisa las pestañas *Pago pendiente*, *Expiradas* y *Canceladas*) → **Historial clínico** → exporta a PDF/Excel → **SOAP Explorer**.
4. **Eureka:** en http://localhost:8761 verás registrados `GATEWAY`, `AUTH-SERVICE`, `MICRO-CATALOGO`, `MICRO-RESERVAS`, `MICRO-CARRITO` y `MICRO-SOAP`.

> Los **pagos pendientes** demo vencen escalonados entre 15 min y 3 h después de crear la base; al vencer pasan solos a *Expiradas*. Para volver a verlos, reinicia la BD (sección 7).

---

## 7. Uso diario de Docker

| Quiero… | Comando |
|---------|---------|
| Encender (ya construido) | `docker compose up -d` |
| Apagar | `docker compose down` |
| Ver el estado | `docker compose ps` |
| Ver logs de un servicio | `docker compose logs -f reservas-service` |
| Aplicar cambios de código de un servicio | `docker compose up --build -d frontend` (o `auth-service`, `gateway-service`…) |
| **Reiniciar la BD con datos demo frescos** | `docker compose down -v` y luego `docker compose up -d` |
| Liberar espacio de builds viejos | `docker builder prune` |

Nombres de servicio: `mysql`, `eureka-server`, `gateway-service`, `auth-service`, `catalogo-service`, `reservas-service`, `carrito-service`, `soap-service`, `frontend`.

> Las fechas de las citas demo se calculan desde el día en que se crea la base. Si pasan varios días, reiníciala para tener citas "de hoy" y "próximas".

---

## 8. Configuración opcional (.env) y asistente IA

Todo funciona **sin configurar nada**. Si quieres cambiar algo, copia `.env.example` como `.env` en la raíz y edítalo:

| Variable | Para qué | Valor por defecto |
|----------|----------|-------------------|
| `MYSQL_ROOT_PASSWORD` | Clave de root del MySQL del contenedor | `mysql` |
| `JWT_SECRET` | Clave del JWT (Base64, mín. 32 bytes), compartida por todos los servicios | incluida |
| `JWT_EXPIRATION` | Vigencia del token en ms | `3600000` (1 h) |
| `ANTHROPIC_API_KEY` | Clave de Claude para el asistente IA | vacía (modo local) |
| `ANTHROPIC_MODEL` | Modelo de Claude | `claude-opus-5-5` |

Después de editar `.env`: `docker compose up -d`.

### Sobre el asistente "Marca"
- **Modo local (por defecto, gratis):** responde con lógica propia del proyecto (`frontend/src/lib/asistente.ts`): botones rápidos, sugerencia de tratamiento por palabras clave y detección de emergencias. No necesita clave ni internet y funciona igual en cualquier PC.
- **Modo IA (opcional):** con `ANTHROPIC_API_KEY` el texto libre lo responde Claude. Es de pago por uso (créditos prepagados en https://platform.claude.com). Si la IA tarda más de 2,5 s se ofrecen los botones, y a los 20 s responde el modo local.
- El archivo `.env` **no se sube a GitHub** (está en `.gitignore`), así que la clave no se filtra. En otra PC hay que crearlo de nuevo.

---

## 9. Rutas del sitio

**Públicas**

| URL | Página |
|-----|--------|
| `/` | Inicio |
| `/servicios` | Tratamientos |
| `/categorias` | Categorías |
| `/login` · `/registro` | Acceso |

**Paciente** (requiere sesión de paciente)

| URL | Página |
|-----|--------|
| `/reservas` | Mis citas |
| `/reservas/nueva` | Agendar y pagar |
| `/reservas/pago/{codigo}` | Pago de una orden |
| `/carrito` · `/perfil` | Carrito · Perfil y evolución |

**Administrador** (requiere sesión de admin)

| URL | Página |
|-----|--------|
| `/dashboard` | Panel de métricas |
| `/dashboard/agenda` · `/dashboard/reservas` | Agenda · Citas por estado |
| `/dashboard/historial` · `/dashboard/transacciones` | Historial clínico · Pagos |
| `/dashboard/equipo` · `/dashboard/usuarios` | Fisioterapeutas y salas · Usuarios |
| `/dashboard/servicios` · `/dashboard/categorias` | Catálogo |
| `/dashboard/soap` | SOAP Explorer |

El archivo `src/proxy.ts` protege las rutas: sin sesión redirige a `/login`, y cada rol solo entra a sus secciones.

> En el código, cada pantalla vive en `frontend/src/vistas/<sección>/<nombre>/<nombre>.tsx` (p. ej. `vistas/dashboard/reservas/reservas.tsx`). Los `page.tsx` de `src/app/` son una línea que Next.js exige para registrar la URL.

---

## 10. API a través del Gateway

Todo entra por **http://localhost:8080**. Respuesta estándar: `{ "success": true, "mensaje": "...", "data": {} }`.

| Ruta | Microservicio |
|------|---------------|
| `/auth/**`, `/usuarios/**` | `AUTH-SERVICE` |
| `/catalogo/**` | `MICRO-CATALOGO` |
| `/reservas/**` | `MICRO-RESERVAS` |
| `/carrito/**` | `MICRO-CARRITO` |
| `/ws/**` | `MICRO-SOAP` |

Detalle de endpoints y ejemplos JSON: [`backend/CONTRATO_FRONTEND.md`](backend/CONTRATO_FRONTEND.md). Explicación de cada microservicio y colección de pruebas en Bruno: [`backend/GUIA_EXPLICATIVA.md`](backend/GUIA_EXPLICATIVA.md).

---

## 11. Seguridad (JWT)

1. **Registro:** `POST /auth/register` crea el usuario con contraseña cifrada con **BCrypt** (rol `CLIENTE`).
2. **Login:** `POST /auth/login` → `AUTH-SERVICE` valida y **firma un JWT (HS256)** con `sub` (email), `roles`, `usuarioId`, `nombre`, `clienteId`, `iat` y `exp`.
3. El frontend envía el token en cada petición: `Authorization: Bearer <token>`.
4. El **Gateway** valida firma y vigencia (si falla → **401**); luego cada microservicio vuelve a validarlo como *Resource Server* y aplica los roles (`hasRole("ADMINISTRADOR")` → **403** si no corresponde).

**Rutas públicas:** `POST /auth/login`, `POST /auth/register`, `POST /usuarios/registrar`, `GET /catalogo/**`, `/ws/**` (SOAP) y `GET /usuarios/clientes/existe/**` (uso interno de Feign).

**Roles:** `CLIENTE` (perfil, reservas, carrito) y `ADMINISTRADOR` (catálogo, agenda completa, panel). Para promover un usuario:
```sql
UPDATE fisiomarca_usuarios.usuarios SET rol = 'ADMINISTRADOR' WHERE email = 'tu@correo.com';
```
y vuelve a iniciar sesión (el rol viaja dentro del token).

> ⚠️ `JWT_SECRET` debe ser **idéntico** en AUTH-SERVICE, Gateway, todos los micros y el frontend. Docker Compose ya lo comparte automáticamente.

---

## 12. Servicio SOAP

- **Tecnología:** Spring Web Services, *contract-first*. Contrato: `backend/Micro-Soap/src/main/resources/wsdl/servicio.xsd` (namespace `http://fisiomarca.com/soap`).
- **WSDL:** http://localhost:8080/ws/servicio.wsdl · **Endpoint:** `POST http://localhost:8080/ws`
- Lee y escribe la tabla `servicios` de `fisiomarca_catalogo` con `JdbcTemplate`.

| Operación | Entrada | Salida |
|-----------|---------|--------|
| `getServiciosRequest` | — | lista de servicios |
| `getServicioRequest` | `id` | un servicio (`bean`) |
| `postServicioRequest` | `bean` | `estado` (filas insertadas) |

```bash
curl -X POST http://localhost:8080/ws -H "Content-Type: text/xml" -d "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:fis=\"http://fisiomarca.com/soap\"><soapenv:Body><fis:getServiciosRequest/></soapenv:Body></soapenv:Envelope>"
```

---

## 13. Base de datos y datos demo

Con Docker, MySQL ejecuta automáticamente los scripts de `SQL/` **la primera vez** (o tras `docker compose down -v`):

| Script | Contenido |
|--------|-----------|
| `SQL/01-fisiomarca.sql` | Crea las 4 bases y carga: admin + 21 pacientes, 5 categorías, 17 tratamientos, 4 fisioterapeutas, 4 salas, ~280 citas en 12 semanas, 112 notas clínicas y carritos a medio armar |
| `SQL/02-estados-pagos.sql` | Reparte pacientes en **Pago pendiente** (10 sesiones / 8 pacientes), **Expiradas** (12 / 12) y **Canceladas** (41 / 21) |

| Base | Usada por |
|------|-----------|
| `fisiomarca_usuarios` | AUTH-SERVICE |
| `fisiomarca_catalogo` | Micro-Catalogo y Micro-Soap |
| `fisiomarca_reservas` | Micro-Reservas |
| `fisiomarca_carrito` | Micro-Carrito |

Horario de la clínica: lunes a sábado, 07:00–12:00 y 14:00–19:00 (hora de Perú). Las fechas se guardan en UTC y el backend trabaja en hora de Lima.

---

## 14. Probar la API con curl

```bash
# 1) Catálogo público (sin token)
curl http://localhost:8080/catalogo/servicios/activos

# 2) Login → copia data.token
curl -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@fisiomarca.com\",\"password\":\"Admin123\"}"

# 3) Ruta protegida con token
curl http://localhost:8080/usuarios/perfil -H "Authorization: Bearer <TOKEN>"

# 4) Ruta de admin
curl http://localhost:8080/reservas/lista -H "Authorization: Bearer <TOKEN>"

# 5) Prueba negativa: sin token → 401
curl -i http://localhost:8080/usuarios/perfil
```

---

## 15. Estructura del proyecto

```
FisioMarca/
├─ backend/
│  ├─ Servidor-Eureka/        cada microservicio: pom.xml · src/ · Dockerfile
│  ├─ Gateway/
│  ├─ AUTH-SERVICE/
│  ├─ Micro-Catalogo/
│  ├─ Micro-Reservas/
│  ├─ Micro-Carrito/
│  ├─ Micro-Soap/
│  ├─ CONTRATO_FRONTEND.md    endpoints y ejemplos JSON
│  └─ GUIA_EXPLICATIVA.md     explicación de cada pieza + pruebas en Bruno
├─ frontend/
│  ├─ src/
│  │  ├─ app/                 rutas de Next.js (page.tsx, layouts, /api/chat)
│  │  ├─ vistas/              una carpeta por pantalla (sitio/… y dashboard/…)
│  │  ├─ components/          componentes compartidos (navbar, admin, carrito…)
│  │  ├─ lib/                 servicios de API, sesión, tema, asistente
│  │  └─ proxy.ts             protección de rutas por rol
│  ├─ public/images/          imágenes de tratamientos y categorías
│  └─ Dockerfile
├─ SQL/
│  ├─ 01-fisiomarca.sql
│  └─ 02-estados-pagos.sql
├─ docker-compose.yml         levanta MySQL + 7 microservicios + frontend
├─ .env.example               variables opcionales
└─ README.md
```

---

## 16. Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| `docker: command not found` / no conecta | Docker Desktop cerrado | Ábrelo y espera "Engine running" |
| Un servicio queda `unhealthy` o se reinicia | Poca RAM para Docker | Sube la RAM a 6 GB en Settings → Resources y `docker compose up -d` |
| `port is already allocated` (3000, 8080 u 8761) | Otro programa usa ese puerto (p. ej. el proyecto corriendo fuera de Docker) | Ciérralo y vuelve a ejecutar `docker compose up -d` |
| `503` justo después de arrancar | Eureka aún propaga los servicios | Espera ~15 s y recarga |
| `401` en todo | Token vencido (1 h) | Vuelve a iniciar sesión |
| `403` siendo admin | El token es anterior al cambio de rol | Cierra sesión y vuelve a entrar |
| No hay pagos pendientes ni citas "de hoy" | Los datos demo son relativos al día de carga | `docker compose down -v` y `docker compose up -d` |
| El asistente solo da respuestas fijas | No hay `ANTHROPIC_API_KEY` (modo local, es lo esperado) | Opcional: agrega la clave en `.env` (sección 8) |
| Cambié código y no se ve | La imagen es la anterior | `docker compose up --build -d <servicio>` |

---

## 17. Ejecutar sin Docker (opcional)

Requiere **Java 17**, **MySQL 8**, **Node 24** y **pnpm** instalados.

1. Carga la base (una vez):
   ```powershell
   mysql -u root -pmysql --default-character-set=utf8mb4 -e "source SQL/01-fisiomarca.sql; source SQL/02-estados-pagos.sql"
   ```
2. Levanta cada microservicio en su propia terminal, **en este orden**, desde `backend/<módulo>`:
   `Servidor-Eureka` → `AUTH-SERVICE` → `Gateway` → `Micro-Catalogo` → `Micro-Soap` → `Micro-Reservas` → `Micro-Carrito`
   ```powershell
   .\mvnw.cmd spring-boot:run
   ```
   Si tu MySQL no usa `root / mysql`, define antes `DB_USUARIOS_PASSWORD`, `DB_CATALOGO_PASSWORD`, `DB_RESERVAS_PASSWORD`, `DB_CARRITO_PASSWORD` y `DB_SOAP_PASSWORD`.
3. Frontend:
   ```powershell
   cd frontend
   pnpm install
   pnpm dev
   ```
4. Abre http://localhost:3000.
