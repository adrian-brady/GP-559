import {
  BoxGeometry,
  Group,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Vector3,
  MeshStandardMaterial,
} from 'three';
import { Component } from '../ecs/Component.js';
import { CameraFollow } from './CameraFollow.js';
import { PlayerController } from './PlayerController.js';
import { WeaponDefinition } from '../config/WeaponDefinitions.js';
import { Entity } from '../ecs/Entity.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { DecalSystem } from '../systems/DecalSystem.js';
import { RigidBody } from './RigidBody.js';
import { MeshInstance } from './MeshInstance.js';
import { AmmoCounter } from '../ui/AmmoCounter.js';
import { Health } from './Health.js';
import { GameConfig } from '../config/GameConfig.js';

class Weapon extends Component {
  /** @type {PerspectiveCamera} */
  camera;

  /** @type {Group} */
  weaponGroup;

  /** @type {Mesh} */
  weaponMesh;

  /** @type {WeaponDefinition} */
  definition;

  /** @type {RAPIER.World} */
  physicsWorld;

  /** @type {DecalSystem} */
  decalSystem;

  /** @type {AmmoCounter} */
  ammoCounter;

  /** @type {boolean} */
  isPrototypeMesh;

  /** @type {Mesh} */
  prototypeWeaponMesh;

  /** @type {Group|Mesh} */
  fullFeaponMesh;

  /** @type {Function} */
  modeChangeHandler;

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

  bobFrequency = 0.02;
  bobAmount = 0.2;
  bobSpeed = 5.0;
  idleBobFreqDivider = 2.0;
  bobBasePosition = { x: 0, y: 0 };

  swayAmountPos = 0.5;
  swayAmountRot = 5.0;
  swaySpeedPos = 0.1;
  swaySpeedRot = 0.1;
  minSwayVal = { x: -1, y: -1 };
  maxSwayVal = { x: 1, y: 1 };
  currentMouseInput = { x: 0, y: 0 };

  tiltRotAmount = 0.05; // how much to tilt based on strafe
  tiltRotSpeed = 5.0;

  currentAmmo = 0;
  lastFireTime = 0;

  recoilKick = 0;
  recoilHorizontal = 0;
  recoilVertical = 0;

  adsProgress = 0;
  sightAlignmentOffset = { x: 0, y: 0, z: 0 };
  isSightAlignmentCalculated = false;

  /**
   *
   * @param {Entity} entity
   * @param {PerspectiveCamera} camera
   * @param {Group} weaponModel
   * @param {WeaponDefinition} definition
   * @param {RAPIER.World} physicsWorld
   * @param {DecalSystem} decalSystem
   * @param {AmmoCounter} ammoCounter
   */
  constructor(
    entity,
    camera,
    weaponModel,
    definition,
    physicsWorld,
    decalSystem,
    ammoCounter
  ) {
    super(entity);
    this.camera = camera;
    this.definition = definition;
    this.physicsWorld = physicsWorld;
    this.decalSystem = decalSystem;
    this.ammoCounter = ammoCounter;
    this.weaponMesh = weaponModel;

    this.isPrototypeMode = GameConfig.isPrototypeMode;

    this.fullWeaponMesh = weaponModel;
    this.prototypeWeaponMesh = this.createPrototypeWeapon();

    this.weaponMesh = this.isPrototypeMode
      ? this.prototypeWeaponMesh
      : this.fullWeaponMesh;

    this.bobBasePosition.x = this.weaponMesh.position.x;
    this.bobBasePosition.y = this.weaponMesh.position.y;

    if (this.ammoCounter) {
      this.ammoCounter.update(
        this.currentAmmo,
        this.definition.stats.magazineSize
      );
    }

    if (!this.isPrototypeMode) {
      this.findWeaponParts(weaponModel);
    }

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

    if (definition.ads.sightNode) {
      weaponModel.traverse(child => {
        if (child.name === definition.ads.sightNode) {
          this.parts.sight = child;
          console.log('Found ADS sight:', child.name);
        }
      });
    }

    this.calculateSightAlignment();

    this.modeChangeHandler = isPrototype => this.handleModeChange(isPrototype);
    GameConfig.onModeChange(this.modeChangeHandler);
  }

