const MASCOT_ANIMATION_DURATION_MS = 8000;
const MASCOT_INITIAL_TRANSFORM = "translateX(0)";
const MASCOT_FINAL_TRANSFORM = "translateX(calc(100vw - 100% - 32px))";
let hasCompletedMascotAnimation = false;
const MIKANKAME_HIDE_STORAGE_KEY = "mikankameHidden";
const mascotElement = document.getElementById("mikankameOverlay");
const shouldDisableMascot = (() => {
  try {
    return new URL(window.location.href).searchParams.get("hideMikankame") === "1";
  } catch (error) {
    console.warn("Failed to inspect URL parameters for mikankame overlay.", error);
    return false;
  }
})();

if (shouldDisableMascot && mascotElement) {
  mascotElement.remove();
} else if (mascotElement) {
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

  function updateMascotVisibility() {
    const shouldShow = !shouldHideFromSetting();
    mascotElement.classList.toggle("pdfs-mikankame-hidden", !shouldShow);
    mascotElement.classList.toggle("pdfs-mikankame-visible", shouldShow);

    if (!shouldShow) {
      mascotElement.classList.remove("pdfs-mikankame-animating");
      mascotElement.style.removeProperty("animation-play-state");
      return;
    }
  }

  function isMascotAnimating() {
    return mascotElement.classList.contains("pdfs-mikankame-animating");
  }

  function playMascotAnimation() {
    if (shouldHideFromSetting() || hasCompletedMascotAnimation || isMascotAnimating()) {
      return;
    }

    hasCompletedMascotAnimation = false;
    mascotElement.style.transform = MASCOT_INITIAL_TRANSFORM;
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
    mascotElement.style.removeProperty("animation-play-state");
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
    mascotElement.style.transform = MASCOT_INITIAL_TRANSFORM;
    updateMascotVisibility();
  });

  window.addEventListener("message", handleMessage);
  window.addEventListener("storage", updateMascotVisibility);
  mascotElement.addEventListener("animationend", handleAnimationEnd);
}
