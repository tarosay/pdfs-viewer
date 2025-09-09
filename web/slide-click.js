// web/slide-click.js — 標準⇄拡張切替（拡張ON時はツールバー等を非表示）
(() => {
  const STATE = { enabled: false };  // 初期はOFF＝標準そのまま
  let fsBtn, modeBtn;

  // PDF.js 参照
  const app = () => window.PDFViewerApplication;
  const viewer = () => app()?.pdfViewer;

  // ブラウザ全画面
  const isFS = () => !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  const reqFS = () => (document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen||document.documentElement.msRequestFullscreen).call(document.documentElement);
  const exitFS= () => (document.exitFullscreen||document.webkitExitFullscreen||document.msExitFullscreen).call(document);
  const toggleFS = () => isFS()? exitFS() : reqFS();

  /* ===== UIを隠すCSS（拡張ONの間だけ効かせる） ===== */
  const HUD_STYLE_ID = 'slideHideHUD';
  function injectHudHider(){
    if (document.getElementById(HUD_STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = HUD_STYLE_ID;
    st.textContent = `
      /* 上部バー／サイドバー／検索バーを非表示 */
      #toolbarContainer, #secondaryToolbar, #sidebarContainer, #findbar, .findbar { display:none !important; }
      /* 表示領域をフルに使う */
      #viewerContainer { top:0 !important; left:0 !important; }
    `;
    document.head.appendChild(st);
  }
  function removeHudHider(){
    document.getElementById(HUD_STYLE_ID)?.remove();
  }

  /* ===== FS中は余白ゼロ（cover）、通常は page-fit（contain） ===== */
  function basePageSize(){
    const v = viewer(), a = app();
    if (!v || !a) return null;
    const pv = v.getPageView(Math.max(0, (a.page||1) - 1));
    if (!pv || !pv.viewport || !pv.scale) return null;
    return { w: pv.viewport.width / pv.scale, h: pv.viewport.height / pv.scale };
  }
  function applyCover(){
    const v = viewer(); const vc = document.getElementById('viewerContainer'); const b = basePageSize();
    if (!v || !vc || !b) return;
    const vw = vc.clientWidth, vh = vc.clientHeight;
    v.currentScale = Math.max(vw / b.w, vh / b.h);   // 余白ゼロ
    vc.style.overflow = 'hidden';
  }
  function applyContain(){
    const v = viewer(); const vc = document.getElementById('viewerContainer');
    if (v) v.currentScaleValue = 'page-fit';         // 余白あり
    if (vc) vc.style.overflow = '';
  }
  function onFSChange(){ if (!STATE.enabled) return; isFS() ? applyCover() : applyContain(); }
  function onResize(){ if (STATE.enabled && isFS()) applyCover(); }
  function onPagesInit(){ if (!STATE.enabled) return; const v = viewer(); if (v) v.currentScaleValue = 'page-fit'; if (isFS()) applyCover(); }
  function onPageChanging(){ if (STATE.enabled && isFS()) applyCover(); }

  /* ===== クリックでページ送り（リンク/ツールバー上はスルー） ===== */
  function onPointerUp(e){
    if (!STATE.enabled) return;
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (e.target.closest('#toolbarContainer, #secondaryToolbar, #sidebarContainer, #findbar, .findbar, #slideUI')) return;
    if (e.target.closest('a[href], .annotationLayer a[href], .linkAnnotation')) return;
    const sel = window.getSelection(); if (sel && String(sel).length) return;

    const A = app(), V = viewer(); if (!A || !V) return;
    const right = e.clientX >= (document.documentElement.clientWidth/2);
    const next  = Math.max(1, Math.min((A.page||1)+(right?1:-1), A.pagesCount || V.pagesCount || 1));
    if (next !== A.page) V.currentPageNumber = next;
    e.preventDefault();
  }

  /* ===== 外部リンクは必ず別タブ ===== */
  function onExternalLink(e){
    if (!STATE.enabled) return;
    const aEl = e.target.closest && e.target.closest('a[href], .annotationLayer a[href], .linkAnnotation');
    if (!aEl) return;
    const hrefAttr = aEl.getAttribute('href') || '';
    const internal = aEl.classList?.contains('internalLink') || hrefAttr.startsWith('#');
    const external = !internal && (/^https?:\/\//i.test(hrefAttr) || aEl.classList?.contains('externalLink') || (aEl.href && aEl.href.startsWith('http')));
    if (external){ window.open(aEl.href || hrefAttr, '_blank', 'noopener'); e.preventDefault(); e.stopPropagation(); }
  }

  /* ===== 拡張 ON/OFF ===== */
  function enable(){
    if (STATE.enabled) return;
    STATE.enabled = true;

    // UI非表示のスタイルを適用
    injectHudHider();

    // 単一ページ & page-fit
    const v = viewer();
    if (v){
      const SM = (v.constructor?.ScrollMode?.PAGE) ?? 3;
      v.scrollMode = SM;
      v.currentScaleValue = 'page-fit';
    }

    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('click',     onExternalLink, true);
    document.addEventListener('fullscreenchange', onFSChange);
    document.addEventListener('webkitfullscreenchange', onFSChange);
    document.addEventListener('msfullscreenchange', onFSChange);
    window.addEventListener('resize', onResize);
    document.addEventListener('pagesinit', onPagesInit);
    document.addEventListener('pagechanging', onPageChanging);

    updateModeBtn();
  }

  function disable(){
    if (!STATE.enabled) return;
    STATE.enabled = false;

    // 追加したリスナーとスタイルを撤去 → 完全に標準へ
    document.removeEventListener('pointerup', onPointerUp, true);
    document.removeEventListener('click',     onExternalLink, true);
    document.removeEventListener('fullscreenchange', onFSChange);
    document.removeEventListener('webkitfullscreenchange', onFSChange);
    document.removeEventListener('msfullscreenchange', onFSChange);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('pagesinit', onPagesInit);
    document.removeEventListener('pagechanging', onPageChanging);
    removeHudHider();

    const v = viewer();
    if (v){
      v.scrollMode = 0;            // Vertical（連続スクロール）
      v.currentScaleValue = 'auto';
    }
    const vc = document.getElementById('viewerContainer');
    if (vc) vc.style.overflow = '';

    updateModeBtn();
  }

  /* ===== 右下UI（拡張ON/OFF・全画面） ===== */
  function ensureUI(){
    if (document.getElementById('slideUI')) return;
    const ui = document.createElement('div');
    ui.id = 'slideUI';
    Object.assign(ui.style, { position:'fixed', right:'10px', bottom:'10px', zIndex:'2147483647', display:'flex', gap:'8px' });

    modeBtn = document.createElement('button');
    fsBtn   = document.createElement('button');
    [modeBtn, fsBtn].forEach(btn => Object.assign(btn.style, {
      padding:'6px 10px', border:'1px solid #888', borderRadius:'6px',
      background:'#fff', color:'#111',
      font:'14px/1.2 -apple-system,system-ui,"Segoe UI",Roboto,"Noto Sans JP","Hiragino Kaku Gothic ProN","Yu Gothic UI",sans-serif',
      cursor:'pointer'
    }));

    modeBtn.onclick = (e) => { e.stopPropagation(); (STATE.enabled ? disable : enable)(); };
    fsBtn.onclick   = (e) => { e.stopPropagation(); toggleFS(); };

    ui.appendChild(modeBtn);
    ui.appendChild(fsBtn);
    document.body.appendChild(ui);

    updateModeBtn(); updateFsBtn();
    document.addEventListener('fullscreenchange', updateFsBtn);
    document.addEventListener('webkitfullscreenchange', updateFsBtn);
    document.addEventListener('msfullscreenchange', updateFsBtn);
  }
  function updateModeBtn(){ if (modeBtn) modeBtn.textContent = STATE.enabled ? 'スライド機能：ON' : 'スライド機能：OFF'; }
  function updateFsBtn(){   if (fsBtn)   fsBtn.textContent   = isFS() ? '全画面終了' : '全画面'; }

  // Fキーでも全画面
  window.addEventListener('keydown', (e) => {
    if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'f' || e.key === 'F')) { toggleFS(); e.preventDefault(); }
  }, true);

  function setInitialScrollMode() {
    if (STATE.enabled) return;
    const v = viewer();
    if (v) {
      v.scrollMode = 0; // Vertical
      v.currentScaleValue = 'auto';
    }
  }

  document.addEventListener('pagesinit', setInitialScrollMode, { once: true });
  document.addEventListener('DOMContentLoaded', ensureUI);
})();
