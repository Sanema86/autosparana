// Supabase reemplaza opensheet — config en js/supabase-config.js

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 👉 COMPARTIR POR WHATSAPP
function compartirWhatsApp(event) {
  event.stopPropagation();
  const btn = event.currentTarget;
  const { slug, marca, modelo, anio, precio } = btn.dataset;
  const precioNum = Number(precio || "0");
  const link = `${window.location.origin}/auto.html?slug=${encodeURIComponent(slug)}`;
  const texto = `Mirá este ${marca} ${modelo} ${anio} a $${precioNum.toLocaleString("es-AR")} en Autos Paraná 🚗\n${link}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
}

const WHATSAPP_SHARE_ICON = `
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" class="btn-compartir__icon">
    <path d="M16.04 4C9.96 4 5.04 8.93 5.04 15c0 2.13.59 4.13 1.63 5.85L4 28l7.3-2.6A10.94 10.94 0 0 0 16.04 26c6.08 0 11-4.93 11-11s-4.92-11-11-11Zm0 19.9c-1.78 0-3.45-.5-4.87-1.36l-.35-.21-3.55 1.26 1.27-3.46-.23-.36A8.9 8.9 0 0 1 7.04 15c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 8.9-9 8.9Zm4.93-6.65c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-1.59-.79-2.63-1.41-3.68-3.2-.28-.48.28-.45.8-1.5.09-.18.04-.34-.05-.48-.09-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.34-.01-.52-.01-.18 0-.46.07-.7.34-.25.27-.95.93-.95 2.26 0 1.33.97 2.62 1.11 2.8.14.18 1.9 2.9 4.66 3.95 2.32.87 2.79.7 3.3.59.5-.11 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32Z"/>
  </svg>`;


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
/**
 * Gestiona las visitas locales para evitar contar varias veces 
 * una misma entrada del mismo usuario en la sesión actual.
 */
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
// Imagen por defecto si el vehículo no tiene fotos
const FALLBACK_IMG =
  "https://via.placeholder.com/800x600?text=Imagen+no+disponible";

// 👉 TU NÚMERO
// Número de respaldo si el dueño no especifica uno
const MI_NUMERO = "5493435311312";

// 👉 SLUG
// Obtiene el identificador del auto desde la URL (?slug=...)
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

if (!slug) window.location.href = "index.html";

// 👉 DATA Supabase
db.from("autos").select("*").then(({ data, error }) => {
    if (error) {
      console.error("Error cargando auto:", error);
      document.getElementById("detalle-auto").innerHTML =
        "<h2 class='text-white text-center'>Error de conexión</h2>";
      return;
    }
    const auto = data.find(
      (a) =>
        String(a.slug).trim().toLowerCase() ===
        String(slug).trim().toLowerCase(),
    );

    if (!auto) {
      document.getElementById("detalle-auto").innerHTML =
        "<h2 style='color:white;text-align:center;'>Auto no encontrado</h2>";
      return;
    }

    mostrarAuto(auto);
    mostrarSimilares(auto, data);

    // ── Cargar avatar del vendedor ──
    if (auto.nombre_vendedor) {
      (async () => {
        // Primero buscar si existe un perfil ficticio (user_id=NULL) con este nombre
        const { data: perfilFicticio } = await db.from("perfiles")
          .select("avatar_url")
          .eq("nombre_vendedor", auto.nombre_vendedor)
          .is("user_id", null)
          .maybeSingle();

        let avatarUrl = perfilFicticio?.avatar_url;

        // Si no hay perfil ficticio, buscar por user_id del vendedor real
        if (!avatarUrl && auto.user_id) {
          const { data: perfilReal } = await db.from("perfiles")
            .select("avatar_url")
            .eq("user_id", auto.user_id)
            .maybeSingle();
          avatarUrl = perfilReal?.avatar_url;
        }

        if (avatarUrl) {
          const el = document.getElementById("seller-avatar-img");
          if (el) {
            el.innerHTML = `<img src="${avatarUrl}" alt="">`;
          }
        }
      })();
    }
  });

function mostrarAuto(auto) {
  // Limpieza y preparación de datos
  // Limpieza de precio (quita puntos, comas o $ que vengan del Excel)
  const precioLimpio = String(auto.precio || "0").replace(/\D/g, "");
  const marca = escapeHtml(auto.marca);
  const modelo = escapeHtml(auto.modelo);
  const anio = escapeHtml(auto.año);
  const km = escapeHtml(auto.km);
  const combustible = escapeHtml(auto.combustible);
  const ubicacion = escapeHtml(auto.ubicacion || "No especificada");
  const descripcion = escapeHtml(auto.descripcion || "Sin descripción");

  // --- SEO DINÁMICO ---
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
    metaDesc.setAttribute(
      "content",
      `Comprá este ${marca} ${modelo} ${anio}. KM: ${km}. Precio: $${Number(precioLimpio).toLocaleString("es-AR")}`,
    );
  } else {
    const meta = document.createElement("meta");
    meta.name = "description";
    meta.content = `Comprá este ${marca} ${modelo} ${anio}. KM: ${km}. Precio: $${Number(precioLimpio).toLocaleString("es-AR")}`;
    document.head.appendChild(meta);
  }

  const ogConfig = [
    {
      property: "og:title",
      content: `${marca} ${modelo} ${anio} en Paraná | Autos Paraná`,
    },
    {
      property: "og:description",
      content: `Mirá el detalle de este ${marca} ${modelo} ${anio}, con fotos, precio y contacto directo por WhatsApp.`,
    },
    { property: "og:url", content: canonicalHref },
    {
      property: "og:image",
      content: safeHttpUrl(auto.imagen?.split(",")[0], FALLBACK_IMG),
    },
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
  // Estructura de datos para Google (Schema Car)
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.text = JSON.stringify({
    "@context": "https://schema.org/",
    "@type": "Car",
    name: `${marca} ${modelo} ${anio}`,
    image: safeHttpUrl(auto.imagen?.split(",")[0], FALLBACK_IMG),
    offers: {
      "@type": "Offer",
      price: precioLimpio,
      priceCurrency: "ARS",
    },
  });
  document.head.appendChild(script);

  // Actualiza contador local
  const visitas = sumarVisita(auto.slug);

  // Preparación del link de WhatsApp
  const telefonoLimpio = String(auto.telefono || "")
    .replace(/\D/g, "")
    .trim();
  const telefonoFinal = telefonoLimpio.length > 8 ? telefonoLimpio : MI_NUMERO;

  const linkWhatsApp = `https://wa.me/${telefonoFinal}?text=${encodeURIComponent("Hola! Me interesa este auto que vi en la web: " + window.location.href)}`;

  const cont = document.getElementById("detalle-auto");
  if (!cont) return;

  const imagenes = auto.imagen
    ? auto.imagen
        .split(",")
        .map((img) => safeHttpUrl(img, ""))
        .filter(Boolean)
    : [FALLBACK_IMG];

  let current = 0; // Índice de la imagen que se está viendo

  cont.innerHTML = `
    <div class="detail-card p-4 md:p-6">
      <div class="detail-layout">

        <div>
          <div class="relative mb-3">
            <img id="img-principal"
                 onclick="abrirZoom()"
                 src="${imagenes[0] || FALLBACK_IMG}"
                 class="detail-gallery-main transition-opacity duration-300">

            ${
              imagenes.length > 1
                ? `
              <button onclick="prev()" class="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white px-3 py-2 rounded-full text-2xl backdrop-blur-sm hover:bg-black/80 transition">‹</button>
              <button onclick="next()" class="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white px-3 py-2 rounded-full text-2xl backdrop-blur-sm hover:bg-black/80 transition">›</button>
            `
                : ""
            }
          </div>

          <div class="flex gap-2 overflow-x-auto pb-1">
            ${imagenes
              .map(
                (img, i) => `
              <img src="${img}"
                   class="detail-thumb thumb ${i === 0 ? "active" : ""}"
                   onclick="irA(${i})">
            `,
              )
              .join("")}
          </div>
        </div>

        <div class="detail-sidebar">
          <h1 class="detail-title">${marca} ${modelo}</h1>
          <p class="text-gray-500 text-sm">Visitas: ${visitas}</p>

          <p class="detail-price">
            $${Number(precioLimpio).toLocaleString("es-AR")}
          </p>

          <div class="detail-specs">
            <div class="detail-spec"><strong>Año</strong>${anio}</div>
            <div class="detail-spec"><strong>Kilómetros</strong>${km}</div>
            <div class="detail-spec"><strong>Combustible</strong>${combustible}</div>
            <div class="detail-spec"><strong>Ubicación</strong>${ubicacion}</div>
          </div>

          <p class="mt-5 text-gray-300 text-sm leading-relaxed">${descripcion}</p>

          ${auto.nombre_vendedor ? `
          <a href="${auto.user_id ? `usuario.html?id=${encodeURIComponent(auto.user_id)}` : `usuario.html?nombre=${encodeURIComponent(auto.nombre_vendedor)}`}" class="seller-card seller-card--link" id="seller-card-link">
            <div class="seller-avatar" id="seller-avatar-img">
              ${escapeHtml(auto.nombre_vendedor.charAt(0).toUpperCase())}
            </div>
            <div>
              <p class="text-xs text-gray-500">Publicado por</p>
              <p class="text-white font-semibold">${escapeHtml(auto.nombre_vendedor)}</p>
            </div>
            <span class="seller-card__arrow">›</span>
          </a>` : ""}

          <a href="${linkWhatsApp}" target="_blank" class="btn-whatsapp">
            Consultar por WhatsApp
          </a>

          <button type="button" class="btn-compartir"
            data-slug="${escapeHtml(auto.slug)}" data-marca="${marca}" data-modelo="${modelo}"
            data-anio="${anio}" data-precio="${precioLimpio}"
            onclick="compartirWhatsApp(event)">
            ${WHATSAPP_SHARE_ICON} Compartir
          </button>
        </div>

      </div>
    </div>

    <!-- 🔍 MODAL ZOOM (Aparece al tocar la imagen) -->
    <!-- MODAL DE ZOOM (Galería a pantalla completa) -->
    <div id="modal-zoom" class="fixed inset-0 z-[3000] bg-black/95 hidden flex-col justify-center items-center p-4">
      <button onclick="cerrarZoom()" class="absolute top-5 right-5 text-white text-5xl font-light">&times;</button>
      
      <div class="relative w-full max-w-5xl flex items-center justify-center">
         <img id="img-zoom" src="" class="max-w-full max-h-[85vh] object-contain select-none shadow-2xl transition-opacity duration-300">
         
         ${
           imagenes.length > 1
             ? `
          <button onclick="prev()" class="absolute left-0 text-white text-5xl px-4 py-10 hover:bg-white/10 transition">‹</button>
          <button onclick="next()" class="absolute right-0 text-white text-5xl px-4 py-10 hover:bg-white/10 transition">›</button>
         `
             : ""
         }
      </div>
      
      <p class="text-white/60 mt-4 text-sm hidden md:block">Usá las flechas del teclado o deslizá con el dedo</p>
    </div>
  `;

  const img = document.getElementById("img-principal");
  const modalZoom = document.getElementById("modal-zoom");
  const imgZoom = document.getElementById("img-zoom");

  // Cambia la imagen actual con un efecto de transición suave
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
      document.querySelectorAll(".detail-thumb").forEach((t, i) => {
        t.classList.toggle("active", i === current);
      });
    }, 150);
  }

  // Exponer funciones al objeto window para que los botones HTML las vean
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
  // Lógica para el modal de pantalla completa
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
  // Navegación con flechas del teclado
  const manejarTeclado = (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "Escape") cerrarZoom();
  };
  document.addEventListener("keydown", manejarTeclado);

  // 👉 NAVEGACIÓN TÁCTIL (SWIPE MOBILE)
  // Soporte para gestos (Swipe) en móviles
  let touchStartX = 0;
  const manejarTouchStart = (e) => (touchStartX = e.touches[0].clientX);
  const manejarTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    // Si el deslizamiento es mayor a 50px, cambia de imagen
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  // Escuchar gestos en la imagen principal y en el modal de zoom
  img.addEventListener("touchstart", manejarTouchStart, { passive: true });
  img.addEventListener("touchend", manejarTouchEnd);
  modalZoom.addEventListener("touchstart", manejarTouchStart, {
    passive: true,
  });
  modalZoom.addEventListener("touchend", manejarTouchEnd);
}

