/* global Phaser */

// ---------------------------------------------------------------------------
// Character customisation options (8 traits)
// ---------------------------------------------------------------------------
const TRAITS = [
  {
    key: 'hairStyle',
    label: 'Hair Style',
    options: ['Short', 'Long', 'Curly', 'Spiky'],
  },
  {
    key: 'hairColor',
    label: 'Hair Color',
    options: ['Blonde', 'Brown', 'Black', 'Red'],
  },
  {
    key: 'skinTone',
    label: 'Skin Tone',
    options: ['Light', 'Medium', 'Tan', 'Dark'],
  },
  {
    key: 'eyeColor',
    label: 'Eye Color',
    options: ['Blue', 'Brown', 'Green', 'Gray'],
  },
  {
    key: 'top',
    label: 'Top',
    options: ['T-Shirt', 'Hoodie', 'Jacket', 'Dress'],
  },
  {
    key: 'topColor',
    label: 'Top Color',
    options: ['Red', 'Blue', 'Green', 'Yellow'],
  },
  {
    key: 'bottom',
    label: 'Bottom',
    options: ['Jeans', 'Shorts', 'Skirt', 'Leggings'],
  },
  {
    key: 'accessory',
    label: 'Accessory',
    options: ['None', 'Hat', 'Glasses', 'Hat + Glasses'],
  },
];

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------
const HAIR_COLORS = {
  Blonde: 0xffd700,
  Brown: 0x8b4513,
  Black: 0x1a1a1a,
  Red: 0xcc2200,
};

const SKIN_TONES = {
  Light: 0xffe0bd,
  Medium: 0xd4a574,
  Tan: 0xc68642,
  Dark: 0x7c4a1e,
};

const EYE_COLORS = {
  Blue: 0x4169e1,
  Brown: 0x6b3a2a,
  Green: 0x228b22,
  Gray: 0x808080,
};

const TOP_COLORS = {
  Red: 0xe03c3c,
  Blue: 0x3c6ee0,
  Green: 0x3cb84a,
  Yellow: 0xe0c03c,
};

