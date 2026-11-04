let cols, rows, cellSize;
let grid, nextGrid;
let seedProb = 0.48;
let iterationsPerFrame = 3;
let baseThreshold = 0.5;
let amplitude = 0.38;
let frequency = 2.0;
let phase = 0;
let phaseSpeed = 0.015;
let shapeMode = "circle";

//line class
let lines = [];
let greenPalette = [
  "#E6F5E6",
  "#C2E8C2",
  "#9FDC9F",
  "#7CCF7C",
  "#59C359",
  "#37B637",
  "#1C8A1C",
  "#0F4D0F"
];

let colorIndex = 0;


function setup() {
  createCanvas(900, 600);
  for (let i = 0; i < 1000; i++) lines.push(new Lines());
  pixelDensity(1);
  cellSize = 8;
  cols = floor(width / cellSize);
  rows = floor(height / cellSize);
  grid = makeGrid(cols, rows);
  nextGrid = makeGrid(cols, rows);
  randomSeed(98);
  seedGrid();
  noStroke();
}

function draw() {
  background(255);
  for (let l of lines){
    l.update();
    l.draw();
  }
  for (let it = 0; it < iterationsPerFrame; it++) stepCA();
  renderGrid();
  phase += phaseSpeed;
}
//just makes grid adn fills it with black(not necessary)
function makeGrid(c, r) {
  let a = new Array(r);
  for (let y = 0; y < r; y++) {
    a[y] = new Array(c).fill(0);
  }
  return a;
}
//seeds the rows and grid in general for lifspans 
function seedGrid() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      grid[y][x] = random() < seedProb ? 1 : 0;
    }
  }
}
//computer automatons 
function stepCA() {
  for (let y = 0; y < rows; y++) {
    // row-based threshold modulation (0..1)
    let t = baseThreshold + amplitude * sin(TWO_PI * frequency * (y / rows) + phase);
    // clamp
    t = constrain(t, 0, 1);
    // convert to neighbor cutoff (0..8)
    let cutoff = t * 8.0;
    for (let x = 0; x < cols; x++) {
      let s = neighborSum(x, y);
      nextGrid[y][x] = s >= cutoff ? 1 : 0;
    }
  }
  // swap
  let tmp = grid;
  grid = nextGrid;
  nextGrid = tmp;
}
//checks if neihbour is alive or dead
function neighborSum(x, y) {
  let sum = 0;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      if (ox === 0 && oy === 0) continue;
      let nx = (x + ox + cols) % cols;
      let ny = (y + oy + rows) % rows;
      sum += grid[ny][nx];
    }
  }
  return sum;  
}
//actually renders them in accordance with size
function renderGrid() {
  translate((width - cols * cellSize) / 2, (height - rows * cellSize) / 2);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let cx = x * cellSize + cellSize / 2;
      let cy = y * cellSize + cellSize / 2;
      let s = neighborSum(x, y) + grid[y][x]; // include self for density
      let density = s / 9.0;
      if (grid[y][x] === 0) continue;
      let maxSize = cellSize * 0.95;
      let size = density * maxSize;
      fill(greenPalette[colorIndex]);
      if (shapeMode === "circle") {
        ellipse(cx, cy, size, size);
      } else {
        push();
        translate(cx, cy);
        rotate(0);
        let h = size * (sqrt(3) / 2);
        beginShape();
        vertex(-size / 2, h / 3);
        vertex(size / 2, h / 3);
        vertex(0, -2 * h / 3);
        endShape(CLOSE);
        pop();
      }
    }
  }
}

function keyPressed() {
  if (key === "1"){
    shapeMode = "circle";
    colorIndex = (colorIndex + 1) % greenPalette.length;
  }

  if (key === "2") {
    shapeMode = "triangle";
    colorIndex = (colorIndex + 1) % greenPalette.length;
  }
  if (key === " ") seedGrid();
  if (key === "s" || key === "S") saveCanvas("ca_dither", "png");
}