const EventEmitter = require("events");
const hap = require("hap-nodejs");

const Accessory = hap.Accessory;
const Characteristic = hap.Characteristic;
const Service = hap.Service;
const Uuid = hap.uuid;
const CharacteristicEventTypes = hap.CharacteristicEventTypes;
const Bridge = hap.Bridge;

/*************************************************************************** BRIDGE */
class BasicBridge {
  constructor(version, accessoryName, accessoryUUIDString) {
    this.events = new EventEmitter();
    this.ACCESORY_NAME = accessoryName;
    this.ACCESSORY_UUID = Uuid.generate(accessoryUUIDString);
    this.ACCESORY_INF = {
      manufacturer: "Fabrizz",
      model: "MagicMirror HK Experimental Bridge",
      version,
      serialNumber: "EXPERIMENTAL:BRIDGE",
    };

    this.accessory = new Bridge(this.ACCESORY_NAME, this.ACCESSORY_UUID);

    this.accessory
      .getService(Service.AccessoryInformation)
      .setCharacteristic(
        Characteristic.Manufacturer,
        this.ACCESORY_INF.manufacturer,
      )
      .setCharacteristic(Characteristic.Model, this.ACCESORY_INF.model)
      .setCharacteristic(
        Characteristic.FirmwareRevision,
        this.ACCESORY_INF.version,
      )
      .setCharacteristic(
        Characteristic.SerialNumber,
        this.ACCESORY_INF.serialNumber,
      );

    this.accessory.on("advertised", this.setAdvertised.bind(this));
    this.accessory.on("paired", this.setPaired.bind(this));
    this.accessory.on("unpaired", this.setUnpaired.bind(this));
    this.accessory.on("identify", this.setIdentify.bind(this));
  }
  setPaired() {
    this.events.emit("paired");
  }
  setUnpaired() {
    this.events.emit("unpaired");
  }
  setAdvertised() {
    this.events.emit("advertised");
  }
  setIdentify(paired, callback) {
    this.events.emit("identify", paired);
    callback(null);
  }

  on(eventName, listener) {
    this.events.on(eventName, listener);
  }

  getAccessory() {
    return this.accessory;
  }
  getAccessoryInformation() {
    return this.ACCESORY_INF;
  }
  category = hap.Categories.BRIDGE;
}

/*************************************************************************** SWITCH */
class Switch {
  constructor(
    version,
    accessoryName,
    serviceName,
    accessoryUUIDString,
    startValue = false,
  ) {
    this.events = new EventEmitter();
    this.ACCESORY_NAME = accessoryName;
    this.ACCESSORY_UUID = Uuid.generate(accessoryUUIDString);
    this.SERVICE_NAME = serviceName;
    this.ACCESORY_INF = {
      manufacturer: "Fabrizz",
      model: "MagicMirror HK Switch",
      version,
      serialNumber: "BASIC:SWITCH",
    };

    this.accessory = new Accessory(this.ACCESORY_NAME, this.ACCESSORY_UUID);
    this.switchService = new Service.Switch(this.SERVICE_NAME);

    this.accessory
      .getService(Service.AccessoryInformation)
      .setCharacteristic(
        Characteristic.Manufacturer,
        this.ACCESORY_INF.manufacturer,
      )
      .setCharacteristic(Characteristic.Model, this.ACCESORY_INF.model)
      .setCharacteristic(
        Characteristic.FirmwareRevision,
        this.ACCESORY_INF.version,
      )
      .setCharacteristic(
        Characteristic.SerialNumber,
        this.ACCESORY_INF.serialNumber,
      );

    this.onCharacteristic = this.switchService.getCharacteristic(
      Characteristic.On,
    );
    this.onCharacteristic.setValue(startValue);
    this.onCharacteristic.on(
      CharacteristicEventTypes.GET,
      this.getState.bind(this),
    );
    this.onCharacteristic.on(
      CharacteristicEventTypes.SET,
      this.setState.bind(this),
    );

    this.accessory.on("advertised", this.setAdvertised.bind(this));
    this.accessory.on("paired", this.setPaired.bind(this));
    this.accessory.on("unpaired", this.setUnpaired.bind(this));
    this.accessory.on("identify", this.setIdentify.bind(this));

    this.accessory.addService(this.switchService);
    this.switchState = startValue;
  }

  setPaired() {
    this.events.emit("paired");
  }
  setUnpaired() {
    this.events.emit("unpaired");
  }
  setAdvertised() {
    this.events.emit("advertised");
  }
  setIdentify(paired, callback) {
    this.events.emit("identify", paired);
    callback(null);
  }

