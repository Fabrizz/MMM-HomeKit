let usedPorts = [];

const HKExperimentalBridgeConfiguration = {
  name: "MMM-HomeKit Experimental Bridge",
  helperRef: {
    notificationName: "BRIDGE",
    icon: "modem",
    description:
      "Exposes a switch to control MMM-LiveLyrics, works bi-directionally with module state.",
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
          : translate("HK_ACCS_BASE"),
      serviceName:
        configObject.serviceName && typeof configObject.serviceName === "string"
          ? configObject.serviceName.substring(0, 16)
          : translate("HK_SRVC_LYRICS"),
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
      description:
        "Exposes a switch to control MMM-LiveLyrics, works bi-directionally with module state.",
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
    this.notificationsListenTo = ["HK_ACCENTCOLOR_GET"];
    this.accentColorState = false;
    this.accentColorRGB = [0, 0, 0];

    this.deviceConfig = {
      name:
        configObject.name && typeof configObject.name === "string"
          ? configObject.name.substring(0, 16)
          : translate("HK_ACCS_BASE"),
      serviceName:
        configObject.serviceName && typeof configObject.serviceName === "string"
          ? configObject.serviceName.substring(0, 16)
          : translate("HK_SRVC_ACCENT"),
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
      notificationName: "ACCENT_COLOR",
      icon: "lightbulb",
      description:
        "Exposes a HSB lightbulb, controls one-way the MM2 accent color (or any css var).",
      docsUrl: "https://github.com/Fabrizz/MMM-HomeKit",
    };

    devicesEventStream.on("__HK_ACCENTCOLOR_GET", (_) => {
      if (this.accentColorState) {
        sendNotification("HK_ACCENTCOLOR_SET", this.accentColorRGB);
      } else {
        sendNotification("HK_ACCENTCOLOR_SET", false);
      }
    });

    devicesEventStream.on("ACCENT_COLOR", (payload) => {
      if (payload.type === "set") {
        this.accentColorState = payload.state;
        this.accentColorRGB = payload.color;
        this.root.style.setProperty(
          "--HMKT-INTERNAL-ACCENTCOLOR-RESULT",
          this.accentColorState
            ? `rgb(${this.accentColorRGB[0]}, ${this.accentColorRGB[1]}, ${this.accentColorRGB[2]})`
            : "var(--HMKT-INTERNAL-ACCENTCOLOR-BASE)",
        );
        if (this.accentColorState) {
          sendNotification("HK_ACCENTCOLOR_SET", this.accentColorRGB);
        } else {
          sendNotification("HK_ACCENTCOLOR_SET", false);
        }
        if (loggers.shouldLog) {
          const color = `rgb(${this.accentColorRGB[0]}, ${this.accentColorRGB[1]}, ${this.accentColorRGB[2]})`;
          loggers.debug(
            `%c     %c (${this.accentColorState}) RGB: ${this.accentColorRGB[0]}, ${this.accentColorRGB[1]}, ${this.accentColorRGB[2]}`,
            `background-color:${color};color:white;border-radius:0.8em;`,
            "",
            payload,
          );
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

    this.deviceConfig = {
      name:
        configObject.name && typeof configObject.name === "string"
          ? configObject.name.substring(0, 16)
          : translate("HK_ACCS_BASE"),
      serviceName:
        configObject.serviceName && typeof configObject.serviceName === "string"
          ? configObject.serviceName.substring(0, 16)
          : translate("HK_SRVC_SCREEN"),
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
      description:
        "Exposes a light with brightness control to simulate the mirror screen.",
      docsUrl: "https://github.com/Fabrizz/MMM-HomeKit",
    };

    devicesEventStream.on("SCREEN_CONTROL", (payload) => {
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

/** HKPageControllHandler */
class HKPageControllHandler {
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
      description:
        "Exposes a power strip that controls the current MM2 page, you can control them using shorcuts!",
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
  ["pageControl", HKPageControllHandler],
];
