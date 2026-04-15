const URL_AUTOS = "https://opensheet.elk.sh/1xmNwDMZRT9z0Zhl0eOUjrk2PLzYoN3ALUX55fMNFpz4/autos";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHttpUrl(value, fallback = "") {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch (e) {
    // ignore invalid URL
  }
  return fallback;
}

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

// 👉 FALLBACK
const FALLBACK_IMG = "https://via.placeholder.com/800x600?text=Imagen+no+disponible";

// 👉 TU NÚMERO
const MI_NUMERO = "5493435311312";

// 👉 SLUG
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

if (!slug) window.location.href = "index.html";

// 👉 DATA
fetch(URL_AUTOS)
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
    mostrarSimilares(auto, data);
  })
  .catch(err => {
    console.error("Error cargando auto:", err);
    document.getElementById("detalle-auto").innerHTML = "<h2 class='text-white text-center'>Error de conexión</h2>";
  });

function mostrarAuto(auto) {
  // Limpieza de precio (quita puntos, comas o $ que vengan del Excel)
  const precioLimpio = String(auto.precio || "0").replace(/\D/g, "");
  const marca = escapeHtml(auto.marca);
  const modelo = escapeHtml(auto.modelo);
  const anio = escapeHtml(auto.año);
  const km = escapeHtml(auto.km);
  const combustible = escapeHtml(auto.combustible);
  const ubicacion = escapeHtml(auto.ubicacion || "No especificada");
  const descripcion = escapeHtml(auto.descripcion || "Sin descripción");

  // 👉 SEO dinámico (no lo tocamos)
  document.title = `${marca} ${modelo} ${anio} en Paraná | Autos Paraná`;
  const canonicalHref = `https://www.autosparana.com.ar/auto.html?slug=${encodeURIComponent(String(auto.slug || "").trim())}`;

  let canonicalTag = document.querySelector('link[rel="canonical"]');
  if (!canonicalTag) {
    canonicalTag = document.createElement("link");
    canonicalTag.setAttribute("rel", "canonical");
    document.head.appendChild(canonicalTag);
  }
  canonicalTag.setAttribute("href", canonicalHref);

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute("content", `Comprá este ${marca} ${modelo} ${anio}. KM: ${km}. Precio: $${Number(precioLimpio).toLocaleString("es-AR")}`);
  } else {
    const meta = document.createElement('meta');
    meta.name = "description";
    meta.content = `Comprá este ${marca} ${modelo} ${anio}. KM: ${km}. Precio: $${Number(precioLimpio).toLocaleString("es-AR")}`;
    document.head.appendChild(meta);
  }

  const ogConfig = [
    { property: "og:title", content: `${marca} ${modelo} ${anio} en Paraná | Autos Paraná` },
    { property: "og:description", content: `Mirá el detalle de este ${marca} ${modelo} ${anio}, con fotos, precio y contacto directo por WhatsApp.` },
    { property: "og:url", content: canonicalHref },
    { property: "og:image", content: safeHttpUrl(auto.imagen?.split(",")[0], FALLBACK_IMG) }
  ];

  ogConfig.forEach((item) => {
    let tag = document.querySelector(`meta[property="${item.property}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("property", item.property);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", item.content);
  });

  // 👉 JSON-LD (igual que vos)
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    "@context": "https://schema.org/",
    "@type": "Car",
    "name": `${marca} ${modelo} ${anio}`,
    "image": safeHttpUrl(auto.imagen?.split(",")[0], FALLBACK_IMG),
    "offers": {
      "@type": "Offer",
      "price": precioLimpio,
      "priceCurrency": "ARS"
    }
  });
  document.head.appendChild(script);

  const visitas = sumarVisita(auto.slug);

  const telefonoLimpio = String(auto.telefono || "").replace(/\D/g, "").trim();
  const telefonoFinal = telefonoLimpio.length > 8 ? telefonoLimpio : MI_NUMERO;

  const linkWhatsApp =
    `https://wa.me/${telefonoFinal}?text=${encodeURIComponent("Hola! Me interesa este auto que vi en la web: " + window.location.href)}`;

  const cont = document.getElementById("detalle-auto");

  const imagenes = auto.imagen
    ? auto.imagen
        .split(",")
        .map(img => safeHttpUrl(img, ""))
        .filter(Boolean)
    : [FALLBACK_IMG];

  let current = 0;

  cont.innerHTML = `
    <div class="max-w-5xl mx-auto bg-gray-800 text-white p-6 rounded-2xl shadow-2xl">

      <div class="relative">

        <!-- 🔥 FIX CLAVE MOBILE -->
        <img id="img-principal" 
             onclick="abrirZoom()"
             src="${imagenes[0] || FALLBACK_IMG}" 
             class="w-full h-50 sm:h-80 md:h-90 object-cover rounded-lg mb-4 cursor-pointer transition-opacity duration-300">

        ${imagenes.length > 1 ? `
          <button onclick="prev()" class="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 text-black px-3 py-2 rounded-full text-2xl">‹</button>
          <button onclick="next()" class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 text-black px-3 py-2 rounded-full text-2xl">›</button>
        ` : ""}

      </div>

      <div class="flex gap-2 overflow-x-auto mb-6">
        ${imagenes.map((img, i) => `
          <img src="${img}" 
               class="thumb h-20 w-28 object-cover rounded cursor-pointer border-2 ${i === 0 ? 'border-blue-500' : 'border-transparent'}"
               onclick="irA(${i})">
        `).join("")}
      </div>

      <h1 class="text-3xl font-bold mb-2">${marca} ${modelo}</h1>
      <p class="text-gray-400">Visitas: ${visitas}</p>

      <div class="grid grid-cols-2 gap-4 text-gray-300 mt-4">
        <p><b>Año:</b> ${anio}</p>
        <p><b>KM:</b> ${km}</p>
        <p><b>Combustible:</b> ${combustible}</p>
        <p><b>Ubicación:</b> ${ubicacion}</p>
      </div>

       <p class="mt-6">${descripcion}</p>

      <p class="text-4xl text-center text-blue-400 font-bold mt-4">
        $${Number(precioLimpio).toLocaleString("es-AR")}
      </p>

     

      <a href="${linkWhatsApp}" target="_blank"
         class="block mt-6 bg-green-500 text-white text-center py-4 rounded-lg font-bold text-lg">
         Consultar por WhatsApp
      </a>
    </div>

    <!-- 🔍 MODAL ZOOM (Aparece al tocar la imagen) -->
    <div id="modal-zoom" class="fixed inset-0 z-[3000] bg-black/95 hidden flex-col justify-center items-center p-4">
      <button onclick="cerrarZoom()" class="absolute top-5 right-5 text-white text-5xl font-light">&times;</button>
      
      <div class="relative w-full max-w-5xl flex items-center justify-center">
         <img id="img-zoom" src="" class="max-w-full max-h-[85vh] object-contain select-none shadow-2xl transition-opacity duration-300">
         
         ${imagenes.length > 1 ? `
          <button onclick="prev()" class="absolute left-0 text-white text-5xl px-4 py-10 hover:bg-white/10 transition">‹</button>
          <button onclick="next()" class="absolute right-0 text-white text-5xl px-4 py-10 hover:bg-white/10 transition">›</button>
         ` : ""}
      </div>
      
      <p class="text-white/60 mt-4 text-sm hidden md:block">Usá las flechas del teclado o deslizá con el dedo</p>
    </div>
  `;

  const img = document.getElementById("img-principal");
  const modalZoom = document.getElementById("modal-zoom");
  const imgZoom = document.getElementById("img-zoom");

  function actualizarImagen() {
    img.style.opacity = 0;
    if (imgZoom) imgZoom.style.opacity = 0;

    setTimeout(() => {
      img.src = imagenes[current];
      img.style.opacity = 1;

      if (imgZoom) {
        imgZoom.src = imagenes[current];
        imgZoom.style.opacity = 1;
      }

      // Actualizar bordes de miniaturas
      document.querySelectorAll('.thumb').forEach((t, i) => {
        t.classList.toggle('border-blue-500', i === current);
        t.classList.toggle('border-transparent', i !== current);
      });
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

  // 👉 LÓGICA DE ZOOM
  window.abrirZoom = () => {
    imgZoom.src = imagenes[current];
    modalZoom.classList.remove("hidden");
    modalZoom.classList.add("flex");
    document.body.style.overflow = "hidden"; // Bloquea scroll del fondo
  };

  window.cerrarZoom = () => {
    modalZoom.classList.add("hidden");
    modalZoom.classList.remove("flex");
    document.body.style.overflow = "auto";
  };

  // 👉 NAVEGACIÓN POR TECLADO (PC)
  const manejarTeclado = (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "Escape") cerrarZoom();
  };
  document.addEventListener("keydown", manejarTeclado);

  // 👉 NAVEGACIÓN TÁCTIL (SWIPE MOBILE)
  let touchStartX = 0;
  const manejarTouchStart = (e) => touchStartX = e.touches[0].clientX;
  const manejarTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    // Si el deslizamiento es mayor a 50px, cambia de imagen
    if (Math.abs(diff) > 50) {
      if (diff > 0) next(); else prev();
    }
  };

  // Escuchar gestos en la imagen principal y en el modal de zoom
  img.addEventListener("touchstart", manejarTouchStart, {passive: true});
  img.addEventListener("touchend", manejarTouchEnd);
  modalZoom.addEventListener("touchstart", manejarTouchStart, {passive: true});
  modalZoom.addEventListener("touchend", manejarTouchEnd);
}

// 👉 SIMILARES (NO TOCADO)
function mostrarSimilares(autoActual, lista) {

  const cont = document.getElementById("autos-similares");
  if (!cont) return;

  cont.innerHTML = "<h2 class='text-white text-2xl mb-4'>Te puede interesar...</h2>";

  let similares = lista.filter(a =>
    a.tipo === autoActual.tipo && a.slug !== autoActual.slug
  ).slice(0, 4);

  cont.innerHTML += `
    <div class="grid grid-cols-4 md:grid-cols-4 gap-3 md:gap-4">
      ${similares.map(a => `
        <div onclick="irAuto('${encodeURIComponent(String(a.slug || "").trim())}')"
          class="bg-white text-black rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition">
          
          <img src="${safeHttpUrl(a.imagen ? a.imagen.split(',')[0].trim() : "", FALLBACK_IMG)}" class="w-full h-32 object-cover">

          <div class="p-2 text-center text-xs sm:text-sm">
            <p class="font-bold">${escapeHtml(a.marca)} ${escapeHtml(a.modelo)}</p>
            <p>$${Number(String(a.precio || "0").replace(/\D/g, "")).toLocaleString("es-AR")}</p>
          </div>

        </div>
      `).join("")}
    </div>
  `;
}

// 👉 IR
function irAuto(slug) {
  window.location.href = "auto.html?slug=" + slug;
}