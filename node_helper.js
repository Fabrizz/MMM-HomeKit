/*
 * MMM-HomeKit
 * MIT License
 *
 * By Fabrizz <3 | https://github.com/Fabrizz/MMM-HomeKit
 */

const path = require("path");
const EventEmitter = require("events").EventEmitter;
const NodeHelper = require("node_helper");
const hap = require("hap-nodejs");
const express = require("express");
const { deepEqual, composeHomekitQrCode } = require("./backend/utils");
const { HandlerList } = require("./backend/BackendDeviceHandler");

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
    // Stored Homekit settings
    this.loadedHomekitCfg = undefined;
    this.accessories = [];
    this.accessoryInformation = {};
    // Internal event stream to manage devices
    this.events = new EventEmitter();
    this.webClients = [];

    this.availableDeviceHandlers = HandlerList;

    // Define IDs to match requests (One frontend per server if turned on)
    this.serversideId = Date.now().toString(16);
    this.backendId = "Not tracked";
    this.version = "1.0.0";

    const router = express.Router();
    router.get("/events", async (req, res) => {
      const headers = {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      };
      res.writeHead(200, headers);
      res.write("retry: 10000\n\n");

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
        this.configureHomekit(payload.homekitCfg);
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

  async configureHomekit(homekitCfg) {
    let deviceCreationPromises = [];
    try {
      this.availableDeviceHandlers.forEach(([key, HandlerClass]) => {
        if (key in homekitCfg) {
          deviceCreationPromises.push(
            new Promise((resolve, _reject) => {
              const DeviceHandler = new HandlerClass(
                homekitCfg[key],
                this.events,
                (x, y) => this.sendMirrorHandlerNotification(x, y),
                this.version,
              );
              const deviceHandlerName = DeviceHandler.constructor.name;
              const publishInfo = DeviceHandler.getPublishInfo();
              const handlerData = DeviceHandler.getHandlerData();
              DeviceHandler.getHomekitAccesory().publish(publishInfo);
              const displayName =
                DeviceHandler.getHomekitAccesory().displayName;
              const accessoryInfo =
                DeviceHandler.getHomekitAccessoryInformation();
              const setupURI = DeviceHandler.getHomekitAccesory().setupURI();

              console.info(
                "[\x1b[35mMMM-HomeKit\x1b[0m] Created accessory: (\x1b[36m%s\x1b[0m) >> \x1b[44m\x1b[37m %s \x1b[0m",
                deviceHandlerName,
                setupURI,
              );

              composeHomekitQrCode(
                publishInfo.pincode.replace(/\D/g, ""),
                setupURI,
              )
                .then((pairingQrSvg) => {
                  this.accessoryInformation[key] = {
                    setupURI,
                    deviceHandlerName,
                    displayName,
                    ...publishInfo,
                    ...handlerData,
                    ...accessoryInfo,
                    pairingQrSvg,
                    state: "created",
                  };
                  this.accessories.push(DeviceHandler);
                  resolve();
                })
                .catch((error) => {
                  console.warn(
                    "[\x1b[35mMMM-HomeKit\x1b[0m] configureHomekit (\x1b[36m%s\x1b[0m)  >> \x1b[41m\x1b[37m Error generating Homekit SVG label \x1b[0m",
                    deviceHandlerName,
                    error,
                  ),
                    (this.accessoryInformation[key] = {
                      setupURI,
                      deviceHandlerName,
                      displayName,
                      ...publishInfo,
                      ...accessoryInfo,
                      state: "created",
                    });
                  this.accessories.push(DeviceHandler);
                  resolve();
                });
            }),
          );
        }
      });
      Promise.all(deviceCreationPromises).then(() => {
        this.sendSocketNotification("HOMEKIT_READY", this.accessoryInformation);
        this.sendEventWebClient({
          type: "accessoryInformation",
          data: this.accessoryInformation,
        });
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
