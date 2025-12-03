import { Group, Object3D } from 'three';
import { Component } from '../ecs/Component.js';
import { Entity } from '../ecs/Entity.js';

class ModelInstance extends Component {
  /** @type {Group|Object3D} */
  model;

  /**
   * @param {Entity} entity
   * @param {Group|Object3D} model
   */
  constructor(entity, model) {
    super(entity);
    this.model = model;
    entity.transform.add(this.model);
  }

  /**
   * Remove model from entity
   */
  destroy() {
    this.entity.transform.remove(this.model);
  }
}

export { ModelInstance };
