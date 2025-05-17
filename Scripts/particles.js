document.addEventListener("DOMContentLoaded", () => {
  const introScreen = document.getElementById("intro-screen");

  // Create canvas for particles
  const canvas = document.createElement("canvas");
  canvas.id = "intro-particles";
  introScreen.insertBefore(canvas, introScreen.firstChild); // insert before content
  const ctx = canvas.getContext("2d");

  let width, height;
  let particles = [];

  function resize() {
    width = canvas.width = introScreen.clientWidth;
    height = canvas.height = introScreen.clientHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
      const centerX = width / 2;
      const centerY = height / 2;

      switch (edge) {
        case 0: // top
          this.x = Math.random() * width;
          this.y = 0;
          break;
        case 1: // right
          this.x = width;
          this.y = Math.random() * height;
          break;
        case 2: // bottom
          this.x = Math.random() * width;
          this.y = height;
          break;
        case 3: // left
          this.x = 0;
          this.y = Math.random() * height;
          break;
      }

      // Velocity vector toward center
      const dx = centerX - this.x;
      const dy = centerY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = Math.random() * 1.5 + 0.5;

      this.vx = (dx / dist) * speed;
      this.vy = (dy / dist) * speed;

      this.radius = Math.random() * 1.5 + 0.5;
      this.alpha = Math.random() * 0.5 + 0.3;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      const button = document.getElementById('enter-site');
      const buttonRect = button.getBoundingClientRect();

      const centerX = buttonRect.left + buttonRect.width / 2;
      const centerY = buttonRect.top + buttonRect.height / 2;

      // Update velocity based on new center
      const dx = centerX - this.x;
      const dy = centerY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = Math.hypot(this.vx, this.vy);

      this.vx = (dx / dist) * speed;
      this.vy = (dy / dist) * speed;

      const distToCenter = Math.hypot(dx, dy);
if (distToCenter < 20) this.reset();
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(255, 229, 212, ${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < 200; i++) {
    particles.push(new Particle());
  }

  // Pre-run update frames to populate canvas with particles in motion
  for (let i = 0; i < 60; i++) {
    particles.forEach(p => p.update());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw(ctx);
    });
    requestAnimationFrame(animate);
  }

  animate();
});
