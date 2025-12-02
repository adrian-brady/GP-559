import { PlayerController } from '../../components/PlayerController.js';
import { Command } from '../Command.js';

/**
 * A command to crouch
 */
class CrouchCommand extends Command {
  /**
   * Instructs the controller to crouch
   * @param {PlayerController} controller
   */
  execute(controller) {
    controller.handleCrouch();
  }
}

export { CrouchCommand };
