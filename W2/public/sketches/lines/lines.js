// globals for class


class Lines {
    constructor(){
        this.x = random (100);
        this.y = random (1,900);
        this.len = random (2000);
        this.alpha = random (20,120);
        this.off = random (50);
        this.wander = random(0.002, 0.01);
        this.speed = random (0.2, 0.6);
        this.dir = random ([-2,2]);
    }

    update(){

        this.off += this.wander;
        this.x += this.dir * this.speed * noise(this.off);
        this.y += sin (this.off * 2) * 0.3;
        if (this.x <  -200) this.x = width + 200;
         if (this.x >  200) this.x = width - 1000;
          if (this.y <  -100) this.y = height   + 200;
           if (this.y >  1000) this.y = width - 200;
    }
    draw() {
        stroke(0, this.alpha);
        strokeWeight(0.6);
        noFill();
        let wav = this.len * 0.25;  
        beginShape();
        for(let i = 0; i <= 1; i += 0.05){
            let nx = this.x + i  * this.len;
            let ny = this.y + sin((this.off + i)*4) * wav * noise(this.off + i * 10) * 0.1;
            vertex(nx,ny);
        }
            endShape();
    }
    
}   