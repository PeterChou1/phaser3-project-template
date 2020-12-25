import { messageType } from "../../common/config/globalConfig";
import { gameObject } from "../game.v2/gameobject";
import { Player } from "../game.v2/player";

export class AOI {
  clearId;
  aoiId: {
    x: number;
    y: number;
  };
  entities: {
    [id: string]: gameObject;
  };
  // save states of entity used for diffing
  savedState;
  // clients in current aoi
  clients;
  // clients in adjacent aoi
  adjacentClient;
  width;
  height;
  x;
  y;
  constructor(width, height, x, y, id) {
    this.aoiId = id;
    this.entities = {};
    this.savedState = {};
    this.clients = {};
    this.adjacentClient = {};
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;

    //console.log(`id x:${this.aoiId.x} y: ${this.aoiId.y} aoi x:${x} y:${y}`);
    this.clearId = setInterval(this.updateEntity.bind(this), 100);
  }

  inAOI(x, y) {
    return (
      this.x <= x &&
      x <= this.x + this.width &&
      this.y <= y &&
      y <= this.y + this.height
    );
  }
  /**
   * @description used to update player that navigated back to game
   */
  awakePlayer(clientGameObject: Player) {
    for (const id in this.entities) {
      if (id !== clientGameObject.id) {
        clientGameObject.client.send(messageType.aoiadd, {
          ...this.entities[id].getPosition(),
          ...this.entities[id].getMeta(),
        });
      }
    }
    clientGameObject.client.send(messageType.aoiupdate, {
      [clientGameObject.id]: clientGameObject.getState(),
    });
  }

  /**
   * @description adds client in current AOI for adjacent clients
   */
  addAdjacentClient(clientGameObject: Player) {
    this.adjacentClient[clientGameObject.id] = clientGameObject.client;
    const state = clientGameObject.getInternalState();
    if (!state.asleep) {
      for (const id in this.entities) {
        clientGameObject.client.send(messageType.aoiadd, {
          ...this.entities[id].getPosition(),
          ...this.entities[id].getMeta(),
        });
      }
    }
  }
  /**
   * @description remove entities in current AOI for adjacent clients
   */
  removeAdjacentClient(clientGameObject: Player) {
    delete this.adjacentClient[clientGameObject.id];
    // remove all entities within aoi for client
    const state = clientGameObject.getInternalState();
    if (!state.asleep) {
      for (const id in this.entities) {
        clientGameObject.client.send(messageType.aoiremove, {
          id: id,
        });
      }
    }
  }
  /**
   * @description should be used for adding a client (real player) to current AOI only
   * @param clientGameObject
   * @param init optional parameter which will broadcast add player to client being
   * added (used for init)
   */
  addClient(clientGameObject: Player, init?) {
    // add to every other client within the aoi expect the ones that are asleep
    for (const clientid in this.clients) {
      const state = this.entities[clientid].getInternalState();
      if (!state.asleep) {
        this.clients[clientid].send(messageType.aoiadd, {
          ...clientGameObject.getPosition(),
          ...clientGameObject.getMeta(),
        });
      }
    }
    // add all entity within aoi to client
    const state = clientGameObject.getInternalState();
    if (!state.asleep) {
      for (const id in this.entities) {
        clientGameObject.client.send(messageType.aoiadd, {
          ...this.entities[id].getPosition(),
          ...this.entities[id].getMeta(),
        });
      }
    }
    this.clients[clientGameObject.id] = clientGameObject.client;
    this.entities[clientGameObject.id] = clientGameObject;
    //this.savedState[clientGameObject.id] = clientGameObject.getState();
    if (init) {
      clientGameObject.client.send(messageType.aoiadd, {
        ...clientGameObject.getPosition(),
        ...clientGameObject.getMeta(),
      });
    }
  }

  /**
   * should be used for removing a client from current AOI
   * @param clientGameObject
   * @param quit optional parameter used for players quiting the game
   */
  removeClient(clientGameObject: Player, quit?) {
    if (quit) {
      clientGameObject.client.send(messageType.aoiremove, {
        id: clientGameObject.id,
      });
    }
    delete this.clients[clientGameObject.id];
    delete this.entities[clientGameObject.id];
    delete this.savedState[clientGameObject.id];

    for (const clientid in this.clients) {
      const state = this.entities[clientid].getInternalState();
      if (!state.asleep) {
        this.clients[clientid].send(messageType.aoiremove, {
          id: clientGameObject.id,
        });
      }
    }
    // remove all entities within aoi for client
    const state = clientGameObject.getInternalState();
    if (!state.asleep) {
      for (const id in this.entities) {
        clientGameObject.client.send(messageType.aoiremove, {
          id: id,
        });
      }
    }
  }
  /**
   * @description used for non-player entity broadcast to all clients within AOI that an
   * entity has been added
   * @param entity
   */
  addEntity(entity) {
    this.entities[entity.id] = entity;
    this.broadcast(messageType.aoiadd, {
      ...entity.getPosition(),
      ...entity.getMeta(),
    });
  }
  /**
   * @description used for non-player entity broadcast to all clients within AOI that an
   * entity has been removed
   * @param entity
   */
  removeEntity(entity) {
    delete this.entities[entity.id];
    this.broadcast(messageType.aoiremove, {
      id: entity.id,
    });
  }
  /**
   * @description Update loop for current AOI instanitate on start up
   * and shutdown on destruction
   */
  private updateEntity() {
    //console.log(`update entity aoi (x:${this.aoiId.x} y:${this.aoiId.y})`);
    this.broadcast(messageType.aoiupdate, this.getAOIEntities());
  }
  /**
   * Broadcast to all clients within AOI
   * @param msgtype used type from messageType from globalConfig
   * @param msg
   */
  broadcast(msgtype, msg) {
    // check if object is empty then don't broadcast
    if (!(Object.keys(msg).length === 0 && msg.constructor === Object)) {
      for (const clientid in this.clients) {
        const state = this.entities[clientid].getInternalState();
        if (!state.asleep) {
          this.clients[clientid].send(msgtype, msg);
        }
      }
    }
  }
  /**
   * @description get all entity within AOI that have changed state
   * @returns {array} of all state within aoi
   */
  getAOIEntities() {
    const entities = {};
    for (const id in this.entities) {
      const newState = this.entities[id].getState();
      if (JSON.stringify(newState) !== JSON.stringify(this.savedState[id])) {
        entities[id] = newState;
      }
      this.savedState[id] = newState;
    }
    return entities;
  }
  destroy() {
    clearInterval(this.clearId);
  }
}
