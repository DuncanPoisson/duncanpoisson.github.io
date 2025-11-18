(function () {
  const hero = document.getElementById("hero");
  const heroTitle = document.getElementById("heroTitle");
  const heroQuote = document.getElementById("heroQuote");
  const canvas = document.getElementById("heroNetwork");

  if (!hero || !heroTitle || !heroQuote || !canvas) return;

  const ctx = canvas.getContext("2d");

  let nodes = [];
  let connections = [];
  let networkStartTime = null;
  const networkDuration = 5000; // 5 seconds

  function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
  }

  function randomBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function setupCanvas() {
    const rect = hero.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 1 unit = 1 CSS pixel
  }

  function initNetwork() {
    setupCanvas();

    const heroRect = hero.getBoundingClientRect();
    const titleRect = heroTitle.getBoundingClientRect();
    const quoteRect = heroQuote.getBoundingClientRect();

    // union of title + quote bounding boxes, relative to hero
    const contentTop = Math.min(titleRect.top, quoteRect.top) - heroRect.top;
    const contentBottom =
      Math.max(titleRect.bottom, quoteRect.bottom) - heroRect.top;
    const contentLeft = Math.min(titleRect.left, quoteRect.left) - heroRect.left;
    const contentRight =
      Math.max(titleRect.right, quoteRect.right) - heroRect.left;

    const width = heroRect.width;
    const height = heroRect.height;

    nodes = [];
    connections = [];

    const numNodesPerSide = 16;
    const margin = 32; // how far from the text block edges they stop

    const leftEndXMin = contentLeft - margin * 1.4;
    const leftEndXMax = contentLeft - margin * 0.7;
    const rightEndXMin = contentRight + margin * 0.7;
    const rightEndXMax = contentRight + margin * 1.4;

    // LEFT SIDE NODES: start off-screen left, move toward left flank of text
    for (let i = 0; i < numNodesPerSide; i++) {
      const startX = -randomBetween(width * 0.2, width * 0.4) - 40;
      const startY = randomBetween(0, height);
      const endX = randomBetween(leftEndXMin, leftEndXMax);
      const endY = randomBetween(contentTop - margin, contentBottom + margin);

      nodes.push({ startX, startY, endX, endY });
    }

    // RIGHT SIDE NODES: start off-screen right, move toward right flank of text
    for (let i = 0; i < numNodesPerSide; i++) {
      const startX = width + randomBetween(width * 0.2, width * 0.4) + 40;
      const startY = randomBetween(0, height);
      const endX = randomBetween(rightEndXMin, rightEndXMax);
      const endY = randomBetween(contentTop - margin, contentBottom + margin);

      nodes.push({ startX, startY, endX, endY });
    }

    // simple connections: each node connected to a nearby neighbor
    for (let i = 0; i < nodes.length; i++) {
      const step = 1 + Math.floor(Math.random() * 3);
      const target = (i + step) % nodes.length;
      connections.push([i, target]);
    }

    networkStartTime = performance.now();
    requestAnimationFrame(drawNetwork);
  }

  function drawNetwork(now) {
    if (!networkStartTime) return;

    const elapsed = now - networkStartTime;
    const t = Math.min(Math.max(elapsed / networkDuration, 0), 1);
    const eased = easeOutQuad(t);

    const heroRect = hero.getBoundingClientRect();
    ctx.clearRect(0, 0, heroRect.width, heroRect.height);

    // positions for this frame
    const positions = nodes.map((node) => {
      const x = node.startX + (node.endX - node.startX) * eased;
      const y = node.startY + (node.endY - node.startY) * eased;
      return { x, y };
    });

    // alpha: bright at start, fading as they approach text
    const baseAlpha = 0.8;
    const minAlpha = 0.2; // set to 0.0 if you want them to fully disappear
    const alpha = baseAlpha * (1 - t) + minAlpha * t; // from 0.8 -> 0.2

    ctx.globalAlpha = alpha;

    // draw connections
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = "#e5e7eb";
    connections.forEach(([i, j]) => {
      const p = positions[i];
      const q = positions[j];
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
    });

    // draw nodes
    ctx.fillStyle = "#f9fafb";
    positions.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1; // reset

    if (t < 1) {
      requestAnimationFrame(drawNetwork);
    } else {
      // leave them in their final faint state
    }
  }

  window.addEventListener("load", () => {
    // small delay so fonts/layout settle before we measure
    setTimeout(initNetwork, 200);
  });

  window.addEventListener("resize", () => {
    // on resize, recompute everything and restart animation
    setTimeout(initNetwork, 200);
  });
})();
