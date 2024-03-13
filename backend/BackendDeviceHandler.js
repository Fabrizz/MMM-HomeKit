const { Switch, LightHSB, LightBRG, SwitchMultiple } = require("./Accessories");
const { HSVtoRGB } = require("./utils");

class ToggleLyricsHandler {
  constructor(config, events, sendMirrorHandlerNotification, version) {
    this.ACCESSORY_UUID = "FABRIZZ:MMMHK:TOGGLELYRICS";
    this.NOTIFICATION_NAME = "TOGGLE_LYRICS";
    this.accessory = new Switch(
      version,
      config.name,
      config.serviceName,
      this.ACCESSORY_UUID,
    );
    this.accessoryPublishInfo = {
      username: "17:51:07:F4:BC:8A",
      pincode: "678-90-870",
      port: 47129,
      category: this.accessory.category,
      addIdentifyingMaterial: true,
    };
    this.handlerData = {
      notificationName: this.NOTIFICATION_NAME,
      icon: "toggle",
      description:
        "Exposes a switch to control MMM-LiveLyrics, works bi-directionally with module state.",
      docsUrl: "https://github.com/Fabrizz/MMM-HomeKit",
    };

    this.accessory.on("paired", () =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "paired",
      }),
    );
    this.accessory.on("unpaired", () =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "unpaired",
      }),
    );
    this.accessory.on("advertised", () =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "advertised",
      }),
    );
    this.accessory.on("identify", (paired) =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "identify",
        paired,
      }),
    );

    this.accessory.on("stateChange", (state) => {
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "set",
        to: state,
      });
    });
    events.on(this.NOTIFICATION_NAME, (payload) => {
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
  getHomekitAccessoryInformation() {
    return this.accessory.getAccessoryInformation();
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
    this.ACCESSORY_UUID = "FABRIZZ:MMMHK:ACCENTCOLOR";
    this.NOTIFICATION_NAME = "ACCENT_COLOR";
    this.accessory = new LightHSB(
      version,
      config.name,
      config.serviceName,
      this.ACCESSORY_UUID,
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
      description:
        "Exposes a HSB lightbulb, controls one-way the MM2 accent color (or any css var).",
      notificationName: this.NOTIFICATION_NAME,
      docsUrl: "https://github.com/Fabrizz/MMM-HomeKit",
    };

    this.accessory.on("paired", () =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "paired",
      }),
    );
    this.accessory.on("unpaired", () =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "unpaired",
      }),
    );
    this.accessory.on("advertised", () =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "advertised",
      }),
    );
    this.accessory.on("identify", (paired) =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "identify",
        paired,
      }),
    );

    this.accessory.on("stateChange", (state) => {
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
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
  getHomekitAccessoryInformation() {
    return this.accessory.getAccessoryInformation();
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
    this.ACCESSORY_UUID = "FABRIZZ:MMMHK:SCREENCONTROL";
    this.NOTIFICATION_NAME = "SCREEN_CONTROL";
    this.accessory = new LightBRG(
      version,
      config.name,
      config.serviceName,
      this.ACCESSORY_UUID,
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
      description:
        "Exposes a light with brightness control to simulate the mirror screen.",
      notificationName: this.NOTIFICATION_NAME,
      docsUrl: "https://github.com/Fabrizz/MMM-HomeKit",
    };

    this.accessory.on("paired", () =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "paired",
      }),
    );
    this.accessory.on("unpaired", () =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "unpaired",
      }),
    );
    this.accessory.on("advertised", () =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "advertised",
      }),
    );
    this.accessory.on("identify", (paired) =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "identify",
        paired,
      }),
    );

    this.accessory.on("stateChange", (state) => {
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        state,
      });
    });
  }
  getHomekitAccesory() {
    return this.accessory.getAccessory();
  }
  getHomekitAccessoryInformation() {
    return this.accessory.getAccessoryInformation();
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
    this.ACCESSORY_UUID = "FABRIZZ:MMMHK:PAGECONTROL";
    this.NOTIFICATION_NAME = "PAGE_CONTROL";
    this.pageList = ["Aaa", "Bbb", "Ccc"];
    this.pageListState = true
      ? Array.from(this.pageList).map((_, i) => i === 0)
      : Array.from(this.pageList).map((_) => false);
    this.currentPage = true ? 0 : undefined;
    this.accessory = new SwitchMultiple(
      version,
      config.name,
      this.ACCESSORY_UUID,
      this.pageList,
      this.pageListState,
    );
    this.accessoryPublishInfo = {
      username: "17:51:09:F4:AC:8C",
      pincode: "678-90-870",
      port: 47132,
      category: this.accessory.category,
      addIdentifyingMaterial: true,
    };
    this.handlerData = {
      notificationName: this.NOTIFICATION_NAME,
      icon: "toggles",
      description:
        "Exposes a power strip that controls the current MM2 page, you can control them using shorcuts!",
      docsUrl: "https://github.com/Fabrizz/MMM-HomeKit",
    };

    this.accessory.on("paired", () =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "paired",
      }),
    );
    this.accessory.on("unpaired", () =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "unpaired",
      }),
    );
    this.accessory.on("advertised", () =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "advertised",
      }),
    );
    this.accessory.on("identify", (paired) =>
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "device-event",
        subtype: "identify",
        paired,
      }),
    );

    this.accessory.on("stateChange", ([index, state]) => {
      if (!state || this.pageListState[index]) return;
      this.setSwitch(index);
      sendMirrorHandlerNotification(this.NOTIFICATION_NAME, {
        type: "set",
        page: index,
      });
    });
    events.on(this.NOTIFICATION_NAME, (payload) => {
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
  getHomekitAccessoryInformation() {
    return this.accessory.getAccessoryInformation();
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
