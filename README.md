# Embudo Quirúrgico — Guía de puesta en marcha

Esta guía está escrita para alguien sin conocimientos técnicos. Sigue los
pasos en orden. No necesitas instalar nada en tu computadora ni usar la
línea de comandos.

> **¿Ya tenías este sistema funcionando antes?** El archivo
> `supabase/schema.sql` de esta versión está escrito para poder pegarse
> de nuevo sin dañar lo que ya tenías: actualiza automáticamente la
> lista de médicos, las especialidades, los tipos de paciente y los
> estados de cada caso a la nueva estructura, conservando los datos que
> ya habías cargado (solo se les actualiza el texto a la nueva
> nomenclatura). Simplemente vuelve a pegar todo el archivo en el SQL
> Editor y presiona "Run".

## Parte 1 — Crear la base de datos en Supabase

1. Entra a [supabase.com](https://supabase.com) e inicia sesión.
2. Crea un proyecto nuevo (elige cualquier nombre y contraseña de base de
   datos; guarda esa contraseña en un lugar seguro, aunque no la usarás en
   la aplicación).
3. Cuando el proyecto esté listo, en el menú de la izquierda entra a
   **SQL Editor**.
4. Haz clic en **New query**.
5. Abre el archivo `supabase/schema.sql` que viene en esta carpeta, copia
   **todo** su contenido, y pégalo en el editor.
6. Presiona **Run**. Esto crea todas las tablas, la seguridad y los datos
   iniciales, en un solo paso. Solo tienes que hacerlo una vez.

## Parte 2 — Crear tu primer usuario administrador

1. En el menú de la izquierda entra a **Authentication** → **Users**.
2. Haz clic en **Add user** → **Create new user**.
3. Escribe tu correo y una contraseña. Marca la opción para confirmar el
   correo automáticamente si Supabase la muestra.
4. Vuelve a **SQL Editor**, crea una nueva consulta, y pega esta línea
   (cambiando el correo por el que acabas de usar):

   ```sql
   update public.profiles set role = 'admin'
     where id = (select id from auth.users where email = 'tu_correo@ejemplo.com');
   ```

5. Presiona **Run**. Con esto, tu usuario ya es administrador.

   Este es el único usuario que crearás manualmente desde Supabase. Todos
   los demás (personal comercial, otros administradores) se crean después
   desde dentro del propio sistema, en la sección **Usuarios**.

> Nota: por configuración predeterminada, Supabase puede pedir que un
> usuario nuevo confirme su correo antes de poder ingresar. Si prefieres
> que los usuarios creados desde el panel de administración puedan
> ingresar de inmediato sin ese paso, ve a **Authentication** → **Providers**
> → **Email** y desactiva la opción "Confirm email".

## Parte 3 — Obtener las dos claves de conexión

1. En el menú de la izquierda entra a **Project Settings** → **API**.
2. Copia dos valores:
   - **Project URL**
   - **anon public key** (también llamada "Publishable key")

Vas a necesitar estos dos valores en el siguiente paso. Son las únicas
dos variables que la aplicación necesita.

## Parte 4 — Publicar la aplicación en Netlify

1. Sube el contenido de esta carpeta a un repositorio de GitHub (puedes
   arrastrar los archivos directamente en la web de GitHub si no usas Git).
2. Entra a [netlify.com](https://netlify.com) e inicia sesión.
3. Haz clic en **Add new site** → **Import an existing project**.
4. Elige el repositorio que acabas de subir.
5. Netlify detectará automáticamente la configuración (ya está incluida
   en el archivo `netlify.toml`). No necesitas cambiar nada ahí.
6. Antes de terminar, busca la sección **Environment variables** y agrega
   estas dos:

   | Variable | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | (el Project URL que copiaste) |
   | `VITE_SUPABASE_ANON_KEY` | (el anon public key que copiaste) |

7. Haz clic en **Deploy site**. Cuando termine, Netlify te dará una
   dirección web pública (algo como `tu-sitio.netlify.app`). Esa es la
   URL donde vas a probar todo.

## Parte 5 — Archivos de imágenes o documentos (Supabase Storage)

Esta primera versión **no necesita Supabase Storage**: no se suben
imágenes ni archivos PDF todavía. Si más adelante se necesita adjuntar
documentos (por ejemplo, presupuestos en PDF), se indicará en ese momento
el nombre exacto del bucket a crear y si debe ser público o privado.

---

## Resumen rápido — checklist final

**En Supabase:**
- [ ] Crear el proyecto.
- [ ] Ejecutar una sola vez el archivo `supabase/schema.sql` en el SQL Editor.
- [ ] Crear el primer usuario administrador desde Authentication → Users.
- [ ] Ejecutar la línea SQL que le da el rol de administrador a ese usuario.
- [ ] Copiar el Project URL y el anon public key desde Project Settings → API.

**En Netlify:**
- [ ] Subir el código a GitHub.
- [ ] Conectar el repositorio en Netlify.
- [ ] Agregar las dos variables de entorno (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).
- [ ] Desplegar y abrir la URL pública.

**Para probar:**
- [ ] Ingresar con el usuario administrador.
- [ ] Crear una oportunidad quirúrgica de prueba (probar también la opción "OTRO" en médico).
- [ ] Verificar que se generó automáticamente un N° de cotización (formato COT-0001).
- [ ] Desde "Cirugías efectivas", cambiar el estado de esa oportunidad con el menú desplegable.
- [ ] Desde "Seguimientos", abrir "Gestionar" en un caso activo y registrar un contacto.
- [ ] Probar la clasificación "Sin seguimiento" (no debe pedir medio de contacto) y luego "Con seguimiento" (sí debe pedirlo).
- [ ] Crear un segundo usuario (staff comercial) desde la sección Usuarios.
- [ ] Cerrar sesión e ingresar con ese segundo usuario para confirmar que
      ve la información según su rol (sin montos).
- [ ] Actualizar la página estando en una ruta interna (por ejemplo,
      `/oportunidades`) para confirmar que no se rompe (esto prueba la
      configuración de Netlify para aplicaciones de una sola página).
