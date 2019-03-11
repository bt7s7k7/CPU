/*
 * bUtils
 * Copyright (C) 2018 Branislav Trstenský
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation version 3.
 */

console.group("Init")
var hadScriptError = false
Object.assign(B, {
	get hadScriptError() {
		return hadScriptError
	},
	set hadScriptError(value) {
		return hadScriptError = value
	}
})

B.keys = {}
B.keysPress = {}
B.mouseDown = [false, false, false, false, false]
B.mousePos = [0, 0]
B.mouseDelta = [0, 0]
B.pathTo = document.currentScript.src.split("/").slice(0, -1).join("/")
B.src = document.currentScript.src
B.isHTML = true

B.lStorage = {}
B.sincE = []
B.sincECheck = []
B.l = {}
if (!(window.location.pathname + ":bData" in localStorage)) {
	B.lStorage = { sinc: {}, data: {} }
} else {
	try {
		B.lStorage = JSON.parse(localStorage[window.location.pathname + ":bData"])
	} catch (err) {
		B.lStorage = { sinc: {}, data: {} }
	}
}
B.l = B.lStorage.data

/** @type {Object<string, string>} */
B.get = {}
if (!location.search.substring(1) == "") {
	var serch = location.search.substring(1).split("&")
	for (i = 0; i < serch.length; i++) {
		var explo = serch[i].split("=")
		B.get[decodeURIComponent(explo[0])] = decodeURIComponent(explo[1])
	}
}

B.tick = 0
B.globalValues = {}
B.onGlobalValuesChange = () => { }
B.updateInterval = true
B.elemOnUpdate = []
B.fps = 0
B.renderTime = 0
/** @type {Object<string, HTMLElement>} */
B.E = {};
var E = B.E

window.addEventListener("load", function () { //@@@load
	document.body.addEventListener("keydown", event => {
		if (B.modalWindow) return
		B.keys[event.key] = true
		B.keysPress[event.key] = true
	})
	document.body.addEventListener("keyup", event => {
		B.keys[event.key] = false
	})
	document.body.addEventListener("mousedown", event => {
		B.mouseDown[event.button] = true
	})
	document.body.addEventListener("mouseup", event => {
		B.mouseDown[event.button] = false
	})
	document.body.addEventListener("mousemove", event => {
		var pos = [event.clientX, event.clientY]
		B.mouseDelta = pos.add(B.mousePos.mul(-1))
		B.mousePos = pos
	})

	document.querySelectorAll("[globalValue]").forEach((v) => {
		if (v.nodeName == "INPUT") {
			let eventFunc = (e) => {
				choice(v.type,
					"text", () => {
						B.globalValues[v.getAttribute("globalValue")] = v.value
					},
					"color", () => {
						B.globalValues[v.getAttribute("globalValue")] = colors.fromHex(v.value)
					},
					"number", () => {
						B.globalValues[v.getAttribute("globalValue")] = parseFloat(v.value)
					},
					"checkbox", () => {
						B.globalValues[v.getAttribute("globalValue")] = v.checked
					},
					() => {
						B.globalValues[v.getAttribute("globalValue")] = v.value
					}
				)
				B.onGlobalValuesChange()
			}
			v.addEventListener("change", eventFunc)
			eventFunc()
		} else if (v.nodeName = "BUTTON") {
			B.globalValues[v.getAttribute("globalValue")] = !v.hasAttribute("checked")
			B.globalValues[v.getAttribute("globalValue")] = !v.hasAttribute("checked")
			let eventFunc = () => {
				B.globalValues[v.getAttribute("globalValue")] ^= 1
				v.style.backgroundColor = B.globalValues[v.getAttribute("globalValue")] ? "#99ff99" : "#ff9999"
				B.onGlobalValuesChange()
			}
			v.addEventListener("click", eventFunc)
			eventFunc()
		}
	})

	var updateFunc = (auto) => {//@@@update
		if (!hadScriptError) {
			requestAnimationFrame(updateFunc)
		}
		var end = 0.0
		var err
		var start = performance.now()
		if (window.update && (B.updateInterval || auto)) {
			try {
				update()
			} catch (err_) {
				err = err_
			}
		}
		end = performance.now()
		B.renderTime = end - start
		B.tick += 1
		B.tick = B.tick % Number.MAX_SAFE_INTEGER
		B.fps = 1000 / B.renderTime
		B.elemOnUpdate.forEach(v => {
			var func = new Function(v.getAttribute("onupdate"))
			try {
				func.apply(v, [])
			} catch (err) {
				console.error(err.stack)
			}

		})
		if (err) {
			hadScriptError = true
			throw err
		}

		B.keysPress.forEach((v, i, a) => {
			a[i] = false
		})

		return B.renderTime
	}

	B.updateOnce = () => {
		return updateFunc(true)
	}
	B.module.refresh()
	B.module.list.forEach((v) => {
		if (v.dependComplete < v.depend.length) {
			console.group("")
			console.error(((B.isWorker) ? "<W>" : "") + "[BModule] Module '" + v.name + "' is missing its required modules")
			hadScriptError = true
			v.depend.forEach((d) => {
				if (d instanceof Array) {
					console.error("  " + d[0] + " v" + d[1])
				} else {
					console.error("  " + d)
				}
			})
			console.groupEnd("")
		}
	})
	B.pageLoaded = true
	B.E = B.reload()
	E = B.E
	if (!hadScriptError) {
		setTimeout(requestAnimationFrame, 10, updateFunc)
		if (window.setup) {
			try {
				setup()
			} catch (err) {
				err.name = "[Setup] " + err.name
				throw err
			}
		}

	}
	var dependant = {}
	document.querySelectorAll("[dependElement][dependValue]").forEach(v => {
		var id = v.getAttribute("dependElement")
		var value = v.getAttribute("dependValue")
		if (!dependant[id]) dependant[id] = []
		dependant[id].push({ value: value, element: v })
		v.hidden = value != E[id].value
	})

	document.querySelectorAll("[dependSource]").forEach((v) => {
		v.addEventListener("change", () => {
			dependant[v.id].forEach(elem => {
				elem.element.hidden = elem.value != v.value
			})
		})
	})

	document.querySelectorAll("[onupdate]").forEach((v) => {
		B.elemOnUpdate.push(v)
	})

	console.groupEnd("Init")
})

