import { PlayerController } from '../PlayerController.js';
import { LeanState } from '../states/PlayerState.js';

/**
 * Controls the lean state of the player
 * Handles camera and body leaning
 */
class LeanController {
  /** @type {PlayerController} */
  player;

  /** @type {number} */
  leanAmount = 0; // -1 to 1

  /** @type {number} */
  leanSpeed = 5.0;

  /** @type {number} */
  maxLeanAngle = 0.3; // radians

  /** @type {number} */
  leanDistance = 0.5;

  /**
   * @param {PlayerController} player
   */
  constructor(player) {
    this.player = player;
  }

  /**
   * Update lean state and smoothly interpolate
   * @param {number} deltaTime
   */
  update(deltaTime) {
    let targetLean = 0;

    switch (this.player.leanState) {
      case LeanState.LEFT:
        targetLean = -1;
        break;
      case LeanState.RIGHT:
        targetLean = 1;
        break;
      case LeanState.NONE:
        targetLean = 0;
        break;
    }

    const leanDelta =
      (targetLean - this.leanAmount) * this.leanSpeed * deltaTime;
    this.leanAmount += leanDelta;

    this.leanAmount = Math.max(-1, Math.min(1, this.leanAmount));
  }

  /**
   * Handle lean left input (toggle)
   */
  handleLeanLeft() {
    if (this.player.leanState === LeanState.LEFT) {
      this.player.leanState = LeanState.NONE;
    } else {
      this.player.leanState = LeanState.LEFT;
    }
  }

  /**
   * Handle lean right input (toggle)
   */
  handleLeanRight() {
    if (this.player.leanState === LeanState.RIGHT) {
      this.player.leanState = LeanState.NONE;
    } else {
      this.player.leanState = LeanState.RIGHT;
    }
  }

  /**
   * Get camera offset for current lean
   * @returns {{ x: number, z: number, roll: number }}
   */
  getCameraOffset() {
    return {
      x: this.leanAmount * this.leanDistance,
      z: 0,
      roll: this.leanAmount * this.maxLeanAngle,
    };
  }
}

export { LeanController };
