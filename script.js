import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getDatabase, ref, onValue, get, set, remove } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

(() => {
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const themeToggle = document.querySelector("#theme-toggle");
  const mainNav = document.querySelector(".main-nav");
  const lightbox = document.querySelector("#lightbox");
  const lightboxImage = document.querySelector("#lightbox-image");
  const lightboxCaption = document.querySelector("#lightbox-caption");
  const mapPanel = document.querySelector("#map-panel");
  const mapFrame = document.querySelector("#map-frame");
  const mapPlaceholder = document.querySelector("#map-placeholder");
  const visitorCount = document.querySelector("#visitor-count");
  const counterStatus = document.querySelector("#counter-status");
  const reactionButtons = [...document.querySelectorAll("[data-like-key]")];
  const supportedKeys = new Set(["birthday-cake", "sesame", "basbousa", "pistachio", "support"]);

  document.documentElement.classList.add("js-ready");
  document.querySelector("#year").textContent = String(new Date().getFullYear());

  function applyTheme(theme, persist = true) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    themeToggle.setAttribute("aria-pressed", String(nextTheme === "dark"));
    themeToggle.setAttribute("aria-label", nextTheme === "dark" ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي");
    themeToggle.title = nextTheme === "dark" ? "الوضع النهاري" : "الوضع الليلي";
    document.querySelector('meta[name="theme-color"]').content = nextTheme === "dark" ? "#1e2422" : "#f4eee4";
    if (persist) {
      try { localStorage.setItem("haider-theme", nextTheme); } catch { /* Storage may be unavailable; theme still works for this page. */ }
    }
  }
  applyTheme(document.documentElement.dataset.theme, false);
  themeToggle.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });

  const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 12);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  function closeMobileMenu() {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "فتح قائمة التنقل");
  }
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "فتح قائمة التنقل" : "إغلاق قائمة التنقل");
    mainNav.classList.toggle("open", !isOpen);
  });
  mainNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMobileMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mainNav.classList.contains("open")) {
      closeMobileMenu();
      menuToggle.focus();
    }
  });

  document.querySelectorAll("[data-lightbox]").forEach((button) => {
    button.addEventListener("click", () => {
      lightboxImage.src = button.dataset.lightbox;
      lightboxImage.alt = button.querySelector("img")?.alt || "صورة حلويات ومكسرات حيدر";
      lightboxCaption.textContent = button.dataset.caption || "حلويات حيدر";
      if (typeof lightbox.showModal === "function") lightbox.showModal();
      else lightbox.setAttribute("open", "");
    });
  });
  lightbox.querySelector(".lightbox-close").addEventListener("click", () => {
    if (typeof lightbox.close === "function") lightbox.close();
    else lightbox.removeAttribute("open");
  });
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox && typeof lightbox.close === "function") lightbox.close();
  });
  lightbox.addEventListener("close", () => lightboxImage.removeAttribute("src"));

  function loadMap() {
    if (!mapFrame.src) {
      const query = encodeURIComponent("حلويات حيدر الشجيري M96X+5FR المحاويل بابل العراق");
      mapFrame.src = `https://maps.google.com/maps?q=${query}&output=embed`;
    }
    mapPlaceholder.hidden = true;
    mapFrame.hidden = false;
  }
  document.querySelector("#load-map").addEventListener("click", () => {
    loadMap();
    mapPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  document.querySelector("#map-load-button").addEventListener("click", loadMap);

  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".reveal").forEach((element) => {
      const delay = element.dataset.delay || "0";
      element.style.setProperty("--delay", `${delay}ms`);
    });
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        if (entry.target.closest("#gallery")) document.querySelector("#gallery").classList.add("is-thread-drawn");
        instance.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
  } else {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
    document.querySelector("#gallery").classList.add("is-thread-drawn");
  }

  let database = null;
  let currentUser = null;
  const setStatus = (message) => {
    if (counterStatus) counterStatus.textContent = message;
  };
  const updateLikeButtons = (key, count, liked) => {
    document.querySelectorAll(`[data-like-key="${key}"]`).forEach((button) => {
      button.disabled = false;
      button.classList.toggle("is-liked", liked);
      button.setAttribute("aria-pressed", String(liked));
      const countNode = button.querySelector(`[data-like-count="${key}"]`);
      if (countNode) countNode.textContent = String(count);
    });
  };

  const sweetHeartArt = [
    { name: "cake", svg: `<path d="M32 53C27 48 10 35 10 24 10 12 25 8 32 20 39 8 54 12 54 24 54 35 37 48 32 53Z" fill="#efa8b1" stroke="#a85267" stroke-width="2.4" stroke-linejoin="round"/><path d="M13 25c5 1 7-3 12-2s5 4 9 3 5-5 10-4 6 3 8 3c-3 9-11 19-20 27-9-8-16-17-19-27Z" fill="#fff3df" stroke="#d9959e" stroke-width="1.5" stroke-linejoin="round"/><path d="M23 31c3-3 5-3 8 0m3 1c3-3 5-3 8 0" fill="none" stroke="#cc7786" stroke-width="2" stroke-linecap="round"/><circle cx="32" cy="24" r="3" fill="#c95262"/>` },
    { name: "candy", svg: `<path d="M32 53C27 48 10 35 10 24 10 12 25 8 32 20 39 8 54 12 54 24 54 35 37 48 32 53Z" fill="#f7df9a" stroke="#bd8653" stroke-width="2.4" stroke-linejoin="round"/><path d="M15 31c5 1 8-1 11-4m6 0c3 3 7 5 15 4M22 39c3-2 5-4 7-7m9 1 7 7" fill="none" stroke="#fff7de" stroke-width="3" stroke-linecap="round"/><path d="m26 17 2 3m9 0 2-3" stroke="#c88462" stroke-width="2" stroke-linecap="round"/>` },
    { name: "chocolate", svg: `<path d="M32 53C27 48 10 35 10 24 10 12 25 8 32 20 39 8 54 12 54 24 54 35 37 48 32 53Z" fill="#754430" stroke="#46291f" stroke-width="2.4" stroke-linejoin="round"/><path d="M32 20v27M15 31h34M20 22l8 5m16-5-8 5M22 40l7-5m13 5-7-5" fill="none" stroke="#d4a06a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="31" r="3" fill="#f2d3a4"/>` },
    { name: "cupcake", svg: `<path d="M32 53C27 48 10 35 10 24 10 12 25 8 32 20 39 8 54 12 54 24 54 35 37 48 32 53Z" fill="#dca9cc" stroke="#805274" stroke-width="2.4" stroke-linejoin="round"/><path d="M15 27c4-1 5-7 10-6 4-7 11-5 13 0 5-3 11 1 11 7-3 8-10 17-17 23-8-7-14-15-17-24Z" fill="#fff0e3" stroke="#b875a1" stroke-width="1.7" stroke-linejoin="round"/><path d="M29 19c1-5 8-5 9 0" fill="none" stroke="#ef9b67" stroke-width="3" stroke-linecap="round"/><circle cx="33" cy="17" r="2" fill="#d75a4e"/>` },
    { name: "macaron", svg: `<path d="M32 53C27 48 10 35 10 24 10 12 25 8 32 20 39 8 54 12 54 24 54 35 37 48 32 53Z" fill="#a9b78a" stroke="#5e7048" stroke-width="2.4" stroke-linejoin="round"/><path d="M15 29c4 1 7-3 11-2 4 1 5 4 9 3 4-1 6-4 10-3l5 2" fill="none" stroke="#fff1d8" stroke-width="4" stroke-linecap="round"/><path d="M19 34c3 6 8 12 13 16m13-16c-3 6-8 12-13 16" fill="none" stroke="#d9c69f" stroke-width="1.5" stroke-linecap="round"/><circle cx="24" cy="22" r="1.5" fill="#f7edcf"/><circle cx="40" cy="23" r="1.5" fill="#f7edcf"/>` },
  ];

  function floatSweetHeart(button, key) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const heart = document.createElement("span");
    heart.setAttribute("aria-hidden", "true");
    if (key === "support") {
      const clipId = `support-heart-${Math.random().toString(36).slice(2)}`;
      const silhouette = "M50 89C43 82 12 59 9 38 6 19 19 8 34 10 42 11 47 16 50 23 53 16 58 11 66 10 81 8 94 19 91 38 88 59 57 82 50 89Z";
      heart.className = "flying-sweet-heart flying-sweet-heart--support";
      heart.innerHTML = `<svg viewBox="0 0 100 100" focusable="false"><defs><clipPath id="${clipId}"><path d="${silhouette}"/></clipPath><linearGradient id="${clipId}-shine" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff1df"/><stop offset="1" stop-color="#edc78c"/></linearGradient></defs><g clip-path="url(#${clipId})"><rect width="100" height="100" fill="#f8e9db"/><path d="M5 7h46v40C38 39 22 34 5 38Z" fill="#efb2bc"/><path d="M50 7h46v34C79 31 62 34 50 47Z" fill="#754430"/><path d="M5 37c17-5 32 2 46 11v47H5Z" fill="#a9b78a"/><path d="M50 48c14-12 29-14 46-9v56H50Z" fill="url(#${clipId}-shine)"/><path d="M50 22c-1 10 2 19 0 27m-31-4c10-1 21 2 31 0 11-2 20-2 31-2" fill="none" stroke="#fff6eb" stroke-width="3.2" stroke-linecap="round"/><path d="m19 23 4 2m8-7 3 4m-17 13 4 1" stroke="#bd6476" stroke-width="2.2" stroke-linecap="round"/><path d="M62 20h8v7h-8zm12 11h8v7h-8zM61 40h6" fill="none" stroke="#f0c68b" stroke-width="2" stroke-linejoin="round"/><circle cx="20" cy="55" r="2" fill="#f7e9cd"/><circle cx="29" cy="63" r="2" fill="#f7e9cd"/><circle cx="18" cy="72" r="2" fill="#f7e9cd"/><path d="M59 69c8-9 20-5 20 2 0 6-8 7-12 7m12 0v4" fill="none" stroke="#c88d52" stroke-width="2.3" stroke-linecap="round"/><circle cx="79" cy="84" r="2.5" fill="#d36b67"/><path d="M18 49c4 0 7 2 10 4m-8 25 5 3" fill="none" stroke="#f7e9cd" stroke-width="1.7" stroke-linecap="round"/></g><path d="${silhouette}" fill="none" stroke="#fff8ee" stroke-width="4" stroke-linejoin="round"/><path d="M50 25v45M19 47c11-1 21 2 31 0 11-2 22-2 31-2" fill="none" stroke="#fff8ee" stroke-opacity=".84" stroke-width="2.5" stroke-linecap="round"/><path d="m19 17 1.4 3.5 3.6 1.3-3.6 1.4-1.4 3.5-1.3-3.5-3.6-1.4 3.6-1.3L19 17Zm61 29 1 2.6 2.7 1-2.7 1-1 2.6-1-2.6-2.7-1 2.7-1 1-2.6Z" fill="#f4cf8a" stroke="#fff7e8" stroke-width=".8"/></svg>`;
    } else {
      const treat = sweetHeartArt[Math.floor(Math.random() * sweetHeartArt.length)];
      heart.className = `flying-sweet-heart flying-sweet-heart--${treat.name}`;
      heart.innerHTML = `<svg viewBox="0 0 64 64" focusable="false">${treat.svg}</svg>`;
      heart.style.setProperty("--heart-drift", `${Math.round(Math.random() * 34 - 17)}px`);
      heart.style.setProperty("--heart-turn", `${Math.round(Math.random() * 24 - 12)}deg`);
    }
    button.append(heart);
    heart.addEventListener("animationend", () => heart.remove(), { once: true });
  }

  async function toggleLike(key, button) {
    if (!database || !currentUser || !supportedKeys.has(key)) {
      setStatus("جاري الاتصال لتفعيل الإعجابات، حاولوا بعد قليل.");
      return;
    }
    button.disabled = true;
    setStatus("جاري حفظ الإعجاب…");
    const ownLike = ref(database, `likes/${key}/${currentUser.uid}`);
    try {
      const snapshot = await get(ownLike);
      if (snapshot.exists()) await remove(ownLike);
      else {
        await set(ownLike, true);
        floatSweetHeart(button, key);
      }
      setStatus("تم تحديث الإعجاب.");
    } catch (error) {
      console.error("Firebase like update failed", error);
      setStatus("تعذر حفظ الإعجاب. تحقق من إعدادات Firebase وقواعد البيانات.");
    } finally {
      button.disabled = false;
    }
  }

  reactionButtons.forEach((button) => {
    const key = button.dataset.likeKey;
    if (!supportedKeys.has(key)) {
      button.hidden = true;
      return;
    }
    button.disabled = true;
    button.addEventListener("click", () => toggleLike(key, button));
  });

  async function connectFirebase() {
    try {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      database = getDatabase(app, firebaseConfig.databaseURL);
      const credential = await signInAnonymously(auth);
      currentUser = credential.user;

      onValue(ref(database, "visitors"), (snapshot) => {
        const values = snapshot.val();
        visitorCount.textContent = String(values ? Object.keys(values).length : 0);
      }, (error) => {
        console.error("Firebase visitor counter read failed", error);
        visitorCount.textContent = "—";
        setStatus("عداد الزوار غير متاح حالياً.");
      });

      const ownVisit = ref(database, `visitors/${currentUser.uid}`);
      const visitSnapshot = await get(ownVisit);
      if (!visitSnapshot.exists()) await set(ownVisit, true);

      for (const key of supportedKeys) {
        onValue(ref(database, `likes/${key}`), (snapshot) => {
          const values = snapshot.val();
          const count = values ? Object.keys(values).length : 0;
          updateLikeButtons(key, count, Boolean(values && values[currentUser.uid]));
        }, (error) => {
          console.error(`Firebase reaction read failed (${key})`, error);
          updateLikeButtons(key, 0, false);
          setStatus("الإعجابات غير متاحة حالياً.");
        });
      }
      setStatus("العدادات متصلة.");
    } catch (error) {
      console.error("Firebase initialization/authentication failed", error);
      visitorCount.textContent = "—";
      reactionButtons.forEach((button) => { button.disabled = true; });
      setStatus("تعذر الاتصال. فعّل Anonymous في Firebase Authentication وتحقق من إعدادات Realtime Database.");
    }
  }

  connectFirebase();
})();
