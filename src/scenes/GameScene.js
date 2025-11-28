import { PerspectiveCamera, Scene } from 'three';
import { EntityManager } from '../managers/EntityManager.js';

class GameScene {
  /** @type {Scene} */
  scene;

  /** @type {EntityManager} */
  entityManager;

  /**
   * @param {Scene} scene Three.js scene
   * @param {EntityManager} entityManager
   */
  constructor(scene, entityManager) {
    this.scene = scene;
    this.entityManager = entityManager;
  }

  /**
   * Override to setup scene entities and components
   * @param {PerspectiveCamera} camera
   */
  initialize(camera) {}
}

export { GameScene };
