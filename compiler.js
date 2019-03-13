// JavaScript source code

/**
 * @param {CPUState} state
 * @param {string} codeText
 * @typedef {{values : Object<number, {name : string, size : number}>, points : Object<number, string>, codeEnd : number}} DebugDatabase
 * @returns {DebugDatabase}
 */
function compile(state, codeText) {
	var code = codeText.split("")
	/** @type {Array<{value : number, label : string, start : number}>} */
	var ast = []
	/** @type {string} */
	var label = null
	var isString = false
	/** @type {Array<{name : string, chars : number[]}>} */
	var strings = []
	/** @type {{name : string, chars : number[]}} */
	var currString = null
	/** @type {Object<string, {name: string}>} */
	var variables = {}
	/** @type {DebugDatabase} */
	var ret = { points: {}, values: {}}

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
				currString.chars.push(0)
				isString = false
			} else {
				if (c == "\\") {
					i++
					let h = code[i]
					i++
					let l = code[i]
					let char = (parseInt(h, 16).notNaN() << 4) + parseInt(l, 16).notNaN()
					currString.chars.push(char)
				} else {
					let code = c.charCodeAt(0)
					if (code > WORD_SIZE) {
						code = 255
					}
					currString.chars.push(code)
				}
			}
		} else {
			if (c == " " || c == "\n" || c == "\r") {
			} else if (c == "\"") {
				isString = true
				currString = { name: "s" + strings.length, chars: [] }
				strings.push(currString)
				ast.push({ value: -1, label: currString.name, start: i })
			} else if (c == "/") {
				let oldI = i
				i = code.indexOf("/", i + 1)
				if (i == -1) i = code.length
			} else {
				let wordEnd = findTerminator(i)
				let word = code.slice(i, wordEnd).join("")
				if (word[0] == ":") {
					if (word[1] == ":") {
						label = word.substr(1)
					} else {
						ast.push({ value: -1, label: word, start: i })
					}
				} else if (word[0] == "'" && word.length == 2) {
					let char = word.charCodeAt(1)
					if (char > WORD_SIZE) {
						char = 255
					}
					ast.push({ value: char, label: label, start: i })
				} else if (word[0] == "$") {
					let [variableName, size] = word.split("[")
					if (!size) size = "1"
					let variable = variables[variableName]
					if (!variable) {
						variable = { name: variableName, chars: Array(Math.clamp(parseInt(size).notNaN(), 0, WORD_SIZE).valueOf()).fill(0) }
						variables[variableName] = variable
						strings.push(variable)
					}
					ast.push({value: -1, label: variable.name, start: i})
				} else {
					if (word.toLowerCase() in INS) {
						let ins = INS[word.toLowerCase()]
						ast.push({ value: ins.code, label: label, start: i })
						label = null
					} else {
						var number = parseInt(word)
						if (isNaN(number)) {
						} else ast.push({ value: Math.clamp(number.notNaN(), 0, WORD_SIZE), label: label, start: i })
						label = null
					}
				}
				i = wordEnd - 1
			}
		}

	}
	/** @type {Object<string, number>} */
	var labels = {}

	ret.codeEnd = ast.length + 1

	strings.forEach(v => {
		var label = v.name
		v.chars.forEach(v => {
			ast.push({ value: v, label: label, start: 0 })
			label = null
		})
	})

	ast.forEach((v, i) => {
		if (v.value >= 0 && v.label) {
			labels[v.label] = i + 1
		}
	})

	ast.forEach((v) => {
		if (v.value < 0 && v.label) {
			if (v.label in labels) {
				v.value = labels[v.label]
			} else {

			}
		}
	})

	state.memory.fill(0)
	ast.forEach((v, i) => {
		state.memory[i + 1] = v.value
	})

	labels.toArray().forEach(v => {
		ret.points[v.value] = v.key
	})
	strings.forEach(v => {
		ret.values[labels[v.name]] = {name: v.name, size: v.chars.length}
	})

	return ret
}