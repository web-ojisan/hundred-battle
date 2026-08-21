// ===== 共通「一時停止」UI =====
// 各ゲームの </body> 直前で <script src="../pause-ui.js"></script> するだけで、
// 画面の対角2箇所（右上・左下）に控えめな⏸ボタンが出て、タップすると
// 「つづける／ゲームせんたくへもどる」の確認オーバーレイが開く。
//
// - 誤操作防止のため、⏸ボタン自体をタップしても即終了はしない（確認オーバーレイが開くだけ）
// - ゲーム側のタイマー・ラウンド進行は止めない簡易実装（オーバーレイが全画面を覆って入力だけブロックする）
// - ゲーム側が touchstart/touchmove/touchend を document で全面 preventDefault していても
//   （3色STGなど）確実に反応するよう、click ではなく pointerdown で処理する
// - タブレットを机に置いて対面で囲むゲームがあるため、ボタンは対角2箇所に配置。
//   左下側は180度回転させ、対面から見ても正しい向きで読めるようにしている
//
// カスタムの呼び出し口を使いたいゲーム（例：誰も触らない中央のバトルバーをタップで開く）は、
// このスクリプトを読み込む前に以下のように設定すると、右上・左下の⏸ボタンの代わりにそちらを使う：
//   <script>window.PAUSE_UI_CONFIG = { trigger: '#battleBar' };</script>
//   <script src="../pause-ui.js"></script>
(function () {
  function init() {
    var style = document.createElement('style');
    style.textContent =
      '.pauseBtn{' +
        'position:fixed;z-index:2147483000;' +
        'width:36px;height:36px;border-radius:50%;' +
        'background:rgba(10,13,25,.55);border:1.5px solid rgba(255,255,255,.28);' +
        'color:rgba(255,255,255,.8);font-size:16px;line-height:1;' +
        'display:flex;align-items:center;justify-content:center;' +
        'cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;' +
      '}' +
      '#pauseBtnTR{top:6px;right:6px;}' +
      '#pauseBtnBL{bottom:6px;left:6px;transform:rotate(180deg);}' +
      '#pauseOverlay{' +
        'position:fixed;inset:0;z-index:2147483001;' +
        'background:rgba(6,8,16,.88);' +
        'display:none;align-items:center;justify-content:center;' +
      '}' +
      '#pauseOverlay.show{display:flex;}' +
      '#pauseOverlay .pausePanel{' +
        'background:#141930;border:2px solid #FFD34D;border-radius:20px;' +
        'padding:30px 34px;min-width:230px;text-align:center;' +
        'font-family:"M PLUS Rounded 1c",-apple-system,"Hiragino Kaku Gothic ProN",sans-serif;' +
        'color:#EDF1FF;' +
      '}' +
      '#pauseOverlay h2{font-size:18px;margin:0 0 20px;letter-spacing:.05em;font-weight:800;}' +
      '#pauseOverlay button{' +
        'display:block;width:100%;margin:10px 0 0;padding:14px;' +
        'border-radius:12px;border:none;font-size:15px;font-weight:800;' +
        'cursor:pointer;-webkit-tap-highlight-color:transparent;font-family:inherit;' +
      '}' +
      '#pauseResumeBtn{background:#FFD34D;color:#3a2a00;}' +
      '#pauseExitBtn{background:#2b3252;color:#EDF1FF;border:1.5px solid #4DA3FF;}';
    document.head.appendChild(style);

    var cfg = window.PAUSE_UI_CONFIG || {};
    var customTrigger = cfg.trigger
      ? (typeof cfg.trigger === 'string' ? document.querySelector(cfg.trigger) : cfg.trigger)
      : null;

    if (!customTrigger) {
      var btnTR = document.createElement('div');
      btnTR.id = 'pauseBtnTR'; btnTR.className = 'pauseBtn';
      btnTR.textContent = '⏸';
      document.body.appendChild(btnTR);

      // 対面（テーブルの向かい側）からも押せるよう、180度回転させた分身を左下にも配置
      var btnBL = document.createElement('div');
      btnBL.id = 'pauseBtnBL'; btnBL.className = 'pauseBtn';
      btnBL.textContent = '⏸';
      document.body.appendChild(btnBL);
    }

    var overlay = document.createElement('div');
    overlay.id = 'pauseOverlay';
    overlay.innerHTML =
      '<div class="pausePanel">' +
        '<h2>いちじ停止中</h2>' +
        '<button id="pauseResumeBtn" type="button">▶ つづける</button>' +
        '<button id="pauseExitBtn" type="button">🏠 ゲームせんたくへ</button>' +
      '</div>';
    document.body.appendChild(overlay);

    function openPause(e) { if (e) { e.preventDefault(); e.stopPropagation(); } overlay.classList.add('show'); }
    function closePause(e) { if (e) { e.preventDefault(); e.stopPropagation(); } overlay.classList.remove('show'); }
    function exitToMenu(e) { if (e) { e.preventDefault(); e.stopPropagation(); } location.href = '../index.html'; }

    if (customTrigger) {
      customTrigger.addEventListener('pointerdown', openPause);
    } else {
      btnTR.addEventListener('pointerdown', openPause);
      btnBL.addEventListener('pointerdown', openPause);
    }
    overlay.addEventListener('pointerdown', function (e) {
      if (e.target === overlay) closePause(e); // 背景タップでも閉じる
    });
    document.getElementById('pauseResumeBtn').addEventListener('pointerdown', closePause);
    document.getElementById('pauseExitBtn').addEventListener('pointerdown', exitToMenu);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
