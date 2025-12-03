import { PerspectiveCamera, Scene } from 'three';
import { EntityManager } from '../managers/EntityManager.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { World } from '../ecs/World.js';

class GameScene {
  /** @type {Scene} */
  scene;

  /** @type {EntityManager} */
  entityManager;

  /** @type {RAPIER.World} */
  physicsWorld;

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
   * @param {World} world
   */
  async initialize(camera, world) {
    this.physicsWorld = physicsWorld;
  }
}

export { GameScene };
