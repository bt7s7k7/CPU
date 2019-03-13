// JavaScript source code

/**
 * @param {CPUState} state
 * @param {string} codeText
 */
function compile(state, codeText) {
	var code = codeText.split("")
	/** @type {Array<{value : number, label : string}>} */
	var ast = []
	/** @type {string} */
	var label = null
	var isString = false

	/**
	 * @returns {number}
	 * @param {number} i
	 */
	var findTerminator = (i) => {
		var space = code.indexOf(" ", i)
		var enter = code.indexOf("\n", i)
		if (space == -1) space = Infinity
		if (enter == -1) enter = Infinity
		return Math.min(space, enter)
	}

	for (var i = 0; i < code.length; i++) {
		let c = code[i]
		if (isString) {
			if (c == "\"") {
				isString = false
			} else {
				let code = c.charCodeAt(0)
				if (code > WORD_SIZE) {
					code = 255
				}
				ast.push({ value: code, label })
				label = null
			}
		} else {
			if (c == " " || c == "\n" || c == "\r") {

			} else if (c == "\"") {
				isString = true
			} else {
				let wordEnd = findTerminator(i)
				let word = code.slice(i, wordEnd).join("")
				if (word[0] == ":") {
					if (word[1] == ":") {
						label = word.substr(2)
					} else {
						ast.push({ value: -1, label: word.substr(1) })
					}
				} else {
					if (word.toLowerCase() in INS) {
						let ins = INS[word.toLowerCase()]
						ast.push({ value: ins.code, label: label })
						label = null
					} else {
						ast.push({ value: Math.clamp(parseInt(word).notNaN(), 0, WORD_SIZE), label: label })
						label = null
					}
				}
				i = wordEnd
			}
		}

	}
	/** @type {Object<string, number>} */
	var labels = {}

	ast.forEach((v, i) => {
		if (v.value >= 0 && v.label) {
			labels[v.label] = i + 1
		}
	})

	ast.forEach((v) => {
		if (v.value < 0 && v.label) {
			if (v.label in labels) {
				v.value = labels[v.label]
			} else throw new RangeError("Label '" + v.label + "' is not defined")
		}
	})

	state.memory.fill(0)
	ast.forEach((v, i) => {
		state.memory[i + 1] = v.value
	})
}