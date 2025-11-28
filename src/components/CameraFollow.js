import { PerspectiveCamera, Vector3 } from 'three';
import { Component } from '../ecs/Component.js';
import { Entity } from '../ecs/Entity.js';

class CameraFollow extends Component {
  /** @type {PerspectiveCamera} */
  camera;

  /** @type {Vector3} */
  offset;

  /**
   * @param {Entity} entity
   * @param {PerspectiveCamera}
   */
  constructor(entity, camera) {
    super(entity);
    this.camera = camera;
    this.offset = new Vector3(0, 0, 0);
  }

  /** Tick forward this component */
  update() {
    const targetPos = this.entity.transform.position.clone().add(this.offset);
    this.camera.position.copy(targetPos);
  }
}

export { CameraFollow };
