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
  const instagramButton = document.querySelector("#load-instagram");
  const instagramWrap = document.querySelector("#instagram-wrap");
  const instagramFrame = document.querySelector("#instagram-embed");
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

  instagramButton.setAttribute("aria-expanded", "false");
  instagramButton.addEventListener("click", () => {
    const willOpen = instagramWrap.hidden;
    if (willOpen) {
      if (!instagramFrame.src) instagramFrame.src = "https://www.instagram.com/haider_sweets/embed/";
      instagramWrap.hidden = false;
      instagramButton.innerHTML = 'إخفاء فيديوهات المحل <svg class="icon"><use href="#i-arrow"/></svg>';
      instagramButton.setAttribute("aria-expanded", "true");
      instagramWrap.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      instagramWrap.hidden = true;
      instagramButton.innerHTML = 'شاهدوا المزيد على Instagram <svg class="icon"><use href="#i-arrow"/></svg>';
      instagramButton.setAttribute("aria-expanded", "false");
    }
  });

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
      else await set(ownLike, true);
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
