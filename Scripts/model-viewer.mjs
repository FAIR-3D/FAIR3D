import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/EXRLoader.js';

const container = document.getElementById('model-viewer-container');

// Setup container styling
container.style.width = "100%";
container.style.height = "80vh";
container.style.position = "relative";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1c1c1c);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);

// Camera animation setup
const startPosition = new THREE.Vector3(8, 8, 5);  // High above
const endPosition = new THREE.Vector3(0, 0, 5);    // Final target
let cameraShouldAnimate = false;
let animationStartTime = null;
const animationDuration = 4000; // milliseconds

let targetLookX = 0;
let targetLookY = 0;
let enableLookAtCursor = false;
let modelGroup = new THREE.Group();
scene.add(modelGroup);

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


//         Setup PMREM and load EXR for lighting


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


//           Lighting


const light = new THREE.HemisphereLight(0xffffff, 0x444444);
light.intensity = 0.05; // ✅ dim the ambient light
scene.add(light);
light.visible = false;



// -------------------------------------------- Load the GLB model ---------------------------------------------------------------



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
          mat.emissive = new THREE.Color(0xffffff); // Let texture show fully
          mat.emissiveIntensity = 1;

          if (mat.emissiveMap) {
            mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
            mat.emissiveMap.needsUpdate = true;
          }

          mat.needsUpdate = true;
        }        

        if (mat.name === 'CircuitFlat') {
          mat.emissive = new THREE.Color(0xffffff);      // Allow full brightness of map
          mat.emissiveIntensity = 1;

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


// --------------------------------------------------------- LB model G---------------------------------------------------------------


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

// Animate with easing
function animate() {
  requestAnimationFrame(animate);

  if (cameraShouldAnimate) {
    const now = performance.now();
    const elapsed = now - animationStartTime;
    const t = Math.min(elapsed / animationDuration, 1); // normalized 0–1

    // Ease-out cubic
    const easeOut = 1 - Math.pow(1 - t, 5);

    const newPosition = new THREE.Vector3().lerpVectors(startPosition, endPosition, easeOut);
    camera.position.copy(newPosition);
    currentLook.lerpVectors(lookStart, lookEnd, easeOut);
    camera.lookAt(currentLook);

    if (t >= 1) {
      cameraShouldAnimate = false;
    }
  }

  if (window.animatableParts) {
    const { pins, spinner } = window.animatableParts;

    if (pins) pins.rotation.x += 0.01;     // Slow spin
    if (spinner) spinner.rotation.x += 0.02; // Faster spin
  }  

  if (enableLookAtCursor) {
    modelGroup.rotation.y += (targetLookY - modelGroup.rotation.y) * 0.03;
    modelGroup.rotation.x += (targetLookX - modelGroup.rotation.x) * 0.03;
  }

  renderer.render(scene, camera);
}
animate();

// Trigger function from outside
window.startCameraReveal = () => {
  camera.position.copy(startPosition);

  setTimeout(() => {
    animationStartTime = performance.now();
    cameraShouldAnimate = true;
  }, 800); // delay in milliseconds (e.g. 500ms = half a second)
};


// Model Rotation


document.addEventListener('mousemove', (event) => {
  const x = (event.clientX / window.innerWidth) - 0.5;
  const y = (event.clientY / window.innerHeight) - 0.5;

  targetLookY = x * 0.45; // Max ±10° in radians
  targetLookX = y * 0.45;
});

// Model Rotation


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


// Responsive resize

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
