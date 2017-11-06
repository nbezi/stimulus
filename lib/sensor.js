const Trigger = require('./trigger');

var Stimulus = function() {
  this.triggers = {};
  this.fireReaction = {};
  this.incrementValue = 0;
}

Stimulus.prototype.addTrigger = function(triggerName, reloadFunction) {
  if (this.triggers[triggerName]) {
    console.warn('Stimulus: trigger exists, replacing loader for ' + triggerName);
    this.triggers[triggerName].reloadFunction = reloadFunction;
  } else {
    this.triggers[triggerName] = new Trigger(this, triggerName, reloadFunction);
  }
  return this;
}

Stimulus.prototype._getOrCreateTrigger = function(triggerName) {
  var trigger = this.getTrigger(triggerName);
  if (!trigger) {
    console.warn('Stimulus: registering missing trigger ' + triggerName);
    this.addTrigger(triggerName, function(trigger) { trigger.notifyListeners(trigger.data) });
    trigger = this.triggers[triggerName];
  }
  return trigger;
}

Stimulus.prototype.getTrigger = function(triggerName) {
  return this.triggers[triggerName];
}

Stimulus.prototype.getTriggerData = function(triggerName) {
  return this._getOrCreateTrigger(triggerName).data;
}

Stimulus.prototype.listenTo = function(component, triggerName) {
  this.follow(component, triggerName);
  var trigger = this.triggers[triggerName];
  if (trigger.data !== null && typeof trigger.data !== 'undefined') {
    component.dataReceiver(trigger);
  }
  return this;
}

Stimulus.prototype.follow = function(component, triggerName) {
  var trigger = this._getOrCreateTrigger(triggerName);
  trigger.listeners.push(component);
  return this;
}

Stimulus.prototype.fire = function(triggerName, args) {
  var trigger = this.triggers[triggerName];
  if (!trigger) {
    console.warn('Stimulus: cannot fire missing trigger ' + triggerName);
    return;
  }
  trigger.fire(args);
  return this;
}

Stimulus.prototype.propagate = function(triggerName, data, args) {
  var trigger = this._getOrCreateTrigger(triggerName);
  trigger.propagateData(data, args);
  return this;
}

Stimulus.prototype.pushState = function(component, stateName, value) {
  var trigger = this._getOrCreateTrigger(stateName);
  if (trigger.data === null || typeof trigger.data === 'undefined') {
    trigger.data = {};
  }
  trigger.data[component.getStimulusId() + ''] = value;
  trigger.propagateData(trigger.data);
  return this;
}

Stimulus.prototype.popState = function(component, stateName) {
  var trigger = this._getOrCreateTrigger(stateName);
  if (trigger.data === null || typeof trigger.data === 'undefined') {
    trigger.data = {};
  }
  delete trigger.data[component.getStimulusId() + ''];
  trigger.propagateData(trigger.data);
  return this;
}

Stimulus.prototype.fireAfter = function(when, fire) {
  if (!this.fireReaction[when])
    this.fireReaction[when] = [];
  if (typeof fire == 'string')
    this.fireReaction[when].push(fire);
  if (typeof fire == 'array')
    this.fireReaction[when] = this.fireReaction[when].concat(fire);
  return this;
}

Stimulus.prototype.triggerFinished = function(trigger) {
  var reactions = this.fireReaction[trigger.name];
  if (reactions) {
    var stack = trigger.stack.slice();
    stack.push(trigger.name);
    reactions.forEach(function(reaction) {
      console.info('Stimulus: reaction burning ' + reaction + ' ignited by ' + trigger.name);
      reaction = this.triggers[reaction];
      if (stack.indexOf(reaction.name) != -1) {
        console.warn('Stimulus: reaction loop detected trying to call ' + reaction.name + ' present in stack ' + JSON.stringify(stack));
        return;
      }
      var args = trigger.args;
      args[trigger.name] = trigger.data;
      reaction.fire(args, stack);
    }.bind(this));
  }
}

Stimulus.prototype.stopListening = function(component) {
  Object.keys(this.triggers).forEach(function(triggerName) {
    var trigger = this.triggers[triggerName];
    trigger.listeners.find(function(listener, idx) {
      if (listener._stimulusId == component._stimulusId) {
        trigger.listeners.splice(idx, 1);
        return true;
      }
    }.bind(this))
  }.bind(this));
}

Stimulus.prototype.getNextId = function() {
  return this.incrementValue++;
}

Stimulus.prototype.toString = function() {
  return Object.keys(this.triggers).map(function(name) { return this.triggers[name].toString() }.bind(this)).join("\n");
}

module.exports = new Stimulus();
