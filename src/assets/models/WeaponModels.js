import {
  BoxGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  Group,
  Mesh,
} from 'three';
import { FBXLoader } from '../../lib/three/examples/jsm/loaders/FBXLoader.js';

const fbxLoader = new FBXLoader();

const modelCache = {};

/**
 * Load an FBX weapon model
 * @param {string} modelPath
 * @returns {Promise<Group>}
 */
async function loadWeaponModel(modelPath) {
  if (modelCache[modelPath]) {
    return modelCache[modelPath].clone();
  }

  return new Promise((resolve, reject) => {
    fbxLoader.load(
      modelPath,
      object => {
        object.scale.set(0.01, 0.01, 0.01);

        console.log('=== Weapon Structure ===');
        console.log('Root:', object.name);

        // Color code each mesh to identify parts
        const debugColors = [
          0xff0000, // red
          0x00ff00, // green
          0x0000ff, // blue
          0xffff00, // yellow
          0xff00ff, // magenta
          0x00ffff, // cyan
          0xffffff, // white
        ];

        let meshIndex = 0;

        object.traverse(child => {
          console.log(`- ${child.name} (${child.type})`);
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = false;

            const debugColor = debugColors[meshIndex % debugColors.length];
            // child.material = new MeshStandardMaterial({
            //   color: debugColor,
            //   roughness: 0.7,
            //   metalness: 0.3,
            // });

            console.log(`  Color: ${debugColor.toString(16)} for
              ${child.name}`);

            meshIndex++;

            if (Array.isArray(child.material)) {
              child.material = child.material.map(mat => {
                if (!mat) {
                  return new MeshStandardMaterial({
                    color: 0x444444,
                    roughness: 0.7,
                    metalness: 0.3,
                  });
                }
                mat.side = 2;
                mat.opacity = 1.0;
                mat.transparent = false;
                mat.needsUpdate = true;
                return mat;
              });
            } else if (!child.material) {
              child.material = new MeshStandardMaterial({
                color: 0x444444,
                roughness: 0.7,
                metalness: 0.3,
              });
            } else {
              child.material.sid = 2;
              child.material.opacity = 1.0;
              child.material.transparent = false;
              child.material.needsUpdate = true;
            }

            // console.log('Mesh:', child.name, 'Material:', child.material);
          }
        });

        modelCache[modelPath] = object;
        resolve(object.clone());
      },
      undefined,
      error => {
        console.error('Error loading weapon model:', error);
        reject(error);
      }
    );
  });
}

/**
 * Load AK47 model
 * @returns {Promise<Group>}
 */
async function loadAK47() {
  return await loadWeaponModel('./src/assets/models/weapons/Weapon_02.fbx');
}

/**
 * Creates an AK-47 style weapon model
 * @returns {Group}
 */
function createAK47() {
  const weaponGroup = new Group();

  const woodMaterial = new MeshStandardMaterial({
    color: 0xb4513,
    roughness: 0.8,
    metalness: 0.1,
  });

  const metalMaterial = new MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.4,
    metalness: 0.8,
  });

  // Main body receiver
  const receiverGeometry = new BoxGeometry(0.15, 0.15, 0.6);
  const receiver = new Mesh(receiverGeometry, metalMaterial);
  receiver.position.set(0, 0, -0.1);
  receiver.castShadow = true;
  weaponGroup.add(receiver);

  // Barrel
  const barrelGeometry = new CylinderGeometry(0.02, 0.02, 0.5, 8);
  const barrel = new Mesh(barrelGeometry, metalMaterial);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0, 0.02, 0.55);
  barrel.castShadow = true;
  weaponGroup.add(barrel);

  return weaponGroup;
}

export { createAK47, loadAK47, loadWeaponModel };