window.addEventListener("unload", function () {
	var error = false
	try {
		if (window.exit) {
			exit()
		}
	} catch (err) {
		error = err
	}

	for (i = 0; i < B.sincE.length; i++) {
		B.lStorage.sinc[B.sincE[i].id] = B.sincE[i].value
	}

	for (i = 0; i < B.sincECheck.length; i++) {
		if (B.sincECheck[i].checked) {
			B.lStorage.sinc[B.sincECheck[i].id] = "true"
		} else {
			B.lStorage.sinc[B.sincECheck[i].id] = "false"
		}
	}

	localStorage[window.location.pathname + ":bData"] = JSON.stringify(B.lStorage)
	if (error) {
		hadScriptError = true
		throw error
	}
})


B.swap = function (e1, e2) {
	var v1 = e1.hidden
	var v2 = e2.hidden
	if (!v1 && v2) {
		e1.hidden = true
		e2.hidden = false
	} else if (v1 && !v2) {
		e1.hidden = false
		e2.hidden = true
	} else {
		e1.hidden = false
		e2.hidden = true
	}
}

B.reload = function () {
	E = {}
	var allE = document.getElementsByTagName("*")
	for (i = 0; i < allE.length; i++) {
		if (allE[i].id != "") {
			E[allE[i].id] = allE[i]
		}

	}
	if (document.getElementsByTagName("canvas")[0] != undefined) {
		B.canvas = document.getElementsByTagName("canvas")[0].getContext("2d")
	} else {
		B.canvas = undefined
	}
	return E
}

B.sinc = function (thing) {
	if (typeof B.lStorage.sinc[thing.id] != "undefined") {
		thing.value = B.lStorage.sinc[thing.id]
	}
	B.sincE.push(thing)
}

B.sincCheck = function (thing) {
	if (B.lStorage.sinc[thing.id] != undefined) {
		if (B.lStorage.sinc[thing.id] == "true") {
			thing.checked = true
		} else {
			thing.checked = false
		}
	}
	B.sincECheck.push(thing)
}

window.onkeydown = function (event) {
	if (window.onKey) {
		onKey(event)
	}
}

