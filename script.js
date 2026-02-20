// 1. Configuración de conexión (Copia esto de la configuración de tu proyecto en Supabase)
const SUPABASE_URL = 'https://kgostvxvzzevcrpwvmbg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2PfGdidcKbNVm0saCAiLAw_NR5Jd3l0';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Seleccionar elementos usando querySelector
const formAlumno = document.querySelector('#formAlumno');
const mensaje = document.querySelector('#mensaje');

// 3. Función para guardar
formAlumno.addEventListener('submit', async (e) => {
e.preventDefault(); // Evita que la página se refresque

// Obtenemos los valores de los inputs
let nombreSucio = document.querySelector('#nombre').value.trim(); // .trim() quita espacios vacíos al inicio y final
const edad = parseInt(document.querySelector('#edad').value); // convertimos a número entero

// --- AQUÍ EMPIEZA LA VALIDACIÓN ---

// 1. Validar nombre (que no sean solo espacios o números)
if (nombreSucio.length < 3) {
    mensaje.style.color = "orange";
    mensaje.innerText = "⚠️ El nombre debe tener al menos 3 caracteres.";
    return; // El 'return' detiene la función y no envía nada a Supabase
}

// 2. Validar edad (rango lógico para un alumno)
if (edad < 4 || edad > 80) {
    mensaje.style.color = "orange";
    mensaje.innerText = "⚠️ La edad debe estar entre 4 y 80 años.";
    return;
}

// 3. FORMATEO (Aquí es donde ocurre la magia)
// Esto convierte "jUAN pEREZ" en "Juan Perez"
const nombreFormateado = nombreSucio
.split(' ') // Divide el texto donde haya espacios
.map(palabra => {
    // Para cada palabra, hacemos lo mismo de antes
    if (palabra.length > 0) {
        return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
    }
    return palabra;
})
.join(' '); // Vuelve a unir las palabras con un espacio

// Cambiamos el texto del botón mientras carga
const btn = document.querySelector('#btnGuardar');
btn.innerText = "Guardando...";
btn.disabled = true;

try {
    // ENVIAR A SUPABASE (Tabla: 'alumnos')
    const { data, error } = await _supabase
        .from('alumnos') // Nombre de la tabla en tu base de datos
        .insert([{ nombre: nombreFormateado, edad: edad }])
        .select(); // Esto nos devuelve el registro creado (incluyendo el ID/Matrícula)

    if (error) throw error;

    // Si todo sale bien:
    const matricula = data[0].id; // El ID se genera solo en la DB
    mensaje.innerText = `✅ ¡Éxito! Matrícula generada: ${matricula}`;
    formAlumno.reset(); // Limpiar el formulario
    obtenerAlumnos();

} catch (err) {
    mensaje.style.color = "red";
    mensaje.innerText = "❌ Error: " + err.message;
} finally {
    btn.innerText = "Registrar Alumno";
    btn.disabled = false;
}
});

// Función para traer datos de Supabase y dibujarlos en la tabla
async function obtenerAlumnos() {
    const { data: alumnos, error } = await _supabase
        .from('alumnos')
        .select('*')
        .order('id', { ascending: false }); // Los más nuevos arriba

    if (error) {
        console.error("Error obteniendo datos:", error);
        return;
    }

    const tabla = document.querySelector('#cuerpoTabla');
    tabla.innerHTML = ""; // Limpiamos la tabla antes de llenarla

    alumnos.forEach(alumno => {
        tabla.innerHTML += `
            <tr>
                <td>${alumno.id}</td>
                <td>${alumno.nombre}</td>
                <td>${alumno.edad} años</td>
                <td>
                    <button class="btn-eliminar" onclick="eliminarAlumno(${alumno.id})">Eliminar</button>
                </td>
            </tr>
        `;
    });
}

async function eliminarAlumno(id) {
    const confirmar = confirm("¿Estás seguro de que quieres eliminar este alumno?");
    
    if (confirmar) {
        const { error } = await _supabase
            .from('alumnos')
            .delete()
            .eq('id', id); // "eq" significa "igual a". Borra donde el ID sea el que clicamos.

        if (error) {
            alert("Error al eliminar");
        } else {
            obtenerAlumnos(); // Refrescamos la tabla para que desaparezca
        }
    }
}

// Llamar a la función al cargar la página
obtenerAlumnos();
