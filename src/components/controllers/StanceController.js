import { PlayerController } from '../PlayerController.js';
import { StanceState, GroundingState } from '../states/PlayerState.js';

/**
 * Controls the stance layer (standing/crouching/prone)
 * Handles stance transitions and constraints
 */
class StanceController {
  /** @type {PlayerController} */
  player;

  /**
   * @param {PlayerController} player
   */
  constructor(player) {
    this.player = player;
  }

  /**
   * Update stance state
   * @param {number} deltaTime
   */
  update(deltaTime) {
    if (this.player.groundingState === GroundingState.AIRBORNE) {
      if (this.player.stanceState !== StanceState.STANDING) {
        this.player.stanceState = StanceState.STANDING;
      }
    }
  }

  /**
   * Handle crouch input (toggle)
   */
  handleCrouch() {
    if (this.player.groundingState !== GroundingState.GROUNDED) {
      return;
    }

    if (this.player.stanceState === StanceState.CROUCHING) {
      this.player.stanceState = StanceState.STANDING;
    } else if (this.player.stanceState === StanceState.STANDING) {
      this.player.stanceState = StanceState.CROUCHING;
    } else if (this.player.stanceState === StanceState.PRONE) {
      this.player.stanceState = StanceState.CROUCHING;
    }
  }

  /**
   * Handle prone input (toggle)
   */
  handleProne() {
    if (this.player.groundingState !== GroundingState.GROUNDED) {
      return;
    }

    if (this.player.stanceState === StanceState.PRONE) {
      this.player.stanceState = StanceState.STANDING;
    } else {
      this.player.stanceState = StanceState.PRONE;
    }
  }

  /**
   * Force standing stance state
   */
  forceStanding() {
    this.player.stanceState = StanceState.STANDING;
  }
}

export { StanceController };
