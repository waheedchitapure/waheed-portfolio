/* Interactive layer: command palette (Ctrl+K), live project demos,
   card tilt, scroll progress, copy email + toast.
   Plain JavaScript, no framework. All demo data is fake and generated here. */

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fineMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const EMAIL = "wchitapure@gmail.com";
  const fmt = (n) => n.toLocaleString("en-IN");

  /* ---------- Toast ---------- */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2200);
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch (e) {
      const t = document.createElement("textarea");
      t.value = EMAIL;
      document.body.appendChild(t);
      t.select();
      try { document.execCommand("copy"); } catch (_) {}
      t.remove();
    }
    toast("✓ Email copied: " + EMAIL);
  }
  $$("[data-copy-email]").forEach((b) => b.addEventListener("click", copyEmail));

  /* ---------- Scroll progress ---------- */
  const bar = $(".progress i");
  if (bar) {
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty("--p", max > 0 ? Math.min(1, scrollY / max) : 0);
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Smooth scroll helper (uses Lenis if main.js started it) ---------- */
  function goTo(sel) {
    const el = $(sel);
    if (!el) return;
    if (window.__lenis) window.__lenis.scrollTo(el, { offset: -10, force: true });
    else el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* =====================================================================
     Demo tabs
     ===================================================================== */
  const demoTabs = $$(".play__tabs button");
  function openDemo(id) {
    demoTabs.forEach((b) => {
      const on = b.dataset.demo === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    $$(".demo").forEach((p) => {
      const on = p.dataset.panel === id;
      p.hidden = !on;
      p.classList.toggle("is-active", on);
    });
    if (id === "ana") drawChart();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  demoTabs.forEach((b) => b.addEventListener("click", () => openDemo(b.dataset.demo)));

  /* =====================================================================
     Demo 1: Suppression search (1,00,000 fake emails, debounced search)
     ===================================================================== */
  const DOMAINS = ["acme-corp.com", "globex.io", "initech.co", "umbrella.net", "hooli.com", "stark-ind.com", "wayne-ent.com", "soylent.org", "vandelay.biz", "pied-piper.io", "cyberdyne.ai", "tyrell.co", "wonka.com", "oscorp.net", "gringotts.bank", "dunder-mifflin.com", "monarch.solutions", "aperture.science", "massive-dynamic.com", "nakatomi.jp"];
  const FIRST = ["john", "priya", "rahul", "anita", "mike", "sara", "arjun", "neha", "david", "fatima", "li", "omar", "emma", "vikram", "sofia", "ravi", "kiran", "james", "aisha", "tom"];
  const LAST = ["smith", "n", "patel", "khan", "lee", "shah", "brown", "iyer", "garcia", "das", "wong", "rao", "miller", "joshi", "chen"];

  const ssInput = $("#ssInput");
  const ssStatus = $("#ssStatus");
  const ssResult = $("#ssResult");
  const ssCount = $("#ssCount");
  const ssTime = $("#ssTime");
  let emailSet = null;
  let byDomain = null;

  function buildIndex() {
    // small seeded random so the list is the same on every visit
    let seed = 42;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const t0 = performance.now();
    emailSet = new Set();
    byDomain = new Map();
    while (emailSet.size < 99999) {
      const d = DOMAINS[Math.floor(rnd() * DOMAINS.length)];
      const e = `${FIRST[Math.floor(rnd() * FIRST.length)]}.${LAST[Math.floor(rnd() * LAST.length)]}${Math.floor(rnd() * 400)}@${d}`;
      if (emailSet.has(e)) continue;
      emailSet.add(e);
      const list = byDomain.get(d);
      if (list) list.push(e); else byDomain.set(d, [e]);
    }
    emailSet.add("priya.n3@globex.io");
    byDomain.get("globex.io").unshift("priya.n3@globex.io");
    ssCount.textContent = `${fmt(emailSet.size)} suppressed emails indexed in ${Math.round(performance.now() - t0)} ms`;
  }

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  function hitRow(pillCls, pillText, title, sub) {
    const row = el("div", "ss__hit");
    row.append(el("span", "pill " + pillCls, pillText));
    const box = el("div");
    box.append(el("b", "", title), el("small", "", sub));
    row.append(box);
    return row;
  }

  function search(raw) {
    const q = raw.trim().toLowerCase();
    ssResult.replaceChildren();
    ssTime.textContent = "";
    if (!q) {
      ssResult.append(el("p", "ss__empty", "Results will show here."));
      ssStatus.textContent = "idle";
      ssStatus.className = "ss__status mono";
      return;
    }
    const t0 = performance.now();
    if (q.includes("@")) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(q)) {
        ssResult.append(hitRow("bad", "CHECK", q, "This does not look like a full email yet."));
      } else if (emailSet.has(q)) {
        ssResult.append(hitRow("bad", "SUPPRESSED", q, "Found on the suppression list. Do not mail."));
      } else {
        ssResult.append(hitRow("ok", "SAFE", q, "Not on the suppression list. Safe to mail."));
      }
    } else {
      const d = q.replace(/^www\./, "");
      const list = byDomain.get(d);
      if (list) {
        ssResult.append(hitRow("bad", "DOMAIN", d, `${fmt(list.length)} suppressed emails on this domain. First few:`));
        const chips = el("div", "ss__list");
        list.slice(0, 6).forEach((e) => chips.append(el("span", "", e)));
        ssResult.append(chips);
      } else {
        ssResult.append(hitRow("ok", "CLEAR", d, "No suppressed emails for this domain."));
      }
    }
    const ms = performance.now() - t0;
    ssTime.textContent = `searched in ${ms < 1 ? ms.toFixed(2) : ms.toFixed(1)} ms`;
    ssStatus.textContent = "✓ done";
    ssStatus.className = "ss__status mono is-done";
  }

  let ssTimer;
  if (ssInput) {
    ssInput.addEventListener("input", () => {
      if (!emailSet) buildIndex();
      ssStatus.textContent = "typing…";
      ssStatus.className = "ss__status mono is-wait";
      clearTimeout(ssTimer);
      ssTimer = setTimeout(() => search(ssInput.value), 300); // debounce
    });
    $$("[data-try]").forEach((b) =>
      b.addEventListener("click", () => {
        if (!emailSet) buildIndex();
        ssInput.value = b.textContent;
        ssInput.focus();
        search(b.textContent);
      })
    );
    // build the index when the demo comes near the screen, not on page load
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        if (!emailSet) buildIndex();
        io.disconnect();
      }
    }, { rootMargin: "300px" });
    io.observe($("#demos"));
  }

  /* =====================================================================
     Demo 2: Campaign analytics chart (SVG, hover tooltip, CSV export)
     ===================================================================== */
  const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
  const COLORS = { Mailchimp: "#d4ff3f", Benchmark: "#b46cff", Brevo: "#4fd1c5" };
  const DATA = {
    Mailchimp: { open: [32.4, 34.1, 33.0, 36.8, 38.2, 41.0], click: [5.1, 5.6, 5.2, 6.4, 7.0, 8.2], bounce: [2.1, 1.9, 2.4, 1.7, 1.5, 1.3] },
    Benchmark: { open: [28.0, 27.2, 29.5, 30.1, 31.9, 33.4], click: [3.8, 4.1, 4.4, 4.2, 5.0, 5.6], bounce: [3.2, 3.0, 2.8, 2.9, 2.5, 2.2] },
    Brevo: { open: [25.5, 26.8, 26.1, 28.9, 29.4, 30.2], click: [3.1, 3.4, 3.9, 4.1, 4.0, 4.7], bounce: [2.6, 2.7, 2.3, 2.1, 2.2, 1.9] },
  };
  const METRIC_NAME = { open: "Open rate", click: "Click rate", bounce: "Bounce rate" };
  const anaState = { platforms: new Set(Object.keys(DATA)), metric: "open" };
  const svg = $("#anaSvg");
  const tip = $("#anaTip");
  const kpis = $("#anaKpis");
  const NS = "http://www.w3.org/2000/svg";
  let W = 640, H = 260;
  const P = { l: 40, r: 14, t: 12, b: 28 };
  const X = (i) => P.l + (i * (W - P.l - P.r)) / (MONTHS.length - 1);
  let yMax = 50;
  const Y = (v) => H - P.b - (v / yMax) * (H - P.t - P.b);

  function svgEl(tag, attrs) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function drawChart() {
    if (!svg) return;
    // match the viewBox to the real size so text and lines are never stretched
    const box = svg.getBoundingClientRect();
    if (box.width > 0) { W = box.width; H = box.height; }
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const m = anaState.metric;
    const active = Object.keys(DATA).filter((p) => anaState.platforms.has(p));
    const all = active.flatMap((p) => DATA[p][m]);
    const top = all.length ? Math.max(...all) : 10;
    const step = top > 20 ? 10 : top > 6 ? 2 : 1;
    yMax = Math.ceil((top * 1.15) / step) * step;

    svg.replaceChildren();
    if (tip) tip.hidden = true;
    const grid = svgEl("g", { class: "grid" });
    for (let v = 0; v <= yMax; v += step * (yMax / step > 6 ? 2 : 1)) {
      grid.append(svgEl("line", { x1: P.l, x2: W - P.r, y1: Y(v), y2: Y(v) }));
      const t = svgEl("text", { x: P.l - 8, y: Y(v) + 4, "text-anchor": "end", class: "ax" });
      t.textContent = v + "%";
      grid.append(t);
    }
    MONTHS.forEach((mo, i) => {
      const t = svgEl("text", { x: X(i), y: H - 6, "text-anchor": "middle", class: "ax" });
      t.textContent = mo;
      grid.append(t);
    });
    svg.append(grid);

    active.forEach((p) => {
      const vals = DATA[p][m];
      const pts = vals.map((v, i) => `${X(i)},${Y(v)}`);
      const line = svgEl("path", { class: "ln", stroke: COLORS[p], d: `M${pts.join(" L")}` });
      svg.append(line);
      if (!reduceMotion) {
        // stroke is non-scaling, so dash length must be in screen pixels
        const len = line.getTotalLength() + 20;
        line.style.strokeDasharray = len;
        line.style.strokeDashoffset = len;
        line.getBoundingClientRect();
        line.style.transition = "stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1)";
        line.style.strokeDashoffset = 0;
        setTimeout(() => { line.style.strokeDasharray = ""; line.style.transition = ""; }, 950);
      }
    });

    const hair = svgEl("line", { class: "hair", y1: P.t, y2: H - P.b, x1: -10, x2: -10, opacity: 0 });
    svg.append(hair);
    const dots = active.map((p) => {
      const d = svgEl("circle", { class: "dot", r: 0, fill: COLORS[p], cx: 0, cy: 0 });
      svg.append(d);
      return d;
    });
    svg.append(svgEl("rect", { x: P.l, y: 0, width: W - P.l - P.r, height: H, fill: "transparent", class: "hit" }));
    svg._hover = { hair, dots, active };

    // KPIs
    kpis.replaceChildren();
    if (!active.length) {
      kpis.append(el("p", "ana__empty", "Turn on at least one platform to see numbers."));
    }
    active.forEach((p) => {
      const v = DATA[p][m];
      const avg = v.reduce((a, b) => a + b, 0) / v.length;
      const diff = v[v.length - 1] - v[0];
      const good = m === "bounce" ? diff < 0 : diff > 0;
      const k = el("div", "ana__kpi");
      k.style.setProperty("--c", COLORS[p]);
      k.append(el("small", "", `${p} · avg ${METRIC_NAME[m].toLowerCase()}`), el("b", "", avg.toFixed(1) + "%"), el("em", good ? "up" : "down", `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff).toFixed(1)} pts since Jun`));
      kpis.append(k);
    });
  }

  function hoverAt(clientX) {
    const h = svg._hover;
    if (!h || !h.active.length) return;
    const r = svg.getBoundingClientRect();
    const sx = ((clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(MONTHS.length - 1, Math.round(((sx - P.l) / (W - P.l - P.r)) * (MONTHS.length - 1))));
    h.hair.setAttribute("opacity", 1);
    h.hair.setAttribute("x1", X(i));
    h.hair.setAttribute("x2", X(i));
    h.dots.forEach((d, k) => {
      d.setAttribute("cx", X(i));
      d.setAttribute("cy", Y(DATA[h.active[k]][anaState.metric][i]));
      d.setAttribute("r", 5);
    });
    tip.replaceChildren(el("b", "", `${MONTHS[i]} · ${METRIC_NAME[anaState.metric]}`));
    h.active.forEach((p) => {
      const row = el("div");
      const dot = el("i");
      dot.style.background = COLORS[p];
      row.append(dot, document.createTextNode(`${p}: ${DATA[p][anaState.metric][i].toFixed(1)}%`));
      tip.append(row);
    });
    tip.hidden = false;
    const box = svg.parentElement.getBoundingClientRect();
    const px = r.left - box.left + (X(i) / W) * r.width;
    const topVal = Math.max(...h.active.map((p) => DATA[p][anaState.metric][i]));
    const py = r.top - box.top + (Y(topVal) / H) * r.height;
    tip.style.left = Math.max(70, Math.min(box.width - 70, px)) + "px";
    tip.style.top = Math.max(60, py) + "px";
  }
  function hoverOut() {
    const h = svg._hover;
    if (!h) return;
    tip.hidden = true;
    h.hair.setAttribute("opacity", 0);
    h.dots.forEach((d) => d.setAttribute("r", 0));
  }

  if (svg) {
    svg.addEventListener("pointermove", (e) => hoverAt(e.clientX));
    svg.addEventListener("pointerdown", (e) => hoverAt(e.clientX));
    svg.addEventListener("pointerleave", hoverOut);

    $$("#anaPlatforms button").forEach((b) =>
      b.addEventListener("click", () => {
        const p = b.dataset.p;
        if (anaState.platforms.has(p)) anaState.platforms.delete(p); else anaState.platforms.add(p);
        b.classList.toggle("is-on", anaState.platforms.has(p));
        b.setAttribute("aria-pressed", String(anaState.platforms.has(p)));
        drawChart();
      })
    );
    $$("#anaMetric button").forEach((b) =>
      b.addEventListener("click", () => {
        anaState.metric = b.dataset.m;
        $$("#anaMetric button").forEach((x) => x.classList.toggle("is-on", x === b));
        drawChart();
      })
    );
    $("#anaCsv").addEventListener("click", () => {
      const active = Object.keys(DATA).filter((p) => anaState.platforms.has(p));
      if (!active.length) { toast("Turn on a platform first"); return; }
      const rows = [["Month", ...active.map((p) => `${p} ${METRIC_NAME[anaState.metric]} (%)`)]];
      MONTHS.forEach((mo, i) => rows.push([mo, ...active.map((p) => DATA[p][anaState.metric][i])]));
      const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `campaign-${anaState.metric}-rate-sample.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast("✓ CSV exported (sample data)");
    });
    drawChart();
    let rsz;
    addEventListener("resize", () => { clearTimeout(rsz); rsz = setTimeout(() => { if (!svg.closest("[hidden]")) drawChart(); }, 200); });
  }

  /* =====================================================================
     Demo 3: Campaign publish agent (simulation)
     ===================================================================== */
  const agRun = $("#agRun");
  const agSteps = $$("#agSteps li");
  const agPage = $("#agPage");
  const agUrl = $("#agUrl");
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? Math.min(ms, 150) : ms));
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "campaign";

  function buildPage(title, desc) {
    const lp = el("div", "alp");
    const hero = el("div", "alp__hero");
    hero.append(el("small", "", "FREE REPORT"), el("h4", "", title), el("p", "", desc));
    const form = el("div", "alp__form");
    form.append(el("b", "", "Get your copy"), el("i"), el("i"), el("i"), el("span", "", "Download now"), el("small", "", "We respect your privacy. Unsubscribe any time."));
    lp.append(hero, form);
    return lp;
  }

  let agBusy = false;
  async function runAgent() {
    if (agBusy) return;
    agBusy = true;
    agRun.disabled = true;
    const title = ($("#agTitle").value.trim() || "Untitled campaign").slice(0, 48);
    const desc = ($("#agDesc").value.trim() || "Short description of the offer.").slice(0, 140);
    agSteps.forEach((s) => s.classList.remove("is-run", "is-done"));
    agUrl.classList.remove("is-live");
    agUrl.textContent = "about:blank";
    agPage.replaceChildren(el("p", "ag__wait mono", "Agent is working…"));

    const times = [700, 1100, 800, 1000, 500];
    for (let i = 0; i < agSteps.length; i++) {
      agSteps[i].classList.add("is-run");
      await wait(times[i]);
      if (i === 1) agPage.replaceChildren(buildPage(title, desc));
      if (i === 3) agUrl.textContent = "uploading over FTP…";
      agSteps[i].classList.remove("is-run");
      agSteps[i].classList.add("is-done");
    }
    agUrl.textContent = `https://campaigns.example.com/${slug(title)}`;
    agUrl.classList.add("is-live");
    toast("✓ Live link ready (demo)");
    agRun.disabled = false;
    agRun.querySelector("span").textContent = "Run again";
    agBusy = false;
  }
  if (agRun) agRun.addEventListener("click", runAgent);

  /* =====================================================================
     Command palette (Ctrl+K / Cmd+K)
     ===================================================================== */
  const pal = $("#pal");
  const palInput = $("#palInput");
  const palList = $("#palList");
  const open = (url) => window.open(url, "_blank", "noopener");
  const COMMANDS = [
    { g: "Go to", ic: "⌂", label: "Home", k: "top start hero", run: () => goTo("#home") },
    { g: "Go to", ic: "☺", label: "About me", k: "intro who", run: () => goTo("#about") },
    { g: "Go to", ic: "▦", label: "Projects", k: "work portfolio lead iq crm", run: () => goTo("#work") },
    { g: "Go to", ic: "▶", label: "Live demos", k: "try playground", run: () => goTo("#demos") },
    { g: "Go to", ic: "⚛", label: "Skills", k: "react javascript tech stack", run: () => goTo("#skills") },
    { g: "Go to", ic: "{}", label: "Code samples", k: "editor jsx css node", run: () => goTo("#code") },
    { g: "Go to", ic: "⌛", label: "Experience", k: "journey jobs timeline work history", run: () => goTo("#journey") },
    { g: "Go to", ic: "✉", label: "Contact", k: "hire message form", run: () => goTo("#contact") },
    { g: "Try a demo", ic: "🔍", label: "Search an email in 1 lakh records", k: "suppression search demo", run: () => { openDemo("sup"); goTo("#demos"); setTimeout(() => ssInput && ssInput.focus({ preventScroll: true }), 900); } },
    { g: "Try a demo", ic: "📈", label: "Play with the analytics chart", k: "analytics chart mailchimp brevo benchmark csv", run: () => { openDemo("ana"); goTo("#demos"); } },
    { g: "Try a demo", ic: "🤖", label: "Run the publish agent", k: "agent automation landing page", run: () => { openDemo("agent"); goTo("#demos"); setTimeout(runAgent, 900); } },
    { g: "Actions", ic: "⧉", label: "Copy my email", k: "email copy clipboard contact", hint: EMAIL, run: copyEmail },
    { g: "Actions", ic: "↓", label: "Download CV", k: "resume cv pdf download", run: () => { const a = document.createElement("a"); a.href = "./waheed-resume.pdf"; a.download = ""; a.click(); } },
    { g: "Links", ic: "in", label: "LinkedIn", k: "linkedin profile social", hint: "↗", run: () => open("https://www.linkedin.com/in/waheedchitapure/") },
    { g: "Links", ic: "gh", label: "GitHub", k: "github code repo", hint: "↗", run: () => open("https://github.com/waheedchitapure") },
    { g: "Links", ic: "@", label: "Send an email", k: "mail write", run: () => (location.href = "mailto:" + EMAIL) },
  ];

  let shown = [];
  let active = 0;
  let lastFocus = null;

  function highlight(text, q) {
    const frag = document.createDocumentFragment();
    const i = q ? text.toLowerCase().indexOf(q) : -1;
    if (i < 0) { frag.append(text); return frag; }
    const m = document.createElement("mark");
    m.textContent = text.slice(i, i + q.length);
    frag.append(text.slice(0, i), m, text.slice(i + q.length));
    return frag;
  }

  function renderPal() {
    const q = palInput.value.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    shown = COMMANDS.filter((c) => {
      const hay = (c.label + " " + c.k + " " + c.g).toLowerCase();
      return words.every((w) => hay.includes(w));
    });
    active = Math.min(active, Math.max(0, shown.length - 1));
    palList.replaceChildren();
    if (!shown.length) {
      palList.append(el("li", "pal__none", "No results. Try “demo”, “cv” or “react”."));
      return;
    }
    let group = "";
    shown.forEach((c, i) => {
      if (c.g !== group) {
        group = c.g;
        palList.append(el("li", "pal__group", group));
      }
      const li = el("li", "pal__item" + (i === active ? " is-active" : ""));
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === active));
      li.id = "pal-opt-" + i;
      li.append(el("span", "ic", c.ic));
      const lbl = el("span");
      lbl.append(highlight(c.label, words[0] || ""));
      li.append(lbl);
      if (c.hint) li.append(el("small", "", c.hint));
      li.addEventListener("mousemove", () => { if (active !== i) { active = i; paintActive(); } });
      li.addEventListener("click", () => runCmd(i));
      palList.append(li);
    });
    palInput.setAttribute("aria-activedescendant", "pal-opt-" + active);
  }

  function paintActive() {
    $$(".pal__item", palList).forEach((li) => {
      const on = li.id === "pal-opt-" + active;
      li.classList.toggle("is-active", on);
      li.setAttribute("aria-selected", String(on));
      if (on) li.scrollIntoView({ block: "nearest" });
    });
    palInput.setAttribute("aria-activedescendant", "pal-opt-" + active);
  }

  function openPal() {
    if (!pal.hidden) return;
    lastFocus = document.activeElement;
    pal.hidden = false;
    palInput.value = "";
    active = 0;
    renderPal();
    palInput.focus();
    if (window.__lenis) window.__lenis.stop();
    document.documentElement.style.overflow = "hidden";
  }
  function closePal() {
    if (pal.hidden) return;
    pal.hidden = true;
    document.documentElement.style.overflow = "";
    if (window.__lenis && !document.body.classList.contains("is-loading")) window.__lenis.start();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function runCmd(i) {
    const c = shown[i];
    if (!c) return;
    closePal();
    setTimeout(c.run, 60);
  }

  if (pal) {
    palInput.addEventListener("input", () => { active = 0; renderPal(); });
    palInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % Math.max(1, shown.length); paintActive(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + shown.length) % Math.max(1, shown.length); paintActive(); }
      else if (e.key === "Enter") { e.preventDefault(); runCmd(active); }
      else if (e.key === "Tab") { e.preventDefault(); }
    });
    $$("[data-close-palette]").forEach((b) => b.addEventListener("click", closePal));
    $$("[data-open-palette]").forEach((b) => b.addEventListener("click", openPal));
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        pal.hidden ? openPal() : closePal();
      } else if (e.key === "Escape") {
        closePal();
      }
    });
    if (/Mac|iPhone|iPad/.test(navigator.platform)) {
      $$(".nav__k kbd:first-child").forEach((k) => (k.textContent = "⌘"));
    }
  }

  /* =====================================================================
     Project cards: 3D tilt + glare that follows the mouse (desktop only)
     ===================================================================== */
  if (fineMouse && !reduceMotion) {
    $$(".card[data-cursor]").forEach((card) => {
      const glare = el("span", "card__glare");
      glare.setAttribute("aria-hidden", "true");
      card.append(glare);
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--gx", x * 100 + "%");
        card.style.setProperty("--gy", y * 100 + "%");
        card.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 7}deg) rotateX(${(0.5 - y) * 7}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transition = "transform .6s cubic-bezier(.2,.7,.2,1), border-color .4s";
        card.style.transform = "";
        setTimeout(() => (card.style.transition = ""), 600);
      });
    });
  }

  /* ---------- Playground entrance animation (if GSAP loaded) ---------- */
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.from(".play__head > *", { y: 60, opacity: 0, duration: 1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".play__head", start: "top 85%" } });
    gsap.from(".play__box", { y: 80, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".play__box", start: "top 88%" } });
  }
})();
