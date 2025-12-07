import { Vector3 } from 'three';
import { Component } from '../ecs/Component.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { RigidBody } from './RigidBody.js';

export const AIBehavior = {
  IDLE: 'idle', // Stands still
  PATROL: 'patrol', // Walkbs between waypoints
  WANDER: 'wander', // Random walking
  FLEE: 'flee', // Runs away from target
  CHASE: 'chase', // Follows a target
};

class AIController extends Component {
  /** @type {AIBehavior} */
  behaviorType;

  /** @type {Entity|null} */
  target;

  /** @type {number} */
  speed;

  /** @type {number} */
  detectionRange;

  /** @type {Vector3} */
  waypoints;

  /** @type {number} */
  currentWaypointIndex;

  /** @type {Vector3} */
  spawnPosition;

  /** @type {Vector3} */
  wanderTarget;

  /** @type {number} */
  wanderTimer;

  /** @type {number} */
  wanderInterval;

  /** @type {number} */
  waypointReachedDistance;

  /** @type {RAPIER.World} */
  physicsWorld;

  /** @type {boolean} */
  isActive;

  /**
   * @param {Entity} entity
   * @param {RAPIER.World} physicsWorld
   * @param {AIBehavior} behaviorType
   * @param {Object} config
   */
  constructor(
    entity,
    physicsWorld,
    behaviorType = AIBehavior.IDLE,
    config = {}
  ) {
    super(entity);
    this.physicsWorld = physicsWorld;
    this.behaviorType = behaviorType;
    this.target = config.target || null;
    this.speed = config.speed || 2.0;
    this.detectionRange = config.detectionRange || 10.0;
    this.waypoints = config.waypoints || [];
    this.currentWaypointIndex = 0;
    this.waypointReachedDistance = config.waypointReachedDistance || 1.0;
    this.wanderInterval = config.wanderInterval || 3.0;
    this.wanderTimer = 0;
    this.wanderTarget = null;
    this.isActive = true;

    this.spawnPosition = entity.transform.position.clone();
  }

  /**
   * Update loop
   * @param {number} deltaTime
   */
  update(deltaTime) {
    if (!this.isActive) return;

    if (this.entity.isDead || this.entity.isRagdoll) {
      this.isActive = false;
      return;
    }

    switch (this.behaviorType) {
      case AIBehavior.IDLE:
        this.updateIdle(deltaTime);
        break;
      case AIBehavior.PATROL:
        this.updatePatrol(deltaTime);
        break;
      case AIBehavior.WANDER:
        this.updateWander(deltaTime);
        break;
      case AIBehavior.CHASE:
        this.updateChase(deltaTime);
        break;
      case AIBehavior.FLEE:
        this.updateFlee(deltaTime);
        break;
      default:
        console.warn(`Unknown AI behavior: ${this.behaviorType}`);
    }
  }

  /**
   * Idle - do nothing
   */
  updateIdle(deltaTime) {
    this.stopMovement();
  }

  /**
   * Patrol - move between waypoints
   */
  updatePatrol(deltaTime) {
    if (this.waypoints.length === 0) {
      console.warn(`${this.entity.name} has PATROL behavior but no waypoints`);
      this.stopMovement();
      return;
    }
    const currentWaypoint = this.waypoints[this.currentWaypointIndex];
    const reached = this.moveTowards(currentWaypoint, deltaTime);

    if (reached) {
      this.currentWaypointIndex =
        (this.currentWaypointIndex + 1) % this.waypoints.length;
      console.log(
        `${this.entity.name} reached waypoint, moving to index
          ${this.currentWaypointIndex}`
      );
    }
  }