B.module = {
	list: [],
	init: function (name, version, depend, init) {
		if (this.list[name] != undefined) {
			throw new Error(((B.isWorker) ? "<W>" : "") + "[BModule] Module '" + name + "' has aleready been registered")
		}
		var mod = {
			name: name,
			init: init,
			version: version,
			depend: depend,
			dependComplete: 0,
			ready: false,
			toString: () => { return name + " v" + version },
			data: null
		}


		if (depend.length > 0) {
			console.log(((B.isWorker) ? "<W>" : "") + "[BModule] Registered module '" + mod.toString() + "'")
		} else {
			console.log(((B.isWorker) ? "<W>" : "") + "[BModule] Registered module '" + mod.toString() + "' and it's ready")
			try {
				mod.data = mod.init({})
				Object.assign(self, mod.data)
			} catch (err) {
				setTimeout(() => {
					err.message = "[BModule] " + err.message
					hadScriptError = true
					throw err
				}, 0)
			}
			mod.ready = true
		}
		this.list.push(mod)
		this.list[name] = mod
		this.refresh()
	},
	formatedList: function () {
		return this.list.testForEach([], (a) => { return a.toString() }).join("\n")
	},
	require: function (name, path) {
		if (typeof path == "undefined") {
			path = B.pathTo + "/" + ((name.indexOf(".js") != -1) ? name : name + ".js")
		}
		if (typeof document != "undefined") {
			if (B.module.list[name] == undefined) {
				var script = document.createElement("script")
				script.src = path
				script.name = name
				document.head.appendChild(script)
			}
		} else {
			if (B.module.list[name] == undefined) {
				importScripts(B.parentUrl + "/" + path)
			}
		}
	},
	refresh: function () {
		this.list.forEach((source) => {
			this.list.forEach((v) => {
				v.depend.forEach((d) => {
					if ((((d[0] == source.name || d[0] == source.name.split(".")[0]) && (d[1] <= source.version || d[0] == undefined)) || d == source.name) && source.ready) {
						v.dependComplete += 1
						d.loaded = true
					}
				})
				if (v.dependComplete >= v.depend.length && !v.ready) {
					try {
						v.data = v.init()
						Object.assign(self, v.data)
					} catch (err) {
						setTimeout(() => {
							err.message = ((B.isWorker) ? "<W>" : "") + "[BModule] " + err.message
							hadScriptError = true
							throw err
						}, 0)
					}
					console.log(((B.isWorker) ? "<W>" : "") + "[BModule] Module '" + v.toString() + "' is ready")
					v.ready = true
					this.refresh()
				}
			})
		})
	},

}