const BOTTOM_COLORS = {
  Jeans: 0x4a6fa5,
  Shorts: 0x8b6914,
  Skirt: 0xd4649a,
  Leggings: 0x2d2d2d,
};

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const MOBILE_BREAKPOINT = 700;   // px – below this width use single-column layout
const MOBILE_ROW_START_Y = 80;   // px – y position of first trait row on mobile
const MOBILE_ROW_HEIGHT = 46;    // px – height per trait row on mobile
const MOBILE_CHAR_HEIGHT = 310;  // px – approximate character drawing height
const MOBILE_BTN_MARGIN = 60;    // px – bottom margin above the Start button

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create() {
    // Track current index for each trait
    this._selections = {};
    TRAITS.forEach((t) => {
      this._selections[t.key] = 0;
    });

    // Restore selections saved before a resize-restart
    const saved = this.registry.get('_selections');
    if (saved) {
      this._selections = saved;
      this.registry.remove('_selections');
    }

    this._characterGraphics = this.add.graphics();
    this._accessoryGraphics = this.add.graphics();

    this._buildUI();
    this._drawCharacter();

    // Rebuild UI when viewport changes (mobile browser chrome show/hide)
    let resizeTimer = null;
    const onResize = () => {
      if (resizeTimer !== null) {
        resizeTimer.remove(false);
        resizeTimer = null;
      }
      resizeTimer = this.time.delayedCall(250, () => {
        resizeTimer = null;
        this.registry.set('_selections', { ...this._selections });
        this.scene.restart();
      });
    };
    this.scale.on('resize', onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', onResize, this));
  }

  // -------------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------------
  _buildUI() {
    const W = this.scale.width;
    const H = this.scale.height;
    const isMobile = W < MOBILE_BREAKPOINT;

    // Title
    this.add
      .text(W / 2, 28, 'Create Your Character', {
        fontSize: isMobile ? '22px' : '26px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(W / 2, 58, 'Customise 8 traits and watch your character update!', {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#aaaacc',
      })
      .setOrigin(0.5);

    if (isMobile) {
      // Mobile: single column of all 8 traits
      const pad = 8;
      const rowWidth = W - pad * 2;

      TRAITS.forEach((trait, i) => {
        this._buildTraitRow(
          trait,
          i,
          pad,
          MOBILE_ROW_START_Y + i * MOBILE_ROW_HEIGHT,
          rowWidth
        );
      });
    } else {
      // Desktop: two columns of 4
      const rowStartY = 100;
      const rowHeight = 58;
      const colX = [20, 420]; // left / right column x

      TRAITS.forEach((trait, i) => {
        const col = i < 4 ? 0 : 1;
        const row = i % 4;
        const x = colX[col];
        const y = rowStartY + row * rowHeight;

        this._buildTraitRow(trait, i, x, y, 370);
      });
    }

    // Confirm / Start button
    const btnY = H - 44;
    const btn = this.add
      .text(W / 2, btnY, '▶  Start Game', {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: '#5a3fa0',
        padding: { x: 24, y: 10 },
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#7a5fc0' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#5a3fa0' }));
    btn.on('pointerdown', () => this._onStartGame());
  }

  _buildTraitRow(trait, traitIndex, x, y, rowWidth = 370) {

    // Trait label
    this.add.text(x + 8, y + 8, trait.label, {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#ccccff',
      fontStyle: 'bold',
    });

    // Background pill
    this.add
      .rectangle(x + rowWidth / 2, y + 36, rowWidth, 30, 0x2a2a4a)
      .setOrigin(0.5);

    // Left arrow
    const leftArrow = this.add
      .text(x + 18, y + 36, '◀', {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffdd44',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    leftArrow.on('pointerover', () =>
      leftArrow.setStyle({ color: '#ffffff' })
    );
    leftArrow.on('pointerout', () =>
      leftArrow.setStyle({ color: '#ffdd44' })
    );
    leftArrow.on('pointerdown', () =>
      this._cycleOption(traitIndex, -1)
    );

    // Option label (will be updated)
    const optLabel = this.add
      .text(x + rowWidth / 2, y + 36, trait.options[0], {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Right arrow
    const rightArrow = this.add
      .text(x + rowWidth - 18, y + 36, '▶', {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffdd44',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    rightArrow.on('pointerover', () =>
      rightArrow.setStyle({ color: '#ffffff' })
    );
    rightArrow.on('pointerout', () =>
      rightArrow.setStyle({ color: '#ffdd44' })
    );
    rightArrow.on('pointerdown', () =>
      this._cycleOption(traitIndex, 1)
    );

    // Store label reference so we can update it
    if (!this._optionLabels) this._optionLabels = [];
    this._optionLabels[traitIndex] = optLabel;

    // Color swatch (shown for color traits)
    if (
      trait.key === 'hairColor' ||
      trait.key === 'topColor' ||
      trait.key === 'eyeColor'
    ) {
      const swatch = this.add.rectangle(
        x + rowWidth - 50,
        y + 36,
        16,
        16,
        this._swatchColor(trait, 0)
      );
      if (!this._swatches) this._swatches = {};
      this._swatches[trait.key] = swatch;
    }
  }

  _swatchColor(trait, idx) {
    if (trait.key === 'hairColor')
      return HAIR_COLORS[trait.options[idx]];
    if (trait.key === 'topColor')
      return TOP_COLORS[trait.options[idx]];
    if (trait.key === 'eyeColor')
      return EYE_COLORS[trait.options[idx]];
    return 0xffffff;
  }

  // -------------------------------------------------------------------------
  // Option cycling
  // -------------------------------------------------------------------------
  _cycleOption(traitIndex, direction) {
    const trait = TRAITS[traitIndex];
    const len = trait.options.length;
    this._selections[trait.key] =
      (this._selections[trait.key] + direction + len) % len;

    const idx = this._selections[trait.key];
    this._optionLabels[traitIndex].setText(trait.options[idx]);

    // Update color swatch if applicable
    if (this._swatches && this._swatches[trait.key]) {
      this._swatches[trait.key].setFillStyle(
        this._swatchColor(trait, idx)
      );
    }

    this._drawCharacter();
  }

  // -------------------------------------------------------------------------
  // Character drawing
  // -------------------------------------------------------------------------
  _drawCharacter() {
    const g = this._characterGraphics;
    const ag = this._accessoryGraphics;
    g.clear();
    ag.clear();

    const sel = this._selections;

    // Resolved values
    const hairStyleOpt = TRAITS[0].options[sel.hairStyle];
    const hairColor = HAIR_COLORS[TRAITS[1].options[sel.hairColor]];
    const skinColor = SKIN_TONES[TRAITS[2].options[sel.skinTone]];
    const eyeColor = EYE_COLORS[TRAITS[3].options[sel.eyeColor]];
    const topOpt = TRAITS[4].options[sel.top];
    const topColor = TOP_COLORS[TRAITS[5].options[sel.topColor]];
    const bottomOpt = TRAITS[6].options[sel.bottom];
    const bottomColor = BOTTOM_COLORS[bottomOpt];
    const accessoryOpt = TRAITS[7].options[sel.accessory];

    const W = this.scale.width;
    const H = this.scale.height;
    const isMobile = W < MOBILE_BREAKPOINT;

    // Character centre – placed responsively
    const cx = isMobile ? W / 2 : 400;
    // On mobile, draw character below the trait rows
    const mobileTrailsBottom = MOBILE_ROW_START_Y + TRAITS.length * MOBILE_ROW_HEIGHT;
    const baseY = isMobile
      ? Math.min(H - MOBILE_BTN_MARGIN, mobileTrailsBottom + MOBILE_CHAR_HEIGHT)
      : 480; // feet level

    // --- Shoes ---
    g.fillStyle(0x333333);
    g.fillEllipse(cx - 22, baseY, 30, 12);
    g.fillEllipse(cx + 22, baseY, 30, 12);

    // --- Legs / bottom ---
    g.fillStyle(bottomColor);
    if (bottomOpt === 'Shorts') {
      g.fillRect(cx - 24, baseY - 90, 22, 40);
      g.fillRect(cx + 2, baseY - 90, 22, 40);
    } else if (bottomOpt === 'Skirt') {
      g.fillTriangle(
        cx - 28,
        baseY - 90,
        cx + 28,
        baseY - 90,
        cx - 38,
        baseY - 5
      );
      g.fillTriangle(
        cx - 28,
        baseY - 90,
        cx + 28,
        baseY - 90,
        cx + 38,
        baseY - 5
      );
    } else {
      // Jeans / Leggings – full leg
      g.fillRect(cx - 24, baseY - 130, 22, 80);
      g.fillRect(cx + 2, baseY - 130, 22, 80);
    }

    // --- Torso / top ---
    g.fillStyle(topColor);
    if (topOpt === 'Dress') {
      // Dress extends down
      g.fillRect(cx - 28, baseY - 200, 56, 120);
      // Skirt flare
      g.fillTriangle(
        cx - 28,
        baseY - 80,
        cx + 28,
        baseY - 80,
        cx - 42,
        baseY - 5
      );
      g.fillTriangle(
        cx - 28,
        baseY - 80,
        cx + 28,
        baseY - 80,
        cx + 42,
        baseY - 5
      );
    } else {
      g.fillRect(cx - 28, baseY - 200, 56, 80);
    }

    // Hoodie / Jacket details
    if (topOpt === 'Hoodie') {
      g.fillStyle(Phaser.Display.Color.ValueToColor(topColor).darken(20).color);
      g.fillRect(cx - 4, baseY - 200, 8, 60); // zip line
    } else if (topOpt === 'Jacket') {
      g.fillStyle(Phaser.Display.Color.ValueToColor(topColor).darken(30).color);
      g.fillRect(cx - 28, baseY - 200, 10, 80); // left lapel
      g.fillRect(cx + 18, baseY - 200, 10, 80); // right lapel
    }

    // --- Arms ---
    g.fillStyle(topColor);
    g.fillRect(cx - 44, baseY - 195, 18, 60); // left arm
    g.fillRect(cx + 26, baseY - 195, 18, 60); // right arm

    // Skin on hands
    g.fillStyle(skinColor);
    g.fillEllipse(cx - 35, baseY - 135, 18, 20); // left hand
    g.fillEllipse(cx + 35, baseY - 135, 18, 20); // right hand

    // --- Neck ---
    g.fillStyle(skinColor);
    g.fillRect(cx - 10, baseY - 215, 20, 20);

    // --- Head ---
    g.fillStyle(skinColor);
    g.fillEllipse(cx, baseY - 265, 80, 90);

    // --- Eyes ---
    g.fillStyle(0xffffff);
    g.fillEllipse(cx - 18, baseY - 270, 20, 14);
    g.fillEllipse(cx + 18, baseY - 270, 20, 14);

    g.fillStyle(eyeColor);
    g.fillCircle(cx - 18, baseY - 270, 6);
    g.fillCircle(cx + 18, baseY - 270, 6);

    g.fillStyle(0x000000);
    g.fillCircle(cx - 18, baseY - 270, 3);
    g.fillCircle(cx + 18, baseY - 270, 3);

    // --- Mouth ---
    g.fillStyle(0xcc5555);
    g.fillEllipse(cx, baseY - 250, 22, 10);

    // --- Nose ---
    g.fillStyle(skinColor);
    const noseDark = Phaser.Display.Color.ValueToColor(skinColor).darken(15).color;
    g.fillStyle(noseDark);
    g.fillTriangle(cx - 5, baseY - 258, cx + 5, baseY - 258, cx, baseY - 248);

    // --- Hair ---
    g.fillStyle(hairColor);
    this._drawHair(g, hairStyleOpt, cx, baseY, hairColor);

    // --- Accessories (drawn last / on top) ---
    if (accessoryOpt === 'Hat' || accessoryOpt === 'Hat + Glasses') {
      // Hat brim
      ag.fillStyle(0x5a3a1a);
      ag.fillEllipse(cx, baseY - 310, 96, 18);
      // Hat crown
      ag.fillRect(cx - 36, baseY - 350, 72, 42);
      // Hat band
      ag.fillStyle(0x331a00);
      ag.fillRect(cx - 36, baseY - 318, 72, 8);
    }

    if (accessoryOpt === 'Glasses' || accessoryOpt === 'Hat + Glasses') {
      // Frames
      ag.lineStyle(3, 0x333333);
      ag.strokeCircle(cx - 18, baseY - 270, 11);
      ag.strokeCircle(cx + 18, baseY - 270, 11);
      // Bridge
      ag.beginPath();
      ag.moveTo(cx - 7, baseY - 270);
      ag.lineTo(cx + 7, baseY - 270);
      ag.strokePath();
      // Side arms
      ag.beginPath();
      ag.moveTo(cx - 29, baseY - 270);
      ag.lineTo(cx - 42, baseY - 268);
      ag.strokePath();
      ag.beginPath();
      ag.moveTo(cx + 29, baseY - 270);
      ag.lineTo(cx + 42, baseY - 268);
      ag.strokePath();
    }
  }

  _drawHair(g, style, cx, baseY, color) {
    g.fillStyle(color);
    switch (style) {
      case 'Short':
        // Close-cropped cap
        g.fillEllipse(cx, baseY - 295, 84, 50);
        break;

      case 'Long':
        // Full cap + long strands down the sides
        g.fillEllipse(cx, baseY - 295, 84, 50);
        g.fillRect(cx - 42, baseY - 290, 14, 90); // left strand
        g.fillRect(cx + 28, baseY - 290, 14, 90); // right strand
        break;

      case 'Curly':
        // Larger poofy top
        g.fillCircle(cx, baseY - 310, 44);
        g.fillCircle(cx - 30, baseY - 295, 26);
        g.fillCircle(cx + 30, baseY - 295, 26);
        break;

      case 'Spiky':
        // Triangular spikes
        for (let i = -2; i <= 2; i++) {
          g.fillTriangle(
            cx + i * 16 - 8,
            baseY - 300,
            cx + i * 16 + 8,
            baseY - 300,
            cx + i * 16,
            baseY - 340
          );
        }
        g.fillEllipse(cx, baseY - 295, 84, 30); // base
        break;

      default:
        g.fillEllipse(cx, baseY - 295, 84, 50);
    }
  }

  // -------------------------------------------------------------------------
  // Start button handler
  // -------------------------------------------------------------------------
  _onStartGame() {
    // For now show a brief confirmation – future scenes can be added here
    const W = this.scale.width;
    const H = this.scale.height;

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6);
    const msg = this.add
      .text(W / 2, H / 2, '🎉 Character Created!\nReady to play!', {
        fontSize: '28px',
        fontFamily: 'Arial',
        color: '#ffffff',
        align: 'center',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Fade in
    overlay.setAlpha(0);
    msg.setAlpha(0);
    this.tweens.add({
      targets: [overlay, msg],
      alpha: { from: 0, to: 1 },
      duration: 500,
    });

    // Dismiss on click
    overlay.setInteractive();
    overlay.on('pointerdown', () => {
      overlay.destroy();
      msg.destroy();
    });
  }
}
