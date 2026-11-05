(function () {
  'use strict';
  var data = window.TALLERES || [];
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* ── Cuenta regresiva (hora de Ecuador) ── */
  var START = new Date('2026-11-10T08:00:00-05:00').getTime();
  var END = new Date('2026-11-13T11:00:00-05:00').getTime();
  var two = function (n) { return String(n).padStart(2, '0'); };
  var cdTimer;
  function tick() {
    var now = Date.now();
    if (now >= START) {
      $('#cdGrid').hidden = true;
      $('#cdLabel').textContent = now < END ? '¡El campamento está en marcha!' : '¡Gracias por ser parte del campamento!';
      clearInterval(cdTimer);
      return;
    }
    var s = Math.floor((START - now) / 1000);
    $('#cdD').textContent = two(Math.floor(s / 86400));
    $('#cdH').textContent = two(Math.floor(s / 3600) % 24);
    $('#cdM').textContent = two(Math.floor(s / 60) % 60);
    $('#cdS').textContent = two(s % 60);
  }
  tick();
  cdTimer = setInterval(tick, 1000);

  /* ── Navegación ── */
  var nav = $('#nav'), toggle = $('#navToggle'), links = $('#navLinks');
  var setNav = function () { nav.classList.toggle('is-solid', scrollY > 40); };
  addEventListener('scroll', setNav, { passive: true }); setNav();
  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { links.classList.remove('open'); toggle.setAttribute('aria-expanded', false); }
  });

  /* ── Tarjetas de talleres ── */
  var cards = $('#cards');
  data.forEach(function (t) {
    var c = el('article', 'card');
    c.dataset.tipo = t.tipo;
    c.dataset.est = t.estudiantes > 0 ? '1' : '0';
    var tag = el('p', 'tag' + (t.tipo === 'Hackatón' ? ' hack' : ''));
    tag.append(el('span', '', t.institucion), el('span', '', '|'), el('span', '', t.tipo));
    var btn = el('button', '', 'Ver más →');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Ver más sobre ' + t.titulo);
    btn.addEventListener('click', function () { openModal(t); });
    c.append(tag, el('h3', '', t.titulo), el('p', '', t.dirigido), btn);
    cards.append(c);
  });

  /* ── Filtros ── */
  var chips = document.querySelectorAll('.chip');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.dataset.filter, n = 0;
      chips.forEach(function (x) {
        x.classList.toggle('is-on', x === chip);
        x.setAttribute('aria-pressed', x === chip);
      });
      cards.querySelectorAll('.card').forEach(function (c) {
        var show = f === 'all' || (f === 'estudiantes' ? c.dataset.est === '1' : c.dataset.tipo === f);
        c.hidden = !show;
        if (show) n++;
        if (show && window.gsap) gsap.set(c, { autoAlpha: 1, y: 0 });
      });
      $('#filterStatus').textContent = n + ' actividades';
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* ── Detalle ── */
  var modal = $('#modal'), body = $('#modalBody');
  function meta(label, value) {
    var d = el('div'); d.append(el('b', '', label), document.createTextNode(value)); return d;
  }
  function openModal(t) {
    var w = el('div', 'm-in');
    var tag = el('p', 'tag' + (t.tipo === 'Hackatón' ? ' hack' : ''));
    tag.append(el('span', '', t.institucion), el('span', '', '|'), el('span', '', t.tipo));
    var h = el('h2', '', t.titulo); h.id = 'mTitle';
    w.append(tag, h);
    var m = el('div', 'm-meta');
    m.append(meta('Dirigido a', t.dirigido));
    var cupos = t.participantes + ' participantes';
    if (t.estudiantes) cupos = t.docentes + ' docentes y ' + t.estudiantes + ' estudiantes';
    m.append(meta('Cupos', cupos));
    if (t.resultado) m.append(meta('Resultado', t.resultado));
    w.append(m);
    if (t.descripcion.length) t.descripcion.forEach(function (p) { w.append(el('p', '', p)); });
    else w.append(el('p', '', 'Descripción próximamente.'));
    if (t.impacto) {
      var i = el('p', 'm-impact'); i.append(el('b', '', 'Impacto en la educación'), document.createTextNode(t.impacto)); w.append(i);
    }
    if (t.llevar) {
      var ll = el('p', 'm-impact'); ll.append(el('b', '', 'Qué traer'), document.createTextNode(t.llevar)); w.append(ll);
    }
    w.append(el('h3', '', 'Horarios'));
    t.grupos.forEach(function (g) {
      var box = el('div', 'm-group');
      var b = el('b', '', g.nombre + ' '); b.append(el('span', '', '· ' + g.detalle));
      var ul = el('ul');
      g.sesiones.forEach(function (s) {
        var li = el('li');
        li.append(el('span', '', s.dia), el('time', '', s.hora), el('span', '', s.actividad));
        ul.append(li);
      });
      box.append(b, ul); w.append(box);
    });
    body.replaceChildren(w);
    modal.showModal();
    modal.scrollTop = 0;
  }
  $('#modalClose').addEventListener('click', function () { modal.close(); });
  modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });

  /* ── Animaciones en scroll ── */
  if (!window.gsap || !window.ScrollTrigger) return; // sin CDN el sitio queda completo y estático
  gsap.registerPlugin(ScrollTrigger);
  var root = document.documentElement;
  var mm = gsap.matchMedia();

  mm.add({
    desk: '(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)',
    small: '(max-width: 899.98px), (max-height: 559.98px)',
    motion: '(prefers-reduced-motion: no-preference)'
  }, function (ctx) {
    var c = ctx.conditions;
    if (!c.motion) return;
    var setProgramH;

    /* Escenas fijas con position:sticky: el alto de cada contenedor da el recorrido */
    if (c.desk) {
      root.classList.add('motion-hero', 'motion-h');

      /* HERO fijado: Eugenia sube desde el río y cambia la escena */
      var heroTl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.hero-track', start: 'top top', end: 'bottom bottom', scrub: .7 }
      });
      gsap.set('.hero-intro', { autoAlpha: 0, y: 46 });
      heroTl
        .to('.hero-photo img', { scale: 1.13, yPercent: -2, duration: 1 }, 0)
        .to('.hero-scrim', { opacity: 1, duration: .1 }, 0)
        .to('.hero-main', { y: -90, autoAlpha: 0, duration: .34, ease: 'power1.in' }, .04)
        .fromTo('.hero-eugenia', { x: '26vw', y: '82vh', rotation: 24, scale: .55 },
          { x: 0, y: 0, rotation: -3, scale: 1, duration: .62, ease: 'power2.out' }, .02)
        .to('.hero-intro', { autoAlpha: 1, y: 0, duration: .26, ease: 'power2.out' }, .4)
        .to({}, { duration: .12 });

      /* PROGRAMA: recorrido horizontal con Eugenia volando */
      var days = $('#days');
      var dist = function () { return Math.max(0, days.scrollWidth - innerWidth); };
      setProgramH = function () { $('.programa').style.height = (innerHeight * 1.35 + dist()) + 'px'; };
      setProgramH();
      ScrollTrigger.addEventListener('refreshInit', setProgramH);
      var dayTl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.programa', start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true }
      });
      dayTl.to(days, { x: function () { return -dist(); }, duration: 1 }, 0)
        .fromTo('.program-eugenia',
          { x: function () { return innerWidth * .46; }, rotation: -6 },
          { x: function () { return innerWidth - $('.program-eugenia').offsetWidth - innerWidth * .02; }, rotation: 5, duration: 1 }, 0)
        .to('.program-eugenia', { keyframes: { y: [0, 18, -8, 16, 0] }, duration: 1 }, 0);
    } else {
      root.classList.remove('motion-hero', 'motion-h');
      /* Móvil: sin fijar, parallax suave */
      gsap.from('.hero-eugenia', { x: 70, rotation: 10, ease: 'none', scrollTrigger: { trigger: '.hero-eugenia', start: 'top bottom', end: 'center center', scrub: .6 } });
      gsap.from('.day', { x: 40, autoAlpha: 0, stagger: .1, duration: .6, ease: 'power2.out', scrollTrigger: { trigger: '#days', start: 'top 85%', once: true } });
    }

    /* Encendido de neón del logotipo */
    gsap.fromTo('.lockup', { opacity: .15 }, { keyframes: { opacity: [.15, 1, .35, 1, .6, 1] }, duration: 1, ease: 'none' });
    gsap.from('.hero-date, .countdown', { x: -50, autoAlpha: 0, duration: .9, delay: .55, stagger: .16, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });

    /* Aparición general */
    gsap.set('.reveal', { autoAlpha: 0, y: 34 });
    ScrollTrigger.batch('.reveal', {
      start: 'top 88%', once: true,
      onEnter: function (b) { gsap.to(b, { autoAlpha: 1, y: 0, duration: .75, stagger: .07, ease: 'power3.out', overwrite: true }); }
    });

    /* Cifras */
    document.querySelectorAll('[data-count]').forEach(function (n) {
      var end = +n.dataset.count, o = { v: 0 };
      var fmt = function (v) { return n.hasAttribute('data-fmt') ? Math.round(v).toLocaleString('es-EC').replace(/,/g, '.') : Math.round(v); };
      n.textContent = fmt(0);
      gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: n, start: 'top 90%', once: true },
        onUpdate: function () { n.textContent = fmt(o.v); },
        onComplete: function () { n.textContent = n.hasAttribute('data-fmt') ? '1.375' : end; } });
    });

    /* Estrellas lejanas */
    gsap.to('.stars-far', { yPercent: -7, ease: 'none', scrollTrigger: { trigger: '.sobre', start: 'top bottom', end: 'bottom top', scrub: true } });

    /* TALLERES: el gato acompaña las tarjetas */
    var gatoTl = gsap.timeline({ defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.talleres', start: 'top 70%', end: 'bottom bottom', scrub: .9 } });
    gatoTl.fromTo('.gato', { x: c.desk ? 260 : 60, rotation: 16, scale: .72, autoAlpha: 0 }, { x: 0, rotation: -3, scale: 1, autoAlpha: 1, duration: .16, ease: 'power2.out' })
      .to('.gato', { rotation: 4, y: -22, scale: 1.04, duration: .32, ease: 'sine.inOut' })
      .to('.gato', { rotation: -5, y: 18, x: -14, scale: .98, duration: .32, ease: 'sine.inOut' })
      .to('.gato', { rotation: 2, y: 0, x: 0, scale: 1.03, duration: .2, ease: 'sine.inOut' });
    gsap.fromTo('.gato-glow', { scale: .75, opacity: .5 }, { scale: 1.12, opacity: 1, ease: 'sine.inOut',
      scrollTrigger: { trigger: '.talleres', start: 'top 60%', end: 'bottom bottom', scrub: 1.2 } });

    /* Tarjetas */
    gsap.set('.card', { autoAlpha: 0, y: 40 });
    ScrollTrigger.batch('.card', { start: 'top 92%', once: true,
      onEnter: function (b) { gsap.to(b, { autoAlpha: 1, y: 0, duration: .6, stagger: .08, ease: 'power3.out', overwrite: true, clearProps: 'transform' }); } });

    /* PARTICIPA: los dos personajes se encuentran */
    gsap.timeline({ defaults: { ease: 'power2.out' },
      scrollTrigger: { trigger: '.participa', start: 'top 85%', end: 'top 15%', scrub: .8 } })
      .fromTo('.meet-eugenia', { x: '-46vw', rotation: -22, scale: .7 }, { x: 0, rotation: 0, scale: 1 }, 0)
      .fromTo('.meet-gato', { x: '46vw', rotation: 22, scale: .7 }, { x: 0, rotation: 0, scale: 1 }, 0);

    return function () {
      root.classList.remove('motion-hero', 'motion-h');
      if (setProgramH) ScrollTrigger.removeEventListener('refreshInit', setProgramH);
      $('.programa').style.height = '';
    };
  });

  addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
