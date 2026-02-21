import Phaser from 'phaser';
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#1a1a2e',
  scene: [CharacterSelectScene],
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
};

new Phaser.Game(config);
