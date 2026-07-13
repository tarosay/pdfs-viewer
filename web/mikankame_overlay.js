const MIKANKAME_DURATION_STORAGE_KEY = "mikankameDurationMinutes";
const DEFAULT_MASCOT_ANIMATION_DURATION_MS = 5 * 60 * 1000;
const MASCOT_INITIAL_TRANSFORM = "translateX(0)";
const MASCOT_FINAL_TRANSFORM = "translateX(calc(100vw - 100% - 32px))";
let hasCompletedMascotAnimation = false;
const MIKANKAME_HIDE_STORAGE_KEY = "mikankameHidden";
const mascotElement = document.getElementById("mikankameOverlay");
let mascotAnimationDurationMs = DEFAULT_MASCOT_ANIMATION_DURATION_MS;
let shouldTriggerMascotAnimationFromUrl = false;
let shouldHideMascotFromUrl = false;

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
    const shouldShow = !shouldHideFromSetting() && !shouldHideMascotFromUrl;
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
      mascotElement.style.setProperty(
        "animation-duration",
        `${DEFAULT_MASCOT_ANIMATION_DURATION_MS}ms`,
      );
      return;
    }

    mascotAnimationDurationMs = durationMs;
    mascotElement.style.setProperty("--mascot-duration", `${durationMs}ms`);
    mascotElement.style.setProperty("animation-duration", `${durationMs}ms`);
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

  function applyMascotDurationFromUrl(url) {
    const timeParam = url.searchParams.get("time");
    if (timeParam === null) {
      return;
    }

    const minutes = Number(timeParam);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return;
    }

    setMascotAnimationDurationMs(minutes * 60 * 1000);
  }

  function updateAnimationPreferenceFromUrl(url) {
    const animationParam = url.searchParams.get("animation");
    if (!animationParam) {
      return;
    }

    const normalized = animationParam.trim().toLowerCase();
    const shouldPlay = ["1", "true", "yes", "on", "start"].includes(normalized);
    const shouldHide = ["0", "false", "no", "off", "stop"].includes(normalized);
    shouldTriggerMascotAnimationFromUrl =
      shouldTriggerMascotAnimationFromUrl || shouldPlay;

    if (shouldHide) {
      shouldHideMascotFromUrl = true;
    }
  }

  function applyMascotConfigurationFromUrl() {
    let url;
    try {
      url = new URL(window.location.href);
    } catch (error) {
      console.warn("Failed to parse the current URL for mascot configuration.", error);
      return;
    }

    applyMascotDurationFromUrl(url);
    updateAnimationPreferenceFromUrl(url);
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

  function startMascotAnimation() {
    hasCompletedMascotAnimation = false;
    mascotElement.style.transform = MASCOT_INITIAL_TRANSFORM;
    setMascotAnimationDurationMs(mascotAnimationDurationMs);
    mascotElement.classList.remove("pdfs-mikankame-hidden");
    mascotElement.classList.add("pdfs-mikankame-visible");
    mascotElement.classList.remove("pdfs-mikankame-animating");
    void mascotElement.offsetWidth;
    mascotElement.classList.add("pdfs-mikankame-animating");
  }

  function playMascotAnimation() {
    if (shouldHideFromSetting() || hasCompletedMascotAnimation || isMascotAnimating()) {
      return;
    }

    startMascotAnimation();
  }

  function restartMascotAnimation() {
    if (shouldHideFromSetting()) {
      return;
    }

    startMascotAnimation();
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
      case "restart-mikankame-animation":
        restartMascotAnimation();
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
    applyStoredMascotDuration();
    applyMascotConfigurationFromUrl();
    updateMascotVisibility();

    if (shouldTriggerMascotAnimationFromUrl && !shouldHideFromSetting()) {
      requestAnimationFrame(() => {
        playMascotAnimation();
      });
    }
  });

  window.restartMikankameAnimation = restartMascotAnimation;

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
