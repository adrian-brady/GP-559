import { Group, Mesh, PerspectiveCamera } from 'three';
import { Component } from '../ecs/Component.js';
import { CameraFollow } from './CameraFollow.js';
import { PlayerController } from './PlayerController.js';
import { WeaponDefinition } from '../config/WeaponDefinitions.js';
import { Entity } from '../ecs/Entity.js';

class Weapon extends Component {
  /** @type {PerspectiveCamera} */
  camera;

  /** @type {Group} */
  weaponGroup;

  /** @type {Mesh} */
  weaponMesh;

  /** @type {WeaponDefinition} */
  definition;

  parts = {
    magazine: null,
    chargingHandle: null,
    slide: null,
    bold: null,
  };

  originalPositions = new Map();
  originalRotations = new Map();

  // Weapon position relative to camera
  // Right, Down, Forward
  weaponOffset = { x: 0.3, y: -0.2, z: -0.5 };
  originalOffset = this.weaponOffset;

  isReloading = false;
  reloadProgress = 0;
  recoilKick = 0;

  lastCameraBob = { x: 0, y: 0 };

  bobbingTime = 0;
  bobbingSpeed = 10;
  bobbingAmount = 0.01;
  bobbingHorizontal = 0.0075;
  bobbingRotation = 0.025;
  bobbingLerpSpeed = 8;

  currentBobX = 0;
  currentBobY = 0;
  currentBobRotZ = 0;

  currentAmmo = 0;
  lastFireTime = 0;

  recoilKick = 0;
  recoilHorizontal = 0;
  recoilVertical = 0;

  /**
   *
   * @param {Entity} entity
   * @param {PerspectiveCamera} camera
   * @param {Group} weaponModel
   * @param {WeaponDefinition} definition
   */
  constructor(entity, camera, weaponModel, definition) {
    super(entity);
    this.camera = camera;
    this.weaponMesh = weaponModel;
    this.definition = definition;

    this.findWeaponParts(weaponModel);

    this.weaponGroup = new Group();
    this.weaponGroup.position.set(
      this.weaponOffset.x,
      this.weaponOffset.y,
      this.weaponOffset.z
    );
    this.weaponGroup.add(weaponModel);

    this.currentAmmo = definition.stats.magazineSize;

    this.camera.add(this.weaponGroup);
    this.originalOffset = { ...this.weaponOffset };
  }

  canFire() {
    const now = Date.now() / 1000;
    const timeSinceLastFire = now - this.lastFireTime;

    return (
      this.currentAmmo > 0 &&
      timeSinceLastFire >= this.definition.stats.fireRate
    );
  }

  fire() {
    if (!this.canFire()) return;

    this.currentAmmo--;
    this.lastFireTime = Date.now() / 1000;

    this.applyRecoil();

    console.log(`Fired Round Ammo:
    ${this.currentAmmo}/${this.definition.stats.magazineSize}`);

    if (this.currentAmmo === 0) {
      console.log('Magazine empty. Press R to reload');
    }
  }

  /**
   * Find and store weapon parts based on definition
   */
  findWeaponParts(weaponModel) {
    weaponModel.traverse(child => {
      Object.keys(this.definition.parts).forEach(partType => {
        const partName = this.definition.parts[partType];
        if (partName && child.name === partName) {
          this.parts[partType] = child;

          this.originalPositions.set(partType, child.position.clone());
          this.originalRotations.set(partType, {
            x: child.rotation.x,
            y: child.rotation.y,
            z: child.rotation.z,
          });

          console.log(`Found ${partType}:`, partName);
        }
      });
    });
  }

  /**
   * Start reload animation
   */
  startReload() {
    if (this.isReloading) return;
    this.isReloading = true;
    this.reloadProgress = 0;
  }

  /**
   * Generic reload animation driven by definition timings
   */
  updateReloadAnimation(deltaTime) {
    if (!this.isReloading) return;

    const def = this.definition.animations.reload;
    this.reloadProgress += deltaTime / def.duration;

    if (this.reloadProgress >= 1.0) {
      this.finishReload();
      return;
    }

    const t = this.reloadProgress;

    // Magazine drop phase
    if (t >= def.magDropStart && t < def.magDropEnd) {
      this.animateMagazineDrop(t, def.magDropStart, def.magDropEnd);
    }

    // Magazine insert phase
    if (t >= def.magInsertStart && t < def.magInsertEnd) {
      this.animateMagazineInsert(t, def.magInsertStart, def.magInsertEnd);
    }

    // Charging handle / slide phase
    if (t >= def.chargeStart && t < def.chargeEnd) {
      this.animateCharge(t, def.chargeStart, def.chargeEnd);
    }
  }

