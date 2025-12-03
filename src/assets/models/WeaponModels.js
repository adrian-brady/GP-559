import { BoxGeometry, CylinderGeometry, MeshStandardMaterial } from 'three';

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
