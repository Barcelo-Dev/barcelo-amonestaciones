# Control de Amonestaciones — Operadora de Servicios Varios, S.A.

Aplicación de control de régimen disciplinario (Barceló Guatemala City). **Next.js 14 + React + TypeScript**, base de datos en **Supabase (PostgreSQL)**. Diseñada para desplegarse de forma nativa en Vercel.

## Arquitectura

- Toda la interfaz vive en una sola página (`src/app/page.tsx`) que cambia de vista internamente según la navegación — no hay recarga de página entre pantallas.
- El backend son **Route Handlers** de Next.js bajo `src/app/api/`, uno por endpoint. Reutilizan la misma capa de servicios (`src/services/`) que accede a Supabase con la **Service Role Key** (nunca expuesta al navegador).
- Autenticación propia (no usa Supabase Auth): usuario + contraseña con bcrypt, sesión en cookie `httpOnly` firmada con JWT.
- RLS activado en todas las tablas sin políticas para `anon`/`authenticated`, ya que solo el backend accede (con la Service Role Key, que omite RLS).

## 1. Crear el proyecto en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **Project Settings → API**, copia el `Project URL` y la clave `service_role` (no la `anon`).
3. En el **SQL Editor**, corre en este orden:
   1. `supabase/schema.sql`
   2. `supabase/seed_faults.sql`
   3. `supabase/seed_employees.sql` (opcional)
   4. `supabase/schema_templates.sql`
   5. `supabase/seed_templates.sql`

## 2. Configurar y ejecutar localmente

```bash
npm install
cp .env.example .env.local
```

Completa `.env.local` con tus valores reales de Supabase y un `JWT_SECRET` propio (genera uno con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).

```bash
npm run dev
```

Abre `http://localhost:3000`. Usuario inicial: `admin` / `admin123` (cámbialo de inmediato desde "Usuarios").

## 3. Pruebas

```bash
npm test
```

Corre con `node --test` usando `tsx` para ejecutar TypeScript directamente. Las pruebas llaman a los Route Handlers de la API de forma directa (sin necesidad de levantar un servidor), simulando la sesión con una cookie JWT firmada, y usan **mocks** de la capa de servicios en vez de conectarse a un Supabase real.

```bash
npm run typecheck
```

## 4. Desplegar en Vercel

Este proyecto está pensado para Vercel sin configuración adicional:

1. Sube el proyecto a GitHub.
2. En Vercel, importa el repositorio (detecta Next.js automáticamente).
3. En **Environment Variables**, agrega: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `JWT_EXPIRES_IN`.
4. Deploy. No hace falta anular el "Build Command" ni agregar adaptadores — Next.js ya es el framework nativo de Vercel.

## 5. Estructura del proyecto

```
src/
  app/
    page.tsx              Página única (login / panel según sesión)
    layout.tsx             Layout raíz, fuentes, CSS global
    globals.css             Estilos (idénticos a la versión anterior)
    api/                    Route Handlers, uno por endpoint
  components/               Componentes React de cada vista
  services/                  Acceso a datos (Supabase), sin cambios de lógica
  lib/
    types.ts                 Tipos del dominio compartidos
    context.tsx               Estado global de la app (React Context)
    api.ts                     Cliente fetch del navegador
    discipline.ts               Motor de sugerencia de disciplina progresiva
    letters.ts                   Sustitución de marcadores {{...}} en las cartas
    format.ts, auth.ts, jwt.ts, env.ts, supabaseClient.ts

supabase/                    Mismos scripts SQL de la versión anterior
public/assets/                Logos, ícono, fondo de login, ejemplo de plantilla
tests/                         Pruebas con node:test + tsx
```

## 6. Notas de seguridad

- Nunca pongas `SUPABASE_SERVICE_ROLE_KEY` en código del navegador.
- El respaldo (`/api/backup`) incluye los hashes bcrypt de las contraseñas de los usuarios del sistema — trata esos archivos `.json` como información sensible.
- Cambia `JWT_SECRET` por un valor propio y aleatorio antes de usar esto con datos reales.
