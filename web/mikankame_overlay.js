const MASCOT_ANIMATION_DURATION_MS = 8000;
const MASCOT_FINAL_TRANSFORM = "translateX(calc(100vw - 100% - 32px))";
let hasCompletedMascotAnimation = false;
let hasResetMascotPositionSinceLoad = false;
let shouldResumeMascotAnimationAfterHide = false;
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
        mascotElement.classList.remove("pdfs-mikankame-animating");
        mascotElement.style.removeProperty("animation-play-state");
        shouldResumeMascotAnimationAfterHide = false;
        return;
      }

      if (isMascotAnimating()) {
        mascotElement.style.animationPlayState = "paused";
        shouldResumeMascotAnimationAfterHide = true;
      } else {
        mascotElement.style.removeProperty("animation-play-state");
        shouldResumeMascotAnimationAfterHide = false;
      }
      return;
    }

    if (
      shouldResumeMascotAnimationAfterHide &&
      isMascotAnimating() &&
      mascotElement.style.animationPlayState === "paused"
    ) {
      mascotElement.style.animationPlayState = "running";
      const raf = window.requestAnimationFrame;
      if (typeof raf === "function") {
        raf(() => {
          if (shouldResumeMascotAnimationAfterHide) {
            return;
          }
          if (mascotElement.style.animationPlayState === "running") {
            mascotElement.style.removeProperty("animation-play-state");
          }
        });
      } else if (mascotElement.style.animationPlayState === "running") {
        mascotElement.style.removeProperty("animation-play-state");
      }
    }
    shouldResumeMascotAnimationAfterHide = false;
  }

  function isMascotAnimating() {
    return mascotElement.classList.contains("pdfs-mikankame-animating");
  }

  function playMascotAnimation() {
    if (
      !shouldDisplayMascot() ||
      hasCompletedMascotAnimation ||
      isMascotAnimating()
    ) {
      return;
    }

    hasCompletedMascotAnimation = false;
    if (!hasResetMascotPositionSinceLoad) {
      mascotElement.style.removeProperty("transform");
      hasResetMascotPositionSinceLoad = true;
    }
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
    shouldResumeMascotAnimationAfterHide = false;
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

  function handleFullscreenChange() {
    updateMascotVisibility();

    if (
      isDocumentFullscreen() &&
      !hasCompletedMascotAnimation &&
      !isMascotAnimating()
    ) {
      playMascotAnimation();
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
    document.addEventListener(eventName, handleFullscreenChange);
  });
}
