import { Object3D } from 'three';
import { Entity } from '../ecs/Entity.js';
import { SafeArray } from '../utils/SafeArray.js';

class EntityManager {
  /** @type {SafeArray<Entity>} */
  entities;

  constructor() {
    this.entities = new SafeArray();
  }

  /**
   * Queues an entity for addition
   * @param {Object3D} parent The parent Object3D of the entity
   * @param {string} name The name of the entity
   * @returns {Entity} The created entity
   */
  createEntity(parent, name) {
    const entity = new Entity(parent, name);
    this.entities.add(entity);
    return entity;
  }

  /**
   * Queues an entity for removal
   * @param {Entity} entity
   */
  removeEntity(entity) {
    this.entities.removeEntity(entity);
  }

  /** Update each entity one tick */
  update() {
    this.entities.forEach(entity => entity.update());
  }
}

export { EntityManager };
