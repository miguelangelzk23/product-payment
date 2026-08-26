# NestJS + Prisma + Supabase API - Proyecto Base de Aprendizaje

Este proyecto fue desarrollado como un ejercicio intensivo para dominar los fundamentos de desarrollo backend moderno utilizando **NestJS**. 

Este documento sirve como un portafolio de habilidades y como contexto para futuros Agentes de IA que me asistan en proyectos más complejos, para que conozcan mi nivel técnico actual y las mejores prácticas que ya domino.

## 🚀 Stack Tecnológico Dominado
- **Framework:** NestJS (TypeScript)
- **Base de Datos:** PostgreSQL (Alojado en Supabase)
- **ORM:** Prisma ORM
- **Validación:** `class-validator` y `class-transformer`
- **Documentación:** Swagger / OpenAPI
- **Testing:** Jest

## 🧠 Habilidades y Conceptos Arquitectónicos Implementados

### 1. Modularidad y Arquitectura (NestJS Core)
- Creación de una arquitectura limpia separando responsabilidades en **Módulos**, **Controladores** y **Servicios**.
- Implementación del patrón de **Inyección de Dependencias** (ej. inyectando `PrismaService` dentro de `TasksService`).
- Configuración de Módulos compartidos y exportables (ej. `PrismaModule` exportando `PrismaService` para que `TasksModule` lo consuma).

### 2. Controladores y Enrutamiento RESTful
- Manejo de verbos HTTP estándar (`@Get()`, `@Post()`, `@Patch()`, `@Delete()`).
- Extracción de datos de la petición usando decoradores (`@Body()`, `@Param()`).
- Resolución asíncrona mediante `async/await` y retorno de `Promise<T>`.

### 3. Validación de Datos (DTOs)
- Implementación de **Data Transfer Objects (DTOs)** para definir contratos estrictos en las peticiones.
- Uso del `ValidationPipe` global en `main.ts` para rechazar peticiones mal formadas automáticamente.
- Validaciones avanzadas usando decoradores como `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, e `@IsEnum()`.
- Reutilización inteligente de DTOs utilizando `PartialType()` para las rutas de actualización (PATCH).

### 4. Base de Datos (Prisma + Supabase)
- Conexión exitosa a una base de datos PostgreSQL en la nube (Supabase) manejando strings de conexión en un archivo `.env`.
- Modelado de datos declarativo en `schema.prisma`, incluyendo el uso de UUIDs automáticos (`@default(uuid())`), Enums y timestamps automáticos (`createdAt`, `updatedAt`).
- Ejecución de migraciones (`prisma migrate dev`) para sincronizar el esquema con la base de datos real.
- Uso fluido del **Prisma Client** para ejecutar operaciones CRUD (`findMany`, `findUnique`, `create`, `update`, `delete`).

### 5. Manejo de Errores
- Lanzamiento de excepciones HTTP controladas, como `NotFoundException`, garantizando que la API responda con los códigos de estado correctos (Ej. HTTP 404) cuando no se encuentran registros en la base de datos.

### 6. Documentación Automática
- Integración de **Swagger** (`@nestjs/swagger`) para generar documentación de API interactiva en el endpoint `/api`.
- Enriquecimiento de esquemas visuales de Swagger utilizando `@ApiProperty()` en los DTOs para proveer ejemplos automáticos de los payloads esperados.

### 7. Testing Profesional (Unit Testing con Jest)
- Comprensión y creación de pruebas unitarias para aislar la lógica de negocio.
- Uso intensivo de **Mocks** (`jest.fn()`) para simular la base de datos (Prisma) y evitar tocar servicios externos durante las pruebas.
- Cobertura de pruebas completa (100% de cobertura de líneas en Controladores y Servicios).
- Modificación del archivo `package.json` para ajustar las métricas de cobertura (excluyendo módulos y configuraciones sin lógica de negocio) obteniendo un reporte de **cobertura del 98% a nivel de todo el proyecto**.

---

## 🎯 Instrucciones para el Próximo Agente de IA
Si estás leyendo esto para asistirme en un nuevo proyecto, ten en cuenta lo siguiente:
1. **Conozco los fundamentos:** No necesitas explicarme qué es un Controlador, un Servicio, un DTO o cómo funciona la inyección de dependencias en NestJS.
2. **Prisma y Supabase:** Me siento cómodo configurando y usando Prisma con Postgres. Puedes ir directo al grano con consultas complejas o relaciones entre tablas.
3. **Calidad de Código:** Exijo buenas prácticas. Manten mis DTOs validados, usa manejo de errores adecuado, documenta con Swagger y mantén la arquitectura modular.
4. **Testing:** Entiendo el concepto de Mocking. Si generas nueva lógica compleja, ayúdame a crear sus respectivas pruebas unitarias para mantener mi cobertura alta.

*¡Estoy listo para construir sistemas backend serios y escalables!*
