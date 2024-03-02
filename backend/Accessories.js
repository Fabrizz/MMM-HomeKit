const EventEmitter = require("events");
const hap = require("hap-nodejs");

const Accessory = hap.Accessory;
const Characteristic = hap.Characteristic;
const Service = hap.Service;
const Uuid = hap.uuid;
const CharacteristicEventTypes = hap.CharacteristicEventTypes;

/*************************************************************************** SWITCH */
class Switch {
  constructor(accesoryName, serviceName, accesoryUUIDString) {
    this.events = new EventEmitter();
    this.accesoryName = accesoryName;
    this.accesoryUUID = Uuid.generate(accesoryUUIDString);
    this.serviceName = serviceName;

    this.accessory = new Accessory(this.accesoryName, this.accesoryUUID);
    this.switchService = new Service.Switch(this.serviceName);

    this.onCharacteristic = this.switchService.getCharacteristic(
      Characteristic.On,
    );
    this.onCharacteristic.setValue(false);
    this.onCharacteristic.on(
      CharacteristicEventTypes.GET,
      this.getState.bind(this),
    );
    this.onCharacteristic.on(
      CharacteristicEventTypes.SET,
      this.setState.bind(this),
    );

    this.accessory.addService(this.switchService);
    this.switchState = false;
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
  category = hap.Categories.SWITCH;
}

/*************************************************************************** LIGHT HSB */
class LightHSB {
  constructor(accesoryName, serviceName, accesoryUUIDString) {
    this.events = new EventEmitter();
    this.accesoryName = accesoryName;
    this.accesoryUUID = Uuid.generate(accesoryUUIDString);
    this.serviceName = serviceName;

    this.accessory = new Accessory(this.accesoryName, this.accesoryUUID);
    this.lightService = new Service.Lightbulb(this.serviceName);

    this.onCharacteristic = this.lightService.getCharacteristic(
      Characteristic.On,
    );
    this.onCharacteristic.setValue(false);
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
    this.brightnessCharacteristic.setValue(100);
    this.brightnessCharacteristic.on(
      CharacteristicEventTypes.GET,
      this.getStateBrightness.bind(this),
    );
    this.brightnessCharacteristic.on(
      CharacteristicEventTypes.SET,
      this.setStateBrightness.bind(this),
    );

    this.hueCharacteristic = this.lightService.getCharacteristic(
      Characteristic.Hue,
    );
    this.hueCharacteristic.setValue(0);
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
    this.saturationCharacteristic.setValue(0);
    this.saturationCharacteristic.on(
      CharacteristicEventTypes.GET,
      this.getStateSaturation.bind(this),
    );
    this.saturationCharacteristic.on(
      CharacteristicEventTypes.SET,
      this.setStateSaturation.bind(this),
    );

    this.accessory.addService(this.lightService);
    this.lightState = false;
    this.lightHue = 0;
    this.lightSaturation = 0;
    this.lightBrightness = 100;
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
    callback(null);
  }

  getStateSaturation(callback) {
    callback(null, this.lightSaturation);
  }
  setStateSaturation(value, callback) {
    this.lightSaturation = value;
    callback(null);
  }

  getStateHue(callback) {
    callback(null, this.lightHue);
  }
  setStateHue(value, callback) {
    this.lightHue = value;
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
  category = hap.Categories.LIGHTBULB;
}

/*************************************************************************** LIGHT BRG */
class LightBRG {
  constructor(accesoryName, serviceName, accesoryUUIDString) {
    this.events = new EventEmitter();
    this.accesoryName = accesoryName;
    this.accesoryUUID = Uuid.generate(accesoryUUIDString);
    this.serviceName = serviceName;

    this.accessory = new Accessory(this.accesoryName, this.accesoryUUID);
    this.lightService = new Service.Lightbulb(this.serviceName);

    this.onCharacteristic = this.lightService.getCharacteristic(
      Characteristic.On,
    );
    this.onCharacteristic.setValue(false);
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
    this.brightnessCharacteristic.setValue(100);
    this.brightnessCharacteristic.on(
      CharacteristicEventTypes.GET,
      this.getStateBrightness.bind(this),
    );
    this.brightnessCharacteristic.on(
      CharacteristicEventTypes.SET,
      this.setStateBrightness.bind(this),
    );

    this.accessory.addService(this.lightService);
    this.lightState = false;
    this.lightBrightness = 100;
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
  category = hap.Categories.LIGHTBULB;
}

module.exports = { Switch, LightHSB, LightBRG };
