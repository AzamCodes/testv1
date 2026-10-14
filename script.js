"use strict";

// ============================================================================
// GOOGLE SHEETS FORM CONFIGURATION
// ============================================================================
// To connect the "A note to the college" form directly to your Google Sheet:
// 1. Follow the instructions in "GoogleSheetsForm.gs" to deploy your Apps Script.
// 2. Paste your deployed Web App URL below (inside the quotation marks):
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzQ3l6e2MvPilWyELYxJYiY9-0VHhrkUHvqI-KlA1crSJytkTg0MCjY3gsO0eY1g0V5bQ/exec";
// When this URL is empty, submissions will be stored in browser localStorage (offline demo mode).
// Once you paste your deployed Google Apps Script URL, submissions will post straight to your Google Sheet!

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Set current year in footer
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ============================================================================
// LENIS SMOOTH SCROLL (Works 100% Offline in .exe & Online)
// ============================================================================
let lenis = null;
if (typeof Lenis !== "undefined" && !reduceMotion) {
  try {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      if (lenis) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
    }
    requestAnimationFrame(raf);
  } catch (err) {
    console.warn("Lenis initialization skipped:", err);
  }
}

// ============================================================================
// NAVIGATION & MOBILE MENU
// ============================================================================
const menuButton = $(".menu-toggle");
const nav = $("#site-nav");
const closeMenu = () => {
  if (!nav || !menuButton) return;
  nav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
  document.body.classList.remove("menu-open");
};

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    nav.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
  });
}

// In-page smooth scrolling with Lenis
$$('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    if (hash && hash.length > 1) {
      const target = $(hash);
      if (target) {
        event.preventDefault();
        closeMenu();
        if (lenis) {
          lenis.scrollTo(target, { offset: -24, duration: 1.2 });
        } else {
          target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        }
      }
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

// ============================================================================
// CUSTOM CURSOR (OPTIONAL MICRO-INTERACTION)
// ============================================================================
const poopCursor = $("#poopCursor");
if (poopCursor && window.matchMedia("(pointer: fine)").matches) {
  document.body.classList.add("poop-cursor-active");
  let pointerX = 0;
  let pointerY = 0;
  let cursorFrame = 0;
  document.addEventListener("pointermove", (event) => {
    pointerX = event.clientX - 12;
    pointerY = event.clientY - 9;
    if (cursorFrame) return;
    cursorFrame = requestAnimationFrame(() => {
      poopCursor.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
      poopCursor.classList.add("is-visible");
      cursorFrame = 0;
    });
  }, { passive: true });
  document.addEventListener("pointerover", (event) => {
    poopCursor.classList.toggle("is-hovering", Boolean(event.target.closest("a, button, [role=button], input[type=submit], select")));
  }, { passive: true });
  document.addEventListener("pointerleave", () => poopCursor.classList.remove("is-visible"));
  document.addEventListener("pointerenter", () => poopCursor.classList.add("is-visible"));
}

// ============================================================================
// HEADER SCROLL STATE & HIDE/SHOW ON SCROLL
// ============================================================================
const header = $(".header");
let previousY = window.scrollY;
let scrollDirection = 0;
let directionTravel = 0;
let scrollTicking = false;

function onScrollUpdate(currentY) {
  const delta = currentY - previousY;
  const nextDirection = Math.sign(delta);
  if (nextDirection && nextDirection === scrollDirection) {
    directionTravel += Math.abs(delta);
  } else {
    scrollDirection = nextDirection;
    directionTravel = Math.abs(delta);
  }

  if (header) {
    // When scrolled past top, background becomes solid and arrow turns black
    header.classList.toggle("is-scrolled", currentY > 24);

    if (currentY < 90) {
      header.classList.remove("is-hidden");
      directionTravel = 0;
    } else if (directionTravel > 16) {
      header.classList.toggle("is-hidden", scrollDirection > 0);
      directionTravel = 0;
    }
  }

  previousY = currentY;
}

if (lenis) {
  lenis.on("scroll", (e) => {
    onScrollUpdate(e.scroll);
  });
} else {
  window.addEventListener("scroll", () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      onScrollUpdate(window.scrollY);
      scrollTicking = false;
    });
  }, { passive: true });
}

