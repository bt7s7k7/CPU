

/**
 * @param {CPUState} state
 * @param {HTMLElement} element
 */
function drawCPU(state, element) {
	B.removeChildrenOf(element)

	/**
	 * @param {number[]} color
	 * @param {boolean} enabled
	 * @param {HTMLElement} parent
	 */
	var createIndicator = (color, enabled, parent) => {
		var indicator = document.createElement("div")
		parent.appendChild(indicator)
		indicator.style.backgroundColor = color.mul(enabled ? 1 : 0.25).toHex()
		indicator.classList.add("indicator")
	}

	/**
	 * @param {string} value
	 * @param {HTMLElement} element
	 */
	var createValue = (value, element) => {
		var input = document.createElement("input")
		element.appendChild(input);
		input.type = "number"
		//input.style.width = "100%"
		input.value = value
		input.readOnly = true
	}

	/** @type {Object<string, HTMLDivElement} */
	var largeComponents = {}

	state.components.toArray().forEach(v => {
		/** @type {string[]} */
		var keySplit = v.key.split("_")
		var key = keySplit[0]
		var parent = document.createElement("div")
		var label = componentNames._get(key);
		if (keySplit.length > 1) {
			if (!(key in largeComponents)) {
				largeComponents[key] = document.createElement("div")
				largeComponents[key].classList.add("cparent")
				element.appendChild(largeComponents[key])
			}
			largeComponents[key].appendChild(parent)

			label = keySplit[1] == "h" ? "High" : "Low"
		} else {
			element.appendChild(parent)
			parent.classList.add("cparent")
		}
		var header = document.createElement("div")
		parent.appendChild(header)
		header.classList.add("cheader")
		var name = document.createElement("div")
		header.appendChild(name)
		name.classList.add("cname")
		name.appendChild(document.createTextNode(label))
		if ("in" in v.value) createIndicator(colors.aqua, v.value.in, header)
		if ("out" in v.value) createIndicator(colors.orange, v.value.out, header)
		if ("incr" in v.value) createIndicator(colors.green, v.value.incr, header)
		if ("reset" in v.value) createIndicator([255, 0, 255], v.value.reset, header)
		var content = document.createElement("div")
		parent.appendChild(content)
		content.classList.add("ccontent")
		if ("value" in v.value) createValue(v.value.value, content)
	})

	largeComponents.toArray().forEach(({ key, value }) => {
		var parent = document.createElement("div")
		value.insertBefore(parent, value.firstChild)
		var header = document.createElement("div")
		parent.appendChild(header)
		header.classList.add("cheader")
		var content = document.createElement("div")
		parent.appendChild(content)
		content.classList.add("ccontent")
		var name = document.createElement("div")
		header.appendChild(name)
		name.classList.add("cname")
		name.appendChild(document.createTextNode(componentNames._get(key)))
		var value = state.components[key + "_l"].value + (state.components[key + "_h"].value << 8)
		createValue(value, content)
	})
}


/** @type {Array<{address : HTMLElement, colon : HTMLElement, valueDisp : HTMLInputElement, listener : any, comment : HTMLElement}>} */
var memoryElements = null
/**
 * @param {CPUState} state
 * @param {HTMLElement} element
 */
function drawMemory(state, element) {
	var linesFit = state.memory.length//Math.floor((E.memoryView.getSize()[1]) / 20)
	var beginLine = 0//parseInt(E.memoryScroll.value);
	var endLine = Math.clamp(beginLine + linesFit, 0, state.memory.length)
	var argCountDown = []
	if (memoryElements && linesFit != memoryElements.length) memoryElements = null
	if (memoryElements == null) {
		B.removeChildrenOf(E.memoryView)
		memoryElements = []
		for (var i = beginLine; i < endLine; i++) {
			let entry = {}
			let ii = i
			let value = state.memory[i]
			let parent = document.createElement("div")
			element.appendChild(parent)
			parent.classList.add("mparent")
			let address = document.createElement("span")
			parent.appendChild(address)
			address.classList.add("mtext")
			address.style.color = "blue"
			entry.address = address

			let colon = document.createElement("span")
			parent.appendChild(colon)
			colon.classList.add("mtext")
			colon.style.color = "black"
			colon.appendChild(document.createTextNode(": "))
			entry.colon = colon

			let valueDisp = document.createElement("input")
			parent.appendChild(valueDisp)
			entry.valueDisp = valueDisp

			let comment = document.createElement("span")
			parent.appendChild(comment)
			comment.classList.add("mtext")
			comment.style.color = "green"
			entry.comment = comment


			memoryElements.push(entry);
		}
	}
	var iii = 0;
	for (var i = beginLine; i < endLine; i++) {
		let entry = memoryElements[iii]
		let ii = i
		let value = state.memory[i]

		let address = entry.address
		address.innerText = i.toString(16).fillZeroPrefix(4)
		address.style.background = i == state.getValue("pc") ? "gold" : "white"

		entry.colon.style.backgroundColor = i == state.getValue("address") ? "lightgreen" : "white"

		let valueDisp = entry.valueDisp
		valueDisp.value = value
		if (entry.listener) valueDisp.removeEventListener("change", entry.listener)
		entry.listener = () => {
			var inpValue = value;
            const text = valueDisp.value;
			if (text.toLowerCase() in INS) {
				inpValue = INS[text.toLowerCase()].code
			} else if (text[0] == "'" && text.length == 2) {
				inpValue = text.charCodeAt(1) % WORD_SIZE
			} else {
				inpValue = Math.clamp(parseInt(text).notNaN(), 0, WORD_SIZE)
			}
			state.memory[ii] = inpValue;
			drawMemory(state, element);
		}
		valueDisp.addEventListener("change", entry.listener)

		let text = ""
		if (argCountDown.length > 0) {
			let arg = argCountDown.splice(0, 1)[0];
			text += ";  " + arg
			if (arg.split("_")[1] == "h") {
				let low = state.memory[i - 1]
				text += "; = " + (low + (value << 8)) + " 0x" + (low + (value << 8)).toString(16) + JSON.stringify(String.fromCharCode(value))
			}
		} else {
			if (value in instructionLookup) {
				let instr = instructionLookup[value]
				text += "; " + instr.name.toUpperCase()
				argCountDown = instr.args.copy();
			}
		}
		text += "; 0x" + value.toString(16) + JSON.stringify(String.fromCharCode(value))
		entry.comment.innerText = text

		iii++;
	}
}
