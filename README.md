# 🚀 Star5 Timesheet Backend API

Backend completo para el sistema de gestión de hojas de tiempo de Star5 Agency.

## 📋 Características

- ✅ **Autenticación JWT** con roles (Employee, Manager, Finance Admin, Super Admin)
- ✅ **Gestión de Usuarios** y Departamentos
- ✅ **Clientes, Marcas, Campañas y Proyectos** (jerarquía completa)
- ✅ **Time Entries** (entradas de tiempo diarias)
- ✅ **Timesheets** semanales con workflow de aprobación
- ✅ **Sistema de Aprobaciones** para managers
- ✅ **Reportes** y estadísticas
- ✅ **Control de acceso** basado en roles
- ✅ **Base de datos PostgreSQL** con Prisma ORM
- ✅ **TypeScript** para type safety

## 🛠️ Stack Tecnológico

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: express-validator
- **Seguridad**: Helmet, CORS

## 📁 Estructura del Proyecto

```
star5-timesheet-backend/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   └── seed.ts                # Datos de ejemplo
├── src/
│   ├── config/
│   │   ├── index.ts           # Configuración general
│   │   └── database.ts        # Cliente de Prisma
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── timeEntry.controller.ts
│   │   ├── timesheet.controller.ts
│   │   └── project.controller.ts
│   ├── middleware/
│   │   ├── auth.ts            # Autenticación y autorización
│   │   └── errorHandler.ts   # Manejo de errores
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── timeEntry.routes.ts
│   │   ├── timesheet.routes.ts
│   │   ├── project.routes.ts
│   │   └── index.ts
│   ├── utils/
│   │   └── jwt.ts             # Utilidades JWT
│   ├── app.ts                 # Configuración de Express
│   └── server.ts              # Punto de entrada
├── .env.example
├── package.json
└── tsconfig.json
```

## 🚀 Instalación y Configuración

### 1. Clonar o copiar el proyecto

```bash
cd star5-timesheet-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/star5_timesheet?schema=public"
JWT_SECRET=your-super-secret-jwt-key
```

### 4. Configurar PostgreSQL

Asegúrate de tener PostgreSQL instalado y corriendo. Crea la base de datos:

```bash
createdb star5_timesheet
```

O usando SQL:
```sql
CREATE DATABASE star5_timesheet;
```

### 5. Ejecutar migraciones de Prisma

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 6. Poblar la base de datos con datos de ejemplo

```bash
npm run seed
```

Esto creará:
- 4 Departamentos (Design, Development, Copywriting, Strategy)
- 4 Usuarios de prueba
- 2 Clientes (Nike, Coca-Cola)
- Marcas, campañas y proyectos
- Tareas y time entries de ejemplo

### 7. Iniciar el servidor

**Modo desarrollo (con hot-reload):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm run build
npm start
```

El servidor estará disponible en: `http://localhost:3000`

## 🔑 Credenciales de Prueba

Después de ejecutar el seed, puedes usar estas credenciales:

| Rol          | Email                | Password    |
|------------- |---------------------|-------------|
| Super Admin  | admin@star5.com     | password123 |
| Manager      | manager@star5.com   | password123 |
| Employee     | maria@star5.com     | password123 |
| Employee     | juan@star5.com      | password123 |

## 📚 API Endpoints

### Autenticación

#### POST `/api/v1/auth/register`
Registrar un nuevo usuario.

**Body:**
```json
{
  "email": "user@star5.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "EMPLOYEE",
  "departmentId": "dept-id"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": { ... },
  "token": "jwt-token",
  "refreshToken": "refresh-token"
}
```

#### POST `/api/v1/auth/login`
Iniciar sesión.

**Body:**
```json
{
  "email": "maria@star5.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "email": "maria@star5.com",
    "firstName": "Maria",
    "lastName": "Rodriguez",
    "role": "EMPLOYEE",
    "department": { ... }
  },
  "token": "jwt-token",
  "refreshToken": "refresh-token"
}
```

#### GET `/api/v1/auth/me`
Obtener perfil del usuario actual.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "maria@star5.com",
    "firstName": "Maria",
    "lastName": "Rodriguez",
    "role": "EMPLOYEE",
    "position": "Senior Designer",
    "department": { ... },
    "manager": { ... }
  }
}
```

### Time Entries

#### POST `/api/v1/time-entries`
Crear una entrada de tiempo.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "projectId": "project-id",
  "taskId": "task-id",
  "date": "2024-01-15",
  "hours": 8,
  "isBillable": true,
  "hourlyRate": 75,
  "notes": "Working on campaign designs"
}
```

#### GET `/api/v1/time-entries`
Obtener entradas de tiempo.

**Query params:**
- `startDate`: Fecha inicio (YYYY-MM-DD)
- `endDate`: Fecha fin (YYYY-MM-DD)
- `projectId`: ID del proyecto (opcional)
- `userId`: ID del usuario (solo para managers/admins)

#### GET `/api/v1/time-entries/weekly-summary`
Obtener resumen semanal de horas.

**Query params:**
- `startDate`: Fecha inicio de la semana
- `endDate`: Fecha fin de la semana

**Response:**
```json
{
  "summary": {
    "totalHours": 42.5,
    "billableHours": 38,
    "nonBillableHours": 4.5,
    "billablePercentage": 89.4
  },
  "byDay": {
    "2024-01-15": 8,
    "2024-01-16": 8.5,
    ...
  },
  "byProject": [
    {
      "name": "Nike Campaign",
      "client": "Nike",
      "hours": 20
    }
  ]
}
```

### Timesheets

#### POST `/api/v1/timesheets`
Crear u obtener timesheet de una semana.

