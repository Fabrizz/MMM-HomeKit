/*
 * MMM-HomeKit
 * MIT License
 *
 * By Fabrizz <3 | https://github.com/Fabrizz/MMM-HomeKit
 */

const { rm } = require("fs/promises");
const path = require("path");
const EventEmitter = require("events").EventEmitter;
const NodeHelper = require("node_helper");
const hap = require("hap-nodejs");
const express = require("express");
const { deepEqual } = require("./backend/utils");
const {
  HandlerList,
  BridgeHandler,
} = require("./backend/BackendDeviceHandler");

/* const hashPath = path.join(__dirname, "/.cfg.hash"); */
const homekitStorage = path.join(__dirname, "/persist");
const staticFiles = path.join(__dirname, "/client");
hap.HAPStorage.setCustomStoragePath(homekitStorage);

module.exports = NodeHelper.create({
  start: function () {
    console.info(
      `[\x1b[35mMMM-HomeKit\x1b[0m] by Fabrizz >> Node helper loaded. \x1b[90mSaving HAPJS data in: ${homekitStorage}\x1b[0m`,
    );

    // Only allow HomeKit initilization once
    this.started = false;

    // Homekit settings
    this.loadedHomekitCfg = undefined;
    this.accessories = [];
    this.accessoryInformation = {};
    this.availableDeviceHandlers = HandlerList;
    this.experimentalBridge = undefined;

    // Internal event stream to manage devices
    this.events = new EventEmitter();
    this.webClients = [];

    // Define IDs to match requests (One frontend per server if turned on)
    this.clientMatch = `HKA${Date.now().toString(16)}`;
    this.serversideId = Date.now().toString(16); // TODO
    this.backendId = "Not tracked"; // TODO

    this.version = "1.0.0";
    this.helperTranslations = {};

    const router = express.Router();
    router.use(express.json());
    router.get("/events", async (req, res) => {
      const headers = {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      };
      res.writeHead(200, headers);
      res.write("retry: 10000\n\n");

      res.write(
        `data: ${JSON.stringify({
          type: "hka",
          data: this.clientMatch,
        })}\n\n`,
      );

      if (Object.keys(this.helperTranslations).length > 0) {
        res.write(
          `data: ${JSON.stringify({
            type: "translations",
            data: this.helperTranslations,
          })}\n\n`,
        );
      }

      if (Object.keys(this.accessoryInformation).length > 0) {
        res.write(
          `data: ${JSON.stringify({
            type: "accessoryInformation",
            data: this.accessoryInformation,
          })}\n\n`,
        );
      }

      const clientId = Date.now().toString(16);
      this.webClients.push({
        id: clientId,
        res,
      });

      res.on("close", () => {
        this.webClients = this.webClients.filter(
          (client) => client.id !== clientId,
        );
      });
    });
    router.post("/delete-configuration", async (req, res) => {
      if (req.body.match === this.clientMatch) {
        if (this.experimentalBridge) {
          this.experimentalBridge.getHomekitAccesory().unpublish();
        } else {
          this.accessories.forEach((accessory) =>
            accessory.getHomekitAccesory().unpublish(),
          );
        }
        try {
          await rm(homekitStorage, { recursive: true, force: true });
          console.info(
            `[\x1b[35mMMM-HomeKit\x1b[0m] delete-configuration >> \x1b[41m\x1b[37m Removed Homekit (HAP) store \x1b[0m (Stopped advertising of accesories) \x1b[90m${staticFiles}\x1b[0m`,
          );
          res.sendStatus(200);
        } catch (error) {
          console.error(
            "[\x1b[35mMMM-HomeKit\x1b[0m] delete-configuration >> \x1b[41m\x1b[37m Error deleting configuration \x1b[0m",
            error,
          );
          res.sendStatus(500);
        }
      } else {
        res.sendStatus(403);
      }
    });
    router.use("/", express.static(staticFiles));
    this.expressApp.use("/homekit", router);
    console.info(
      `[\x1b[35mMMM-HomeKit\x1b[0m] Created new endpoints >> /homekit \x1b[90mExposing static: ${staticFiles}\x1b[0m`,
    );
  },

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "HOMEKIT_START":
        if (this.started) {
          // Check if the configuration options have changed and just the frontend has the changes.
          if (!deepEqual(payload.homekitCfg, this.loadedHomekitCfg)) {
            this.sendSocketNotification("BACKEND_SHOULD_RESTART", true);
            console.warn(
              "[\x1b[35mMMM-HomeKit\x1b[0m] Frontend sent new configurations >> \x1b[41m\x1b[37m %s \x1b[0m (%s)",
              "Server restart requiered",
              payload.frontendId !== "ABC"
                ? `${payload.frontendId} - ${this.backendId}`
                : "Frontend ID not tracked",
            );
            break;
          }
          // Change to the new frotend ID
          this.backendId = payload.frontendId;
          this.sendSocketNotification("BACKEND_SHOULD_RESTART", false);
          if (payload.frontendId !== "ABC")
            console.info(
              "[\x1b[35mMMM-HomeKit\x1b[0m] Frontend reauth: >> \x1b[44m\x1b[37m %s \x1b[0m",
              `${this.backendId}`,
            );
          break;
        }

        this.loadedHomekitCfg = payload.homekitCfg;
        this.backendId = payload.frontendId;
        this.started = true;
        if (payload.frontendId !== "ABC")
          console.info(
            "[\x1b[35mMMM-HomeKit\x1b[0m] Session identifier: >> \x1b[44m\x1b[37m %s \x1b[0m",
            `${this.backendId}`,
          );
        if (!payload.useExperimentalBridge) {
          this.configureHomekit(payload.homekitCfg);
        } else {
          this.configureHomekitBridge(
            payload.homekitCfg,
            payload.useExperimentalBridge,
          );
        }
        break;
      case "HELPER_TRANSLATIONS":
        this.sendEventWebClient({
          type: "translations",
          data: { ...payload },
        });
        this.helperTranslations = payload;
        break;
      case "HOMEKIT_ACCESSORY_UPDATE":
        console.info("HOMEKIT_ACCESSORY_UPDATE", payload);
        this.sendEventWebClient({
          type: "fromFrontend",
          data: { payload },
        });
        this.events.emit(payload.eventName, payload.eventPayload);
        break;
    }
  },
  sendMirrorHandlerNotification(eventName, eventPayload) {
    if (eventPayload.type === "device-event" && !eventPayload.paired) {
      let device = Object.keys(this.accessoryInformation).filter(
        (x) => this.accessoryInformation[x].notificationName === eventName,
      )[0];
      this.accessoryInformation[device]["state"] = eventPayload.subtype;
    }
    this.sendEventWebClient({
      type: "toFrontend",
      data: { payload: { eventName, eventPayload } },
    });
    this.sendSocketNotification("MIRROR_HANDLER_UPDATE", {
      eventName,
      eventPayload,
    });
  },
  sendEventWebClient(data) {
    try {
      this.webClients.forEach((client) =>
        client.res.write(`data: ${JSON.stringify(data)}\n\n`),
      );
    } catch (error) {
      console.error(
        "[\x1b[35mMMM-HomeKit\x1b[0m] sendEventWebClient (\x1b[36m/homekit/events\x1b[0m) >> \x1b[41m\x1b[37m Express error sending data \x1b[0m",
        error,
      );
    }
  },

  configureHomekit(homekitCfg) {
    try {
      this.availableDeviceHandlers.forEach(([key, HandlerClass]) => {
        if (key in homekitCfg) {
          const DeviceHandler = new HandlerClass(
            homekitCfg[key],
            this.events,
            (x, y) => this.sendMirrorHandlerNotification(x, y),
            this.version,
          );

          const publishInfo = DeviceHandler.getPublishInfo();
          DeviceHandler.getHomekitAccesory().publish(publishInfo);

          const deviceHandlerName = DeviceHandler.constructor.name;
          const handlerData = DeviceHandler.getHelperData();
          const accessoryInfo = DeviceHandler.getHomekitAccessoryInformation();
          const displayName = DeviceHandler.getHomekitAccesory().displayName;
          const setupURI = DeviceHandler.getHomekitAccesory().setupURI();

          console.info(
            "[\x1b[35mMMM-HomeKit\x1b[0m] Created accessory: (\x1b[36m%s\x1b[0m) >> \x1b[44m\x1b[37m %s \x1b[0m",
            deviceHandlerName,
            setupURI,
          );

          this.accessoryInformation[key] = {
            setupURI,
            deviceHandlerName,
            displayName,
            ...publishInfo,
            ...handlerData,
            ...accessoryInfo,
            state: "created",
          };
          this.accessories.push(DeviceHandler);
        }
      });
      this.sendSocketNotification("HOMEKIT_READY", this.accessoryInformation);
      this.sendEventWebClient({
        type: "accessoryInformation",
        data: this.accessoryInformation,
      });
    } catch (error) {
      this.sendSocketNotification("HOMEKIT_LOAD_ERROR");
      console.error(
        "[\x1b[35mMMM-HomeKit\x1b[0m] configureHomekit >> \x1b[41m\x1b[37m Error loading device handlers \x1b[0m Check config.json!",
        error,
      );
    }
  },

  /************************************************************ EXPERIMENTAL */
  configureHomekitBridge(homekitCfg, bridgeCfg) {
    try {
      this.experimentalBridge = new BridgeHandler(
        bridgeCfg,
        this.events,
        (x, y) => this.sendMirrorHandlerNotification(x, y),
        this.version,
      );

      this.availableDeviceHandlers.forEach(([key, HandlerClass]) => {
        if (key in homekitCfg) {
          const DeviceHandler = new HandlerClass(
            homekitCfg[key],
            this.events,
            (x, y) => this.sendMirrorHandlerNotification(x, y),
            this.version,
          );

          const publishInfo = DeviceHandler.getPublishInfo();
          // DeviceHandler.getHomekitAccesory().publish(publishInfo);

          this.experimentalBridge
            .getHomekitAccesory()
            .addBridgedAccessory(DeviceHandler.getHomekitAccesory());

          const deviceHandlerName = DeviceHandler.constructor.name;
          const handlerData = DeviceHandler.getHelperData();
          const accessoryInfo = DeviceHandler.getHomekitAccessoryInformation();
          const displayName = DeviceHandler.getHomekitAccesory().displayName;
          const setupURI = "X-HM://BRIDGED";

          console.info(
            "[\x1b[35mMMM-HomeKit\x1b[0m] Created accessory: (\x1b[36m%s\x1b[0m) >> \x1b[44m\x1b[37m BRIDGED \x1b[0m",
            deviceHandlerName,
          );

          this.accessoryInformation[key] = {
            setupURI,
            deviceHandlerName,
            displayName,
            ...publishInfo,
            ...handlerData,
            ...accessoryInfo,
            state: "bridge",
            delegated: true,
          };
          this.accessories.push(DeviceHandler);
        }
      });

      this.experimentalBridge
        .getHomekitAccesory()
        .publish(this.experimentalBridge.getPublishInfo());

      const setupURI = this.experimentalBridge.getHomekitAccesory().setupURI();
      const deviceHandlerName = this.experimentalBridge.constructor.name;
      console.info(
        "[\x1b[35mMMM-HomeKit\x1b[0m] Created accessory: (\x1b[36m%s\x1b[0m) >> \x1b[44m\x1b[37m %s \x1b[0m",
        deviceHandlerName,
        setupURI,
      );

      this.accessoryInformation["Bridge"] = {
        setupURI,
        deviceHandlerName,
        displayName: this.experimentalBridge.getHomekitAccesory().displayName,
        ...this.experimentalBridge.getPublishInfo(),
        ...this.experimentalBridge.getHelperData(),
        ...this.experimentalBridge.getHomekitAccessoryInformation(),
        state: "created",
        isBridge: true,
      };

      this.sendSocketNotification("HOMEKIT_READY", this.accessoryInformation);
      this.sendEventWebClient({
        type: "accessoryInformation",
        data: this.accessoryInformation,
      });
    } catch (error) {
      this.sendSocketNotification("HOMEKIT_LOAD_ERROR");
      console.error(
        "[\x1b[35mMMM-HomeKit\x1b[0m] configureHomekit >> \x1b[41m\x1b[37m Error loading device handlers \x1b[0m Check config.json!",
        error,
      );
    }
  },
});
