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

     // SIMILARES DATA INFO
    mostrarSimilares(auto, data);
  });
  

function mostrarAuto(auto) {

  // 👉 ACTUALIZAR SEO DINÁMICO
  document.title = `${auto.marca} ${auto.modelo} ${auto.año} en Paraná | Autos Paraná`;
  
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute("content", `Comprá este ${auto.marca} ${auto.modelo} ${auto.año} en Paraná. KM: ${auto.km}. Precio: $${Number(auto.precio).toLocaleString("es-AR")}. ¡Consultanos por WhatsApp!`);
  }

  // 👉 INYECTAR DATOS ESTRUCTURADOS (JSON-LD) PARA GOOGLE
  const imagenesArray = auto.imagen ? auto.imagen.split(",").map(img => img.trim()) : [];
  const carSchema = {
    "@context": "https://schema.org/",
    "@type": "Car",
    "name": `${auto.marca} ${auto.modelo} ${auto.año}`,
    "image": imagenesArray[0],
    "description": auto.descripcion || `Venta de ${auto.marca} ${auto.modelo} en Paraná`,
    "brand": { "@type": "Brand", "name": auto.marca },
    "modelDate": auto.año,
    "offers": {
      "@type": "Offer",
      "price": auto.precio,
      "priceCurrency": "ARS",
      "availability": auto.vendido?.toUpperCase() === "SI" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "url": window.location.href
    }
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(carSchema);
  document.head.appendChild(script);

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

      <p class="text-2xl text-blue-400 font-bold mt-4">
  $${Number(auto.precio).toLocaleString("es-AR")}</p>

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

function mostrarSimilares(autoActual, lista) {

  const cont = document.getElementById("autos-similares");
  if (!cont) return;

  // 👉 LIMPIAR
  cont.innerHTML = "<h2 class='text-white text-2xl mb-4'>Te puede interesar...</h2>";

  const precioActual = Number(autoActual.precio) || 0;

  // 👉 FILTRAR
  let similares = lista.filter(a => {

    if (a.slug === autoActual.slug) return false;

    // mismo tipo
    if (a.tipo !== autoActual.tipo) return false;

    // misma marca (suma puntos)
    let score = 0;

    if (a.marca === autoActual.marca) score += 2;

    // precio parecido
    const precio = Number(a.precio) || 0;
    if (precio > precioActual * 0.7 && precio < precioActual * 1.3) {
      score += 1;
    }

    a.score = score;
    return score > 0;

  });

  // 👉 ORDENAR
  similares.sort((a, b) => b.score - a.score);

  // 👉 LIMITAR
  similares = similares.slice(0, 4);

  if (similares.length === 0) {
    cont.innerHTML += "<p class='text-gray-400'>No hay autos similares.</p>";
    return;
  }

  // 👉 HTML
  cont.innerHTML += `
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      ${similares.map(a => `
        <div onclick="irAuto('${a.slug}')"
          class="bg-white text-black rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition">

          <img src="${a.imagen.split(',')[0]}" class="w-full h-40 object-cover">

          <div class="p-2 text-center">
            <p class="font-bold">${a.marca} ${a.modelo} ${a.año}</p>
            <p>$${Number(a.precio).toLocaleString("es-AR")}</p>
          </div>

        </div>
      `).join("")}
    </div>
  `;
}

// CLICK AUTO SIMILARES
function irAuto(slug) {
  window.location.href = "auto.html?slug=" + slug;
}