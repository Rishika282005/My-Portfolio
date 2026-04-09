const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function initTheme() {
  const root = document.documentElement;
  const toggle = $("#themeToggle");
  const label = $("[data-theme-label]");
  const icon = $(".btn__icon", toggle);

  const saved = localStorage.getItem("theme");
  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
  const initial = saved || (prefersLight ? "light" : "dark");

  const apply = (theme) => {
    root.dataset.theme = theme;
    localStorage.setItem("theme", theme);
    if (label) label.textContent = theme === "dark" ? "Dark" : "Light";
    if (icon) icon.textContent = theme === "dark" ? "☾" : "☀";
  };

  apply(initial);

  toggle?.addEventListener("click", () => {
    apply(root.dataset.theme === "dark" ? "light" : "dark");
  });
}

function initMobileMenu() {
  const btn = $("#menuBtn");
  const menu = $("#mobileMenu");
  const close = $("#menuClose");

  const openMenu = () => {
    menu.hidden = false;
    requestAnimationFrame(() => {
      menu.animate(
        [
          { opacity: 0, transform: "translateY(-8px)" },
          { opacity: 1, transform: "translateY(0px)" },
        ],
        { duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" }
      );
    });
  };

  const closeMenu = () => {
    if (menu.hidden) return;
    const anim = menu.animate(
      [
        { opacity: 1, transform: "translateY(0px)" },
        { opacity: 0, transform: "translateY(-8px)" },
      ],
      { duration: 180, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" }
    );
    anim.onfinish = () => (menu.hidden = true);
  };

  btn?.addEventListener("click", openMenu);
  close?.addEventListener("click", closeMenu);

  $$(".mobileMenu__links a", menu).forEach((a) => {
    a.addEventListener("click", closeMenu);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
}

function initScrollProgress() {
  const bar = $("#scrollProgress");
  const toTop = $("#toTop");

  const onScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const p = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    if (bar) bar.style.width = `${p}%`;
    if (toTop) toTop.hidden = doc.scrollTop < 500;
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function initReveal() {
  const els = $$("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-visible"));
    initBars(true);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          if (e.target.id === "about") initBars();
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 }
  );

  els.forEach((el) => io.observe(el));
}

function initBars(force = false) {
  const fills = $$(".bar__fill");
  if (!fills.length) return;
  fills.forEach((fill) => {
    const w = fill.style.getPropertyValue("--w") || "0%";
    if (force) fill.style.width = w.trim();
    else requestAnimationFrame(() => (fill.style.width = w.trim()));
  });
}

function initTyping() {
  const el = $("#typingText");
  if (!el) return;

  const roles = [
    "AI Engineer",
    "Full Stack Developer",
    "Building Intelligent Systems",
    "AI Engineer | Full Stack Developer | Building Intelligent Systems",
  ];

  let roleIdx = 0;
  let charIdx = 0;
  let deleting = false;
  let paused = false;

  const tick = () => {
    const text = roles[roleIdx];
    const speed = deleting ? 28 : 46;

    if (paused) return;

    if (!deleting) {
      charIdx += 1;
      el.textContent = text.slice(0, charIdx);
      if (charIdx >= text.length) {
        paused = true;
        setTimeout(() => {
          paused = false;
          deleting = true;
          requestAnimationFrame(tick);
        }, 900);
        return;
      }
    } else {
      charIdx -= 1;
      el.textContent = text.slice(0, charIdx);
      if (charIdx <= 0) {
        deleting = false;
        roleIdx = (roleIdx + 1) % roles.length;
      }
    }

    setTimeout(() => requestAnimationFrame(tick), speed);
  };

  tick();
}

/** Deliver form posts to Gmail via FormSubmit (HTTPS). First use: confirm the activation email FormSubmit sends to this inbox once. */
const CONTACT_FORM_RECIPIENT = "jadarishika@gmail.com";

function initContactForm() {
  const form = $("#contactForm");
  const status = $("#formStatus");
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const honeypot = String(fd.get("_honey") || "").trim();
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const subject = String(fd.get("subject") || "").trim();
    const message = String(fd.get("message") || "").trim();

    if (honeypot) return;

    if (!name || !email || !subject || !message) {
      if (status) status.textContent = "Please fill in all fields.";
      return;
    }

    const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(CONTACT_FORM_RECIPIENT)}`;

    if (status) status.textContent = "Sending…";
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message,
          _subject: `[Portfolio] ${subject}`,
          _replyto: email,
        }),
      });

      const data = await res.json().catch(() => ({}));
      const ok = res.ok && (String(data.success) === "true" || data.success === true);

      if (ok) {
        if (status) status.textContent = "Message sent. I’ll reply from jadarishika@gmail.com soon.";
        form.reset();
      } else {
        const msg =
          typeof data.message === "string" && data.message
            ? data.message
            : "Could not send. Try again or email jadarishika@gmail.com directly.";
        if (status) status.textContent = msg;
      }
    } catch {
      if (status)
        status.textContent =
          "Network error. If you opened this file from disk, use a local server or deploy the site, then try again—or email jadarishika@gmail.com.";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function initParticles() {
  const canvas = $("#bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const state = {
    w: 0,
    h: 0,
    dpr: 1,
    particles: [],
    mouse: { x: 0, y: 0, active: false },
    t: 0,
  };

  const colors = ["#ff4fd8", "#6b5cff", "#00d4ff", "#36f5c5"];

  const resize = () => {
    state.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    state.w = Math.floor(window.innerWidth);
    state.h = Math.floor(window.innerHeight);
    canvas.width = Math.floor(state.w * state.dpr);
    canvas.height = Math.floor(state.h * state.dpr);
    canvas.style.width = `${state.w}px`;
    canvas.style.height = `${state.h}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  };

  const seed = () => {
    const count = Math.floor((state.w * state.h) / 22000);
    state.particles = Array.from({ length: clamp(count, 28, 85) }, () => {
      const r = 1.2 + Math.random() * 2.4;
      return {
        x: Math.random() * state.w,
        y: Math.random() * state.h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r,
        a: 0.22 + Math.random() * 0.35,
        c: colors[Math.floor(Math.random() * colors.length)],
      };
    });
  };

  const draw = () => {
    state.t += 1;
    ctx.clearRect(0, 0, state.w, state.h);

    const theme = document.documentElement.dataset.theme || "dark";
    const lineAlpha = theme === "dark" ? 0.12 : 0.09;

    // soft vignette
    const g = ctx.createRadialGradient(
      state.w * 0.5,
      state.h * 0.5,
      Math.min(state.w, state.h) * 0.15,
      state.w * 0.5,
      state.h * 0.5,
      Math.max(state.w, state.h) * 0.75
    );
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(1, theme === "dark" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.25)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.w, state.h);

    for (const p of state.particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -20) p.x = state.w + 20;
      if (p.x > state.w + 20) p.x = -20;
      if (p.y < -20) p.y = state.h + 20;
      if (p.y > state.h + 20) p.y = -20;

      // subtle mouse attraction
      if (state.mouse.active) {
        const dx = state.mouse.x - p.x;
        const dy = state.mouse.y - p.y;
        const d2 = dx * dx + dy * dy;
        const pull = d2 < 240 * 240 ? (1 - d2 / (240 * 240)) * 0.018 : 0;
        p.vx += dx * pull * 0.0006;
        p.vy += dy * pull * 0.0006;
      }

      // dampen velocity slightly
      p.vx *= 0.992;
      p.vy *= 0.992;

      ctx.beginPath();
      ctx.fillStyle = hexToRgba(p.c, p.a);
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // connections
    for (let i = 0; i < state.particles.length; i++) {
      for (let j = i + 1; j < state.particles.length; j++) {
        const a = state.particles[i];
        const b = state.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < 140) {
          ctx.strokeStyle = `rgba(255,255,255,${lineAlpha * (1 - d / 140)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  };

  const onMouse = (e) => {
    state.mouse.x = e.clientX;
    state.mouse.y = e.clientY;
    state.mouse.active = true;
  };

  const onLeave = () => {
    state.mouse.active = false;
  };

  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (prefersReduced) return;

  window.addEventListener("resize", () => {
    resize();
    seed();
  });
  window.addEventListener("mousemove", onMouse, { passive: true });
  window.addEventListener("touchmove", (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    state.mouse.x = t.clientX;
    state.mouse.y = t.clientY;
    state.mouse.active = true;
  }, { passive: true });
  window.addEventListener("mouseleave", onLeave);

  resize();
  seed();
  draw();
}

function hexToRgba(hex, a) {
  const h = hex.replace("#", "").trim();
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(v, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

function initExternalLinksSafety() {
  // Ensure any # placeholder buttons don't jump to top unexpectedly.
  $$('a[href="#"]').forEach((a) => {
    a.addEventListener("click", (e) => e.preventDefault());
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMobileMenu();
  initScrollProgress();
  initReveal();
  initTyping();
  initContactForm();
  initParticles();
  initExternalLinksSafety();
});
