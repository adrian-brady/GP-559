import { Component } from '../ecs/Component.js';
import RAPIER from '@dimforge/rapier3d-compat';

class RigidBody extends Component {
  /** @type {RAPIER.RigidBody} */
  body;

  /** @type {RAPIER.Collider} */
  collider;

  /** @type {RAPIER.World} */
  physicsWorld;

  /**
   *
   * @param {Entity} entity
   * @param {RAPIER.RigidBody} body
   * @param {RAPIER.Collider} collider
   * @param {RAPIER.World} physicsWorld
   */
  constructor(entity, body, collider, physicsWorld) {
    super(entity);
    this.body = body;
    this.collider = collider;
    this.physicsWorld = physicsWorld;
  }

  /**
   * Clean up physics resources
   */
  cleanup() {
    if (!this.physicsWorld) {
      console.warn('No physics world reference, cannot cleanup rigid body');
      return;
    }

    if (this.collider) {
      this.physicsWorld.removeCollider(this.collider, false);
      this.collider = null;
    }

    if (this.body) {
      this.physicsWorld.removeRigidBody(this.body);
      this.body = null;
    }
  }

  disable() {
    if (this.body) {
      this.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased);
    }
  }

  enable() {
    if (this.body) {
      this.body.setBodyType(RAPIER.RigidBodyType.Dynamic);
    }
  }
}

export { RigidBody };
