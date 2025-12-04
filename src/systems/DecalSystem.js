import {
  Scene,
  Mesh,
  PlaneGeometry,
  Vector3,
  Object3D,
  MeshBasicMaterial,
  DoubleSide,
  Quaternion,
} from 'three';

class DecalSystem {
  /** @type {Scene} */
  scene;
  /** @type {Mesh[]} */
  decals = [];

  /** @type {number} */
  maxDecals = 100;

  /** @type {number} */
  decalSize = 0.1;

  /**
   *
   * @param {Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Add a decal at the point
   * @param {Vector3} position - World position of hit
   * @param {Vector3} normal - Surface normal at hit point
   * @param {Object3D} hitObject - The Three.js object that was hit
   * @param {string} surfaceType - Type of surface
   */
  addDecal(position, normal, hitObject = null, surfaceType = 'static') {
    if (surfaceType === 'entity' || surfaceType === 'dynamic') {
      console.log('Skipping decal on dynamic entity');
      return;
    }

    const geometry = new PlaneGeometry(this.decalSize, this.decalSize);
    const material = new MeshBasicMaterial({
      color: 0x222222,
      side: DoubleSide,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    const decal = new Mesh(geometry, material);

    if (hitObject) {
      const localPosition = hitObject.worldToLocal(position.clone());
      const localNormal = normal.clone();

      // Transform normal to local space
      const worldQuaternion = hitObject.getWorldQuaternion(new Quaternion());
      localNormal.applyQuaternion(worldQuaternion.invert());

      // Position decal in local space
      decal.position.copy(localPosition);
      decal.position.addScaledVector(localNormal, 0.001);

      // Align with surface normal in local space
      decal.lookAt(localPosition.clone().add(localNormal));

      // Parent to the hit object so it moves with it
      hitObject.add(decal);

      this.decals.push({ mesh: decal, parent: hitObject });
    } else {
      // No parent - add to scene (for static world geometry without a parent)
      decal.position.copy(position);
      decal.position.addScaledVector(normal, 0.001);
      decal.lookAt(position.clone().add(normal));

      this.scene.add(decal);
      this.decals.push({ mesh: decal, parent: this.scene });
    }

    if (this.decals.length > this.maxDecals) {
      const oldDecal = this.decals.shift();
      this.scene.remove(oldDecal);
      oldDecal.geometry.dispose();
      oldDecal.material.dispose();
    }
  }

  /**
   * Clear all decals
   */
  clearAll() {
    this.decals.forEach(decal => {
      this.scene.remove(decal);
      decal.geometry.dispose();
      decal.material.dispose();
    });
    this.decals = [];
  }

  /**
   *
   * @param {number} deltaTime
   */
  update(deltaTime) {
    // TODO: implement fading
  }
}

export { DecalSystem };
