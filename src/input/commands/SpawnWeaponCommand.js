import { PerspectiveCamera, Vector3 } from 'three';
import { EntitySpawner } from '../../systems/EntitySpawner.js';
import { Command } from '../Command.js';
import { PlayerController } from '../../components/PlayerController.js';

class SpawnWeaponCommand extends Command {
  /**
   *
   * @param {EntitySpawner} entitySpawner
   * @param {PerspectiveCamera} camera
   * @param {string} weaponType
   */
  constructor(entitySpawner, camera, weaponType) {
    super();
    this.entitySpawner = entitySpawner;
    this.camera = camera;
    this.weaponType = weaponType;
  }

  /**
   * @param {PlayerController} controller
   */
  async execute(controller) {
    const playerEntity = controller.entity;
    const playerPos = playerEntity.transform.position;

    const forward = this.camera.getWorldDirection(new Vector3());
    forward.y = 0;
    forward.normalize();

    const spawnDistance = 2;
    const spawnPos = {
      x: playerPos.x + forward.x * spawnDistance,
      y: playerPos.y + 0.5,
      z: playerPos.z + forward.z * spawnDistance,
    };

    this.entitySpawner.spawnWeapon(this.weaponType, spawnPos);
  }
}

export { SpawnWeaponCommand };
