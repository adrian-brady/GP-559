import { World } from './ecs/World.js';
import { MainScene } from './scenes/MainScene.js';

function main() {
  const container = document.querySelector('#scene-container');

  const world = new World(container, MainScene);

  world.start();
}

main();
