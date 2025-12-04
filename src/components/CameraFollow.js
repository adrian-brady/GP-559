import { PerspectiveCamera, Vector3 } from 'three';
import { Component } from '../ecs/Component.js';
import { Entity } from '../ecs/Entity.js';
import { PlayerController } from './PlayerController.js';
import {
  GroundingState,
  MovementState,
  StanceState,
} from './states/PlayerState.js';

class CameraFollow extends Component {
  /** @type {PerspectiveCamera} */
  camera;
  /** @type {Vector3} */
  offset;

  baseFOV = 75;
  currentFOV = 75;
  adsFOVReduction = 20;

  bobbingEnabled = true;
  bobbingSpeed = 8;
  bobbingAmount = 0.05;
  bobbingHorizontal = 0.03;
  bobbingTime = 0;

  standingHeight = 0.5;
  crouchingHeight = 0;
  proneHeight = -0.4;

  currentHeight = 0.5;
  heightTransitionSpeed = 6.0;

  /**
   * @param {Entity} entity
   * @param {PerspectiveCamera}
   */
  constructor(entity, camera) {
    super(entity);
    this.camera = camera;
    this.offset = new Vector3(0, 0, 0);

    this.baseFOV = camera.fov;
    this.currentFOV = camera.fov;
  }

  /**
   * Update FOV based on ADS state
   */
  updateFOV(deltaTime, isADS, targetFOVReduction, transitionSpeed) {
    const targetFOV = isADS ? this.baseFOV - targetFOVReduction : this.baseFOV;

    const lerpFactor = 1 - Math.exp(-transitionSpeed * deltaTime);
    this.currentFOV += (targetFOV - this.currentFOV) * lerpFactor;

    this.camera.fov = this.currentFOV;
    this.camera.updateProjectionMatrix();
  }

  /** Tick forward this component */
  update(deltaTime) {
    /** @type {PlayerController|null} */
    const playerController = this.entity.getComponent(PlayerController);
    if (!playerController) return;

    let targetHeight = this.standingHeight;

    if (playerController.stanceState === StanceState.CROUCHING) {
      targetHeight = this.crouchingHeight;
    } else if (playerController.stanceState === StanceState.PRONE) {
      targetHeight = this.proneHeight;
    }

    this.currentHeight +=
      (targetHeight - this.currentHeight) *
      this.heightTransitionSpeed *
      deltaTime;

    const targetPosition = this.entity.transform.position.clone();
    targetPosition.x += this.offset.x;
    targetPosition.y += this.currentHeight;
    targetPosition.z += this.offset.z;

    if (this.bobbingEnabled && playerController) {
      const isMoving = playerController.movementState === MovementState.MOVING;
      const isGrounded =
        playerController.groundingState === GroundingState.GROUNDED;
      const isNotProne = playerController.stanceState !== StanceState.PRONE;

      if (isMoving && isGrounded && isNotProne) {
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