B.module.init("bUtils", 4, [], () => { })
B.module.init("prototypes", 1.003, [], () => { })
self.require = B.module.require
B.docs = {
	create: function (name, desc) {
		var doc = {
			name: name,
			desc: desc,
			module: null,
			documents: [],
			func: function (name, argDesc, type, desc = "") {
				var newName = name.split(".")
				newName[newName.length - 1] = "--" + newName[newName.length - 1] + "--"
				var uname = newName.join(".")
				if (type.indexOf("[") != -1 && type.indexOf("]") != -1) {
					var splitType = type.split("[")
					var type = "--" + splitType[0] + "--[--" + splitType[1].slice(0, -1) + "--]"
				} else if (type.indexOf("(") != -1 && type.indexOf(")") != -1) {
					var splitType = type.split("(")
					var type = splitType[0] + "(--" + splitType[1].slice(0, -1) + "--)"
				} else {
					var type = "--" + type + "--"
				}
				var argDesc = argDesc.split(",").map((v) => {
					var segments = v.split(":")
					if (segments.length <= 1) {
						return v
					}
					var equaled = false
					var retSec = segments[1].split("").map((v) => {
						if ("[]()<>{}".indexOf(v) != -1 && !equaled) {
							return "--" + v + "--"
						} else if (v == "=" && !equaled) {
							equaled = true
							return "--" + v
						} else {
							return v
						}
					}).join("")
					return segments[0] + ": --" + retSec + ((!equaled) ? "--" : "")
				}).join(",")
				this.documents.push({
					name: name,
					type: type,
					usage: uname + "(" + argDesc + ") : " + type,
					desc: desc,
					type: 1,
					prop: doc.isProps
				})
			},
			prop: function (name, type, desc = "") {
				if (type.indexOf("[") != -1 && type.indexOf("]") != -1) {
					var splitType = type.split("[")
					var type = "--" + splitType[0] + "--[--" + splitType[1].slice(0, -1) + "--]"
				} else {
					var type = "--" + type + "--"
				}
				this.documents.push({
					name: name,
					type: type,
					usage: name + " = <" + type + ">",
					desc: desc,
					type: 0,
					prop: doc.isProps
				})
			},
			construct: function (name, argDesc, desc = "") {
				var argDesc = argDesc.split(",").map((v) => {
					var segments = v.split(":")
					if (segments.length <= 1) {
						return v
					}
					var equaled = false
					var retSec = segments[1].split("").map((v) => {
						if ("[]()<>{}".indexOf(v) != -1 && !equaled) {
							return "--" + v + "--"
						} else if (v == "=" && !equaled) {
							return "--" + v + "--"
						} else {
							return v
						}
					}).join("")
					return segments[0] + ": --" + retSec + "--"
				}).join(",")
				this.documents.push({
					name: name,
					type: name,
					usage: "--new-- --" + name + "--(" + argDesc + ")",
					desc: desc,
					type: 2,
					prop: doc.isProps
				})
				this.isProps = true
			},
			text: function (name, desc = "") {
				this.documents.push({
					name: name,
					type: "undefined",
					usage: "",
					desc: desc,
					type: 3,
					prop: doc.isProps
				})
			},
			endObject: function () {
				this.isProps = false
			},
			isProps: false,
			bindModule: function (module) {
				if (typeof module == "object") {
					this.module = module
				} else {
					this.module = B.module.list[module]
				}
			}
		}
		this.list.push(doc)
		return doc
	},
	list: [],
	build: function (element) {
		var buildCode = function (code, elem) {
			code.replace(" ", String.fromCharCode(8194)).split("--").forEach((c, i) => {
				var span = document.createElement("span")
				if (i % 2 == 0) {
					span.style.color = "black"
				} else {
					if (c[0] + c[1] == "//") {
						span.style.color = "grey"
					} else if (parseFloat(c) == c) {
						span.style.color = "orange"
					} else if (["undefined", "Infinity", "null", "true", "false", "prototype"].indexOf(c.removeWhitespace()) != -1) {
						span.style.color = "green"
					} else if (["function", "if", "else", "else if", "for", "while", "return", "break", "var", "let", "const", "new"].indexOf(c.removeWhitespace()) != -1) {
						span.style.color = "#ff5555"
					} else {
						span.style.color = "#0055ff"
					}
				}
				/*
				span.style.color = (i % 2 == 0) ? "black" : (
					(c[0] + c[1] == "//") ? "grey" : (
						(parseFloat(c) == c) ? "orange" : (
							(["undefined","Infinity","null","true","false","prototype"].indexOf(c) != -1) ? "green" : (
								(["function","if","else","else if","for","while","return","break","var","let","const","new"].indexOf(c) != -1) ? "#ff5555" : "#0055ff"
							)
						)
					)
				)*/
				span.innerText = c
				span.style.whiteSpace = "pre"
				elem.appendChild(span)
			})
		}
		element.innerHTML = ""
		var span = document.createElement("span")
		this.list.forEach((v) => {
			var h1 = document.createElement("h1")
			h1.id = v.name.split(".")[0]
			h1.onclick = () => { location.hash = v.name.split(".")[0] }
			h1.innerText = v.name
			var desc = document.createElement("span")
			desc.innerText = v.desc
			span.appendChild(h1)
			if (v.module) {
				var modInfo = document.createElement("div")
				modInfo.style.color = "grey"
				modInfo.innerText = v.module.toString() + " (Requires: " + v.module.depend.map((d) => { return d[0] + " v" + d[1] }).join(", ") + ")"
				span.appendChild(modInfo)
			}
			span.appendChild(desc)
			v.documents.forEach((v) => {
				var group = document.createElement("span")
				var h3 = document.createElement("h3")
				var i = document.createElement("i")
				var name = document.createElement("span")
				var code = document.createElement("code")
				var desc = document.createElement("span")
				i.innerText = ((v.type == 0) ? "VARIABLE " : ((v.type == 1) ? "FUNCTION " : ((v.type == 2) ? "CONSTRUCTOR " : "")))
				i.style = "font-weight: normal"
				name.innerText = v.name
				buildCode(v.usage, code)
				code.style = "background-color: #eeeeee; padding: 10px 10px 10px 10px; margin:10px 10px 10px 10px; display:block"
				code.style.width += window.innerWidth - ((v.prop) ? (100 + 50) : 100) + "px"
				group.style.position = "relative"
				group.style.left = ((v.prop) ? "50px" : "0px")
				group.style.width = "0px"
				v.desc.split("**").forEach((b, i) => {
					if (i % 2 != 0) {
						var elm = document.createElement("code")
						elm.style = "background-color: #eeeeee; padding: 10px 10px 10px 10px; display:block"
						elm.style.width = window.innerWidth - ((v.prop) ? (90 + 50) : 90) + "px"
						buildCode(b, elm)
						desc.appendChild(elm)
					} else {
						buildCode(b, desc)
					}
				})
				h3.appendChild(i)
				h3.appendChild(name)
				span.appendChild(group)
				group.appendChild(h3)
				if (v.usage.length > 0) {
					group.appendChild(code)
				}
				group.appendChild(desc)
			})
		})
		element.appendChild(span)
	}
}

B.saveFile = function (src, name = "", type = null) {
	if (type) {
		var newSrc = "data:" + type + "," + encodeURIComponent(src);
		src = newSrc
	}
	var a = document.createElement("a")
	a.download = name
	a.href = src
	a.click()
}

/**
 * @returns {Promise<File[]>}
 * @param {any} acceptString
 * @param {any} multiple
 * @param {any} input
 */