  getState(callback) {
    callback(null, this.switchState);
  }
  setState(value, callback) {
    this.switchState = value;
    this.events.emit("stateChange", value);
    callback(null);
  }

  turnOn() {
    this.switchState = true;
    this.onCharacteristic.setValue(true);
  }
  turnOff() {
    this.switchState = false;
    this.onCharacteristic.setValue(false);
  }

  on(eventName, listener) {
    this.events.on(eventName, listener);
  }

  getAccessory() {
    return this.accessory;
  }
  getAccessoryInformation() {
    return this.ACCESORY_INF;
  }
  category = hap.Categories.SWITCH;
}

/*************************************************************************** LIGHT HSB */
class LightHSB {
  constructor(
    version,
    accessoryName,
    serviceName,
    accessoryUUIDString,
    startValue = [false, [0, 0, 100]],
  ) {
    this.events = new EventEmitter();
    this.ACCESORY_NAME = accessoryName;
    this.ACCESSORY_UUID = Uuid.generate(accessoryUUIDString);
    this.SERVICE_NAME = serviceName;
    this.ACCESORY_INF = {
      manufacturer: "Fabrizz",
      model: "MagicMirror HK LightHSB",
      version,
      serialNumber: "BASIC:LIGHTHSB",
    };

    this.accessory = new Accessory(this.ACCESORY_NAME, this.ACCESSORY_UUID);
    this.lightService = new Service.Lightbulb(this.SERVICE_NAME);

    this.accessory
      .getService(Service.AccessoryInformation)
      .setCharacteristic(
        Characteristic.Manufacturer,
        this.ACCESORY_INF.manufacturer,
      )
      .setCharacteristic(Characteristic.Model, this.ACCESORY_INF.model)
      .setCharacteristic(
        Characteristic.FirmwareRevision,
        this.ACCESORY_INF.version,
      )
      .setCharacteristic(
        Characteristic.SerialNumber,
        this.ACCESORY_INF.serialNumber,
      );

    this.onCharacteristic = this.lightService.getCharacteristic(
      Characteristic.On,
    );
    this.onCharacteristic.setValue(startValue[0]);
    this.onCharacteristic.on(
      CharacteristicEventTypes.GET,
      this.getState.bind(this),
    );
    this.onCharacteristic.on(
      CharacteristicEventTypes.SET,
      this.setState.bind(this),
    );

    this.hueCharacteristic = this.lightService.getCharacteristic(
      Characteristic.Hue,
    );
    this.hueCharacteristic.setValue(startValue[1][0]);
    this.hueCharacteristic.on(
      CharacteristicEventTypes.GET,
      this.getStateHue.bind(this),
    );
    this.hueCharacteristic.on(
      CharacteristicEventTypes.SET,
      this.setStateHue.bind(this),
    );

    this.saturationCharacteristic = this.lightService.getCharacteristic(
      Characteristic.Saturation,
    );
    this.saturationCharacteristic.setValue(startValue[1][1]);
    this.saturationCharacteristic.on(
      CharacteristicEventTypes.GET,
      this.getStateSaturation.bind(this),
    );
    this.saturationCharacteristic.on(
      CharacteristicEventTypes.SET,
      this.setStateSaturation.bind(this),
    );

    this.brightnessCharacteristic = this.lightService.getCharacteristic(
      Characteristic.Brightness,
    );
    this.brightnessCharacteristic.setValue(startValue[1][2]);
    this.brightnessCharacteristic.on(
      CharacteristicEventTypes.GET,
      this.getStateBrightness.bind(this),
    );
    this.brightnessCharacteristic.on(
      CharacteristicEventTypes.SET,
      this.setStateBrightness.bind(this),
    );

    this.accessory.on("advertised", this.setAdvertised.bind(this));
    this.accessory.on("paired", this.setPaired.bind(this));
    this.accessory.on("unpaired", this.setUnpaired.bind(this));
    this.accessory.on("identify", this.setIdentify.bind(this));

    this.accessory.addService(this.lightService);
    this.lightState = startValue[0];
    this.lightHue = startValue[1][0];
    this.lightSaturation = startValue[1][1];
    this.lightBrightness = startValue[1][2];
  }

  setPaired() {
    this.events.emit("paired");
  }
  setUnpaired() {
    this.events.emit("unpaired");
  }
  setAdvertised() {
    this.events.emit("advertised");
  }
  setIdentify(paired, callback) {
    this.events.emit("identify", paired);
    callback(null);
  }

