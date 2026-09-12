/* =============================================================================
 * 携程 eBooking 点评抓取 · 书签小工具（Bookmarklet）源码
 * -----------------------------------------------------------------------------
 * 用法：在携程 eBooking「点评管理」页面点击书签 →
 *       首次使用：点选页面上的一条点评卡片（记住结构）→ 确认导入
 *       之后：一键抓取当前页所有点评 → 自动打开智能体并导入
 *
 * 设计要点
 *   1. 不依赖固定选择器：首次由使用者「点选」一条点评，自动推断同类卡片
 *   2. 抓取结果先预览，确认后才导入，避免把无关内容带进去
 *   3. 通过网址 #import=<压缩数据> 传给智能体；同时把 JSON 放进剪贴板兜底
 *   4. 全程在浏览器本地完成，不经过任何第三方服务器
 * ========================================================================== */
(function () {
  'use strict';

  var TOOL = (typeof window.__HRA_TOOL__ === 'string' && window.__HRA_TOOL__)
    || 'https://1339171078.github.io/hotel-review-agent/';
  var SEL_KEY = '__hra_ctrip_card_selector__';
  var PANEL_ID = '__hra_bookmarklet_panel__';

  /* 重复点击书签时，关闭已有面板并退出 */
  var old = document.getElementById(PANEL_ID);
  if (old) { old.remove(); if (window.__hraPicking) window.__hraPicking(); return; }

  /* ------------------------------------------------------------------ 工具 */
  function txt(el) {
    return ((el && (el.innerText || el.textContent)) || '').replace(/\u00a0/g, ' ').trim();
  }

  /* 由元素推断「同类卡片」选择器：标签 + 较稳定的 class */
  function sig(el) {
    var cls = (el.getAttribute('class') || '').split(/\s+/).filter(function (c) {
      return c && c.length < 40 && !/^(active|hover|on|selected|cur|current|ng-\w+|css-[\w-]+|jsx-\d+)$/.test(c);
    });
    var s = el.tagName.toLowerCase();
    if (cls.length) s += '.' + cls.slice(0, 3).join('.');
    return s;
  }

  /* 找到与指定元素同类型的全部卡片 */
  function findCards(selector) {
    var list = [];
    try { list = Array.prototype.slice.call(document.querySelectorAll(selector)); } catch (e) { list = []; }
    /* 只保留“像一条点评”的：有可见文本且长度合理 */
    list = list.filter(function (el) {
      var t = txt(el);
      return t.length >= 15 && t.length <= 3000 && el.offsetParent !== null;
    });
    /* 去掉包含其它候选的父节点，避免一条点评被算多次 */
    return list.filter(function (el) {
      return !list.some(function (other) { return other !== el && el.contains(other); });
    });
  }

  /* 自动猜测选择器（没有点选记录时用） */
  function autoDetect() {
    var keys = ['comment', 'review', 'evaluate', 'feedback', 'pj-', 'dianping', 'assess'];
    var best = null;
    keys.forEach(function (k) {
      var sel = '[class*="' + k + '"]';
      var cards = findCards(sel);
      if (cards.length && (!best || cards.length > best.cards.length)) best = { sel: sel, cards: cards };
    });
    return best;
  }

  /* ------------------------------------------------- 从卡片解析一条点评字段 */
  function parseCard(el) {
    var raw = txt(el);
    /* 商家回复之后的内容不属于顾客点评，截断 */
    var cut = raw.search(/商家回复|酒店回复|商家答复|回复[:：]/);
    if (cut > 10) raw = raw.slice(0, cut);
    var lines = raw.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);

    /* 评分：优先 “x.x分”，其次星级元素，最后取 1~5 的独立数字 */
    var rating = null, m;
    m = raw.match(/([1-5](?:\.\d)?)\s*分/);
    if (m) rating = parseFloat(m[1]);
    if (rating === null) {
      var star = el.querySelector('[class*="star" i],[class*="score" i],[class*="grade" i],[aria-label*="分"]');
      if (star) {
        var st = txt(star) || star.getAttribute('aria-label') || '';
        m = st.match(/([1-5](?:\.\d)?)/);
        if (m) rating = parseFloat(m[1]);
        if (rating === null) {
          var on = star.querySelectorAll('[class*="on" i],[class*="full" i],[class*="active" i]');
          if (on.length >= 1 && on.length <= 5) rating = on.length;
        }
      }
    }
    if (rating === null) { m = raw.match(/(?:^|\s)([1-5](?:\.\d)?)(?:\s|$)/); if (m) rating = parseFloat(m[1]); }
    if (!(rating >= 1 && rating <= 5)) rating = null;

    /* 日期 */
    var date = '', d = raw.match(/(20\d{2})\s*[-\/年.]\s*(\d{1,2})\s*[-\/月.]\s*(\d{1,2})/);
    if (d) date = d[1] + '-' + ('0' + d[2]).slice(-2) + '-' + ('0' + d[3]).slice(-2);

    /* 房型 */
    var room = '';
    for (var i = 0; i < lines.length; i++) {
      if (/房型|入住房型|预订房型/.test(lines[i]) && lines[i].length < 40) {
        room = lines[i].replace(/^[^:：]*[:：]\s*/, ''); break;
      }
    }

    /* 昵称：靠前、短、不含元信息 */
    var guest = '';
    for (var j = 0; j < Math.min(lines.length, 5); j++) {
      var L = lines[j];
      if (L.length <= 14 && !/[0-9]|分|星|房|点评|回复|赞|来自|预订/.test(L)) { guest = L; break; }
    }

    /* 正文：剔除元信息后的其余内容 */
    var meta = [guest, room];
    var body = lines.filter(function (L) {
      if (meta.indexOf(L) >= 0) return false;
      if (/^[\s★☆✦✩⭐0-9.分]+$/.test(L)) return false;                 // 纯星级 / 纯分数行
      if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(L)) return false;      // 纯日期行
      if (/^(点评|赞|回复|有用|来自|入住|共\d+条)/.test(L) && L.length < 20) return false;
      return true;
    }).join('\n')
      .replace(/[★☆✦✩⭐]/g, '')                                        // 去掉行内星级符号
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    if (!body) body = raw;
    return { rating: rating, date: date, room: room, guest: guest, text: body.slice(0, 1200) };
  }

  /* ------------------------------------------------------ 打包并传给智能体 */
  function b64url(bytes) {
    var bin = '', CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function utf8(str) {
    if (typeof TextEncoder === 'function') return new TextEncoder().encode(str);
    var s = unescape(encodeURIComponent(str)), out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  function encodePayload(obj) {
    var json = JSON.stringify(obj);
    if (typeof CompressionStream === 'function' && typeof Blob === 'function') {
      try {
        var cs = new CompressionStream('deflate-raw');
        var stream = new Blob([utf8(json)]).stream().pipeThrough(cs);
        return new Response(stream).arrayBuffer().then(function (buf) {
          return 'z' + b64url(new Uint8Array(buf));
        });
      } catch (e) { /* 回退 */ }
    }
    return Promise.resolve('u' + b64url(utf8(json)));
  }

  function deliver(items) {
    var payload = { v: 1, src: '携程 eBooking', at: Date.now(), url: location.href, items: items };
    var json = JSON.stringify(payload, null, 2);
    try { navigator.clipboard && navigator.clipboard.writeText(json); } catch (e) { }
    return encodePayload(payload).then(function (code) {
      var url = TOOL + (TOOL.indexOf('#') < 0 ? '' : '') + '#import=' + code;
      if (url.length < 180000) { window.open(url, '_blank'); return 'link'; }
      return 'clipboard';
    });
  }

  /* ------------------------------------------------------------------ 面板 */
  var cards = [], selector = '', picking = false;

  function close() {
    var p = document.getElementById(PANEL_ID);
    if (p) p.remove();
    document.removeEventListener('click', onClickCapture);
    if (window.__hraPicking) window.__hraPicking();
  }

  function onClickCapture(ev) {
    if (!picking) return;
    var p = document.getElementById(PANEL_ID);
    if (p && p.contains(ev.target)) return;
    ev.preventDefault(); ev.stopPropagation();
    var el = ev.target;
    while (el && el.parentElement && txt(el).length < 15) el = el.parentElement;
    selector = sig(el);
    try { localStorage.setItem(SEL_KEY, selector); } catch (e) { }
    picking = false;
    if (window.__hraPicking) window.__hraPicking();
    refresh();
  }

  function startPick() {
    picking = true;
    if (window.__hraRestore) window.__hraRestore();
    document.addEventListener('click', onClickCapture, true);
    render('👉 请点击页面上的<b>任意一条点评卡片</b>（点一下即可）');
  }

  function refresh() {
    if (!selector) {
      var det = autoDetect();
      if (det) { selector = det.sel; cards = det.cards; }
      else { cards = []; }
    } else {
      cards = findCards(selector);
    }
    render();
  }

  function render(override) {
    var p = document.getElementById(PANEL_ID);
    if (!p) {
      p = document.createElement('div');
      p.id = PANEL_ID;
      p.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483647;width:340px;' +
        'font:13px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;' +
        'background:#fff;color:#101a33;border:1px solid #dfe7f5;border-radius:14px;' +
        'box-shadow:0 18px 44px rgba(16,26,51,.24);padding:14px';
      document.body.appendChild(p);
    }
    var list = cards.slice(0, 3).map(function (el) {
      var r = parseCard(el);
      var t = r.text.replace(/\n/g, ' ').slice(0, 46);
      return '<div style="border:1px solid #eef2f9;border-radius:9px;padding:7px 9px;margin-bottom:6px;background:#fbfcff">' +
        '<div style="font-size:11px;color:#6b7891">' + (r.rating ? r.rating + ' 分' : '评分未识别') +
        (r.date ? ' · ' + r.date : '') + (r.guest ? ' · ' + esc(r.guest) : '') + '</div>' +
        '<div style="margin-top:3px">' + esc(t) + (r.text.length > 46 ? '…' : '') + '</div></div>';
    }).join('');

    p.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;font-weight:700;margin-bottom:10px">' +
      '<span style="width:26px;height:26px;border-radius:8px;background:linear-gradient(120deg,#2563eb,#8b5cf6);' +
      'display:grid;place-items:center;color:#fff;font-size:13px">携</span>携程点评抓取' +
      '<span style="margin-left:auto;cursor:pointer;color:#6b7891" id="__hra_x">✕</span></div>' +
      (override ? '<div style="background:#fff8e8;border:1px solid #fcd97a;color:#b45309;border-radius:9px;' +
        'padding:8px 10px;margin-bottom:9px">' + override + '</div>' : '') +
      '<div style="color:#465574;margin-bottom:9px">识别到 <b style="color:#1d4ed8">' + cards.length + '</b> 条点评' +
      (selector ? '　<span style="color:#6b7891;font-size:11px">选择器 ' + esc(selector) + '</span>' : '') + '</div>' +
      (list || '<div style="color:#6b7891;padding:6px 0">没有识别到点评，请用「点选方式」指定一条点评卡片。</div>') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">' +
      '<button id="__hra_go" style="flex:1;min-width:120px;cursor:pointer;border:0;border-radius:9px;padding:9px 12px;' +
      'font:inherit;font-weight:700;color:#fff;background:linear-gradient(120deg,#2563eb,#4f46e5)">导入到智能体</button>' +
      '<button id="__hra_pick" style="cursor:pointer;border:1px solid #cdd7e6;background:#fff;border-radius:9px;' +
      'padding:9px 11px;font:inherit;color:#465574">点选方式</button>' +
      '<button id="__hra_copy" style="cursor:pointer;border:1px solid #cdd7e6;background:#fff;border-radius:9px;' +
      'padding:9px 11px;font:inherit;color:#465574">复制 JSON</button>' +
      '</div>' +
      '<div style="color:#8593ad;font-size:11px;margin-top:8px">数据只在本机浏览器处理，不会上传到任何服务器。</div>';

    p.querySelector('#__hra_x').onclick = close;
    p.querySelector('#__hra_pick').onclick = startPick;
    p.querySelector('#__hra_copy').onclick = function () {
      var items = cards.map(parseCard).filter(function (r) { return r.text; });
      try { navigator.clipboard.writeText(JSON.stringify({ v: 1, src: '携程 eBooking', items: items }, null, 2)); } catch (e) { }
      alert('已复制 ' + items.length + ' 条点评 JSON，可粘贴到智能体的「粘贴导入」框。');
    };
    p.querySelector('#__hra_go').onclick = function () {
      var items = cards.map(parseCard).filter(function (r) { return r.text && r.text.length >= 2; });
      if (!items.length) { alert('没有可导入的点评'); return; }
      var btn = this; btn.textContent = '正在打包…'; btn.disabled = true;
      deliver(items).then(function (how) {
        btn.textContent = how === 'link' ? '已打开智能体 ✓' : '已复制，请粘贴 ✓';
        setTimeout(close, 900);
      })['catch'](function () {
        btn.textContent = '导入失败，请用复制 JSON';
        btn.disabled = false;
      });
    };
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ------------------------------------------------------------------ 启动 */
  try { selector = localStorage.getItem(SEL_KEY) || ''; } catch (e) { selector = ''; }
  refresh();
  if (!cards.length) startPick();

  /* 供自动化测试使用（正常使用时不生效） */
  if (window.__HRA_TEST__) {
    window.__hraTest = { parseCard: parseCard, sig: sig, findCards: findCards,
      autoDetect: autoDetect, encodePayload: encodePayload, getCards: function () { return cards; } };
  }
})();
