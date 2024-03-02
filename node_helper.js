/*
 * MMM-HomeKit
 * MIT License
 *
 * By Fabrizz <3 | https://github.com/Fabrizz/MMM-HomeKit
 */

const path = require("path");
const EventEmitter = require("events").EventEmitter;
const NodeHelper = require("node_helper");
const hap = require("hap-nodejs");
const { deepEqual } = require("./backend/utils");
const { HandlerList } = require("./backend/BackendDeviceHandler");

const homekitStorage = path.join(__dirname, "/persist");
hap.HAPStorage.setCustomStoragePath(homekitStorage);

module.exports = NodeHelper.create({
  start: function () {
    console.log("\x1b[46m%s\x1b[0m", `[Node Helper] Init >> ${this.name} `);

    // Only allow HomeKit initilization once
    this.started = false;
    // Stored Homekit settings
    this.loadedHomekitCfg = undefined;
    this.accessories = [];
    // Internal event stream to manage devices
    this.events = new EventEmitter();

    this.availableDeviceHandlers = HandlerList;

    // Define IDs to match requests (One frontend per server if turned on)
    this.serversideId = Date.now().toString(16);
    this.frontendId = undefined;
  },

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "HOMEKIT_START":
        if (this.started) {
          // Check if the configuration options have changed and just the frontend has the changes.
          if (!deepEqual(payload.homekitCfg, this.loadedHomekitConfiguration)) {
            this.sendSocketNotification("BACKEND_SHOULD_RESTART", true);
            console.warn(
              "[MMM-HMKT] [Node Helper] >> \x1b[33m%s\x1b[0m",
              "Frontend sent new configurations. Server restart requiered.",
              this.frontendId,
            );
          }
          // Change to the new frotend ID
          this.frontendId = payload.matchId;
          this.sendSocketNotification("BACKEND_SHOULD_RESTART", false);
          console.log(
            "[MMM-HMKT] [Node Helper] Frontend reauth: >> \x1b[46m%s\x1b[0m",
            `${this.frontendId}`,
          );
          break;
        }

        this.started = true;
        this.configureHomekit(payload);
        break;
      case "HOMEKIT_ACCESSORY_UPDATE":
        console.log("SWITCH", payload);
        this.events.emit(payload.eventName, payload.eventPayload);
        break;
    }
  },
  sendMirrorHandlerNotification(eventName, eventPayload) {
    this.sendSocketNotification("MIRROR_HANDLER_UPDATE", {
      eventName,
      eventPayload,
    });
  },

  configureHomekit(homekitCfg) {
    try {
      this.availableDeviceHandlers.forEach(([key, HandlerClass]) => {
        if (key in homekitCfg) {
          this.accessories.push(
            new HandlerClass(homekitCfg[key], this.events, (x, y) =>
              this.sendMirrorHandlerNotification(x, y),
            ),
          );
        }
      });
      this.accessories.forEach((deviceHandler) => {
        console.log(deviceHandler);
        deviceHandler
          .getHomekitAccesory()
          .publish(deviceHandler.getPublishInfo());
      });
      this.sendSocketNotification("HOMEKIT_READY");
    } catch (error) {
      this.sendSocketNotification("HOMEKIT_LOAD_ERROR");
      console.log(error);
    }
  },
});
