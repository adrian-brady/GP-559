import { PlayerController } from '../../components/PlayerController.js';
import { Command } from '../Command.js';

class FireCommand extends Command {
  /**
   * @param {PlayerController} controller
   */
  execute(controller) {
    controller.handleFire();
  }
}

export { FireCommand };
