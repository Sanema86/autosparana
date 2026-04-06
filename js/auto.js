const URL = "https://opensheet.elk.sh/1xmNwDMZRT9z0Zhl0eOUjrk2PLzYoN3ALUX55fMNFpz4/autos";

// 👉 TU NÚMERO
const MI_NUMERO = "5493435311312"; // ← CAMBIAR

// 👉 ID
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

  const esDestacado = auto.destacado?.toUpperCase() === "SI";
  const esIntermediario = auto.intermediario?.toUpperCase() === "SI";

  // 👉 TELÉFONO
  const telefonoFinal = esIntermediario
    ? MI_NUMERO
    : (auto.telefono || MI_NUMERO);

  // 👉 MENSAJE
  const mensaje = esIntermediario
    ? `Hola, te consulto por este vehículo: ${window.location.href}`
    : `Hola, vi este vehículo en Autos Paraná: ${window.location.href} ¿Sigue disponible?`

  const linkWhatsApp = `https://wa.me/${telefonoFinal}?text=${encodeURIComponent(mensaje)}`;

  const cont = document.getElementById("detalle-auto");

  const imagenes = auto.imagen
    ? auto.imagen.split(",").map(img => img.trim())
    : [];

  let current = 0;

  cont.innerHTML = `
    <div class="max-w-5xl mx-auto bg-gray-800 text-white p-6 rounded-2xl shadow-2xl">

      <!-- CARRUSEL -->
      <div class="relative">

        ${esDestacado ? `
          <div class="absolute top-3 left-3 bg-yellow-400 text-black px-4 py-1 rounded-lg font-bold shadow-lg z-20">
            ⭐ Destacado
          </div>
        ` : ""}

        <img id="img-principal" 
             src="${imagenes[0]}" 
             class="w-full h-96 object-cover rounded-lg mb-4 cursor-pointer transition-opacity duration-300">

        ${imagenes.length > 1 ? `
          <button onclick="prev()" class="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 px-4 py-2 rounded text-3xl z-20">‹</button>
          <button onclick="next()" class="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 px-4 py-2 rounded text-3xl z-20">›</button>
        ` : ""}

      </div>

      <!-- MINIATURAS -->
      <div class="flex gap-2 overflow-x-auto mb-6">
        ${imagenes.map((img, i) => `
          <img src="${img}" 
               class="thumb h-20 w-28 object-cover rounded cursor-pointer border-2 transition-all duration-200 ${i === 0 ? 'border-blue-500' : 'border-transparent'}"
               onclick="irA(${i})"
               id="thumb-${i}">
        `).join("")}
      </div>

      <!-- INFO -->
      <h1 class="text-3xl font-bold mb-2">${auto.marca} ${auto.modelo}</h1>

      <div class="grid grid-cols-2 gap-4 text-gray-300 mt-4">
        <p><b>Año:</b> ${auto.año}</p>
        <p><b>KM:</b> ${auto.km}</p>
        <p><b>Combustible:</b> ${auto.combustible}</p>
      </div>

      <p class="text-2xl text-blue-400 font-bold mt-4">$${auto.precio}</p>

      <p class="mt-6">${auto.descripcion || "Sin descripción"}</p>

      <!-- WHATSAPP -->
      <a href="${linkWhatsApp}"
         target="_blank"
         class="block mt-6 bg-green-500 text-white text-center py-4 rounded-lg font-bold text-lg hover:bg-green-600">
         Consultar por WhatsApp
      </a>

    </div>

    <!-- FULLSCREEN -->
    <div id="fullscreen" class="fixed inset-0 bg-black/90 hidden items-center justify-center z-50">
      <img id="img-full" class="max-h-full max-w-full">
    </div>
  `;

  const img = document.getElementById("img-principal");

  // 👉 ACTUALIZAR IMAGEN
  function actualizarImagen() {
    img.style.opacity = 0;

    setTimeout(() => {
      img.src = imagenes[current];

      document.querySelectorAll(".thumb").forEach(el => {
        el.classList.remove("border-blue-500");
        el.classList.add("border-transparent");
      });

      const activa = document.getElementById(`thumb-${current}`);
      if (activa) {
        activa.classList.remove("border-transparent");
        activa.classList.add("border-blue-500");
      }

      img.style.opacity = 1;
    }, 150);
  }

  // 👉 BOTONES
  window.next = function () {
    current = (current + 1) % imagenes.length;
    actualizarImagen();
  };

  window.prev = function () {
    current = (current - 1 + imagenes.length) % imagenes.length;
    actualizarImagen();
  };

  // 👉 MINIATURAS
  window.irA = function (index) {
    current = index;
    actualizarImagen();
  };

  // 👉 SWIPE
  let startX = 0;

  img.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  });

  img.addEventListener("touchend", e => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;

    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
  });

  // 👉 FULLSCREEN
  const fullscreen = document.getElementById("fullscreen");
  const imgFull = document.getElementById("img-full");

  img.addEventListener("click", () => {
    imgFull.src = imagenes[current];
    fullscreen.classList.remove("hidden");
    fullscreen.classList.add("flex");
  });

  fullscreen.addEventListener("click", () => {
    fullscreen.classList.add("hidden");
    fullscreen.classList.remove("flex");
  });
}

// 👉 MENÚ HAMBURGUESA
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const menu = document.getElementById("menu");

  if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => {
      menu.classList.toggle("active");
    });
  }
});