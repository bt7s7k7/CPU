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
		args: ["#target_l", "#target_h"]
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
	[["pc_l", "out"], ["address_l", "in"]],
	[["pc_h", "out"], ["address_h", "in"]]
]
var resetTick = [
	...nextValue,
	[["memory_l", "out"], ["instruction", "in"], ["tick", "reset"]]
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
				["memory_l", "out"],
				["pc_l", "in"]
			],
			[
				["memory_h", "out"],
				["pc_h", "in"]
			],
			[["pc_l", "out"], ["address_l", "in"]],
			[["pc_h", "out"], ["address_h", "in"]],
			[["memory_l", "out"], ["instruction", "in"], ["tick", "reset"]]
		]
	}
]