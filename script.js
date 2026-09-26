(() => {
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
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

  document.documentElement.classList.add("js-ready");
  document.querySelector("#year").textContent = String(new Date().getFullYear());

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
        instance.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
  } else {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
  }
})();
