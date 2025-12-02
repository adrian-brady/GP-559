import RAPIER from '@dimforge/rapier3d-compat';
import { EntityManager } from '../managers/EntityManager.js';
import { RigidBody } from '../components/RigidBody.js';

class PhysicsSystem {
  /** @type {RAPIER.World} */
  world;

  /**
   * @param {RAPIER.World} physicsWorld
   */
  constructor(physicsWorld) {
    this.world = physicsWorld;
  }

  /**
   * Step physics and sync to entity transforms
   * @param {EntityManager} entityManager
   * @param {number} deltaTime
   */
  update(entityManager, deltaTime) {
    this.world.step();

    entityManager.entities.forEach(entity => {
      const rigidBody = entity.getComponent(RigidBody);
      if (!rigidBody) {
        return;
      }

      if (rigidBody && rigidBody.body) {
        const translation = rigidBody.body.translation();
        const rotation = rigidBody.body.rotation();

        entity.transform.position.set(
          translation.x,
          translation.y,
          translation.z
        );
        entity.transform.quaternion.set(
          rotation.x,
          rotation.y,
          rotation.z,
          rotation.w
        );
      }
    });
  }
}

export { PhysicsSystem };
