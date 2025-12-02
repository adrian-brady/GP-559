/**
 * Player state layer enums
 * Each layer represents an independent aspect of player state
 */

/**
 * Grounding Layer (mutually exclusive)
 * Determines if player is on ground or in air
 * @readonly
 * @enum {string}
 */
export const GroundingState = {
  GROUNDED: 'grounded',
  AIRBORNE: 'airborne',
};

/**
 * Movement Layer (mutually exclusive)
 * Determines if player is idle or moving
 * @readonly
 * @enum {string}
 */
export const MovementState = {
  IDLE: 'idle',
  MOVING: 'moving',
};

/**
 * Stance Layer (mutually exclusive)
 * Determines player's body position
 * @readonly
 * @enum {string}
 */
export const StanceState = {
  STANDING: 'standing',
  CROUCHING: 'crouching',
  PRONE: 'prone',
};

/**
 * Weapon Layer (mutually exclusive)
 * Determines weapon aiming/action state
 * @readonly
 * @enum {string}
 */
export const WeaponState = {
  HIPFIRE: 'hipfire',
  ADS: 'ads', // Aim Down Sights
  FOCUS_HIPFIRE: 'focus_hipfire',
  RELOAD: 'reload',
};

/**
 * Lean Layer (mutually exclusive)
 * Determines player lean direction
 * @readonly
 * @enum {string}
 */
export const LeanState = {
  NONE: 'none',
  LEFT: 'left',
  RIGHT: 'right',
};
