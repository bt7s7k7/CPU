/**
 *  @typedef {{in : boolean, out : boolean, reset : boolean, incr : boolean, value : number}} Component
 *  @returns {Object<string, Component>} 
 * */
function makeComponents() {
	return {
		instruction: {
			in: false,
			out: false,
			value: 0
		},
		tick: {
			value: 0,
			reset: false,
			incr: false
		},
		pc_l: {
			value: 0,
			in: false,
			incr: false,
			out: false
		},
		pc_h: {
			value: 0,
			in: false,
			incr: false,
			out: false
		},
		address_l: {
			value: 0,
			in: false
		},
		address_h: {
			value: 0,
			in: false
		},
		memory_l: {
			value: 0,
			in: false,
			out: false
		},
		memory_h: {
			value: 0,
			in: false,
			out: false
		}
	}
}

class CPUState {
	constructor() {
		this.components = makeComponents()
		this.memory = new Uint8Array(1 << 16);
		this.bus = 0
	}

	/**
	 * @param {string} name
	 */
	getValue(name) {
		if (name in this.components) {
			return this.components[name].value
		} else {
			if (name + "_l" in this.components) {
				return this.components[name + "_l"].value + (this.components[name + "_h"].value << 8)
			}
		}
	}

	tick() {
		var tick = this.getValue("tick")
		this.bus = 0
		this.components.toArray().forEach(v => {
			v.value.toArray().forEach(w => {
				if (typeof (w.value) == "boolean") {
					v.value[w.key] = false;
				}
			})
		})
		controller.forEach(v => {
			var match = true
			for (let i = 0; i < v.criteria.length; i++) {
				if (!v.criteria[i](this)) {
					match = false
					break;
				}
			}
			if (match) {
				if (v.ticks.length > tick) {
					v.ticks[tick].forEach(v => this.signal(v[0], v[1]))
				}
			}
		})
		this.signal("tick", "incr")

		this.components.toArray().forEach(v => {
			if (v.value.incr) {
				getComponentFunction(v.key, "incr", this)(this, v.value)
			}
			if (v.value.out) {
				getComponentFunction(v.key, "out", this)(this, v.value)
			}
		})
		this.components.toArray().forEach(v => {
			if (v.value.in) {
				getComponentFunction(v.key, "in", this)(this, v.value)
			}
		})
		this.components.toArray().forEach(v => {
			if (v.value.reset) {
				getComponentFunction(v.key, "reset", this)(this, v.value)
			}
		})

		this.components.memory_h.value = state.memory[(state.getValue("address") + 1) % (1 << 16)]
		this.components.memory_l.value = state.memory[state.getValue("address")]
	}

	/**
	 * @param {string} component
	 * @param {string} signal
	 */
	signal(component, signal) {
		if (component in this.components || component + "_l" in this.components) {
			var set = (ref) => {
				if (signal in ref) {
					ref[signal] = true;
				} else {
					throw new RangeError("Component named '" + component + "' does not have a signal '" + signal + "'")
				}
			}
			if (component in this.components) {
				set(this.components[component])
			} else {
				set(this.components[component + "_l"])
				set(this.components[component + "_h"])
			}

		} else {
			throw new RangeError("Component named '" + component + "' is not in the CPU")
		}
	}
}

var componentNames = {
	/**
	 * @returns {string}
	 * @param {string} name
	 */
	_get(name) {
		if (name in this) {
			return this[name]
		} else {
			return name;
		}
	},
	instruction: "Instruction",
	tick: "Tick Counter",
	pc: "Program Counter",
	address: "Address",
	memory: "Memory"
}

/** @type {Object<string, (state : CPUState, component : Component)=>void>} */
var componentFunctions = {
	pc_l_incr: (state, component) => {
		component.value++
		if (component.value > 255) {
			component.value = 0
			var ref = state.components["pc_h"]
			ref.value++
			if (ref.value > 255) {
				ref.value = 0
			}
		}
	},
	pc_h_incr: () => { },
	memory_l_in: (state, component) => {
		state.memory[state.getValue("address")] = state.bus
		component.value = state.bus
	},
	memory_l_in: (state, component) => {
		state.memory[(state.getValue("address") + 1) % (1 << 16)] = state.bus
		component.value = state.bus
	}
}

/**
 * @param {string} name
 * @param {string} sign
 * @param {CPUState} state
 * @returns {(state : CPUState, component : Component)=>void}
 */
function getComponentFunction(name, sign, state) {
	if (name + "_" + sign in componentFunctions) {
		return componentFunctions[name + "_" + sign]
	} else {
		if (sign == "out") {
			return (state, component) => {
				state.bus |= component.value
			}
		}
		if (sign == "in") {
			return (state, component) => {
				component.value = state.bus
			}
		}
		if (sign == "reset") {
			return (state, component) => {
				component.value = 0
			}
		}
		if (sign == "incr") {
			return (state, component) => {
				component.value++
				if (component.value > 255) component.value = 0
			}
		}
	}
}