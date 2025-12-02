import { Component } from '../ecs/Component.js';
import RAPIER from '@dimforge/rapier3d-compat';

class RigidBody extends Component {
  /** @type {RAPIER.RigidBody} */
  body;

  /** @type {RAPIER.Collider} */
  collider;

  /**
   *
   * @param {Entity} entity
   * @param {RAPIER.RigidBody} body
   * @param {RAPIER.Collider} collider
   */
  constructor(entity, body, collider) {
    super(entity);
    this.body = body;
    this.collider = collider;
  }
}

export { RigidBody };
