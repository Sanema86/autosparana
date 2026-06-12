function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatearFechaInput(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function sumarDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().split("T")[0];
}

let sesion = null;
let autosCache = [];

async function initAdmin() {
  const { data: { session } } = await db.auth.getSession();
  if (!session || !esAdmin(session)) {
    window.location.href = "login.html";
    return;
  }
  sesion = session;
  document.getElementById("admin-email").textContent = session.user.email;

  document.getElementById("buscador-admin").addEventListener("input", (e) => {
    renderLista(filtrarAutos(e.target.value));
  });

  document.getElementById("btn-recargar").addEventListener("click", cargarAutos);
  document.getElementById("btn-cerrar-sesion").addEventListener("click", async () => {
    await db.auth.signOut();
    window.location.href = "index.html";
  });

  await cargarAutos();
}

async function cargarAutos() {
  const lista = document.getElementById("lista-admin");
  lista.innerHTML = `<p class="text-gray-500 text-center py-8">Cargando...</p>`;

  const { data, error } = await db
    .from("autos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    lista.innerHTML = `<p class="text-red-400 text-center py-8">Error al cargar: ${escapeHtml(error.message)}</p>`;
    return;
  }

  autosCache = data || [];
  const q = document.getElementById("buscador-admin").value;
  renderLista(filtrarAutos(q));
}

function filtrarAutos(texto) {
  const t = String(texto || "").trim().toLowerCase();
  if (!t) return autosCache;

  return autosCache.filter((a) => {
    const id = String(a.id || "").toLowerCase();
    const slug = String(a.slug || "").toLowerCase();
    const marca = String(a.marca || "").toLowerCase();
    const modelo = String(a.modelo || "").toLowerCase();
    const vendedor = String(a.nombre_vendedor || "").toLowerCase();
    return (
      id.includes(t) ||
      slug.includes(t) ||
      marca.includes(t) ||
      modelo.includes(t) ||
      vendedor.includes(t) ||
      `${marca} ${modelo}`.includes(t)
    );
  });
}

function renderLista(lista) {
  const cont = document.getElementById("lista-admin");
  document.getElementById("contador-resultados").textContent =
    `${lista.length} publicación${lista.length === 1 ? "" : "es"}`;

  if (lista.length === 0) {
    cont.innerHTML = `<p class="text-gray-500 text-center py-10">No se encontraron publicaciones.</p>`;
    return;
  }

  cont.innerHTML = lista.map((auto) => tarjetaAdmin(auto)).join("");

  cont.querySelectorAll(".btn-guardar-destacado").forEach((btn) => {
    btn.addEventListener("click", () => guardarDestacado(btn.dataset.id));
  });

  cont.querySelectorAll(".btn-eliminar-admin").forEach((btn) => {
    btn.addEventListener("click", () => eliminarAuto(btn.dataset.id));
  });

  cont.querySelectorAll(".btn-dias").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(`hasta-${btn.dataset.id}`);
      if (input) input.value = sumarDias(parseInt(btn.dataset.dias, 10));
    });
  });

  cont.querySelectorAll(".chk-destacado").forEach((chk) => {
    chk.addEventListener("change", () => {
      const id = chk.dataset.id;
      const input = document.getElementById(`hasta-${id}`);
      if (!input) return;
      if (chk.checked && !input.value) input.value = sumarDias(30);
      if (!chk.checked) input.value = "";
    });
  });
}

