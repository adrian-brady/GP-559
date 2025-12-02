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

class MainScene extends GameScene {
  /** @type {PerspectiveCamera} */
  camera;

  /**
   * Sets up the Scene
   * @param {PerspectiveCamera} camera
   */
  initialize(camera) {
    this.camera = camera;

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
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshStandardMaterial({ color: 0x00ff00 });
    //player.addComponent(MeshInstance, geometry, material);
    player.transform.position.set(0, -3, 0);
    player.addComponent(PlayerController);
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
    ground.transform.position.y = -5;
  }
}

export { MainScene };
