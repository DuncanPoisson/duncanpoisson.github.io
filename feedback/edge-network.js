(function () {
  const canvas = document.getElementById("edgeNetwork");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  let width = window.innerWidth;
  let height = window.innerHeight;

  const NUM_NODES = 8;
  const ANIM_DURATION = 10000; // 10 seconds in ms

  // Max opacity per layer (outer → inner)
  const LAYER1_MAX_ALPHA = 0.9;  // edge layer: brightest
  const LAYER2_MAX_ALPHA = 0.6;  // middle layer: softer
  const LAYER3_MAX_ALPHA = 0.35; // inner layer: faintest

  let leftLayers, rightLayers;
  let lines12 = [];
  let lines23 = [];
  let startTime = null;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    initNetwork();
    startTime = performance.now();
  }

  function initNetwork() {
    leftLayers = { l1: [], l2: [], l3: [] };
    rightLayers = { l1: [], l2: [], l3: [] };
    lines12 = [];
    lines23 = [];

    const bandWidth = width / 6; // 1/6 of page on each edge

    // X positions for layers
    const leftX1 = bandWidth * 0.3;
    const leftX2 = bandWidth * 0.6;
    const leftX3 = bandWidth * 0.9;

    const rightX1 = width - bandWidth * 0.3;
    const rightX2 = width - bandWidth * 0.6;
    const rightX3 = width - bandWidth * 0.9;

    const marginY = 40;
    const yStart = marginY;
    const yEnd = height - marginY;
    const step = (yEnd - yStart) / (NUM_NODES - 1);

    const yVals = [];
    for (let i = 0; i < NUM_NODES; i++) {
      yVals.push(yStart + step * i);
    }

    // Build layers of points
    yVals.forEach((y) => {
      leftLayers.l1.push({ x: leftX1, y });
      leftLayers.l2.push({ x: leftX2, y });
      leftLayers.l3.push({ x: leftX3, y });

      rightLayers.l1.push({ x: rightX1, y });
      rightLayers.l2.push({ x: rightX2, y });
      rightLayers.l3.push({ x: rightX3, y });
    });

    // Connect layers: each node in layer A to 1–3 neighbors in layer B
    function connectLayers(layerFrom, layerTo, outArray) {
      for (let i = 0; i < layerFrom.length; i++) {
        const from = layerFrom[i];

        const neighbors = [i];
        if (i > 0) neighbors.push(i - 1);
        if (i < layerTo.length - 1) neighbors.push(i + 1);

        // choose 1–3 neighbors randomly
        const shuffled = neighbors.sort(() => Math.random() - 0.5);
        const count = Math.min(
          1 + Math.floor(Math.random() * 3),
          shuffled.length
        );
        const targets = shuffled.slice(0, count);

        targets.forEach((idx) => {
          const to = layerTo[idx];
          outArray.push({ from, to });
        });
      }
    }

    // Left side
    connectLayers(leftLayers.l1, leftLayers.l2, lines12);
    connectLayers(leftLayers.l2, leftLayers.l3, lines23);

    // Right side
    connectLayers(rightLayers.l1, rightLayers.l2, lines12);
    connectLayers(rightLayers.l2, rightLayers.l3, lines23);
  }

  function drawDots(points, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#f9fafb";
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Draw lines with a gradient along their length:
  //   near "from" → fromAlpha
  //   near "to"   → toAlpha
  function drawLines(lines, progress, fromAlpha, toAlpha) {
    if (progress <= 0 || fromAlpha <= 0 && toAlpha <= 0) return;

    ctx.save();
    ctx.lineWidth = 1.2;

    lines.forEach((seg) => {
      const { from, to } = seg;

      const x = from.x + (to.x - from.x) * progress;
      const y = from.y + (to.y - from.y) * progress;

      const grad = ctx.createLinearGradient(from.x, from.y, x, y);
      grad.addColorStop(
        0,
        `rgba(229, 231, 235, ${fromAlpha})` // near outer layer
      );
      grad.addColorStop(
        1,
        `rgba(229, 231, 235, ${toAlpha})`   // near inner layer
      );

      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawFrame(t) {
    ctx.clearRect(0, 0, width, height);

    // Timeline segments (fractions of the 10s):
    const stage1End = 0.2; // l1 dots fade in
    const stage2End = 0.4; // l2 dots fade in
    const stage3End = 0.7; // lines 1→2 draw
    const stage4End = 0.8; // l3 dots fade in
    const stage5End = 1.0; // lines 2→3 draw

    // Layer 1 dots (0 → 0.2)
    const fade1 = clamp(t / stage1End, 0, 1);
    const alpha1 = fade1 * LAYER1_MAX_ALPHA;
    drawDots(leftLayers.l1, alpha1);
    drawDots(rightLayers.l1, alpha1);

    // Layer 2 dots (0.2 → 0.4)
    const fade2 = clamp(
      (t - stage1End) / (stage2End - stage1End),
      0,
      1
    );
    const alpha2 = fade2 * LAYER2_MAX_ALPHA;
    drawDots(leftLayers.l2, alpha2);
    drawDots(rightLayers.l2, alpha2);

    // Lines 1 → 2 (0.4 → 0.7)
    const line12Prog = clamp(
      (t - stage2End) / (stage3End - stage2End),
      0,
      1
    );
    // Gradient from layer1 alpha → layer2 alpha
    drawLines(lines12, line12Prog, LAYER1_MAX_ALPHA, LAYER2_MAX_ALPHA);

    // Layer 3 dots (0.7 → 0.8)
    const fade3 = clamp(
      (t - stage3End) / (stage4End - stage3End),
      0,
      1
    );
    const alpha3 = fade3 * LAYER3_MAX_ALPHA;
    drawDots(leftLayers.l3, alpha3);
    drawDots(rightLayers.l3, alpha3);

    // Lines 2 → 3 (0.8 → 1.0)
    const line23Prog = clamp(
      (t - stage4End) / (stage5End - stage4End),
      0,
      1
    );
    // Gradient from layer2 alpha → layer3 alpha
    drawLines(lines23, line23Prog, LAYER2_MAX_ALPHA, LAYER3_MAX_ALPHA);
  }

  function animate(now) {
    if (!startTime) startTime = now;
    const elapsed = now - startTime;
    const t = clamp(elapsed / ANIM_DURATION, 0, 1);

    drawFrame(t);

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      // Final static frame
      drawFrame(1);
    }
  }

  window.addEventListener("load", () => {
    resize();
    requestAnimationFrame(animate);
  });

  window.addEventListener("resize", () => {
    resize();
    requestAnimationFrame(animate);
  });
})();