// 👉 SIMILARES (NO TOCADO)
// Busca y muestra vehículos de la misma categoría
function mostrarSimilares(autoActual, lista) {
  const cont = document.getElementById("autos-similares");
  if (!cont) return;

  cont.innerHTML = "<h2 class='similares-title'>Te puede interesar...</h2>";

  let similares = lista
    .filter((a) => a.tipo === autoActual.tipo && a.slug !== autoActual.slug)
    .slice(0, 4);

  const precio = (p) =>
    Number(String(p || "0").replace(/\D/g, "")).toLocaleString("es-AR");

  cont.innerHTML += `
    <div class="vehicles-grid vehicles-grid--catalog">
      ${similares
        .map(
          (a) => `
        <div onclick="irAuto('${encodeURIComponent(String(a.slug || "").trim())}')"
          class="vehicle-card vehicle-card--listing">

          <div class="vehicle-card__media">
            <img src="${safeHttpUrl(a.imagen ? a.imagen.split(",")[0].trim() : "", FALLBACK_IMG)}"
              alt="${escapeHtml(a.marca)} ${escapeHtml(a.modelo)}"
              class="vehicle-card__img">
          </div>

          <div class="vehicle-card__body">
            <h3 class="vehicle-card__title">${escapeHtml(a.marca)} ${escapeHtml(a.modelo)}</h3>
            <p class="vehicle-card__meta">${escapeHtml(a.año)}</p>
            <p class="vehicle-card__price">$${precio(a.precio)}</p>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

// 👉 IR
function irAuto(slug) {
  window.location.href = "auto.html?slug=" + slug;
}
