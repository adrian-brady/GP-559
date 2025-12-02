import { Component } from '../ecs/Component.js';
import { Vector3 } from 'three';
import {
  GroundingState,
  LeanState,
  WeaponState,
  StanceState,
  MovementState,
} from './states/PlayerState.js';
import { GroundingController } from './controllers/GroundingController.js';
import { MovementController } from './controllers/MovementController.js';
import { StanceController } from './controllers/StanceController.js';
import { LeanController } from './controllers/LeanController.js';
import { WeaponController } from './controllers/WeaponController.js';
import RAPIER from '@dimforge/rapier3d-compat';

class PlayerController extends Component {
  /** @type {Vector3} */
  velocity;

  /** @type {number} */
  speed = 5;

  /** @type {number} */
  jumpForce = 10;

  /** @type {number} */
  gravity = 9.81;

  /** @type {boolean} */
  isGrounded = true;

  /** @type {PlayerState[]} */
  stateStack = [];

  groundingState = GroundingState.GROUNDED;
  movementState = MovementState.IDLE;
  stanceState = StanceState.STANDING;
  weaponState = WeaponState.HIPFIRE;
  leanState = LeanState.NONE;

  /** @type {GroundingController} */
  groundingController;

  /** @type {MovementController} */
  movementController;

  /** @type {StanceController} */
  stanceController;

  /** @type {WeaponController} */
  weaponController;

  /** @type {LeanController} */
  leanController;

  /** @type {RAPIER.World} */
  physicsWorld;

  /**
   * @param {Entity} entity
   * @param {RAPIER.World} physicsWorld
   */
  constructor(entity, physicsWorld) {
    super(entity);

    this.physicsWorld = physicsWorld;

    this.groundingController = new GroundingController(this);
    this.movementController = new MovementController(this);
    this.stanceController = new StanceController(this);
    this.weaponController = new WeaponController(this);
    this.leanController = new LeanController(this);
  }

  /**
   * Called by MoveCommand
   */
  handleMove(direction) {
    this.movementController.handleMove(direction);
  }

  /**
   * Called by JumpCommand
   */
  handleJump() {
    this.groundingController.handleJump();
  }

  /**
   * Called by CrouchCommand
   */
  handleCrouch() {
    this.stanceController.handleCrouch();
  }

  /**
   * Called by ProneCommand
   */
  handleProne() {
    this.stanceController.handleProne();
  }

  /**
   * Called by LeanLeftCommand
   */
  handleLeanLeft() {
    this.leanController.handleLeanLeft();
  }

  /**
   * Called by LeanRightCommand
   */
  handleLeanRight() {
    this.leanController.handleLeanRight();
  }

  /**
   * Called by AimCommand
   */
  handleAim() {
    this.weaponController.handleAim();
  }

  /**
   * Called by ReleaseAimCommand
   */
  handleAimRelease() {
    this.weaponController.handleAimRelease();
  }

  /**
   * Called by ReloadCommand
   */
  handleReload() {
    this.weaponController.handleReload();
  }

  /**
   * @param {number} deltaTime
   */
  update(deltaTime) {
    this.groundingController.update(deltaTime);
    this.movementController.update(deltaTime);
    this.stanceController.update(deltaTime);
    this.weaponController.update(deltaTime);
    this.leanController.update(deltaTime);
  }
}

export { PlayerController };
