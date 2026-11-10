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

// Función de Envío de Anuncios Universales (App Abierta + App Cerrada vía OneSignal)
async function enviarAnuncioGlobal() {
  const elTitulo = document.getElementById('anuncio-titulo');
  const elMensaje = document.getElementById('anuncio-mensaje');
  const statusEl = document.getElementById('anuncio-status');

  if (!elTitulo || !elMensaje) return;

  const titulo = elTitulo.value.trim();
  const mensaje = elMensaje.value.trim();

  if (!titulo || !mensaje) {
    if (statusEl) {
      statusEl.className = "text-xs font-bold text-rose-400";
      statusEl.innerText = "Por favor completa el título y el mensaje.";
    }
    return;
  }

  if (statusEl) {
    statusEl.className = "text-xs font-bold text-orange-400";
    statusEl.innerText = "Transmitiendo anuncio universal...";
  }

  try {
    // 1. Guardar en Supabase para lectura en tiempo real (app abierta)
    const { error: dbError } = await supabaseClient
      .from('anuncios')
      .insert([{ titulo, mensaje, destinatario: 'todos', created_at: new Date() }]);

    if (dbError) throw dbError;

    // 2. Invocar Edge Function para despachar notificación push universal vía OneSignal (app cerrada)
    const response = await fetch('https://gklquvthucityzgcamao.supabase.co/functions/v1/enviar-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, mensaje })
    });

    const resultado = await response.json();
    console.log('Resultado Push:', resultado);

    if (statusEl) {
      statusEl.className = "text-xs font-bold text-emerald-400";
      statusEl.innerText = "¡Anuncio transmitido con éxito a toda la red!";
    }
    
    elTitulo.value = '';
    elMensaje.value = '';

    setTimeout(() => { 
      if (statusEl) statusEl.innerText = ''; 
    }, 4000);

  } catch (err) {
    console.error("Error al transmitir anuncio:", err);
    if (statusEl) {
      statusEl.className = "text-xs font-bold text-rose-400";
      statusEl.innerText = "Error al transmitir el anuncio.";
    }
  }
}

// Configuración de canales en tiempo real para perfiles y anuncios
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

// Exponer la función de anuncios globalmente para el evento onclick del botón
window.enviarAnuncioGlobal = enviarAnuncioGlobal;
