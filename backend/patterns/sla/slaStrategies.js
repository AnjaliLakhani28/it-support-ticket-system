// Strategy selector: maps a priority string to the matching SlaPolicy object.
// The controller never needs to know which concrete class it is using -
// new priorities can be added here without changing controller code
// (Open/Closed principle).
const { LowSla, MediumSla, HighSla, CriticalSla } = require('./SlaPolicy');

const strategies = {
  Low: new LowSla(),
  Medium: new MediumSla(),
  High: new HighSla(),
  Critical: new CriticalSla(),
};

const PRIORITIES = Object.keys(strategies);

function getSlaPolicy(priority) {
  const policy = strategies[priority];
  if (!policy) {
    throw new Error(`Invalid priority "${priority}". Allowed: ${PRIORITIES.join(', ')}`);
  }
  return policy;
}

module.exports = { getSlaPolicy, PRIORITIES };