  animateMagazineDrop(t, start, end) {
    const phase = (t - start) / (end - start);
    const mag = this.parts.magazine;

    if (mag) {
      const originalPos = this.originalPositions.get('magazine');
      const originalRot = this.originalRotations.get('magazine');
      const anim = this.definition.animations.reload;

      const dropY = anim.magDropDistance * phase;
      const dropX = anim.magDropSideways * phase;

      mag.position.y = originalPos.y - dropY;
      mag.position.x = originalPos.x + dropX;
      mag.rotation.x = originalRot.x + Math.PI * anim.magDropRotation * phase;
      mag.rotation.z = originalRot.z + Math.PI * anim.magDropTwist * phase;
      mag.visible = phase < 0.9;

      if (phase === 0 || Math.abs(phase - 0.5) < 0.01) {
        console.log(
          `Mag drop: phase=${phase.toFixed(2)}, dropY=${dropY.toFixed(3)}, dropX=${dropX.toFixed(3)}, posY=${mag.position.y.toFixed(3)}`
        );
      }
    }
  }

  animateMagazineInsert(t, start, end) {
    const phase = (t - start) / (end - start);
    const mag = this.parts.magazine;

    if (mag) {
      const originalPos = this.originalPositions.get('magazine');
      const originalRot = this.originalRotations.get('magazine');
      const anim = this.definition.animations.reload;

      mag.visible = true;
      mag.position.y = originalPos.y - anim.magDropDistance * (1 - phase);
      mag.position.x = originalPos.x + anim.magDropSideways * (1 - phase);
      mag.rotation.x =
        originalRot.x + Math.PI * anim.magDropRotation * (1 - phase);
      mag.rotation.z =
        originalRot.z + Math.PI * anim.magDropTwist * (1 - phase);
    }
  }

  animateCharge(t, start, end) {
    const phase = (t - start) / (end - start);
    const handleMove = Math.sin(phase * Math.PI);

    const handle = this.parts.chargingHandle || this.parts.slide;
    if (handle) {
      const originalPos = this.originalPositions.get(
        this.parts.chargingHandle ? 'chargingHandle' : 'slide'
      );
      const anim = this.definition.animations.reload;

      const offset = anim.chargeDistance * handleMove;
      if (anim.chargeAxis === 'x') {
        handle.position.x = originalPos.x + offset;
      } else if (anim.chargeAxis === 'y') {
        handle.position.y = originalPos.y + offset;
      } else {
        handle.position.z = originalPos.z + offset;
      }
    }
  }

  finishReload() {
    this.isReloading = false;
    this.currentAmmo = this.definition.stats.magazineSize;
    this.reloadProgress = 0;

    Object.keys(this.parts).forEach(partType => {
      const part = this.parts[partType];
      if (part) {
        const originalPos = this.originalPositions.get(partType);
        const originalRot = this.originalRotations.get(partType);

        if (originalPos) part.position.copy(originalPos);
        if (originalRot) {
          part.rotation.set(originalRot.x, originalRot.y, originalRot.z);
        }
        part.visible = true;
      }
    });

    // this.weaponGroup.position.set(
    //   this.originalOffset.x,
    //   this.originalOffset.y,
    //   this.originalOffset.z
    // );
    this.weaponGroup.rotation.set(0, 0, 0);
  }

  applyRecoil() {
    this.recoilKick = this.definition.animations.fire.recoilAmount;
  }

  updateRecoil(deltaTime) {
    if (this.recoilKick <= 0) return;

    const recoverySpeed = this.definition.animations.fire.recoilRecoverySpeed;
    this.recoilKick -= deltaTime * recoverySpeed;
    if (this.recoilKick < 0) this.recoilKick = 0;

    this.weaponGroup.position.z = this.originalOffset.z + this.recoilKick;
    this.weaponGroup.rotation.x = -0.15 * this.recoilKick;
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

    this.updateReloadAnimation(deltaTime);
    this.updateRecoil(deltaTime);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.camera.remove(this.weaponGroup);
  }
}

export { Weapon };
