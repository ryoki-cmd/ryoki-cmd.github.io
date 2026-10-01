/* 寸法アシスタント（/sunpo/）。外部ライブラリなし。products.json を同じフォルダから読む。
   流れ：場所を選ぶ → その場所に合う種類だけに絞る → 寸法で判定する。 */
(function () {
  "use strict";
  var root = document.getElementById("sunpo");
  if (!root) return;

  var FRONT_TYPES = ["drawer_case", "chest_multi", "file_box", "inner_box", "gap_rack", "kitchen_wagon", "ext_rack", "media", "desk_wagon", "toilet_rack", "shoe_rack"];
  var BOXY_TYPES = ["drawer_case", "chest_multi", "file_box", "inner_box", "basket", "lid_box", "soft", "under_bed", "media", "small_case", "fridge_case"];
  var SHOP_LABEL = { rakuten: "楽天市場で見る", yahoo: "Yahoo!ショッピングで見る", amazon: "Amazonで見る" };
  var ICON = {
    drawer: '<rect x="6" y="8" width="32" height="28" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 22h32M18 15h8M18 29h8" stroke="currentColor" stroke-width="2"/>',
    chest: '<rect x="8" y="4" width="28" height="36" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 13h28M8 22h28M8 31h28M19 8.5h6M19 17.5h6M19 26.5h6M19 35.5h6" stroke="currentColor" stroke-width="2"/>',
    file: '<path d="M10 8h14l10 12v18H10z" fill="none" stroke="currentColor" stroke-width="2"/>',
    tray: '<rect x="4" y="18" width="36" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 18v12M28 18v12" stroke="currentColor" stroke-width="2"/>',
    inner_box: '<rect x="6" y="10" width="32" height="26" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="17" y="14" width="10" height="4" rx="2" fill="currentColor"/>',
    basket: '<path d="M6 14h32l-3 22H9z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 14v22M22 14v22M30 14v22" stroke="currentColor" stroke-width="1.2"/>',
    lid_box: '<rect x="7" y="14" width="30" height="22" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="5" y="9" width="34" height="6" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>',
    fridge: '<rect x="10" y="4" width="24" height="36" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 17h24M14 10v4M14 22v6" stroke="currentColor" stroke-width="2"/>',
    sink_rack: '<path d="M6 12v26M38 12v26M6 20h32M6 30h32" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 20v-4M28 20v-4" stroke="currentColor" stroke-width="2"/>',
    gap_wagon: '<rect x="15" y="4" width="14" height="32" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 14h14M15 25h14" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="39" r="2" fill="currentColor"/><circle cx="26" cy="39" r="2" fill="currentColor"/>',
    hanger: '<path d="M8 8h28M10 8v30M34 8v30M22 12l-9 7h18z" fill="none" stroke="currentColor" stroke-width="2"/>',
    under_bed: '<rect x="4" y="22" width="36" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="37" r="2" fill="currentColor"/><circle cx="35" cy="37" r="2" fill="currentColor"/>',
    soft: '<path d="M8 14q14-6 28 0v22H8z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 22h12" stroke="currentColor" stroke-width="2"/>',
    media: '<path d="M8 10h6v28H8zM16 10h6v28h-6zM25 12l6-2 6 26-6 2z" fill="none" stroke="currentColor" stroke-width="2"/>',
    container: '<rect x="4" y="14" width="36" height="22" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 20h36M14 14v-3h16v3" stroke="currentColor" stroke-width="2"/>',
    tension: '<path d="M22 4v36M14 4h16M14 40h16M8 16h28M8 28h28" fill="none" stroke="currentColor" stroke-width="2"/>',
    magnet: '<path d="M12 8v14a10 10 0 0 0 20 0V8h-7v14a3 3 0 0 1-6 0V8z" fill="none" stroke="currentColor" stroke-width="2"/>',
    shoe: '<path d="M6 30h32v6H6zM8 30c2-8 8-10 14-10l6 10" fill="none" stroke="currentColor" stroke-width="2"/>',
    toilet: '<path d="M12 6h14v12H12zM8 20h24a6 6 0 0 1-6 10H14a6 6 0 0 1-6-10zM16 30v8h10v-8" fill="none" stroke="currentColor" stroke-width="2"/>',
    furniture: '<rect x="8" y="4" width="28" height="36" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 16h28M8 28h28" stroke="currentColor" stroke-width="2"/>'
  };

  // 新しい種類の線画は、形の近い既存の線画を使う
  var ICON_ALIAS = { drawer_case: "drawer", chest_multi: "chest", file_box: "file", small_case: "tray", ext_rack: "sink_rack",
    u_rack: "sink_rack", gap_rack: "gap_wagon", kitchen_wagon: "gap_wagon", hanger_rack: "hanger", fridge_case: "fridge",
    door_pocket: "fridge", desk_wagon: "drawer", steel_rack: "furniture", laundry_rack: "tension", tension_shelf: "tension",
    magnet: "magnet", shoe_rack: "shoe", toilet_rack: "toilet" };
  var S = { room: "kitchen", place: "sink", variant: "sink-door", type: "all", w: NaN, d: NaN, h: NaN, example: false, m: 0.5, rot: true, sort: "fit", view: "front", traps: {}, amt: {}, pipePos: NaN, mstep: "intro" };
  var DATA = { items: [], rooms: [], types: [], unreadable: 0 };
  var PREP = {}; // 商品がそろっていない場所・形の違い（「準備中」）
  function track(ev, data) {
    if (typeof window.SUNPO_TRACK !== "function") return;
    try { window.SUNPO_TRACK(ev, data || {}); } catch (e) { /* 計測の失敗で画面を止めない */ }
  }
  var trackState = { started: false, doneKey: "", shownKey: "", timer: 0 };
  // 「入りましたか？」の送り先。#sunpo の data-feedback か window.SUNPO_FEEDBACK_URL にあるときだけボタンを出す
  var FEEDBACK = root.getAttribute("data-feedback") || window.SUNPO_FEEDBACK_URL || "";
  var TYPE_NAME = {};
  // 携帯（860px以下）は、入口 → 場所 → 寸法 → 候補 を1画面ずつ進める
  var MOBILE = window.matchMedia ? window.matchMedia("(max-width: 860px)") : { matches: false };
  var WIZ = function () { return !!MOBILE.matches; };

  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, ""); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var ymd = function (iso) { return iso ? String(iso).slice(0, 10).replace(/-/g, "/") : ""; };
  var num = function (v) {
    var t = String(v).replace(/[０-９．]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); });
    var n = parseFloat(t.replace(/[^\d.]/g, ""));
    return isFinite(n) ? n : NaN;
  };
  var each = function (sel, fn) { Array.prototype.forEach.call(root.querySelectorAll(sel), fn); };
  var TYPE_IMG = {};
  var svgIcon = function (t) { return '<svg viewBox="0 0 44 44" aria-hidden="true">' + (ICON[t] || ICON[ICON_ALIAS[t]] || ICON.basket) + "</svg>"; };
  // 「・」「の」の後と「（」の前だけで折り返す。後ろに1文字しか残らないところ（「家電の上」の「上」）では折らない
  var wrapLabel = function (t) { return esc(t).replace(/(・|の)(?=[^（]{2,})/g, "$1<wbr>").replace(/（/g, "<wbr>（"); };
  var icon = function (t) {
    return TYPE_IMG[t] ? '<img src="' + esc(TYPE_IMG[t]) + '" alt="" loading="lazy" decoding="async" data-t="' + t + '">' : svgIcon(t);
  };
  // 絵が読めなかったときは線画に差し替える
  root.addEventListener("error", function (e) {
    var el = e.target;
    if (el && el.tagName === "IMG" && el.dataset.guide) {
      el.outerHTML = '<svg viewBox="0 0 300 180" role="img" aria-label="測り方の図">' + GUIDE_SVG[el.dataset.guide] + "</svg>";
      return;
    }
    if (!el || el.tagName !== "IMG" || !el.dataset.t) return;
    if (el.dataset.photo) {
      var a = el.parentNode;
      el.remove();
      var tag = a.querySelector(".sunpo-typetag");
      if (tag) tag.className = "sunpo-typetag sp-full";
    } else el.outerHTML = svgIcon(el.dataset.t);
  }, true);

  function findRoom(id) { return DATA.rooms.filter(function (r) { return r.id === id; })[0]; }
  function findPlace(id) {
    var hit = null;
    DATA.rooms.forEach(function (r) { r.places.forEach(function (p) { if (p.id === id) hit = { room: r, place: p }; }); });
    return hit;
  }
  function currentPlace() { var f = S.place && findPlace(S.place); return f ? f.place : null; }
  function allowedTypes() {
    var p = currentPlace();
    var base = p ? p.types : DATA.types.map(function (t) { return t.id; });
    return S.type === "all" ? base : base.filter(function (t) { return t === S.type; });
  }

  // ---- 場所の選択（部屋 → 場所 → 形の違い） ----
  function renderRooms() {
    var html = DATA.rooms.map(function (r) {
      return '<button type="button" role="tab" class="sunpo-room" data-r="' + r.id + '" aria-selected="' + (r.id === S.room) + '"><span class="sp-long">' + wrapLabel(r.name) + '</span><span class="sp-short">' + esc(r.short || r.name) + "</span></button>";
    }).join("") + '<button type="button" role="tab" class="sunpo-room" data-r="none" aria-selected="' + (S.room === "none") + '"><span class="sp-long">場所を<wbr>選ばない</span><span class="sp-short">指定なし</span></button>';
    $("sunpoRooms").innerHTML = html;
    each(".sunpo-room", function (b) {
      b.addEventListener("click", function () {
        S.room = b.dataset.r; S.type = "all";
        if (S.room === "none") { S.place = null; S.variant = null; }
        else { var p = findRoom(S.room).places.filter(function (x) { return !PREP[x.id]; })[0] || findRoom(S.room).places[0]; pickPlace(p); }
        renderRooms(); renderPlaces(); syncInputs(); render();
      });
    });
  }
  function pickPlace(p) {
    var v = p.variants.filter(function (x) { return !PREP[x.id]; })[0] || p.variants[0];
    S.place = p.id; S.variant = v.id;
    if (S.example) { S.w = v.w; S.d = v.d; S.h = v.h; }
    resetTraps();
  }
  function activeTraps() {
    var p = currentPlace();
    if (!p || !p.traps) return [];
    return p.traps.filter(function (t) { return !t.variants || t.variants.indexOf(S.variant) >= 0; });
  }
  function resetTraps() {
    S.traps = {}; S.amt = {}; S.pipePos = NaN;
    activeTraps().forEach(function (t) { if (t.default) S.traps[t.id] = true; });
  }
  // 判定に使う寸法（落とし穴の分を引く。排水管は左右に分ける）
  // 排水管をまたげるのは、伸縮の範囲（w_range）が分かっているシンク下ラックだけ。幅20〜27cmのスライドラックはまたげない
  function straddles(p) {
    return !!p && p.type === "ext_rack" && (!!p.w_range || (/伸縮|スライド/.test(p.name) && p.w >= 40));
  }
  function amount(t) { var v = S.amt[t.id]; return isFinite(v) && v >= 0 ? v : t.amount; }
  function eff(p) {
    var total = S.w, d = S.d, notes = [], straddle = false, pipe = null;
    activeTraps().forEach(function (t) {
      if (!S.traps[t.id]) return;
      var a = amount(t);
      if (t.split) { pipe = { t: t, a: a }; return; }
      if (t.dw) { total -= a; notes.push("横幅−" + fmt(a) + "cm"); }
      if (t.dd) { d -= a; notes.push("奥行−" + fmt(a) + "cm"); }
    });
    var ws = [total], pipeX = null;
    if (pipe && straddles(p)) { straddle = true; notes.push("排水管をまたいで置く"); }
    else if (pipe) {
      var center = isFinite(S.pipePos) && S.pipePos > 0 && S.pipePos < S.w ? S.pipePos : S.w / 2;
      var left = Math.max(0, center - pipe.a / 2 - (S.w - total) / 2), right = Math.max(0, total - left - pipe.a);
      ws = [left, right]; pipeX = { center: center, width: pipe.a };
      notes.push("排水管（" + fmt(pipe.a) + "cm）の左" + fmt(left) + "cm・右" + fmt(right) + "cmで判定");
    }
    var w = Math.max.apply(null, ws);
    return { w: w, ws: ws, d: d, h: S.h, zones: ws.length, notes: notes, changed: notes.length > 0, straddle: straddle, pipe: pipeX };
  }
  function renderTraps() {
    var list = activeTraps(), box = $("sunpoTraps");
    if (!list.length) { box.hidden = true; return; }
    box.hidden = false;
    $("sunpoTrapList").innerHTML = list.map(function (t) {
      var on = !!S.traps[t.id];
      var extra = on ? '<span class="sunpo-trapamt"><label>' + esc(t.unit) + ' <input inputmode="decimal" data-amt="' + t.id + '" value="' + fmt(amount(t)) + '" aria-label="' + esc(t.label + "の量") + '">cm</label>' +
        (t.split ? '<label>管の位置（左端から） <input inputmode="decimal" data-pipepos="1" placeholder="中央" value="' + (isFinite(S.pipePos) ? fmt(S.pipePos) : "") + '" aria-label="排水管の位置">cm</label>' : "") + "</span>" : "";
      return '<div class="sunpo-trap"><label class="sunpo-trapmain"><input type="checkbox" data-trap="' + t.id + '"' + (on ? " checked" : "") + ">" +
        "<span><b>" + esc(t.label) + "</b><small>" + esc(t.note) + "</small></span></label>" + extra + "</div>";
    }).join("");
    each("#sunpoTrapList input[data-trap]", function (c) {
      c.addEventListener("change", function () { S.traps[c.dataset.trap] = c.checked; renderTraps(); render(); });
    });
    each("#sunpoTrapList input[data-amt]", function (c) {
      c.addEventListener("input", function () { S.amt[c.dataset.amt] = num(c.value); render(); });
    });
    each("#sunpoTrapList input[data-pipepos]", function (c) {
      c.addEventListener("input", function () { S.pipePos = num(c.value); render(); });
    });
  }
  // ---- 採寸ガイド：空間タイプ（A 箱の中／B すき間／C 上の空間／D 床置き）ごとの図と、場所ごとの注意 ----
  var ARROW = ' stroke="var(--accent-ink)" stroke-width="1.6" marker-start="url(#spA)" marker-end="url(#spA)"';
  var GUIDE_DEFS = '<defs><marker id="spA" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
    '<path d="M0 0L8 4L0 8z" fill="var(--accent-ink)"/></marker></defs>';
  var LBL = function (x, y, t, a) { return '<text x="' + x + '" y="' + y + '" font-size="11" fill="var(--accent-ink)" text-anchor="' + (a || "middle") + '" font-family="Noto Sans JP,sans-serif">' + t + "</text>"; };
  var GUIDE_SVG = {
    A: GUIDE_DEFS +
      '<rect x="40" y="20" width="200" height="130" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5"/>' +
      '<rect x="40" y="20" width="200" height="16" fill="var(--sp-grid)" stroke="var(--sub)" stroke-dasharray="3 2"/>' + LBL(140, 32, "上の出っぱり（シンクの底など）") +
      '<rect x="40" y="40" width="7" height="22" fill="var(--sub)"/><rect x="233" y="40" width="7" height="22" fill="var(--sub)"/>' +
      '<line x1="49" y1="75" x2="231" y2="75"' + ARROW + "/>" + LBL(140, 70, "横幅：蝶番の内側どうし") +
      '<line x1="258" y1="38" x2="258" y2="150"' + ARROW + "/>" + LBL(262, 98, "高さ", "start") +
      '<line x1="60" y1="150" x2="95" y2="112"' + ARROW + "/>" + LBL(100, 118, "奥行：奥の壁か管まで", "start"),
    B: GUIDE_DEFS +
      '<rect x="30" y="20" width="80" height="140" fill="var(--sp-grid)" stroke="var(--sub)"/>' + LBL(70, 95, "壁・家具") +
      '<rect x="170" y="30" width="90" height="130" fill="var(--sp-grid)" stroke="var(--sub)"/>' + LBL(215, 95, "家電") +
      '<rect x="110" y="150" width="8" height="10" fill="var(--sub)"/>' + LBL(114, 176, "巾木") +
      '<line x1="119" y1="130" x2="169" y2="130"' + ARROW + "/>" + LBL(144, 124, "幅") +
      '<line x1="140" y1="30" x2="140" y2="158"' + ARROW + "/>" + LBL(146, 60, "高さ", "start"),
    C: GUIDE_DEFS +
      '<rect x="60" y="90" width="160" height="70" fill="var(--sp-grid)" stroke="var(--sub)"/>' + LBL(140, 130, "家電（レンジ・洗濯機など）") +
      '<line x1="40" y1="20" x2="240" y2="20" stroke="var(--ink)" stroke-width="1.5"/>' + LBL(140, 14, "天井・上の棚") +
      '<line x1="140" y1="22" x2="140" y2="88"' + ARROW + "/>" + LBL(146, 58, "高さ（放熱・ふたの分を空けて）", "start"),
    D: GUIDE_DEFS +
      '<rect x="40" y="30" width="200" height="12" fill="var(--sp-grid)" stroke="var(--sub)"/>' + LBL(140, 26, "天板・ベッド・中段") +
      '<line x1="40" y1="150" x2="240" y2="150" stroke="var(--ink)" stroke-width="1.5"/>' + LBL(140, 166, "床") +
      '<rect x="40" y="42" width="8" height="108" fill="var(--sub)"/><rect x="232" y="42" width="8" height="108" fill="var(--sub)"/>' +
      '<line x1="50" y1="120" x2="230" y2="120"' + ARROW + "/>" + LBL(140, 114, "横幅：脚や柱の内側") +
      '<line x1="200" y1="44" x2="200" y2="148"' + ARROW + "/>" + LBL(196, 80, "高さ：いちばん低い所", "end")
  };
  var GUIDE_TEXT = {
    A: ["横幅は、扉の蝶番や柱の内側どうしの、いちばん狭いところ。", "高さは、上の出っぱり（シンクの底・棚板）の下まで。手前と奥で違うときは低いほう。", "奥行は、奥の壁か排水管・ガス管まで。"],
    B: ["幅は、床から少し上（巾木の上）と真ん中の高さの2か所で測り、狭いほう。", "奥行は、手前に出しても通路をふさがない長さに。", "コンセントやホースの出っぱりも確認。"],
    C: ["高さは、家電の上面から天井・上の棚まで。", "電子レンジは上に放熱のすき間、洗濯機はふたが開く高さ（約30cm）を空けて測る。", "重いものは置かない。"],
    D: ["高さは、天板・ベッドの枠・中段のいちばん低いところまで（脚や補強の横木に注意）。", "横幅は、脚や柱の内側どうし。", "引き出しケースは、手前に引き出す分の空きも必要。"]
  };
  function renderGuide() {
    var p = currentPlace(), box = $("sunpoGuideBox");
    if (!p) { box.hidden = true; return; }
    box.hidden = false;
    var v = p.variants.filter(function (x) { return x.id === S.variant; })[0] || p.variants[0];
    var sp = p.space || "A";
    // 図：司令塔が用意した絵があれば使い、読めなければ線画（SVG）に戻す
    var gkey = p.id === "colorbox" ? "colorbox" : (/引き出し/.test(v.name) || /drawer|freezer/.test(v.id) ? "A2" : sp);
    var gimg = (DATA.guide_img || {})[gkey];
    var pic = gimg ? '<img class="sunpo-guideimg" src="' + esc(gimg) + '" alt="' + esc(p.name + "の測り方の図") + '" loading="eager" data-guide="' + sp + '">'
      : '<svg viewBox="0 0 300 180" role="img" aria-label="測り方の図">' + GUIDE_SVG[sp] + "</svg>";
    $("sunpoGuide").innerHTML = pic +
      "<ul>" + GUIDE_TEXT[sp].map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") +
      (p.note ? "<li>" + esc(p.note) + "</li>" : "") + "</ul>" +
      (v && v.range ? '<p class="sp-range">この場所のよくある内寸：' + esc(v.range) + "cm（例の値は " + fmt(v.w) + "×" + fmt(v.d) + "×" + fmt(v.h) + "cm）</p>" : "");
  }
  function renderPlaces() {
    var box = $("sunpoPlaces"), vbox = $("sunpoVariants"), room = findRoom(S.room);
    if (!room) {
      box.innerHTML = ""; vbox.hidden = true; renderTraps(); renderGuide();
      $("sunpoPlaceNote").textContent = "場所を選ばない場合は、すべての種類から寸法だけで探します。";
      renderTypes(); return;
    }
    box.innerHTML = room.places.map(function (p) {
      if (PREP[p.id]) return '<button type="button" class="sunpo-chip sp-prep" disabled aria-disabled="true">' + wrapLabel(p.name + "（準備中）") + "</button>";
      return '<button type="button" class="sunpo-chip" data-p="' + p.id + '" aria-pressed="' + (p.id === S.place) + '">' +
        (WIZ() && p.types[0] ? '<span class="sp-pimg">' + icon(p.types[0]) + "</span>" : "") + "<span>" + wrapLabel(p.name) + "</span></button>";
    }).join("");
    each("#sunpoPlaces .sunpo-chip", function (b) {
      if (!b.dataset.p) return;
      b.addEventListener("click", function () { pickPlace(findPlace(b.dataset.p).place); S.type = "all"; renderPlaces(); syncInputs(); render(); });
    });
    var p = currentPlace();
    if (p && p.variants.length > 1) {
      vbox.hidden = false;
      vbox.innerHTML = p.variants.map(function (v) {
        if (PREP[v.id]) return '<button type="button" class="sp-prep" disabled aria-disabled="true">' + wrapLabel(v.name + "（準備中）") + "</button>";
        return '<button type="button" data-v="' + v.id + '" aria-pressed="' + (v.id === S.variant) + '">' + wrapLabel(v.name) + "</button>";
      }).join("");
      each("#sunpoVariants button", function (b) {
        if (!b.dataset.v) return;
        b.addEventListener("click", function () {
          var v = p.variants.filter(function (x) { return x.id === b.dataset.v; })[0];
          S.variant = v.id; if (S.example) { S.w = v.w; S.d = v.d; S.h = v.h; } resetTraps(); renderPlaces(); syncInputs(); render();
        });
      });
    } else vbox.hidden = true;
    $("sunpoPlaceNote").textContent = (p && p.note ? p.note + "。" : "") + "寸法は一般的な例です。ご自宅の実寸で上書きしてください。";
    renderTraps();
    renderGuide();
    renderTypes();
  }
  function renderTypes() {
    var p = currentPlace();
    var list = p ? p.types : DATA.types.map(function (t) { return t.id; });
    var html = '<button type="button" class="sunpo-type" data-t="all" aria-pressed="' + (S.type === "all") + '">すべて</button>' +
      list.map(function (t) {
        return '<button type="button" class="sunpo-type" data-t="' + t + '" aria-pressed="' + (S.type === t) + '">' + icon(t) + "<span>" + esc(TYPE_NAME[t] || t) + '</span><em class="sp-n" data-n="' + t + '"></em></button>';
      }).join("");
    $("sunpoTypes").innerHTML = html;
    each(".sunpo-type", function (b) {
      b.addEventListener("click", function () { S.type = b.dataset.t; renderTypes(); render(); });
    });
  }

  // ---- 入力 ----
  function useExample() {
    var p = currentPlace();
    var v = p ? (p.variants.filter(function (x) { return x.id === S.variant; })[0] || p.variants[0]) : { w: 70, d: 50, h: 55 };
    S.w = v.w; S.d = v.d; S.h = v.h; S.example = true;
    syncInputs(); render();
  }
  $("sunpoTry").addEventListener("click", useExample);
  root.addEventListener("click", function (e) { if (e.target && e.target.id === "sunpoTry2") useExample(); });
  function syncInputs() {
    var blankEx = WIZ() && S.example;
    [["sunpoW", "w"], ["sunpoD", "d"], ["sunpoH", "h"]].forEach(function (pair) {
      var el = $(pair[0]), v = S[pair[1]];
      if (!el.dataset.ph) el.dataset.ph = el.placeholder;
      el.value = !blankEx && isFinite(v) ? fmt(v) : "";
      el.placeholder = blankEx && isFinite(v) ? "例 " + fmt(v) : el.dataset.ph;
    });
    $("sunpoRot").checked = S.rot;
  }
  [["sunpoW", "w"], ["sunpoD", "d"], ["sunpoH", "h"]].forEach(function (pair) {
    $(pair[0]).addEventListener("input", function (e) {
      if (!trackState.started) { trackState.started = true; track("input_start", { place: S.variant || "none" }); }
      if (WIZ()) { S.w = num($("sunpoW").value); S.d = num($("sunpoD").value); S.h = num($("sunpoH").value); }
      else S[pair[1]] = num(e.target.value);
      S.example = false; render();
    });
    // 携帯：3つ目を入れ終えたら候補へ進む（この画面で初めてそろったときだけ。直しているときは進まない）
    $(pair[0]).addEventListener("change", function () {
      if (WIZ() && S.mstep === "dims" && autoGo && dimsOk() && !S.example) { autoGo = false; goStep("res", true); }
    });
    $(pair[0]).addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      var next = { sunpoW: "sunpoD", sunpoD: "sunpoH" }[pair[0]];
      if (next) $(next).focus(); else e.target.blur();
    });
  });
  var autoGo = false;
  function dimsOk() { return [S.w, S.d, S.h].every(function (v) { return isFinite(v) && v > 0; }); }
  $("sunpoRot").addEventListener("change", function (e) { S.rot = e.target.checked; render(); });
  each("#sunpoMargin button", function (b) { b.addEventListener("click", function () { S.m = parseFloat(b.dataset.m); render(); }); });
  each(".sunpo-sort button", function (b) { b.addEventListener("click", function () { S.sort = b.dataset.s; render(); }); });
  each("#sunpoView button", function (b) { b.addEventListener("click", function () { S.view = b.dataset.v; render(); }); });
  $("sunpoForm").addEventListener("submit", function (e) { e.preventDefault(); });

  // ---- 判定：高さは固定（倒して置かない）。横向きは許可されたときだけ ----
  function evaluate(p) {
    var E = eff(p);
    var W = E.w - S.m, D = E.d - S.m, H = E.h - S.m;
    var WS = E.ws.map(function (x) { return x - S.m; });
    var ors = [{ w: p.w, d: p.d, rot: false }];
    if (p.w !== p.d) ors.push({ w: p.d, d: p.w, rot: true });
    var best = null, nearest = null, rotOnly = null;
    ors.forEach(function (o) {
      var r = { o: o, sw: W - o.w, sd: D - o.d, sh: H - p.h, straddle: E.straddle };
      r.fits = r.sw >= 0 && r.sd >= 0 && r.sh >= 0;
      r.allowed = !o.rot || S.rot;
      r.nxZones = WS.map(function (z) { return r.fits && z >= o.w ? Math.floor(z / o.w + 1e-9) : 0; });
      r.nx = r.nxZones.reduce(function (a, b) { return a + b; }, 0);
      r.ny = r.fits ? Math.floor(D / o.d + 1e-9) : 0;
      r.n = r.nx * r.ny;
      r.tight = Math.min(r.sw, r.sd, r.sh);
      r.short = Math.max(0, -r.sw) + Math.max(0, -r.sd) + Math.max(0, -r.sh);
      if (r.fits && r.allowed && (!best || (best.o.rot && !r.o.rot))) best = r;
      if (r.allowed && (!nearest || r.short < nearest.short)) nearest = r;
      if (!r.allowed && r.fits) rotOnly = r;
    });
    return { best: best, nearest: nearest, rotOnly: rotOnly };
  }

  // 判定の3段階：余裕あり／入る可能性があるが要確認（寸法不足で判定できない商品は候補に出さない）
  function level(p, r) {
    var why = [];
    if (r.tight < 1) why.push("余りが1cm未満です。取っ手やふくらみ、フタの出っぱりを商品ページの寸法で確認してください。");
    if (p.confidence === "要確認") why.push("商品説明の寸法の並び（幅・奥行・高さ）を推定しています。商品ページの寸法で確認してください。");
    if (r.o.rot && FRONT_TYPES.indexOf(p.type) >= 0) why.push("横向きに置いた場合です。引き出しや取り出し口の向きが変わります。");

    return why.length
      ? { id: "check", cls: "sp-tight", label: "収まる可能性あり・要確認", why: why.join("") }
      : { id: "ok", cls: "sp-fit", label: "外寸上は収まる見込み", why: "" };
  }
  // 要確認の理由を短く（携帯のカードで折りたたまずに出す）
  function reasons(p, r) {
    var a = [];
    if (r.o.rot && FRONT_TYPES.indexOf(p.type) >= 0) a.push("横向き");
    if (r.straddle) a.push("排水管をまたぐ");
    if (p.w_range || /範囲/.test(p.note || "")) a.push("伸縮");
    if (r.tight < 1) a.push("余り1cm未満");
    if (p.confidence === "要確認") a.push("寸法の並びを推定");
    return a;
  }
  function basis(p, r) { return '<details class="sunpo-basis"><summary>判定の根拠</summary>' + basisBody(p, r) + "</details>"; }
  function basisBody(p, r) {
    var E = eff(p);
    var rows = [
      ["置き場所（入力）", "横幅" + fmt(S.w) + "×奥行" + fmt(S.d) + "×高さ" + fmt(S.h) + "cm"],
      ["判定に使った寸法", "横幅" + fmt(E.w - S.m) + "×奥行" + fmt(E.d - S.m) + "×高さ" + fmt(E.h - S.m) + "cm" +
        "（すき間" + fmt(S.m) + "cm" + (E.notes.length ? "・" + E.notes.join("・") : "") + "）"],
      ["商品の寸法", (p.dim_kind || "外寸") + " 幅" + fmt(p.w) + "×奥行" + fmt(p.d) + "×高さ" + fmt(p.h) + (p.unit === "mm" ? "cm（mm表記から換算）" : "cm") +
        (r.o.rot ? "・横向きで判定" : "")],
      ["出典", p.evidence ? "楽天市場の商品説明「" + p.evidence + "」" : "楽天市場の商品説明"],
      ["確度", (p.confidence || "中") + "（" + (p.status || "自動抽出") + "）"]
    ];
    var page = p.links && p.links.rakuten;
    return "<dl>" +
      rows.map(function (x) { return "<dt>" + x[0] + "</dt><dd>" + esc(x[1]) + "</dd>"; }).join("") + "</dl>" +
      '<p class="sunpo-basislinks">' + (page ? '<a href="' + esc(page) + '" rel="sponsored noopener" target="_blank" data-track="' + esc(p.id) + '">商品ページで寸法を確認</a>' : "") +
      '<a href="../contact.html?item=' + encodeURIComponent(p.id) + '">寸法の誤りを報告</a></p>' +
      '<p class="sunpo-checked">取得日：' + esc(ymd(p.checked_at)) + "</p>";
  }

  function zoneText(top) {
    var el = $("sunpoZoneText");
    if (!top) { el.hidden = true; return; }
    var r = top.r, E = eff(top.p), ow = r.o.w;
    var WS = E.ws.map(function (x) { return x - S.m; });
    var parts;
    if (WS.length > 1 && !r.straddle) {
      var name = ["左", "右"];
      parts = WS.map(function (z, i) {
        var n = r.nxZones[i] || 0;
        return n ? name[i] + "に" + n + "個（余り約" + fmt(z - n * ow) + "cm）" : name[i] + "は幅が足りず置けません";
      });
      el.textContent = "排水管の" + parts.join("、") + "。余りはそれぞれの区画ごとの幅です。";
    } else {
      var n = r.nxZones ? r.nxZones[0] : r.nx;
      el.textContent = "横に" + n + "個" + (r.ny > 1 ? "×奥に" + r.ny + "列" : "") + "。横の余りは約" + fmt(WS[0] - n * ow) + "cmです。";
    }
    el.hidden = false;
  }
  // 携帯の進み具合（場所 → 採寸 → 候補）
  // ---- 携帯：細かい条件は最初たたむ。下に「候補◯件を見る」の帯を出し、候補が画面に入ったら隠す ----
  var resultsSeen = false;
  if ("IntersectionObserver" in window) {
    // 候補の欄（図から最後のカードまで）が少しでも画面に入っている間は隠す
    new IntersectionObserver(function (es) { resultsSeen = es[0].isIntersecting; jumpBar(); }, { rootMargin: "0px 0px -15% 0px" })
      .observe($("sunpoResults"));
  }
  var lastCount = null;
  function jumpBar(n) {
    if (typeof n === "number") lastCount = n;
    var bar = $("sunpoJump");
    bar.hidden = true; // 携帯は段階表示の「戻る／次へ」に置きかえた（パソコンではもともと出さない）
    if (lastCount !== null) bar.textContent = "候補 " + lastCount + "件を見る ↓";
  }
  $("sunpoJump").addEventListener("click", function () {
    var top = $("sunpoResults").getBoundingClientRect().top + window.pageYOffset - 64;
    try { window.scrollTo({ top: top, behavior: "smooth" }); } catch (e) { window.scrollTo(0, top); }
  });

  function steps(done) {
    var st = { 1: !!(S.place || S.room === "none"), 2: [S.w, S.d, S.h].every(function (v) { return isFinite(v) && v > 0; }), 3: !!done };
    var cur = { place: "1", dims: "2", res: "3" }[S.mstep];
    each("#sunpoSteps li", function (li) { li.classList.toggle("sp-done", !!st[li.dataset.step]); li.classList.toggle("sp-cur", li.dataset.step === cur); });
  }

  function linksHtml(p) {
    return ["rakuten", "yahoo", "amazon"].map(function (k) {
      var u = p.links && p.links[k];
      return u ? '<a href="' + esc(u) + '" rel="sponsored noopener" target="_blank" data-track="' + esc(p.id) + '" data-shop="' + k + '">' + SHOP_LABEL[k] + "</a>" : "";
    }).join("");
  }

  function render() {
    each("#sunpoMargin button", function (b) { b.setAttribute("aria-pressed", String(parseFloat(b.dataset.m) === S.m)); });
    each(".sunpo-sort button", function (b) { b.setAttribute("aria-pressed", String(b.dataset.s === S.sort)); });
    each("#sunpoView button", function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === S.view)); });

    var vals = [S.w, S.d, S.h];
    var ok = vals.every(function (v) { return isFinite(v) && v > 0; });
    var warn = $("sunpoWarn");
    if (vals.some(function (v) { return v >= 300; })) {
      warn.hidden = false; warn.textContent = "300cm以上の数字があります。mmで入れていませんか？（例：385mm → 38.5cm）";
    } else warn.hidden = true;

    if (!ok) {
      var blank = vals.every(function (v) { return !isFinite(v); });
      $("sunpoCount").textContent = blank ? "寸法を入れると候補が出ます" : "3つの寸法を入れてください";
      $("sunpoCards").innerHTML = blank
        ? '<div class="sunpo-empty">置き場所の横幅・奥行・高さを入れると、ここに候補が出ます。<br><button type="button" class="sunpo-trybtn" id="sunpoTry2">この場所の例の寸法で試す</button></div>'
        : '<div class="sunpo-empty">横幅・奥行・高さのどれかが空いています。空いたままだと大きすぎる商品まで出てしまうので、判定しません。</div>';
      $("sunpoZoneText").hidden = true; steps(false);
      $("sunpoDiagram").hidden = $("sunpoNear").hidden = $("sunpoShare").hidden = true;
      $("sunpoExampleBand").hidden = $("sunpoExampleFig").hidden = $("sunpoExampleRes").hidden = true;
      $("sunpoNearList").innerHTML = ""; $("sunpoNearSum").textContent = "惜しい商品";
      $("sunpoSvg").innerHTML = ""; $("sunpoUrl").textContent = "";
      wizUpdate(null);
      return;
    }

    var place = currentPlace();
    var E = eff(), effBox = $("sunpoEff");
    if (E.changed) {
      effBox.hidden = false;
      effBox.textContent = "判定に使う寸法：横幅" + fmt(E.w) + "×奥行" + fmt(E.d) + "×高さ" + fmt(E.h) + "cm（" + E.notes.join("・") + "）";
    } else effBox.hidden = true;
    var types = allowedTypes();
    // 種類ごとの件数（種類の絞り込みに関係なく、この場所の種類ぜんぶで数える）
    var perType = {};
    (place ? place.types : DATA.types.map(function (t) { return t.id; })).forEach(function (t) { perType[t] = 0; });
    DATA.items.forEach(function (it) {
      if (place && it.places && it.places.indexOf(place.id) < 0) return;
      if (perType[it.type] !== undefined && evaluate(it).best) perType[it.type]++;
    });
    each(".sunpo-type .sp-n", function (el) {
      var n = perType[el.dataset.n] || 0;
      el.textContent = n;
      el.parentNode.classList.toggle("sp-zero-type", n === 0);
    });
    var fit = [], near = [];
    DATA.items.forEach(function (p) {
      if (types.indexOf(p.type) < 0) return; // 場所に合わない種類は、惜しい商品にも出さない
      if (place && p.places && p.places.indexOf(place.id) < 0) return; // 名前で別の場所用と分かる商品
      var r = evaluate(p);
      if (r.best) fit.push({ p: p, r: r.best });
      else if (r.rotOnly) near.push({ p: p, r: r.rotOnly });
      else if (r.nearest && r.nearest.short <= 4) near.push({ p: p, r: r.nearest });
    });
    var rank = function (t) { var i = place ? place.types.indexOf(t) : 0; return i < 0 ? 99 : i; };
    fit.forEach(function (x) { x.lv = level(x.p, x.r); });
    var byLevel = function (cmp) { return function (a, b) { return (a.lv.id === "ok" ? 0 : 1) - (b.lv.id === "ok" ? 0 : 1) || cmp(a, b); }; };
    if (S.sort === "fit") fit.sort(byLevel(function (a, b) { return rank(a.p.type) - rank(b.p.type) || a.r.tight - b.r.tight; }));
    if (S.sort === "tight") fit.sort(byLevel(function (a, b) { return a.r.tight - b.r.tight; }));
    if (S.sort === "count") fit.sort(byLevel(function (a, b) { return b.r.n - a.r.n || a.r.tight - b.r.tight; }));
    if (S.sort === "price") fit.sort(byLevel(function (a, b) { return (a.p.price || 1e9) - (b.p.price || 1e9); }));
    near.sort(function (a, b) { return a.r.short - b.r.short; });

    $("sunpoCount").innerHTML = (place ? esc(place.name) + "に" : "") + "収まりそうな収納 <b>" + fit.length + "</b>件";
    jumpBar(fit.length);

    var html = "";
    fit.forEach(function (x) {
      if (WIZ()) { html += cardM(x); return; }
      var r = x.r, p = x.p;
      var z = function (v) { return v < 0.5 ? ' class="sp-zero"' : ""; };
      var boxy = BOXY_TYPES.indexOf(p.type) >= 0;
      var inner = p.inner ? '<span class="sunpo-spec">内寸 幅' + fmt(p.inner.w) + "×奥行" + fmt(p.inner.d) + "×高さ" + fmt(p.inner.h) + "cm</span>"
        : (boxy ? '<span class="sunpo-spec sp-est">内寸の目安 幅' + fmt(Math.max(p.w - 2, 0)) + "×奥行" + fmt(Math.max(p.d - 2, 0)) + "×高さ" + fmt(Math.max(p.h - 2, 0)) + "cm（外寸−2cmの推定）</span>" : "");
      var lv = x.lv;
      var shot = p.img
        ? '<a class="sunpo-photo" href="' + esc(p.links && p.links.rakuten || "#") + '" rel="sponsored noopener" target="_blank" data-track="' + esc(p.id) + '">' +
          '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '（楽天市場の商品画像）" loading="lazy" decoding="async" data-t="' + p.type + '" data-photo="1">' +
          '<span class="sunpo-typetag">' + icon(p.type) + "</span></a>"
        : '<div class="sunpo-thumb">' + icon(p.type) + "</div>";
      html += '<article class="sunpo-card sp-lv-' + lv.id + '">' +
        '<div class="sp-row">' + shot +
        '<div style="display:flex;flex-direction:column;gap:2px;min-width:0">' +
        '<span class="sunpo-shop">' + esc(TYPE_NAME[p.type] || "") + " ・ " + esc(p.shop) + "</span><h3>" + esc(p.name) + "</h3>" +
        '<span class="sunpo-spec">外寸 幅' + fmt(p.w) + "×奥行" + fmt(p.d) + "×高さ" + fmt(p.h) + "cm</span>" + inner + "</div></div>" +
        '<div class="sunpo-badges">' +
        '<span class="sunpo-badge ' + lv.cls + '">' + lv.label + "</span>" +
        (r.o.rot && FRONT_TYPES.indexOf(p.type) >= 0 ? '<span class="sunpo-badge sp-rot">横向きなら収まる（前面の向きに注意）</span>' : "") +
        (p.set_available ? '<span class="sunpo-badge sp-cnt">セット販売あり</span>' : "") +
        (r.n > 1 ? '<span class="sunpo-badge sp-cnt">' + (r.ny > 1 ? "横" + r.nx + "×奥" + r.ny + "で" : "") + r.n + "個並ぶ</span>" : "") + "</div>" +
        '<p class="sunpo-auto">寸法は商品説明から自動で読み取り（未確認）' + (p.confidence === "高" ? "" : "・確度" + esc(p.confidence || "中")) + "</p>" +
        '<div class="sunpo-slack" aria-label="あと何cm余るか"><div>' + (r.nxZones && r.nxZones.length > 1 ? "横（片側・1個）" : "横（1個）") + "<b" + z(r.sw) + ">+" + fmt(r.sw) + "</b></div><div>奥行<b" + z(r.sd) + ">+" + fmt(r.sd) + "</b></div><div>高さ<b" + z(r.sh) + ">+" + fmt(r.sh) + "</b></div></div>" +
        (p.price ? '<span class="sunpo-price">' + Number(p.price).toLocaleString("ja-JP") + "円（" + ymd(p.checked_at) + " 時点）</span>" : "") +
        (lv.why ? '<p class="sunpo-caution">' + esc(lv.why) + "</p>" : "") +
        (r.straddle ? '<p class="sunpo-info">排水管をまたいで置ける可能性があります（脚の位置・棚板の切り欠きは商品ページで確認してください）。' +
          (p.w_range ? "伸縮範囲は幅" + fmt(p.w_range[0]) + "〜" + fmt(p.w_range[1]) + "cmです。" : "伸縮範囲も商品ページで確認してください。") + "</p>" : "") +
        (p.note && !r.straddle ? '<p class="sunpo-info">' + esc(p.note) + "。</p>" : "") +
        basis(p, r) +
        '<div class="sunpo-links">' + linksHtml(p) + "</div>" +
        (FEEDBACK ? '<div class="sunpo-fb" data-id="' + esc(p.id) + '"><span>置いてみた方へ：入りましたか？</span>' +
          '<button type="button" data-fb="fit">入った</button><button type="button" data-fb="tight">きつかった</button><button type="button" data-fb="no">入らなかった</button></div>' : "") +
        "</article>";
    });
    var cond = [S.variant, S.w, S.d, S.h, S.m, S.rot, S.type].join("|");
    clearTimeout(trackState.timer);
    trackState.timer = setTimeout(function () {
      if (trackState.started && trackState.doneKey !== cond) { trackState.doneKey = cond; track("input_done", { place: S.variant || "none", w: S.w, d: S.d, h: S.h }); }
      if (trackState.shownKey !== cond) { trackState.shownKey = cond; track("results_shown", { place: S.variant || "none", count: fit.length }); }
    }, 900);
    if (DATA.unreadable) html += '<p class="sunpo-unread">商品説明から寸法を読み取れなかった商品（' + DATA.unreadable + '件）は、判定できないため候補に出していません。</p>';
    if (!fit.length) html = '<div class="sunpo-empty">この寸法に入る商品は見つかりませんでした。下の「惜しい商品」に、あと少しで入る商品と足りない寸法を出しています。</div>';
    $("sunpoCards").innerHTML = html;

    var nh = "";
    near.forEach(function (x) {
      var r = x.r, p = x.p, why = [], alt = "";
      if (r.fits && !r.allowed) { why.push("そのままの向きでは入りません"); alt = "「横向きに置いてもいい」をオンにすると入ります"; }
      else {
        if (r.sw < 0) why.push("横幅が" + fmt(-r.sw) + "cm足りません");
        if (r.sd < 0) why.push("奥行が" + fmt(-r.sd) + "cm足りません");
        if (r.sh < 0) why.push("高さが" + fmt(-r.sh) + "cm足りません");
        var other = fit.filter(function (q) { return q.p.type === p.type; })[0];
        alt = other ? "同じ種類なら「" + other.p.name + "」が入ります" : (S.m > 0 ? "すき間を「ぴったり」にすると入る場合があります" : "");
      }
      nh += '<div class="sunpo-nitem"><div><div>' + esc(p.name) + '</div><div class="sunpo-why">' + why.join("・") + "</div>" +
        (alt ? '<div class="sunpo-alt">' + esc(alt) + "</div>" : "") + '</div><span class="sunpo-nsize">' + fmt(p.w) + "×" + fmt(p.d) + "×" + fmt(p.h) + "</span></div>";
    });
    $("sunpoNearList").innerHTML = nh || '<div class="sunpo-alt">あと少しで入る商品はありません。</div>';
    $("sunpoNearSum").textContent = "惜しい商品（" + near.length + "件）と足りない寸法";

    $("sunpoDiagram").hidden = $("sunpoNear").hidden = $("sunpoShare").hidden = false;
    draw(fit[0]);
    zoneText(fit[0]);
    steps(true);
    $("sunpoExampleBand").hidden = $("sunpoExampleFig").hidden = $("sunpoExampleRes").hidden = !S.example;

    wizUpdate(fit);
    var qs = "?w=" + fmt(S.w) + "&d=" + fmt(S.d) + "&h=" + fmt(S.h) + "&m=" + S.m + (S.rot ? "&rot=1" : "") + (S.example ? "&ex=1" : "") +
      (S.variant ? "&place=" + encodeURIComponent(S.variant) : (S.room === "none" ? "&place=none" : "")) + (S.type !== "all" ? "&type=" + encodeURIComponent(S.type) : "");
    $("sunpoUrl").textContent = location.origin + location.pathname + qs;
    try { history.replaceState(null, "", qs + stepQs()); } catch (e) { /* file:// などでは書き換えない */ }
  }

  // ---- 携帯のカード：写真・名前・判定・余り・価格・購入ボタン。注意の短いバッジは出したまま、細かい根拠は「詳しく」へ ----
  function cardM(x) {
    var r = x.r, p = x.p, lv = x.lv;
    var zones = r.nxZones && r.nxZones.length > 1;
    var shot = p.img
      ? '<a class="sunpo-photo" href="' + esc(p.links && p.links.rakuten || "#") + '" rel="sponsored noopener" target="_blank" data-track="' + esc(p.id) + '">' +
        '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '（楽天市場の商品画像）" loading="lazy" decoding="async" data-t="' + p.type + '" data-photo="1">' +
        '<span class="sunpo-typetag">' + icon(p.type) + "</span></a>"
      : '<div class="sunpo-thumb">' + icon(p.type) + "</div>";
    var inner = p.inner ? "内寸 幅" + fmt(p.inner.w) + "×奥行" + fmt(p.inner.d) + "×高さ" + fmt(p.inner.h) + "cm" : "";
    return '<article class="sunpo-card sp-mcard sp-lv-' + lv.id + '">' +
      '<div class="sp-row">' + shot + '<div class="sp-main">' +
      "<h3>" + esc(p.name) + "</h3>" +
      '<span class="sunpo-badge ' + lv.cls + '">' + lv.label + "</span>" +
      '<p class="sp-slack1" aria-label="あと何cm余るか">余り <span>' + (zones ? "横(片側)" : "横") + "<b>+" + fmt(r.sw) + "</b></span><span>奥<b>+" + fmt(r.sd) + "</b></span><span>上<b>+" + fmt(r.sh) + "</b></span></p>" +
      (p.price ? '<p class="sunpo-price"><b>' + Number(p.price).toLocaleString("ja-JP") + "円</b>（" + ymd(p.checked_at).slice(5) + "時点）</p>" : "") +
      "</div></div>" +
      '<div class="sunpo-badges"><span class="sunpo-badge sp-auto">自動読み取り（未確認）</span>' +
      reasons(p, r).map(function (t) { return '<span class="sunpo-badge sp-tight">要確認：' + t + "</span>"; }).join("") +
      (r.n > 1 ? '<span class="sunpo-badge sp-cnt">' + r.n + "個並ぶ</span>" : "") +
      (p.set_available ? '<span class="sunpo-badge sp-cnt">セット販売あり</span>' : "") + "</div>" +
      '<div class="sunpo-links">' + linksHtml(p) + "</div>" +
      '<details class="sunpo-mdetail"><summary>詳しく（寸法・注意・根拠）</summary>' +
      '<p class="sp-dline">' + esc(TYPE_NAME[p.type] || "") + " ・ " + esc(p.shop) + "</p>" +
      '<p class="sp-dline">外寸 幅' + fmt(p.w) + "×奥行" + fmt(p.d) + "×高さ" + fmt(p.h) + "cm" + (inner ? "／" + inner : "") + "</p>" +
      (r.ny > 1 ? '<p class="sp-dline">横' + r.nx + "×奥" + r.ny + "で" + r.n + "個並びます</p>" : "") +
      (lv.why ? '<p class="sunpo-caution">' + esc(lv.why) + "</p>" : "") +
      (r.straddle ? '<p class="sunpo-info">排水管をまたいで置ける可能性があります（脚の位置・棚板の切り欠きは商品ページで確認してください）。' +
        (p.w_range ? "伸縮範囲は幅" + fmt(p.w_range[0]) + "〜" + fmt(p.w_range[1]) + "cmです。" : "伸縮範囲も商品ページで確認してください。") + "</p>" : "") +
      (p.note && !r.straddle ? '<p class="sunpo-info">' + esc(p.note) + "。</p>" : "") +
      '<div class="sunpo-basis">' + basisBody(p, r) + "</div>" +
      "</details></article>";
  }

  function placeLabel() {
    var p = currentPlace();
    if (!p) return "場所の指定なし";
    var v = p.variants.filter(function (x) { return x.id === S.variant; })[0];
    return p.name + (v && p.variants.length > 1 ? "（" + v.name + "）" : "");
  }
  var TRAP_SHORT = { hinge: "扉の蝶番", base: "巾木", outlet: "コンセント" };
  function stepQs() { return WIZ() && S.mstep !== "intro" ? "&st=" + S.mstep : ""; }
  function wizUpdate(fit) {
    if (!WIZ()) return;
    var ok = dimsOk(), dims = ok ? fmt(S.w) + "×" + fmt(S.d) + "×" + fmt(S.h) + "cm" : "";
    // 入口：例の結果（件数と写真3枚）
    $("sunpoIntroEx").hidden = !S.example;
    $("sunpoIntroCond").textContent = placeLabel() + (ok ? "　幅" + fmt(S.w) + "×奥行" + fmt(S.d) + "×高さ" + fmt(S.h) + "cm" : "");
    $("sunpoIntroCount").innerHTML = fit ? "収まりそうな収納 <b>" + fit.length + "</b>件" : "";
    var shots = (fit || []).filter(function (x) { return x.p.img; }).slice(0, 3);
    $("sunpoIntroPhotos").innerHTML = shots.length ? shots.map(function (x) {
      return '<a href="' + esc(x.p.links && x.p.links.rakuten || "#") + '" rel="sponsored noopener" target="_blank" data-track="' + esc(x.p.id) + '">' +
        '<img src="' + esc(x.p.img) + '" alt="' + esc(x.p.name) + '（楽天市場の商品画像）" decoding="async"></a>';
    }).join("") + '<span class="sp-cap">楽天市場の商品</span>' : "";
    // 候補の画面の上の条件
    $("sunpoCondPlace").textContent = placeLabel();
    $("sunpoCondDims").textContent = dims;
    $("sunpoCondEx").hidden = !S.example;
    // 落とし穴は1行にたたむ
    var list = activeTraps(), ts = $("sunpoTrapSum");
    if (list.length) {
      var on = list.filter(function (t) { return S.traps[t.id]; }).map(function (t) { return t.split ? "排水管（" + fmt(amount(t)) + "cm）" : (TRAP_SHORT[t.id] || t.label); });
      ts.hidden = false;
      ts.innerHTML = "<span>" + esc(on.length ? on.join("・") + "をよけて計算中" : "よける物なしで計算中") + "</span><b>" + (root.classList.contains("sp-trapopen") ? "閉じる" : "変える") + "</b>";
    } else ts.hidden = true;
    // 絞り込み：変えた項目だけ出す
    var f = [];
    if (S.m !== 0.5) f.push("すき間" + (S.m ? fmt(S.m * 10) + "mm" : "なし"));
    if (!S.rot) f.push("横向きなし");
    if (S.type !== "all") f.push(TYPE_NAME[S.type] || S.type);
    $("sunpoMore").querySelector("summary").textContent = f.length ? "絞り込み中：" + f.join("・") : "絞り込み（種類・すき間・向き）";
    // 下の「戻る／次へ」
    var back = $("sunpoBack"), next = $("sunpoNext");
    if (S.mstep === "place") { back.dataset.go = "intro"; next.dataset.go = "dims"; next.disabled = false; next.textContent = "次へ：寸法を入れる"; }
    if (S.mstep === "dims") {
      back.dataset.go = "place"; next.dataset.go = "res";
      var miss = [S.w, S.d, S.h].filter(function (v) { return !(isFinite(v) && v > 0); }).length;
      next.disabled = !ok;
      next.textContent = !ok ? "あと" + miss + "つ入れてください" : (S.example ? "例の寸法で候補を見る（" : "候補を見る（") + (fit ? fit.length : 0) + "件）";
    }
  }
  function goStep(st, push) {
    if (st === "res" && !dimsOk()) st = "dims";
    if (st === "dims" && S.mstep !== "dims") autoGo = !dimsOk() || S.example;
    S.mstep = st;
    root.setAttribute("data-mstep", st);
    if (st !== "dims") root.classList.remove("sp-trapopen");
    // 先に履歴を積んでから描く（描くときの replaceState が、この新しい履歴を書きかえる）
    if (push) {
      var base = location.search.replace(/[?&]st=\w+/, "").replace(/^&/, "?"), add = stepQs();
      var url = base + (add ? (base ? "&" : "?") + add.slice(1) : "");
      try { history.pushState({ st: st }, "", url || location.pathname); } catch (e) { /* 書き換えられなくても進む */ }
    }
    syncInputs(); render(); steps(st === "res");
    if (push) window.scrollTo(0, 0);
    track("step", { to: st, place: S.variant || "none" });
  }
  root.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-go]");
    if (!b || !WIZ()) return;
    e.preventDefault();
    goStep(b.dataset.go, true);
  });
  window.addEventListener("popstate", function () {
    if (!WIZ()) return;
    var st = (location.search.match(/[?&]st=(\w+)/) || [])[1] || "intro";
    goStep(st, false);
  });
  $("sunpoTrapSum").addEventListener("click", function () { root.classList.toggle("sp-trapopen"); render(); });
  $("sunpoFigBtn").addEventListener("click", function () {
    var open = root.classList.toggle("sp-fig");
    this.setAttribute("aria-expanded", String(open));
    this.textContent = open ? "図を閉じる" : "置いたときの図を見る";
  });
  // 携帯とパソコンの切りかえ：絞り込みの箱を候補の上へ動かす（パソコンでは入力パネルに戻す）
  function applyMode() {
    var m = WIZ(), more = $("sunpoMore");
    root.classList.toggle("sp-wiz", m);
    if (m) { $("sunpoResults").insertBefore(more, $("sunpoExampleRes")); more.open = false; $("sunpoNear").open = false; $("sunpoGuideBox").open = true; }
    else { $("sunpoForm").appendChild(more); more.open = true; $("sunpoMore").querySelector("summary").textContent = "探す種類・すき間・向きを変える"; }
    root.setAttribute("data-mstep", m ? S.mstep : "");
    renderPlaces(); syncInputs(); render();
  }
  if (MOBILE.addEventListener) MOBILE.addEventListener("change", applyMode);

  // ---- 図：正面から（横幅×高さ）／上から（横幅×奥行） ----
  function draw(top) {
    var front = S.view === "front";
    var SW = S.w, SV = front ? S.h : S.d;
    var VW = 340, VH = 210, pad = 30;
    var sc = Math.min((VW - pad * 2) / SW, (VH - pad * 2) / SV);
    var sw = SW * sc, sv = SV * sc, x0 = (VW - sw) / 2, y0 = (VH - sv) / 2 + 6;
    var f = ' font-family="BIZ UDPGothic,Noto Sans JP,sans-serif"';
    var s = "";
    for (var gx = 0; gx <= VW; gx += 16) s += '<line x1="' + gx + '" y1="0" x2="' + gx + '" y2="' + VH + '" stroke="var(--sp-grid)" stroke-width="1"/>';
    for (var gy = 0; gy <= VH; gy += 16) s += '<line x1="0" y1="' + gy + '" x2="' + VW + '" y2="' + gy + '" stroke="var(--sp-grid)" stroke-width="1"/>';
    s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + sw + '" height="' + sv + '" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5" rx="2"/>';
    if (top) {
      var o = top.r.o, p = top.p, m = S.m * sc / 2;
      var bw = o.w * sc, bv = (front ? p.h : o.d) * sc;
      var nx = Math.min(top.r.nx, 14), ny = front ? 1 : Math.min(top.r.ny, 6);
      // 落とし穴で幅が変わるとき：排水管は中央に描いて左右に置く。蝶番などで狭くなった分は左端から寄せる
      var EP = eff(p).pipe || eff(null).pipe;
      var starts = [x0], counts = [nx];
      if (EP) {
        var pw = EP.width * sc, px = x0 + EP.center * sc - pw / 2;
        s += '<rect x="' + px + '" y="' + y0 + '" width="' + pw + '" height="' + sv + '" fill="var(--sp-grid)" stroke="var(--sub)" stroke-width="1" stroke-dasharray="4 3"/>';
        var tx = px + pw / 2 + 3.5, ty = y0 + sv / 2;
        s += '<text x="' + tx + '" y="' + ty + '" text-anchor="middle" font-size="10" fill="var(--sub)"' + f + ' transform="rotate(-90 ' + tx + " " + ty + ')">排水管</text>';
        if (!top.r.straddle) { starts = [x0, px + pw]; counts = top.r.nxZones.slice(0, 2); }
      }
      starts.forEach(function (sx, zi) {
        var cnt = Math.min(counts[zi] || 0, 14);
        for (var i = 0; i < cnt; i++) for (var j = 0; j < ny; j++) {
          var bx = sx + m + i * bw, by = front ? (y0 + sv - m - bv) : (y0 + m + j * bv);
          if (bx + bw > x0 + sw + 0.5) continue;
          s += '<rect x="' + (bx + 1) + '" y="' + (by + 1) + '" width="' + Math.max(bw - 2, 1) + '" height="' + Math.max(bv - 2, 1) + '" fill="var(--soft)" stroke="var(--accent)" stroke-width="1.2" rx="2"/>';
          if (front) s += detail(p.type, bx + 1, by + 1, Math.max(bw - 2, 1), Math.max(bv - 2, 1));
        }
      });

      if (front && top.r.sh >= 1) {
        var lx2 = x0 + sw - 8;
        s += '<line x1="' + lx2 + '" y1="' + (y0 + 3) + '" x2="' + lx2 + '" y2="' + (y0 + sv - bv - m - 1) + '" stroke="var(--accent-ink)" stroke-width="1" stroke-dasharray="3 2"/>';
        s += '<text x="' + (lx2 - 4) + '" y="' + (y0 + Math.max(14, (sv - bv) / 2 + 4)) + '" text-anchor="end" font-size="11" fill="var(--accent-ink)"' + f + ">上に" + fmt(top.r.sh) + "cm余る</text>";
      }
      $("sunpoCap").textContent = (front ? "正面から見た図" : "上から見た図") + "（いちばん上の候補「" + p.name + "」を" + (top.r.n > 1 ? top.r.n + "個" : "") + "置いた例）";
    } else $("sunpoCap").textContent = front ? "正面から見た図" : "上から見た図";
    s += '<text x="' + (VW / 2) + '" y="' + (y0 - 9) + '" text-anchor="middle" font-size="12" fill="var(--sub)"' + f + ">横幅 " + fmt(S.w) + "cm</text>";
    var lx = x0 - 10, ly = y0 + sv / 2;
    s += '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" font-size="12" fill="var(--sub)"' + f + ' transform="rotate(-90 ' + lx + " " + ly + ')">' + (front ? "高さ " + fmt(S.h) : "奥行 " + fmt(S.d)) + "cm</text>";
    if (top) {
      var E2 = eff(top.p).pipe ? eff(top.p) : eff(null);
      if (E2.pipe && E2.ws.length > 1) {
        var yL = y0 + sv + 14, pc = x0 + E2.pipe.center * sc, pw2 = E2.pipe.width * sc;
        var segs = [[x0, pc - pw2 / 2, "左 " + fmt(E2.ws[0]) + "cm"], [pc - pw2 / 2, pc + pw2 / 2, "管 " + fmt(E2.pipe.width)], [pc + pw2 / 2, x0 + sw, "右 " + fmt(E2.ws[1]) + "cm"]];
        segs.forEach(function (g) {
          s += '<line x1="' + (g[0] + 1) + '" y1="' + (yL - 4) + '" x2="' + (g[1] - 1) + '" y2="' + (yL - 4) + '" stroke="var(--accent-ink)" stroke-width="1"/>';
          s += '<line x1="' + (g[0] + 1) + '" y1="' + (yL - 8) + '" x2="' + (g[0] + 1) + '" y2="' + yL + '" stroke="var(--accent-ink)" stroke-width="1"/>';
          s += '<line x1="' + (g[1] - 1) + '" y1="' + (yL - 8) + '" x2="' + (g[1] - 1) + '" y2="' + yL + '" stroke="var(--accent-ink)" stroke-width="1"/>';
          s += '<text x="' + ((g[0] + g[1]) / 2) + '" y="' + (yL + 10) + '" text-anchor="middle" font-size="10" fill="var(--accent-ink)"' + f + ">" + g[2] + "</text>";
        });
      }
    }
    $("sunpoSvg").innerHTML = s;
  }
  // 正面図の中に、種類ごとの見た目の手がかり（引き出しの取っ手、棚板など）を描く
  function detail(t, x, y, w, h) {
    var st = ' stroke="var(--accent)" stroke-width="1" fill="none"';
    var cx = x + w / 2, out = "";
    t = ICON_ALIAS[t] || t;
    if (t === "drawer" || t === "chest") {
      var rows = t === "chest" ? Math.max(2, Math.min(6, Math.round(h / 22))) : Math.max(1, Math.min(4, Math.round(h / 18)));
      for (var i = 1; i < rows; i++) out += '<line x1="' + x + '" y1="' + (y + h * i / rows) + '" x2="' + (x + w) + '" y2="' + (y + h * i / rows) + '"' + st + "/>";
      for (var j = 0; j < rows; j++) out += '<line x1="' + (cx - Math.min(8, w / 6)) + '" y1="' + (y + h * (j + 0.5) / rows) + '" x2="' + (cx + Math.min(8, w / 6)) + '" y2="' + (y + h * (j + 0.5) / rows) + '"' + st + "/>";
    } else if (t === "sink_rack" || t === "gap_wagon" || t === "hanger" || t === "furniture" || t === "tension") {
      for (var k = 1; k < 3; k++) out += '<line x1="' + x + '" y1="' + (y + h * k / 3) + '" x2="' + (x + w) + '" y2="' + (y + h * k / 3) + '"' + st + "/>";
    } else if (t === "file") {
      out += '<path d="M' + (x + w * 0.2) + " " + y + " L" + (x + w) + " " + (y + h * 0.45) + '"' + st + "/>";
    } else if (t === "lid_box" || t === "container") {
      out += '<line x1="' + x + '" y1="' + (y + Math.min(6, h / 5)) + '" x2="' + (x + w) + '" y2="' + (y + Math.min(6, h / 5)) + '"' + st + "/>";
    } else if (h > 12 && w > 12) {
      out += '<rect x="' + (cx - Math.min(7, w / 5)) + '" y="' + (y + Math.min(5, h / 6)) + '" width="' + Math.min(14, w / 2.5) + '" height="' + Math.min(4, h / 8) + '" rx="2"' + st + "/>";
    }
    return out;
  }

  root.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-track]");
    if (a) track("product_click", { id: a.dataset.track, shop: a.dataset.shop || "rakuten", place: S.variant || "none" });
  });
  root.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".sunpo-fb button");
    if (!b || !FEEDBACK) return;
    var box = b.parentNode;
    var body = { id: box.dataset.id, result: b.dataset.fb, place: S.variant || "", w: S.w, d: S.d, h: S.h, m: S.m, at: new Date().toISOString() };
    try { fetch(FEEDBACK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true }); } catch (err) { /* 送れなくても画面は止めない */ }
    box.innerHTML = "<span>ありがとうございます。今後の判定の改善に使います。</span>";
  });

  $("sunpoCopy").addEventListener("click", function () {
    var t = $("sunpoUrl").textContent, b = $("sunpoCopy");
    var done = function () { b.textContent = "コピーしました"; setTimeout(function () { b.textContent = "リンクをコピー"; }, 1600); };
    var fb = function () {
      var r = document.createRange(); r.selectNodeContents($("sunpoUrl"));
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      b.textContent = "選択しました"; setTimeout(function () { b.textContent = "リンクをコピー"; }, 1600);
    };
    try { navigator.clipboard.writeText(t).then(done, fb); } catch (e) { fb(); }
  });

  // URL の条件を読む（?w=&d=&h=&m=&rot=1&place=<形の違いのid>&type=）
  function readQuery() {
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("place") === "none") { S.room = "none"; S.place = null; S.variant = null; }
      else if (q.has("place")) {
        var vid = q.get("place");
        DATA.rooms.forEach(function (r) {
          r.places.forEach(function (p) {
            p.variants.forEach(function (v) {
              if (v.id === vid) { S.room = r.id; S.place = p.id; S.variant = v.id; }
            });
          });
        });
      }
      if (q.has("w") && q.has("d") && q.has("h")) { S.w = num(q.get("w")); S.d = num(q.get("d")); S.h = num(q.get("h")); S.example = q.get("ex") === "1"; }
      if (q.has("m")) { var m = num(q.get("m")); if ([0, 0.5, 1].indexOf(m) >= 0) S.m = m; }
      if (q.get("rot") === "1") S.rot = true;
      if (q.has("type")) S.type = q.get("type");
      if (/^(place|dims|res)$/.test(q.get("st") || "")) S.mstep = q.get("st");
      else if (q.has("w") && q.get("ex") !== "1") S.mstep = "res"; // 共有リンク（自分の寸法）は候補から開く
    } catch (e) { /* 古いブラウザは既定値のまま */ }
  }

  function markPrep() {
    var keep = { place: S.place, variant: S.variant, w: S.w, d: S.d, h: S.h, rot: S.rot, traps: S.traps };
    DATA.rooms.forEach(function (room) {
      room.places.forEach(function (p) {
        var any = 0;
        p.variants.forEach(function (v) {
          S.place = p.id; S.variant = v.id; S.w = v.w; S.d = v.d; S.h = v.h; S.rot = true; resetTraps();
          var n = DATA.items.filter(function (it) { return p.types.indexOf(it.type) >= 0 && (!it.places || it.places.indexOf(p.id) >= 0) && evaluate(it).best; }).length;
          if (n < 3) PREP[v.id] = true; else any++;
        });
        if (!any) PREP[p.id] = true;
      });
    });
    S.place = keep.place; S.variant = keep.variant; S.w = keep.w; S.d = keep.d; S.h = keep.h; S.rot = keep.rot; S.traps = keep.traps;
  }

  function start(data) {
    DATA.items = (data.items || []).filter(function (p) { return p.w > 0 && p.d > 0 && p.h > 0 && p.type; });
    DATA.rooms = data.rooms || [];
    DATA.types = data.types || [];
    DATA.types.forEach(function (t) { TYPE_NAME[t.id] = t.name; if (t.img) TYPE_IMG[t.id] = t.img; });
    DATA.unreadable = data.unreadable || 0;
    DATA.guide_img = data.guide_img || {};
    markPrep();
    if (!DATA.rooms.length) { S.room = "none"; S.place = null; S.variant = null; }
    readQuery();
    resetTraps(); // 最初に開いたときも、その場所の落とし穴の既定値（シンク下の排水管など）を入れる
    renderRooms();
    applyMode();
    // 寸法の指定がなければ、例の寸法で開く（「例の寸法で表示中」の帯つき。自分で数字を入れると帯は消える）
    if (![S.w, S.d, S.h].every(function (v) { return isFinite(v) && v > 0; })) useExample();
    if (WIZ()) goStep(S.mstep, false); else { syncInputs(); render(); }
  }

  (window.SUNPO_DATA ? Promise.resolve(window.SUNPO_DATA) : fetch("products.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }))
    .then(start)
    .catch(function () {
      $("sunpoCards").innerHTML = '<div class="sunpo-empty">商品データを読み込めませんでした。時間をおいて、ページを再読み込みしてください。</div>';
    });
})();
