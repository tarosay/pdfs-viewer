// web/slide-click.js（標準⇄拡張の切替。標準UI/背景を壊さない版）
(() => {
  const STATE = { enabled: false };  // ← 初期はOFF（完全に標準のまま）
  let fsBtn, modeBtn;

  // PDF.js 参照
  const app   = () => window.PDFViewerApplication;
  const viewer= () => app()?.pdfViewer;

  // 全画面（ブラウザFS）
  const isFS   = () => !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  const reqFS  = () => (document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen||document.documentElement.msRequestFullscreen).call(document.documentElement);
  const exitFS = () => (document.exitFullscreen||document.webkitExitFullscreen||document.msExitFullscreen).call(document);
  const toggleFS = () => isFS()? exitFS() : reqFS();

  // 拡張ON：単一ページ + page-fit、クリック送り、外部リンク別タブ、FS中はcover
  function enable(){
    if (STATE.enabled) return;
    STATE.enabled = true;

    const v = viewer();
    if (v){
      const SM = (v.constructor?.ScrollMode?.PAGE) ?? 3; // PAGE
      v.scrollMode = SM;
      v.currentScaleValue = 'page-fit';
    }

    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('click',     onExternalLink, true);
    document.addEventListener('fullscreenchange', onFSChange);
    window.addEventListener('resize', onResize);
    document.addEventListener('pagesinit', onPagesInit);
    document.addEventListener('pagechanging', onPageChanging);

    updateModeBtn();
  }

  // 拡張OFF：**完全に標準へ戻す**（背景・ツールバー・挙動を壊さない）
  function disable(){
    if (!STATE.enabled) return;
    STATE.enabled = false;

    document.removeEventListener('pointerup', onPointerUp, true);
    document.removeEventListener('click',     onExternalLink, true);
    document.removeEventListener('fullscreenchange', onFSChange);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('pagesinit', onPagesInit);
    document.removeEventListener('pagechanging', onPageChanging);

    const v = viewer();
    if (v){
      v.scrollMode = 0;        // Vertical (連続スクロール)
      v.currentScaleValue = 'auto'; // 標準の自動倍率
    }
    const vc = document.getElementById('viewerContainer');
    if (vc) vc.style.overflow = ''; // 変更を元に戻す

    updateModeBtn();
  }

  // クリック送り（リンク・ツールバー上はスルー）
  function onPointerUp(e){
    if (!STATE.enabled) return;
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (e.target.closest('#toolbarContainer, #secondaryToolbar, #sidebarContainer, #slideUI')) return;
    if (e.target.closest('a[href], .annotationLayer a[href], .linkAnnotation')) return;

    const sel = window.getSelection();
    if (sel && String(sel).length) return;

    const a = app(), v = viewer();
    if (!a || !v) return;
    const right = e.clientX >= (document.documentElement.clientWidth/2);
    const next  = Math.max(1, Math.min((a.page||1) + (right? 1 : -1), a.pagesCount || v.pagesCount || 1));
    if (next !== a.page) v.currentPageNumber = next;
    e.preventDefault();
  }

  // 外部リンクは必ず別タブ（内部リンク/#は標準のまま）
  function onExternalLink(e){
    if (!STATE.enabled) return;
    const aEl = e.target.closest && e.target.closest('a[href], .annotationLayer a[href], .linkAnnotation');
    if (!aEl) return;

    const hrefAttr = aEl.getAttribute('href') || '';
    const internal = aEl.classList?.contains('internalLink') || hrefAttr.startsWith('#');
    const external = !internal && (/^https?:\/\//i.test(hrefAttr) || aEl.classList?.contains('externalLink') || (aEl.href && aEl.href.startsWith('http')));

    if (external){
      const url = aEl.href || hrefAttr;
      window.open(url, '_blank', 'noopener');
      e.preventDefault(); e.stopPropagation();
    }
  }

  // FS中は“隙間ゼロ（cover）”、通常は page-fit（contain）
  function basePageSize(){
    const v = viewer(), a = app();
    if (!v || !a) return null;
    const pv = v.getPageView(Math.max(0, (a.page||1) - 1));
    if (!pv || !pv.viewport || !pv.scale) return null;
    return { w: pv.viewport.width / pv.scale, h: pv.viewport.height / pv.scale };
  }
  function applyCover(){
    const v = viewer(); const vc = document.getElementById('viewerContainer'); const base = basePageSize();
    if (!v || !vc || !base) return;
    const { w, h } = base; const vw = vc.clientWidth, vh = vc.clientHeight;
    v.currentScale = Math.max(vw / w, vh / h); // cover（余白ゼロ）
    vc.style.overflow = 'hidden';
  }
  function applyContain(){
    const v = viewer(); const vc = document.getElementById('viewerContainer');
    if (v) v.currentScaleValue = 'page-fit'; // contain（余白あり）
    if (vc) vc.style.overflow = '';
  }
  function onFSChange(){ if (!STATE.enabled) return; isFS() ? applyCover() : applyContain(); }
  function onResize(){ if (STATE.enabled && isFS()) applyCover(); }
  function onPagesInit(){ if (!STATE.enabled) return; const v = viewer(); if (v) v.currentScaleValue = 'page-fit'; if (isFS()) applyCover(); }
  function onPageChanging(){ if (STATE.enabled && isFS()) applyCover(); }

  // 右下のUI（拡張トグル/全画面）
  function ensureUI(){
    if (document.getElementById('slideUI')) return;
    const ui = document.createElement('div');
    ui.id = 'slideUI';
    Object.assign(ui.style, { position:'fixed', right:'10px', bottom:'10px', zIndex:'2147483647', display:'flex', gap:'8px' });

    modeBtn = document.createElement('button');
    fsBtn   = document.createElement('button');
    [modeBtn, fsBtn].forEach(btn => Object.assign(btn.style, {
      padding:'6px 10px', border:'1px solid #888', borderRadius:'6px',
      background:'#fff', cursor:'pointer', font:'12px sans-serif'
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

  // Fキーで全画面（標準UIは壊さない）
  window.addEventListener('keydown', (e) => {
    if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'f' || e.key === 'F')) {
      toggleFS(); e.preventDefault();
    }
  }, true);

  document.addEventListener('DOMContentLoaded', ensureUI);
})();// --- 右下ボタンの見た目とラベルを強制（白地に白文字対策） ---
(() => {
  function restyleButtons() {
    const btns = Array.from(document.querySelectorAll(
      // これまでの複数版に対応
      '#fsToggle, #slideUI button, #slideUI #fsToggle, #slideUI #modeToggle'
    ));
    btns.forEach(b => {
      b.style.background = '#fff';
      b.style.color = '#111'; // ← 文字色を黒に固定
      b.style.border = '1px solid #888';
      b.style.borderRadius = '6px';
      b.style.padding = '6px 10px';
      b.style.font = '14px/1.2 -apple-system,system-ui,"Segoe UI",Roboto,"Noto Sans JP","Hiragino Kaku Gothic ProN","Yu Gothic UI",sans-serif';
      b.style.cursor = 'pointer';
      // ラベルが空なら入れる
      if (!b.textContent.trim()) {
        if (b.id === 'fsToggle') b.textContent = '全画面';
        else b.textContent = 'スライド機能：ON';
      }
    });
  }
  document.addEventListener('DOMContentLoaded', restyleButtons);
  document.addEventListener('pagesloaded', restyleButtons);
  // UIが後から生成されるケースに備えて、短時間だけ再適用
  let t = 0;
  const id = setInterval(() => { restyleButtons(); if (++t > 40) clearInterval(id); }, 100);
})();