B.loadFile = function (acceptString = "image/*", multiple = false, input = document.createElement("input")) {
	return new Promise((resolve, reject) => {
		input.type = "file"
		input.accept = acceptString
		input.multiple = multiple
		var onchange = function (event) {
			var files = [...input.files]
			if (input.value == "") {
				reject([])
			} else {
				resolve(files)
			}
			input.removeEventListener("change", onchange)
			input.value = ""
		}
		input.addEventListener("change", onchange)
		input.click()

	})
}

B.colorSelect = function () {
	return new Promise((resolve, reject) => {
		var input = document.createElement("input")
		input.type = "color"
		input.onchange = function (event) {
			resolve(colors.fromHex(input.value))
		}
		input.click()
	})
}

B.createForm = function (element, fields, submitText = "OK", enterToSubmit = false, changeToSubmit = false) {
	/* @@@createForm
		[
			name: "Address",
			type: "text", || text,number,selection(values),none (writes just the name),thruth
			optional options: [
				...<strings>
			] || if selection
			optional range: {
				max: 10,
				min: 0,
				step: 1
			} || if number && if want ("slider")
			value: "www.go"
			id: "addr" = this.name
		]
	*/
	//console.log(element.childNodes);
	var madeModalWindow = false
	if (element == null) {
		element = B.createModalWindow()
		madeModalWindow = true
	}


	[...element.childNodes].clone().forEach((v) => {
		//console.log(v)
		element.removeChild(v)
	})
	var parseFunc = function () {
		var ret = {}
		fields.forEach((v, i) => {
			var elem = element.querySelector("[name=\"" + v.id + "\"]")
			choice(v.type,
				"text", () => {
					ret[v.id || v.name] = elem.getElementsByTagName("input")[0].value
				},
				"thruth", () => {
					ret[v.id || v.name] = elem.getElementsByTagName("input")[0].checked
				},
				"selection", () => {
					ret[v.id || v.name] = elem.getElementsByTagName("select")[0].value
				},
				"number", () => {
					ret[v.id || v.name] = parseFloat(elem.getElementsByTagName("input")[0].value)
				},
				"none", () => {

				},
				"color", () => {
					ret[v.id || v.name] = colors.fromHex(elem.getElementsByTagName("input")[0].value)
				}
			)
		})
		return ret
	}
	fields.forEach((v, i) => {


		var span = document.createElement("span")
		var br = document.createElement("br")
		span.innerText = (v.name == "") ? "" : ((v.type == "none") ? v.name : v.name + ": ")
		span.setAttribute("name", v.id)

		choice(v.type,
			"text", () => {
				var input = document.createElement("input")
				input.value = v.value
				input.type = "text"

				input.onchange = function () {
					changeFunc(parseFunc())
				}
				input.focus()
				span.appendChild(input)
			},
			"thruth", () => {
				var input = document.createElement("input")
				input.checked = v.value
				input.type = "checkbox"

				input.onchange = function () {
					changeFunc(parseFunc())
				}

				span.appendChild(input)
			},
			"number", () => {
				var input = document.createElement("input")
				input.value = v.value.toString()
				input.type = (v.range) ? "range" : "number"

				input.onchange = function () {
					changeFunc(parseFunc())
				}
				input.focus()

				if (v.range) {
					input.min = v.range.min
					input.max = v.range.max
					input.step = v.range.step
				}

				span.appendChild(input)
			},
			"selection", () => {
				var select = document.createElement("select")
				select.onchange = function () {
					changeFunc(parseFunc())
				}

				v.options.forEach((v) => {
					var option = document.createElement("option")
					option.innerText = v
					select.appendChild(option)
				})
				select.value = v.value || v.options[0]
				span.appendChild(select)
			},
			"none", () => { },
			"color", () => {
				var input = document.createElement("input")
				input.type = "color"
				input.value = v.value.toHex()

				input.onchange = function () {
					changeFunc(parseFunc())
				}

				span.appendChild(input)

			},
			() => {
				throw new Error("Invalid value type")
			}
		)

		span.appendChild(br)
		element.appendChild(span)
	})

	var button = document.createElement("button")
	if (submitText.length == 0) button.hidden = true
	button.innerText = submitText
	element.appendChild(button)

	var promise = new Promise((resolve) => {
		button.onclick = function () {
			resolve(parseFunc())
			if (madeModalWindow) element.delete()
		}
	})
	if (madeModalWindow) {
		let cancelButton = document.createElement("button")
		cancelButton.innerText = "Cancel"
		cancelButton.onclick = () => {
			element.delete()
		}
		element.appendChild(cancelButton)
	}

	if (enterToSubmit) {
		let listener = (event) => {
			if (event.key == "Enter") {
				event.target.removeEventListener("keydown", listener)

				button.click()
			}
		}
		element.addEventListener("keydown", listener)

	}
	var ret = {}
	var changeFunc = (ret) => {
		changeCallback()
		if (changeToSubmit) {
			button.click()
		}
	}
	var changeCallback = (ret) => { }
	ret.change = function (func) {
		changeCallback = func

		return this
	}
	ret.then = function (func) {
		promise.then(func)
		return this
	}
	return ret
}

