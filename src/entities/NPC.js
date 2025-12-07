import { CapsuleGeometry, MeshStandardMaterial, Scene, Vector3 } from 'three';
import { EntityManager } from '../managers/EntityManager.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { DeathBehavior, Health } from '../components/Health.js';
import { MeshInstance } from '../components/MeshInstance.js';
import { RigidBody } from '../components/RigidBody.js';

/**
 * Configuration for creating an NPC
 * @typedef {Object} NPCConfig
 * @property {string} name - NPC name
 * @property {Vector3} position - Starting position {x, y, z}
 * @property {number} [health] - Max health (default: 100)
 * @property {DeathBehavior} [deathBehavior] - How NPC dies
 * @property {number} [height] - NPC height (default: 2)
 * @property {number} [radius] - NPC capsule radius (default: 0.4)
 * @property {Function} [onDeath] - Custom death callback
 * @property {any} [deathData] - Custom death data
 */

/**
 * Create an NPC entity
 * @param {EntityManager} entityManager
 * @param {Scene} scene
 * @param {RAPIER.World} physicsWorld
 * @param {NPCConfig} config
 * @returns {Entity}
 */
export function createNPC(entityManager, scene, physicsWorld, config) {
  const {
    name = 'npc',
    position = { x: 0, y: 2, z: 0 },
    health = 100,
    deathBehavior = DeathBehavior.RAGDOLL,
    height = 2,
    radius = 0.4,
    color = 0xff0000,
    onDeath = null,
    deathData = null,
  } = config;

  const npc = entityManager.createEntity(scene, name);

  const geometry = new CapsuleGeometry(radius, height - radius * 2, 4, 8);
  const material = new MeshStandardMaterial({ color });
  const meshInstance = npc.addComponent(MeshInstance, geometry, material);
  meshInstance.mesh.castShadow = true;
  meshInstance.mesh.receiveShadow = true;

  npc.transform.position.set(position.x, position.y, position.z);

  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(position.x, position.y, position.z)
    .setLinearDamping(2.0)
    .setAngularDamping(5.0)
    .lockRotations();

  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.capsule(
    (height - radius * 2) / 2,
    radius
  )
    .setFriction(0.5)
    .setRestitution(0.0)
    .setCollisionGroups(0x00020002);

  const collider = physicsWorld.createCollider(colliderDesc, rigidBody);

  collider.userData = { entity: npc, type: 'entity' };
  npc.addComponent(Health, health, deathBehavior, onDeath, deathData);
  npc.isNPC = true;

  return npc;
}

/**
 *
 * @param {EntityManager} entityManager
 * @param {Scene} scene
 * @param {RAPIER.World} physicsWorld
 * @param {Object} config
 * @returns {Entity}
 */
export function createTargetDummy(entityManager, scene, physicsWorld, config) {
  const {
    name = 'target_dummy',
    position = { x: 0, y: 1, z: -5 },
    health = 50,
    color = 0xffaa00,
  } = config;

  const npc = createNPC(entityManager, scene, physicsWorld, {
    name,
    position,
    health,
    deathBehavior: DeathBehavior.DISAPPEAR,
    color,
    onDeath: entity => {
      console.log('Target destroyed');
    },
  });

  const rigidBody = npc.getComponent(RigidBody);
  if (rigidBody && rigidBody.body) {
    rigidBody.body.setBodyType(RAPIER.RigidBodyType.Fixed);
  }

  return npc;
}
