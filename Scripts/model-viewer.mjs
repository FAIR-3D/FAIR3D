/* -------------------------------------------------- */
/* -------------------- IMPORTS --------------------- */
/* -------------------------------------------------- */


import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/EXRLoader.js';

const container = document.getElementById('model-viewer-container');


/* -------------------------------------------------- */
/* ----------------- MODEL CONTAINER ---------------- */
/* -------------------------------------------------- */


container.style.width = "100%";
container.style.height = "80vh";
container.style.position = "relative";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1c1c1c);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);


/* -------------------------------------------------- */
/* ------------------- MODEL CAMERA ----------------- */
/* -------------------------------------------------- */


const startPosition = new THREE.Vector3(8, 8, 5);  // Camera Start Position
const endPosition = new THREE.Vector3(0, 0, 5);    // Camera End Position
let cameraShouldAnimate = false;
let animationStartTime = null;
const animationDuration = 4000; // Camera Animation Duration

let targetLookX = 0;
let targetLookY = 0;
let enableLookAtCursor = false;
let modelGroup = new THREE.Group();
scene.add(modelGroup);

let circuitEmitters = [];
let sparkParticles = [];
let lastSparkTime = 0;
let allowSparkSound = false;
let ventEmitters = [];

const lookStart = new THREE.Vector3(0, 8, 0); // look upward initially
const lookEnd = new THREE.Vector3(0, 0, 0);   // look down at model
const currentLook = new THREE.Vector3();      // dynamic lerp result

camera.position.copy(startPosition); // Initial position

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
const width = container.offsetWidth;
const height = container.offsetHeight;
renderer.setSize(width, height);
camera.aspect = width / height;
camera.updateProjectionMatrix();
container.appendChild(renderer.domElement);


/* -------------------------------------------------- */
/* -------------------- HDRI / EXR ------------------ */
/* -------------------------------------------------- */


const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const exrLoader = new EXRLoader();
exrLoader.load('Models/MachineShop.exr', (texture) => {
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;

  scene.environment = envMap;       // ✅ Lighting only
  scene.background = null;          // 🚫 No visible background

  texture.dispose();
  pmremGenerator.dispose();
});


/* -------------------------------------------------- */
/* -------------------- LOAD MODEL ------------------ */
/* -------------------------------------------------- */



const loader = new GLTFLoader();
loader.load('Models/FAIR3DWheel.glb',
  (gltf) => {
    const model = gltf.scene;

    let pins = null;
    let spinner = null;

    model.traverse((child) => {
      if (child.isMesh) {
        if (child.name === 'PINS') pins = child;
        if (child.name === 'SPINNER') spinner = child;
      }
    });

    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = child.material;

        // 💡 Find the target material
        if (mat.name === 'TextColor.001') {
          mat.emissive = new THREE.Color(0xffd694); // Or use Blender color
          mat.emissiveIntensity = 5.675; // Match Blender value
        }

        if (mat.name === 'Lightbar') {
          mat.emissive = new THREE.Color(0xffffff); // Or use Blender color
          mat.emissiveIntensity = 4.300; // Match Blender value
        }    

      if (mat.name === 'Vent') {
        const emissiveTex = new THREE.TextureLoader().load('../Models/VentsEmit.jpg');
        emissiveTex.colorSpace = THREE.SRGBColorSpace;
        emissiveTex.wrapS = emissiveTex.wrapT = THREE.RepeatWrapping;
        emissiveTex.needsUpdate = true;

        mat.emissive = new THREE.Color(0xffffff);
        mat.emissiveMap = emissiveTex;
        mat.emissiveIntensity = 1;

        ventEmitters.push(child);

        mat.needsUpdate = true;
      }

        if (mat.name === 'CircuitFlat') {
          mat.emissive = new THREE.Color(0xffffff);      // Allow full brightness of map
          mat.emissiveIntensity = 1;
          circuitEmitters.push(child);  // 👈 Track this for sparks

          // Optional: boost clarity
          if (mat.emissiveMap) {
            mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
            mat.emissiveMap.needsUpdate = true;
          }

          mat.needsUpdate = true;
        }        

        if (mat.name === 'OuterShell') {
          mat.emissive = new THREE.Color(0xffffff);
          mat.emissiveIntensity = 0.250;
        
          if (mat.emissiveMap) {
            mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
            mat.emissiveMap.needsUpdate = true;
          }
        
          // ✅ Add Roughness Map
          const roughTex = new THREE.TextureLoader().load('Models/ShellR.jpg');
          roughTex.colorSpace = THREE.NoColorSpace;
          roughTex.needsUpdate = true;
        
          mat.roughnessMap = roughTex;
          mat.roughness = 1.0;
        
          mat.needsUpdate = true;
        }

      }
    });

    if (window.innerWidth < 768) {
      model.scale.set(1.35, 1.35, 1.35); // Smaller on mobile
      camera.fov = 65;                // Wider view
      camera.updateProjectionMatrix();
    } else {
      model.scale.set(1.5, 1.5, 1.5); // Normal on desktop
    }
    model.rotation.set(
      THREE.MathUtils.degToRad(0),
      THREE.MathUtils.degToRad(90),
      THREE.MathUtils.degToRad(0)
    );

    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.sub(center);

    modelGroup.add(model);
    window.animatableParts = { pins, spinner };




    // ✅ Hide loader, show intro screen
    const loaderScreen = document.getElementById('loader-screen');
    if (loaderScreen) loaderScreen.remove();

    const introScreen = document.getElementById('intro-screen');
    if (introScreen) introScreen.classList.remove('hidden');
  },
  (xhr) => {
    // Progress update
    const percent = xhr.loaded / xhr.total * 100;
    const bar = document.getElementById('loader-bar');
    if (bar) bar.style.width = `${percent.toFixed(0)}%`;
  },
  (error) => {
    console.error('Error loading GLB model:', error);
    const loaderScreen = document.getElementById('loader-screen');
    if (loaderScreen) loaderScreen.remove();

    const introScreen = document.getElementById('intro-screen');
    if (introScreen) introScreen.classList.remove('hidden');
  }
);