B.formify = function (element, object, buttonText = "OK", repeat = false, callback = (object) => { }, enterToSubmit = false, changeToSubmit = false) {
	var formFields = []
	object.forEach((v, i) => {
		var i = i.toString()
		if (i[0] == "$") return
		choice(typeof v,
			"number", () => {
				formFields.push({
					name: i.firstUpper(),
					id: i,
					value: v,
					type: "number"
				})
			},
			"string", () => {
				if ("$" + i in object && object["$" + i] instanceof Array) {
					formFields.push({
						name: i.firstUpper(),
						id: i,
						value: v,
						type: "selection",
						options: object["$" + i]
					})
				} else {
					formFields.push({
						name: i.firstUpper(),
						id: i,
						value: v,
						type: "text"
					})
				}
			},
			"boolean", () => {
				formFields.push({
					name: i.firstUpper(),
					id: i,
					value: v,
					type: "thruth"
				})
			},
			"object", () => {
				if (v instanceof Array) if (v.length == 3 || v.length == 4) {
					formFields.push({
						name: i.firstUpper(),
						id: i,
						value: v,
						type: "color"
					})
				}
			}
		)
	})

	B.createForm(element, formFields, buttonText, enterToSubmit, changeToSubmit).then((data) => {
		data.forEach((v, i) => {
			object[i] = v
		})
		callback(data)
		if (repeat) B.formify(element, object, buttonText, repeat, callback)
	})
}
B.modalWindow = null
B.createModalWindow = function (bgColor = "white") {
	if (this.modalWindow) {
		this.modalWindow.delete()
	}
	var bg = document.createElement("div")
	bg.style = "position: fixed; top: 0px; left: 0px; background-color: rgba(0,0,0,0.5);width:100%;height:100%;display:flex;align-items: center;justify-content: center"
	document.body.appendChild(bg)
	var window = document.createElement("div")
	window.style.backgroundColor = bgColor
	window.style.minWidth = "10px"
	window.style.minHeight = "10px"
	window.style.padding = "10px 10px 10px 10px"
	bg.appendChild(window)
	window.delete = () => {
		document.body.removeChild(B.modalWindow.parentElement)
		B.modalWindow = null
	}
	this.modalWindow = window
	return window
}

B.createObjectView = function (target) {
	var container = document.createElement("code")
	container.style.padding = "10px 10px 10px 10px"
	container.style.display = "block"
	var write = (text, color = "black") => {
		container.appendChild(document.createElement("pre").setAttributes({ style: "color: " + color + "; display: inline" }, text))
	}
	var indentLevel = 0
	var parse = (object) => {
		if (typeof object == "object") {
			if (object instanceof Array) {
				write("[", "green")
				container.appendChild(document.createElement("br"))
				indentLevel++
				object.forEach((v, i, a) => {
					write("  ".repeat(indentLevel))
					parse(v)
				})
				indentLevel--
				write("  ".repeat(indentLevel) + "]", "green")
			} else {
				write("{", "green")
				container.appendChild(document.createElement("br"))
				indentLevel++
				object.toArray().forEach((v) => {
					write("  ".repeat(indentLevel) + v.key + ":")
					parse(v.value)
				})
				indentLevel--
				write("  ".repeat(indentLevel) + "}", "green")
			}
		} else {
			write(typeof object == "undefined" ? "undefined" : JSON.stringify(object), typeof object == "string" ? "green" : (typeof object == "number" ? "purple" : "brown"))
		}
		container.appendChild(document.createElement("br"))
	}


	parse(target)
	return container
}

/**
 * @returns {Promise<XMLHttpRequest, Error>}
 * @param {any} url
 */
B.request = function (url) {
	return new Promise((res, rej) => {
		var req = new XMLHttpRequest()
		req.addEventListener("load", (ev) => {
			res(req)
		})
		req.addEventListener("error", ()=>rej(new Error("XMLHttpRequest failed with status code of " + status)))
		req.open("GET", url)
		req.send()
	})

}

/**
 * @param {HTMLElement} element
 */
B.removeChildrenOf = function (element) {
	while (element.childElementCount > 0) {
		element.removeChild(element.childNodes[0])
	}
}

B.module.init("canvas", 1.1, [], () => { })

class CanvasUtil {
	/**
	 * @param {CanvasRenderingContext2D} canvas
	 */
	constructor(canvas) {
		this.canvas = canvas
		this.globalOffset = [0, 0]

	}