  /**
   * Create a simple prototype weapon (box geometry)
   * @returns {Mesh}
   */
  createPrototypeWeapon() {
    const geometry = new BoxGeometry(0.1, 0.1, 0.4);
    const material = new MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.3,
    });
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;

    mesh.position.set(0, 0, 0);

    return mesh;
  }

  /**
   * Handle mode change between prototype and full
   * @param {boolean} isPrototype
   */
  handleModeChange(isPrototype) {
    if (this.isPrototypeMode === isPrototype) return;

    this.isPrototypeMode = isPrototype;
    console.log(
      `Weapon switching to ${isPrototype ? 'PROTOTYPE' : 'FULL'} mode`
    );

    this.weaponGroup.remove(this.weaponMesh);

    if (isPrototype) {
      this.weaponMesh = this.prototypeWeaponMesh;
    } else {
      this.weaponMesh = this.fullWeaponMesh;
    }

    this.weaponGroup.add(this.weaponMesh);

    this.bobBasePosition.x = this.weaponMesh.position.x;
    this.bobBasePosition.y = this.weaponMesh.position.y;

    console.log('Weapon mode switched successfully');
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

    if (this.ammoCounter) {
      this.ammoCounter.update(
        this.currentAmmo,
        this.definition.stats.magazineSize
      );
    }

    const ray = this.performRaycast();

    if (ray && ray.hit) {
      this.decalSystem.addDecal(
        ray.position,
        ray.normal,
        ray.hitObject,
        ray.surfaceType
      );

      if (ray.surfaceType === 'entity' && ray.collider?.userData?.entity) {
        const hitEntity = ray.collider.userData.entity;
        /** @type {Health} */
        const healthComponent = hitEntity.getComponent(Health);

        if (healthComponent) {
          const damage = this.definition.stats.damage;
          healthComponent.takeDamage(damage);
        }
      }

      console.log('Hit:', ray.surfaceType, 'at', ray.position);
    }

    this.applyRecoil();

    console.log(`Fired Round Ammo:
    ${this.currentAmmo}/${this.definition.stats.magazineSize}`);

    if (this.currentAmmo === 0) {
      console.log('Magazine empty. Press R to reload');
    }
  }

  /**
   * Perform raycast from the camera forward
   * @returns {{hit: boolean, position: Vector3, normal: Vector3} | null}
   */
  performRaycast() {
    if (!this.physicsWorld) return null;

    const origin = this.camera.getWorldPosition(new Vector3());
    const direction = this.camera.getWorldDirection(new Vector3());

    const ray = new RAPIER.Ray(origin, direction);
    const maxDistance = 1000;
    const solid = true;

    /** @type {RigidBody} */
    const playerRigidBody = this.entity.getComponent(RigidBody);
    const excludeCollider = playerRigidBody
      ? playerRigidBody.collider
      : undefined;

    const hit = this.physicsWorld.castRayAndGetNormal(
      ray,
      maxDistance,
      solid,
      null,
      null,
      null,
      excludeCollider
    );

    if (hit) {
      const hitPoint = ray.pointAt(hit.timeOfImpact);
      const normal = new Vector3(hit.normal.x, hit.normal.y, hit.normal.z);

      const collider = hit.collider;
      const hitInfo = this.identifyHitObject(collider);

      return {
        hit: true,
        position: new Vector3(hitPoint.x, hitPoint.y, hitPoint.z),
        normal: new Vector3(normal.x, normal.y, normal.z),
        collider: collider,
        hitObject: hitInfo.object,
        surfaceType: hitInfo.type,
      };
    }

    return null;
  }

  /**
   * Identity what Three.js object was hit and its type
   * @param {RAPIER.Collider} collider
   * @returns {{object: Object3D | null, type: string}}
   */
  identifyHitObject(collider) {
    const userData = collider.userData;

    if (!userData || !userData.entity) {
      return { object: null, type: 'static' };
    }

    // Don't add decals to entities (players, AI)
    if (userData.type === 'entity') {
      return { object: null, type: 'entity' };
    }

    // Get the mesh from the entity
    const meshInstance = userData.entity.getComponent(MeshInstance);
    if (meshInstance) {
      return { object: meshInstance.mesh, type: userData.type };
    }

    return { object: null, type: 'static' };
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
    if (this.ammoCounter) {
      this.ammoCounter.update(
        this.currentAmmo,
        this.definition.stats.magazineSize,
        true
      );
    }
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

    if (this.ammoCounter) {
      this.ammoCounter.update(
        this.currentAmmo,
        this.definition.stats.magazineSize,
        false
      );
    }

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
  }

  /**
   *
   * @param {number} velocity - Player movement speed
   * @param {number} deltaTime
   */
  weaponBob(velocity, deltaTime) {
    if (isNaN(velocity) || velocity === undefined) {
      console.warn('weaponBob: velocity is NaN or undefined');
      velocity = 0;
    }

    let bobFreq = this.bobFrequency;

    if (velocity < 4.0) {
      bobFreq /= this.idleBobFreqDivider;
    }

    const time = Date.now() * bobFreq;

    const bobY = (Math.sin(time) * this.bobAmount * velocity) / 10;
    const targetY = this.bobBasePosition.y + bobY;

    const bobX = (Math.sin(time * 0.5) * this.bobAmount * velocity) / 10;
    const targetX = this.bobBasePosition.x + bobX;

    if (isNaN(targetX) || isNaN(targetY)) {
      console.warn('weaponBob: targets are NaN', {
        bobBaseX: this.bobBase.bobBasePosition.x,
        baseBaseY: this.bobBasePosition.y,
        bobX,
        bobY,
        velocity,
      });
      return;
    }

    const lerpFactor = this.bobSpeed * deltaTime;

    this.weaponMesh.position.y = this.lerp(
      this.weaponMesh.position.y,
      targetY,
      lerpFactor
    );
    this.weaponMesh.position.x = this.lerp(
      this.weaponMesh.position.x,
      targetX,
      lerpFactor
    );
  }

  /**
   * @param {number} deltaX - Mouse movement in X
   * @param {number} deltaY - Mouse movement in Y
   */
  applyMouseInput(deltaX, deltaY) {
    this.currentMouseInput.x += deltaX * 0.01;
    this.currentMouseInput.y += deltaY * 0.01;

    this.currentMouseInput.x = Math.max(
      this.minSwayVal.x,
      Math.min(this.maxSwayVal.x, this.currentMouseInput.x)
    );
    this.currentMouseInput.y = Math.max(
      this.minSwayVal.y,
      Math.min(this.maxSwayVal.y, this.currentMouseInput.y)
    );
  }

  /**
   * Weapon sway
   * @param {Object} mouseInput - {x, y} mouse delta
   * @param {number} deltaTime
   */
  weaponSway(mouseInput, deltaTime) {
    const clampedX = Math.max(
      this.minSwayVal.x,
      Math.min(this.maxSwayVal.x, mouseInput.x)
    );
    const clampedY = Math.max(
      this.minSwayVal.y,
      Math.min(this.maxSwayVal.y, mouseInput.y)
    );

    const targetPosX =
      this.originalOffset.x + clampedX * this.swayAmountPos * deltaTime;
    const targetPosY =
      this.originalOffset.y + clampedY * this.swayAmountPos * deltaTime;

    const targetRotY = -(clampedX * this.swayAmountRot) * deltaTime;
    const targetRotX = clampedY * this.swayAmountRot * deltaTime;

    this.weaponMesh.position.x = this.lerp(
      this.weaponMesh.position.x,
      targetPosX,
      this.swaySpeedPos
    );
    this.weaponMesh.position.y = this.lerp(
      this.weaponMesh.position.y,
      targetPosY,
      this.swaySpeedPos
    );
    console.log('target rot:', { x: targetRotX, y: targetRotY });

    this.weaponMesh.rotation.y = this.lerp(
      this.weaponMesh.rotation.y,
      targetRotY,
      this.swaySpeedRot
    );
    this.weaponMesh.rotation.x = this.lerp(
      this.weaponMesh.rotation.x,
      targetRotX,
      this.swaySpeedRot
    );
  }

  /**
   * Weapon tilt
   * @param {Object} inputDirection - {x, y} normalized input
   * @param {number} deltaTime
   * @param {boolean} isADS
   */
  weaponTilt(inputDirection, deltaTime, isADS) {
    const targetTilt = inputDirection.x * this.tiltRotAmount;
    const lerpFactor = this.tiltRotSpeed * deltaTime;
    if (isADS) {
      this.weaponMesh.rotation.z = this.lerp(
        this.weaponMesh.rotation.z,
        targetTilt,
        lerpFactor
      );
    } else {
      this.weaponMesh.rotation.z = this.lerp(
        this.weaponMesh.rotation.z,
        this.originalRotations,
        lerpFactor
      );
    }
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

    const velocity = playerController.velocity;
    if (!velocity) {
      console.warn('velocity not defined on player controller');
      return;
    }

    const velocityMagnitude = velocity.length();
    const inputDirection = playerController.inputDirection;

    this.updateADS(deltaTime, playerController.isADS());
    this.weaponBob(velocityMagnitude, deltaTime);
    // this.weaponTilt(inputDirection, deltaTime, playerController.isADS());
    // this.weaponSway(this.currentMouseInput, deltaTime);

    this.weaponGroup.position.set(
      this.weaponOffset.x,
      this.weaponOffset.y,
      this.weaponOffset.z + this.recoilKick
    );

    this.weaponGroup.rotation.x = -0.15 * this.recoilKick;

    this.updateReloadAnimation(deltaTime);
    this.updateRecoil(deltaTime);

    this.currentMouseInput.x *= 0.9;
    this.currentMouseInput.y *= 0.9;
  }

  /**
   * Calculate the offset needed to align sight with camera center
   * This calcualtion is performed once and then cached.
   */
  calculateSightAlignment() {
    const sightPart = this.parts.sight;

    if (!sightPart) {
      console.warn('No sight part found, using generic ADS offset');
      this.sightAlignmentOffset = { x: 0, y: -0, z: -0.0 };
      return;
    }

    const sightLocalPos = new Vector3();
    sightPart.getWorldPosition(sightLocalPos);
    this.weaponGroup.worldToLocal(sightLocalPos);

    this.sightAlignmentOffset = {
      x: 0,
      y: 0.1,
      z: -sightLocalPos.z,
    };

    const adj = this.definition.ads.offsetAdjustment;
    this.sightAlignmentOffset.x += adj.x;
    this.sightAlignmentOffset.y += adj.y;
    this.sightAlignmentOffset.z += adj.z;

    console.log('Sight alignment calculated:', this.sightAlignmentOffset);
  }

  /**
   * Update ADS state
   * @param {number} deltaTime
   * @param {boolean} isADS - If player is in ADS state or not
   */
  updateADS(deltaTime, isADS) {
    const targetProgress = isADS ? 1 : 0;

    if (targetProgress > 0 && !this.isSightAlignmentCalculated) {
      this.calculateSightAlignment();
      this.isSightAlignmentCalculated = true;
    }

    const speed = this.definition.ads.transitionSpeed;
    const lerpFactor = 1 - Math.exp(-speed * deltaTime);
    this.adsProgress += (targetProgress - this.adsProgress) * lerpFactor;

    this.weaponOffset.x = this.lerp(
      this.originalOffset.x,
      this.sightAlignmentOffset.x,
      this.adsProgress
    );
    this.weaponOffset.y = this.lerp(
      this.originalOffset.y,
      this.sightAlignmentOffset.y,
      this.adsProgress
    );
    this.weaponOffset.z = this.lerp(
      this.originalOffset.z,
      this.sightAlignmentOffset.z,
      this.adsProgress
    );

    this.weaponGroup.position.set(
      this.weaponOffset.x,
      this.weaponOffset.y,
      this.weaponOffset.z
    );

    // const targetFOV = this.lerp(
    //   this.definition.ads.hipfireFOV,
    //   this.definition.ads.adsFOV,
    //   this.adsProgress
    // );
    // this.camera.fov += (targetFOV - this.camera.fov) * lerpFactor;
    // this.camera.updateProjectionMatrix();
  }

  /**
   * Linear interpolation helper
   * @param {number} start
   * @param {number} end
   * @param {number} t
   */
  lerp(start, end, t) {
    if (isNaN(start) || isNaN(end) || isNaN(t)) {
      console.warn('lerp received NaN:', { start, end, t });
      return start || 0;
    }
    return start + (end - start) * t;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.camera.remove(this.weaponGroup);
    this.camera.updateProjectionMatrix();

    if (this.modeChangeHandler) {
      GameConfig.offModeChange(this.modeChangeHandler);
    }
  }
}

export { Weapon };