  /**
   * Wander - move to random positions
   */
  updateWander(deltaTime) {
    this.wanderTimer += deltaTime;

    if (!this.wanderTarget || this.wanderTimer >= this.wanderInterval) {
      this.wanderTimer = 0;
      const randomOffset = new Vector3(
        (Math.random() - 0.5) * 20,
        0,
        (Math.random() - 0.5) * 20
      );
      this.wanderTarget = this.spawnPosition.clone().add(randomOffset);
      console.log(
        `${this.entity.name} wandering to new target:`,
        this.wanderTarget
      );
    }

    const reached = this.moveTowards(this.wanderTarget, deltaTime);
    if (reached) {
      this.wanderTimer = this.wanderInterval;
    }
  }

  /**
   * Chase - follow target entity
   */
  updateChase(deltaTime) {
    if (!this.target || !this.target.transform) {
      console.warn(`${this.entity.name} has CHASE behavior but no
    valid target`);
      this.stopMovement();
      return;
    }

    const targetPos = this.target.transform.position;
    this.moveTowards(targetPos, deltaTime);
  }

  /**
   * Flee - run away from target
   */
  updateFlee(deltaTime) {
    if (!this.target || !this.target.transform) {
      console.warn(`${this.entity.name} has FLEE behavior but no
    valid target`);
      this.stopMovement();
      return;
    }

    const myPos = this.entity.transform.position;
    const targetPos = this.target.transform.position;

    const fleeDirection = new Vector3()
      .subVectors(myPos, targetPos)
      .normalize();

    const fleeTarget = myPos.clone().add(fleeDirection.multiplyScalar(10));
    this.moveTowards(fleeTarget, deltaTime);
  }

  /**
   * Move towards a target position using physics
   * @param {Vector3} targetPosition
   * @param {number} deltaTime
   * @returns {boolean} - True if reached target
   */
  moveTowards(targetPosition, deltaTime) {
    /** @type {RigidBody} */
    const rigidBody = this.entity.getComponent(RigidBody);
    if (!rigidBody || !rigidBody.body) {
      console.warn(`${this.entity.name} has no RigidBody
    component`);
      return false;
    }

    const currentPos = this.entity.transform.position;
    const direction = new Vector3()
      .subVectors(targetPosition, currentPos)
      .setY(0)
      .normalize();

    const distance = currentPos.distanceTo(
      new Vector3(targetPosition.x, currentPos.y, targetPosition.z)
    );

    if (distance < this.waypointReachedDistance) {
      this.stopMovement();
      return true;
    }

    const targetVelocity = direction.multiplyScalar(this.speed);
    const currentVel = rigidBody.body.linvel();
    const currentHorizontal = new Vector3(currentVel.x, 0, currentVel.z);

    const acceleration = 5.0; // Smooth acceleration
    const newHorizontal = new Vector3().lerpVectors(
      currentHorizontal,
      targetVelocity,
      acceleration * deltaTime
    );

    rigidBody.body.setLinvel(
      {
        x: newHorizontal.x,
        y: currentVel.y,
        z: newHorizontal.z,
      },
      true
    );

    return false;
  }

  /**
   * Stop all horizontal movement
   */
  stopMovement() {
    /** @type {RigidBody} */
    const rigidBody = this.entity.getComponent(RigidBody);
    if (!rigidBody || !rigidBody.body) return;

    const currentVel = rigidBody.body.linvel();
    rigidBody.body.setLinvel(
      {
        x: 0,
        y: currentVel.y,
        z: 0,
      },
      true
    );
  }

  /**
   * Change AI behavior at runtime
   * @param {AIBehavior} newBehavior
   */
  setBehavior(newBehavior) {
    console.log(
      `${this.entity.name} changing behavior from ${this.behaviorType} to ${newBehavior}`
    );
    this.behaviorType = newBehavior;
    this.wanderTarget = null;
    this.wanderTimer = 0;
  }

  /**
   * Set patrol waypoints
   * @param {Vector3[]} waypoints
   */
  setWaypoints(waypoints) {
    this.waypoints = waypoints;
    this.currentWaypointIndex = 0;
  }

  /**
   * Set chase/flee target
   * @param {Entity} target
   */
  setTarget(target) {
    this.target = target;
  }
}

export { AIController };
