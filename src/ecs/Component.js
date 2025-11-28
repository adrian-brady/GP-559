import { Entity } from './Entity.js';

/**
 * Base for all components
 */
class Component {
  /** @type {Entity} */
  entity;

  /**
   * @param {Entity} entity The entity of this component
   */
  constructor(entity) {
    this.entity = entity;
  }

  /** Ticks the component */
  update() {}
}

export { Component };
