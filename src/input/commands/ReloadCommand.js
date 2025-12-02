import { PlayerController } from '../../components/PlayerController.js';
import { Command } from '../Command.js';

class ReloadCommand extends Command {
  /**
   *
   * @param {PlayerController} controller
   */
  execute(controller) {
    controller.handleReload();
  }
}

export { ReloadCommand };
