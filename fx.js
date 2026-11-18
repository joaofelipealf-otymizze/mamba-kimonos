/* Mamba Kimonos — movimento
   GSAP + ScrollTrigger + Lenis. Tudo é opcional: sem as bibliotecas (ou com
   "reduzir movimento" ligado) o site fica completo, só sem animação. */
(function () {
  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var done = function () { root.classList.add("ready"); };
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  /* ---------- palco das cores: texto, preço e botões ---------- */
  var PRICE = { Branco: 350, Preto: 350, Azul: 390 };
  var SUB = { Branco: "Adulto A0 a A5, feminino F1 a F4", Preto: "Adulto A0 a A5, feminino F1 a F4", Azul: "Adulto A0 a A5" };
  var shown = 350, priceTween = null;
  var pickHook = null;

  document.addEventListener("mamba:color", function (e) {
    var c = e.detail, el = $("#stage-price"), to = PRICE[c];
    if (!el || to === undefined) return;
    if (hasGsap && !reduce) {
      if (priceTween) priceTween.kill();
      var o = { v: shown };
      priceTween = gsap.to(o, { v: to, duration: .8, ease: "power3.out", onUpdate: function () { el.textContent = Math.round(o.v); } });
    } else { el.textContent = to; }
    shown = to;
    $("#stage-sub").textContent = SUB[c];
    $$(".stage-pick button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.c === c ? "true" : "false"); });
  });
  $$(".stage-pick button").forEach(function (b) {
    b.addEventListener("click", function () { (pickHook || window.mamba.setColor)(b.dataset.c); });
  });

  // "Escolher este" leva a cor que está na tela para a ficha de pedido
  var pickBtn = $("#stage-pick");
  if (pickBtn) pickBtn.addEventListener("click", function () { window.mamba.setColor(root.dataset.c); });

  if (!hasGsap || reduce) { done(); return; }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- scroll suave ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .09 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        var t = id.length > 1 && $(id);
        if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -64, duration: 1.5 }); }
      });
    });
  }

  window.mamba.scrollTo = function (t) {
    if (lenis) lenis.scrollTo(t, { offset: -64, duration: 1.5 });
    else t.scrollIntoView({ behavior: "smooth" });
  };

  /* ---------- utilitário: quebrar texto em palavras ---------- */
  function splitWords(el) {
    var out = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            var wi = document.createElement("span"); wi.className = "wi"; wi.textContent = tok;
            w.appendChild(wi); frag.appendChild(w); out.push(wi);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") { walk(n); }
      });
    })(el);
    return out;
  }

  /* ---------- abertura + entrada do hero ---------- */
  gsap.set(".lm .l", { yPercent: 118, filter: "blur(30px)" });
  gsap.set(".hero .fade", { y: 34, opacity: 0, filter: "blur(10px)" });
  gsap.set(".thread-draw", { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(".top", { yPercent: -110 });

  var intro = gsap.timeline({ defaults: { ease: "power4.out" }, onComplete: function () { done(); if (lenis) lenis.start(); } });
  intro
    .from(".loader-logo", { scale: .5, opacity: 0, filter: "blur(30px)", duration: 1.1 })
    .to(".loader-bar i", { scaleX: 1, duration: 1, ease: "power2.inOut" }, .25)
    .to(".loader", { yPercent: -100, duration: .9, ease: "power4.inOut" }, "+=.05")
    .to(".lm .l", { yPercent: 0, filter: "blur(0px)", duration: 1.25, stagger: .09 }, "-=.45")
    .to(".thread-draw", { strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut" }, "-=1.1")
    .to(".hero .fade", { y: 0, opacity: 1, filter: "blur(0px)", stagger: .1, duration: .9, clearProps: "filter" }, "-=1.5")
    .to(".top", { yPercent: 0, duration: .8, clearProps: "transform" }, "-=.9");
  // trava de segurança: nunca deixar a abertura presa
  setTimeout(function () { if (!root.classList.contains("ready")) { intro.progress(1); } }, 6500);

  /* ---------- topo some ao descer, volta ao subir ---------- */
  var topBar = $(".top");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: function (s) { topBar.classList.toggle("hide", s.direction === 1 && s.scroll() > 500); }
  });

  /* ---------- fio de progresso ---------- */
  gsap.to(".progress i", { scaleY: 1, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: .3 } });

  /* ---------- títulos: palavra por palavra, saindo do desfoque ---------- */
  $$(".rv").forEach(function (el) {
    var words = splitWords(el);
    gsap.set(words, { yPercent: 112, filter: "blur(14px)" });
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: show, onLeave: show
    });
    function show() { gsap.to(words, { yPercent: 0, filter: "blur(0px)", duration: 1.1, stagger: .07, ease: "power4.out", clearProps: "filter", overwrite: "auto" }); }
  });

  /* ---------- entradas suaves ---------- */
  var fades = $$(".fade").filter(function (e) { return !e.closest(".hero"); }).concat($$(".step"), $$(".spec-row"), $$(".acc"), $$(".ticket"), $$(".order-fields fieldset"));
  gsap.set(fades, { y: 38, opacity: 0, filter: "blur(8px)" });
  var reveal = function (b) { gsap.to(b, { y: 0, opacity: 1, filter: "blur(0px)", stagger: .1, duration: 1, ease: "power3.out", clearProps: "all", overwrite: "auto" }); };
  ScrollTrigger.batch(fades, { start: "top 92%", once: true, onEnter: reveal, onLeave: reveal });

  /* ---------- números que contam ---------- */
  $$("[data-count]").forEach(function (el) {
    var to = +el.dataset.count; el.textContent = "0";
    ScrollTrigger.create({
      trigger: el, start: "top 92%", once: true,
      onEnter: count, onLeave: count
    });
    var ran = false;
    function count() { if (ran) return; ran = true; var o = { v: 0 }; gsap.to(o, { v: to, duration: 1.8, ease: "power2.out", onUpdate: function () { el.textContent = Math.round(o.v); } }); }
  });

  /* ---------- faixa: entorta com a velocidade da rolagem ---------- */
  var track = $(".marquee .track");
  var skewTo = gsap.quickTo(track, "skewX", { duration: .5, ease: "power3" });
  var skewT;
  ScrollTrigger.create({
    onUpdate: function (s) {
      skewTo(gsap.utils.clamp(-12, 12, s.getVelocity() / -260));
      clearTimeout(skewT); skewT = setTimeout(function () { skewTo(0); }, 110);
    }
  });

  /* ---------- palco das cores fixado: a rolagem troca a cor ---------- */
  var mm = gsap.matchMedia();
  mm.add("(min-width: 900px)", function () {
    var names = ["Branco", "Preto", "Azul"], cur = 0;
    var st = ScrollTrigger.create({
      trigger: ".stage", start: "top top", end: "+=230%", pin: ".stage-pin", anticipatePin: 1,
      onUpdate: function (s) {
        var i = Math.min(2, Math.floor(s.progress * 3));
        if (i !== cur) { cur = i; window.mamba.preview(names[i]); }
      },
      // ao sair do palco, a página volta para a cor que está marcada na ficha
      onLeave: function () { cur = -1; window.mamba.preview(window.mamba.formColor()); },
      onLeaveBack: function () { cur = -1; window.mamba.preview(window.mamba.formColor()); }
    });
    pickHook = function (c) {
      var i = names.indexOf(c), y = window.scrollY;
      window.mamba.setColor(c);
      if (lenis && y >= st.start - 80 && y <= st.end + 80) {
        lenis.scrollTo(st.start + ((i + .5) / 3) * (st.end - st.start), { duration: 1.1 });
      }
    };
    return function () { pickHook = null; };
  });

  /* ---------- paralaxe e outros movimentos ---------- */
  gsap.to(".hero-bg", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".wordmark", { yPercent: -8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  var photo = $(".photo-slot") || $(".photo-real");
  if (photo) gsap.fromTo(photo, { yPercent: 6 }, { yPercent: -6, ease: "none", scrollTrigger: { trigger: ".quem", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.from(".foot-mark", { yPercent: 28, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: true } });
  gsap.to(".steps-line i", { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".steps", start: "top 72%", end: "bottom 72%", scrub: .4 } });
  gsap.to(".acad-bg img", { yPercent: -18, ease: "none", scrollTrigger: { trigger: ".academias", start: "top bottom", end: "bottom top", scrub: true } });

  /* frase "quem faz": acende palavra por palavra com a rolagem */
  var st = $(".statement");
  if (st) {
    var ws = splitWords(st);
    gsap.set(ws, { opacity: .16 });
    gsap.to(ws, { opacity: 1, stagger: .12, ease: "none", scrollTrigger: { trigger: st, start: "top 82%", end: "bottom 50%", scrub: true } });
  }

  if (fine) {
    /* ---------- cursor próprio ---------- */
    root.classList.add("has-cursor");
    var cur = $(".cursor");
    var cx = gsap.quickTo(cur, "x", { duration: .35, ease: "power3" });
    var cy = gsap.quickTo(cur, "y", { duration: .35, ease: "power3" });
    window.addEventListener("pointermove", function (e) { cx(e.clientX); cy(e.clientY); }, { passive: true });
    document.addEventListener("pointerover", function (e) {
      cur.classList.toggle("big", !!e.target.closest("a, button, label, summary"));
    });

    /* ---------- lanterna dourada nas letras ---------- */
    var glowEls = $$(".wordmark .l, .acad-price b, .foot-mark, .n");
    var mx = -9999, my = -9999, raf = 0;
    function paint() {
      raf = 0;
      var vh = innerHeight;
      glowEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        el.style.setProperty("--lx", (mx - r.left) + "px");
        el.style.setProperty("--ly", (my - r.top) + "px");
      });
    }
    window.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
    document.addEventListener("pointerleave", function () { mx = my = -9999; paint(); });

    /* ---------- inclinação 3D do kimono ---------- */
    var vis = $(".stage-visual");
    if (vis) {
      gsap.set(vis, { transformPerspective: 900 });
      var rx = gsap.quickTo(vis, "rotationX", { duration: .8, ease: "power3" });
      var ry = gsap.quickTo(vis, "rotationY", { duration: .8, ease: "power3" });
      window.addEventListener("pointermove", function (e) {
        var r = vis.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        var dx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
        var dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
        ry(dx * 26); rx(-dy * 18);
      }, { passive: true });
    }

    /* ---------- botões magnéticos ---------- */
    $$(".mag").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .28, y: (e.clientY - r.top - r.height / 2) * .4, duration: .4, ease: "power3.out" });
      });
      el.addEventListener("pointerleave", function () { gsap.to(el, { x: 0, y: 0, duration: .9, ease: "elastic.out(1, .4)" }); });
    });
  }

  /* ---------- recalcular depois que fonte e imagens carregam ---------- */
  var refresh = function () { ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener("load", refresh);
})();
