/**
 * Represents an event emitter for HomeKit events.
 */
class HKEventEmmiter {
  constructor() {
    this.events = {};
  }

  /**
   * Registers a callback function for the specified event.
   * @param {string} eventName - The name of the event.
   * @param {Function} callback - The callback function to be executed when the event is emitted.
   */
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  /**
   * Emits the specified event with the provided data.
   * @param {string} eventName - The name of the event to be emitted.
   * @param {*} data - The data to be passed to the event callbacks.
   */
  emit(eventName, data) {
    const eventCallbacks = this.events[eventName];
    if (eventCallbacks) {
      eventCallbacks.forEach((callback) => {
        callback(data);
      });
    }
  }

  /**
   * Unregisters a callback function for the specified event.
   * @param {string} eventName - The name of the event.
   * @param {Function} callback - The callback function to be unregistered.
   */
  off(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(
        (cb) => cb !== callback,
      );
    }
  }
}

/**
 * Translates all items in the provided list using the given translate function.
 * @param {Function} translate - The translation function.
 * @param {Array} list - The list of items to be translated.
 * @returns {object} - The translated strings.
 */
function HKTranslateAll(translate, list) {
  return Object.fromEntries(list.map((x) => [x, translate(x)]));
}

/**
 * Translates the given key using the provided translate function. If the translation is not available, the fallback value is returned.
 * @param {Function} translate - The translate function to use for translating the key.
 * @param {string} key - The key to translate.
 * @param {string} fallback - The fallback value to return if the translation is not available.
 * @returns {string} The translated value or the fallback value.
 */
function HKTraslateFallback(translate, key, fallback) {
  const r = translate(key);
  return r === key ? r : fallback;
}
