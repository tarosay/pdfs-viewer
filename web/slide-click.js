// web/slide-click.js
(() => {
  /* ---- 以前の全面オーバーレイが残っていたら撤去 ---- */
  const old = document.getElementById('slideClickLayer');
  if (old) old.remove();

  /* ---- 起動前/後の基本設定：単一ページ + page-fit ---- */
  document.addEventListener('webviewerloaded', () => {
    PDFViewerApplicationOptions.set('scrollModeOnLoad', 3);          // 3 = PAGE（1枚表示）
    PDFViewerApplicationOptions.set('defaultZoomValue', 'page-fit'); // 1ページを画面に収める
  });
  document.addEventListener('pagesinit', () => {
    const app = window.PDFViewerApplication;
    if (app?.pdfViewer) {
      const SM = (app.pdfViewer.constructor?.ScrollMode?.PAGE) ?? 3;
      app.pdfViewer.scrollMode = SM;
      app.pdfViewer.currentScaleValue = 'page-fit';
    }
  });

  /* ---- フルスクリーン（Fキー & 右上ボタン） ---- */
  function isFS(){
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  }
  function reqFS(){
    const de = document.documentElement;
    (de.requestFullscreen || de.webkitRequestFullscreen || de.msRequestFullscreen).call(de);
  }
  function exitFS(){
    (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
  }
  function toggleFS(){ isFS() ? exitFS() : reqFS(); }

  // F キーでトグル（キャプチャ段階で先取り）
  window.addEventListener('keydown', (e) => {
    if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'f' || e.key === 'F')) {
      toggleFS();
      e.preventDefault();
    }
  }, true);

  // 右上ボタン（白い四角）を復活
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('fsToggle')) return;
    const btn = document.createElement('button');
    btn.id = 'fsToggle';
    btn.textContent = '全画面';
    Object.assign(btn.style, {
      position:'fixed', top:'10px', right:'10px', zIndex:'2147483647',
      padding:'6px 10px', border:'1px solid #888', borderRadius:'6px',
      background:'#fff', cursor:'pointer', font:'12px sans-serif'
    });
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggleFS(); });
    document.body.appendChild(btn);

    const update = () => { btn.textContent = isFS() ? '全画面終了' : '全画面'; };
    document.addEventListener('fullscreenchange', update);
    document.addEventListener('webkitfullscreenchange', update);
    document.addEventListener('msfullscreenchange', update);
    update();
  });

  /* ---- クリックでページ送り（オーバーレイ不要／ホバー維持） ---- */
  function insideLink(el){
    return el?.closest?.('a[href], .annotationLayer a[href], .linkAnnotation');
  }
  function goto(delta){
    const app = window.PDFViewerApplication;
    if (!app?.pdfViewer) return;
    const p = app.page, max = app.pagesCount || app.pdfViewer.pagesCount || 1;
    const n = Math.max(1, Math.min(p + delta, max));
    if (n !== p) app.pdfViewer.currentPageNumber = n;
  }

  // 画面全体の pointerup をキャプチャで先取り（※リンクは通す／ホバーもそのまま）
  document.addEventListener('pointerup', (e) => {
    // 全画面ボタン上は無視
    if (e.target.closest('#fsToggle')) return;

    // 左クリックのみ・修飾キーなし
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    // リンクの上 → 何もしない（デフォルト動作＆ホバー維持）
    if (insideLink(e.target)) return;

    // テキスト選択中は送らない
    const sel = window.getSelection();
    if (sel && String(sel).length) return;

    // 左半分＝前／右半分＝次
    const right = e.clientX >= (document.documentElement.clientWidth / 2);
    goto(right ? +1 : -1);
    e.preventDefault();
  }, true);
})();
