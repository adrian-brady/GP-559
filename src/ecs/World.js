import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { EntityManager } from '../managers/EntityManager.js';
import { GameScene } from '../scenes/GameScene.js';
import { InputSystem } from '../systems/InputSystem.js';

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

  /**
   * @param {HTMLElement} container
   * @param {typeof GameScene} SceneClass
   */
  constructor(container, SceneClass) {
    this.scene = new Scene();
    this.entityManager = new EntityManager(this.scene);
    this.container = container;
    this.currentScene = new SceneClass(this.scene, this.entityManager);
  }

  /**
   * Start and initialize game loop
   */
  start() {
    this.setupRenderer();
    this.setupCamera();
    this.onWindowResize();
    this.inputSystem.initialize();
    this.currentScene.initialize(this.camera);

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
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Setup perspective camera
   */
  setupCamera() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new PerspectiveCamera(90, width / height, 0.1, 1000);
    this.camera.position.z = 5;
    this.inputSystem = new InputSystem(this.entityManager, this.camera);
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

    this.entityManager.entities.forEach(entity => {
      entity.update(deltaTime);
    });
  }
}

export { World };