/* -------------------------------------------------- */
/* ------------------ MODEL ANIMATION --------------- */
/* -------------------------------------------------- */


function spawnSpark(position, normal) {
  const geometry = new THREE.SphereGeometry(0.015, 4, 4);
  const baseColor = new THREE.Color('#cef6f6');

  const material = new THREE.MeshBasicMaterial({ 
    color: baseColor.clone(),
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const spark = new THREE.Mesh(geometry, material);
  spark.position.copy(position);
  spark.life = 1.0;

  // 🚀 Launch out from surface normal with random variation
  const variance = new THREE.Vector3(
    (Math.random() - 0.5) * 0.02,
    (Math.random() - 0.5) * 0.02,
    (Math.random() - 0.5) * 0.02
  );
  const baseSpeed = 0.08 + Math.random() * 0.02; // 💨 faster punch
  const upwardBoost = new THREE.Vector3(0, 0.05, 0); // ⬆️ more lift

  spark.velocity = normal.clone()
    .multiplyScalar(baseSpeed)
    .add(upwardBoost)
    .add(variance);

  // 💨 Trail setup
  const trailGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(),
    new THREE.Vector3(0, -0.2, 0)
  ]);
  const trailMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00ffff, 
    transparent: true,
    opacity: 0.4
  });
  const trail = new THREE.Line(trailGeometry, trailMaterial);
  spark.add(trail);

  spark.trail = trail;
  scene.add(spark);
  sparkParticles.push(spark);
}

function animate() {
  requestAnimationFrame(animate);
  

  const now = performance.now();

  if (cameraShouldAnimate) {
    const elapsed = now - animationStartTime;
    const t = Math.min(elapsed / animationDuration, 1);
    const easeOut = 1 - Math.pow(1 - t, 5);
    const newPosition = new THREE.Vector3().lerpVectors(startPosition, endPosition, easeOut);
    camera.position.copy(newPosition);
    currentLook.lerpVectors(lookStart, lookEnd, easeOut);
    camera.lookAt(currentLook);

    if (t >= 1) {
      cameraShouldAnimate = false;
    }
  }

  if (now - lastSparkTime > 12000 && circuitEmitters.length > 0) {
    lastSparkTime = now;
    const mesh = circuitEmitters[Math.floor(Math.random() * circuitEmitters.length)];
    const { position, normal } = getRandomPointAndNormal(mesh);

    const punchStrength = 20; // 💥 number of sparks

    for (let i = 0; i < punchStrength; i++) {
      // Vary normal slightly for spread
      const jitter = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      );
      const variedNormal = normal.clone().add(jitter).normalize();

      spawnSpark(position, variedNormal);
    }
    if (allowSparkSound && typeof window.playSparkSound === 'function') {
      window.playSparkSound();
    }
  }

  // ✨ Update sparks
  for (let i = sparkParticles.length - 1; i >= 0; i--) {
    const spark = sparkParticles[i];

    // 🌍 Apply gravity + movement
    spark.velocity.y -= 0.005;
    spark.position.add(spark.velocity);

    // 💫 Update trail
    if (spark.trail) {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3().copy(spark.velocity).negate()
      ];
      spark.trail.geometry.setFromPoints(points);
      spark.trail.material.opacity = spark.life * 0.4;
    }

    spark.life -= 0.02;
    spark.material.opacity = spark.life;
    spark.scale.setScalar(spark.life);

    // Fade color toward darker version of base
    const fadedColor = new THREE.Color('#cef6f6').multiplyScalar(spark.life);
    spark.material.color.copy(fadedColor);

    if (spark.life <= 0) {
      scene.remove(spark);
      sparkParticles.splice(i, 1);
    }
  }

  if (window.animatableParts) {
    const { pins, spinner } = window.animatableParts;
    if (pins) pins.rotation.x += 0.01;
    if (spinner) spinner.rotation.x += 0.02;
  }

  if (enableLookAtCursor) {
    modelGroup.rotation.y += (targetLookY - modelGroup.rotation.y) * 0.03;
    modelGroup.rotation.x += (targetLookX - modelGroup.rotation.x) * 0.03;
  }

  if (ventEmitters.length > 0 && Math.random() < 0.03) { // 3% chance per frame
    const mesh = ventEmitters[Math.floor(Math.random() * ventEmitters.length)];

    const pulse = 1 + Math.random() * 3; // Glow from 1 to 4
    mesh.material.emissiveIntensity = pulse;

    setTimeout(() => {
      mesh.material.emissiveIntensity = 1;
    }, 100 + Math.random() * 200); // Hold 100–300ms
  }

  renderer.render(scene, camera);
}

