/* Winlucks site — motion layer
 * Uses GSAP + ScrollTrigger for scroll animations when it loads. Scrolling itself stays native
 * (instant), with no smooth-scroll delay. Everything degrades gracefully: without them the page still works,
 * and people who turn on "reduce motion" get a calm, static page.
 */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  /* scroll progress bar */
  const bar = document.querySelector(".scroll-progress span");
  const progress = () => { const h = document.documentElement; const p = h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1); if (bar) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`; };
  addEventListener("scroll", progress, { passive: true }); progress();

  if (reduce) return;

  /* 3D tilt + spotlight on cards (mouse only) */
  if (fine) {
    document.querySelectorAll(".card, .aud a, .stat").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg) translateY(-4px)`;
        el.style.setProperty("--mx", (x + .5) * 100 + "%"); el.style.setProperty("--my", (y + .5) * 100 + "%");
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
    /* magnetic primary buttons */
    document.querySelectorAll(".btn-gold, .btn-purple").forEach(b => {
      b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * .14).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * .22).toFixed(1)}px)`; });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
  }

  /* split headings into words for the reveal (keeps inner spans like the gold "EVER!") */
  const split = el => {
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "w-wrap";
          const i = document.createElement("span"); i.className = "w"; i.textContent = part; w.appendChild(i); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains("w-wrap")) split(n);
    });
  };

  const run = () => {
    if (!window.gsap || !window.ScrollTrigger) {
      /* light parallax without GSAP */
      const els = [...document.querySelectorAll("[data-speed]")];
      const f = () => els.forEach(el => { const r = el.getBoundingClientRect(); const c = r.top + r.height / 2 - innerHeight / 2; el.style.translate = `0 ${(-c * parseFloat(el.dataset.speed) * .25).toFixed(1)}px`; });
      addEventListener("scroll", f, { passive: true }); f();
      return;
    }
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("gsap-on");

    /* native scrolling: no smooth-scroll library, so the page moves instantly with the wheel */

    /* hero entrance */
    const hero = document.querySelector(".hero, .page-hero");
    if (hero) {
      const h1 = hero.querySelector("h1"); if (h1) split(h1);
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(hero.querySelectorAll(".eyebrow, .crumbs, .kicker"), { y: 18, opacity: 0, duration: .6, stagger: .08 })
        .from(hero.querySelectorAll("h1 .w"), { yPercent: 110, duration: .9, stagger: .05 }, "-=.35")
        .from(hero.querySelectorAll(".lead, h1 + p, .stores, .trustline, .btns"), { y: 22, opacity: 0, duration: .7, stagger: .1 }, "-=.55")
        .from(hero.querySelectorAll(".hero-visual .main, .page-hero .art"), { scale: .9, opacity: 0, duration: 1.1 }, "-=1")
        .from(hero.querySelectorAll(".float"), { scale: .5, opacity: 0, duration: .7, stagger: .14, ease: "back.out(1.8)" }, "-=.6");
    }

    /* section headings: word-by-word */
    gsap.utils.toArray(".sec-head h2, .split h2, .feature h2, .goldband h2, .download h2").forEach(h => {
      split(h);
      gsap.from(h.querySelectorAll(".w"), { yPercent: 105, duration: .8, stagger: .035, ease: "power3.out", scrollTrigger: { trigger: h, start: "top 88%" } });
    });

    /* artwork scale-in */
    gsap.utils.toArray(".split .art > img:not(.deco), .split .art .mock, .download .phone").forEach(el => {
      gsap.from(el, { scale: .86, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });

    /* staggered card grids */
    gsap.utils.toArray(".cards, .steps, .aud").forEach(g => {
      gsap.from(g.children, { y: 40, opacity: 0, duration: .8, stagger: .09, ease: "power3.out", scrollTrigger: { trigger: g, start: "top 86%" } });
    });

    /* parallax decorations */
    gsap.utils.toArray("[data-speed]").forEach(el => {
      gsap.to(el, { y: () => -parseFloat(el.dataset.speed) * 220, ease: "none", scrollTrigger: { trigger: el.closest("section, .feature, .download") || el, start: "top bottom", end: "bottom top", scrub: true } });
    });

    /* timeline line draws in */
    const tline = document.querySelector(".timeline");
    if (tline) gsap.from(tline.children, { opacity: 0, y: 24, duration: .7, stagger: .15, scrollTrigger: { trigger: tline, start: "top 85%" } });

    ScrollTrigger.refresh();
  };
  if (document.readyState === "complete") run(); else addEventListener("load", run);
})();
