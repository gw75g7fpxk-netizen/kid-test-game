/* global Phaser */
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';

const config = {
  type: Phaser.CANVAS,
  backgroundColor: '#1a1a2e',
  scene: [CharacterSelectScene],
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
    min: {
      width: 320,
      height: 480,
    },
    max: {
      width: 2048,
      height: 2732,
    },
  },
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
  input: {
    activePointers: 3,
  },
};

new Phaser.Game(config);
