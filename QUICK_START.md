# 🚀 Guía de Inicio Rápido - Star5 Timesheet Backend

## Pre-requisitos

- Node.js 18+ instalado
- PostgreSQL 14+ instalado y corriendo
- Git instalado

## Paso 1: Configurar PostgreSQL

```bash
# Crear la base de datos
createdb star5_timesheet

# O usando psql:
psql -U postgres
CREATE DATABASE star5_timesheet;
\q
```

## Paso 2: Configurar el Proyecto

```bash
# Ir al directorio del proyecto
cd star5-timesheet-backend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL
# DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/star5_timesheet?schema=public"
```

## Paso 3: Configurar la Base de Datos

```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev --name init

# Poblar con datos de ejemplo
npm run seed
```

## Paso 4: Iniciar el Servidor

```bash
# Modo desarrollo (con hot-reload)
npm run dev

# El servidor estará en: http://localhost:3000
```

## ✅ Verificar que Todo Funciona

### 1. Health Check

```bash
curl http://localhost:3000/api/v1/health
```

Debe responder:
```json
{
  "status": "OK",
  "timestamp": "...",
  "service": "Star5 Timesheet API"
}
```

### 2. Login de Prueba

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@star5.com",
    "password": "password123"
  }'
```

Debe retornar un token JWT.

### 3. Obtener Proyectos

```bash
# Reemplaza TOKEN con el token del login
curl http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer TOKEN"
```

## 📧 Credenciales de Prueba

Después del seed, puedes usar:

| Email | Password | Rol |
|-------|----------|-----|
| admin@star5.com | password123 | Super Admin |
| manager@star5.com | password123 | Manager |
| maria@star5.com | password123 | Employee |
| juan@star5.com | password123 | Employee |

## 🎯 Próximos Pasos

1. **Importar colección de Postman**: `Star5-API.postman_collection.json`
2. **Explorar la base de datos**: `npm run prisma:studio`
3. **Leer documentación completa**: Ver `README.md`
4. **Ver arquitectura**: Ver `ARCHITECTURE.md`

## 🐛 Solución de Problemas Comunes

### Error: Database connection failed

```bash
# Verificar que PostgreSQL está corriendo
pg_isready

# Verificar credenciales en .env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DB_NAME"
```

### Error: Port 3000 already in use

```bash
# Cambiar puerto en .env
PORT=3001

# O matar el proceso en 3000
lsof -ti:3000 | xargs kill
```

### Error: Prisma Client not generated

```bash
npx prisma generate
```

## 📚 Comandos Útiles

```bash
# Ver logs de la base de datos
npm run prisma:studio

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Reset completo de la base de datos
npx prisma migrate reset

# Ver esquema en formato legible
npx prisma format

# Compilar para producción
npm run build

# Ejecutar en producción
npm start
```

## 🎉 ¡Listo!

Ahora tienes el backend completamente funcional. Puedes:
- Crear usuarios y autenticarte
- Gestionar proyectos y tareas
- Registrar time entries
- Aprobar timesheets
- Ver reportes

---

Para más información, consulta el `README.md` completo.
