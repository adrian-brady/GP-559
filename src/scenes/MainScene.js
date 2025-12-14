import {
  AmbientLight,
  DirectionalLight,
  BoxGeometry,
  Color,
  MeshStandardMaterial,
  PlaneGeometry,
  PerspectiveCamera,
  DoubleSide,
  CylinderGeometry,
  SphereGeometry,
  BufferGeometry,
  Material,
  Vector3,
  Mesh,
  Euler,
  Quaternion,
  MeshPhysicalMaterial,
  Fog,
  PointLight,
} from 'three';
import { GameScene } from './GameScene.js';
import { MeshInstance } from '../components/MeshInstance.js';
import { PlayerController } from '../components/PlayerController.js';
import { CameraFollow } from '../components/CameraFollow.js';
import RAPIER, { ColliderDesc } from '@dimforge/rapier3d-compat';
import { RigidBody } from '../components/RigidBody.js';
import { Entity } from '../ecs/Entity.js';
import { Weapon } from '../components/Weapon.js';
import { loadAK47, loadWeaponModel } from '../assets/models/WeaponModels.js';
import { WeaponDefinitions } from '../config/WeaponDefinitions.js';
import { DecalSystem } from '../systems/DecalSystem.js';
import { AmmoCounter } from '../ui/AmmoCounter.js';
import { DeathBehavior } from '../components/Health.js';
import { createNPC, createTargetDummy } from '../entities/NPC.js';
import { AIBehavior } from '../components/AIController.js';

class MainScene extends GameScene {
  /** @type {PerspectiveCamera} */
  camera;

  /** @type {RAPIER.World} */
  physicsWorld;

  /** @type {DecalSystem} */
  decalSystem;

  /** @type {AmmoCounter} */
  ammoCounter;

  /**
   * Sets up the Scene
   * @param {PerspectiveCamera} camera
   * @param {RAPIER.World} physicsWorld
   * @param {DecalSystem} decalSystem
   * @param {AmmoCounter} ammoCounter
   */
  async initialize(camera, physicsWorld, decalSystem, ammoCounter) {
    this.camera = camera;
    this.physicsWorld = physicsWorld;
    this.decalSystem = decalSystem;
    this.ammoCounter = ammoCounter;

    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    this.setupLighting();
    await this.setupPlayer();
    this.setupEnvironment();
    this.setupObjects();
    this.setupNPCs();
    this.scene.background = new Color('skyblue');
  }

