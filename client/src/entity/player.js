import { StateMachine, SimulatedStateMachine } from "../state/stateMachine";
import { getplayerstate, getsimplayerState } from "../state/playerState";
import { gameConfig, playerConfig } from "../../../common";
const { Body, Bodies } = Phaser.Physics.Matter.Matter;
const PhysicsEditorParser = Phaser.Physics.Matter.PhysicsEditorParser;

export default class Player {
  constructor(scene, x, y, key, playerName, flipX, maxhealth, health) {
    console.log(`player name: ${playerName} joined`);
    // meta attributes on player
    this.meta = {
      maxhealth: maxhealth,
      health: health,
    };
    this.scene = scene;
    this.sprite = scene.matter.add.sprite(
      x,
      y,
      "mainchar",
      "adventure-idle-00"
    );
    this.playerId = key;
    this.matterFrameData = {};
    //this.generateBodyFrames();
    //  keeps track of server updates positions by server for interpolation purposes
    this.serverInterpolation = [];
    this.sprite.setScale(2);
    this.mainBody = Bodies.rectangle(0, 0, 2, 2, { chamfer: 10 });
    this.sprite.setExistingBody(this.mainBody);
    this.sprite.setFixedRotation();
    this.sprite.setPosition(x, y);
    this.sprite.setFlipX(flipX);

    // default state of player values is idle
    this.playerstate = "idle";
    this.playanimation(this.playerstate);
    //this.disablegravity();
    this.playertext = scene.add.text(x, y - 50, playerName);
    this.playertext.setOrigin(0.5, 0.5);
    this.scene.events.on("update", this.entityinterpolate, this);
  }

  //generateBodyFrames() {
  //  for (const frameName of this.scene.frameNames) {
  //    this.matterFrameData[frameName] = PhysicsEditorParser.parseBody(
  //      0,
  //      0,
  //      this.scene.frameData[frameName]
  //    );
  //  }
  //}

  playanimation(anims) {
    this.sprite.anims.play(anims);
  }

  updatePlayer({ x, y, flipX, collisionData, state, maxhealth, health }) {
    this.meta = {
      maxhealth: maxhealth,
      health: health,
    };
    this.sprite.setFlipX(flipX);
    this.sprite.setCollidesWith(collisionData);
    if (this.playerstate !== state) {
      this.playanimation(state);
    }
    this.playerstate = state;
    let serverInterpolation = [];
    if (gameConfig.networkdebug) {
      this.sprite.setPosition(x, y);
      this.playertext.setPosition(x, y - 50);
      this.playertext.setText(
        `x: ${x} y: ${y} flipX: ${flipX} state: ${state} maxhealth: ${maxhealth} health: ${health}`
      );
    } else {
      if (document.hidden) {
        // when browser is hidden don't interpolate update immediately
        this.sprite.setPosition(x, y);
        this.playertext.setPosition(x, y - 50);
      } else {
        for (let i = 0; i <= 1; i += 0.25) {
          let xInterp = Phaser.Math.Interpolation.Linear([this.sprite.x, x], i);
          let yInterp = Phaser.Math.Interpolation.Linear([this.sprite.y, y], i);
          //console.log(`coordinates interp x:${xInterp}  y:${yInterp}`);
          serverInterpolation.push({
            x: xInterp,
            y: yInterp,
          });
        }
      }
    }
    //console.log(serverInterpolation);
    this.serverInterpolation = serverInterpolation;
    //console.log("debug update");
  }

  entityinterpolate() {
    // interpolate between new and older positions
    if (this.serverInterpolation.length > 0) {
      const coord = this.serverInterpolation.shift();
      this.sprite.setPosition(coord.x, coord.y);
      //@ts-ignore
      if (gameConfig.networkdebug && this.scene.sessionId === this.playerId) {
        //console.log(misc);
        this.playertext.setPosition(coord.x - 200, coord.y - 100);
      } else {
        this.playertext.setPosition(coord.x, coord.y - 50);
      }
    }
  }

  getPlayerState() {
    return this.playerstate;
  }

  disablegravity() {
    this.sprite.world.on("beforeupdate", this.cancelgravity, this);
  }

  enablegravity() {
    this.sprite.world.off("beforeupdate", this.cancelgravity, this);
  }

  cancelgravity() {
    var gravity = this.sprite.world.localWorld.gravity;
    var body = this.sprite.body;
    Body.applyForce(body, body.position, {
      x: -gravity.x * gravity.scale * body.mass,
      y: -gravity.y * gravity.scale * body.mass,
    });
  }

  destroy() {
    //this.sprite.world.off("beforeupdate", this.cancelgravity, this);
    this.sprite.destroy();
    this.scene.events.off("update", this.entityinterpolate, this);
    this.playertext.destroy();
    for (const frame in this.matterFrameData) {
      this.matterFrameData[frame] = null;
    }
  }
}
