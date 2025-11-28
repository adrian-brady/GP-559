import { Object3D } from 'three';
import { Component } from './Component.js';

/**
 * @template T Element type
 * @param {T[]} array Array to remove an element from
 * @param {T} element Element to remove
 */
function removeArrayElement(array, element) {
  const ndx = array.indexOf(element);
  if (ndx >= 0) {
    array.splice(ndx, 1);
  }
}

/**
 * @typedef {new (entity: Entity, ...args: any[]) => Component} ComponentType
 */

class Entity {
  /** @type {string} */
  name;

  /** @type {Component[]} */
  components;

  /** @type {Object3D} */
  transform;

  /**
   * @param {Object3D} parent Parent Object3D for the entity
   * @param {string} name Name of the entity
   */
  constructor(parent, name) {
    this.name = name;
    this.components = [];
    this.transform = new Object3D();
    parent.add(this.transform);
  }

  /**
   *
   * @param {ComponentType} ComponentType
   * @param  {...any} args Arguments to pass to the constructor
   * @returns {Component}
   */
  addComponent(ComponentType, ...args) {
    const component = new ComponentType(this, ...args);
    this.components.push(component);
    return component;
  }

  /**
   * Queues a component for removal
   * @param {Component} component
   */
  removeComponent(component) {
    removeArrayElement(this.components, component);
  }

  /**
   *
   * @param {ComponentType} ComponentType
   * @returns {Component | undefined}
   */
  getComponent(ComponentType) {
    return this.components.find(c => c instanceof ComponentType);
  }

  /** Updates each component one tick */
  update() {
    for (const component of this.components) {
      component.update();
    }
  }
}

export { Entity };
