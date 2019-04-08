/** 
 *  @typedef {{code : number, args : string[], name : string}} InstructionDef
 *  */
var INS = {
	nop: { code: 0, args: [] },                        // Does nothing
	jmp: { code: 1, args: ["$target"] },               // Jumps to $target
	hlt: { code: 2 },                                  // Stop clock
											           
	cout: { code: 3, args: ["#value"] },               // Outputs #value
	aout: { code: 4 },                                 // Outputs A
	inp: { code: 32 },                                 // Inputs A
	iot: { code: 38, args: ["#target"] },              // Changes I/O target to #target
											           
	atb: { code: 5 },						           // \ 
	bta: { code: 6 },						           //  |
	atx: { code: 7 },						           //  |
	aty: { code: 8 },						           //  |
	xta: { code: 9 },						           //  |
	yta: { code: 10 },						           //   > Move [] to []
	btx: { code: 11 },						           //  |
	bty: { code: 12 },						           //  |
	xtb: { code: 13 },						           //  |
	ytb: { code: 14 },						           //  |
	xty: { code: 15 },						           //  |
	ytx: { code: 16 },						           // /
											           
	loa: { code: 17, args: ["#value"] },               // Sets A to #value
	lob: { code: 18, args: ["#value"] },	           // Sets B to #value
	lox: { code: 19, args: ["#value"] },	           // Sets X to #value
	loy: { code: 20, args: ["#value"] },	           // Sets Y to #value
	rsb: { code: 23 },						           // Sets B to 0
											           
	sum: { code: 21 },						           // A = A + B
	sub: { code: 36 },						           // A = A - B
	add: { code: 22, args: ["#value"] },	           // A += #value
	rem: { code: 37, args: ["#value"] },	           // A -= #value
											           
	jpz: { code: 24, args: ["$target"] },	           // Jumps to $target if zero
	jnz: { code: 25, args: ["$target"] },	           // Jumps to $target if not zero
	jpc: { code: 26, args: ["$target"] },	           // Jumps to $target if carry
	jnc: { code: 27, args: ["$target"] },	           // Jumps to $target if not carry
	jpa: { code: 33 },						           // Jumps to A
											           
	rrd: { code: 28, args: ["$address"] },             // A = *$address
	wrt: { code: 29, args: ["$address"] },             // *$address = A
	ldd: { code: 30 },						           // A = *B
	set: { code: 31 },						           // A = *B
	cnst: { code: 34, args: ["#value", "$address"] },  // *$addresss = #value
	mov: { code: 35, args: ["$source", "$target"] },   // *$target = *$source

}


/** @type {Object<string, InstructionDef>} */
var instructionLookup = {}
{
	INS.toArray().forEach((v, i) => {
		v.value.name = v.key
		if (!("args" in v.value)) v.value.args = []
		if (instructionLookup[v.value.code]) throw new RangeError("Instruction " + v.value.name + " has a duplicate code")
		instructionLookup[v.value.code] = v.value
	})
}

/**
 * @param {string} object
 * @param {number} value
 * @returns {(state : CPUState)=>boolean}
 */