  getState(callback) {
    callback(null, this.lightState);
  }
  setState(value, callback) {
    this.lightState = value;
    /* On HSB change, onCharacteristic is the only always called */
    this.events.emit("stateChange", [
      this.lightState,
      [this.lightHue, this.lightSaturation, this.lightBrightness],
    ]);
    callback(null);
  }

  getStateBrightness(callback) {
    callback(null, this.lightBrightness);
  }
  setStateBrightness(value, callback) {
    this.lightBrightness = value;
    this.events.emit("stateChange", [
      this.lightState,
      [this.lightHue, this.lightSaturation, this.lightBrightness],
    ]);
    callback(null);
  }

  getStateSaturation(callback) {
    callback(null, this.lightSaturation);
  }
  setStateSaturation(value, callback) {
    this.lightSaturation = value;
    this.events.emit("stateChange", [
      this.lightState,
      [this.lightHue, this.lightSaturation, this.lightBrightness],
    ]);
    callback(null);
  }

  getStateHue(callback) {
    callback(null, this.lightHue);
  }
  setStateHue(value, callback) {
    this.lightHue = value;
    this.events.emit("stateChange", [
      this.lightState,
      [this.lightHue, this.lightSaturation, this.lightBrightness],
    ]);
    callback(null);
  }

  turnOn([h, s, b]) {
    this.switchState = true;
    if (h) this.lightHue = h;
    if (s) this.lightSaturation = s;
    if (b) this.lightBrightness = b;
    this.onCharacteristic.setValue(true);
  }
  turnOff() {
    this.switchState = false;
    this.onCharacteristic.setValue(false);
  }

  on(eventName, listener) {
    this.events.on(eventName, listener);
  }

  getAccessory() {
    return this.accessory;
  }
  getAccessoryInformation() {
    return this.ACCESORY_INF;
  }
  category = hap.Categories.LIGHTBULB;
}

/*************************************************************************** LIGHT BRG */
class LightBRG {
  constructor(
    version,
    accessoryName,
    serviceName,
    accessoryUUIDString,
    startValue = [false, 100],
  ) {
    this.events = new EventEmitter();
    this.ACCESORY_NAME = accessoryName;
    this.ACCESSORY_UUID = Uuid.generate(accessoryUUIDString);
    this.SERVICE_NAME = serviceName;
    this.ACCESORY_INF = {
      manufacturer: "Fabrizz",
      model: "MagicMirror HK LightBRG",
      version,
      serialNumber: "BASIC:LIGHTBRG",
    };

    this.accessory = new Accessory(this.ACCESORY_NAME, this.ACCESSORY_UUID);
    this.lightService = new Service.Lightbulb(this.SERVICE_NAME);

    this.accessory
      .getService(Service.AccessoryInformation)
      .setCharacteristic(
        Characteristic.Manufacturer,
        this.ACCESORY_INF.manufacturer,
      )
      .setCharacteristic(Characteristic.Model, this.ACCESORY_INF.model)
      .setCharacteristic(
        Characteristic.FirmwareRevision,
        this.ACCESORY_INF.version,
      )
      .setCharacteristic(
        Characteristic.SerialNumber,
        this.ACCESORY_INF.serialNumber,
      );

    this.onCharacteristic = this.lightService.getCharacteristic(
      Characteristic.On,
    );
    this.onCharacteristic.setValue(startValue[0]);
    this.onCharacteristic.on(
      CharacteristicEventTypes.GET,
      this.getState.bind(this),
    );
    this.onCharacteristic.on(
      CharacteristicEventTypes.SET,
      this.setState.bind(this),
    );

    this.brightnessCharacteristic = this.lightService.getCharacteristic(
      Characteristic.Brightness,
    );
    this.brightnessCharacteristic.setValue(startValue[1]);
    this.brightnessCharacteristic.on(
      CharacteristicEventTypes.GET,
      this.getStateBrightness.bind(this),
    );
    this.brightnessCharacteristic.on(
      CharacteristicEventTypes.SET,
      this.setStateBrightness.bind(this),
    );

    this.accessory.on("advertised", this.setAdvertised.bind(this));
    this.accessory.on("paired", this.setPaired.bind(this));
    this.accessory.on("unpaired", this.setUnpaired.bind(this));
    this.accessory.on("identify", this.setIdentify.bind(this));

    this.accessory.addService(this.lightService);
    this.lightState = startValue[0];
    this.lightBrightness = startValue[1];
  }

