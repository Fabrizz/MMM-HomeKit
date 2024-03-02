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

    accentColor: true,
    /*
    accentColor: {
      type: "internal", | "CSS var(x)"
      name: "TR(Magic Mirror)" | <str>,
      serviceName: "TR(Accent Color)" | <str>,
    } | false */

    screenControl: true,
    /*
    screenState: {
      type: "internal", | "MMM-Remote-Control" | false
      name: "TR(Magic Mirror)" | <str>,
      serviceName: "TR(Screen)" | <str>,
    } | false */

    pageChanges: false,
    /*
    pageChanges: {
      type: "MMM-Pages" | "MMM-Remote-Control" | false
      pages: ["Page 1", "Page 2"], | str[]
      name: "TR(Magic Mirror)" | <str>,
      serviceName: "TR(Page)" | <str>,
    } | false */

    toggleLyrics: true,
    /*
    toggleLyrics: {
      name: "TR(Magic Mirror)" | <str>,
      serviceName: "TR(Lyrics)" | <str>,
    } | false */
  },

  /******************************************************** MM2 Loaders */
  getScripts: function () {
    let files = [
      this.file("frontend/MirrorDeviceHandlers.js"),
      this.file("frontend/HomekitEventEmmiter.js"),
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
    const moduleData = document.createComment("MMM-HMKT Version: 1.0.0");
    const moduleVersion = document.createComment(
      "MMM-HomeKit by Fabrizz | https://github.com/Fabrizz/MMM-HomeKit",
    );
    const moduleMessage = document.createComment("[!] DVC_CONFIG_NOTICE [!]");
    basicDom.append(moduleData, moduleVersion, moduleMessage);
    return basicDom;
  },

  /******************************************************** Start */
  start: function () {
    this.logBadge();
    this.moduleColor = "#FFE780";
    this.version = "0.1.0";
    this.frontendId = Date.now().toString(16);

    this.thirdPartyNotificationsListenTo = [];
    this.featureHandlers = [];
    this.featureHandlersConfiguration = {};
    /* eslint-disable no-undef */
    this.devicesEventStream = new HomekitEventEmmiter();
    this.availableFeatureHandlers = HKAvailableFeatureHandlers;
    /* eslint-enable no-undef */

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
            false,
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
        this.sendSocketNotification(
          "HOMEKIT_START",
          this.featureHandlersConfiguration,
        );
        this.logInfo("CONFIGURATION_SYNC", this.featureHandlersConfiguration);
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
        this.logInfo("DEVICES_CREATED");
        break;

      case "BACKEND_SHOULD_RESTART":
        if (payload) {
          this.logError("BACKEND_RESYNC_OUTDATED.");
        } else {
          this.logWarnBasic("BACKEND_RESYNC");
        }
        break;

      case "MIRROR_HANDLER_UPDATE":
        console.log("UPDATE_MIRROR", payload);
        this.devicesEventStream.emit(payload.eventName, payload.eventPayload);
        break;
    }
  },
  sendAccesoryNotification(eventName, eventPayload) {
    console.log(eventName, eventPayload, this);
    this.sendSocketNotification("HOMEKIT_ACCESSORY_UPDATE", {
      eventName,
      eventPayload,
    });
  },

  /******************************************************** Console Logs */
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