**Body:**
```json
{
  "weekStart": "2024-01-15"
}
```

#### POST `/api/v1/timesheets/:id/submit`
Enviar timesheet para aprobación.

#### GET `/api/v1/timesheets/:id`
Obtener detalles de un timesheet.

#### GET `/api/v1/timesheets/pending-approvals`
Obtener timesheets pendientes de aprobación (solo Managers/Admins).

#### POST `/api/v1/timesheets/:id/approve`
Aprobar un timesheet (solo Managers/Admins).

#### POST `/api/v1/timesheets/:id/reject`
Rechazar un timesheet (solo Managers/Admins).

**Body:**
```json
{
  "rejectionReason": "Missing hours for Tuesday. Please update."
}
```

### Projects

#### GET `/api/v1/projects`
Obtener lista de proyectos.

**Query params:**
- `status`: Filtrar por estado (PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED)
- `clientId`: Filtrar por cliente
- `search`: Buscar por nombre o código

**Response:**
```json
{
  "projects": [
    {
      "id": "...",
      "name": "Nike Campaign - Q4",
      "code": "PRJ-001",
      "status": "ACTIVE",
      "client": {
        "name": "Nike",
        "color": "#000000"
      },
      "estimatedHours": 100,
      "actualHours": 45,
      "progress": 45,
      "budgetAmount": 15000
    }
  ]
}
```

#### GET `/api/v1/projects/:id`
Obtener detalles de un proyecto.

#### GET `/api/v1/projects/:id/tasks`
Obtener tareas de un proyecto.

#### POST `/api/v1/projects`
Crear un proyecto (solo Managers/Admins).

#### PUT `/api/v1/projects/:id`
Actualizar un proyecto (solo Managers/Admins).

#### DELETE `/api/v1/projects/:id`
Eliminar un proyecto (solo Super Admin).

## 🎭 Roles y Permisos

| Acción | Employee | Manager | Finance Admin | Super Admin |
|--------|----------|---------|---------------|-------------|
| Ver propias time entries | ✅ | ✅ | ✅ | ✅ |
| Crear time entries | ✅ | ✅ | ✅ | ✅ |
| Ver time entries de otros | ❌ | ✅ | ✅ | ✅ |
| Aprobar timesheets | ❌ | ✅ | ❌ | ✅ |
| Ver todos los proyectos | ✅ | ✅ | ✅ | ✅ |
| Crear/editar proyectos | ❌ | ✅ | ✅ | ✅ |
| Eliminar proyectos | ❌ | ❌ | ❌ | ✅ |
| Ver reportes financieros | ❌ | ✅ | ✅ | ✅ |

## 🗄️ Modelo de Datos

### Entidades Principales

1. **User**: Usuarios del sistema
2. **Department**: Departamentos de la agencia
3. **Client**: Clientes de la agencia
4. **Brand**: Marcas de los clientes
5. **Campaign**: Campañas de marketing
6. **Project**: Proyectos específicos
7. **Task**: Tareas dentro de proyectos
8. **TimeEntry**: Entradas de tiempo diarias
9. **Timesheet**: Hojas de tiempo semanales
10. **TimesheetApproval**: Aprobaciones de timesheets

### Jerarquía

```
Client
  └─ Brand
      └─ Campaign
          └─ Project
              └─ Task
                  └─ TimeEntry
```

## 🔧 Scripts de Desarrollo

```bash
# Desarrollo con hot-reload
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar en producción
npm start

# Generar cliente de Prisma
npm run prisma:generate

# Crear migración
npm run prisma:migrate

# Ver base de datos con Prisma Studio
npm run prisma:studio

# Poblar base de datos
npm run seed
```

## 📊 Prisma Studio

Para explorar y editar la base de datos visualmente:

```bash
npm run prisma:studio
```

Abrirá en: `http://localhost:5555`

## 🐛 Debugging

Para habilitar logs detallados de Prisma:

```env
# .env
DATABASE_URL="postgresql://..."
DEBUG="prisma:*"
```

## 🌐 CORS

Por defecto, el backend acepta peticiones de:
- `http://localhost:3001`
- `http://localhost:5173`

Para agregar más orígenes, edita la variable `CORS_ORIGIN` en `.env`:

```env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,https://star5.com
```

## 📝 Notas de Implementación

### Workflow de Timesheets

1. **DRAFT**: El empleado crea y edita su timesheet durante la semana
2. **SUBMITTED**: El empleado envía el timesheet para aprobación
3. **APPROVED**: El manager aprueba el timesheet
4. **REJECTED**: El manager rechaza el timesheet con comentarios

### Cálculos Automáticos

- El backend calcula automáticamente:
  - Total de horas por timesheet
  - Horas billables vs no-billables
  - Porcentaje de utilización
  - Progreso de proyectos vs presupuesto

### Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- Tokens JWT con expiración configurable
- Middleware de autenticación en todas las rutas protegidas
- Validación de permisos basada en roles
- Headers de seguridad con Helmet

## 🚀 Deployment

### Variables de Entorno para Producción

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/star5_production
JWT_SECRET=your-production-secret-key-very-long-and-secure
CORS_ORIGIN=https://yourdomain.com
```

### Recomendaciones

1. Usa una base de datos PostgreSQL administrada (AWS RDS, Digital Ocean, Heroku Postgres)
2. Configura un JWT_SECRET fuerte y único
3. Habilita SSL para la conexión a la base de datos
4. Usa un servicio de logging (LogRocket, Sentry)
5. Configura rate limiting para prevenir abuso

## 📞 Soporte

Para preguntas o problemas, contacta al equipo de Star5.

---

**Desarrollado con ❤️ para Star5 Agency**
