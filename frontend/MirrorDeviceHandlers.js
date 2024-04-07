let usedPorts = [];

const HKExperimentalBridgeConfiguration = {
  name: "MMM-HomeKit Experimental Bridge",
  helperRef: {
    notificationName: "BRIDGE",
    icon: "modem",
    description:
      "Exposes multiple Homekit accessories only using one server (bridge), this feature is experimental.",
    docsUrl: "https://github.com/Fabrizz/MMM-HomeKit",
  },
};

/** HKToggleLyricsHandler */
class HKToggleLyricsHandler {
  constructor(
    configObject,
    devicesEventStream,
    translate,
    sendNotification,
    sendToBackend,
    loggers,
  ) {
    this.toggleLyricsState = undefined;
    this.notificationsListenTo = ["LYRICS_STATUS"];

    //// Configuration to send to the backend, should match node_helper configuration
    this.deviceConfig = {
      name:
        configObject.name && typeof configObject.name === "string"
          ? configObject.name.substring(0, 16)
          : translate("ACCESSORY_LYRICS_NAME"),
      serviceName:
        configObject.serviceName && typeof configObject.serviceName === "string"
          ? configObject.serviceName.substring(0, 16)
          : translate("ACCESSORY_LYRICS_SERVICE"),
    };

    if (
      configObject.port &&
      typeof configObject.port === "number" &&
      configObject.port >= 1000 &&
      configObject.port <= 9999 &&
      !usedPorts.includes(configObject.port)
    ) {
      this.deviceConfig.port = configObject.port;
      usedPorts.push(configObject.port);
    }

    //// Information for the configuration helper
    this.deviceConfig.helperRef = {
      notificationName: "TOGGLE_LYRICS",
      icon: "toggle",
      description: translate("ACCESSORY_LYRICS_DESCRIPTION"),
      docsUrl: "https://github.com/Fabrizz/MMM-HomeKit",
    };

    //// Mirror listener for notifications
    // Above we added "LYRICS_STATUS" as a notification to listen for.
    // In the device event stream, module notifications start with two underscores: "__LYRICS_STATUS".
    devicesEventStream.on("__LYRICS_STATUS", (payload) => {
      if (payload.type === "internal") {
        this.toggleLyricsState = payload.show;
        sendToBackend("TOGGLE_LYRICS", payload.show);
      }
    });

    //// Backend connector for device
    devicesEventStream.on("TOGGLE_LYRICS", (payload) => {
      if (payload.type === "set") {
        // The homekit handler sends the change even when it was done locally
        if (payload.to !== this.toggleLyricsState) {
          this.toggleLyricsState = payload.to;
          if (this.toggleLyricsState) {
            sendNotification("LYRICS_SHOW");
          } else {
            sendNotification("LYRICS_HIDE");
          }
        }
      }
    });
  }
  configuration() {
    return this.deviceConfig;
  }
  listenTo() {
    return this.notificationsListenTo;
  }
}

/** HKAccentColorHandler */
class HKAccentColorHandler {
  constructor(
    configObject,
    devicesEventStream,
    translate,
    sendNotification,
    sendToBackend,
    loggers,
  ) {
    this.root = document.querySelector(":root");
    this.notificationsListenTo = [];
    this.accentColorState = false;
    this.accentColorRGB = [0, 0, 0];

    if (configObject.useThemeLock)
      this.notificationsListenTo.push("THEME_PREFERENCE");

    this.externalLock = [];
    this.cssVar = undefined;

    this.deviceConfig = {
      name:
        configObject.name && typeof configObject.name === "string"
          ? configObject.name.substring(0, 16)
          : translate("ACCESSORY_ACCENTCOLOR_NAME"),
      serviceName:
        configObject.serviceName && typeof configObject.serviceName === "string"
          ? configObject.serviceName.substring(0, 16)
          : translate("ACCESSORY_ACCENTCOLOR_SERVICE"),
    };

    this.cssVar = configObject.cssVariable
      ? configObject.cssVariable
      : "--HMKT-ACCENTCOLOR-COLOR";

    if (
      configObject.port &&
      typeof configObject.port === "number" &&
      configObject.port >= 1000 &&
      configObject.port <= 9999 &&
      !usedPorts.includes(configObject.port)
    ) {
      this.deviceConfig.port = configObject.port;
      usedPorts.push(configObject.port);
    }

    this.deviceConfig.helperRef = {
      notificationName: "ACCENT_COLOR",
      icon: "lightbulb",
      description: translate("ACCESSORY_ACCENTCOLOR_DESCRIPTION"),
      docsUrl: "https://github.com/Fabrizz/MMM-HomeKit",
    };

    this.logStatus = (payload) =>
      loggers.debug(
        `%c     %c RGB: ${this.accentColorRGB[0]}, ${this.accentColorRGB[1]}, ${
          this.accentColorRGB[2]
        } | Sets "${this.cssVar}" to ${
          this.accentColorState ? "ON" : "OFF"
        } | ${this.externalLock.length < 1 ? "Unlocked" : "Locked"}`,
        `background-color:rgb(${this.accentColorRGB[0]}, ${this.accentColorRGB[1]}, ${this.accentColorRGB[2]});color:white;border-radius:0.8em;`,
        "",
        payload,
      );

    devicesEventStream.on("__THEME_PREFERENCE", (payload) => {
      console.log("__THEME_PREFERENCE", payload);
      if (payload.set === "lock") {
        this.externalLock.push(payload.provider);
      } else if (payload.set === "unlock") {
        this.externalLock = this.externalLock.filter(
          (provider) => provider !== payload.provider,
        );

        if (this.accentColorState) {
          if (loggers.shouldLog) this.logStatus(payload);
          this.root.style.setProperty(
            this.cssVar,
            `rgb(${this.accentColorRGB[0]}, ${this.accentColorRGB[1]}, ${this.accentColorRGB[2]})`,
          );
        }
      }
    });

    devicesEventStream.on("ACCENT_COLOR", (payload) => {
      if (payload.type === "set") {
        this.accentColorState = payload.state;
        this.accentColorRGB = payload.color;

        if (this.accentColorState) {
          sendNotification("HK_ACCENTCOLOR_SET", {
            locked: !this.externalLock.length < 1,
            color: this.accentColorRGB,
          });
          if (this.externalLock.length < 1)
            this.root.style.setProperty(
              this.cssVar,
              `rgb(${this.accentColorRGB[0]}, ${this.accentColorRGB[1]}, ${this.accentColorRGB[2]})`,
            );
        } else {
          sendNotification("HK_ACCENTCOLOR_SET", {
            locked: !this.externalLock.length < 1,
            color: false,
          });
          if (this.externalLock.length < 1)
            this.root.style.removeProperty(this.cssVar);
        }

        if (loggers.shouldLog) this.logStatus(payload);
      }
    });
  }
  configuration() {
    return this.deviceConfig;
  }
  listenTo() {
    return this.notificationsListenTo;
  }
}

