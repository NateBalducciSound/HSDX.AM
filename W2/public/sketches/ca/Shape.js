class Shape {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = random(40, 80);
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }

  draw() {
    fill(0);
    noStroke();
    
    if (this.type === "circle") {
      ellipse(this.x, this.y, this.size);
    } else if (this.type === "square") {
      rectMode(CENTER);
      rect(this.x, this.y, this.size, this.size);
    } else if (this.type === "triangle") {
      triangle(
        this.x, this.y - this.size / 2,
        this.x - this.size / 2, this.y + this.size / 2,
        this.x + this.size / 2, this.y + this.size / 2
      );
    }
  }


    drawMask(pg) {
    pg.noStroke();
    pg.fill(255);

    if (this.type === "circle") {
      pg.circle(this.x, this.y, this.size);
    } else if (this.type === "square") {
      pg.rect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
    } else if (this.type === "triangle") {
      pg.triangle(
        this.x, this.y - this.size/2,
        this.x - this.size/2, this.y + this.size/2,
        this.x + this.size/2, this.y + this.size/2
      );
    }
  }
}