	/**
	 * @param {number[]} color
	 */
	setColor(color) {
		if (!(color instanceof Array)) {
			this.canvas.fillStyle = color
			this.canvas.strokeStyle = color
			return this
		}
		color = color.copy()
		while (color.length < 4) {
			color.push(255)
		}

		color = color.map(v => Math.clamp(Math.floor(v), 0, 255))

		this.canvas.globalAlpha = color[3] / 255
		this.canvas.fillStyle = "rgba(" + color[0] + "," + color[1] + "," + color[2] + ", " + color[3] + ")";
		this.canvas.strokeStyle = "rgba(" + color[0] + "," + color[1] + "," + color[2] + ", " + color[3] + ")";
		return this
	}
	box(pos, size) {
		pos = pos.add(this.globalOffset)
		this.canvas.fillRect(pos[0], pos[1], size[0], size[1]);
		return this
	}
	rect(pos, size, width = 1) {
		pos = pos.add(this.globalOffset)
		this.canvas.lineWidth = width
		this.canvas.beginPath()
		this.canvas.rect(pos[0], pos[1], size[0], size[1])
		this.canvas.stroke()
		return this
	}
	line(pos1, pos2, width = 1) {
		pos1 = pos1.add(this.globalOffset)
		pos2 = pos2.add(this.globalOffset)
		this.canvas.lineWidth = width;
		this.canvas.beginPath()
		this.canvas.moveTo(pos1[0], pos1[1]);
		this.canvas.lineTo(pos2[0], pos2[1]);
		this.canvas.stroke()
		return this
	}
	zigzagLine(pos1, pos2, width = 1) {
		this.shape([
			pos1,
			[(pos1[0] + pos2[0]) / 2, pos1[1]],
			[(pos1[0] + pos2[0]) / 2, pos2[1]],
			pos2
		], false, width)
	}
	ellipse(pos, size, rot = [0, Math.PI * 2]) {
		pos = pos.add(this.globalOffset)
		this.canvas.beginPath()
		this.canvas.ellipse(pos[0], pos[1], size[0], size[1], rot[0], 0, rot[1])
		this.canvas.fill()
		return this
	}
	strokeEllipse(pos, size, rot = [0, Math.PI * 2], width = 1) {
		pos = pos.add(this.globalOffset)
		this.canvas.lineWidth = width;
		this.canvas.beginPath()
		this.canvas.ellipse(pos[0], pos[1], size[0], size[1], rot[0], 0, rot[1])
		this.canvas.stroke()
		return this
	}
	clear() {
		this.canvas.clearRect(0, 0, this.canvas.canvas.width, this.canvas.canvas.height)
		return this
	}
	fill() {
		this.canvas.fillRect(0, 0, this.canvas.canvas.width, this.canvas.canvas.height)
		return this
	}
	load(str, pos = [0, 0], size = [this.canvas.canvas.width, this.canvas.canvas.height], callback = () => { }) {
		pos = pos.add(this.globalOffset)
		if (typeof str == "string") {
			var img = new Image()
			img.src = str

			img.onload = () => {
				if (size == "image") {
					size = [img.width, img.height]
				}
				if (size == "image+transform") {
					size = [img.width, img.height]
					this.setSize(size)
				}
				this.canvas.drawImage(img, pos[0], pos[1], size[0], size[1])
				callback()
			}
		} else if (str instanceof ImageData) {
			this.canvas.putImageData(str, ...pos)
		} else {
			this.canvas.drawImage(str, pos[0], pos[1], size[0], size[1])
		}
		return this
	}
	toDataUrl() {
		return this.canvas.canvas.toDataURL()
	}
	getImageData(pos = [0, 0], size = this.getSize()) {
		return this.canvas.getImageData(...pos, ...size)
	}

	clearRect(pos, size) {
		pos = pos.add(this.globalOffset)
		this.canvas.clearRect(pos[0], pos[1], size[0], size[1])
		return this
	}
	getSize() {
		return [this.canvas.canvas.width, this.canvas.canvas.height]
	}
	setSize(size) {
		this.canvas.canvas.width = size[0]
		this.canvas.canvas.height = size[1]
		return this
	}
	toWorld(pos) {
		var realSize = [
			parseInt(this.canvas.canvas.clientWidth),
			parseInt(this.canvas.canvas.clientHeight)
		]
		return pos.map((v, i) => {
			return v.map(0, realSize[i], 0, this.getSize()[i])
		}).add(this.globalOffset.mul(-1))
	}
	shape(poss, fill = true, width = 1) {
		this.canvas.beginPath()
		this.canvas.lineWidth = width;
		this.canvas.moveTo(poss[0][0] + this.globalOffset[0], poss[0][1] + this.globalOffset[1])
		poss.forEach((v) => {
			this.canvas.lineTo(v[0] + this.globalOffset[0], v[1] + this.globalOffset[1])
		})
		if (fill) {
			this.canvas.fill()
		} else {
			this.canvas.stroke()
		}

		return this
	}

