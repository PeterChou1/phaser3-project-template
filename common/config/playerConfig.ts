type hitbox = {
  [propName: string]: {
    knockback: number;
    damage: number;
  };
};
/**
 * @description describes hitbox data
 */
export const playerHitboxData: hitbox = {
  "adventure-attack-02": {
    knockback: 10,
    damage: 10,
  },
};

export const playerConfig = {
  dim: {
    h: 70,
    w: 37,
  },
  groundspeed: 5,
  airspeed: 5,
  jumpheight: 10,
};

/**
 * @deprecated
 * */
export const playerStateMap = {
  clientinput: "client input",
  playerprop: "player property",
};
/**
 * @description Defines animation player has
 * NOTE: duration frames * 1000 ms / frameRate
 * example: jump = 4 * 1000 / 10 = 400ms
 * Also used to create animation client side
 */
export const playerAnims = [
  {
    key: "run",
    frames: ["mainchar", { end: 5, prefix: "adventurer-run-", zeroPad: 2 }],
    frameRate: 10,
    repeat: -1,
  },
  {
    key: "idle",
    frames: ["mainchar", { end: 3, prefix: "adventurer-idle-", zeroPad: 2 }],
    frameRate: 10,
    repeat: -1,
  },
  {
    key: "jump",
    frames: ["mainchar", { end: 3, prefix: "adventurer-jump-", zeroPad: 2 }],
    frameRate: 10,
    repeat: 0,
  },
  {
    key: "fall",
    frames: ["mainchar", { end: 1, prefix: "adventurer-fall-", zeroPad: 2 }],
    frameRate: 10,
    repeat: -1,
  },
  {
    key: "attack1",
    frames: ["mainchar", { end: 4, prefix: "adventurer-attack1-", zeroPad: 2 }],
    frameRate: 10,
    repeat: 0,
  },
];