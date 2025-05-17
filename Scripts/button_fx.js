document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("enter-site");
  const fxLayer = document.getElementById("intro-effects-layer");

  // Glitch effect loop on idle
  const span = button.querySelector("span");
  const chars = "▶ ENTER";
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  let glitchInterval = setInterval(() => {
    if (!button.matches(':hover')) {
      span.textContent = chars.split('').map((char, i) => {
        if (i === 0) return char; // 🔐 Keep ▶ intact
        return Math.random() > 0.9
          ? alphabet[Math.floor(Math.random() * alphabet.length)]
          : char;
      }).join('');
    } else {
      span.textContent = chars;
    }
  }, 1000);

  // Click effects: sparks and shockwave (from outside the button)
  button.addEventListener("click", () => {
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // === SPARK BURST ===
    for (let i = 0; i < 12; i++) {
      const spark = document.createElement("div");
      spark.className = "spark";

      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * 40 + 20;
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius;

      spark.style.left = `${centerX}px`;
      spark.style.top = `${centerY}px`;
      spark.style.setProperty('--dx', `${dx}px`);
      spark.style.setProperty('--dy', `${dy}px`);

      fxLayer.appendChild(spark);
      setTimeout(() => spark.remove(), 800);
    }

    // === SHOCKWAVE ===
    const wave = document.createElement("div");
    wave.className = "shockwave";
    wave.style.left = `${centerX}px`;
    wave.style.top = `${centerY}px`;
    fxLayer.appendChild(wave);
    setTimeout(() => wave.remove(), 800);
  });
});
