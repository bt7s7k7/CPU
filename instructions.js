/** 
 *  @typedef {{code : number, args : string[], name : string}} InstructionDef
 *  */
var INS = {
	nop: {
		code: 0,
		args: []
	},
	jmp: {
		code: 1,
		args: ["#target"]
	},
	hlt: {
		code: 2
	},
	cout: {
		code: 3,
		args: ["#value"]
	},
	aout: {
		code: 4
	}
}


/** @type {Object<string, InstructionDef>} */
var instructionLookup = {}

INS.toArray().forEach((v) => {
	v.value.name = v.key
	if (!("args" in v.value)) v.value.args = []
	instructionLookup[v.value.code] = v.value
})

/**
 * @param {string} object
 * @param {number} value
 * @returns {(state : CPUState)=>boolean}
 */
function valueCriteria(object, value) {
	return (state) => {
		return state.getValue(object) == value;
	}
}

var nextValue = [
	[["pc", "incr"]],
	[["pc", "out"], ["address", "in"]]
]
var resetTick = [
	...nextValue,
	[["memory", "out"], ["instruction", "in"], ["tick", "reset"]]
]
/** @type {Array<{criteria : Array<(state : CPUState)=>boolean>, ticks: [string,string][][]}>} */
var controller = [
	{
		criteria: [valueCriteria("instruction", INS.nop.code)],
		ticks: [
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.jmp.code)],
		ticks: [
			...nextValue,
			[
				["memory", "out"],
				["pc", "in"]
			],
			[["pc", "out"], ["address", "in"]],
			[["memory", "out"], ["instruction", "in"], ["tick", "reset"]]
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.hlt.code)],
		ticks: [
			[["_", "halt"]],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.cout.code)],
		ticks: [
			...nextValue,
			[
				["memory", "out"],
				["io", "in"]
			],
			...resetTick
		]
	}
]