import Trigger from './trigger';

export default class Stimulus {
  constructor () {
    this.triggers = {};
    this.fireReaction = {};
    this.incrementValue = 0;
  }

  instance () {
    if (!self.instance) {
      self.instance = new Stimulus();
    }
    return self.instance;
  }

  addTrigger (triggerName, reloadFunction) {
    if (this.triggers[triggerName]) {
      console.warn('Stimulus: trigger exists, replacing loader for ' + triggerName);
      this.triggers[triggerName].reloadFunction = reloadFunction;
    } else {
      this.triggers[triggerName] = new Trigger(this, triggerName, reloadFunction);
    }
    return this;
  }

  _getOrCreateTrigger (triggerName) {
    var trigger = this.getTrigger(triggerName);
    if (!trigger) {
      console.warn('Stimulus: registering missing trigger ' + triggerName);
      this.addTrigger(triggerName, function (trigger) { trigger.notifyListeners(trigger.data); });
      trigger = this.triggers[triggerName];
    }
    return trigger;
  }

  getTrigger (triggerName) {
    return this.triggers[triggerName];
  }

  getTriggerData (triggerName) {
    return this._getOrCreateTrigger(triggerName).data;
  }

  listenTo (component, triggerName) {
    this.follow(component, triggerName);
    var trigger = this.triggers[triggerName];
    if (trigger.data !== null && typeof trigger.data !== 'undefined') {
      component.dataReceiver(trigger);
    }
    return this;
  }

  follow (component, triggerName) {
    var trigger = this._getOrCreateTrigger(triggerName);
    trigger.listeners.push(component);
    return this;
  }

  fire (triggerName, args) {
    var trigger = this.triggers[triggerName];
    if (!trigger) {
      console.warn('Stimulus: cannot fire missing trigger ' + triggerName);
      return;
    }
    trigger.fire(args);
    return this;
  }

  propagate (triggerName, data, args) {
    var trigger = this._getOrCreateTrigger(triggerName);
    trigger.propagateData(data, args);
    return this;
  }

  pushState (component, stateName, value) {
    var trigger = this._getOrCreateTrigger(stateName);
    if (trigger.data === null || typeof trigger.data === 'undefined') {
      trigger.data = {};
    }
    trigger.data[component.getStimulusId() + ''] = value;
    trigger.propagateData(trigger.data);
    return this;
  }

  popState (component, stateName) {
    var trigger = this._getOrCreateTrigger(stateName);
    if (trigger.data === null || typeof trigger.data === 'undefined') {
      trigger.data = {};
    }
    delete trigger.data[component.getStimulusId() + ''];
    trigger.propagateData(trigger.data);
    return this;
  }

  fireAfter (when, fire) {
    if (!this.fireReaction[when]) { this.fireReaction[when] = []; }
    if (typeof fire === 'string') { this.fireReaction[when].push(fire); }
    if (Array.isArray(fire)) { this.fireReaction[when] = this.fireReaction[when].concat(fire); }
    return this;
  }

  triggerFinished (trigger) {
    var reactions = this.fireReaction[trigger.name];
    if (reactions) {
      var stack = trigger.stack.slice();
      stack.push(trigger.name);
      reactions.forEach(function (reaction) {
        console.info('Stimulus: reaction burning ' + reaction + ' ignited by ' + trigger.name);
        reaction = this.triggers[reaction];
        if (stack.indexOf(reaction.name) !== -1) {
          console.warn('Stimulus: reaction loop detected trying to call ' + reaction.name + ' present in stack ' + JSON.stringify(stack));
          return;
        }
        var args = trigger.args;
        args[trigger.name] = trigger.data;
        reaction.fire(args, stack);
      }.bind(this));
    }
  }

  stopListening (component) {
    Object.keys(this.triggers).forEach(function (triggerName) {
      var trigger = this.triggers[triggerName];
      trigger.listeners.find(function (listener, idx) {
        if (listener._stimulusId === component._stimulusId) {
          trigger.listeners.splice(idx, 1);
          return true;
        }
      });
    }.bind(this));
  }

  getNextId () {
    return this.incrementValue++;
  }

  toString () {
    return Object.keys(this.triggers).map(function (name) { return this.triggers[name].toString(); }.bind(this)).join('\n');
  }
}
