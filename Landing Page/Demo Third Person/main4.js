import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, character, mixer, currentAction;
const actions = {};
const keys = {};
const clock = new THREE.Clock();

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd0d8e8); // Heller, bläulicher Himmel

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Hemisphere Light - heller und etwas bläulicher
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 1.2);
  scene.add(hemiLight);

  // Directional Light - stärker und wärmer für bessere Figur-Ausleuchtung
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  // Boden (Straße) - heller Grau
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x666666 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Grid als Straßenlinien - Weiß und dunkleres Grau für besseren Kontrast
  const grid = new THREE.GridHelper(200, 40, 0xffffff, 0x333333);
  grid.position.y = 0.01;
  scene.add(grid);

  // Figur laden
  const loader = new GLTFLoader();
  loader.load('Generic Male.glb', gltf => {
    character = gltf.scene;
    character.position.set(0, 0, 0);
    character.scale.set(1, 1, 1);
    scene.add(character);

    // Animationen vorbereiten
    mixer = new THREE.AnimationMixer(character);
    gltf.animations.forEach((clip, index) => {
      actions[index] = mixer.clipAction(clip);
    });

    // Animationsübersicht ausgeben (Indices merken!)
    console.log("Verfügbare Animationen:", gltf.animations.map((a, i) => `${i}: ${a.name}`));

    // Idle starten (z. B. Index 5)
    currentAction = actions[5];
    currentAction?.play();
  });

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateCharacter(delta) {
  if (!character) return;

  const speed = 3;
  const rotSpeed = 4;
  const dir = new THREE.Vector3();

  const forward = keys['w'];
  const sprint = keys['p'];
  const backward = keys['s'];
  const left = keys['a'];
  const right = keys['d'];

  if (forward) dir.z -= 1;
  if (sprint) dir.z -= 1;
  if (backward) dir.z += 1;
  if (left) dir.x -= 1;
  if (right) dir.x += 1;

  const isMoving = dir.length() > 0;

  if (isMoving) {
    dir.normalize();

    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraDirection, camera.up).normalize();

    const moveDir = new THREE.Vector3();
    moveDir.copy(cameraDirection).multiplyScalar(-dir.z).add(cameraRight.multiplyScalar(dir.x));
    moveDir.normalize();

    // Charakter dreht in Bewegungsrichtung
    const targetAngle = Math.atan2(moveDir.x, moveDir.z);
    const currentAngle = character.rotation.y;
    let angleDiff = targetAngle - currentAngle;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    character.rotation.y += angleDiff * rotSpeed * delta;

    // Bewegungsgeschwindigkeit (vorwärts oder rückwärts)
    let moveSpeed = speed;
    if (backward) moveSpeed = -speed;
    // Wenn nur seitlich (links/rechts), Bewegung stoppen
    if (!forward && !backward && (left || right)) moveSpeed = 0;
    character.translateZ(moveSpeed * delta);
  }

  // Kamera folgt mit unterschiedlichem Offset je nach Vor-/Rückwärtsbewegung
  const forwardOffset = new THREE.Vector3(0, 3, -6);
  const backwardOffset = new THREE.Vector3(0, 3, 4); // Kamera vor den Charakter ziehen beim Rückwärtsgehen

  let desiredOffset = forwardOffset.clone();
  if (backward && !forward) {
    desiredOffset = backwardOffset.clone();
  }

  // Offset rotieren nach Charakterrotation
  desiredOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), character.rotation.y);

  // Kamera sanft bewegen (Lerp)
  camera.position.lerp(character.position.clone().add(desiredOffset), 0.1);

  // Kamera schaut auf Charakterkopf
  const lookAtPos = character.position.clone().add(new THREE.Vector3(0, 1.5, 0));
  camera.lookAt(lookAtPos);

  // Animationen aktualisieren
  if (mixer) mixer.update(delta);

  let nextAction = null;

  // Beispiel-Indizes (bitte anpassen)
  const idleIndex = 1;
  const walkForwardIndex = 4;
  const sprintForwardIndex = 3;
  const walkBackwardIndex = 4;
  const turnLeftIndex = 4;
  const turnRightIndex = 4;

  if (isMoving) {
    if (forward || backward) {
      if (backward && actions[walkBackwardIndex]) {
        nextAction = actions[walkBackwardIndex];
      } else if (actions[walkForwardIndex]) {
        nextAction = actions[walkForwardIndex];
      } else if (actions[sprintForwardIndex]) {
        nextAction = actions[sprintForwardIndex];
      }
    } else if (left && actions[turnLeftIndex]) {
      nextAction = actions[turnLeftIndex];
    } else if (right && actions[turnRightIndex]) {
      nextAction = actions[turnRightIndex];
    }
  } else {
    nextAction = actions[idleIndex];
  }

  if (nextAction && nextAction !== currentAction) {
    currentAction?.fadeOut(0.2);
    currentAction = nextAction;
    currentAction?.reset().fadeIn(0.2).play();
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  updateCharacter(delta);
  renderer.render(scene, camera);
}
