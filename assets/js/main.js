/* Rumbas de la Ciudad · Festival Náutico Cartagena 2026
   Reservas por WhatsApp, selector de fechas, armador de reserva y movimiento al hacer scroll. */
(function () {
  'use strict';

  // Si este archivo carga, la red de seguridad del <head> ya no hace falta.
  clearTimeout(window.__rdlcMostrarTodo);

  var d = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!d.classList.contains('is-ready')) setTimeout(function () { d.classList.add('is-ready'); }, 2000);

  /* Mensajes de WhatsApp ------------------------------------------------- */
  var WA = 'https://wa.me/573104001919?text=';
  var DIAS = { '13': 'viernes 13 de noviembre', '14': 'sábado 14 de noviembre' };
  var ZONAS = {
    'bar-amarillo': { nombre: 'Bar Amarillo flotante', msg: 'Bar Amarillo flotante', precio: '$450.000 COP por persona' },
    'playa': { nombre: 'Zona playa', msg: 'playa', precio: '$250.000 COP' },
    'mesas-cocteleras': { nombre: 'Zona mesas cocteleras', msg: 'mesas cocteleras', precio: '$180.000 COP' },
    'soleadoras': { nombre: 'Zona soleadoras', msg: 'soleadoras', precio: '$150.000 COP' },
    'lounge': { nombre: 'Zona lounge', msg: 'lounge', precio: '$180.000 COP' },
    'playa-lounge': { nombre: 'Zona playa lounge', msg: 'playa lounge', precio: '$250.000 COP' }
  };

  function personas(n) {
    if (!n) return '';
    return n === 1 ? ' Sería para 1 persona.' : ' Seríamos ' + n + ' personas.';
  }
  function msgFestival(dia, n) {
    var cuando = DIAS[dia] ? 'para el ' + DIAS[dia] : '(13 y 14 de noviembre)';
    return 'Hola, quiero información y disponibilidad para reservar cupos del Festival Náutico Cartagena 2026 ' + cuando +
      '. Valor publicado: $1.000.000 COP por persona y por día.' + personas(n) + ' ¿Cómo puedo confirmar mi reserva?';
  }
  function msgRemate(zona, n) {
    var z = ZONAS[zona];
    var parte = z ? ' Me interesa la zona ' + z.msg + ' (valor publicado: ' + z.precio + ').' : ' Quisiera conocer las zonas disponibles.';
    return 'Hola, quiero reservar para el Remate Ultra Privado del domingo 15 de noviembre de 2026 en Isla Santa Cruz, playas de Barú.' +
      parte + personas(n) + ' ¿Me confirman disponibilidad y el proceso de reserva?';
  }
  function url(msg) { return WA + encodeURIComponent(msg); }
  function mayuscula(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function todos(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }

  // Los href del HTML ya funcionan sin JS; aquí se generan desde la misma fuente.
  todos('[data-book]').forEach(function (a) {
    var tipo = a.getAttribute('data-book');
    if (tipo === 'remate') a.href = url(msgRemate(a.getAttribute('data-zone')));
    else if (tipo === 'festival-13') a.href = url(msgFestival('13'));
    else if (tipo === 'festival-14') a.href = url(msgFestival('14'));
    else a.href = url(msgFestival(null));
  });

  /* Día elegido: portada, pestañas y armador comparten el mismo estado ----- */
  var estado = { dia: null };
  var botonesDia = todos('.day');
  var siguenDia = todos('[data-follow-day]');
  var notaDia = document.querySelector('[data-day-note]');

  function elegirDia(dia, origen) {
    estado.dia = dia;
    botonesDia.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-day') === dia)); });
    siguenDia.forEach(function (a) { a.href = url(msgFestival(dia)); });
    if (notaDia) notaDia.textContent = dia ? mayuscula(DIAS[dia]) : '310 400 1919';
    if (dia && origen !== 'tab') activarTab(dia, false, true);
    if (dia && origen !== 'composer' && expActual() !== 'remate') marcarExp(dia);
    pedirTick();
  }
  botonesDia.forEach(function (b) {
    b.addEventListener('click', function () {
      var dia = b.getAttribute('data-day');
      elegirDia(b.getAttribute('aria-pressed') === 'true' ? null : dia, 'hero');
    });
  });

  /* Pestañas 13 / 14 ------------------------------------------------------- */
  var tabs = todos('[role="tab"]');
  var paneles = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

  function activarTab(dia, foco, animar) {
    tabs.forEach(function (t, i) {
      var on = t.getAttribute('data-day') === dia;
      var panel = paneles[i];
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && panel.hidden && animar && !reduce) {
        panel.classList.remove('is-switching');
        void panel.offsetWidth;
        panel.classList.add('is-switching');
      }
      panel.hidden = !on;
      if (on && foco) t.focus();
    });
  }
  activarTab('13', false, false);

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      if (t.getAttribute('aria-selected') === 'true') return;
      activarTab(t.getAttribute('data-day'), false, true);
      elegirDia(t.getAttribute('data-day'), 'tab');
    });
    t.addEventListener('keydown', function (e) {
      var j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      activarTab(tabs[j].getAttribute('data-day'), true, true);
      elegirDia(tabs[j].getAttribute('data-day'), 'tab');
    });
  });

  /* Armador de reserva ------------------------------------------------------ */
  var radios = todos('input[name="exp"]');
  var campoZona = document.querySelector('[data-zone-field]');
  var selZona = document.getElementById('zona');
  var inputPersonas = document.getElementById('personas');
  var pasos = todos('[data-step]');
  var resumen = document.querySelector('[data-summary]');
  var irWhatsApp = document.querySelector('[data-composer-go]');
  var MAX = 30;

  function expActual() {
    for (var i = 0; i < radios.length; i++) if (radios[i].checked) return radios[i].value;
    return '13';
  }
  function marcarExp(valor) {
    radios.forEach(function (r) { r.checked = r.value === valor; });
    actualizarArmador();
  }
  function cantidad() {
    var n = parseInt(inputPersonas.value, 10);
    if (isNaN(n)) n = 1;
    return Math.min(MAX, Math.max(1, n));
  }
  function actualizarArmador() {
    var exp = expActual();
    var n = cantidad();
    var gente = n + (n === 1 ? ' persona' : ' personas');
    campoZona.hidden = exp !== 'remate';
    pasos[0].disabled = n <= 1;
    pasos[1].disabled = n >= MAX;
    if (exp === 'remate') {
      var z = ZONAS[selZona.value];
      resumen.textContent = 'Remate Ultra Privado · domingo 15 de noviembre · ' +
        (z ? z.nombre + ' · ' + gente + ' · ' + z.precio : gente + ' · elige una zona para ver su valor');
      irWhatsApp.href = url(msgRemate(selZona.value, n));
    } else {
      resumen.textContent = 'Festival Náutico · ' + DIAS[exp] + ' · ' + gente + ' · $1.000.000 COP por persona / por día';
      irWhatsApp.href = url(msgFestival(exp, n));
    }
  }

  radios.forEach(function (r) {
    r.addEventListener('change', function () {
      actualizarArmador();
      if (r.checked && DIAS[r.value]) elegirDia(r.value, 'composer');
    });
  });
  selZona.addEventListener('change', actualizarArmador);
  inputPersonas.addEventListener('input', actualizarArmador);
  inputPersonas.addEventListener('change', function () { inputPersonas.value = cantidad(); actualizarArmador(); });
  pasos.forEach(function (b) {
    b.addEventListener('click', function () {
      inputPersonas.value = Math.min(MAX, Math.max(1, cantidad() + parseInt(b.getAttribute('data-step'), 10)));
      actualizarArmador();
    });
  });
  // Al reservar una zona, el armador queda listo con esa zona por si el visitante vuelve.
  todos('[data-zone]').forEach(function (a) {
    a.addEventListener('click', function () {
      radios.forEach(function (r) { r.checked = r.value === 'remate'; });
      selZona.value = a.getAttribute('data-zone');
      actualizarArmador();
    });
  });
  actualizarArmador();

  /* Scroll: barra, progreso, revelados, parallax y WhatsApp flotante -------- */
  var barra = document.getElementById('barra');
  var progreso = barra.querySelector('.bar__progress span');
  var enlacesNav = todos('[data-wp]', barra);
  var secLineup = document.getElementById('line-up');
  var secRemate = document.getElementById('remate');
  var ctaPortada = document.querySelector('.hero__cta');
  var tapanFlotante = todos('.zone-list, .composer, .foot');
  var flotante = document.querySelector('[data-wa-float]');
  var claveFlotante = '';
  var pendientes = todos('.rv');
  var parallax = reduce ? [] : todos('[data-parallax]').map(function (el) {
    return { el: el, marco: el.closest('[data-parallax-frame]') || el.parentElement, f: parseFloat(el.getAttribute('data-parallax')) || 0 };
  });
  var enCola = false;

  function tick() {
    enCola = false;
    var vh = window.innerHeight;
    var y = window.scrollY;
    var max = d.scrollHeight - vh;

    // Primero todas las lecturas…
    var revelar = pendientes.filter(function (el) { return el.getBoundingClientRect().top < vh * 0.9; });
    var desplazamientos = parallax.map(function (p) {
      var r = p.marco.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return null;
      var lim = r.height * 0.05;
      return Math.max(-lim, Math.min(lim, (r.top + r.height / 2 - vh / 2) * -p.f));
    });
    var tramo = secRemate.getBoundingClientRect().top < vh * 0.5 ? 'remate'
      : secLineup.getBoundingClientRect().top < vh * 0.55 ? 'festival' : '';
    var ctaFuera = ctaPortada.getBoundingClientRect().bottom < 0;
    var tapado = tapanFlotante.some(function (el) {
      var r = el.getBoundingClientRect();
      return r.top < vh && r.bottom > 0;
    });

    // …después las escrituras.
    barra.classList.toggle('is-scrolled', y > 24);
    progreso.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : '0');
    if (revelar.length) {
      revelar.forEach(function (el) { el.classList.add('in'); });
      pendientes = pendientes.filter(function (el) { return !el.classList.contains('in'); });
    }
    parallax.forEach(function (p, i) {
      if (desplazamientos[i] !== null) p.el.style.transform = 'translate3d(0,' + desplazamientos[i].toFixed(1) + 'px,0)';
    });
    enlacesNav.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('data-wp') === tramo); });
    flotante.classList.toggle('is-on', ctaFuera && !tapado);
    var clave = tramo === 'remate' ? 'remate' : 'festival-' + estado.dia;
    if (clave !== claveFlotante) {
      claveFlotante = clave;
      flotante.href = tramo === 'remate' ? url(msgRemate(null)) : url(msgFestival(estado.dia));
    }
  }
  function pedirTick() {
    if (enCola) return;
    enCola = true;
    requestAnimationFrame(tick);
  }
  window.addEventListener('scroll', pedirTick, { passive: true });
  window.addEventListener('resize', pedirTick);
  window.addEventListener('load', pedirTick);
  pedirTick();
})();
