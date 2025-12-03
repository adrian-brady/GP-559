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
} from 'three';
import { GameScene } from './GameScene.js';
import { MeshInstance } from '../components/MeshInstance.js';
import { PlayerController } from '../components/PlayerController.js';
import { CameraFollow } from '../components/CameraFollow.js';
import RAPIER, { ColliderDesc } from '@dimforge/rapier3d-compat';
import { RigidBody } from '../components/RigidBody.js';
import { Entity } from '../ecs/Entity.js';
import { Weapon } from '../components/Weapon.js';
import { loadAK47 } from '../assets/models/WeaponModels.js';

class MainScene extends GameScene {
  /** @type {PerspectiveCamera} */
  camera;

  /**
   * Sets up the Scene
   * @param {PerspectiveCamera} camera
   * @param {RAPIER.World} physicsWorld
   */
  async initialize(camera, physicsWorld) {
    this.camera = camera;
    this.physicsWorld = physicsWorld;

    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    this.setupLighting();
    await this.setupPlayer();
    this.setupEnvironment();
    this.setupObjects();
    this.scene.background = new Color('skyblue');
  }

  setupObjects() {
    this.createPhysicsObject(
      'cube',
      new BoxGeometry(2, 2, 2),
      new MeshStandardMaterial({ color: 0xff6347 }),
      { x: 5, y: 1, z: -3 },
      RAPIER.ColliderDesc.cuboid(1, 1, 1)
    );

    this.createPhysicsObject(
      'cylinder',
      new CylinderGeometry(1, 1, 3, 16),
      new MeshStandardMaterial({ color: 0x4169e1 }),
      { x: -8, y: 1.5, z: -10 },
      RAPIER.ColliderDesc.cylinder(1.5, 1)
    );

    this.createPhysicsObject(
      'sphere',
      new SphereGeometry(1.5, 32, 32),
      new MeshStandardMaterial({ color: 0x32cd32 }),
      { x: -3, y: 1.5, z: 2 },
      RAPIER.ColliderDesc.ball(1.5)
    );
  }

  setupLighting() {
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;

    this.scene.add(directionalLight);
  }

  async setupPlayer() {
    const player = this.entityManager.createEntity(this.scene, 'player');
    // const geometry = new BoxGeometry(1, 1, 1);
    // const material = new MeshStandardMaterial({ color: 0x00ff00 });
    // player.addComponent(MeshInstance, geometry, material);
    player.transform.position.set(0, 2, 0);

    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, 2, 0)
      .setLinearDamping(5.0)
      .setAngularDamping(10.0)
      .lockRotations();

    const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.capsule(0.5, 0.5)
      .setFriction(0.5)
      .setRestitution(0.0)
      .setCollisionGroups(0x00010001);

    const collider = this.physicsWorld.createCollider(colliderDesc, rigidBody);

    player.addComponent(RigidBody, rigidBody, collider);

    player.addComponent(PlayerController, this.physicsWorld);
    const cameraFollow = player.addComponent(CameraFollow, this.camera);
    cameraFollow.offset.set(0, 0.5, 0);

    let weaponModel;
    try {
      weaponModel = await loadAK47();
      weaponModel.rotateY(Math.PI / 2);
      weaponModel.translateY(-0.1);
      weaponModel.translateX(-0.1);
    } catch (error) {
      console.error('Failed to load player weapon, using fallback:', error);
      const weaponGeometry = new BoxGeometry(0.1, 0.1, 0.4);
      const weaponMaterial = new MeshStandardMaterial({ color: 0x333333 });
      weaponModel = new Mesh(weaponGeometry, weaponMaterial);
      weaponModel.castShadow = true;
    }

    player.addComponent(Weapon, this.camera, weaponModel);
  }

  setupEnvironment() {
    const ground = this.entityManager.createEntity(this.scene, 'ground');
    const geometry = new PlaneGeometry(100, 100);
    const material = new MeshStandardMaterial({
      color: 0x888888,
      side: DoubleSide,
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

    // ground.addComponent(RigidBody, rigidBody, collider);
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
  createPhysicsObject(name, geometry, material, position, colliderDesc) {
    const entity = this.entityManager.createEntity(this.scene, name);
    /** @type {MeshInstance} */
    const meshInstance = entity.addComponent(MeshInstance, geometry, material);

    meshInstance.mesh.castShadow = true;
    meshInstance.mesh.receiveShadow = true;

    entity.transform.position.set(position.x, position.y, position.z);

    const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
      position.x,
      position.y,
      position.z
    );
    const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc);
    this.physicsWorld.createCollider(colliderDesc, rigidBody);

    return entity;
  }
}

export { MainScene };
