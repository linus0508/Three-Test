import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Hintergrundbild
const loader = new THREE.TextureLoader();
loader.load('max-petrunin-yJ-0Mm4gJ2U-unsplash.jpg', function (texture) {
  scene.background = texture;
});

// Würfel mit Textur
const geometry = new THREE.BoxGeometry();
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('Bildschirmfoto 2025-07-11 um 11.43.54.png');
const material = new THREE.MeshBasicMaterial({ map: texture });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const geometry2 = new THREE.BoxGeometry();
const textureLoader2 = new THREE.TextureLoader();
const texture2 = textureLoader.load('Bildschirmfoto 2025-07-11 um 11.42.13.png');
const material2 = new THREE.MeshBasicMaterial({ map: texture2 });
const cube2 = new THREE.Mesh(geometry2, material2);
scene.add(cube2);

cube2.position.x = 10;
cube2.position.y = 1;

// Kamera-Position
camera.position.z = 2;

// OrbitControls aktivieren
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();


let direction = 1;
let targetY = -1;
let targetZ = 0;
// Animation
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // wichtig für Maussteuerung
  renderer.render(scene, camera);
  
  cube.rotation.y += 0.01;
  cube.scale.x += 0.001;
  //camera.position.z += 0.002;

  cube2.rotation.x += 0.01;
  cube2.rotation.y += 0.01;

  if (cube2.position.x > 10) {
    direction = -1;
    targetY = 2;
    targetZ = -2; // im Hintergrund
  } else if (cube2.position.x < -10) {
    direction = 1;
    targetY = -2;
    targetZ = 0; // im Vordergrund
  }
  cube2.position.x += 0.05 * direction;

  // Bewegung in Y langsam interpolieren
  cube2.position.y += (targetY - cube2.position.y) * 0.05;
  cube2.position.z += (targetZ - cube2.position.z) * 0.05;

}
animate();

// Responsives Verhalten
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
