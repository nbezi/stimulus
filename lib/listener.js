const sensor = require('./stimulus');

export default class Listener {
  constructor () {
    this._sensor = sensor;
    this._stimulusId = sensor.getNextId();
  }

  listenTo (triggerName, defaultValue) {
    if (defaultValue !== null && typeof defaultValue !== 'undefined') {
      this[triggerName] = defaultValue;
    }
    this._sensor.listenTo(this, triggerName);
  }

  follow (triggerName, defaultValue) {
    if (defaultValue !== null && typeof defaultValue !== 'undefined') {
      this[triggerName] = defaultValue;
    }
    this._sensor.follow(this, triggerName);
  }

  fire (triggerName, args) {
    this._sensor.fire(triggerName, args);
  }

  propagate (triggerName, data, args) {
    this._sensor.propagate(triggerName, data, args);
  }

  dataReceiver (trigger) {
    this[trigger.name] = trigger.data;
  }

  shouldReceiveData (trigger) {
    return true;
  }
}
