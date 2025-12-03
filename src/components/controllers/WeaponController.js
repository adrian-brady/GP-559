import { PlayerController } from '../PlayerController.js';
import { WeaponState } from '../states/PlayerState.js';
import { Weapon } from '../Weapon.js';

/**
 * Controls the weapon layer (hipfire/ADS/reload)
 * Handles aiming and weapon actions
 */
class WeaponController {
  /** @type {PlayerController} */
  player;

  /** @type {boolean} */
  isAiming = false;

  /** @type {number} */
  reloadTimer = 0;

  // Reload duration should be indicated by the current weapon

  /**
   * @param {PlayerController} player
   */
  constructor(player) {
    this.player = player;
  }

  /**
   * Update weapon state
   * @param {number} deltaTime
   * @returns
   */
  update(deltaTime) {
    if (this.player.weaponState === WeaponState.RELOAD) {
      this.reloadTimer -= deltaTime;

      if (this.reloadTimer <= 0) {
        // Reload complete, return to previous state?
        // Currently just returns to hipfire
        this.player.weaponState = WeaponState.HIPFIRE;
        this.reloadTimer = 0;
      }
      return; // Cant change states while reloading
    }

    if (this.isAiming) {
      this.player.weaponState = WeaponState.ADS;
    } else {
      this.player.weaponState = WeaponState.HIPFIRE;
    }
  }

  /**
   * Handle aim input (hold)
   */
  handleAim() {
    if (this.player.weaponState !== WeaponState.RELOAD) {
      this.isAiming = true;
    }
  }

  /**
   * Handle aim release
   */
  handleAimRelease() {
    this.isAiming = false;
  }

  /**
   * Handle reload input
   */
  handleReload() {
    if (this.player.weaponState !== WeaponState.RELOAD) {
      this.player.weaponState = WeaponState.RELOAD;

      const weapon = this.player.entity.getComponent(Weapon);
      if (weapon) {
        this.reloadTimer = weapon.definition.stats.reloadTime;
        weapon.startReload();
        console.log('Starting reload animation');
      } else {
        this.reloadTimer = 2.0;
      }
    }
  }

  /**
   * Handle focus hipfire
   */
  handleFocusAim() {
    if (this.player.weaponState !== WeaponState.RELOAD) {
      this.player.weaponState = WeaponState.FOCUS_HIPFIRE;
    }
  }
}

export { WeaponController };
