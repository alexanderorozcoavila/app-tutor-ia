Aquí tienes el desglose detallado a nivel de ingeniería para la **Fase 2: Conexión al Backend**.

El objetivo crítico de esta fase es establecer una comunicación segura y eficiente con tu instancia existente de Supabase (la misma que usa el entorno web de `tutor-ia`), manejando correctamente la persistencia de la sesión en un entorno móvil y adaptando la subida de archivos (evidencias fotográficas) a las restricciones nativas de Android.

---

### FASE 2: Conexión al Backend (Base de Datos `tutor-ia`)

#### Paso 2.1: Instalación de Dependencias de Red y Entorno
React Native requiere adaptadores específicos para manejar las peticiones HTTP que hace el SDK de Supabase por debajo, así como el manejo de variables de entorno (ya que no existe un `process.env` nativo como en Node.js).

* **Comando de ejecución:**
    ```bash
    npm install @supabase/supabase-js react-native-url-polyfill
    npm install -D react-native-dotenv
    ```
* **Configuración del Entorno (`babel.config.js`):**
    Añade el plugin de `react-native-dotenv` para poder leer el archivo `.env`.
    ```javascript
    module.exports = {
      presets: ['module:@react-native/babel-preset'],
      plugins: [
        ['module:react-native-dotenv', {
          moduleName: '@env',
          path: '.env',
        }]
      ]
    };
    ```
* **Archivo `.env` en la raíz:**
    ```env
    SUPABASE_URL=tu_url_de_supabase_proyecto_tutor_ia
    SUPABASE_ANON_KEY=tu_anon_key
    ```

#### Paso 2.2: Inicialización Segura del Cliente Supabase
A diferencia de la web donde se usa `localStorage`, en Android debemos proteger el token JWT del alumno. Utilizaremos `react-native-keychain` (instalado en la Fase 1) para crear un adaptador de almacenamiento cifrado y pasárselo a Supabase.

* **Crear archivo:** `src/lib/supabase.ts`
* **Código a implementar:**
    ```typescript
    import 'react-native-url-polyfill/auto';
    import { createClient } from '@supabase/supabase-js';
    import * as Keychain from 'react-native-keychain';
    import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

    // Adaptador de almacenamiento seguro para la sesión (Auth)
    const SecureStorageAdapter = {
      getItem: async (key: string) => {
        try {
          const credentials = await Keychain.getGenericPassword({ service: key });
          return credentials ? credentials.password : null;
        } catch (error) {
          console.error('Error al recuperar sesión:', error);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          await Keychain.setGenericPassword(key, value, { service: key });
        } catch (error) {
          console.error('Error al guardar sesión:', error);
        }
      },
      removeItem: async (key: string) => {
        try {
          await Keychain.resetGenericPassword({ service: key });
        } catch (error) {
          console.error('Error al borrar sesión:', error);
        }
      },
    };

    export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: SecureStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // No aplica en React Native Bare
      },
    });
    ```

#### Paso 2.3: Creación del Servicio de Tareas
Se asume que la base de datos de `tutor-ia` ya posee la tabla de tareas y que no se ejecutarán migraciones desde el móvil. Solo se consumen los datos.

* **Crear archivo:** `src/services/tareas.ts`
* **Código a implementar:**
    ```typescript
    import { supabase } from '../lib/supabase';

    export interface Tarea {
      id: string;
      titulo: string;
      descripcion: string;
      tipo: string;
      estado: 'pendiente' | 'en_progreso' | 'completado';
      alumno_id: string;
    }

    export const getTareasPendientes = async (alumnoId: string): Promise<Tarea[]> => {
      const { data, error } = await supabase
        .from('tareas')
        .select('*')
        .eq('alumno_id', alumnoId)
        .in('estado', ['pendiente', 'en_progreso'])
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error al obtener tareas: ${error.message}`);
      }

      return data as Tarea[];
    };
    ```

#### Paso 2.4: Creación del Servicio de Evidencias (Storage + DB)
El manejo de archivos binarios en React Native requiere transformar la ruta local de la imagen capturada por la cámara (ej. `file://ruta/imagen.jpg`) en un formato que Supabase Storage pueda recibir vía API REST. La forma más estable en React Native moderno es usar la API `fetch` para convertir la URI en un `Blob`.

* **Crear archivo:** `src/services/evidencias.ts`
* **Código a implementar:**
    ```typescript
    import { supabase } from '../lib/supabase';

    export const uploadEvidencia = async (tareaId: string, alumnoId: string, imageUri: string) => {
      try {
        // 1. Convertir la URI local a un Blob
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        const fileName = `${Date.now()}_evidencia.jpg`;
        const filePath = `${alumnoId}/${tareaId}/${fileName}`;

        // 2. Subir el binario al bucket de Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('evidencias')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (storageError) throw new Error(storageError.message);

        // 3. Registrar la evidencia en la tabla relacional
        const { error: dbError } = await supabase
          .from('evidencias')
          .insert([
            {
              tarea_id: tareaId,
              alumno_id: alumnoId,
              url_archivo: storageData.path,
            }
          ]);

        if (dbError) throw new Error(dbError.message);

        // 4. Actualizar la tarea a 'completado'
        const { error: updateError } = await supabase
          .from('tareas')
          .update({ estado: 'completado' })
          .eq('id', tareaId);
          
        if (updateError) throw new Error(updateError.message);

        return true;
      } catch (error) {
        console.error('Fallo en el flujo de evidencia:', error);
        throw error;
      }
    };
    ```

http://googleusercontent.com/interactive_content_block/0