  setupObjects() {
    const wallHeight = 4;
    const wallThickness = 0.5;
    const arenaSize = 40;

    const wallMaterial = new MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.85,
      metalness: 0.85,
      emissive: 0x1a1410,
      emissiveIntensity: 0.05,
    });

    // North Wall
    this.createPhysicsObject(
      'wall_north',
      new BoxGeometry(arenaSize, wallHeight, wallThickness),
      new MeshStandardMaterial(wallMaterial.clone()),
      { x: 0, y: wallHeight / 2, z: -arenaSize / 2 },
      RAPIER.ColliderDesc.cuboid(
        arenaSize / 2,
        wallHeight / 2,
        wallThickness / 2
      )
    );
    // South Wall
    this.createPhysicsObject(
      'wall_south',
      new BoxGeometry(arenaSize, wallHeight, wallThickness),
      new MeshStandardMaterial(wallMaterial.clone()),
      { x: 0, y: wallHeight / 2, z: arenaSize / 2 },
      RAPIER.ColliderDesc.cuboid(
        arenaSize / 2,
        wallHeight / 2,
        wallThickness / 2
      )
    );
    // East Wall
    this.createPhysicsObject(
      'wall_east',
      new BoxGeometry(arenaSize, wallHeight, wallThickness),
      new MeshStandardMaterial(wallMaterial.clone()),
      { x: arenaSize / 2, y: wallHeight / 2, z: 0 },
      RAPIER.ColliderDesc.cuboid(
        arenaSize / 2,
        wallHeight / 2,
        wallThickness / 2
      ),
      { x: 0, y: Math.PI / 2, z: 0 }
    );
    // West Wall
    this.createPhysicsObject(
      'wall_west',
      new BoxGeometry(arenaSize, wallHeight, wallThickness),
      new MeshStandardMaterial(wallMaterial.clone()),
      { x: -arenaSize / 2, y: wallHeight / 2, z: 0 },
      RAPIER.ColliderDesc.cuboid(
        arenaSize / 2,
        wallHeight / 2,
        wallThickness / 2
      ),
      { x: 0, y: Math.PI / 2, z: 0 }
    );

    // === Barriers ===

    const lMaterial = new MeshStandardMaterial({
      color: 0x71797e,
      roughness: 0.4,
      metalness: 0.8,
      emissive: 0x1a1d20,
      emissiveIntensity: 0.1,
    });

    // L-wall 1
    this.createPhysicsObject(
      'barrier_L1a',
      new BoxGeometry(8, 2.5, 0.5),
      new MeshStandardMaterial(lMaterial),
      { x: -10, y: 1.25, z: -10 },
      RAPIER.ColliderDesc.cuboid(4, 1.25, 0.25)
    );
    this.createPhysicsObject(
      'barrier_L1b',
      new BoxGeometry(0.5, 2.5, 6),
      new MeshStandardMaterial(lMaterial),
      { x: -6.25, y: 1.25, z: -7 },
      RAPIER.ColliderDesc.cuboid(0.25, 1.25, 3)
    );

    // L-wall 2 (bottom-right quadrant)
    this.createPhysicsObject(
      'barrier_L2a',
      new BoxGeometry(8, 2.5, 0.5),
      new MeshStandardMaterial(lMaterial),
      { x: 10, y: 1.25, z: 10 },
      RAPIER.ColliderDesc.cuboid(4, 1.25, 0.25)
    );
    this.createPhysicsObject(
      'barrier_L2b',
      new BoxGeometry(0.5, 2.5, 6),
      new MeshStandardMaterial(lMaterial),
      { x: 6.25, y: 1.25, z: 7 },
      RAPIER.ColliderDesc.cuboid(0.25, 1.25, 3)
    );

    // === Cover ===

    const coverMaterial = new MeshStandardMaterial({
      color: 0x8b6f47,
      roughness: 0.9,
      metalness: 0.0,
    });

    // Small cover boxes
    this.createPhysicsObject(
      'cover_box1',
      new BoxGeometry(2, 1.5, 2),
      new MeshStandardMaterial(coverMaterial.clone()),
      { x: 5, y: 0.75, z: -5 },
      RAPIER.ColliderDesc.cuboid(1, 0.75, 1)
    );

    this.createPhysicsObject(
      'cover_box2',
      new BoxGeometry(3, 1.2, 1.5),
      new MeshStandardMaterial(coverMaterial.clone()),
      { x: -8, y: 0.6, z: 3 },
      RAPIER.ColliderDesc.cuboid(1.5, 0.6, 0.75)
    );

    this.createPhysicsObject(
      'cover_box3',
      new BoxGeometry(1.5, 1, 2.5),
      new MeshStandardMaterial(coverMaterial.clone()),
      { x: 0, y: 0.5, z: -8 },
      RAPIER.ColliderDesc.cuboid(0.75, 0.5, 1.25)
    );

    const metalMaterial = new MeshStandardMaterial({
      color: 0x71797e,
      roughness: 0.4,
      metalness: 0.8,
      emissive: 0x1a1d20,
      emissiveIntensity: 0.1,
    });

    // Tall cover pillars
    this.createPhysicsObject(
      'pillar1',
      new CylinderGeometry(0.8, 0.8, 3.5, 16),
      new MeshStandardMaterial(metalMaterial.clone()),
      { x: -3, y: 1.75, z: -3 },
      RAPIER.ColliderDesc.cylinder(1.75, 0.8)
    );

    this.createPhysicsObject(
      'pillar2',
      new CylinderGeometry(0.8, 0.8, 3.5, 16),
      new MeshStandardMaterial(metalMaterial.clone()),
      { x: 7, y: 1.75, z: 2 },
      RAPIER.ColliderDesc.cylinder(1.75, 0.8)
    );

    // === Platforms ===

    const platformMaterial = new MeshStandardMaterial({
      color: 0x34495e,
      roughness: 0.6,
      metalness: 0.5,
      emissive: 0x1a2332,
      emissiveIntensity: 0.1,
    });

    // Platform 1 (northeast corner)
    const platform1Height = 2;
    this.createPhysicsObject(
      'platform1',
      new BoxGeometry(6, 0.5, 6),
      new MeshStandardMaterial(platformMaterial.clone()),
      { x: 12, y: platform1Height + 0.3, z: -12 },
      RAPIER.ColliderDesc.cuboid(3, 0.15, 3)
    );

    // Platform 2 (southwest corner)
    const platform2Height = 1.5;
    this.createPhysicsObject(
      'platform2',
      new BoxGeometry(5, 0.5, 5),
      new MeshPhysicalMaterial(platformMaterial.clone()),
      { x: -13, y: platform2Height + 0.3, z: 10 },
      RAPIER.ColliderDesc.cuboid(2.5, 0.15, 2.5)
    );

    // === Center Focal Point ===

    this.createPhysicsObject(
      'center_structure',
      new BoxGeometry(4, 2, 4),
      new MeshStandardMaterial({ color: 0x2f4f4f }),
      { x: 0, y: 1, z: 0 },
      RAPIER.ColliderDesc.cuboid(2, 1, 2)
    );

    // Decorative sphere
    this.createPhysicsObject(
      'center_orb',
      new SphereGeometry(0.6, 32, 32),
      new MeshStandardMaterial({
        color: 0xff6347,
        emissive: 0xff6347,
        emissiveIntensity: 0.3,
      }),
      { x: 0, y: 2.6, z: 0 },
      RAPIER.ColliderDesc.ball(0.6)
    );

    // === Misc Objects ===
    this.createPhysicsObject(
      'obstacle1',
      new BoxGeometry(1.5, 2, 1.5),
      new MeshStandardMaterial({ color: 0xcd853f }),
      { x: -5, y: 1, z: -15 },
      RAPIER.ColliderDesc.cuboid(0.75, 1, 0.75)
    );

    this.createPhysicsObject(
      'obstacle2',
      new CylinderGeometry(1, 1, 1.5, 16),
      new MeshStandardMaterial({ color: 0x556b2f }),
      { x: 8, y: 0.75, z: -10 },
      RAPIER.ColliderDesc.cylinder(0.75, 1)
    );

    this.createPhysicsObject(
      'obstacle3',
      new BoxGeometry(2.5, 0.8, 2.5),
      new MeshStandardMaterial({ color: 0x8b4513 }),
      { x: -12, y: 0.4, z: -5 },
      RAPIER.ColliderDesc.cuboid(1.25, 0.4, 1.25)
    );
  }

  setupNPCs() {
    this.spawnWanderer();
  }

  /**
   * Check if a position is safe to spawn (no collisions)
   * @param {Object} position - {x, y, z}
   * @returns {boolean}
   */
  isPositionSafe(position) {
    const testRadius = 0.5;
    const testHeight = 1.0;

    const shape = RAPIER.ColliderDesc.capsule(testHeight, testRadius);

    const translation = { x: position.x, y: position.y, z: position.z };
    const rotation = { w: 1, x: 0, y: 0, z: 0 };

    let hasCollision = false;
    this.physicsWorld.intersectionWithShape(
      translation,
      rotation,
      shape.shape,
      collider => {
        if (
          collider.userData?.type !== 'static' ||
          collider.userData?.entity?.name === 'ground'
        ) {
          return true;
        }
        hasCollision = true;
        return false;
      }
    );

    return !hasCollision;
  }

  /**
   * Find a safe random spawn position
   * @param {number} maxAttempts - Maximum tries to find a safe spot
   * @returns {Object} - Safe position {x, y, z}
   */
  findSafeSpawnPos(maxAttempts = 5) {
    const spawnRadius = 15;
    const spawnY = 2;

    for (let i = 0; i < maxAttempts; i++) {
      const randomAngle = Math.random() * Math.PI * 2;
      const randomDistance = Math.random() * spawnRadius;
      const randomX = Math.cos(randomAngle) * randomDistance;
      const randomZ = Math.sin(randomAngle) * randomDistance;

      const testPosition = { x: randomX, y: spawnY, z: randomZ };

      if (this.isPositionSafe(testPosition)) {
        return testPosition;
      }
    }

    console.warn('Could not find safe spawn position, using fallback');
    return { x: 0, y: 2, z: 18 };
  }

  spawnWanderer() {
    const spawnPosition = this.findSafeSpawnPos();
    createNPC(this.entityManager, this.scene, this.physicsWorld, {
      name: 'wanderer',
      position: spawnPosition,
      health: 100,
      color: 0x00ff00,
      aiBehavior: AIBehavior.WANDER,
      deathBehavior: DeathBehavior.DISAPPEAR,
      aiConfig: {
        speed: 5.0,
        wanderInterval: 4.0,
      },
      onDeath: () => this.spawnWanderer(),
    });
  }

  setupLighting() {
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -40;
    directionalLight.shadow.camera.right = 40;
    directionalLight.shadow.camera.top = 40;
    directionalLight.shadow.camera.bottom = -40;
    directionalLight.shadow.bias = -0.0001;

    this.scene.add(directionalLight);

    const fillLight = new DirectionalLight(0x7fa3d1, 0.3);
    fillLight.position.set(-15, 15, -10);
    this.scene.add(fillLight);

    this.scene.fog = new Fog(0x87ceeb, 30, 80);
  }

  async setupPlayer() {
    const player = this.entityManager.createEntity(this.scene, 'player');
    // const geometry = new BoxGeometry(1, 1, 1);
    // const material = new MeshStandardMaterial({ color: 0x00ff00 });
    // player.addComponent(MeshInstance, geometry, material);
    player.transform.position.set(15, 2, 15);

    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(15, 2, 15)
      .setLinearDamping(0.0)
      .setAngularDamping(10.0)
      .lockRotations();

    const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.capsule(0.5, 0.5)
      .setFriction(0.5)
      .setRestitution(0.0)
      .setCollisionGroups(0x00010001);

    const collider = this.physicsWorld.createCollider(colliderDesc, rigidBody);
    collider.userData = { entity: player, type: 'entity' };

    player.addComponent(RigidBody, rigidBody, collider);

    player.addComponent(PlayerController, this.physicsWorld);
    const cameraFollow = player.addComponent(CameraFollow, this.camera);
    cameraFollow.offset.set(0, 0.5, 0);

    const weaponDef = WeaponDefinitions.ak47;

    let weaponModel;
    try {
      weaponModel = await loadWeaponModel(weaponDef.modelPath);
      weaponModel.rotateY(Math.PI / 2);
      weaponModel.translateY(-0.1);
      weaponModel.translateX(-0.1);
      weaponModel.traverse(child => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.metalness = 0.8;
          child.material.roughness = 0.3;
          child.material.envMapIntensity = 1.5;

          if (!child.material.color) {
            child.material.color = new Color(0x8b9096);
          }

          child.material.needsUpdate = true;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    } catch (error) {
      console.error('Failed to load player weapon, using fallback:', error);
      const weaponGeometry = new BoxGeometry(0.1, 0.1, 0.4);
      const weaponMaterial = new MeshStandardMaterial({ color: 0x333333 });
      weaponModel = new Mesh(weaponGeometry, weaponMaterial);
      weaponModel.castShadow = true;
    }

    player.addComponent(
      Weapon,
      this.camera,
      weaponModel,
      weaponDef,
      this.physicsWorld,
      this.decalSystem,
      this.ammoCounter
    );
  }

  setupEnvironment() {
    const ground = this.entityManager.createEntity(this.scene, 'ground');
    const geometry = new PlaneGeometry(100, 100);
    const material = new MeshStandardMaterial({
      color: 0x556b2f,
      roughness: 0.9,
      metalness: 0.1,
      side: DoubleSide,
      flatShading: false,
    });
    /** @type {MeshInstance} */
    const meshInstance = ground.addComponent(MeshInstance, geometry, material);
    meshInstance.mesh.receiveShadow = true;

    ground.transform.rotateX(-Math.PI / 2);
    ground.transform.position.y = 0;

    const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
      0,
      -0.1,
      0
    );

    const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.cuboid(50, 0.1, 50);
    const collider = this.physicsWorld.createCollider(colliderDesc, rigidBody);
    collider.userData = { entity: ground, type: 'static' };

    ground.addComponent(RigidBody, rigidBody, collider);
  }

  /**
   *
   * @param {string} name - Entity name
   * @param {BufferGeometry} geometry - Visual Geometry
   * @param {Material} material - Material
   * @param {Vector3} position - Position {x, y, z}
   * @param {ColliderDesc} colliderDesc - Physics Collider
   * @returns {Entity}
   */
  createPhysicsObject(
    name,
    geometry,
    material,
    position,
    colliderDesc,
    rotation = null
  ) {
    const entity = this.entityManager.createEntity(this.scene, name);
    /** @type {MeshInstance} */
    const meshInstance = entity.addComponent(MeshInstance, geometry, material);

    meshInstance.mesh.castShadow = true;
    meshInstance.mesh.receiveShadow = true;

    entity.transform.position.set(position.x, position.y, position.z);

    if (rotation) {
      if (rotation.x) entity.transform.rotateX(rotation.x);
      if (rotation.y) entity.transform.rotateY(rotation.y);
      if (rotation.z) entity.transform.rotateZ(rotation.z);
    }

    const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
      position.x,
      position.y,
      position.z
    );

    if (rotation) {
      const euler = new Euler(
        rotation.x || 0,
        rotation.y || 0,
        rotation.z || 0,
        'XYZ'
      );
      const quat = new Quaternion().setFromEuler(euler);

      rigidBodyDesc.setRotation({
        x: quat.x,
        y: quat.y,
        z: quat.z,
        w: quat.w,
      });
    }

    const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc);
    const collider = this.physicsWorld.createCollider(colliderDesc, rigidBody);
    collider.userData = { entity: entity, type: 'static' };

    return entity;
  }
}

export { MainScene };
