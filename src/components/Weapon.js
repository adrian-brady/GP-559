import { Group, Mesh, PerspectiveCamera } from 'three';
import { Component } from '../ecs/Component.js';
import { CameraFollow } from './CameraFollow.js';
import { PlayerController } from './PlayerController.js';

class Weapon extends Component {
  /** @type {PerspectiveCamera} */
  camera;

  /** @type {Group} */
  weaponGroup;

  /** @type {Mesh} */
  weaponMesh;

  // Weapon position relative to camera
  // Right, Down, Forward
  weaponOffset = { x: 0.3, y: -0.2, z: -0.5 };

  lastCameraBob = { x: 0, y: 0 };

  bobbingTime = 0;
  bobbingSpeed = 10;
  bobbingAmount = 0.02;
  bobbingHorizontal = 0.015;
  bobbingRotation = 0.05;
  bobbingLerpSpeed = 8;

  currentBobX = 0;
  currentBobY = 0;
  currentBobRotZ = 0;

  constructor(entity, camera, weaponMesh) {
    super(entity);
    this.camera = camera;
    this.weaponMesh = weaponMesh;

    this.weaponGroup = new Group();
    this.weaponGroup.position.set(
      this.weaponOffset.x,
      this.weaponOffset.y,
      this.weaponOffset.z
    );
    this.weaponGroup.add(weaponMesh);

    this.camera.add(this.weaponGroup);
  }

  /**
   * Update weapon to cancel out camera bobbing
   * @param {number} deltaTime
   */
  update(deltaTime) {
    /** @type {CameraFollow|null} */
    const cameraFollow = this.entity.getComponent(CameraFollow);
    if (!cameraFollow) return;

    /** @type {PlayerController|null} */
    const playerController = this.entity.getComponent(PlayerController);
    if (!playerController) return;

    let currentCameraBobX = 0;
    let currentCameraBobY = 0;

    if (
      cameraFollow.bobbingEnabled &&
      playerController.isMoving() &&
      playerController.isGrounded() &&
      !playerController.isProne()
    ) {
      currentCameraBobY =
        Math.sin(cameraFollow.bobbingTime) * cameraFollow.bobbingAmount;
      currentCameraBobX =
        Math.sin(cameraFollow.bobbingTime * 0.5) *
        cameraFollow.bobbingHorizontal;
    }

    // Weapon bobbing
    let targetBobX = 0;
    let targetBobY = 0;
    let targetBobRotZ = 0;

    if (playerController.isMoving() && playerController.isGrounded()) {
      this.bobbingTime += deltaTime * this.bobbingSpeed;

      targetBobY = Math.sin(this.bobbingTime) * this.bobbingAmount;
      targetBobX = Math.sin(this.bobbingTime * 0.5) * this.bobbingHorizontal;
      targetBobRotZ = Math.sin(this.bobbingTime * 0.5) * this.bobbingRotation;
    }

    const lerpFactor = 1 - Math.exp(-this.bobbingLerpSpeed * deltaTime);
    this.currentBobX += (targetBobX - this.currentBobX) * lerpFactor;
    this.currentBobY += (targetBobY - this.currentBobY) * lerpFactor;
    this.currentBobRotZ += (targetBobRotZ - this.currentBobRotZ) * lerpFactor;

    this.weaponGroup.position.x =
      this.weaponOffset.x - currentCameraBobX + this.currentBobX;
    this.weaponGroup.position.y =
      this.weaponOffset.y - currentCameraBobY + this.currentBobY;
    this.weaponGroup.rotation.z = this.currentBobRotZ;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.camera.remove(this.weaponGroup);
  }
}

export { Weapon };