function valueCriteria(object, value) {
	if (typeof value != "number") throw new TypeError("Value must be a number")
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
	},
	{
		criteria: [valueCriteria("instruction", INS.aout.code)],
		ticks: [
			[
				["a", "out"],
				["io", "in"]
			],
			...resetTick
		]
	},
	{ criteria: [valueCriteria("instruction", INS.atb.code)], ticks: [[["a", "out"], ["b", "in"]], ...resetTick] },
	{ criteria: [valueCriteria("instruction", INS.bta.code)], ticks: [[["b", "out"], ["a", "in"]], ...resetTick] },
	{ criteria: [valueCriteria("instruction", INS.atx.code)], ticks: [[["a", "out"], ["x", "in"]], ...resetTick] },
	{ criteria: [valueCriteria("instruction", INS.xta.code)], ticks: [[["x", "out"], ["a", "in"]], ...resetTick] },
	{ criteria: [valueCriteria("instruction", INS.aty.code)], ticks: [[["a", "out"], ["y", "in"]], ...resetTick] },
	{ criteria: [valueCriteria("instruction", INS.yta.code)], ticks: [[["y", "out"], ["a", "in"]], ...resetTick] },
	{ criteria: [valueCriteria("instruction", INS.btx.code)], ticks: [[["b", "out"], ["x", "in"]], ...resetTick] },
	{ criteria: [valueCriteria("instruction", INS.xtb.code)], ticks: [[["x", "out"], ["b", "in"]], ...resetTick] },
	{ criteria: [valueCriteria("instruction", INS.bty.code)], ticks: [[["b", "out"], ["y", "in"]], ...resetTick] },
	{ criteria: [valueCriteria("instruction", INS.ytb.code)], ticks: [[["y", "out"], ["b", "in"]], ...resetTick] },
	{ criteria: [valueCriteria("instruction", INS.xty.code)], ticks: [[["x", "out"], ["y", "in"]], ...resetTick] },
	{ criteria: [valueCriteria("instruction", INS.ytx.code)], ticks: [[["y", "out"], ["x", "in"]], ...resetTick] },
	{ criteria: [valueCriteria("instruction", INS.rsb.code)], ticks: [[["b", "in"]], ...resetTick] },
	{
		criteria: [valueCriteria("instruction", INS.loa.code)],
		ticks: [
			...nextValue,
			[
				["memory", "out"],
				["a", "in"]
			],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.lob.code)],
		ticks: [
			...nextValue,
			[
				["memory", "out"],
				["b", "in"]
			],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.lox.code)],
		ticks: [
			...nextValue,
			[
				["memory", "out"],
				["x", "in"]
			],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.loy.code)],
		ticks: [
			...nextValue,
			[
				["memory", "out"],
				["y", "in"]
			],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.sum.code)],
		ticks: [
			[["sum", "out"], ["a", "in"]],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.add.code)],
		ticks: [
			...nextValue,
			[
				["memory", "out"],
				["b", "in"]
			],
			[["sum", "out"], ["a", "in"]],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.jpz.code), (state) => state.fZero],
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
	{ // 25
		criteria: [valueCriteria("instruction", INS.jnz.code), (state) => !state.fZero],
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
	{ // 26
		criteria: [valueCriteria("instruction", INS.jpc.code), (state) => state.fCarry],
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
		criteria: [valueCriteria("instruction", INS.jnc.code), (state) => !state.fCarry],
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
		criteria: [valueCriteria("instruction", INS.jpz.code), (state) => !state.fZero],
		ticks: [
			...nextValue,
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.jnz.code), (state) => state.fZero],
		ticks: [
			...nextValue,
			...resetTick
		]
	},
	{ // 30
		criteria: [valueCriteria("instruction", INS.jpc.code), (state) => !state.fCarry],
		ticks: [
			...nextValue,
			...resetTick
		]
	},
	{ // 31
		criteria: [valueCriteria("instruction", INS.jnc.code), (state) => state.fCarry],
		ticks: [
			...nextValue,
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.rrd.code)],
		ticks: [
			...nextValue,
			[
				["memory", "out"],
				["address", "in"]
			],
			[["memory", "out"], ["a", "in"]],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.wrt.code)],
		ticks: [
			...nextValue,
			[
				["memory", "out"],
				["address", "in"]
			],
			[["memory", "in"], ["a", "out"]],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.ldd.code)],
		ticks: [
			[
				["b", "out"],
				["address", "in"]
			],
			[["memory", "out"], ["a", "in"]],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.set.code)],
		ticks: [
			[
				["b", "out"],
				["address", "in"]
			],
			[["memory", "in"], ["a", "out"]],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.inp.code)],
		ticks: [
			[
				["a", "in"],
				["io", "out"]
			],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.jpa.code)],
		ticks: [
			[
				["a", "out"],
				["pc", "in"]
			],
			[["pc", "out"], ["address", "in"]],
			[["memory", "out"], ["instruction", "in"], ["tick", "reset"]]
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.cnst.code)],
		ticks: [
			...nextValue,
			[
				["memory", "out"],
				["a", "in"]
			],
			...nextValue,
			[
				["memory", "out"],
				["address", "in"]
			],
			[["memory", "in"], ["a", "out"]],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.mov.code)],
		ticks: [
			...nextValue,
			[["memory", "out"], ["address", "in"]],
			[["memory", "out"], ["a", "in"]],
			...nextValue,
			[["memory", "out"], ["address", "in"]],
			[["memory", "in"], ["a", "out"]],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.sub.code)],
		ticks: [
			[["sub", "out"], ["a", "in"]],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.rem.code)],
		ticks: [
			...nextValue,
			[
				["memory", "out"],
				["b", "in"]
			],
			[["sub", "out"], ["a", "in"]],
			...resetTick
		]
	},
	{
		criteria: [valueCriteria("instruction", INS.iot.code)],
		ticks: [
			...nextValue,
			[
				["memory", "out"],
				["ioTarget", "in"]
			],
			...resetTick
		]
	}
]