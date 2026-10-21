# Contrato para el frontend

Base URL (a través del Gateway): `http://localhost:8080`

Todas las respuestas REST de negocio usan la misma forma:

```json
{
  "success": true,
  "mensaje": "...",
  "data": {}
}
```

---

## 1. Registro de usuario

`POST /usuarios/registrar` (o su alias `POST /auth/register`)

```json
{
  "nombreCompleto": "Juan Perez",
  "email": "juan@gmail.com",
  "telefono": "999999999",
  "password": "123456",
  "confirmarPassword": "123456"
}
```

El usuario se crea con rol `CLIENTE` y además se crea su `Cliente` asociado (por eso `data.clienteId` es importante).

---

## 2. Login (emite el JWT)

`POST /auth/login`

```json
{
  "email": "juan@gmail.com",
  "password": "123456"
}
```

Respuesta:

```json
{
  "success": true,
  "mensaje": "Inicio de sesión correcto",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9....",
    "tipo": "Bearer",
    "expiraEn": 3600000,
    "nombre": "Juan Perez",
    "rol": "CLIENTE",
    "clienteId": 1
  }
}
```

En cada petición posterior el frontend debe enviar:

```
Authorization: Bearer <token>
```

> Ya **no** se usa OAuth2 / Authorization Code + PKCE. El login es directo y devuelve el token.

---

## 3. Perfil

Token requerido.

- `GET /usuarios/perfil`
- `PUT /usuarios/perfil`

```json
{
  "nombreCompleto": "Juan Perez",
  "telefono": "999999999"
}
```

- `PUT /usuarios/cambiar-password`

```json
{
  "passwordActual": "123456",
  "passwordNueva": "654321",
  "confirmarPassword": "654321"
}
```

---

## 4. Catálogo

Públicos (no requieren token):

- `GET /catalogo/categorias/lista`
- `GET /catalogo/categorias/buscar/{id}`
- `GET /catalogo/servicios/activos`
- `GET /catalogo/servicios/buscar/{id}`
- `GET /catalogo/servicios/filtro?q=masaje&maxPrecio=100&categoriaId=4`

Administrador (token con rol `ADMINISTRADOR`):

- `POST /catalogo/categorias/registrar`
- `PUT /catalogo/categorias/actualizar`
- `POST /catalogo/servicios/registrar`
- `PUT /catalogo/servicios/actualizar`
- `PUT /catalogo/servicios/estado/{id}?activo=false`

Servicio de ejemplo:

```json
{
  "nombre": "Masaje deportivo",
  "descripcion": "Recuperación muscular",
  "precio": 70.00,
  "duracionMinutos": 45,
  "imagenUrl": "/images/services/masaje.jpeg",
  "activo": true,
  "categoriaId": 4
}
```

---

## 5. Disponibilidad y reservas

Token requerido.

Disponibilidad:

`GET /reservas/disponibilidad?fecha=2026-10-20&servicioIds=3&servicioIds=10`

Crear:

`POST /reservas/registrar`

```json
{
  "clienteId": 1,
  "fechaHoraInicio": "2026-10-20T10:00:00",
  "servicioIds": [3, 10],
  "notas": "Dolor lumbar"
}
```

El backend calcula precio total, duración y hora de fin.

Otros:

- `GET /reservas/cliente/{clienteId}`
- `GET /reservas/buscar/{id}`
- `PUT /reservas/cancelar/{id}`
- `PUT /reservas/reprogramar/{id}` body: `{ "fechaHoraInicio": "2026-10-21T14:00:00" }`

Administrador:

- `GET /reservas/lista`
- `GET /reservas/dashboard?desde=2026-10-01&hasta=2026-10-31`
- `PUT /reservas/atender/{id}`

---

## 6. Carrito

Token requerido.

Ver:

- `GET /carrito/{clienteId}`

Agregar:

- `POST /carrito/items`

```json
{
  "clienteId": 1,
  "servicioId": 3,
  "cantidad": 1
}
```

Modificar cantidad:

- `PUT /carrito/{clienteId}/items/{itemId}?cantidad=2`

Eliminar:

- `DELETE /carrito/{clienteId}/items/{itemId}`

Vaciar:

- `DELETE /carrito/{clienteId}/vaciar`

Confirmar carrito y crear reserva:

- `POST /carrito/{clienteId}/confirmar`

```json
{
  "fechaHoraInicio": "2026-10-20T10:00:00",
  "notas": "Primera sesión"
}
```

---

## 7. Servicio SOAP (catálogo)

El catálogo también se expone por **SOAP** (puerto `8098`, y a través del Gateway en `/ws/**`).

- WSDL directo: `http://localhost:8098/ws/servicio.wsdl`
- Endpoint SOAP directo: `POST http://localhost:8098/ws`
- A través del Gateway: `POST http://localhost:8080/ws`

Namespace: `http://fisiomarca.com/soap`

Operaciones:

- `getServiciosRequest` → lista de servicios
- `getServicioRequest` (`id`) → un servicio
- `postServicioRequest` (`bean`) → registra un servicio (devuelve `estado`)

Ejemplo `getServiciosRequest`:

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:fis="http://fisiomarca.com/soap">
  <soapenv:Header/>
  <soapenv:Body>
    <fis:getServiciosRequest/>
  </soapenv:Body>
</soapenv:Envelope>
```

Ejemplo `getServicioRequest`:

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:fis="http://fisiomarca.com/soap">
  <soapenv:Header/>
  <soapenv:Body>
    <fis:getServicioRequest>
      <fis:id>1</fis:id>
    </fis:getServicioRequest>
  </soapenv:Body>
</soapenv:Envelope>
```

---

## 8. Roles

- `CLIENTE`
- `ADMINISTRADOR`

El JWT contiene el arreglo `roles` y también `clienteId`, de modo que el frontend puede saber qué cliente autenticado está trabajando.

---

## 9. Imágenes

Los archivos recuperados del proyecto .NET ya están en `frontend/public/images/services` (se sirven como `/images/services/...`).
