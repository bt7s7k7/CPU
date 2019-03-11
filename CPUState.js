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
			in: false,
			reset: false,
			incr: false
		},
		pc_l: {
			value: 0,
			in: false,
			incr: false,
			reset: false
		},
		pc_h: {
			value: 0,
			in: false,
			incr: false,
			reset: false
		},
		address_l: {
			value: 0,
			in: false
		},
		address_h: {
			value: 0,
			in: false
		},
	}
}

class CPUState {
	constructor() {
		this.components = makeComponents()
		this.memory = new Uint8Array(1 << 16);
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
	address: "Address"
}