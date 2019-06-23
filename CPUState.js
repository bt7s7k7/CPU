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
		pc: {
			value: 0,
			in: false,
			incr: false,
			out: false
		},
		address: {
			value: 0,
			in: false
		},
		memory: {
			value: 0,
			in: false,
			out: false
		},
		io: {
			value: 0,
			in: false,
			out: false
		},
		ioTarget: {
			value: 0,
			in: false
		},
		a: {
			value: 0,
			in: false,
			out: false
		},
		b: {
			value: 0,
			in: false,
			out: false
		},
		x: {
			value: 0,
			in: false,
			out: false
		},
		y: {
			value: 0,
			in: false,
			out: false
		},
		stackPtr: {
			value: 0,
			in: false,
			out: false
		},
		sum: {
			value: 0,
			out: false
		},
		sub: {
			value: 0,
			out: false
		}
	}
}

class CPUState {
	constructor() {
		this.components = makeComponents()
		this.memory = new Uint8Array(WORD_SIZE);
		this.bus = 0
		this.period = 100
		this.clockActive = false
		this.countdown = 0
		/** @type {Object<number, {in: ()=>number, out: (number)=>void}>} */
		this.io = {}
		this.fCarry = false
		this.fZero = false
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
		controller.forEach((v, ii) => {
			var match = true
			for (let i = 0; i < v.criteria.length; i++) {
				if (!v.criteria[i](this)) {
					match = false
					break;
				}
			}
			if (match) {
				if (v.ticks.length > tick) {
					//console.log("Executing " + ii, v, " tick:", tick, v.ticks[tick])
					v.ticks[tick].forEach(v => {
						this.signal(v[0], v[1])
					})
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

		} else if (component == "_") {
			if (signal == "halt") {
				this.clockActive = false
			} else this.bus |= signal
		} else {
			throw new RangeError("Component named '" + component + "' is not in the CPU")
		}
	}

	/**
	 * @param {number} deltaT
	 */
	clock(deltaT) {
		if (this.countdown > this.period) this.countdown = this.period
		if (!this.clockActive) return false
		this.countdown -= deltaT
		if (this.countdown < 0) {
			while (this.countdown < 0) {
				this.countdown += this.period
				this.tick()
				if (!this.clockActive) break
			}
			return true
		}
		return false
	}

	reset() {
		this.components.toArray().forEach(v => {
			if ("value" in v.value) {
				v.value.value = 0
			}
		})

		this.fCarry = this.fZero = false
	}

	/**
	 * @returns {number}
	 * */
	_ioIn() {
		if (!(this.getValue("ioTarget") in this.io)) return 0
		return Math.clamp((this.io[this.getValue("ioTarget")].in || (() => 0))(), 0, WORD_SIZE).notNaN()
	}

	/**
	 * @param {number} number
	 */
	_ioOut(number) {
		if (!(this.getValue("ioTarget") in this.io)) return
		(this.io[this.getValue("ioTarget")].out || (() => 0))(number)
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
	memory: "Memory",
	io: "I/O",
	a: "A Register",
	b: "B Register",
	x: "X Register",
	y: "Y Register",
	sum: "Adder",
	sub: "Substractor",
	ioTarget: "I/O Target",
	stackPtr: "Stack Pointer",
}

/** @type {Object<string, (state : CPUState, component : Component)=>void>} */
var componentFunctions = {
	memory_in: (state, component) => {
		state.memory[state.getValue("address")] = state.bus
		component.value = state.bus
	},
	memory_out: (state, component) => {
		component.value = state.memory[state.getValue("address")]
		state.bus |= component.value
	},
	io_out: (state, component) => {
		component.value = Math.clamp(state._ioIn(), 0, WORD_SIZE)
		state.bus |= component.value
	},
	io_in: (state, component) => {
		component.value = state.bus
		state._ioOut(component.value)
	},
	sum_out: (state, component) => {
		var value = state.getValue("a") + state.getValue("b")
		if (value >= WORD_SIZE) {
			value %= WORD_SIZE;
			state.fCarry = true
		} else state.fCarry = false;
		state.fZero = value == 0
		state.bus |= component.value = value
	},
	sub_out: (state, component) => {
		var value = state.getValue("a") - state.getValue("b")
		if (value < 0) {
			value = WORD_SIZE + value;
			state.fCarry = true
		} else state.fCarry = false;
		state.fZero = value == 0
		state.bus |= component.value = value
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
				if (component.value >= WORD_SIZE) component.value = 0
			}
		}
	}
}