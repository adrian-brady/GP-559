import RAPIER from '@dimforge/rapier3d-compat';
import { Component } from '../ecs/Component.js';
import { Entity } from '../ecs/Entity.js';
import { RigidBody } from './RigidBody.js';

export const DeathBehavior = {
  DISAPPEAR: 'disappear',
  RAGDOLL: 'ragdoll',
  DEATH_ANIMATION: 'death_animation',
  DROP_ITEMS: 'drop_items',
  PERSIST: 'persist',
};

class Health extends Component {
  /** @type {number} */
  maxHealth;

  /** @type {number} */
  currentHealth;

  /** @type {DeathBehavior} */
  deathBehavior;

  /** @type {boolean} */
  isDead;

  /** @type {Function|null} */
  onDeathCallback;

  /** @type {any} */
  deathData;

  /**
   * @param {Entity} entity
   * @param {number} maxHealth
   * @param {DeathBehavior} deathBehavior
   * @param {Function|null} onDeathCallback
   * @param {any} deathData
   */
  constructor(
    entity,
    maxHealth = 100,
    deathBehavior = DeathBehavior.DISAPPEAR,
    onDeathCallback = null,
    deathData = null
  ) {
    super(entity);
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.deathBehavior = deathBehavior;
    this.onDeathCallback = onDeathCallback;
    this.deathData = deathData;
    this.isDead = false;
  }

  /**
   * Apply damage to this entity
   * @param {number} amount
   * @returns {boolean} - True if entity died from this damage
   */
  takeDamage(amount) {
    if (this.isDead) return false;

    this.currentHealth -= amount;
    console.log('entity hit, health left:', this.currentHealth);
    if (this.currentHealth <= 0) {
      this.currentHealth = 0;
      this.die();
      return true;
    }

    return false;
  }

  /**
   * Heal this entity
   * @param {number} amount - Heal amount
   */
  heal(amount) {
    if (this.isDead) return;
    this.currentHealth = Math.min(this.currentHealth + amount, this.maxHealth);
  }

  /**
   * Handle entity death
   */
  die() {
    if (this.isDead) return;
    console.log('dead');

    this.isDead = true;

    if (this.onDeathCallback) {
      this.onDeathCallback(this.entity);
    }

    this.executeDeathBehavior();
  }

  /**
   * Execute the configured death behavior
   */
  executeDeathBehavior() {
    switch (this.deathBehavior) {
      case DeathBehavior.DISAPPEAR:
        this.handleDisappear();
        break;
      case DeathBehavior.RAGDOLL:
        this.handleRagdoll();
        break;
      case DeathBehavior.DEATH_ANIMATION:
        this.handleDeathAnimation();
        break;
      case DeathBehavior.DROP_ITEMS:
        this.handleDropItems();
        break;
      case DeathBehavior.PERSIST:
        this.handlePersist();
        break;
      default:
        console.warn(`Unknown death behavior: ${this.deathBehavior}`);
        this.handleDisappear();
    }
  }

  /**
   * Disappear - mark entity for removal
   */
  handleDisappear() {
    this.entity.markedForDeath = true;
  }

  /**
   * Ragdoll - Disable normal physics, enable ragdoll
   */
  handleRagdoll() {
    /** @type {RigidBody} */
    const rigidBody = this.entity.getComponent(RigidBody);
    if (rigidBody) {
      rigidBody.disable();
    }
    this.entity.isRagdoll = true;
  }

  /**
   * Death animation - play animation then handle cleanup
   */
  handleDeathAnimation() {
    this.entity.isPlayingDeathAnimation = true;

    if (this.deathData?.animationName) {
      this.entity.deathAnimationNAme = this.deathData.animationName;
    }

    if (this.deathData?.removeAfterAnimation) {
      this.entity.markedForDeath = true;
    }
  }

  /**
   * Drop items - spawn item entities then handle cleanup
   */
  handleDropItems() {
    this.entity.shouldDropItems = true;
    if (this.deathData?.items) {
      this.entity.itemsToDrop = this.deathData.items;
    }

    this.entity.markedForDeath = true;
  }

  /**
   * Persist - stay in world but become inactive
   */
  handlePersist() {
    const rigidBody = this.entity.getComponent(RigidBody);
    if (rigidBody && rigidBody.body) {
      rigidBody.body.setBodyType(RAPIER.RigidBodyType.Fixed);
    }
    this.entity.isPersistent = true;
  }

  /**
   * Get health percentage
   * @returns {number} Health as a percentage (0-1)
   */
  getHealthPercentage() {
    return this.currentHealth / this.maxHealth;
  }

  update(deltaTime) {}
}

export { Health };