	polygon(pos, radius, points = 6, fill = true, width = 1, angle = 0) {
		var points = (Math.PI * 2).segment(points).map(v => vector.fromAngle(v + angle).mul(radius).add(pos))
		if (!fill) points.push(points[0])
		if (!fill) points.push(points[1])

		return this.shape(points, fill, width)
	}
	text(pos, height, txt = "", center = false, font = "Arial") {
		var pos = pos.add(this.globalOffset)
		if (center == 1) {
			pos = pos.add([0, height / 4])
		}
		this.canvas.font = height + "px " + font
		this.canvas.textAlign = ["start", "center", "end"][center + 0]
		txt.toString().split("\n").forEach((v, i) => {
			this.canvas.fillText(v, ...(pos.add([0, i * (height * 1.1)])))
		})

		return this
	}
	measureText(height, txt, font = "Arial") {
		this.canvas.font = height + "px " + font
		var ret = canvas.measureText(txt)
		var height = height + (height * 1.1) * (txt.split("\n").length - 1)
		return { width: ret.width, height }
	}
}

CanvasUtil.fromElement = function (canvas) {
	return new CanvasUtil(canvas.getContext("2d"))
}

/**
 * @returns {CanvasUtil}
 * @param {any} size
 */
CanvasUtil.virtual = function (size) {
	return document.createElement("canvas").toCtx().setSize(size)
}

HTMLCanvasElement.prototype.toCtx = function () {
	return new CanvasUtil(this.getContext("2d"))
}

CanvasRenderingContext2D.prototype.toCtx = function () {
	return new CanvasUtil(this)
}

ImageData.prototype.setPixel = function (pos, color = [255, 255, 255]) {
	var id = (pos[0] + pos[1] * this.width) * 4
	this.data[id + 0] = color[0]
	this.data[id + 1] = color[1]
	this.data[id + 2] = color[2]
	this.data[id + 3] = color[3] || 255
}

ImageData.prototype.getPixel = function (pos) {
	var id = (pos[0] + pos[1] * this.width) * 4
	return [this.data[id + 0], this.data[id + 1], this.data[id + 2]]
}
ImageData.prototype.getAspectRatio = function () {
	return this.width / this.height
}

ImageData.prototype.fill = function (color) {
	repeat(this.width, (x) => {
		repeat(this.height, (y) => {
			this.setPixel([x, y], color)
		})
	})
	return this
}

ImageData.prototype.copy = function (image) {
	repeat(this.width, (x) => {
		repeat(this.height, (y) => {
			this.setPixel([x, y], image.getPixel([x, y]))
		})
	})
	return this
}

ImageData.prototype.getSize = function () {
	return [this.width, this.height]
}

File.prototype.toString = function () {
	return new Promise((resolve) => {
		var reader = new FileReader()
		reader.onload = function (data) {
			resolve(reader.result)
		}
		reader.readAsText(this)
	})

}

File.prototype.toDataURL = function () {
	return new Promise((resolve) => {
		var reader = new FileReader()
		reader.onload = function (data) {
			resolve(reader.result)
		}
		reader.readAsDataURL(this)
	})

}

File.prototype.toArrayBuffer = function () {
	return new Promise((resolve) => {
		var reader = new FileReader()
		reader.onload = function (data) {
			resolve(reader.result)
		}
		reader.readAsArrayBuffer(this)
	})

}

MouseEvent.prototype.getPos = function () {
	var rect = this.currentTarget.getBoundingClientRect()
	return [
		this.screenX - rect.left,
		this.screenY - rect.top - 100
	]
}

Element.prototype.getSize = function () {
	var rect = this.getBoundingClientRect()
	return [rect.width, rect.height]
}

Element.prototype.getPos = function () {
	var rect = this.getBoundingClientRect()
	return [rect.left, rect.top]
}

Element.prototype.setSize = function (size) {
	this.style.width = size[0] + "px"
	this.style.height = size[1] + "px"
	return this.getSize()
}

Element.prototype.setPos = function (pos) {
	this.style.position = "absolute"
	this.style.left = pos[0] + "px"
	this.style.top = pos[1] + "px"
}

Element.prototype.setAttributes = function (attrs, innerText = undefined) {
	attrs.toArray().forEach(v => this[v.key] = v.value)
	if (innerText) this.innerText = innerText
	return this
}

Window.prototype.getSize = function () {
	return [this.innerWidth, this.innerHeight]
}
