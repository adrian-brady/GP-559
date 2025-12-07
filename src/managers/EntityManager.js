import { Object3D } from 'three';
import { Entity } from '../ecs/Entity.js';
import { SafeArray } from '../utils/SafeArray.js';
import { RigidBody } from '../components/RigidBody.js';

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
    this.entities.remove(entity);
  }

  cleanupDeadEntities() {
    const entitiesToRemove = [];

    this.entities.forEach(entity => {
      if (entity.markedForDeath) {
        entitiesToRemove.push(entity);
      }
    });

    entitiesToRemove.forEach(entity => {
      /** @type {RigidBody} */
      const rigidBody = entity.getComponent(RigidBody);
      if (rigidBody) {
        rigidBody.cleanup();
      }
      if (entity.transform.parent) {
        entity.transform.parent.remove(entity.transform);
      }

      this.removeEntity(entity);
    });

    return entitiesToRemove.length;
  }

  /** Update each entity one tick */
  update() {
    this.entities.forEach(entity => entity.update());
  }
}

export { EntityManager };