function tarjetaAdmin(auto) {
  const id = escapeHtml(auto.id);
  const slug = escapeHtml(auto.slug);
  const titulo = escapeHtml(`${auto.marca || ""} ${auto.modelo || ""} ${auto.año || ""}`.trim());
  const imagen = auto.imagen ? auto.imagen.split(",")[0].trim() : "";
  const esDestacado = String(auto.destacado || "").toUpperCase() === "SI";
  const hasta = formatearFechaInput(auto.destacado_hasta);

  return `
    <article class="admin-card" data-id="${id}">
      <div class="admin-card__top">
        ${imagen
          ? `<img src="${escapeHtml(imagen)}" alt="" class="admin-card__img">`
          : `<div class="admin-card__img admin-card__img--empty">🚗</div>`
        }
        <div class="admin-card__info">
          <h3 class="admin-card__title">${titulo}</h3>
          <p class="admin-card__meta"><span class="admin-label">ID</span> <code class="admin-code">${id}</code></p>
          <p class="admin-card__meta"><span class="admin-label">Slug</span> <code class="admin-code">${slug}</code></p>
          <p class="admin-card__meta"><span class="admin-label">Dueño</span> ${escapeHtml(auto.nombre_vendedor || auto.user_id || "—")}</p>
          <p class="admin-card__price">$${Number(String(auto.precio || "0").replace(/\D/g, "")).toLocaleString("es-AR")}</p>
        </div>
        <div class="admin-card__actions">
          <a href="auto.html?slug=${encodeURIComponent(auto.slug || "")}" target="_blank" class="admin-btn admin-btn--ghost">Ver</a>
          <a href="publicar.html?edit=${encodeURIComponent(auto.id)}" class="admin-btn admin-btn--ghost">Editar</a>
          <button type="button" class="admin-btn admin-btn--danger btn-eliminar-admin" data-id="${id}">Eliminar</button>
        </div>
      </div>

      <div class="admin-destacado">
        <label class="admin-destacado__check">
          <input type="checkbox" class="chk-destacado" data-id="${id}" ${esDestacado ? "checked" : ""}>
          <span>Destacado</span>
        </label>
        <div class="admin-destacado__fecha">
          <label class="admin-label" for="hasta-${id}">Válido hasta</label>
          <input type="date" id="hasta-${id}" class="admin-input-date" value="${hasta}">
        </div>
        <div class="admin-destacado__planes">
          <button type="button" class="admin-btn admin-btn--sm btn-dias" data-id="${id}" data-dias="15">+15d</button>
          <button type="button" class="admin-btn admin-btn--sm btn-dias" data-id="${id}" data-dias="30">+30d</button>
          <button type="button" class="admin-btn admin-btn--sm btn-dias" data-id="${id}" data-dias="60">+60d</button>
        </div>
        <div class="admin-destacado__fecha">
          <label class="admin-label" for="prioridad-${id}">Prioridad (0 = sin prioridad)</label>
          <input type="number" id="prioridad-${id}" class="admin-input-date" min="0" step="1" value="${Number(auto.prioridad) || 0}">
        </div>
        <button type="button" class="admin-btn admin-btn--primary btn-guardar-destacado" data-id="${id}">
          Guardar destacado
        </button>
      </div>
    </article>
  `;
}

async function guardarDestacado(id) {
  const chk = document.querySelector(`.chk-destacado[data-id="${id}"]`);
  const input = document.getElementById(`hasta-${id}`);
  const inputPrioridad = document.getElementById(`prioridad-${id}`);
  const destacado = chk?.checked ? "SI" : "NO";
  const destacado_hasta = chk?.checked && input?.value ? input.value : null;
  const prioridad = Math.max(0, parseInt(inputPrioridad?.value) || 0);

  if (destacado === "SI" && !destacado_hasta) {
    mostrarToast("Elegí una fecha de vencimiento o usá +15 / +30 / +60 días.", "error");
    return;
  }

  const btn = document.querySelector(`.btn-guardar-destacado[data-id="${id}"]`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Guardando...";
  }

  const { error } = await db
    .from("autos")
    .update({ destacado, destacado_hasta, prioridad })
    .eq("id", id);

  if (btn) {
    btn.disabled = false;
    btn.textContent = "Guardar destacado";
  }

  if (error) {
    mostrarToast(error.message, "error");
    return;
  }

  const idx = autosCache.findIndex((a) => a.id === id);
  if (idx >= 0) {
    autosCache[idx].destacado = destacado;
    autosCache[idx].destacado_hasta = destacado_hasta;
    autosCache[idx].prioridad = prioridad;
  }

  mostrarToast(destacado === "SI" ? "Destacado activado." : "Destacado desactivado.", "ok");
}

async function eliminarAuto(id) {
  const auto = autosCache.find((a) => a.id === id);
  const nombre = auto ? `${auto.marca} ${auto.modelo}` : id;
  if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;

  const { error } = await db.from("autos").delete().eq("id", id);
  if (error) {
    mostrarToast(error.message, "error");
    return;
  }

  autosCache = autosCache.filter((a) => a.id !== id);
  const q = document.getElementById("buscador-admin").value;
  renderLista(filtrarAutos(q));
  mostrarToast("Publicación eliminada.", "ok");
}

function mostrarToast(texto, tipo) {
  const el = document.getElementById("toast-admin");
  if (!el) return;
  el.textContent = texto;
  el.className = `admin-toast admin-toast--${tipo}`;
  el.classList.remove("hidden");
  clearTimeout(mostrarToast._t);
  mostrarToast._t = setTimeout(() => el.classList.add("hidden"), 3500);
}

document.addEventListener("DOMContentLoaded", initAdmin);
