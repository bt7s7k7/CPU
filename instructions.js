/** 
 *  @typedef {{code : number, args : string[], name : string}} InstructionDef
 *  @type {Object<string, InstructionDef>}
 *  */
var INS = {
	nop: {
		code: 0,
		args: []
	},
	jmp: {
		code: 1,
		args: ["#target"]
	}
}