function getRandomPointAndNormal(mesh) {
  const posAttr = mesh.geometry.attributes.position;
  const indexAttr = mesh.geometry.index;
  const normalAttr = mesh.geometry.attributes.normal;

  const triangleIndex = Math.floor(Math.random() * (indexAttr ? indexAttr.count / 3 : posAttr.count / 3));

  const i0 = indexAttr ? indexAttr.getX(triangleIndex * 3) : triangleIndex * 3;
  const i1 = indexAttr ? indexAttr.getX(triangleIndex * 3 + 1) : triangleIndex * 3 + 1;
  const i2 = indexAttr ? indexAttr.getX(triangleIndex * 3 + 2) : triangleIndex * 3 + 2;

  const a = new THREE.Vector3().fromBufferAttribute(posAttr, i0);
  const b = new THREE.Vector3().fromBufferAttribute(posAttr, i1);
  const c = new THREE.Vector3().fromBufferAttribute(posAttr, i2);

  const na = new THREE.Vector3().fromBufferAttribute(normalAttr, i0);
  const nb = new THREE.Vector3().fromBufferAttribute(normalAttr, i1);
  const nc = new THREE.Vector3().fromBufferAttribute(normalAttr, i2);

  let r1 = Math.random();
  let r2 = Math.random();
  if (r1 + r2 > 1) {
    r1 = 1 - r1;
    r2 = 1 - r2;
  }

  const p = new THREE.Vector3()
    .addScaledVector(a, 1 - r1 - r2)
    .addScaledVector(b, r1)
    .addScaledVector(c, r2);

  const n = new THREE.Vector3()
    .addScaledVector(na, 1 - r1 - r2)
    .addScaledVector(nb, r1)
    .addScaledVector(nc, r2)
    .normalize();

  return {
    position: mesh.localToWorld(p),
    normal: mesh.localToWorld(n).sub(mesh.getWorldPosition(new THREE.Vector3())).normalize()
  };
}



animate();

// Trigger function from outside
window.startCameraReveal = () => {
  camera.position.copy(startPosition);

  setTimeout(() => {
    animationStartTime = performance.now();
    cameraShouldAnimate = true;
    allowSparkSound = true;
  }, 800); // delay in milliseconds (e.g. 500ms = half a second)
};




/* -------------------------------------------------- */
/* ------------------- FOLLOW CURSOR ---------------- */
/* -------------------------------------------------- */


document.addEventListener('mousemove', (event) => {
  const x = (event.clientX / window.innerWidth) - 0.5;
  const y = (event.clientY / window.innerHeight) - 0.5;

  targetLookY = x * 0.45; // Max ±10° in radians
  targetLookX = y * 0.45;
});

let lastTouchX = null;
let lastTouchY = null;

document.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  }
});

document.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1) {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const deltaX = currentX - lastTouchX;
    const deltaY = currentY - lastTouchY;

    lastTouchX = currentX;
    lastTouchY = currentY;

    targetLookY += deltaX * 0.002;
    targetLookX += deltaY * 0.002;
  }
});

window.startModelMouseTracking = () => {
  enableLookAtCursor = true;
};


/* -------------------------------------------------- */
/* ----------------- RESPONSIVE RESIZE -------------- */
/* -------------------------------------------------- */


window.resizeRenderer = () => {
  const width = container.offsetWidth;
  const height = container.offsetHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  if (camera) {
    if (window.innerWidth < 768) {
      camera.fov = 65;
    } else {
      camera.fov = 45;
    }
    camera.updateProjectionMatrix();
  }
};

window.addEventListener('resize', window.resizeRenderer);

document.addEventListener('fullscreenchange', () => {
  setTimeout(() => window.resizeRenderer(), 50);
});

if ('ResizeObserver' in window) {
  const resizeObserver = new ResizeObserver(() => {
    window.resizeRenderer();
  });

  resizeObserver.observe(container);
}
