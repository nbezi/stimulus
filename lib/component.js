const sensor = require('./sensor');
const React = require('react');

var isSet = function(arg) {
  return arg !== null && typeof arg !== 'undefined'
}

var StimulusComponent = function(props, context, updater) {
  this.super(props, context, updater);
  this.state = {};
  this._sensor = sensor;
  this._stimulusId = sensor.getNextId();
  this._sharedStates = [];
}

var parent = new React.Component();
StimulusComponent.prototype = parent;
StimulusComponent.prototype.super = parent.constructor;
StimulusComponent.prototype.constructor = StimulusComponent;

StimulusComponent.prototype.getStimulusId = function() {
  return this._stimulusId;
}

StimulusComponent.prototype.componentWillUnmount = function() {
  this._sensor.stopListening(this);
  if (this._sharedStates.length) {
    this._sharedStates.forEach(function(stateName) {
      this._sensor.popState(this, stateName);
    }.bind(this));
  }
}

StimulusComponent.prototype.componentDidUpdate = function(prevProps, prevState) {
  this._sharedStates.forEach(function(stateName) {
    if (isSet(this.state[stateName]) && (!isSet(prevState[name]) || this.state[stateName] !== prevState[stateName])) {
      this._sensor.pushState(this, stateName, this.state[stateName]);
    }
  }.bind(this));
}

StimulusComponent.prototype.fire = function(triggerName, args) {
  this._sensor.fire(triggerName, args);
}

StimulusComponent.prototype.propagate = function(triggerName, data, args) {
  this._sensor.propagate(triggerName, data, args);
}

StimulusComponent.prototype.listenTo = function(triggerName, defaultValue) {
  if (isSet(defaultValue)) {
    this.state[triggerName] = defaultValue;
  }
  this._sensor.listenTo(this, triggerName);
}

StimulusComponent.prototype.follow = function(triggerName, defaultValue) {
  if (isSet(defaultValue)) {
    this.state[triggerName] = defaultValue;
  }
  this._sensor.follow(this, triggerName);
}

StimulusComponent.prototype.shareState = function(stateName) {
  this._sharedStates.push(stateName);
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
