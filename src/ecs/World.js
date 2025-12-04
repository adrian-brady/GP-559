import {
  PCFShadowMap,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { EntityManager } from '../managers/EntityManager.js';
import { GameScene } from '../scenes/GameScene.js';
import { InputSystem } from '../systems/InputSystem.js';
import {
  init as initRapier,
  World as RapierWorld,
} from '@dimforge/rapier3d-compat';

import RAPIER from '@dimforge/rapier3d-compat';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { EntitySpawner } from '../systems/EntitySpawner.js';
import { DecalSystem } from '../systems/DecalSystem.js';
import { AmmoCounter } from '../ui/AmmoCounter.js';

/**
 * Main world/scene manager
 */
class World {
  /** @type {Scene} */
  scene;

  /** @type {PerspectiveCamera} */
  camera;

  /** @type {EntityManager} */
  entityManager;

  /** @type {HTMLElement} */
  container;

  /** @type {WebGLRenderer} */
  renderer;

  /** @type {GameScene} */
  currentScene;

  /** @type {RAPIER.World} */
  physicsWorld;

  /** @type {PhysicsSystem} */
  physicsSystem;

  /** @type {InputSystem} */
  inputSystem;

  /** @type {EntitySpawner} */
  entitySpawner;

  /** @type {DecalSystem} */
  decalSystem;

  /** @type {AmmoCounter} */
  ammoCounter;

  /**
   * @param {HTMLElement} container
   * @param {typeof GameScene} SceneClass
   */
  constructor(container, SceneClass) {
    this.scene = new Scene();
    this.entityManager = new EntityManager(this.scene);
    this.container = container;
    this.currentScene = new SceneClass(this.scene, this.entityManager);
    this.entitySpawner = null;
  }

  /**
   * Start and initialize game loop
   */
  async start() {
    await initRapier();
    const gravity = { x: 0.0, y: -12, z: 0.0 };
    this.physicsWorld = new RapierWorld(gravity);
    this.physicsSystem = new PhysicsSystem(this.physicsWorld);

    this.ammoCounter = new AmmoCounter();

    this.decalSystem = new DecalSystem(this.scene);

    this.setupRenderer();
    this.setupCamera();
    this.onWindowResize();

    this.entitySpawner = new EntitySpawner(
      this.scene,
      this.entityManager,
      this.physicsWorld,
      this.decalSystem
    );

    this.inputSystem.setEntitySpawner(this.entitySpawner);
    this.inputSystem.initialize();

    await this.currentScene.initialize(
      this.camera,
      this.physicsWorld,
      this.decalSystem,
      this.ammoCounter
    );

    window.addEventListener('resize', () => this.onWindowResize());

    let lastTime = Date.now();
    const animate = () => {
      requestAnimationFrame(animate);

      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      this.update(deltaTime);
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * Setup WebGL renderer
   */
  setupRenderer() {
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Setup perspective camera
   */
  setupCamera() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new PerspectiveCamera(90, width / height, 0.01, 1000);
    this.camera.position.z = 5;
    this.inputSystem = new InputSystem(this.entityManager, this.camera);
    this.scene.add(this.camera);
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Update all world entities
   * @param {number} deltaTime
   */
  update(deltaTime) {
    this.inputSystem.update();
    this.physicsSystem.update(this.entityManager, deltaTime);
    this.decalSystem.update(deltaTime);

    this.entityManager.entities.forEach(entity => {
      entity.update(deltaTime);
    });
  }
}

export { World };
