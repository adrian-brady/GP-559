import { PerspectiveCamera, Vector3 } from 'three';
import { Component } from '../ecs/Component.js';
import { Entity } from '../ecs/Entity.js';
import { PlayerController } from './PlayerController.js';
import { GroundingState, MovementState } from './states/PlayerState.js';

class CameraFollow extends Component {
  /** @type {PerspectiveCamera} */
  camera;
  /** @type {Vector3} */
  offset;

  bobbingEnabled = true;
  bobbingSpeed = 10.0;
  bobbingAmount = 0.05;
  bobbingHorizontal = 0.03;

  bobbingTime = 0;

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
  update(deltaTime) {
    /** @type {PlayerController|null} */
    const playerController = this.entity.getComponent(PlayerController);
    if (!playerController) return;

    const targetPosition = this.entity.transform.position.clone();
    targetPosition.add(this.offset);

    if (this.bobbingEnabled && playerController) {
      const isMoving = playerController.movementState === MovementState.MOVING;
      const isGrounded =
        playerController.groundingState === GroundingState.GROUNDED;

      if (isMoving && isGrounded) {
        this.bobbingTime += deltaTime * this.bobbingSpeed;

        const verticalBob = Math.sin(this.bobbingTime) * this.bobbingAmount;

        const horizontalBob =
          Math.sin(this.bobbingTime * 0.5) * this.bobbingHorizontal;

        targetPosition.y += verticalBob;
        targetPosition.x += horizontalBob;
      } else {
        this.bobbingTime = 0;
      }
    }

    this.camera.position.copy(targetPosition);
  }
}

export { CameraFollow };