// ============================================================================
// INFINITE DRAGGABLE CAROUSEL ("A day in good company.")
// Works 100% offline in .exe, draggable only, no navigation buttons, looped
// ============================================================================
(function initInfiniteCarousel() {
  const container = document.getElementById("infiniteCarousel");
  const track = document.getElementById("carouselTrack");
  const counterEl = document.getElementById("carouselCurrentNum");
  if (!container || !track) return;

  const originalSlides = Array.from(track.querySelectorAll(".carousel-slide:not(.carousel-clone)"));
  const count = originalSlides.length;
  if (count === 0) return;

  // Remove any previously created clones
  track.querySelectorAll(".carousel-clone").forEach((el) => el.remove());

  // Create clone of first slide (to append at end) and last slide (to prepend at beginning)
  const firstClone = originalSlides[0].cloneNode(true);
  firstClone.classList.add("carousel-clone");
  firstClone.setAttribute("aria-hidden", "true");

  const lastClone = originalSlides[count - 1].cloneNode(true);
  lastClone.classList.add("carousel-clone");
  lastClone.setAttribute("aria-hidden", "true");

  track.appendChild(firstClone);
  track.insertBefore(lastClone, track.firstChild);

  // Slides array structure: [lastClone, slide1, slide2, slide3, slide4, slide5, slide6, firstClone]
  // Real slides are indices 1 to count (1 to 6)
  let currentIndex = 1;
  let isDragging = false;
  let isAnimating = false;
  let startX = 0;
  let currentDragX = 0;
  let containerWidth = container.getBoundingClientRect().width;

  function updateCounter() {
    if (!counterEl) return;
    let displayNum = currentIndex;
    if (displayNum < 1) displayNum = count;
    if (displayNum > count) displayNum = 1;
    counterEl.textContent = String(displayNum).padStart(2, "0");
  }

  function setPosition(index, animate = false) {
    containerWidth = container.getBoundingClientRect().width;
    if (animate) {
      isAnimating = true;
      track.style.transition = "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
    } else {
      track.style.transition = "none";
    }
    track.style.transform = `translate3d(${-index * containerWidth}px, 0, 0)`;
    updateCounter();
  }

  // Initial positioning at Slide 1 (index 1)
  setPosition(currentIndex, false);

  window.addEventListener("resize", () => {
    containerWidth = container.getBoundingClientRect().width;
    setPosition(currentIndex, false);
  }, { passive: true });

  // Handle seamless infinite loop jump when transition completes
  track.addEventListener("transitionend", () => {
    isAnimating = false;
    if (currentIndex >= count + 1) {
      // Slid into firstClone -> seamlessly snap to real Slide 1
      currentIndex = 1;
      setPosition(currentIndex, false);
    } else if (currentIndex <= 0) {
      // Slid into lastClone -> seamlessly snap to real Slide count (Slide 6)
      currentIndex = count;
      setPosition(currentIndex, false);
    }
  });

  // Pointer drag events: exactly 1 slide per drag, then stop
  container.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (isAnimating) return; // Wait for current slide transition to complete

    isDragging = true;
    startX = e.clientX;
    currentDragX = 0;
    containerWidth = container.getBoundingClientRect().width;
    track.style.transition = "none";
    container.classList.add("is-dragging");
    try {
      container.setPointerCapture(e.pointerId);
    } catch (_) { }
  });

  window.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    currentDragX = e.clientX - startX;
    const offset = -currentIndex * containerWidth + currentDragX;
    track.style.transform = `translate3d(${offset}px, 0, 0)`;
  });

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    container.classList.remove("is-dragging");
    try {
      if (e && e.pointerId) container.releasePointerCapture(e.pointerId);
    } catch (_) { }

    // Any drag beyond threshold advances or retreats by exactly 1 slide, then stops
    const threshold = Math.max(30, containerWidth * 0.05);

    if (currentDragX < -threshold) {
      currentIndex++; // Dragged left -> advance 1 slide
    } else if (currentDragX > threshold) {
      currentIndex--; // Dragged right -> previous 1 slide
    }
    // If drag was smaller than threshold, it springs back to currentIndex

    setPosition(currentIndex, true);
  };

  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);
})();

