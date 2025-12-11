// web/slide-click.js — 標準⇄拡張切替（全画面ボタン常時制御版）
(() => {
  const STATE = { enabled: false };
  let fsBtn, modeBtn;
  let hasInitialized = false;

  // PDF.js 参照
  const app = () => window.PDFViewerApplication;
  const viewer = () => app()?.pdfViewer;

  // ブラウザ全画面判定
  const isFS = () => !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  // 全画面切り替え処理
  const reqFS = () => (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen || document.documentElement.msRequestFullscreen).call(document.documentElement);
  const exitFS = () => (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
  const toggleFS = () => isFS() ? exitFS() : reqFS();

  /* ===== UIを隠すCSS ===== */
  const HUD_STYLE_ID = 'slideHideHUD';
  function injectHudHider() {
    if (document.getElementById(HUD_STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = HUD_STYLE_ID;
    st.textContent = `
      #toolbarContainer, #secondaryToolbar, #sidebarContainer, #findbar, .findbar { display:none !important; }
      #viewerContainer { top:0 !important; left:0 !important; }
    `;
    document.head.appendChild(st);
  }
  function removeHudHider() {
    document.getElementById(HUD_STYLE_ID)?.remove();
  }

  /* ===== 表示調整 ===== */
  function basePageSize() {
    const v = viewer(), a = app();
    if (!v || !a) return null;
    const pv = v.getPageView(Math.max(0, (a.page || 1) - 1));
    if (!pv || !pv.viewport || !pv.scale) return null;
    return { w: pv.viewport.width / pv.scale, h: pv.viewport.height / pv.scale };
  }
  function applyCover() {
    const v = viewer(); const vc = document.getElementById('viewerContainer'); const b = basePageSize();
    if (!v || !vc || !b) return;
    const vw = vc.clientWidth, vh = vc.clientHeight;
    v.currentScale = Math.max(vw / b.w, vh / b.h);
    vc.style.overflow = 'hidden';
  }
  function applyContain() {
    const v = viewer(); const vc = document.getElementById('viewerContainer');
    if (v) v.currentScaleValue = 'page-fit';
    if (vc) vc.style.overflow = '';
  }

  // ★重要：ここは常に動き、ボタン表示を更新する。スライド機能の制御はそのあとで行う。
  function onFSChange() {
    updateFsBtn();
    if (!STATE.enabled) return;
    isFS() ? applyCover() : applyContain();
  }

  function onResize() { if (STATE.enabled && isFS()) applyCover(); }
  function onPagesInit() { if (!STATE.enabled) return; const v = viewer(); if (v) v.currentScaleValue = 'page-fit'; if (isFS()) applyCover(); }
  function onPageChanging() { if (STATE.enabled && isFS()) applyCover(); }

  /* ===== クリック操作 ===== */
  function onPointerUp(e) {
    if (!STATE.enabled) return;
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (e.target.closest('#toolbarContainer, #secondaryToolbar, #sidebarContainer, #findbar, .findbar, #slideUI')) return;
    if (e.target.closest('a[href], .annotationLayer a[href], .linkAnnotation')) return;
    const sel = window.getSelection(); if (sel && String(sel).length) return;

    const A = app(), V = viewer(); if (!A || !V) return;
    const right = e.clientX >= (document.documentElement.clientWidth / 2);
    const next = Math.max(1, Math.min((A.page || 1) + (right ? 1 : -1), A.pagesCount || V.pagesCount || 1));
    if (next !== A.page) V.currentPageNumber = next;
    e.preventDefault();
  }

  function onExternalLink(e) {
    if (!STATE.enabled) return;
    const aEl = e.target.closest && e.target.closest('a[href], .annotationLayer a[href], .linkAnnotation');
    if (!aEl) return;
    const hrefAttr = aEl.getAttribute('href') || '';
    const internal = aEl.classList?.contains('internalLink') || hrefAttr.startsWith('#');
    const external = !internal && (/^https?:\/\//i.test(hrefAttr) || aEl.classList?.contains('externalLink') || (aEl.href && aEl.href.startsWith('http')));
    if (external) { window.open(aEl.href || hrefAttr, '_blank', 'noopener'); e.preventDefault(); e.stopPropagation(); }
  }

  /* ===== 拡張 ON/OFF ===== */
  function enable() {
    if (STATE.enabled) return;
    STATE.enabled = true;
    injectHudHider();
    const v = viewer();
    if (v) {
      const SM = (v.constructor?.ScrollMode?.PAGE) ?? 3;
      v.scrollMode = SM;
      v.currentScaleValue = 'page-fit';
    }
    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('click', onExternalLink, true);
    // ★全画面監視イベントの登録は ensureUI に移動しました
    window.addEventListener('resize', onResize);
    document.addEventListener('pagesinit', onPagesInit);
    document.addEventListener('pagechanging', onPageChanging);
    updateModeBtn();
  }

  function disable() {
    if (!STATE.enabled) return;
    STATE.enabled = false;
    document.removeEventListener('pointerup', onPointerUp, true);
    document.removeEventListener('click', onExternalLink, true);
    // ★全画面監視イベントの解除は行わない（常駐させるため）
    window.removeEventListener('resize', onResize);
    document.removeEventListener('pagesinit', onPagesInit);
    document.removeEventListener('pagechanging', onPageChanging);
    removeHudHider();

    const v = viewer();
    if (v) {
      v.scrollMode = 0; // Vertical
      v.spreadMode = 0; // None
      v.currentScaleValue = 'auto';
    }
    const vc = document.getElementById('viewerContainer');
    if (vc) vc.style.overflow = '';

    updateModeBtn();
  }

  /* ===== UI ===== */
  function ensureUI() {
    if (document.getElementById('slideUI')) return;
    const ui = document.createElement('div');
    ui.id = 'slideUI';
    Object.assign(ui.style, {
      position: 'fixed', right: '10px', bottom: '10px', zIndex: '2147483646', display: 'flex', gap: '8px',
    });

    modeBtn = document.createElement('button');
    fsBtn = document.createElement('button');
    [modeBtn, fsBtn].forEach(btn => Object.assign(btn.style, {
      padding: '6px 10px', border: '1px solid #888', borderRadius: '6px',
      background: '#fff', color: '#111', cursor: 'pointer',
      font: '14px/1.2 sans-serif'
    }));

    modeBtn.onclick = (e) => { e.stopPropagation(); (STATE.enabled ? disable : enable)(); };
    fsBtn.onclick = (e) => { e.stopPropagation(); toggleFS(); };

    ui.appendChild(modeBtn);
    ui.appendChild(fsBtn);
    document.body.appendChild(ui);
    updateModeBtn(); updateFsBtn();

    // ★ここで監視を開始（常駐）
    document.addEventListener('fullscreenchange', onFSChange);
    document.addEventListener('webkitfullscreenchange', onFSChange);
    document.addEventListener('msfullscreenchange', onFSChange);
  }

  function updateModeBtn() { if (modeBtn) modeBtn.textContent = STATE.enabled ? 'スライド機能：ON' : 'スライド機能：OFF'; }

  function updateFsBtn() {
    if (!fsBtn) return;
    if (isFS()) {
      fsBtn.style.display = 'none'; // 全画面中は隠す
    } else {
      fsBtn.style.display = '';     // 通常時は表示
      fsBtn.textContent = '全画面';
    }
  }

  window.addEventListener('keydown', (e) => {
    if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'f' || e.key === 'F')) { toggleFS(); e.preventDefault(); }
  }, true);

  /* ===== 初期化・パラメータ適用 ===== */
  function setInitialScrollMode() {
    if (hasInitialized) return;
    const v = viewer();
    if (!v || !v.pagesCount) return;

    hasInitialized = true;

    let modeParam = null;
    try {
      const p = new URLSearchParams(window.parent.location.search);
      modeParam = p.get('slide');
    } catch (e) { }
    if (!modeParam) modeParam = new URLSearchParams(window.location.search).get('slide');

    const resetToStandard = () => {
      v.scrollMode = 0; // Vertical
      v.spreadMode = 0; // None
      v.currentScaleValue = 'auto';
      const vc = document.getElementById('viewerContainer');
      if (vc) vc.style.overflow = '';
    };

    if (modeParam === 'on') {
      enable();
      const SM = (v.constructor?.ScrollMode?.PAGE) ?? 3;
      v.scrollMode = SM;
      v.currentScaleValue = 'page-fit';
      if (isFS()) applyCover();

    } else if (modeParam === 'off') {
      if (STATE.enabled) disable();
      resetToStandard();
      setTimeout(resetToStandard, 500);
      setTimeout(resetToStandard, 1500);

    } else {
      const PAGE_MODE = (v.constructor?.ScrollMode?.PAGE) ?? 3;
      if (!STATE.enabled && v.scrollMode === PAGE_MODE) {
        resetToStandard();
        setTimeout(resetToStandard, 500);
      }
    }
  }

  // PDF準備完了を監視
  document.addEventListener('DOMContentLoaded', ensureUI);
  document.addEventListener('pagesinit', setInitialScrollMode);

  const checkInterval = setInterval(() => {
    const v = viewer();
    if (v && v.pagesCount > 0) {
      setInitialScrollMode();
      clearInterval(checkInterval);
    }
  }, 500);

})();