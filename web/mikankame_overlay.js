const MIKANKAME_DURATION_STORAGE_KEY = "mikankameDurationMinutes";
const DEFAULT_MASCOT_ANIMATION_DURATION_MS = 5 * 60 * 1000;
const MASCOT_INITIAL_TRANSFORM = "translateX(0)";
const MASCOT_FINAL_TRANSFORM = "translateX(calc(100vw - 100% - 32px))";
let hasCompletedMascotAnimation = false;
const MIKANKAME_HIDE_STORAGE_KEY = "mikankameHidden";
const mascotElement = document.getElementById("mikankameOverlay");
let mascotAnimationDurationMs = DEFAULT_MASCOT_ANIMATION_DURATION_MS;

if (mascotElement) {
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

  function setMascotAnimationDurationMs(durationMs) {
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      mascotAnimationDurationMs = DEFAULT_MASCOT_ANIMATION_DURATION_MS;
      mascotElement.style.setProperty(
        "--mascot-duration",
        `${DEFAULT_MASCOT_ANIMATION_DURATION_MS}ms`,
      );
      return;
    }

    mascotAnimationDurationMs = durationMs;
    mascotElement.style.setProperty("--mascot-duration", `${durationMs}ms`);
  }

  function getStoredMascotDurationMinutes() {
    try {
      const stored = localStorage.getItem(MIKANKAME_DURATION_STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const parsed = Number(stored);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn(
        "Failed to access mikankame duration from localStorage inside the viewer.",
        error,
      );
      return null;
    }
  }

  function applyStoredMascotDuration() {
    const minutes = getStoredMascotDurationMinutes();
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setMascotAnimationDurationMs(DEFAULT_MASCOT_ANIMATION_DURATION_MS);
      return;
    }

    setMascotAnimationDurationMs(minutes * 60 * 1000);
  }

  function updateMascotDuration(minutes) {
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return;
    }

    const durationMs = minutes * 60 * 1000;
    try {
      localStorage.setItem(MIKANKAME_DURATION_STORAGE_KEY, String(minutes));
    } catch (error) {
      console.warn(
        "Failed to persist mikankame duration inside the viewer.",
        error,
      );
    }

    setMascotAnimationDurationMs(durationMs);

    if (isMascotAnimating()) {
      mascotElement.classList.remove("pdfs-mikankame-animating");
      void mascotElement.offsetWidth;
      mascotElement.classList.add("pdfs-mikankame-animating");
    }
  }

  function playMascotAnimation() {
    if (shouldHideFromSetting() || hasCompletedMascotAnimation || isMascotAnimating()) {
      return;
    }

    hasCompletedMascotAnimation = false;
    mascotElement.style.transform = MASCOT_INITIAL_TRANSFORM;
    setMascotAnimationDurationMs(mascotAnimationDurationMs);
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
      case "update-mikankame-duration":
        updateMascotDuration(Number(data.durationMinutes));
        break;
      default:
        break;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    mascotElement.style.transform = MASCOT_INITIAL_TRANSFORM;
    updateMascotVisibility();
    applyStoredMascotDuration();
  });

  window.addEventListener("message", handleMessage);
  window.addEventListener("storage", (event) => {
    if (!event.key || event.key === MIKANKAME_HIDE_STORAGE_KEY) {
      updateMascotVisibility();
    }

    if (!event.key || event.key === MIKANKAME_DURATION_STORAGE_KEY) {
      applyStoredMascotDuration();
    }
  });
  mascotElement.addEventListener("animationend", handleAnimationEnd);
}
