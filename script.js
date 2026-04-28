console.log("Jaffar.hu landing page loaded");

document.querySelectorAll(".hero-actions a[href^='#']").forEach(function (link) {
  link.addEventListener("click", function (event) {
    var target = document.querySelector(link.getAttribute("href"));
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});
