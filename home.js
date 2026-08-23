(function () {
  var API = "https://roots-funding.evercaregreenroots.workers.dev";

  function money(cents) {
    var s = (Math.round(cents) / 100).toFixed(2).split(".");
    return "$" + s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + s[1];
  }

  function put(sel, txt) {
    var el = document.querySelector(sel);
    if (el) el.textContent = txt;
  }

  fetch(API + "/totals", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d || !d.total || !d.items) return;
      put("[data-live-raised]", money(d.total.raised));
      put("[data-live-left]", money(d.total.remaining));
      var closed = d.items.filter(function (i) { return i.closed; }).length;
      put("[data-live-items]", closed + " of " + d.items.length);
    })
    .catch(function () {});
})();
