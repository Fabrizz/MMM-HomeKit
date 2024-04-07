/*
 * MMM-HomeKit
 * MIT License
 *
 * By Fabrizz <3 | https://github.com/Fabrizz/MMM-HomeKit
 */

"use strict";

Module.register("MMM-HomeKit", {
  /******************************************************** Configuration */
  defaults: {
    name: "MMM-HomeKit",

    accentColor: {
      name: "MM Accent color",
      cssVariable: "--color-text-dimmed",
      useThemeLock: true,
    },
    /*
    accentColor: {
      type: "internal", | "CSS var(x)"
      name: "TR(Magic Mirror)" | <str>,
      serviceName: "TR(Accent Color)" | <str>,
    } | false */

    // api: MMM-Remote-Control or similar
    screenControl: true,
    /*
    screenState: {
      type: "internal", | "MMM-Remote-Control" | false
      name: "TR(Magic Mirror)" | <str>,
      serviceName: "TR(Screen)" | <str>,
    } | false */

    pageControl: true,
    /*
    pageChanges: {
      type: "MMM-Pages" | "MMM-Remote-Control" | false
      pages: ["Page 1", "Page 2"], | str[]
      name: "TR(Magic Mirror)" | <str>,
      serviceName: "TR(Page)" | <str>,
    } | false */

    toggleLyrics: {
      name: "MMM lyrics",
    },
    /*
    toggleLyrics: {
      name: "TR(Magic Mirror)" | <str>,
      serviceName: "TR(Lyrics)" | <str>,
    } | false */

    // [EXPERIMENTAL] This will allow the module to use a hk bridge as the communication channel
    useExperimentalBridge: false,

    // In special use cases where a frontend needs to take over other you can disable
    // the id matching for the frontend, so "multiple" frontends can talk to the module even if not supported
    matchBackendUUID: false,
  },

  /******************************************************** MM2 Loaders */
  getScripts: function () {
    let files = [
      this.file("frontend/HomekitUtils.js"),
      this.file("frontend/HomekitDomBuilder.js"),
      this.file("frontend/MirrorDeviceHandlers.js"),
    ];
    return files;
  },
  getTranslations: function () {
    return {
      en: "translations/en.json",
      es: "translations/es.json",
    };
  },
  getStyles: function () {
    return [this.file("css/included.css")];
  },
  getDom: function () {
    const basicDom = document.createElement("div");
    basicDom.id = "HMKT-NOTIFICATIONS";
    const moduleData = document.createComment(
      `MMM-HMKT Version: ${this.VERSION}`,
    );
    const moduleVersion = document.createComment(
      "MMM-HomeKit by Fabrizz | https://github.com/Fabrizz/MMM-HomeKit",
    );
    const moduleMessage = document.createComment(
      `[!] ${this.translate("HTML_NOTICE")} [!]`,
    );
    basicDom.append(moduleData, moduleVersion, moduleMessage);
    return basicDom;
  },

  /******************************************************** Start */
  start: function () {
    this.logBadge();
    this.VERSION = "0.3.0";
    this.FRONTEND_ID = this.config.matchBackendUUID
      ? Date.now().toString(16)
      : "ABC";

    this.thirdPartyNotificationsListenTo = [];
    this.featureHandlers = [];
    this.featureHandlersConfiguration = {};
    /* eslint-disable no-undef */
    this.devicesEventStream = new HKEventEmmiter();
    this.availableFeatureHandlers = HKAvailableFeatureHandlers;
    /* eslint-enable no-undef */

    this.CFGHELPER_TRANSLATIONS = [
      "CH_CTA_SUBTITLE",
      "CH_CTA_BODY",
      "CH_CTA_BTN_ADD",
      "CH_CTA_BTN_DOCS",
      "CH_DEVICESLOADED",
      "CH_RECIEVEDDATA",
      "CH_WAITING_BODY",
      "CH_WAITING",
      "CH_TYPE",
      "CH_TIMESTAMP",
      "CH_PAYLOAD",
      "CH_MODAL_ADD_TITLE",
      "CH_MODAL_ADD_BODY",
      "CH_MODAL_ADD_BTN",
      "CH_MODAL_DEVICE_PINCODE",
      "CH_MODAL_DEVICE_USERNAME",
      "CH_MODAL_DEVICE_PORT",
      "CH_MODAL_DEVICE_URI",
      "CH_MODAL_DEVICE_INTEGRATION",
      "CH_MODAL_DEVICE_STATE",
      "CH_MODAL_DEVICE_DEVICE",
      "CH_MODAL_DEVICE_HANDLER",
      "CH_MODAL_DEVICE_NOTIFICATION",
      "CH_MODAL_DEVICE_IDMATERIAL",
      "CH_MODAL_DEVICE_CATEGORY",
      "CH_MODAL_DEVICE_BTN_DOCS",
      "CH_MODAL_DEVICE_BTN_GENERALCONFIG",
      "CH_MODAL_DEVICE_BTN_CLOSE",
      "CH_MODAL_CONFIG_TITLE",
      "CH_MODAL_CONFIG_DATA_TITLE",
      "CH_MODAL_CONFIG_DATA_BODY",
      "CH_MODAL_CONFIG_DATA_BNT",
      "CH_MODAL_CONFIG_DELETE_TITLE",
      "CH_MODAL_CONFIG_DELETE_BODY",
      "CH_MODAL_CONFIG_DELETE_BTN",
      "CH_MODAL_CONFIG_BTN_DOCS",
      "CH_MODAL_CONFIG_BTN_CLOSE",
      "CH_MODAL_DELETE_SUBTITLE",
      "CH_MODAL_DELETE_TITLE",
      "CH_MODAL_DELETE_NOTICE",
      "CH_MODAL_DELETE_BODY",
      "CH_MODAL_DELETE_BTN_DOCS",
      "CH_MODAL_DELETE_BTN_DELETE",
      "CH_MODAL_DELETE_BTN_DELETE_DONE",
      "CH_MODAL_DELETE_BTN_DELETE_ERROR",
      "CH_MODAL_DELETE_BTN_BACK",
      "CH_MODAL_DATA_DEVICE",
      "CH_MODAL_DATA_TRANSLATIONS",
      "CH_MODAL_DATA_OTHER",
      "CH_MODAL_DATA_BTN_BACK",
      "CH_CODE_CREATED",
      "CH_CODE_PAIRED",
      "CH_CODE_ADVERTISED",
      "CH_CODE_UNPAIRED",
      "CH_CODE_PREIDENTIFY",
      "CH_CODE_UNKNOWN",
    ];

    const LOGGERS = {
      debug: this.logDebug,
      info: this.logInfo,
      warnBasic: this.logWarnBasic,
      warn: this.logWarn,
      error: this.logError,
      shouldLog: true,
    };

    // Dinamically add handlers and configurations
    this.availableFeatureHandlers.forEach(([key, FeatureHandler]) => {
      try {
        if (key in this.config && this.config[key] !== false) {
          const Handler = new FeatureHandler(
            this.config[key],
            this.devicesEventStream,
            (x, y) => this.translate(x, y),
            (x, y) => this.sendNotification(x, y),
            (x, y) => this.sendAccesoryNotification(x, y),
            LOGGERS,
          );
          this.thirdPartyNotificationsListenTo.push(...Handler.listenTo());
          this.featureHandlersConfiguration[key] = Handler.configuration();
          this.featureHandlers.push(Handler);
        }
      } catch (error) {
        this.logError(this.translate("FHANDLER_CREATION_ERROR"), error);
      }
    });
  },

  /******************************************************** Notifications */
  notificationReceived: function (notification, payload) {
    switch (notification) {
      case "ALL_MODULES_STARTED":
        try {
          this.sendSocketNotification(
            "HELPER_TRANSLATIONS",
            // eslint-disable-next-line no-undef
            HKTranslateAll(
              (x, y) => this.translate(x, y),
              this.CFGHELPER_TRANSLATIONS,
            ),
          );
        } catch (error) {
          this.logError(this.translate("TRANSLATION_ERROR"), error);
        }
        this.sendSocketNotification("HOMEKIT_START", {
          homekitCfg: this.featureHandlersConfiguration,
          frontendId: this.FRONTEND_ID,
          useExperimentalBridge: this.config.useExperimentalBridge
            ? // eslint-disable-next-line no-undef
              HKExperimentalBridgeConfiguration
            : false,
        });
        this.logInfo(
          this.translate("CONFIGURATION_SYNC"),
          this.featureHandlersConfiguration,
        );
        break;

      default:
        // Handle notifications for devices
        if (this.thirdPartyNotificationsListenTo.includes(notification))
          this.devicesEventStream.emit(`__${notification}`, payload);
        break;
    }
  },
  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "HOMEKIT_READY":
        this.logInfo(this.translate("DEVICES_CREATED"), payload);
        break;

      case "BACKEND_SHOULD_RESTART":
        if (payload) {
          this.logError(this.translate("BACKEND_RESYNC_OUTDATED"));
        } else {
          this.logWarnBasic(this.translate("BACKEND_RESYNC"));
        }
        break;

      case "HOMEKIT_LOAD_ERROR":
        this.logError(this.translate("BACKEND_DEVICE_ERROR"));
        break;

      case "MIRROR_HANDLER_UPDATE":
        console.log(payload);
        this.devicesEventStream.emit(payload.eventName, payload.eventPayload);
        break;
    }
  },
  sendAccesoryNotification(eventName, eventPayload) {
    this.sendSocketNotification("HOMEKIT_ACCESSORY_UPDATE", {
      eventName,
      eventPayload,
    });
  },

  /******************************************************** Console Logs */
  logDebug(str, ...arg) {
    console.debug(
      `%c· MMM-HomeKit %c %c DBUG %c ${str}`,
      "background-color:#FFE780;color:black;border-radius:0.5em",
      "",
      "background-color:#293f45;color:white;",
      "",
      ...arg,
    );
  },
  logInfo(str, ...arg) {
    console.info(
      `%c· MMM-HomeKit %c %c INFO %c ${str}`,
      "background-color:#FFE780;color:black;border-radius:0.5em",
      "",
      "background-color:#02675d;color:white;",
      "",
      ...arg,
    );
  },
  logWarnBasic(str, ...arg) {
    console.info(
      `%c· MMM-HomeKit %c %c WARN %c ${str}`,
      "background-color:#FFE780;color:black;border-radius:0.5em",
      "",
      "background-color:#a98403;color:white;",
      "",
      ...arg,
    );
  },
  logWarn(str, ...arg) {
    console.warn(
      `%c· MMM-HomeKit %c %c WARN %c ${str}`,
      "background-color:#FFE780;color:black;border-radius:0.5em",
      "",
      "background-color:#a98403;color:white;",
      "",
      ...arg,
    );
  },
  logError(str, ...arg) {
    console.error(
      `%c· MMM-HomeKit %c %c ERRO %c ${str}`,
      "background-color:#FFE780;color:black;border-radius:0.5em",
      "",
      "background-color:#781919;color:white;",
      "",
      ...arg,
    );
  },
  logBadge: function () {
    console.log(
      ` ⠖ %c by Fabrizz %c MMM-HomeKit `,
      "background-color: #555;color: #fff;margin: 0.4em 0em 0.4em 0.4em;padding: 5px 3px 5px 5px;border-radius: 7px 0 0 7px;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;",
      "background-color: #bc81e0;background-image: linear-gradient(90deg, #FFE780, #FA9012);color: #000;margin: 0.4em 0.4em 0.4em 0em;padding: 5px 5px 5px 3px;border-radius: 0 7px 7px 0;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;text-shadow: 0 1px 0 rgba(1, 1, 1, 0.3)",
    );
  },
});
