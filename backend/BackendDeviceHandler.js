const { Switch, LightHSB, LightBRG, SwitchMultiple } = require("./Accessories");
const { HSVtoRGB } = require("./utils");

class ToggleLyricsHandler {
  constructor(config, events, sendMirrorHandlerNotification, version) {
    this.accessoryUuid = "FABRIZZ:MMMHK:TOGGLELYRICS";
    this.accessory = new Switch(
      version,
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
    this.handlerData = {
      icon: "toggle",
      description: "Description for device.",
      state: "created",
      notificationName: "TOGGLE_LYRICS",
    };

    this.accessory.on("identify", (paired) =>
      sendMirrorHandlerNotification("TOGGLE_LYRICS", {
        type: "identify",
        paired,
      }),
    );
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
  getHandlerData() {
    return this.handlerData;
  }
}

class AccentColorHandler {
  constructor(config, events, sendMirrorHandlerNotification, version) {
    this.accessoryUuid = "FABRIZZ:MMMHK:ACCENTCOLOR";
    this.accessory = new LightHSB(
      version,
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
    this.handlerData = {
      icon: "lightbulb",
      description: "Description for device.",
      state: "created",
      notificationName: "ACCENT_COLOR",
    };

    this.accessory.on("identify", (paired) =>
      sendMirrorHandlerNotification("ACCENT_COLOR", {
        type: "identify",
        paired,
      }),
    );
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
  getHandlerData() {
    return this.handlerData;
  }
}

class ScreenControlHandler {
  constructor(config, events, sendMirrorHandlerNotification, version) {
    this.accessoryUuid = "FABRIZZ:MMMHK:SCREENCONTROL";
    this.accessory = new LightBRG(
      version,
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
    this.handlerData = {
      icon: "lightbulb",
      description: "Description for device.",
      state: "created",
      notificationName: "SCREEN_CONTROL",
    };

    this.accessory.on("identify", (paired) =>
      sendMirrorHandlerNotification("SCREEN_CONTROL", {
        type: "identify",
        paired,
      }),
    );
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
  getHandlerData() {
    return this.handlerData;
  }
}

class PageControlHandler {
  constructor(config, events, sendMirrorHandlerNotification, version) {
    this.accessoryUuid = "FABRIZZ:MMMHK:PAGECONTROL";
    this.pageList = ["Aaa", "Bbb", "Ccc"];
    this.pageListState = [false, false, false];
    this.currentPage = undefined;
    this.accessory = new SwitchMultiple(
      version,
      config.name,
      this.accessoryUuid,
      this.pageList,
    );
    this.accessoryPublishInfo = {
      username: "17:51:09:F4:AC:8C",
      pincode: "678-90-870",
      port: 47132,
      category: this.accessory.category,
      addIdentifyingMaterial: true,
    };
    this.handlerData = {
      icon: "toggles",
      description: "Description for device.",
      state: "created",
      notificationName: "PAGE_CONTROL",
    };

    this.accessory.on("identify", (paired) =>
      sendMirrorHandlerNotification("PAGE_CONTROL", {
        type: "identify",
        paired,
      }),
    );
    this.accessory.on("stateChange", ([index, state]) => {
      if (!state || this.pageListState[index]) return;
      this.setSwitch(index);
      sendMirrorHandlerNotification("PAGE_CONTROL", {
        type: "set",
        page: index,
      });
    });
    events.on("PAGE_CONTROL", (payload) => {
      this.setSwitch(payload);
    });
    this.setSwitch = (index) => {
      if (typeof this.currentPage === "number") {
        this.accessory.turnOff(this.currentPage);
        this.pageListState[this.currentPage] = false;
        this.currentPage = index;
        this.pageListState[this.currentPage] = true;
        this.accessory.turnOn(this.currentPage);
      } else {
        this.pageListState[index] = true;
        this.currentPage = index;
        this.accessory.turnOn(this.currentPage);
      }
    };
  }
  getHomekitAccesory() {
    return this.accessory.getAccessory();
  }
  getPublishInfo() {
    return this.accessoryPublishInfo;
  }
  getHandlerData() {
    return this.handlerData;
  }
}

const HandlerList = [
  ["toggleLyrics", ToggleLyricsHandler],
  ["accentColor", AccentColorHandler],
  ["screenControl", ScreenControlHandler],
  ["pageControl", PageControlHandler],
];

module.exports = {
  HandlerList,
  ToggleLyricsHandler,
  AccentColorHandler,
  ScreenControlHandler,
  PageControlHandler,
};
