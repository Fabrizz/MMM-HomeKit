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
HKAvailableFeatureHandlers = [
  ["toggleLyrics", HKToggleLyricsHandler],
  ["accentColor", HKAccentColorHandler],
  ["screenControl", HKScreenControlHandler],
  ["pageControl", HKPageControllHandler],
];
