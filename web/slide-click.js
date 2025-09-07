// web/slide-click.js（完成版）
(() => {
  /* ---- 起動前/後の基本設定：単一ページ＋page-fit ---- */
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
  function isFS() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  }
  function reqFS() {
    const de = document.documentElement;
    (de.requestFullscreen || de.webkitRequestFullscreen || de.msRequestFullscreen).call(de);
  }
  function exitFS() {
    (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
  }
  function toggleFS() { isFS() ? exitFS() : reqFS(); }

  // F キーでトグル（キャプチャ段階で先取り）
  window.addEventListener('keydown', (e) => {
    if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'f' || e.key === 'F')) {
      toggleFS();
      e.preventDefault();
    }
  }, true);

  // 右上ボタン（白い四角）
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('fsToggle')) return;
    const btn = document.createElement('button');
    btn.id = 'fsToggle';
    btn.textContent = '全画面';
    Object.assign(btn.style, {
      position: 'fixed', top: '10px', right: '10px', zIndex: '2147483647',
      padding: '6px 10px', border: '1px solid #888', borderRadius: '6px',
      background: '#fff', cursor: 'pointer', font: '12px sans-serif'
    });
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggleFS(); });
    document.body.appendChild(btn);

    const update = () => { btn.textContent = isFS() ? '全画面終了' : '全画面'; };
    document.addEventListener('fullscreenchange', update);
    document.addEventListener('webkitfullscreenchange', update);
    document.addEventListener('msfullscreenchange', update);
    update();
  });

  /* ---- クリックでページ送り（ホバーやリンクはそのまま） ---- */
  function insideLink(el) {
    return el?.closest?.('a[href], .annotationLayer a[href], .linkAnnotation');
  }
  function goto(delta) {
    const app = window.PDFViewerApplication;
    if (!app?.pdfViewer) return;
    const p = app.page, max = app.pagesCount || app.pdfViewer.pagesCount || 1;
    const n = Math.max(1, Math.min(p + delta, max));
    if (n !== p) app.pdfViewer.currentPageNumber = n;
  }

  // 画面全体の pointerup をキャプチャで先取り（リンク・ボタン上はスルー）
  document.addEventListener('pointerup', (e) => {
    if (e.target.closest('#fsToggle')) return; // 全画面ボタン上
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; // 左クリックのみ
    if (insideLink(e.target)) return; // リンクは既定動作を優先（ホバーも生きる）
    const sel = window.getSelection();
    if (sel && String(sel).length) return; // テキスト選択中は送らない

    const right = e.clientX >= (document.documentElement.clientWidth / 2);
    goto(right ? +1 : -1);
    e.preventDefault();
  }, true);

  /* ---- 外部リンクは必ず“別タブ”で開く（内部リンクはそのまま） ---- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href], .annotationLayer a[href], .linkAnnotation');
    if (!a) return;

    const hrefAttr = a.getAttribute('href') || '';
    const isInternal = a.classList?.contains('internalLink') || hrefAttr.startsWith('#');
    const isExternal = !isInternal && (
      /^https?:\/\//i.test(hrefAttr) ||
      a.classList?.contains('externalLink') ||
      (a.href && a.href.startsWith('http'))
    );

    if (isExternal) {
      const url = a.href || hrefAttr;
      window.open(url, '_blank', 'noopener');
      e.preventDefault();   // 現タブ遷移を止める
      e.stopPropagation();  // 後段の処理に渡さない
    }
  }, true);
})();

// --- フルスクリーン時は余白ゼロ（cover）、通常時はpage-fit（contain） ---
(() => {
  // フルスクリーン用の見た目最適化（ツールバー等を隠し、表示領域をフル化）
  const st = document.createElement('style');
  st.id = 'slideCoverSkin';
  st.textContent = `
    body.fs #sidebarContainer, body.fs .toolbar, body.fs .secondaryToolbar { display: none !important; }
    body.fs #viewerContainer { top:0 !important; left:0 !important; width:100vw !important; height:100vh !important; overflow:hidden !important; background:#000 !important; }
    body.fs #viewer .page { margin:0 auto !important; box-shadow:none !important; }
  `;
  document.head.appendChild(st);

  function isFS() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  }

  function coverScale() {
    const app = window.PDFViewerApplication;
    const vc = document.getElementById('viewerContainer');
    if (!app?.pdfViewer || !vc) return;

    // 現在ページの「素のサイズ」（scale=1相当）を取得
    const pv = app.pdfViewer.getPageView(Math.max(0, app.page - 1));
    if (!pv || !pv.viewport || !pv.scale) return;
    const baseW = pv.viewport.width / pv.scale;
    const baseH = pv.viewport.height / pv.scale;

    const vw = vc.clientWidth, vh = vc.clientHeight;
    const scale = Math.max(vw / baseW, vh / baseH); // ← cover（余白ゼロ）
    app.pdfViewer.currentScale = scale;
  }

  function containScale() {
    const app = window.PDFViewerApplication;
    if (app?.pdfViewer) app.pdfViewer.currentScaleValue = 'page-fit'; // ← contain（余白あり）
  }

  function applyFSMode() {
    const fs = isFS();
    document.body.classList.toggle('fs', fs);
    fs ? coverScale() : containScale();
  }

  // フルスクリーンの出入り／リサイズ／ページ切替でリスケール
  document.addEventListener('fullscreenchange', applyFSMode);
  document.addEventListener('webkitfullscreenchange', applyFSMode);
  document.addEventListener('msfullscreenchange', applyFSMode);
  window.addEventListener('resize', () => { if (isFS()) coverScale(); });

  // 初期化後やページ切替でも、FS中なら再計算
  document.addEventListener('pagesinit', () => { if (isFS()) setTimeout(coverScale, 0); });
  document.addEventListener('pagechanging', () => { if (isFS()) setTimeout(coverScale, 0); });
})();

