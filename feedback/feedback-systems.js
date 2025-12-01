(function () {
  const systemsSection = document.getElementById("systems");
  if (!systemsSection) return;

  const tabButtons = systemsSection.querySelectorAll("[data-system-tab]");
  const details = systemsSection.querySelectorAll("[data-system-detail]");
  const backButtons = systemsSection.querySelectorAll("[data-back-to-systems]");

  function activateSystem(name) {
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.systemTab === name;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    details.forEach((panel) => {
      const isActive = panel.dataset.systemDetail === name;
      panel.style.display = isActive ? "block" : "none";
      panel.setAttribute("aria-hidden", isActive ? "false" : "true");
    });
  }

  // Tab click → activate + scroll to detail area
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.systemTab;
      activateSystem(target);

      // Scroll to the top of the systems body for a smooth transition
      const body = systemsSection.querySelector(".systems-body");
      if (body) {
        body.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Back button → scroll back up to tabs
  backButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      systemsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Optional: fade-in subsections as they enter viewport
  const observeTargets = systemsSection.querySelectorAll("[data-observe]");

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observeTargets.forEach((el) => io.observe(el));
  } else {
    // Fallback: just show everything
    observeTargets.forEach((el) => el.classList.add("visible"));
  }

  // You can choose to start with a system open or none.
  // Uncomment this if you want Thermostats open by default:
  // activateSystem("thermostat");
})();
