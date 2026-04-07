const URL = "https://opensheet.elk.sh/1xmNwDMZRT9z0Zhl0eOUjrk2PLzYoN3ALUX55fMNFpz4/autos";

// 👉 CONTADOR DE VISITAS
function sumarVisita(slug) {
  const key = "visitasAutos";
  const vistosKey = "autosVistos";

  let visitas = JSON.parse(localStorage.getItem(key)) || {};
  let vistos = JSON.parse(localStorage.getItem(vistosKey)) || [];

  if (!vistos.includes(slug)) {
    visitas[slug] = (visitas[slug] || 0) + 1;
    vistos.push(slug);

    localStorage.setItem(key, JSON.stringify(visitas));
    localStorage.setItem(vistosKey, JSON.stringify(vistos));
  }

  return visitas[slug] || 1;
}

// 👉 TU NÚMERO
const MI_NUMERO = "5493435311312";

// 👉 SLUG
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

// 👉 DATA
fetch(URL)
  .then(res => res.json())
  .then(data => {
    const auto = data.find(a =>
      String(a.slug).trim().toLowerCase() === String(slug).trim().toLowerCase()
    );

    if (!auto) {
      document.getElementById("detalle-auto").innerHTML =
        "<h2 style='color:white;text-align:center;'>Auto no encontrado</h2>";
      return;
    }

    mostrarAuto(auto);
  });

