(function () {
  var API = "https://roots-funding.evercaregreenroots.workers.dev";

  function money(cents) {
    var s = (cents / 100).toFixed(2).split(".");
    return "$" + s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + s[1];
  }

  function say(article, msg) {
    var el = article.querySelector(".status");
    if (el) el.textContent = msg;
  }

  function buildAmountFields() {
    document.querySelectorAll("article.item").forEach(function (art) {
      var actions = art.querySelector(".actions");
      var btn = art.querySelector("button.give");
      if (!actions || !btn || art.querySelector("input.amount")) return;

      var name = art.querySelector("h3") ? art.querySelector("h3").textContent : "this item";
      var wrap = document.createElement("span");
      wrap.className = "amtwrap";

      var sign = document.createElement("span");
      sign.className = "amtsign";
      sign.setAttribute("aria-hidden", "true");
      sign.textContent = "$";

      var input = document.createElement("input");
      input.className = "amount";
      input.type = "number";
      input.min = "1";
      input.step = "1";
      input.inputMode = "decimal";
      input.placeholder = "25";
      input.setAttribute("aria-label", "Amount in dollars toward " + name);

      wrap.appendChild(sign);
      wrap.appendChild(input);
      actions.insertBefore(wrap, btn);

      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); go(art); }
      });
    });
  }

  function render(data) {
    var bySlug = {};
    data.items.forEach(function (i) { bySlug[i.slug] = i; });

    document.querySelectorAll("article.item").forEach(function (art) {
      var it = bySlug[art.getAttribute("data-slug")];
      if (!it) return;

      var fill = art.querySelector(".fill");
      if (fill) fill.style.width = it.pct + "%";

      var label = art.querySelector(".meter-label");
      var pctEl = art.querySelector(".pct");
      var restEl = art.querySelector(".rest");
      if (pctEl) pctEl.textContent = it.pct + "% funded";
      if (restEl) restEl.textContent = it.closed ? "Fully funded" : money(it.remaining) + " still needed";
      if (label) {
        label.setAttribute("aria-valuenow", it.pct);
        label.setAttribute("aria-valuetext",
          money(it.raised) + " of " + money(it.goal) + " funded, " + it.pct + " percent, " +
          (it.closed ? "fully funded" : money(it.remaining) + " still needed"));
      }

      var btn = art.querySelector("button.give");
      var input = art.querySelector("input.amount");
      var any = art.querySelector(".any");

      if (it.closed) {
        art.setAttribute("data-closed", "yes");
        if (btn) { btn.disabled = true; btn.textContent = "Fully funded"; }
        if (input) { input.disabled = true; input.value = ""; }
        if (any) any.textContent = "Bought. Thank you.";
      } else {
        art.removeAttribute("data-closed");
        if (btn) btn.disabled = false;
        if (input) { input.disabled = false; input.max = String(Math.ceil(it.remaining / 100)); }
        if (any) any.textContent = "Any amount up to " + money(it.remaining);
      }
    });

    var raised = document.querySelector("[data-total-raised]");
    if (raised) raised.textContent = money(data.total.raised);
    var goalNote = document.querySelector("[data-total-goal]");
    if (goalNote) goalNote.textContent = "Of " + money(data.total.goal) + " listed";
  }

  function load() {
    return fetch(API + "/totals", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.items) render(d); })
      .catch(function () {
        var note = document.querySelector("[data-live-note]");
        if (note) note.textContent = "Live totals are not loading right now. The prices below are still correct.";
      });
  }

  function go(art) {
    var slug = art.getAttribute("data-slug");
    var input = art.querySelector("input.amount");
    var btn = art.querySelector("button.give");
    var dollars = parseFloat(input ? input.value : "");

    if (!(dollars >= 1)) {
      say(art, "Enter an amount of at least one dollar, then press the button again.");
      if (input) input.focus();
      return;
    }

    if (btn) btn.disabled = true;
    say(art, "Opening secure checkout.");

    fetch(API + "/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item: slug, amount: Math.round(dollars * 100) })
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.body.url) {
          if (btn) btn.disabled = false;
          say(art, res.body.message || res.body.error || "Checkout could not be started. Please try again.");
          load();
          return;
        }
        window.location.href = res.body.url;
      })
      .catch(function () {
        if (btn) btn.disabled = false;
        say(art, "Could not reach the payment service. Please try again in a moment.");
      });
  }

  function thankYou() {
    var m = window.location.search.match(/[?&]funded=([a-z0-9-]+)/);
    if (!m) return;
    var art = document.querySelector('article.item[data-slug="' + m[1] + '"]');
    if (art) {
      say(art, "Thank you. Your contribution is recorded and the total below now includes it.");
      art.scrollIntoView({ block: "center" });
    }
  }

  buildAmountFields();
  document.querySelectorAll("button.give").forEach(function (btn) {
    btn.addEventListener("click", function () { go(btn.closest("article.item")); });
  });
  load().then(thankYou);
  setInterval(load, 45000);
})();
