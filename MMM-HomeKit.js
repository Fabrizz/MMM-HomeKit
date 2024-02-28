/*
 * MMM-HomeKit
 * MIT License
 *
 * By Fabrizz <3 | https://github.com/Fabrizz/MMM-HomeKit
 */

"use strict";

Module.register("MMM-HomeKit", {
  defaults: {
    name: "MMM-HomeKit",

    accentColor: true,
    /*
    accentColor: {
      type: "internal", | "CSS var(x)"
      name: "TR(Magic Mirror)" | <str>,
      serviceName: "TR(Accent Color)" | <str>,
    } | false
    */

    screenState: false,
    /*
    screenState: {
      type: "internal", | "MMM-Remote-Control" | false
      name: "TR(Magic Mirror)" | <str>,
      serviceName: "TR(Screen)" | <str>,
    } | false
    */

    pageChanges: false,
    /*
    pageChanges: {
      type: "MMM-Pages" | "MMM-Remote-Control" | false
      pages: ["Page 1", "Page 2"], | str[]
      name: "TR(Magic Mirror)" | <str>,
      serviceName: "TR(Page)" | <str>,
    } | false
    */

    toggleLyrics: true,
    /*
    toggleLyrics: {
      name: "TR(Magic Mirror)" | <str>,
      serviceName: "TR(Lyrics)" | <str>,
    } | false
    */
  },

  getTranslations: function () {
    return {
      en: "translations/en.json",
    };
  },

  start: function () {
    this.logBadge();
    this.moduleColor = "#FFE780";
    this.version = "0.1.0";
    this.homekitDevices;
    this.homekitDevices = this.getDevices();
  },

  notificationReceived: function (notification, payload) {
    switch (notification) {
      case "ALL_MODULES_STARTED":
        this.sendSocketNotification("HOMEKIT_START", this.homekitDevices);
        this.logInfo("Sending devices to the backend.", this.homekitDevices);
        break;
      default:
        this.processThirdPartyNotifications(notification, payload);
        break;
    }
  },

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "HOMEKIT_READY":
        this.logInfo("Homekit devices created successfully.");
        break;

      case "UPDATE_MIRROR":
        console.log(payload);
        if (payload.eventName === "LYRICS_CHANGED") {
          if (payload.eventPayload) {
            this.sendNotification("LYRICS_SHOW");
          } else {
            this.sendNotification("LYRICS_HIDE");
          }
        }
        if (payload.eventName === "ACCENT_CHANGED") {
          if (payload.eventPayload[0]) {
            document
              .querySelector(":root")
              .style.setProperty(
                "--HMKT-TEST",
                `rgb(${payload.eventPayload[1][0]}, ${payload.eventPayload[1][1]}, ${payload.eventPayload[1][2]})`,
              );
          }
        }
        break;
    }
  },

  getDevices() {
    let devices = {};
    /******************************************************* toggleLyrics */
    if (this.config.toggleLyrics) {
      if (typeof this.config.toggleLyrics === "boolean") {
        devices.toggleLyrics = {
          name: this.translate("HK_ACCS_BASE"),
          serviceName: this.translate("HK_SRVC_LYRICS"),
        };
      } else {
        devices.toggleLyrics = {
          name:
            this.config.toggleLyrics.name.substring(0, 16) ||
            this.translate("HK_ACCS_BASE"),
          serviceName:
            this.config.toggleLyrics.serviceName.substring(0, 14) ||
            this.translate("HK_SRVC_LYRICS"),
        };
      }
      devices.toggleLyrics.listenFor = {};
    }

    /******************************************************* accentColor */
    if (this.config.accentColor) {
      if (typeof this.config.accentColor === "boolean") {
        devices.accentColor = {
          type: "internal",
          onSpotifyColors: "ignore",
          name: this.translate("HK_ACCS_BASE"),
          serviceName: this.translate("HK_SRVC_ACCENT"),
        };
      } else {
        devices.accentColor = {
          type: this.config.accentColor.type || "internal",
          onSpotifyColors: this.config.accentColor.onSpotifyColors || "ignore",
          name:
            this.config.accentColor.name.substring(0, 16) ||
            this.translate("HK_ACCS_BASE"),
          serviceName:
            this.config.accentColor.serviceName.substring(0, 14) ||
            this.translate("HK_SRVC_ACCENT"),
        };
      }
    }

    return devices;
  },

  processThirdPartyNotifications(name, payload) {},

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
      ` ⠖ %c by Fabrizz %c ${this.name}`,
      "background-color: #555;color: #fff;margin: 0.4em 0em 0.4em 0.4em;padding: 5px 3px 5px 5px;border-radius: 7px 0 0 7px;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;",
      "background-color: #bc81e0;background-image: linear-gradient(90deg, #FFE780, #FA9012);color: #000;margin: 0.4em 0.4em 0.4em 0em;padding: 5px 5px 5px 3px;border-radius: 0 7px 7px 0;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;text-shadow: 0 1px 0 rgba(1, 1, 1, 0.3)",
    );
  },
});
