const sensor = require('./sensor');

var StimulusListener = function() {
  this._sensor = sensor;
  this._stimulusId = stimulus.getNextId();
}

StimulusListener.prototype.listenTo = function(triggerName, defaultValue) {
  if (defaultValue) this[triggerName] = defaultValue;
  this._sensor.listenTo(this, triggerName);
}

StimulusListener.prototype.follow = function(triggerName, defaultValue) {
  if (defaultValue) this[triggerName] = defaultValue;
  this._sensor.follow(this, triggerName);
}

StimulusListener.prototype.fire = function(triggerName, args) {
  this._sensor.fire(triggerName, args);
}

StimulusListener.prototype.propagate = function(triggerName, data, args) {
  this._sensor.propagate(triggerName, data, args);
}

StimulusListener.prototype.dataReceiver = function(trigger) {
  this[trigger.name] = trigger.data;
}

StimulusListener.prototype.shouldReceiveData = function(trigger) {
  return true;
}

module.exports = StimulusListener;
