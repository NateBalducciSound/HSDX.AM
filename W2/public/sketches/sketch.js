//cell stuff
let cells = [];
let size = 4;
let generation = 0;

let lastStep = 0;
let delay = 1;
let shapes = [];

let pgCA;     
let pgMask;   // mask buffer
let circleSize = 300;

function initCells() {
  const count = floor(width / size);
  cells = new Array(count);

  for (let i = 0; i < count; i++) {
    cells[i] = random() < 0.12 ? 1 : 0;
  }
}

// Organic rule
function roundRule(l, c, r) {
  let out = c;

  if (l !== c) out = l;
  if (r !== c) out = r;

  if (random() < 0.02) out = 1 - out;

  return out;
}

function stepCA() {
  let next = new Array(cells.length);

  for (let i = 0; i < cells.length; i++) {
    let left  = cells[(i - 1 + cells.length) % cells.length];
    let mid   = cells[i];
    let right = cells[(i + 1) % cells.length];
    next[i] = roundRule(left, mid, right);
  }

  cells = next;
  generation++;
}

//noise 
function drawGen() {
  let y = generation * size;

  if (y > height) {
    generation = 0;
    pgCA.background(0);
  }

  let yNorm = generation / (height / size);

  for (let i = 0; i < cells.length; i++) {
    let t = millis() * 0.0025;
    let warp = map(noise(i * 0.11, generation * 0.02, t), 0, 1, -8, 8);
    warp *= (0.5 + yNorm * 1.2);

    let x = i * size + warp;

    let g = lerp(60, 170, yNorm);
    let r = g * 0.6;
    let b = g * 0.3;

    if (!cells[i]) {
      r *= 0.25;
      g *= 0.25;
      b *= 0.25;
    }

    pgCA.noStroke();
    pgCA.fill(r, g, b, 200);
    pgCA.rect(x, y, size, size);
  }
}


//particle shiz
let particles = [];
let numParticles = 10000;

function initParticles() {
  particles = [];
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: 0,
      vy: 0
    });
  }
}
function drawCAOverlay() {
  push();
  noStroke();
  fill(255, 50);
  rect(0, 0, width, height);

  fill(0, 80);
  for (let i = 0; i < 300; i++) {
    let x = floor(random(width));
    let y = floor(random(height));
    rect(x, y, 2, 2);
  }
  

  pop();
}


function setup() {
  createCanvas(700, 700);
  for (let i = 0; i < 20; i++) {
    let type = random(["circle", "square", "triangle"]);
    shapes.push(new Shape(random(width) + 20, random(height)+20, "circle"));
  }
  pixelDensity(1);

  pgCA  = createGraphics(width, height);
  pgMask = createGraphics(width, height);

  initCells();
  initParticles();

  background(0);
}

//draw the shiz
function draw() {
  background(0);
  noStroke();
  fill(0, 10);
  rect(0, 0, width, height);

  loadPixels();
  let t = millis() * 0.00015;
  let mx = map(mouseX, 0, width, -1, 1);
  let my = map(mouseY, 0, height, -1, 1);

  for (let p of particles) {
    let n = noise(p.x * 0.002, p.y * 0.002, t);
    let s = sin((p.x + p.y) * 0.01 + t);
    let f = sin(n * TWO_PI * 1.5 + s * 0.4);

    let angle = f * 2.5 + n * 3.0 + mx * 1.2;

    p.vx = cos(angle) * 0.4 + mx * 0.2;
    p.vy = sin(angle) * 0.4 + my * 0.2;

    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;

    let idx = 4 * (int(p.x) + int(p.y) * width);

   
    let g = 120 + noise(p.y * 0.01, t) * 80;
    let r = g * 0.5;
    let b = g * 0.25;

    pixels[idx]   = r;
    pixels[idx+1] = g;
    pixels[idx+2] = b;
    pixels[idx+3] = 70;
  }


  updatePixels();

pgMask.clear();
pgMask.noStroke();


pgMask.fill(255);

// center circle
pgMask.circle(width/2, height/2, circleSize);

// shapes
for (let s of shapes) {
  s.drawMask(pgMask);
}

let maskedCA = pgCA.get();
maskedCA.mask(pgMask);


image(maskedCA, 0, 0);


  if (millis() - lastStep > delay) {
    lastStep = millis();
    stepCA();
    drawGen();
  }

}
function resetSketch() {
  // reset CA
  initCells();
  generation = 0;
  pgCA.background(0);

  // reset particles
  initParticles();

  // reset shapes
  shapes = [];
  for (let i = 0; i < 20; i++) {
    shapes.push(new Shape(random(width), random(height), "circle"));
  }

  // clear mask
  pgMask.clear();
  lastStep = millis();

  // reset main screen
  background(0);
}
function mousePressed() {
  resetSketch();
}
