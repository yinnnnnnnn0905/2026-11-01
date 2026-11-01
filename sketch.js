/*
  sketch.js

  功能：
  - 使用 p5.js 製作背景動畫
  - 繪製信封、星星、愛心、花朵
  - 製作漂浮效果
  - 不負責文字內容與按鈕
*/

/* 儲存背景裝飾 */
let decorations = [];

/* 儲存漂浮符號 */
let floatingLetters = [];

/* 儲存背景信封 */
let backgroundEnvelopes = [];

/* =====================================
   p5.js 初始化
===================================== */

function setup() {
  const canvas = createCanvas(
    windowWidth,
    windowHeight
  );

  const container = document.getElementById(
    "p5-background"
  );

  if (container) {
    canvas.parent(container);
  }

  canvas.style("position", "fixed");
  canvas.style("left", "0");
  canvas.style("top", "0");
  canvas.style("z-index", "-1");
  canvas.style("pointer-events", "none");

  pixelDensity(
    Math.min(window.devicePixelRatio || 1, 2)
  );

  createDecorations();
  createFloatingLetters();
  createBackgroundEnvelopes();
}

/* =====================================
   p5.js 畫面更新
===================================== */

function draw() {
  clear();

  background("#ffffff");

  drawSoftBackground();
  drawFloatingLetters();
  drawDecorations();
  drawBackgroundEnvelopes();
}

/* =====================================
   建立裝飾物
===================================== */

function createDecorations() {
  decorations = [];

  const amount =
    windowWidth < 600
      ? 18
      : 32;

  for (let i = 0; i < amount; i++) {
    decorations.push({
      x: random(width),
      y: random(height),
      size: random(4, 17),

      type: random([
        "star",
        "heart",
        "dot",
        "flower"
      ]),

      speed: random(0.1, 0.35),
      rotation: random(TWO_PI),
      rotationSpeed: random(-0.01, 0.01),
      opacity: random(55, 145),
      phase: random(TWO_PI)
    });
  }
}

function createFloatingLetters() {
  floatingLetters = [];

  const symbols = [
    "♡",
    "✉",
    "✦",
    "·"
  ];

  for (let i = 0; i < 8; i++) {
    floatingLetters.push({
      x: random(width),
      y: random(height),
      symbol: random(symbols),
      size: random(18, 35),
      speed: random(0.08, 0.24),
      opacity: random(20, 50),
      phase: random(TWO_PI)
    });
  }
}

function createBackgroundEnvelopes() {
  backgroundEnvelopes = [];

  backgroundEnvelopes.push({
    x: width * 0.15,
    y: height * 0.25,
    width: min(120, width * 0.2),
    angle: -0.18,
    opacity: 120,
    phase: random(TWO_PI)
  });

  backgroundEnvelopes.push({
    x: width * 0.84,
    y: height * 0.72,
    width: min(145, width * 0.23),
    angle: 0.15,
    opacity: 105,
    phase: random(TWO_PI)
  });

  if (width < 600) {
    backgroundEnvelopes[0].x = width * 0.16;
    backgroundEnvelopes[0].y = height * 0.2;
    backgroundEnvelopes[0].width = 88;

    backgroundEnvelopes[1].x = width * 0.83;
    backgroundEnvelopes[1].y = height * 0.78;
    backgroundEnvelopes[1].width = 100;
  }
}

/* =====================================
   背景光影
===================================== */

function drawSoftBackground() {
  noStroke();

  for (let i = 0; i < 4; i++) {
    const x =
      width * (0.12 + i * 0.25);

    const y =
      height *
      (
        0.18 +
        sin(frameCount * 0.005 + i) * 0.08
      );

    const size =
      min(width, height) *
      (0.2 + i * 0.03);

    fill(
      255,
      249,
      242,
      14
    );

    ellipse(
      x,
      y,
      size,
      size * 0.65
    );
  }
}

/* =====================================
   背景裝飾
===================================== */

function drawDecorations() {
  decorations.forEach((item) => {
    item.y -= item.speed;

    if (item.y < -40) {
      item.y = height + 40;
      item.x = random(width);
    }

    item.rotation += item.rotationSpeed;

    const scaleValue =
      1 +
      sin(
        frameCount * 0.025 +
        item.phase
      ) *
      0.15;

    push();

    translate(item.x, item.y);
    rotate(item.rotation);
    scale(scaleValue);

    if (item.type === "star") {
      noStroke();

      fill(
        217,
        158,
        168,
        item.opacity
      );

      drawStar(
        0,
        0,
        item.size,
        item.size * 0.42,
        4
      );
    }

    if (item.type === "heart") {
      noStroke();

      fill(
        233,
        191,
        197,
        item.opacity
      );

      drawHeart(
        0,
        0,
        item.size
      );
    }

    if (item.type === "dot") {
      noStroke();

      fill(
        232,
        232,
        232,
        item.opacity
      );

      circle(
        0,
        0,
        item.size * 0.45
      );
    }

    if (item.type === "flower") {
      drawFlower(
        0,
        0,
        item.size * 0.65,
        item.opacity
      );
    }

    pop();
  });
}

