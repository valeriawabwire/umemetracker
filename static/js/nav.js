(function () {
  var topbar = document.querySelector(".topbar");
  var purchaseCard = document.getElementById("purchase-card");
  if (!topbar || !purchaseCard) return;

  // give the cards that have no id one, so the menu can jump to them
  var chartCard = purchaseCard.nextElementSibling;
  var monthlyCard = purchaseCard.parentElement.nextElementSibling;
  var historyCard = monthlyCard ? monthlyCard.nextElementSibling : null;
  if (chartCard) chartCard.id = "chart-card";
  if (monthlyCard) monthlyCard.id = "monthly-card";
  if (historyCard) historyCard.id = "history-card";

  var ITEMS = [
    ["Overview", "status-banner"],
    ["Planner", "extras-grid"],
    ["Log", "purchase-card"],
    ["Trends", "chart-card"],
    ["History", "history-card"],
    ["Appliances", "appliance-card"],
    ["Money", "money-card"],
    ["Export", "share-card"]
  ];

  var html = ITEMS.map(function (item) {
    return '<a href="#' + item[1] + '" data-target="' + item[1] + '">' + item[0] + "</a>";
  }).join("");
  topbar.insertAdjacentHTML("beforeend", '<nav class="subnav" aria-label="Sections"><div class="subnav-inner">' + html + "</div></nav>");

  var links = Array.prototype.slice.call(topbar.querySelectorAll(".subnav a"));

  function goTo(id) {
    var el = document.getElementById(id);
    if (!el) return;
    document.documentElement.style.scrollPaddingTop = (topbar.offsetHeight + 12) + "px";
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  links.forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      goTo(a.getAttribute("data-target"));
    });
  });

  // highlight the section you are currently looking at
  function updateActive() {
    var limit = topbar.offsetHeight + 40;
    var current = ITEMS[0][1];
    ITEMS.forEach(function (item) {
      var el = document.getElementById(item[1]);
      if (el && el.getBoundingClientRect().top <= limit) current = item[1];
    });
    links.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-target") === current);
    });
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      updateActive();
    });
  }, { passive: true });
  window.addEventListener("resize", updateActive);
  updateActive();
})();
