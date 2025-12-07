import { Box3, Group, Mesh, Scene, Vector3 } from 'three';
import { EntityManager } from '../managers/EntityManager.js';
import { Component } from '../ecs/Component.js';
import { MeshInstance } from '../components/MeshInstance.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { RigidBody } from '../components/RigidBody.js';
import { createAK47, loadAK47 } from '../assets/models/WeaponModels.js';
import { ModelInstance } from '../components/ModelInstance.js';
import { DecalSystem } from './DecalSystem.js';
import { DeathBehavior } from '../components/Health.js';

class EntitySpawner {
  /** @type {Scene} */
  scene;

  /** @type {EntityManager} */
  entityManager;

  /** @type {RAPIER.World} */
  physicsWorld;

  /**
   *
   * @param {Scene} scene
   * @param {EntityManager} entityManager
   * @param {RAPIER.World} physicsWorld
   * @param {DecalSystem} decalSystem
   */
  constructor(scene, entityManager, physicsWorld, decalSystem) {
    this.scene = scene;
    this.entityManager = entityManager;
    this.physicsWorld = physicsWorld;
  }

  /**
   *
   * @param {string} name - Entity name
   * @param {Group|Mesh} model
   * @param {Vector3} position
   * @param {Object} physicsConfig - Physics configuration
   * @param {Component[]} additionalComponents - Extra components to add
   * @param {Object|null} healthConfig - Optional health config {maxHealth, deathBehavior, onDeath, deathData}
   */
  spawnObject(
    name,
    model,
    position,
    physicsConfig,
    additionalComponents = [],
    healthConfig = null
  ) {
    const entity = this.entityManager.createEntity(this.scene, name);

    if (model instanceof Group) {
      entity.addComponent(ModelInstance, model);
    } else {
      entity.addComponent(MeshInstance, model);
    }

    entity.transform.position.set(position.x, position.y, position.z);

    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinearDamping(physicsConfig.linearDamping ?? 1.0)
      .setAngularDamping(physicsConfig.angularDamping ?? 2.0);

    const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc);

    const colliderDesc = physicsConfig.colliderDesc
      .setFriction(physicsConfig.friction ?? 0.8)
      .setRestitution(physicsConfig.restitution ?? 0.3)
      .setDensity(physicsConfig.density ?? 1.0);

    const collider = this.physicsWorld.createCollider(colliderDesc, rigidBody);
    collider.userData = { entity: entity, type: 'entity' };
    entity.addComponent(RigidBody, rigidBody, collider, this.physicsWorld);

    if (healthConfig) {
      entity.addComponent(
        Health,
        healthConfig.maxHealth || 100,
        healthConfig.deathBehavior || DeathBehavior.DISAPPEAR,
        healthConfig.onDeath || null,
        healthConfig.deathData || null
      );
    }

    additionalComponents.forEach(({ component, ...args }) => {
      entity.addComponent(component, ...Object.values(args));
    });

    return entity;
  }

  /**
   * Convenience method for spawning weapons
   */
  async spawnWeapon(weaponType, position) {
    let model;
    try {
      if (weaponType == 'ak47') {
        model = await loadAK47();
      } else {
        model = createAK47(); // Fallback
      }
    } catch (error) {
      console.error('Failed to load weapon model, using fallback:', error);
      model = createAK47();
    }

    const boundingBox = new Box3().setFromObject(model);
    const size = new Vector3();
    boundingBox.getSize(size);

    const halfX = size.x / 2;
    const halfY = size.y / 2;
    const halfZ = size.z / 2;

    const physicsConfig = {
      colliderDesc: RAPIER.ColliderDesc.cuboid(
        halfX,
        halfY,
        halfZ
      ).setCollisionGroups(0x00020002),
      linearDamping: 1.0,
      angularDamping: 2.0,
      friction: 0.8,
      restitution: 0.3,
      density: 2.0,
    };

    return this.spawnObject(
      `weapon_${weaponType}_${Date.now()}`,
      model,
      position,
      physicsConfig,
      []
    );
  }
}

export { EntitySpawner };
