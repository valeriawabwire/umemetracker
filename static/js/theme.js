(function () {
  var THEME_KEY = "umeme_theme";

  function savedTheme() {
    try {
      var t = localStorage.getItem(THEME_KEY);
      if (t === "dark" || t === "light") return t;
    } catch (e) { /* ignore */ }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0b1220" : "#0b1b34");
    document.querySelectorAll(".theme-toggle").forEach(function (b) {
      b.textContent = theme === "dark" ? "☀️" : "🌙";
    });
  }

  // containers that hold the language + theme buttons (login card and top bar)
  var card = document.querySelector(".auth-card");
  if (card && !card.querySelector(".auth-tools")) {
    var a = document.createElement("div");
    a.className = "tools auth-tools";
    a.setAttribute("data-no-i18n", "");
    card.insertBefore(a, card.firstChild);
  }

  var right = document.querySelector(".topbar-right");
  if (right) {
    right.insertAdjacentHTML("afterbegin", '<button type="button" class="btn btn-ghost hidden" id="install-btn">Install app</button>');
    var t = document.createElement("div");
    t.className = "tools top-tools";
    t.setAttribute("data-no-i18n", "");
    right.insertBefore(t, right.firstChild);
  }

  document.querySelectorAll(".tools").forEach(function (box) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tool-btn theme-toggle";
    b.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
      applyTheme(next);
    });
    box.appendChild(b);
  });

  applyTheme(savedTheme());

  // ---------- installable app (PWA) ----------
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(function () { /* ignore */ });
  }

  var deferredPrompt = null;
  var installBtn = document.getElementById("install-btn");

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.classList.remove("hidden");
  });

  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    if (installBtn) installBtn.classList.add("hidden");
  });

  if (installBtn) {
    installBtn.addEventListener("click", function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () {
        deferredPrompt = null;
        installBtn.classList.add("hidden");
      });
    });
  }
})();