/** HKScreenControlHandler */
class HKScreenControlHandler {
  constructor(
    configObject,
    devicesEventStream,
    translate,
    sendNotification,
    sendToBackend,
    loggers,
  ) {
    this.screenControlState = undefined;
    this.notificationsListenTo = [];
    this.currentState = [true, 100];

    this.deviceConfig = {
      name:
        configObject.name && typeof configObject.name === "string"
          ? configObject.name.substring(0, 16)
          : translate("ACCESSORY_SCREENCONTROL_NAME"),
      serviceName:
        configObject.serviceName && typeof configObject.serviceName === "string"
          ? configObject.serviceName.substring(0, 16)
          : translate("ACCESSORY_SCREENCONTROL_SERVICE"),
    };

    if (
      configObject.port &&
      typeof configObject.port === "number" &&
      configObject.port >= 1000 &&
      configObject.port <= 9999 &&
      !usedPorts.includes(configObject.port)
    ) {
      this.deviceConfig.port = configObject.port;
      usedPorts.push(configObject.port);
    }

    this.deviceConfig.helperRef = {
      notificationName: "SCREEN_CONTROL",
      icon: "lightbulb",
      description: translate("ACCESSORY_SCREENCONTROL_DESCRIPTION"),
      docsUrl: "https://github.com/Fabrizz/MMM-HomeKit",
    };

    devicesEventStream.on("SCREEN_CONTROL", (payload) => {
      if (payload.type === "set") {
        const [state, brightness] = payload.to;
        if (state !== this.currentState[0]) {
          this.currentState[0] = state;
          if (state) {
            sendNotification("REMOTE_ACTION", { action: "MONITORON" });
          } else {
            sendNotification("REMOTE_ACTION", { action: "MONITOROFF" });
          }
        }
        if (brightness !== this.currentState[1]) {
          this.currentState[1] = brightness;
          sendNotification("REMOTE_ACTION", {
            action: "BRIGHTNESS",
            value: brightness,
          });
        }
      }
    });
  }
  configuration() {
    return this.deviceConfig;
  }
  listenTo() {
    return this.notificationsListenTo;
  }
}

/** HKPageControllHandler */
class HKPageControlHandler {
  constructor(
    configObject,
    devicesEventStream,
    translate,
    sendNotification,
    sendToBackend,
    loggers,
  ) {
    this.currentPage = undefined;
    this.notificationsListenTo = [];

    this.deviceConfig = {
      name:
        configObject.name && typeof configObject.name === "string"
          ? configObject.name.substring(0, 16)
          : translate("HK_ACCS_BASE"),
      serviceName:
        configObject.serviceName && typeof configObject.serviceName === "string"
          ? configObject.serviceName.substring(0, 16)
          : translate("HK_SRVC_PAGE"),
    };

    this.deviceConfig.pageList = ["Aaa", "Bbb", "Ccc"];
    this.deviceConfig.startOnFirst = true;

    if (
      configObject.port &&
      typeof configObject.port === "number" &&
      configObject.port >= 1000 &&
      configObject.port <= 9999 &&
      !usedPorts.includes(configObject.port)
    ) {
      this.deviceConfig.port = configObject.port;
      usedPorts.push(configObject.port);
    }

    this.deviceConfig.helperRef = {
      notificationName: "PAGE_CONTROL",
      icon: "toggles",
      description: translate("ACCESSORY_PAGECONTROL_DESCRIPTION"),
      docsUrl: "https://github.com/Fabrizz/MMM-HomeKit",
    };

    devicesEventStream.on("PAGE_CONTROL", (payload) => {
      console.log(payload);
    });
  }
  configuration() {
    return this.deviceConfig;
  }
  listenTo() {
    return this.notificationsListenTo;
  }
}

// eslint-disable-next-line no-undef
const HKAvailableFeatureHandlers = [
  ["toggleLyrics", HKToggleLyricsHandler],
  ["accentColor", HKAccentColorHandler],
  ["screenControl", HKScreenControlHandler],
  ["pageControl", HKPageControlHandler],
];
