// Create a custom event emitter
class EventEmitter {
  constructor() {
    this.events = {};
  }

  // Method to subscribe to an event
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  // Method to emit an event
  emit(eventName, data) {
    const eventCallbacks = this.events[eventName];
    if (eventCallbacks) {
      eventCallbacks.forEach((callback) => {
        callback(data);
      });
    }
  }

  // Method to unsubscribe from an event
  off(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(
        (cb) => cb !== callback,
      );
    }
  }
}
