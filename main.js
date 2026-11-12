/* Waheed Chitapure — portfolio
   GSAP + ScrollTrigger for scroll animation, Lenis for smooth scrolling. */

(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Mobile menu ---------- */
  const burger = document.querySelector(".nav__burger");
  const menu = document.querySelector(".mobile-menu");
  const toggleMenu = (open) => {
    burger.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
  };
  burger.addEventListener("click", () => toggleMenu(!menu.classList.contains("is-open")));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ---------- Split "scrub" text into words ---------- */
  document.querySelectorAll(".scrub-text").forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
  });

  /* ---------- Code editor tabs ---------- */
  const tabs = document.querySelectorAll(".editor__tabs button");
  tabs.forEach((btn) =>
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.toggle("is-active", b === btn));
      document.querySelectorAll(".editor__pane").forEach((p) => p.classList.toggle("is-active", p.dataset.pane === btn.dataset.tab));
      if (hasGsap && !reduceMotion) {
        gsap.from(`.editor__pane[data-pane="${btn.dataset.tab}"] code`, { opacity: 0, y: 12, duration: 0.4, ease: "power2.out" });
      }
    })
  );

  /* No GSAP (offline) or reduced motion: show everything, skip animation */
  const loader = document.querySelector(".loader");
  if (!hasGsap || reduceMotion) {
    loader.remove();
    document.querySelectorAll(".num__calc").forEach((el) => (el.style.visibility = "hidden"));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add("is-loading");

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    document.querySelectorAll('a[href^="#"]').forEach((a) =>
      a.addEventListener("click", (e) => {
        const target = document.querySelector(a.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -10 });
      })
    );
  }

  /* ---------- Nav: blur when scrolled, hide on scroll down ---------- */
  const nav = document.querySelector(".nav");
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      nav.classList.toggle("is-scrolled", self.scroll() > 40);
      nav.classList.toggle("is-hidden", self.direction === 1 && self.scroll() > 400 && !menu.classList.contains("is-open"));
    },
  });

  /* ---------- Loader → hero intro ---------- */
  const counter = { v: 0 };
  const intro = gsap.timeline({
    onComplete: () => {
      document.body.classList.remove("is-loading");
      lenis && lenis.start();
      ScrollTrigger.refresh();
    },
  });
  intro
    .to(".loader__log p", { opacity: 1, duration: 0.15, stagger: 0.32 }, 0)
    .to(counter, {
      v: 100, duration: 1.4, ease: "power2.inOut",
      onUpdate: () => (document.getElementById("count").textContent = Math.round(counter.v)),
    })
    .to(".loader", { yPercent: -100, duration: 0.9, ease: "expo.inOut" })
    .set(".loader", { display: "none" })
    .from(".hero__title .word", { yPercent: 110, duration: 1.1, stagger: 0.12, ease: "expo.out" }, "-=0.45")
    .from(".hero__photo img", { clipPath: "inset(100% 0 0 0 round 28px)", scale: 1.2, duration: 1.3, ease: "expo.out" }, "-=1.1")
    .from(".badge", { scale: 0, opacity: 0, duration: 0.6, stagger: 0.1, ease: "back.out(2)" }, "-=0.7")
    .from(".hero__eyebrow, .hero__lead, .hero__roles, .nav", { y: 24, opacity: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" }, "-=0.8");

  /* Floating badges */
  gsap.utils.toArray(".badge").forEach((b, i) =>
    gsap.to(b, { y: i % 2 ? 10 : -10, duration: 2 + i * 0.3, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 2.5 })
  );
  gsap.to(".hero__photo", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- Rotating roles ---------- */
  const roles = gsap.utils.toArray(".roles__item");
  let r = 0;
  gsap.set(roles, { yPercent: 110, opacity: 1 });
  gsap.set(roles[0], { yPercent: 0 });
  setInterval(() => {
    const cur = roles[r];
    r = (r + 1) % roles.length;
    gsap.to(cur, { yPercent: -110, duration: 0.6, ease: "power3.inOut" });
    gsap.fromTo(roles[r], { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: "power3.inOut" });
  }, 2200);

  /* ---------- Hero parallax out ---------- */
  gsap.to(".hero__title", { yPercent: -18, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__glow", { yPercent: 40, scale: 1.3, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- Marquee speeds up with scroll ---------- */
  gsap.to(".marquee", { xPercent: -6, ease: "none", scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: true } });

  /* ---------- About: photo clip reveal + word-by-word text ---------- */
  gsap.fromTo(".about__photo", { clipPath: "inset(100% 0 0 0 round 22px)" }, {
    clipPath: "inset(0% 0 0 0 round 22px)", duration: 1.3, ease: "expo.out",
    scrollTrigger: { trigger: ".about", start: "top 75%" },
  });
  gsap.to(".about__photo img", { scale: 1, ease: "none", scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.to(".scrub-text .w", {
    opacity: 1, stagger: 0.05, ease: "none",
    scrollTrigger: { trigger: ".scrub-text", start: "top 80%", end: "bottom 45%", scrub: true },
  });
  gsap.from(".values li", { y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".values", start: "top 88%" } });

  /* ---------- Numbers: odometer roll ("calculating…" then the number) ---------- */
  const scramble = (el, done) => {
    // random digits flicker while "calculating"
    const chars = "0123456789+-×÷=";
    let n = 0;
    const id = setInterval(() => {
      el.textContent = "calculating " + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      if (++n > 22) { clearInterval(id); done(); }
    }, 70);
  };
  gsap.utils.toArray(".num").forEach((num, idx) => {
    const odo = num.querySelector(".odo");
    const calc = num.querySelector(".num__calc");
    const target = odo.dataset.odo;
    odo.innerHTML = "";
    const strips = [];
    [...target].forEach((ch) => {
      const col = document.createElement("span");
      col.className = "odo__col";
      const strip = document.createElement("span");
      strip.className = "odo__strip";
      // 3 rounds of 0-9 so it spins before landing
      for (let i = 0; i < 30; i++) {
        const d = document.createElement("span");
        d.textContent = i % 10;
        strip.appendChild(d);
      }
      col.appendChild(strip);
      odo.appendChild(col);
      strips.push({ strip, digit: +ch });
    });
    ScrollTrigger.create({
      trigger: num,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.from(num, { y: 40, opacity: 0, duration: 0.7, delay: idx * 0.1, ease: "power3.out" });
        scramble(calc, () => {
          calc.textContent = "✓ done";
          gsap.to(calc, { opacity: 0, delay: 0.8, duration: 0.4 });
        });
        strips.forEach(({ strip, digit }, i) => {
          gsap.fromTo(strip, { yPercent: 0 }, {
            yPercent: -((20 + digit) / 30) * 100,
            duration: 2 + i * 0.35,
            delay: idx * 0.1,
            ease: "power3.inOut",
          });
        });
      },
    });
  });

  /* ---------- Section headings slide up ---------- */
  gsap.utils.toArray(".work__head, .skills__head, .journey__head, .code__head, .process__head").forEach((h) => {
    gsap.from(h.children, { y: 60, opacity: 0, duration: 1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: h, start: "top 85%" } });
  });

  /* ---------- Work: horizontal pinned scroll (desktop) ---------- */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 821px)", () => {
    const track = document.querySelector(".work__track");
    const distance = () => track.scrollWidth - window.innerWidth;
    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: ".work__pin",
        start: "top 12%",
        end: () => "+=" + distance(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
  });
  mm.add("(max-width: 820px)", () => {
    gsap.utils.toArray(".card").forEach((c) =>
      gsap.from(c, { y: 60, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: c, start: "top 88%" } })
    );
  });

  /* ---------- Skills: cards + meters ---------- */
  gsap.from(".skill-card", { y: 80, opacity: 0, duration: 1, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ".skills__grid", start: "top 80%" } });

  gsap.from(".level", { y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ".levels", start: "top 88%" } });
  gsap.from(".learning li", { y: 20, opacity: 0, duration: 0.6, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".learning", start: "top 90%" } });

  /* ---------- Code editor rises in, lines type in ---------- */
  gsap.from(".editor", { y: 80, rotateX: 8, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".editor", start: "top 85%" } });

  /* ---------- Process steps ---------- */
  gsap.from(".pstep", { y: 60, opacity: 0, duration: 0.9, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".process__grid", start: "top 82%" } });

  /* ---------- Journey: line draws as you scroll ---------- */
  gsap.to(".timeline__line i", { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".timeline", start: "top 70%", end: "bottom 60%", scrub: true } });
  gsap.utils.toArray(".step").forEach((s) =>
    gsap.from(s, { x: 40, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: s, start: "top 82%" } })
  );

  /* ---------- Contact title ---------- */
  gsap.from(".contact__title .word", { yPercent: 110, duration: 1.1, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: ".contact__title", start: "top 80%" } });

  /* ---------- Footer big text ---------- */
  gsap.from(".footer__big", { yPercent: 40, opacity: 0, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });

  /* ---------- Custom cursor + magnetic buttons (mouse only) ---------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const cursor = document.querySelector(".cursor");
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
    window.addEventListener("mousemove", (e) => { xTo(e.clientX); yTo(e.clientY); });

    document.querySelectorAll("[data-cursor]").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-view"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-view"));
    });
    document.querySelectorAll("a, button, input, textarea").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-link"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-link"));
    });

    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.4, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" }));
    });
  } else {
    document.querySelector(".cursor").remove();
  }
})();
