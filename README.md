# 📦 Supabase Setup – Bar App (Sistema de Pedidos)

Este documento describe la configuración actual de la base de datos y autenticación usando Supabase para el proyecto **Bar App**, enfocado en la gestión de pedidos por roles (mesero, cocina, barra, caja).

---

## 🧱 Tablas Creadas

### 1. `usuarios`

Tabla personalizada para login por nombre de usuario y contraseña.

| Campo       | Tipo       | Descripción                              |
|-------------|------------|------------------------------------------|
| `id`        | int8       | Clave primaria auto-incremental          |
| `username`  | text       | Nombre de usuario único                  |
| `password`  | text       | Contraseña en texto plano (por ahora)    |
| `rol`       | text       | Rol del usuario (mesero, cocina, etc.)   |
| `created_at`| timestamp  | Fecha de creación, default: `now()`      |

🔐 **Row Level Security (RLS):** Activado  
🔁 **Contraseñas encriptadas:** No (por ahora), se agregará soporte con bcrypt posteriormente.

#### Datos de prueba insertados:

| username | password | rol     |
|----------|----------|---------|
| Mesero1  | 1234     | mesero  |
| Mesero2  | 1234     | mesero  |
| cocina   | cocina   | cocina  |
| barman   | barman   | barman  |

---

## 🚫 No se usa Supabase Auth oficial

En lugar del sistema de autenticación por email de Supabase, se usa:
- Un sistema **personalizado** basado en la tabla `usuarios`
- Login manual comparando `username` + `password` con consultas `select`
- Autenticación persistente mediante `localStorage` (en el cliente)

---