// ============================================================================
// SCROLL REVEALS & ANIMATIONS
// ============================================================================
if (!reduceMotion && "IntersectionObserver" in window) {
  const stagedGroups = [".course", ".person", ".notice"];
  const stagedElements = new Set(stagedGroups.flatMap((selector) => $$(selector)));
  const makeVisible = (element, delay = 0) => {
    window.setTimeout(() => element.classList.add("is-visible"), delay);
  };
  stagedGroups.forEach((selector) => {
    const elements = $$(selector);
    const parent = elements[0]?.parentElement;
    if (parent) {
      const groupObserver = new IntersectionObserver((entries, observer) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          elements.forEach((element, index) => makeVisible(element, index * 105));
          observer.disconnect();
        }
      }, { threshold: 0.12 });
      groupObserver.observe(parent);
    }
  });
  const observer = new IntersectionObserver((entries, obs) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      makeVisible(entry.target);
      obs.unobserve(entry.target);
    }
  }), { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
  $$(".reveal").filter((element) => !stagedElements.has(element) && !element.closest(".hero")).forEach((element) => observer.observe(element));
  $$(".hero .reveal").forEach((element, index) => makeVisible(element, 200 + index * 250));
} else {
  $$(".reveal").forEach((element) => {
    element.style.opacity = "1";
    element.style.transform = "none";
  });
}

// ============================================================================
// COURSE DETAILS MODAL & STUDENT PORTAL MODAL
// ============================================================================
const courseInfo = {
  "BA": "Bachelor’s degree in Arts with diverse subjects like English, Hindi, History, Geography, and more.",
  "B.Com.": "Bachelor’s degree in Commerce with a focus on global business and accounting.",
  "B.Sc.": "Bachelor’s degree in Science with multiple subject specializations.",
  "BCA": "Bachelor of Computer Application with industry-focused practical labs.",
  "MA": "Master’s degree course in subjects like English, Hindi, Ancient History, and Archaeology.",
  "M.Com": "Postgraduate course in Commerce responding to modern banking and business needs.",
  "M.Sc": "Postgraduate course in Science with specialization in Chemistry.",
  "MCA": "Master of Computer Application with high-demand software engineering tracks."
};

const courseModal = $("#courseModal");
const loginModal = $("#loginModal");

const openDialog = (dialog) => {
  if (!dialog) return;
  dialog.classList.remove("is-closing");
  dialog.showModal();
};

const closeDialog = (dialog) => {
  if (!dialog || !dialog.open || dialog.classList.contains("is-closing")) return;
  dialog.classList.add("is-closing");
  window.setTimeout(() => {
    if (dialog.open) dialog.close();
    dialog.classList.remove("is-closing");
  }, 230);
};

$$(".course").forEach((card) => {
  const btn = $("button", card);
  if (btn) {
    btn.addEventListener("click", () => {
      const course = card.dataset.course;
      const titleEl = $("#courseTitle");
      const textEl = $("#courseText");
      if (titleEl) titleEl.textContent = $("h3", card)?.textContent || course;
      if (textEl) textEl.textContent = courseInfo[course] || "Contact the college office for more information.";
      openDialog(courseModal);
    });
  }
});

const loginOpenBtn = $(".login-open");
if (loginOpenBtn) {
  loginOpenBtn.addEventListener("click", () => {
    closeMenu();
    const status = $("#loginStatus");
    if (status) status.textContent = "";
    const loginForm = $("#loginForm");
    if (loginForm) loginForm.reset();
    openDialog(loginModal);
  });
}

$$("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => closeDialog(button.closest("dialog")));
});

