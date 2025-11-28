import { Component } from '../ecs/Component.js';
import { Entity } from '../ecs/Entity.js';

class Player extends Component {
  /**
   * @param {Entity} entity
   */
  constructor(entity) {
    super(entity);

    const model = null;
    this.modelInstance = entity.addComponent(MeshInstance, model);
  }
}

export { Player };
