const sensor = require('./sensor');
const React = require('react');

var StimulusComponent = function(props, context, updater) {
  this.super(props, context, updater);
  this.state = {};
  this._sensor = sensor;
  this._stimulusId = sensor.getNextId();
}

var parent = new React.Component();
StimulusComponent.prototype = parent;
StimulusComponent.prototype.super = parent.constructor;
StimulusComponent.prototype.constructor = StimulusComponent;

StimulusComponent.prototype.componentWillUnmount = function() {
  this._sensor.stopListening(this);
}

StimulusComponent.prototype.fire = function(triggerName, args) {
  this._sensor.fire(triggerName, args);
}

StimulusComponent.prototype.propagate = function(triggerName, data, args) {
  this._sensor.propagate(triggerName, data, args);
}

StimulusComponent.prototype.listenTo = function(triggerName, defaultValue) {
  if (defaultValue !== null && typeof defaultValue !== 'undefined') {
    this.state[triggerName] = defaultValue;
  }
  this._sensor.listenTo(this, triggerName);
}

StimulusComponent.prototype.follow = function(triggerName, defaultValue) {
  if (defaultValue !== null && typeof defaultValue !== 'undefined') {
    this.state[triggerName] = defaultValue;
  }
  this._sensor.follow(this, triggerName);
}

StimulusComponent.prototype.dataReceiver = function(trigger) {
  var newState = {};
  newState[trigger.name] = trigger.data;
  this.setState(newState);
}

StimulusComponent.prototype.shouldReceiveData = function(trigger) {
  return true;
}

module.exports = StimulusComponent;