if (courseModal) {
  courseModal.addEventListener("click", (e) => { if (e.target === courseModal) closeDialog(courseModal); });
  courseModal.addEventListener("cancel", (e) => { e.preventDefault(); closeDialog(courseModal); });
  const closeBtn = $(".modal-close", courseModal);
  if (closeBtn) closeBtn.addEventListener("click", () => closeDialog(courseModal));
  const modalLink = $(".under-link", courseModal);
  if (modalLink) {
    modalLink.addEventListener("click", (e) => {
      e.preventDefault();
      closeDialog(courseModal);
      window.setTimeout(() => {
        const contactSection = $("#contact");
        if (contactSection) {
          if (lenis) lenis.scrollTo(contactSection);
          else contactSection.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        }
      }, 250);
    });
  }
}

if (loginModal) {
  loginModal.addEventListener("click", (e) => { if (e.target === loginModal) closeDialog(loginModal); });
  loginModal.addEventListener("cancel", (e) => { e.preventDefault(); closeDialog(loginModal); });
  const closeBtn = $(".modal-close", loginModal);
  if (closeBtn) closeBtn.addEventListener("click", () => closeDialog(loginModal));
  const loginForm = $("#loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const studentId = $("#studentId")?.value.trim();
      const password = $("#studentPassword")?.value;
      const status = $("#loginStatus");
      if (status) {
        status.textContent = studentId && password
          ? `Demo portal: sign-in received for (${studentId}). No live backend connected.`
          : "Please enter your student ID and password.";
      }
    });
  }
}

// ============================================================================
// FOOTER FORM: "A NOTE TO THE COLLEGE" (GOOGLE SHEETS INTEGRATION)
// ============================================================================
const CONTACT_STORAGE_KEY = "Mariahu P. G. College Jaunpur DemoMessages";
const contactForm = $("#contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = $("#contactStatus");
    const submitButton = $(".submit", contactForm);

    const message = {
      name: $("#contactName")?.value.trim() || "",
      email: $("#contactEmail")?.value.trim() || "",
      subject: $("#contactSubject")?.value || "",
      message: $("#contactMessage")?.value.trim() || "",
      submittedAt: new Date().toISOString()
    };

    if (!message.name || !message.email || !message.subject || !message.message) {
      if (status) status.textContent = "Please complete all fields before sending.";
      return;
    }

    // If GOOGLE_SHEETS_URL has been configured by the user:
    if (GOOGLE_SHEETS_URL && GOOGLE_SHEETS_URL.trim().length > 0) {
      if (submitButton) submitButton.disabled = true;
      if (status) status.textContent = "";

      try {
        // Send as URL-encoded form data with no-cors to avoid CORS preflight blockers
        const params = new URLSearchParams(message);
        await fetch(GOOGLE_SHEETS_URL.trim(), {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString()
        });

        // Also back up locally
        try {
          const saved = JSON.parse(localStorage.getItem(CONTACT_STORAGE_KEY) || "[]");
          saved.push(message);
          localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(saved));
        } catch (_) { }

        if (status) {
          status.style.color = "#41613b";
          status.textContent = "Thank you For Submitting the Form";
        }
        contactForm.reset();
      } catch (err) {
        if (status) {
          status.style.color = "#993333";
          status.textContent = "Could not reach Google Sheets. Please check your internet connection and Apps Script URL.";
        }
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
      return;
    }

    // Fallback: Offline demo mode in localStorage
    try {
      const saved = JSON.parse(localStorage.getItem(CONTACT_STORAGE_KEY) || "[]");
      saved.push(message);
      localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(saved));
      if (status) {
        status.style.color = "#556b4f";
        status.textContent = "Note saved locally (Demo mode). To sync to Google Sheets, paste your Apps Script URL into GOOGLE_SHEETS_URL in script.js.";
      }
      contactForm.reset();
    } catch {
      if (status) status.textContent = "Browser storage is unavailable. Your message was not saved.";
    }
  });
}

// Active navigation link highlighting on scroll
const mainSections = $$("main section[id]");
if ("IntersectionObserver" in window) {
  const activeObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    $$(".nav a").forEach((link) => link.classList.toggle("active", link.hash === `#${entry.target.id}`));
  }), { rootMargin: "-35% 0px -55% 0px" });
  mainSections.forEach((section) => activeObserver.observe(section));
}
