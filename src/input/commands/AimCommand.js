import { PlayerController } from '../../components/PlayerController.js';
import { Command } from '../Command.js';

class AimCommand extends Command {
  /**
   * @param {PlayerController} controller
   */
  execute(controller) {
    controller.handleAim();
  }
}

export { AimCommand };