/* =====================================
   漂浮符號
===================================== */

function drawFloatingLetters() {
  floatingLetters.forEach((item) => {
    item.y -= item.speed;

    if (item.y < -50) {
      item.y = height + 50;
      item.x = random(width);
    }

    const currentOpacity =
      item.opacity +
      sin(
        frameCount * 0.015 +
        item.phase
      ) *
      8;

    push();

    noStroke();

    fill(
      217,
      158,
      168,
      currentOpacity
    );

    textAlign(CENTER, CENTER);
    textSize(item.size);

    text(
      item.symbol,
      item.x,
      item.y
    );

    pop();
  });
}

/* =====================================
   背景信封
===================================== */

function drawBackgroundEnvelopes() {
  backgroundEnvelopes.forEach((envelope) => {
    const floatingY =
      sin(
        frameCount * 0.012 +
        envelope.phase
      ) *
      5;

    push();

    translate(
      envelope.x,
      envelope.y + floatingY
    );

    rotate(envelope.angle);

    drawEnvelope(
      0,
      0,
      envelope.width,
      envelope.width * 0.62,
      envelope.opacity
    );

    pop();
  });
}

function drawEnvelope(
  x,
  y,
  envelopeWidth,
  envelopeHeight,
  opacity
) {
  rectMode(CENTER);

  stroke(
    215,
    215,
    215,
    opacity
  );

  strokeWeight(1.5);

  fill(
    255,
    255,
    255,
    opacity * 0.3
  );

  rect(
    x,
    y,
    envelopeWidth,
    envelopeHeight,
    5
  );

  line(
    x - envelopeWidth / 2,
    y - envelopeHeight / 2,
    x,
    y
  );

  line(
    x + envelopeWidth / 2,
    y - envelopeHeight / 2,
    x,
    y
  );

  line(
    x - envelopeWidth / 2,
    y + envelopeHeight / 2,
    x,
    y
  );

  line(
    x + envelopeWidth / 2,
    y + envelopeHeight / 2,
    x,
    y
  );

  noStroke();

  fill(
    217,
    158,
    168,
    opacity
  );

  drawHeart(
    x,
    y + 3,
    envelopeWidth * 0.1
  );

  rectMode(CORNER);
}

/* =====================================
   繪製星星
===================================== */

function drawStar(
  x,
  y,
  outerRadius,
  innerRadius,
  points
) {
  beginShape();

  for (let i = 0; i < points * 2; i++) {
    const radius =
      i % 2 === 0
        ? outerRadius
        : innerRadius;

    const angle =
      -HALF_PI +
      (i * PI) / points;

    vertex(
      x + cos(angle) * radius,
      y + sin(angle) * radius
    );
  }

  endShape(CLOSE);
}

/* =====================================
   繪製愛心
===================================== */

function drawHeart(
  x,
  y,
  size
) {
  beginShape();

  vertex(
    x,
    y + size * 0.85
  );

  bezierVertex(
    x - size * 1.2,
    y + size * 0.05,
    x - size * 0.75,
    y - size * 0.8,
    x,
    y - size * 0.2
  );

  bezierVertex(
    x + size * 0.75,
    y - size * 0.8,
    x + size * 1.2,
    y + size * 0.05,
    x,
    y + size * 0.85
  );

  endShape(CLOSE);
}

/* =====================================
   繪製花朵
===================================== */

function drawFlower(
  x,
  y,
  size,
  opacity
) {
  push();

  noStroke();

  fill(
    233,
    191,
    197,
    opacity
  );

  for (let i = 0; i < 5; i++) {
    const angle =
      (TWO_PI / 5) * i;

    const petalX =
      x + cos(angle) * size * 0.55;

    const petalY =
      y + sin(angle) * size * 0.55;

    ellipse(
      petalX,
      petalY,
      size * 0.75,
      size * 0.55
    );
  }

  fill(
    217,
    158,
    168,
    opacity
  );

  circle(
    x,
    y,
    size * 0.42
  );

  pop();
}

/* =====================================
   視窗尺寸改變
===================================== */

function windowResized() {
  resizeCanvas(
    windowWidth,
    windowHeight
  );

  createDecorations();
  createFloatingLetters();
  createBackgroundEnvelopes();
}