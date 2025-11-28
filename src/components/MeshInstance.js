import { BufferGeometry, Material, Mesh } from 'three';
import { Component } from '../ecs/Component.js';
import { Entity } from '../ecs/Entity.js';

/**
 * Component for rendering simple primitive meshes
 */
class MeshInstance extends Component {
  /** @type {Mesh} */
  mesh;

  /** @type {Material} */
  material;

  /**
   * @param {Entity} entity The parent entity
   * @param {BufferGeometry} geometry The mesh geometry
   * @param {Material} material The mesh material
   */
  constructor(entity, geometry, material) {
    super(entity);
    this.material = material;
    this.mesh = new Mesh(geometry, material);
    entity.transform.add(this.mesh);
  }

  /**
   * Update the mesh material
   * @param {Material} material
   */
  setMaterial(material) {
    this.material = material;
    this.mesh.material = material;
  }

  /**
   * Update the mesh geometry
   * @param {BufferGeometry} geometry
   */
  setGeometry(geometry) {
    this.mesh.geometry = geometry;
  }
}

export { MeshInstance };
