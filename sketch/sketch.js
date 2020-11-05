params[0] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
params[1] = [11,12,13];

let paraname = [];
paraname[0] = "melody";
paraname[1] = "drum";
for (const p of paraname) {
  document.getElementById("param-select").appendChild(setOption(p));
}

let balls = [];
function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < 10; i++) {
    balls.push(new Ball());
  }
}

let tmp;
let bgCol = [255, 255, 255];
function draw() {
  const isInputed = tmp !== lastInputs;
  background(bgCol[0], bgCol[1], bgCol[2]);
  if (isInputed) {
    for (const i of params[0]) {
        console.log(vjEvents.indexOf(i))
      if (vjEvents.indexOf(i) !== -1) {
        balls[i].setTarget(random(windowWidth), random(windowHeight));
      }
    }
    for (const e of vjEvents) {
      for (let i = 0; i < params[1].length; i++) {
        if (e === params[1][i]) {
          bgCol[i] = 0;
        }
      }
    }
  }
  for (const b of balls) {
    b.draw();
  }
  bgCol[0] += 2;
  bgCol[1] += 2;
  bgCol[2] += 2;

  tmp = lastInputs;
}

class Ball {
  constructor() {
    this.x = -300;
    this.y = -300;
    this.tx = -300;
    this.ty = -300;
    this.size = 20 + random(200);
  }
  draw() {
    const e = 0.1;
    const dx = this.tx - this.x;
    this.x += dx * e;
    const dy = this.ty - this.y;
    this.y += dy * e;
    fill(255);
    if (abs(dx) > 30 || abs(dy) > 30) fill(0);
    ellipse(this.x, this.y, this.size);
  }

  setTarget(tx, ty) {
    this.tx = tx;
    this.ty = ty;
  }
}
