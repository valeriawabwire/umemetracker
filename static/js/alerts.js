(function () {
  function tr(text) { return window.I18N ? window.I18N.t(text) : text; }
  function get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* ignore */ } }

  document.querySelector(".topbar").insertAdjacentHTML("afterend",
    '<div id="alert-bar" class="alert-bar hidden" role="alert">' +
      '<span id="alert-text"></span>' +
      '<button type="button" class="btn btn-primary hidden" id="alert-notify">Turn on notifications</button>' +
      '<button type="button" class="btn btn-outline" id="alert-dismiss">Dismiss</button>' +
    '</div>');

  var actions = document.querySelector(".share-actions");
  if (actions) {
    actions.insertAdjacentHTML("beforeend", '<button type="button" class="btn btn-outline" id="test-alert">Test alerts</button>');
  }

  // how worried should we be?
  function currentLevel() {
    var s = state.stats;
    if (!s || s.burn === null || !(s.burn > 0) || s.daysLeft === null) return null;
    if (s.unitsNow <= 0) {
      return { id: "out", cls: "red", title: "Your units have probably run out", text: "Buy a token as soon as you can." };
    }
    if (s.daysLeft < 1) {
      return { id: "last", cls: "red", title: "Last day to buy!", text: "Your electricity should run out today. Buy a token now." };
    }
    if (s.daysLeft < 3) {
      var d = Math.floor(s.daysLeft);
      return { id: "low", cls: "amber", title: "Low units", text: "About " + d + " day(s) of electricity left. Plan your top-up now." };
    }
    return null;
  }

  function showNotification(title, body) {
    var options = { body: body, icon: "/static/img/icon-192.png", tag: "umeme-alert" };
    function fallback() { try { new Notification(title, options); } catch (e) { /* ignore */ } }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then(function (reg) {
        if (reg && reg.showNotification) reg.showNotification(title, options);
        else fallback();
      }).catch(fallback);
    } else {
      fallback();
    }
  }

  function maybeNotify(lv) {
    if (!lv || !("Notification" in window) || Notification.permission !== "granted") return;
    var key = "umeme_notified_" + state.household.id;
    var stamp = todayISO() + ":" + lv.id;
    if (get(key) === stamp) return;
    set(key, stamp);
    showNotification(tr(lv.title), tr(lv.text));
  }

  function renderAlerts() {
    var bar = document.getElementById("alert-bar");
    var lv = state.household ? currentLevel() : null;
    if (!lv) { bar.className = "alert-bar hidden"; return; }

    maybeNotify(lv);

    var dismissed = get("umeme_alert_dismissed_" + state.household.id) === todayISO() + ":" + lv.id;
    if (dismissed) { bar.className = "alert-bar hidden"; return; }

    bar.className = "alert-bar " + lv.cls;
    document.getElementById("alert-text").innerHTML = "<strong>" + lv.title + "</strong> " + lv.text;
    var canAsk = ("Notification" in window) && Notification.permission === "default";
    document.getElementById("alert-notify").classList.toggle("hidden", !canAsk);
  }

  function askPermission(sendTest) {
    if (!("Notification" in window)) { toast("Your browser does not support notifications.", "error"); return; }
    Notification.requestPermission().then(function (perm) {
      if (perm === "granted") {
        toast("Notifications are on.", "success");
        if (sendTest) showNotification(tr("Test alert"), tr("Alerts work! You will be notified when your units run low."));
        renderAlerts();
      } else {
        toast("Notifications are blocked. Allow them in your browser's site settings.", "error");
      }
    });
  }

  document.getElementById("alert-notify").addEventListener("click", function () { askPermission(false); });

  document.getElementById("alert-dismiss").addEventListener("click", function () {
    var lv = currentLevel();
    if (lv) set("umeme_alert_dismissed_" + state.household.id, todayISO() + ":" + lv.id);
    renderAlerts();
  });

  var testBtn = document.getElementById("test-alert");
  if (testBtn) {
    testBtn.addEventListener("click", function () {
      if (!("Notification" in window)) { toast("Your browser does not support notifications.", "error"); return; }
      if (Notification.permission === "granted") {
        showNotification(tr("Test alert"), tr("Alerts work! You will be notified when your units run low."));
        toast("Notifications are on.", "success");
      } else if (Notification.permission === "denied") {
        toast("Notifications are blocked. Allow them in your browser's site settings.", "error");
      } else {
        askPermission(true);
      }
    });
  }

  // re-check every 30 minutes while the app is open
  setInterval(function () {
    if (state.household && !document.getElementById("app-view").classList.contains("hidden")) {
      state.stats = computeStats(state.purchases);
      renderBanner();
      renderStats();
      renderAlerts();
    }
  }, 30 * 60 * 1000);

  var baseRenderAll = renderAll;
  renderAll = function () { baseRenderAll(); renderAlerts(); };
})();
