import Stimulus from './stimulus';
import { React } from 'react';

const sensor = Stimulus.instance();

var isSet = function (arg) {
  return arg !== null && typeof arg !== 'undefined'
}

export default class Component extends React.Component {
  constructor () {
    super(...arguments);
    this.state = {};
    this._sensor = sensor;
    this._stimulusId = sensor.getNextId();
    this._sharedStates = [];
  }

  getStimulusId () {
    return this._stimulusId;
  }

  componentWillUnmount () {
    this._sensor.stopListening(this);
    if (this._sharedStates.length) {
      this._sharedStates.forEach(function (stateName) {
        this._sensor.popState(this, stateName);
      }.bind(this));
    }
  }

  componentDidUpdate (prevProps, prevState) {
    this._sharedStates.forEach(function (stateName) {
      if (isSet(this.state[stateName]) && (!isSet(prevState[name]) || this.state[stateName] !== prevState[stateName])) {
        this._sensor.pushState(this, stateName, this.state[stateName]);
      }
    }.bind(this));
  }

  fire () {
    this._sensor.fire(...arguments);
  }

  propagate (triggerName, data, args) {
    this._sensor.propagate(triggerName, data, args);
  }

  listenTo (triggerName, defaultValue) {
    if (isSet(defaultValue)) {
      this.state[triggerName] = defaultValue;
    }
    this._sensor.listenTo(this, triggerName);
  }

  follow (triggerName, defaultValue) {
    if (isSet(defaultValue)) {
      this.state[triggerName] = defaultValue;
    }
    this._sensor.follow(this, triggerName);
  }

  shareState (stateName) {
    this._sharedStates.push(stateName);
  }

  dataReceiver (trigger) {
    var newState = {};
    newState[trigger.name] = trigger.data;
    this.setState(newState);
  }

  shouldReceiveData (trigger) {
    return true;
  }
}
