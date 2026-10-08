/* 家電の置き場所チェック（/sunpo/kaden/）。外部ライブラリなし。appliances.json を読む（#kaden の data-src）。
   判定は2段階：「設置の目安を満たす見込み」と「要確認」。目安に届かないものは一覧に出さない（「入らない」とは言わない）。
   目安の値と出典は 寸法アシスタント\A0_設置の目安_出典.md。 */
(function () {
  "use strict";
  var root = document.getElementById("kaden");
  if (!root) return;

  // 冷蔵庫の放熱のすき間（cm）。ok＝「見込み」に要る値、min＝「要確認」として出す下限。
  // 大型：4社共通の最小値（上5・左右0.5・背面0）に、三菱の勧める1cmの余裕を足す。小型：パナソニック2ドア／1ドアの大きいほう、下限はシャープの小型
  var GAP = {
    large: { ok: { t: 6, s: 1.5, b: 1 }, min: { t: 5, s: 0.5, b: 0 } },
    small: { ok: { t: 30, s: 2, b: 10 }, min: { t: 10, s: 2, b: 2 } }
  };
  // 洗濯機：周囲1.5cm・排水ホース側9cm・背面5cm（パナソニック縦型の騒音防止の目安）。上はドラム式＋30cm、縦型はふたを開ける分＋45cm
  var WASH = { side: 1.5, hose: 9, back: 5, drumTop: 30, lidTop: 45, faucet: 10 };
  var EX = { fridge: { w: 65, d: 70, h: 190 }, washer: { w: 75, d: 65, h: 0 } }; // 寸法を入れる前に見せる例
  var CAPS = {
    fridge: [["", "すべて"], ["0-150", "〜150L"], ["151-300", "151〜300L"], ["301-450", "301〜450L"], ["451-999", "451L〜"]],
    washer: [["", "すべて"], ["0-6", "〜6kg"], ["6.1-9", "7〜9kg"], ["9.1-99", "10kg〜"]]
  };
  var SHOP_SHORT = { rakuten: "楽天で見る", yahoo: "Yahoo!で見る" };
  var SHOP_LABEL = { rakuten: "楽天市場で見る", yahoo: "Yahoo!ショッピングで見る" };
  var SRC_NAME = { rakuten: "楽天市場", yahoo: "Yahoo!ショッピング" };

  var S = { k: "fridge", w: NaN, d: NaN, h: NaN, pw: NaN, pd: NaN, f: NaN, gt: NaN, gs: NaN, gb: NaN, drain: "", cap: "", type: "", sort: "cap" };
  var ITEMS = [], UPDATED = "";
  var $ = function (id) { return document.getElementById(id); };
  var each = function (sel, fn) { Array.prototype.forEach.call(root.querySelectorAll(sel), fn); };
  var fmt = function (n) { return (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, ""); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  };
  var num = function (v) {
    var t = String(v == null ? "" : v).replace(/[０-９．]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); });
    var n = parseFloat(t.replace(/[^\d.]/g, ""));
    return isFinite(n) && n > 0 ? n : NaN;
  };
  var ok = function (v) { return isFinite(v) && v > 0; };
  // すき間の欄は 0 も入れられる（背面 0cm など）。空欄は NaN
  var numz = function (v) { return String(v == null ? "" : v).trim() === "" ? NaN : (/^[0０]+(?:[.．][0０]*)?$/.test(String(v).trim()) ? 0 : num(v)); };
  var set = function (v) { return isFinite(v) && v >= 0; };
  var ymd = function (iso) { return iso ? String(iso).slice(0, 10).replace(/-/g, "/") : ""; };
  var yen = function (v) { return Number(v).toLocaleString("ja-JP") + "円"; };

  // 計測：寸法アシスタントと同じ受け口（window.SUNPO_TRACK_URL）。寸法の数字・商品ID・識別子は送らない
  function track(ev, data) {
    var url = window.SUNPO_TRACK_URL;
    if (!url || !navigator.sendBeacon) return;
    var body = { e: ev, place: "kaden-" + S.k, cause: data.cause || "", n: typeof data.count === "number" ? data.count : null };
    if (data.shop) body.shop = data.shop;
    if (ev === "product_click") {
      var from = "";
      try { from = sessionStorage.getItem("kurashi_from") || ""; } catch (e) { /* 読めなければ付けない */ }
      if (/^[a-z]{1,10}$/.test(from)) body.from = from;
    }
    try { navigator.sendBeacon(url, new Blob([JSON.stringify(body)], { type: "text/plain" })); } catch (e) { /* 送れなくても止めない */ }
  }

  // ---- 判定 ----
  function fridgeGap(it) {
    var g = GAP[it.size_class === "large" ? "large" : "small"];
    var user = { t: S.gt, s: S.gs, b: S.gb };
    if (set(user.t) || set(user.s) || set(user.b)) {
      // 利用者がメーカーの値を入れたときは、その値を「見込み」の条件にする（空欄は目安の値）
      var u = { t: set(user.t) ? user.t : g.ok.t, s: set(user.s) ? user.s : g.ok.s, b: set(user.b) ? user.b : g.ok.b };
      return { ok: u, min: u, user: true };
    }
    return g;
  }
  function judgeFridge(it, W, D, H) {
    var reasons = [];
    var need = function (q) { return { w: it.w + 2 * q.s, d: it.d + q.b, h: it.h + q.t }; };
    var g = fridgeGap(it), a, b;
    if (it.install && !g.user) {
      // メーカーの「据付に必要な寸法」が商品説明にあるときは、それを使う（三菱の勧める1cmの余裕を足したものを「見込み」に）
      a = { w: it.install.w + 1, d: it.install.d, h: it.install.h + 1 };
      b = { w: it.install.w, d: it.install.d, h: it.install.h };
    } else {
      a = need(g.ok);
      b = need(g.min);
    }
    var fitsA = W >= a.w && D >= a.d && H >= a.h;
    var fitsB = W >= b.w && D >= b.d && H >= b.h;
    if (!fitsB) return null;
    if (!fitsA) reasons.push(g.user ? "入れた放熱のすき間に足りない" : "放熱のすき間が目安より少ない（メーカーにより必要なすき間が違います）");
    if (it.confidence === "要確認") reasons.push(it.note || "商品説明の寸法が出品によって違う");
    return { lv: reasons.length ? "check" : "ok", reasons: reasons, sw: (W - it.w) / 2, sd: D - it.d, sh: H - it.h, need: a };
  }
  function judgeWasher(it, W, D, H) {
    var reasons = [], notes = [];
    var top = it.washer_type === "drum" ? it.h + WASH.drumTop : (it.lid_h || it.h + WASH.lidTop);
    var a = { w: it.w + WASH.side + WASH.hose, d: it.d + WASH.back, h: top };
    var hasH = ok(H);
    if (W < it.w || D < it.d || (hasH && H < it.h)) return null;
    if (W < a.w || D < a.d) reasons.push("周りのすき間（左右・ホース側・背面）が目安より少ない");
    if (hasH && H < a.h) reasons.push(it.washer_type === "drum" ? "上の棚までが本体＋30cm より低い" : "ふたを開ける高さが足りないかもしれない（ふたを開けた高さはメーカーの据付寸法で確認）");
    if (ok(S.pw) && ok(S.pd) && (it.w > S.pw || it.d > S.pd)) reasons.push("本体が防水パンの内寸より大きい。脚の位置がパンに収まるか、メーカーの据付寸法で確認");
    if (it.confidence === "要確認") reasons.push(it.note || "商品説明の寸法が出品によって違う");
    if (ok(S.f) && S.f < it.h + WASH.faucet) notes.push("蛇口が本体の高さに近いと、別売の部品（壁ピタ水栓など）が要ることがあります");
    if (S.drain === "under") notes.push("排水口が本体の真下にあるときは、真下排水用の部品やかさ上げ台が要ることがあります");
    if (it.washer_type === "drum") notes.push("ドラム式は、前にドアを開けて出し入れする空き（目安で壁から110〜125cm）も要ります");
    return { lv: reasons.length ? "check" : "ok", reasons: reasons, notes: notes, sw: W - it.w, sd: D - it.d, sh: hasH ? H - it.h : NaN };
  }

  function capOf(it) { return S.k === "fridge" ? it.capacity_l : it.capacity_kg; }
  function inCap(it) {
    if (!S.cap) return true;
    var r = S.cap.split("-").map(Number), c = capOf(it);
    return c != null && c >= r[0] && c <= r[1];
  }

  // ---- 表示 ----
  function amazonSearch(it) {
    var t = window.SUNPO_AMAZON_SEARCH;
    if (typeof t !== "string" || t.indexOf("{q}") < 0) return "";
    return t.replace("{q}", encodeURIComponent(it.model ? (it.maker ? it.maker + " " : "") + it.model : it.name));
  }
  function linksHtml(it) {
    var ks = ["rakuten", "yahoo"].filter(function (k) { return it.links && it.links[k]; });
    var az = amazonSearch(it), many = ks.length + (az ? 1 : 0) > 1;
    return '<span class="kd-prtag" aria-label="広告">PR</span>' + ks.map(function (k) {
      return '<a href="' + esc(it.links[k]) + '" rel="sponsored noopener" target="_blank" data-track="1" data-shop="' + k + '">' + (many ? SHOP_SHORT[k] : SHOP_LABEL[k]) + "</a>";
    }).join("") + (az ? '<a class="kd-azs" href="' + esc(az) + '" rel="sponsored nofollow noopener" referrerpolicy="no-referrer-when-downgrade" attributionsrc target="_blank" data-track="1" data-shop="amazon">Amazonで探す</a>' : "");
  }
  function priceHtml(it) {
    if (!it.price) return "";
    return '<p class="kd-price"><b>' + yen(it.price) + (it.price_max && it.price_max > it.price ? "〜" : "") + "</b>（" + ymd(it.checked_at).slice(5) + "時点・店により違います）</p>";
  }
  function capText(it) {
    if (S.k === "fridge") return [it.capacity_l ? it.capacity_l + "L" : "", it.doors ? it.doors + "ドア" : ""].filter(Boolean).join("・");
    return [it.capacity_kg ? it.capacity_kg + "kg" : "", { top: "縦型", drum: "ドラム式", twin: "二槽式" }[it.washer_type] || ""].filter(Boolean).join("・");
  }
  function card(x) {
    var it = x.it, r = x.r;
    var shop = Object.keys(it.links || {}).map(function (k) { return SRC_NAME[k]; }).join("・");
    var main = (it.links && (it.links.rakuten || it.links.yahoo)) || "#";
    var shot = it.img
      ? '<a class="kd-photo" href="' + esc(main) + '" rel="sponsored noopener" target="_blank" data-track="1" data-shop="' + (it.links.rakuten ? "rakuten" : "yahoo") + '"><img src="' + esc(it.img) + '" alt="' + esc(it.name) + '（商品画像）" loading="lazy" decoding="async"></a>'
      : "";
    var slack = '<p class="kd-slack" aria-label="あと何cm余るか">余り(cm) <span>' + (S.k === "fridge" ? "左右各" : "横") + "<b>" + fmt(r.sw) + "</b></span><span>奥<b>" + fmt(r.sd) + "</b></span>" +
      (isFinite(r.sh) ? "<span>上<b>" + fmt(r.sh) + "</b></span>" : "") + "</p>";
    var lv = r.lv === "ok" ? '<span class="kd-badge kd-ok">設置の目安を満たす見込み</span>' : '<span class="kd-badge kd-check">要確認</span>';
    var basis = "<p>本体 幅" + fmt(it.w) + "×奥行" + fmt(it.d) + "×高さ" + fmt(it.h) + "cm" + (it.install ? "／据付に必要な寸法 幅" + fmt(it.install.w) + "×奥行" + fmt(it.install.d) + "×高さ" + fmt(it.install.h) + "cm" : "") + "</p>" +
      (it.dims_seen ? "<p>商品説明にあった寸法：" + it.dims_seen.map(function (t) { return fmt(t[0]) + "×" + fmt(t[1]) + "×" + fmt(t[2]); }).join("／") + "cm（どれがこの商品か決められないため、各辺の大きいほうで判定）</p>" :
        "<p>出典：" + esc(shop) + "の商品説明「" + esc(it.evidence) + "」</p>") +
      "<p>確度：" + esc(it.confidence) + (it.listings > 1 ? "（同じ型番の出品" + it.listings + "件" + (it.agree > 1 ? "のうち" + it.agree + "件で寸法が一致" : "") + "）" : "") + "</p>" +
      (S.k === "fridge" ? "<p>放熱の目安：" + (it.install && !fridgeGap(it).user ? "商品説明の「据付に必要な寸法」で判定" : it.size_class === "large" ? "大型（3ドア以上）の目安" : "小型の目安（ドア数・容量から）") + "</p>" : "");
    return '<article class="kd-card">' +
      '<div class="kd-row">' + shot + '<div class="kd-main">' +
      "<h3>" + esc(it.name) + "</h3>" +
      '<p class="kd-meta">' + esc((it.model && it.name.indexOf(it.model) >= 0 ? [capText(it)] : [it.maker, it.model, capText(it)]).filter(Boolean).join(" ・ ")) + "</p>" + lv +
      slack + priceHtml(it) + "</div></div>" +
      (r.reasons.length ? '<ul class="kd-reasons">' + r.reasons.map(function (t) { return "<li>要確認：" + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
      ((r.notes || []).length ? '<ul class="kd-notes">' + r.notes.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
      '<p class="kd-cardmust">購入前に、メーカーの設置寸法と搬入経路を確認してください。</p>' +
      '<div class="kd-links">' + linksHtml(it) + "</div>" +
      '<details class="kd-basis"><summary>判定の根拠</summary>' + basis + "</details>" +
      "</article>";
  }

  var timer = 0, shownKey = "";
  function render() {
    var ex = !(ok(S.w) && ok(S.d) && (S.k === "washer" || ok(S.h)));
    var W = ex ? EX[S.k].w : S.w, D = ex ? EX[S.k].d : S.d, H = ex ? EX[S.k].h : S.h;
    $("kdEx").hidden = !ex;
    $("kdEx").textContent = "例：置き場所が 幅" + W + "×奥行" + D + (H ? "×高さ" + H : "") + "cm のとき。上に寸法を入れると、その寸法で出し直します。";
    var hits = [];
    ITEMS.forEach(function (it) {
      if (it.kind !== S.k || !inCap(it)) return;
      if (S.k === "washer" && S.type && it.washer_type !== S.type) return;
      var r = S.k === "fridge" ? judgeFridge(it, W, D, H) : judgeWasher(it, W, D, H);
      if (r) hits.push({ it: it, r: r });
    });
    var tight = function (x) { return Math.min(x.r.sw, x.r.sd, isFinite(x.r.sh) ? x.r.sh : 999); };
    hits.sort(function (a, b) {
      if ((a.r.lv === "ok") !== (b.r.lv === "ok")) return a.r.lv === "ok" ? -1 : 1;
      if (S.sort === "price") return (a.it.price || 1e9) - (b.it.price || 1e9);
      if (S.sort === "fit") return tight(a) - tight(b);
      return (capOf(b.it) || 0) - (capOf(a.it) || 0) || (a.it.price || 1e9) - (b.it.price || 1e9);
    });
    var nOk = hits.filter(function (x) { return x.r.lv === "ok"; }).length;
    $("kdCount").textContent = (S.k === "fridge" ? "置けそうな冷蔵庫 " : "置けそうな洗濯機 ") + hits.length + "件" + (hits.length ? "（うち目安を満たす見込み " + nOk + "件）" : "");
    $("kdCards").innerHTML = hits.length ? hits.map(card).join("") :
      '<div class="kd-empty">この寸法で置けそうな' + (S.k === "fridge" ? "冷蔵庫" : "洗濯機") + "は見つかりませんでした。" +
      (S.cap || S.type ? "容量や種類の絞り込みを「すべて」にすると見つかることがあります。" : "") +
      "寸法は、出っぱり（巾木・コンセント・蛇口）を避けた一番狭いところで測っているか確かめてください。</div>";
    each(".kd-sort button", function (b) { b.setAttribute("aria-pressed", String(b.dataset.s === S.sort)); });
    if (!ex) {
      clearTimeout(timer);
      var key = [S.k, S.w, S.d, S.h, S.cap, S.type].join("|");
      timer = setTimeout(function () {
        if (shownKey === key) return;
        shownKey = key;
        track(hits.length ? "results_shown" : "zero_result", { count: hits.length, cause: hits.length ? "" : "none" });
      }, 900);
    }
    var q = "?k=" + S.k + (ex ? "" : "&w=" + fmt(S.w) + "&d=" + fmt(S.d) + (ok(S.h) ? "&h=" + fmt(S.h) : "")) + (S.cap ? "&cap=" + S.cap : "") + (S.type ? "&type=" + S.type : "");
    try { history.replaceState(null, "", q); } catch (e) { /* file:// などでは書き換えない */ }
  }

  function applyKind() {
    each(".kd-kind button", function (b) { b.setAttribute("aria-selected", String(b.dataset.k === S.k)); });
    each("[data-for]", function (el) { el.hidden = el.dataset.for !== S.k; });
    var f = S.k === "fridge";
    $("kdQ").textContent = f ? "冷蔵庫を置く場所の内側を測ってください" : "洗濯機を置く場所を測ってください";
    $("kdLw").textContent = f ? "幅（壁と壁・棚の間）" : "幅（壁と壁の間）";
    $("kdLd").textContent = f ? "奥行（壁から手前まで）" : "奥行（壁から手前まで）";
    $("kdLh").textContent = f ? "高さ（床から天井・上の棚まで）" : "上の棚までの高さ（無ければ空欄）";
    $("kdHint").textContent = f
      ? "放熱のためのすき間（上・左右・背面）は、こちらで引いて判定します。測った数字をそのまま入れてください。"
      : "防水パンがあっても、幅・奥行は部屋の壁から壁までを測ります。蛇口や排水口の位置は下で入れられます。";
    ["kdW", "kdD", "kdH"].forEach(function (id, i) { $(id).placeholder = "例 " + ([EX[S.k].w, EX[S.k].d, EX[S.k].h][i] || "空欄"); });
    $("kdCap").innerHTML = '<span class="kd-chiplabel">容量</span>' + CAPS[S.k].map(function (c) {
      return '<button type="button" data-v="' + c[0] + '" aria-pressed="' + (c[0] === S.cap) + '">' + c[1] + "</button>";
    }).join("");
    $("kdHow").innerHTML = f
      ? "<p>冷蔵庫は、放熱のすき間を引いてから判定します。3ドア以上（200L以上）は上6cm・左右各1.5cm・背面1cm、それより小さいものは上30cm・左右各2cm・背面10cmを目安にしています（メーカー各社の公式の値から、いちばん大きい値に余裕を足したもの）。目安に足りなくても、各社の最小の値（大型：上5・左右0.5・背面0cm／小型：上10・左右2・背面2cm）を満たすものは「要確認」として出します。</p>" +
        "<p>商品説明に「据付に必要な寸法」があるときは、その値で判定します。ドアが壁側に開くときは、壁から2〜4cm空けないと棚や引き出しが外せないことがあります。</p>"
      : "<p>洗濯機は、周りに左右1.5cm・排水ホース側9cm・背面5cmのすき間があるかで判定します。上の棚までの高さを入れたときは、ドラム式は本体＋30cm、縦型はふたを開ける分として本体＋45cmを目安にしています（ふたを開けた高さはメーカーの据付寸法で確認してください）。</p>" +
        "<p>防水パンは、本体がパンの内寸より大きくても、脚がパンに収まれば置けることが多いので、「要確認」にしています。</p>";
  }

  function readInputs() {
    S.w = num($("kdW").value); S.d = num($("kdD").value); S.h = num($("kdH").value);
    S.pw = num($("kdPw").value); S.pd = num($("kdPd").value); S.f = num($("kdF").value);
    S.gt = numz($("kdGt").value); S.gs = numz($("kdGs").value); S.gb = numz($("kdGb").value);
  }

  root.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    var a = e.target.closest("a[data-track]");
    if (a) track("product_click", { shop: a.dataset.shop });
    if (!b) return;
    if (b.dataset.k) {
      S.k = b.dataset.k; S.cap = ""; S.type = "";
      ["kdW", "kdD", "kdH"].forEach(function (id) { $(id).value = ""; });
      readInputs(); applyKind(); render();
    } else if (b.parentNode.id === "kdCap") { S.cap = b.dataset.v; each("#kdCap button", function (x) { x.setAttribute("aria-pressed", String(x === b)); }); render(); }
    else if (b.parentNode.id === "kdType") { S.type = b.dataset.v; each("#kdType button", function (x) { x.setAttribute("aria-pressed", String(x === b)); }); render(); }
    else if (b.parentNode.id === "kdDrain") { S.drain = b.dataset.v; each("#kdDrain button", function (x) { x.setAttribute("aria-pressed", String(x === b)); }); render(); }
    else if (b.dataset.s) { S.sort = b.dataset.s; render(); }
  });
  root.addEventListener("input", function (e) { if (e.target.tagName === "INPUT") { readInputs(); render(); } });

  function readQuery() {
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("k") === "washer") S.k = "washer";
      ["w", "d", "h"].forEach(function (k) { if (q.has(k)) $("kd" + k.toUpperCase()).value = q.get(k); });
      if (/^[\d.]+-[\d.]+$/.test(q.get("cap") || "")) S.cap = q.get("cap");
      if (/^(top|drum)$/.test(q.get("type") || "")) S.type = q.get("type");
    } catch (e) { /* 古いブラウザは URL の条件を読まない */ }
  }

  function start(data) {
    ITEMS = (data && data.items) || [];
    UPDATED = (data && data.updated) || "";
    readQuery(); readInputs(); applyKind();
    each("#kdType button", function (x) { x.setAttribute("aria-pressed", String(x.dataset.v === S.type)); });
    render();
  }
  (window.KADEN_DATA ? Promise.resolve(window.KADEN_DATA) : fetch(root.getAttribute("data-src") || "appliances.json", { cache: "no-cache" }).then(function (r) { return r.json(); }))
    .then(start)
    .catch(function () { $("kdCards").innerHTML = '<div class="kd-empty">商品の一覧を読み込めませんでした。時間をおいて開き直してください。</div>'; });
})();
