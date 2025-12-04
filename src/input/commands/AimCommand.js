import { PlayerController } from '../../components/PlayerController.js';
import { Command } from '../Command.js';

class AimCommand extends Command {
  /**
   * @param {PlayerController} controller
   */
  execute(controller) {
    console.log('executing handleAim');
    controller.handleAim();
  }
}

export { AimCommand };