function mostrarAuto(auto) {

  const visitas = sumarVisita(auto.slug);

  const esDestacado = String(auto.destacado || "").toUpperCase() === "SI";
  const esIntermediario = String(auto.intermediario || "").toUpperCase() === "SI";

  const telefonoLimpio = String(auto.telefono || "").replace(/\D/g, "").trim();

  const telefonoFinal = esIntermediario
    ? MI_NUMERO
    : (telefonoLimpio.length > 8 ? telefonoLimpio : MI_NUMERO);

  const mensaje = esIntermediario
    ? `Hola, te consulto por este vehículo: ${window.location.href}`
    : `Hola, vi este vehículo en Autos Paraná: ${window.location.href} ¿Sigue disponible?`;

  const linkWhatsApp = `https://wa.me/${telefonoFinal}?text=${encodeURIComponent(mensaje)}`;

  const cont = document.getElementById("detalle-auto");

  const imagenes = auto.imagen
    ? auto.imagen.split(",").map(img => img.trim())
    : [];

  let current = 0;

  cont.innerHTML = `
    <div class="max-w-5xl mx-auto bg-gray-800 text-white p-6 rounded-2xl shadow-2xl">

      <div class="relative">

        ${esDestacado ? `
          <div class="absolute top-3 left-3 bg-yellow-400 text-black px-4 py-1 rounded-lg font-bold z-20">
            ⭐ Destacado
          </div>
        ` : ""}

        <img id="img-principal" 
             src="${imagenes[0]}" 
             class="w-full h-96 object-cover rounded-lg mb-4 cursor-pointer transition-opacity duration-300">

        ${imagenes.length > 1 ? `
          <button onclick="prev()" class="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 text-black px-3 py-2 rounded-full text-2xl z-20">‹</button>
          <button onclick="next()" class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 text-black px-3 py-2 rounded-full text-2xl z-20">›</button>
        ` : ""}

      </div>

      <div class="flex gap-2 overflow-x-auto mb-6">
        ${imagenes.map((img, i) => `
          <img src="${img}" 
               class="thumb h-20 w-28 object-cover rounded cursor-pointer border-2 ${i === 0 ? 'border-blue-500' : 'border-transparent'}"
               onclick="irA(${i})"
               id="thumb-${i}">
        `).join("")}
      </div>

      <h1 class="text-3xl font-bold mb-2">${auto.marca} ${auto.modelo}</h1>
      <p class="text-gray-400">Visitas: ${visitas}</p>

      <div class="grid grid-cols-2 gap-4 text-gray-300 mt-4">
        <p><b>Año:</b> ${auto.año}</p>
        <p><b>KM:</b> ${auto.km}</p>
        <p><b>Combustible:</b> ${auto.combustible}</p>
        <p><b>Ubicación:</b> ${auto.ubicacion || "No especificada"}</p>
      </div>

      <p class="text-2xl text-blue-400 font-bold mt-4">$${auto.precio}</p>

      <p class="mt-6">${auto.descripcion || "Sin descripción"}</p>

      <a href="${linkWhatsApp}" target="_blank"
         class="block mt-6 bg-green-500 text-white text-center py-4 rounded-lg font-bold text-lg">
         Consultar por WhatsApp
      </a>
    </div>

    <!-- FULLSCREEN -->
    <div id="fullscreen" class="fixed inset-0 bg-black/95 hidden items-center justify-center z-50">

      <button id="cerrarFull" class="absolute top-4 right-4 text-white text-4xl z-50">✕</button>

      <button id="prevFull" class="absolute left-6 top-1/2 -translate-y-1/2 bg-white/80 text-black px-4 py-2 rounded-full text-3xl z-50">‹</button>

      <img id="img-full" class="max-h-[90%] max-w-[90%] object-contain">

      <button id="nextFull" class="absolute right-6 top-1/2 -translate-y-1/2 bg-white/80 text-black px-4 py-2 rounded-full text-3xl z-50">›</button>

    </div>
  `;

  const img = document.getElementById("img-principal");

  function actualizarImagen() {
    if (!img) return;

    img.style.opacity = 0;

    setTimeout(() => {
      img.src = imagenes[current];

      document.querySelectorAll(".thumb").forEach((el, i) => {
        if (i === current) {
          el.classList.add("border-blue-500");
          el.classList.remove("border-transparent");
        } else {
          el.classList.remove("border-blue-500");
          el.classList.add("border-transparent");
        }
      });

      img.style.opacity = 1;
    }, 150);
  }

  window.next = () => {
    current = (current + 1) % imagenes.length;
    actualizarImagen();
  };

  window.prev = () => {
    current = (current - 1 + imagenes.length) % imagenes.length;
    actualizarImagen();
  };

  window.irA = (i) => {
    current = i;
    actualizarImagen();
  };

  // 👉 SWIPE NORMAL (AGREGADO SIN ROMPER NADA)
  let startX = 0;

  img.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  img.addEventListener("touchend", (e) => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
  });

  // 👉 FULLSCREEN
  const fullscreen = document.getElementById("fullscreen");
  const imgFull = document.getElementById("img-full");
  const btnCerrar = document.getElementById("cerrarFull");
  const btnNext = document.getElementById("nextFull");
  const btnPrev = document.getElementById("prevFull");

  img.addEventListener("click", () => {
    imgFull.src = imagenes[current];
    fullscreen.classList.remove("hidden");
    fullscreen.classList.add("flex");
  });

  function actualizarFull() {
    imgFull.src = imagenes[current];
  }

  fullscreen.addEventListener("click", (e) => {
    if (e.target === fullscreen) fullscreen.classList.add("hidden");
  });

  btnCerrar.addEventListener("click", () => fullscreen.classList.add("hidden"));

  btnNext.addEventListener("click", (e) => {
    e.stopPropagation();
    current = (current + 1) % imagenes.length;
    actualizarFull();
  });

  btnPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    current = (current - 1 + imagenes.length) % imagenes.length;
    actualizarFull();
  });

  // 👉 SWIPE FULLSCREEN
  fullscreen.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  fullscreen.addEventListener("touchend", (e) => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? btnNext.click() : btnPrev.click();
    }
  });

  // 👉 TECLADO
  document.addEventListener("keydown", (e) => {
    if (fullscreen.classList.contains("hidden")) return;

    if (e.key === "ArrowRight") btnNext.click();
    if (e.key === "ArrowLeft") btnPrev.click();
    if (e.key === "Escape") btnCerrar.click();
  });
}

// 👉 MENÚ
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const menu = document.getElementById("menu");

  if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => {
      menu.classList.toggle("active");
    });
  }
});