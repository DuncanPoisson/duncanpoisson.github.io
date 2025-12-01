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

  // Fade-in subsections as they enter viewport
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

  // Scroll-driven "stepper" text (R2D3 style)
  const stepContainers = systemsSection.querySelectorAll("[data-step-container]");

  if ("IntersectionObserver" in window) {
    stepContainers.forEach((container) => {
      const steps = Array.from(container.querySelectorAll(".system-step"));
      if (steps.length === 0) return;

      // Make the first step active initially
      steps[0].classList.add("active");

      const ioSteps = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              steps.forEach((s) => s.classList.remove("active"));
              entry.target.classList.add("active");
            }
          });
        },
        {
          root: null,
          rootMargin: "-40% 0px -40% 0px", // favor the middle of the viewport
          threshold: 0.3,
        }
      );

      steps.forEach((step) => ioSteps.observe(step));
    });
  } else {
    // Fallback: show all steps fully
    stepContainers.forEach((container) => {
      container.querySelectorAll(".system-step").forEach((step) => {
        step.classList.add("active");
      });
    });
  }

  // Optionally start with a system pre-open:
  // activateSystem("thermostat");
})();
