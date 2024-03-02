const { Switch, LightHSB, LightBRG } = require("./Accessories");
const { HSVtoRGB } = require("./utils");

class ToggleLyricsHandler {
  constructor(config, events, sendMirrorHandlerNotification) {
    this.accessoryUuid = "FABRIZZ:MMMHK:TOGGLELYRICS";
    this.accessory = new Switch(
      config.name,
      config.serviceName,
      this.accessoryUuid,
    );
    this.accessoryPublishInfo = {
      username: "17:51:07:F4:BC:8A",
      pincode: "678-90-870",
      port: 47129,
      category: this.accessory.category,
      addIdentifyingMaterial: true,
    };

    this.accessory.on("stateChange", (state) => {
      sendMirrorHandlerNotification("TOGGLE_LYRICS", {
        type: "set",
        to: state,
      });
    });
    events.on("TOGGLE_LYRICS", (payload) => {
      if (payload) {
        this.accessory.turnOn();
      } else {
        this.accessory.turnOff();
      }
    });
  }
  getHomekitAccesory() {
    return this.accessory.getAccessory();
  }
  getPublishInfo() {
    return this.accessoryPublishInfo;
  }
}

class AccentColorHandler {
  constructor(config, events, sendMirrorHandlerNotification) {
    this.accessoryUuid = "FABRIZZ:MMMHK:ACCENTCOLOR";
    this.accessory = new LightHSB(
      config.name,
      config.serviceName,
      this.accessoryUuid,
    );
    this.accessoryPublishInfo = {
      username: "17:51:07:F4:BC:8C",
      pincode: "678-90-870",
      port: 47130,
      category: this.accessory.category,
      addIdentifyingMaterial: true,
    };

    this.accessory.on("stateChange", (state) => {
      sendMirrorHandlerNotification("ACCENT_COLOR", {
        type: "set",
        state: state[0],
        color: HSVtoRGB(
          state[1][0] / 360,
          state[1][1] / 100,
          state[1][2] / 100,
        ),
      });
    });
  }
  getHomekitAccesory() {
    return this.accessory.getAccessory();
  }
  getPublishInfo() {
    return this.accessoryPublishInfo;
  }
}

class ScreenControlHandler {
  constructor(config, events, sendMirrorHandlerNotification) {
    this.accessoryUuid = "FABRIZZ:MMMHK:SCREENCONTROL";
    this.accessory = new LightBRG(
      config.name,
      config.serviceName,
      this.accessoryUuid,
    );
    this.accessoryPublishInfo = {
      username: "17:51:09:F4:BC:8C",
      pincode: "678-90-870",
      port: 47131,
      category: this.accessory.category,
      addIdentifyingMaterial: true,
    };

    this.accessory.on("stateChange", (state) => {
      sendMirrorHandlerNotification("SCREEN_CONTROL", {
        state,
      });
    });
  }
  getHomekitAccesory() {
    return this.accessory.getAccessory();
  }
  getPublishInfo() {
    return this.accessoryPublishInfo;
  }
}

const HandlerList = [
  ["toggleLyrics", ToggleLyricsHandler],
  ["accentColor", AccentColorHandler],
  ["screenControl", ScreenControlHandler],
];

module.exports = {
  HandlerList,
  ToggleLyricsHandler,
  AccentColorHandler,
  ScreenControlHandler,
};