  setPaired() {
    this.events.emit("paired");
  }
  setUnpaired() {
    this.events.emit("unpaired");
  }
  setAdvertised() {
    this.events.emit("advertised");
  }
  setIdentify(paired, callback) {
    this.events.emit("identify", paired);
    callback(null);
  }

  getState(callback) {
    callback(null, this.lightState);
  }
  setState(value, callback) {
    this.lightState = value;
    /* On HSB change, onCharacteristic is the only always called */
    this.events.emit("stateChange", [this.lightState, this.lightBrightness]);
    callback(null);
  }

  getStateBrightness(callback) {
    callback(null, this.lightBrightness);
  }
  setStateBrightness(value, callback) {
    this.lightBrightness = value;
    callback(null);
  }

  turnOn(b) {
    this.switchState = true;
    if (b) this.lightBrightness = b;
    this.onCharacteristic.setValue(true);
  }
  turnOff() {
    this.switchState = false;
    this.onCharacteristic.setValue(false);
  }

  on(eventName, listener) {
    this.events.on(eventName, listener);
  }

  getAccessory() {
    return this.accessory;
  }
  getAccessoryInformation() {
    return this.ACCESORY_INF;
  }
  category = hap.Categories.LIGHTBULB;
}

/*************************************************************************** SWITCH MULTIPLE */
class SwitchMultiple {
  constructor(
    version,
    accessoryName,
    accessoryUUIDString,
    switchList,
    startValue,
  ) {
    this.events = new EventEmitter();
    this.ACCESORY_NAME = accessoryName;
    this.ACCESSORY_UUID = Uuid.generate(accessoryUUIDString);
    this.ACCESORY_INF = {
      manufacturer: "Fabrizz",
      model: "MagicMirror HK SwitchMultiple",
      version,
      serialNumber: "MULTIPLE:SWITCH",
    };

    this.switchlist = switchList;
    this.switchServices = [];
    this.switchStates = [];

    this.accessory = new Accessory(this.ACCESORY_NAME, this.ACCESSORY_UUID);

    this.accessory
      .getService(Service.AccessoryInformation)
      .setCharacteristic(
        Characteristic.Manufacturer,
        this.ACCESORY_INF.manufacturer,
      )
      .setCharacteristic(Characteristic.Model, this.ACCESORY_INF.model)
      .setCharacteristic(
        Characteristic.FirmwareRevision,
        this.ACCESORY_INF.version,
      )
      .setCharacteristic(
        Characteristic.SerialNumber,
        this.ACCESORY_INF.serialNumber,
      );

    this.switchlist.forEach((name, index) => {
      const state = startValue ? startValue[index] : false;
      this.switchStates.push(state);

      const switchService = new Service.Outlet(name, String(index));
      const onCharacteristic = switchService.getCharacteristic(
        Characteristic.On,
      );
      onCharacteristic.setValue(state);

      onCharacteristic.on(
        CharacteristicEventTypes.GET,
        this.getState.bind(this, index),
      );
      onCharacteristic.on(
        CharacteristicEventTypes.SET,
        this.setState.bind(this, index),
      );

      this.switchServices.push([switchService, onCharacteristic]);
      this.accessory.addService(switchService);
    });

    this.accessory.on("advertised", this.setAdvertised.bind(this));
    this.accessory.on("paired", this.setPaired.bind(this));
    this.accessory.on("unpaired", this.setUnpaired.bind(this));
    this.accessory.on("identify", this.setIdentify.bind(this));
  }

  setPaired() {
    this.events.emit("paired");
  }
  setUnpaired() {
    this.events.emit("unpaired");
  }
  setAdvertised() {
    this.events.emit("advertised");
  }
  setIdentify(paired, callback) {
    this.events.emit("identify", paired);
    callback(null);
  }

  getState(index, callback) {
    callback(null, this.switchStates[index]);
  }
  setState(index, value, callback) {
    this.switchStates[index] = value;
    this.events.emit("stateChange", [index, value]);
    callback(null);
  }

  turnOn(index) {
    this.switchStates[index] = true;
    this.switchServices[index][1].setValue(true);
  }
  turnOff(index) {
    this.switchStates[index] = false;
    this.switchServices[index][1].setValue(false);
  }

  on(eventName, listener) {
    this.events.on(eventName, listener);
  }

  getAccessory() {
    return this.accessory;
  }
  getAccessoryInformation() {
    return this.ACCESORY_INF;
  }
  category = hap.Categories.OUTLET;
}

module.exports = {
  BasicBridge,
  Switch,
  LightHSB,
  LightBRG,
  SwitchMultiple,
};
