const MASCOT_ANIMATION_DURATION_MS = 8000;
const MASCOT_FINAL_TRANSFORM = "translateX(calc(100vw - 100% - 32px))";
let hasCompletedMascotAnimation = false;
const MIKANKAME_HIDE_STORAGE_KEY = "mikankameHidden";
const mascotElement = document.getElementById("mikankameOverlay");

if (mascotElement) {
  const isEmbeddedViewer = window.top !== window;

  const fullScreenEvents = [
    "fullscreenchange",
    "webkitfullscreenchange",
    "msfullscreenchange",
  ];

  function isDocumentFullscreen() {
    return Boolean(
      document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
    );
  }

  function shouldHideFromSetting() {
    try {
      return localStorage.getItem(MIKANKAME_HIDE_STORAGE_KEY) === "true";
    } catch (error) {
      console.warn(
        "Failed to access mikankame preference from localStorage inside the viewer.",
        error,
      );
      return false;
    }
  }

  function shouldDisplayMascot() {
    if (shouldHideFromSetting()) {
      return false;
    }

    if (!isEmbeddedViewer) {
      return true;
    }

    return isDocumentFullscreen();
  }

  function updateMascotVisibility() {
    const shouldShow = shouldDisplayMascot();
    mascotElement.classList.toggle("pdfs-mikankame-hidden", !shouldShow);
    mascotElement.classList.toggle("pdfs-mikankame-visible", shouldShow);

    if (!shouldShow) {
      if (hasCompletedMascotAnimation) {
        mascotElement.style.transform = MASCOT_FINAL_TRANSFORM;
      }
      mascotElement.classList.remove("pdfs-mikankame-animating");
    }
  }

  function playMascotAnimation() {
    if (!shouldDisplayMascot()) {
      return;
    }

    hasCompletedMascotAnimation = false;
    mascotElement.style.removeProperty("transform");
    mascotElement.style.setProperty(
      "--mascot-duration",
      `${MASCOT_ANIMATION_DURATION_MS}ms`,
    );
    mascotElement.classList.remove("pdfs-mikankame-hidden");
    mascotElement.classList.add("pdfs-mikankame-visible");
    mascotElement.classList.remove("pdfs-mikankame-animating");
    void mascotElement.offsetWidth;
    mascotElement.classList.add("pdfs-mikankame-animating");
  }

  function handleAnimationEnd(event) {
    if (event.animationName !== "pdfsMascotSlideAcross") {
      return;
    }

    hasCompletedMascotAnimation = true;
    mascotElement.classList.remove("pdfs-mikankame-animating");
    mascotElement.style.transform = MASCOT_FINAL_TRANSFORM;
  }

  function handleMessage(event) {
    const { data } = event;
    if (!data || typeof data !== "object") {
      return;
    }

    switch (data.type) {
      case "play-mikankame-animation":
        playMascotAnimation();
        break;
      case "update-mikankame-visibility":
        updateMascotVisibility();
        break;
      default:
        break;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateMascotVisibility();
    if (!isEmbeddedViewer) {
      playMascotAnimation();
    }
  });

  window.addEventListener("message", handleMessage);
  window.addEventListener("storage", updateMascotVisibility);
  mascotElement.addEventListener("animationend", handleAnimationEnd);
  fullScreenEvents.forEach((eventName) => {
    document.addEventListener(eventName, updateMascotVisibility);
    document.addEventListener(eventName, () => {
      if (isDocumentFullscreen()) {
        playMascotAnimation();
      }
    });
  });
}
