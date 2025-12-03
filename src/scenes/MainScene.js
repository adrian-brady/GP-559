import {
  AmbientLight,
  DirectionalLight,
  BoxGeometry,
  Color,
  MeshStandardMaterial,
  PlaneGeometry,
  PerspectiveCamera,
  DoubleSide,
} from 'three';
import { GameScene } from './GameScene.js';
import { MeshInstance } from '../components/MeshInstance.js';
import { PlayerController } from '../components/PlayerController.js';
import { CameraFollow } from '../components/CameraFollow.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { RigidBody } from '../components/RigidBody.js';

class MainScene extends GameScene {
  /** @type {PerspectiveCamera} */
  camera;

  /**
   * Sets up the Scene
   * @param {PerspectiveCamera} camera
   * @param {RAPIER.World} physicsWorld
   */
  initialize(camera, physicsWorld) {
    this.camera = camera;
    this.physicsWorld = physicsWorld;

    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    this.setupLighting();
    this.setupPlayer();
    this.setupEnvironment();
    this.scene.background = new Color('skyblue');
  }

  setupLighting() {
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);
  }

  setupPlayer() {
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
      .setRestitution(0.0);

    const collider = this.physicsWorld.createCollider(colliderDesc, rigidBody);

    player.addComponent(RigidBody, rigidBody, collider);

    player.addComponent(PlayerController, this.physicsWorld);
    const cameraFollow = player.addComponent(CameraFollow, this.camera);
    cameraFollow.offset.set(0, 0.5, 0);
  }

  setupEnvironment() {
    const ground = this.entityManager.createEntity(this.scene, 'ground');
    const geometry = new PlaneGeometry(100, 100);
    const material = new MeshStandardMaterial({
      color: 0x888888,
      side: DoubleSide,
    });
    ground.addComponent(MeshInstance, geometry, material);
    ground.transform.rotateX(-Math.PI / 2);
    ground.transform.position.y = 0;

    const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0);

    const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.cuboid(50, 0.1, 50);
    const collider = this.physicsWorld.createCollider(colliderDesc, rigidBody);

    // ground.addComponent(RigidBody, rigidBody, collider);
  }
}

export { MainScene };
