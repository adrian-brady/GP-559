import { Component } from '../ecs/Component.js';
import { Vector3 } from 'three';
import { IdleState } from './states/IdleState.js';
import { PlayerState } from './states/PlayerState.js';

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

  /**
   * @param {Entity} entity
   */
  constructor(entity) {
    super(entity);
    this.velocity = new Vector3();
    this.push(new IdleState(this));
  }

  /**
   * Push a state onto the stack
   * @param {PlayerState} state
   */
  push(state) {
    state.enter(this);
    this.stateStack.push(state);
  }

  /**
   * Pop the current state
   */
  pop() {
    const state = this.stateStack.pop();
    if (state) {
      state.exit(this);
    }

    // Call enter on new top state
    const newTop = this.stateStack[this.stateStack.length - 1];
    if (newTop) {
      newTop.reenter(this);
    }
  }

  /**
   * Replace current state
   * @param {PlayerState} state
   */
  change(state) {
    this.pop();
    this.push(state);
  }

  /**
   * Get current (top) state
   * @returns {PlayerState}
   */
  current() {
    return this.stateStack[this.stateStack.length - 1];
  }

  /**
   * Called by MoveCommand
   * @param {Vector3} direction
   */
  handleMove(direction) {
    this.current()?.handleMove(this, direction);
  }

  /**
   * Called by JumpCommand
   */
  handleJump() {
    this.current()?.handleJump(this);
  }

  /**
   * @param {number} deltaTime
   */
  update(deltaTime) {
    const currentState = this.current();
    if (currentState) {
      currentState.update(this, deltaTime);
    }

    this.entity.transform.position.add(
      this.velocity.clone().multiplyScalar(deltaTime)
    );
  }
}

export { PlayerController };
