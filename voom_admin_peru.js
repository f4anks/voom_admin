const SUPABASE_URL = "https://gklquvthucityzgcamao.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-p-YL6bWXAQGTddkmm9_mA_HgKlR_eM";

let supabaseClient = null;
let todosLosConductores = [];
let filtroActual = 'todos';

window.addEventListener('DOMContentLoaded', async () => {
  if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.error("SDK de Supabase no cargado.");
    return;
  }

  // Validar Sesión de Administrador
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  const elEmail = document.getElementById('admin-email');
  if (elEmail) elEmail.innerText = user.email;

  await cargarConductores();
  activarTiempoReal();
});

async function cargarConductores() {
  const { data, error } = await supabaseClient
    .from('perfiles')
    .select('*')
    .eq('rol', 'conductor')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error cargando conductores:", error);
    return;
  }

  todosLosConductores = data || [];
  actualizarContadores();
  renderizarConductores();
}

function actualizarContadores() {
  const elTodos = document.getElementById('count-todos');
  const elPendiente = document.getElementById('count-pendiente');
  const elAprobado = document.getElementById('count-aprobado');
  const elSuspendido = document.getElementById('count-suspendido');

  if (elTodos) elTodos.innerText = todosLosConductores.length;
  if (elPendiente) elPendiente.innerText = todosLosConductores.filter(c => c.estado_cuenta === 'pendiente').length;
  if (elAprobado) elAprobado.innerText = todosLosConductores.filter(c => c.estado_cuenta === 'aprobado').length;
  if (elSuspendido) elSuspendido.innerText = todosLosConductores.filter(c => c.estado_cuenta === 'suspendido').length;
}

function filtrarConductores(tipo) {
  filtroActual = tipo;

  ['todos', 'pendiente', 'aprobado', 'suspendido'].forEach(tab => {
    const btn = document.getElementById(`tab-${tab}`);
    if (btn) {
      if (tab === tipo) {
        btn.className = "px-4 py-2 text-xs font-bold rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 transition-all";
      } else {
        btn.className = "px-4 py-2 text-xs font-bold rounded-xl text-slate-400 hover:text-white transition-all";
      }
    }
  });

  renderizarConductores();
}

