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
const { deepEqual, generateMac, HSVtoRGB } = require("./utils/general");
const { Switch, LightHSB } = require("./utils/homekit");

const homekitStorage = path.join(__dirname, "/persist");
hap.HAPStorage.setCustomStoragePath(homekitStorage);

module.exports = NodeHelper.create({
  start: function () {
    console.log("\x1b[46m%s\x1b[0m", `[Node Helper] Init >> ${this.name} `);

    // Only allow HomeKit initilization once
    this.started = false;
    // Stored Homekit settings
    this.loadedHomekitCfg = undefined;
    // Internal event stream to manage devices
    this.events = new EventEmitter();

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
            this.sendSocketNotification("BACKEND_SHOULD_RESTART");
            console.warn(
              "[MMM-HMKT] [Node Helper] >> \x1b[33m%s\x1b[0m",
              "Frontend sent new configurations. Server restart requiered.",
              this.frontendId,
            );
          }
          // Change to the new frotend ID
          this.frontendId = payload.matchId;
          console.log(
            "[MMM-HMKT] [Node Helper] Frontend reauth: >> \x1b[46m%s\x1b[0m",
            `${this.frontendId}`,
          );
          break;
        }

        this.started = true;
        this.configureHomekit(payload);
        this.sendSocketNotification("HOMEKIT_READY");
        break;
      case "UPDATE_ACCESSORY":
        this.events.emit(payload.eventName, payload.eventPayload);
        break;
    }
  },

  configureHomekit(homekitCfg) {
    let accessories = [];
    if (homekitCfg.toggleLyrics)
      accessories.push(this.createLyricsAccessory(homekitCfg.toggleLyrics));
    if (homekitCfg.accentColor)
      accessories.push(this.createAccentAccessory(homekitCfg.accentColor));
    console.log(homekitCfg);

    accessories[0].publish({
      username: "17:51:07:F4:BC:8A",
      pincode: "678-90-870",
      port: 47129,
      category: 8 /* accessory.getAccessoryCategory() */,
      addIdentifyingMaterial: true,
    });

    accessories[1].publish({
      username: "17:51:07:F4:BC:8C",
      pincode: "678-90-870",
      port: 47130,
      category: 5 /* accessory.getAccessoryCategory() */,
      addIdentifyingMaterial: true,
    });
  },

  createLyricsAccessory(config) {
    const accUuid = "fabrizz:mm:toggleLyrics";
    const lyricsToggle = new Switch(config.name, config.serviceName, accUuid);
    lyricsToggle.on("stateChange", (state) => {
      this.sendSocketNotification("UPDATE_MIRROR", {
        eventName: "LYRICS_CHANGED",
        eventPayload: state,
      });
    });
    this.events.on("LYRICS_CHANGED", function (state) {
      if (state) {
        this.lyricsToggle.turnOn();
      } else {
        this.lyricsToggle.turnOff();
      }
    });
    return lyricsToggle.getAccessory();
  },

  createAccentAccessory(config) {
    const accUuid = "fabrizz:mm:accentcolor";
    const accentLight = new LightHSB(config.name, config.serviceName, accUuid);
    accentLight.on("stateChange", (state) => {
      this.sendSocketNotification("UPDATE_MIRROR", {
        eventName: "ACCENT_CHANGED",
        eventPayload: [
          state[0],
          HSVtoRGB(state[1][0] / 360, state[1][1] / 100, state[1][2] / 100),
        ],
      });
    });

    return accentLight.getAccessory();
  },
});