function renderizarConductores() {
  const contenedor = document.getElementById('contenedor-conductores');
  if (!contenedor) return;
  contenedor.innerHTML = '';

  let lista = todosLosConductores;
  if (filtroActual !== 'todos') {
    lista = todosLosConductores.filter(c => c.estado_cuenta === filtroActual);
  }

  if (lista.length === 0) {
    contenedor.innerHTML = '<p class="col-span-full text-center py-12 text-xs font-semibold text-slate-500">No hay conductores registrados en esta categoría.</p>';
    return;
  }

  lista.forEach(c => {
    const badgeEstado = obtenerBadgeEstado(c.estado_cuenta);
    const card = document.createElement('div');
    card.className = "bg-slate-800/60 border border-slate-700/80 p-5 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between";

    card.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-sm font-black text-white">${c.nombre_completo || 'Sin nombre'}</h3>
            <p class="text-xs font-bold text-orange-400">C.I: ${c.cedula || 'N/A'}</p>
          </div>
          ${badgeEstado}
        </div>

        <div class="bg-slate-900/60 p-3 rounded-2xl border border-slate-700/60 text-[11px] space-y-1 text-slate-300">
          <p><strong class="text-white">Vehículo:</strong> ${c.vehiculo_marca || ''} ${c.vehiculo_modelo || ''} (${c.vehiculo_anio || ''})</p>
          <p><strong class="text-white">Placa:</strong> <span class="font-bold uppercase text-orange-300">${c.vehiculo_placa || 'N/A'}</span></p>
          <p><strong class="text-white">Color:</strong> ${c.vehiculo_color || 'N/A'}</p>
        </div>
      </div>

      <div class="space-y-2 pt-2 border-t border-slate-700/80">
        <button onclick="verDocumentos('${c.id}')" class="w-full bg-slate-700/50 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 rounded-xl transition-all border border-slate-600">
          📄 Ver Documentos / Fotos
        </button>

        <div class="grid grid-cols-2 gap-2">
          ${c.estado_cuenta !== 'aprobado' 
            ? `<button onclick="cambiarEstadoConductor('${c.id}', 'aprobado')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md">Aprobar</button>` 
            : ''}
          ${c.estado_cuenta !== 'suspendido' 
            ? `<button onclick="cambiarEstadoConductor('${c.id}', 'suspendido')" class="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md col-span-1">Suspender</button>` 
            : ''}
          ${c.estado_cuenta === 'aprobado' 
            ? `<button onclick="cambiarEstadoConductor('${c.id}', 'pendiente')" class="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md">Marcar Pendiente</button>` 
            : ''}
        </div>
      </div>
    `;

    contenedor.appendChild(card);
  });
}

function obtenerBadgeEstado(estado) {
  if (estado === 'aprobado') {
    return `<span class="text-[10px] bg-emerald-500/20 text-emerald-400 font-black px-2.5 py-1 rounded-full border border-emerald-500/30">Aprobado</span>`;
  } else if (estado === 'suspendido') {
    return `<span class="text-[10px] bg-rose-500/20 text-rose-400 font-black px-2.5 py-1 rounded-full border border-rose-500/30">Suspendido</span>`;
  }
  return `<span class="text-[10px] bg-amber-500/20 text-amber-400 font-black px-2.5 py-1 rounded-full border border-amber-500/30 animate-pulse">Pendiente</span>`;
}

async function cambiarEstadoConductor(idConductor, nuevoEstado) {
  const { error } = await supabaseClient
    .from('perfiles')
    .update({ estado_cuenta: nuevoEstado })
    .eq('id', idConductor);

  if (error) {
    alert("Error al actualizar estado: " + error.message);
    return;
  }

  await cargarConductores();
}

function verDocumentos(idConductor) {
  const conductor = todosLosConductores.find(c => c.id === idConductor);
  if (!conductor) return;

  const elTitulo = document.getElementById('modal-titulo-conductor');
  if (elTitulo) elTitulo.innerText = `Documentos: ${conductor.nombre_completo || 'Conductor'}`;
  
  const cuerpo = document.getElementById('modal-cuerpo-docs');
  if (!cuerpo) return;

  const docs = [
    { titulo: 'Cédula de Identidad', url: conductor.foto_cedula },
    { titulo: 'Licencia de Conducir', url: conductor.foto_licencia },
    { titulo: 'Carnet de Circulación', url: conductor.foto_carnet },
    { titulo: 'Título de Propiedad', url: conductor.foto_titulo },
    { titulo: 'Fotografía del Vehículo', url: conductor.foto_vehiculo }
  ];

  cuerpo.innerHTML = docs.map(d => `
    <div class="bg-slate-800 p-3 rounded-2xl border border-slate-700 text-center">
      <p class="text-xs font-bold text-slate-300 mb-2">${d.titulo}</p>
      ${d.url 
        ? `<a href="${d.url}" target="_blank"><img src="${d.url}" class="w-full h-36 object-cover rounded-xl border border-slate-700 hover:opacity-90 transition-all" alt="${d.titulo}" /></a>` 
        : '<div class="h-36 flex items-center justify-center bg-slate-900 text-xs text-slate-500 font-medium rounded-xl">Sin fotografía cargada</div>'}
    </div>
  `).join('');

  const modal = document.getElementById('modal-docs');
  if (modal) modal.classList.remove('hidden');
}

function cerrarModalDocs() {
  const modal = document.getElementById('modal-docs');
  if (modal) modal.classList.add('hidden');
}

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>Voom Admin - Perú</title>

  <!-- Metadatos PWA -->
  <link rel="manifest" href="./manifest.json">
  <meta name="theme-color" content="#0f172a">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Voom Admin Perú">

  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex flex-col">

  <!-- Header -->
  <header class="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/80 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-lg shadow-orange-500/20">
        🇵🇪
      </div>
      <div>
        <span class="text-lg font-black text-white tracking-tight leading-tight block">Voom Perú</span>
        <span class="text-[10px] text-orange-400 font-extrabold uppercase tracking-wider">Panel de Administración</span>
      </div>
    </div>

    <div class="flex items-center space-x-4">
      <div class="text-right">
        <span id="admin-email" class="text-xs font-black text-slate-200 block">Cargando...</span>
        <span class="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">● Sesión Activa</span>
      </div>
      <button onclick="logoutAdmin()" class="bg-slate-700 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-slate-600">
        Cerrar Sesión
      </button>
    </div>
  </header>

  <!-- Contenido Principal -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
    
    <!-- Tarjeta de Envío de Anuncios Globales por Destinatario -->
    <div class="bg-slate-800/60 border border-slate-700/80 p-6 rounded-3xl shadow-xl space-y-4">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center font-bold text-lg border border-orange-500/30">
          📢
        </div>
        <div>
          <h2 class="text-sm font-black text-white tracking-tight uppercase">Enviar Anuncio a la Red Voom Perú</h2>
          <p class="text-xs font-semibold text-slate-400">Transmite un comunicado dirigido a pasajeros, conductores o ambos</p>
        </div>
      </div>

      <div class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Título del Anuncio</label>
            <input type="text" id="anuncio-titulo" placeholder="Ej. ¡Tarifa especial este fin de semana en Lima!" class="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition-all" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dirigido a</label>
            <select id="anuncio-destinatario" class="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-orange-500 transition-all">
              <option value="todos">🌐 Toda la Red (Todos)</option>
              <option value="pasajeros">👤 Solo Pasajeros</option>
              <option value="conductores">🚘 Solo Conductores</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mensaje</label>
          <textarea id="anuncio-mensaje" rows="3" placeholder="Escribe los detalles del comunicado..." class="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition-all resize-none"></textarea>
        </div>

        <div class="flex items-center justify-between pt-2">
          <span id="anuncio-status" class="text-xs font-bold text-slate-400"></span>
          <button onclick="enviarAnuncioGlobal()" class="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-orange-500/20 text-xs tracking-wide active:scale-95">
            Transmitir Anuncio 🚀
          </button>
        </div>
      </div>
    </div>

    <!-- Pestañas de Filtros y Contadores -->
    <div class="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-3xl border border-slate-700/80">
      <div>
        <h2 class="text-base font-black text-white tracking-tight">Conductores Registrados</h2>
        <p class="text-xs font-semibold text-slate-400 mt-0.5">Aprueba solicitudes pendientes o gestiona accesos activos</p>
      </div>

      <div class="flex flex-wrap items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-700/60 w-full md:w-auto">
        <button onclick="filtrarConductores('todos')" id="tab-todos" class="px-4 py-2 text-xs font-bold rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 transition-all">
          Todos (<span id="count-todos">0</span>)
        </button>
        <button onclick="filtrarConductores('pendiente')" id="tab-pendiente" class="px-4 py-2 text-xs font-bold rounded-xl text-slate-400 hover:text-white transition-all">
          Pendientes (<span id="count-pendiente">0</span>)
        </button>
        <button onclick="filtrarConductores('aprobado')" id="tab-aprobado" class="px-4 py-2 text-xs font-bold rounded-xl text-slate-400 hover:text-white transition-all">
          Aprobados (<span id="count-aprobado">0</span>)
        </button>
        <button onclick="filtrarConductores('suspendido')" id="tab-suspendido" class="px-4 py-2 text-xs font-bold rounded-xl text-slate-400 hover:text-white transition-all">
          Suspendidos (<span id="count-suspendido">0</span>)
        </button>
      </div>
    </div>

    <!-- Contenedor de Tarjetas de Conductores -->
    <div id="contenedor-conductores" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="col-span-full text-center py-12 text-xs font-semibold text-slate-500">
        Cargando base de datos de conductores...
      </div>
    </div>

  </main>

  <!-- Modal para ver documentos y fotos -->
  <div id="modal-docs" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] hidden flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 id="modal-titulo-conductor" class="text-sm font-black text-white">Documentos del Conductor</h3>
        <button onclick="cerrarModalDocs()" class="text-slate-400 hover:text-white font-bold text-sm px-3 py-1 bg-slate-800 rounded-full transition-all">✕</button>
      </div>
      <div id="modal-cuerpo-docs" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Aquí se cargan dinámicamente las fotos -->
      </div>
    </div>
  </div>

  <!-- Archivo de Lógica JavaScript en la misma carpeta -->
  <script src="./voom_admin_peru.js"></script>
</body>
</html>

// Configuración en tiempo real para perfiles y anuncios
function activarTiempoReal() {
  supabaseClient
    .channel('cambios-admin-peru')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'perfiles' },
      () => {
        cargarConductores();
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'anuncios' },
      (payload) => {
        console.log('Nuevo anuncio detectado en tiempo real:', payload.new);
      }
    )
    .subscribe();
}

async function logoutAdmin() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  window.location.href = 'index.html';
}
