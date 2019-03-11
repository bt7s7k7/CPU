/*
 * bUtils
 * Copyright (C) 2018 Branislav Trstenský
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation version 3.
 */

B = {};

B.timedCall = function (func, ...args) {
	var begin = 0
	var end = 0
	begin = performance.now()
	func(...args)
	end = performance.now()
	return end - begin
}

B.parseOptions = function (object, defaults = {}, required = []) {
	var object = Object.assign({}, object)
	required.forEach((v) => {
		if (object[v] == undefined) {
			throw new Error("Option value '" + v + "' is required")
		}
	})
	for (val in defaults) {
		if (object[val] == undefined) {
			object[val] = defaults[val]
		}
	}

	return object
}

B.escapeHTML = function (unsafe) {
	return unsafe.replace(/[&<>'"]/g, (v) => { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;', "\n": "<br />", "\r": "" }[v] })
}

B.createWatcher = function (test, callback, multiple = false, interval = 10) {
	var func = function () {
		if (test()) {
			callback()
			if (!multiple) return
		}
		setTimeout(func, interval)
	}

	func()
}
//@@@stretch
B.spreadFunction = function (step, done, persist = {}, stepTime = 17, updateFunc = () => { }) {
	var killed = false
	var iteration = 0
	var killFunc = function kill() {
		killed = true
	}
	var stepFunc = () => {
		var start = Date.now()
		while (true) {
			if (Date.now() - start > stepTime) {
				setTimeout(() => stepFunc(), 1)
				updateFunc(iteration, persist)
				return
			}
			step(iteration, persist, killFunc)
			iteration++
			if (killed) {
				done(iteration, persist)
				return
			}
		}
	}
	stepFunc()
	return {
		persist,
		kill: killFunc,
		get iteration() {
			return iteration
		}
	}
}

B.toString = function (thing = B) {
	if (thing == this) return "[object B]"
	if (typeof thing == "undefined") return "undefined"
	else if (typeof thing == "null") return "null"
	else if (typeof thing.toString == "function") return thing.toString()
	else return Object.prototype.toString.apply(thing)
}

//-----------------------------------------------------------------------------------------------------------------------------------------------------
//                                                                 PROTOTYPES
//-----------------------------------------------------------------------------------------------------------------------------------------------------

Array.prototype.add = function (second) {
	var ret = []
	this.forEach((thing, i) => {
		ret.push(thing + second[i])
	})

	return ret;
}

Array.prototype.addI = function (second) {
	this.forEach((thing, i) => {
		this[i] = (thing + second[i])
	})

	return this;
}

Array.prototype.mul = function (mult) {
	var ret = []
	this.forEach((num) => {
		ret.push(num * mult)
	})

	return ret
}

Array.prototype.scale = function (b) {
	var ret = []
	this.forEach((v, i) => {
		ret.push(v * b[i])
	})
	return ret
}

Array.prototype.antiscale = function (b) {
	var ret = []
	this.forEach((v, i) => {
		ret.push(v / b[i])
	})
	return ret
}

Array.prototype.size = function () {
	var preSize = 0
	this.forEach((v) => {
		preSize += Math.abs(v * v)
	})
	return Math.sqrt(preSize)
}

Array.prototype.normalize = function () {
	if (this.equals([0, 0])) return [0, 0]

	var ret = []

	this.forEach((v) => {
		ret.push(v / this.size())
	})

	return ret
}

Array.prototype.to2D = function () {
	return [this[0], this[2]]
}
Array.prototype.to3D = function () {
	return [this[0], 0, this[1]]
}

Array.prototype.dist = function (target) {
	return Math.hypot(...this.map((v, i) => { return v - target[i] }))
}

Array.prototype.distSqr = function (target) {
	return this.map((v, i) => (v - target[i]) ** 2).sum()
}

Array.prototype.dist3d = function (target) {
	var dx = this[0] - target[0];
	var dy = this[1] - target[1];
	var dz = this[2] - target[2];

	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

Array.prototype.equals = function (second) {
	var same = true
	this.forEach((v, i) => {
		if (v != second[i]) {
			same = false
		}
	})
	return same
}

Array.prototype.dot = function (second) {
	var a = 0
	this.forEach((v, i) => {
		a += v * second[i]
	})
	return a
}

Array.prototype.cross = function (second) {
	if (this.length == 3) {
		var ret = []
		var a = this
		var b = second
		ret.push(a[1] * b[2] - a[2] * b[1])
		ret.push(a[2] * b[0] - a[0] * b[2])
		ret.push(a[0] * b[1] - a[1] * b[0])
		return ret
	} else if (this.length == 2) {
		return this[0] * second[1] - this[1] * second[0]
	}
}

Array.prototype.copyTo = function (target) {
	target.length = 0
	this.forEach((v) => {
		target.push(v)
	})
	return target
}

Array.prototype.clone = function () {
	var ret = []
	this.forEach((v) => {
		ret.push(v)
	})
	return ret
}

Array.prototype.equals = function (second) {
	var equals = this.length == second.length
	this.forEach((v, i) => {
		equals = equals && (v == second[i])
	})
	return equals
}
Array.prototype.eq = Array.prototype.equals

Array.prototype.lt = function (second) {
	var equals = this.length == second.length
	this.forEach((v, i) => {
		equals = equals && (v < second[i])
	})
	return equals
}

Array.prototype.gt = function (second) {
	var equals = this.length == second.length
	this.forEach((v, i) => {
		equals = equals && (v > second[i])
	})
	return equals
}

Array.prototype.lte = function (second) {
	var equals = this.length == second.length
	this.forEach((v, i) => {
		equals = equals && (v <= second[i])
	})
	return equals
}

Array.prototype.gte = function (second) {
	var equals = this.length == second.length
	this.forEach((v, i) => {
		equals = equals && (v >= second[i])
	})
	return equals
}

Array.prototype.max = function () {
	var max = -Infinity
	this.forEach((v) => {
		max = Math.max(max, v)
	})
	return max
}
Array.prototype.maxI = function () {
	var max = -Infinity
	var ret = -1
	this.forEach((v, i) => {
		max = Math.max(max, v)
		if (max == v) ret = i
	})
	return ret
}

Array.prototype.min = function () {
	var max = Infinity
	this.forEach((v) => {
		max = Math.min(max, v)
	})
	return max
}
Array.prototype.minI = function () {
	var max = Infinity
	var ret = -1
	this.forEach((v, i) => {
		max = Math.min(max, v)
		if (max == v) ret = i
	})
	return ret
}

Array.prototype.sum = function () {
	var ret = 0
	this.forEach((v) => {
		ret += v
	})
	return ret
}

Array.prototype.average = function () {
	return this.sum() / this.length
}

Array.prototype.and = function (b) {
	var ret = []
	this.forEach((v, i) => {
		ret.push(v && b[i])
	})
	return ret
}
Array.prototype.or = function (b) {
	var ret = []
	this.forEach((v, i) => {
		ret.push(v || b[i])
	})
	return ret
}
Array.prototype.xor = function (b) {
	var ret = []
	this.forEach((v, i) => {
		ret.push(v != b[i])
	})
	return ret
}

Array.makeArrayLike = function (target) {
	target.prototype = Array.prototype
	target.length = 0
	return target
}

Array.prototype.testForEach = function (b, call) {
	var ret = []
	this.forEach((v, i) => {
		ret.push(call(v, b[i]))
	})
	return ret
}

Array.getFilled = function (len, con = null) {
	var ret = []
	for (var i = 0; i < len; i++) {
		if (typeof con == "function") {
			ret.push(con(i))
		} else {
			ret.push(con)
		}

	}
	return ret
}

Array.prototype.singleValue = function (func) {
	var curr = null
	this.forEach((v, i, a) => {
		curr = func(curr, v, i, a)
	})
	return curr
}

Array.prototype.random = function (predictableIndex = null) {
	return this[Math.random(this.length - 1, true, predictableIndex)]
}

Array.prototype.arr2d = function (width, pos, value) {
	var index = pos[0] + pos[1] * width
	if (typeof value != "undefined") {
		this[index] = value
		return value
	} else {
		return this[index]
	}
}

Array.prototype.floor = function () {
	return this.map(v => v.floor())
}
Array.prototype.ceil = function () {
	return this.map(v => v.ceil())
}

Array.prototype.reflect = function (normal) {
	return this.add(normal.mul(2 * this.dot(normal) * -1))
}

Array.prototype.toAxis = function () {
	var axis = this.indexOf(this.map(v => v.abs()).max())
	var ret = Array.getFilled(this.length, 0)
	ret[axis] = this[axis] > 0 ? 1 : -1
	return ret
}

Array.prototype.last = function () {
	return this[this.length - 1]
}
Array.prototype.toAngle = function () {
	return Math.atan2(this[0], this[1])
}
Array.prototype.project = function (other) {
	var dot = this.dot(other)
	return [dot * other[0], dot * other[1]]
}

Array.lastOp = []
Array.prototype.begin = function () {
	Array.lastOp = this
	return this
}
Array.prototype.end = function () {
	this.copyTo(Array.lastOp)
	return Array.lastOp
}
Array.prototype.rotate = function (angle) {
	var cos = Math.cos(angle)
	var sin = Math.sin(angle)

	return [this[0] * cos - this[1] * sin, this[0] * sin + this[1] * cos]

}
Array.prototype.lerp = function (target, frac) {
	return this.map((v, i) => v.lerp(target[i], frac))
}
Array.prototype.volume = function () {
	var ret = 1;
	this.forEach((v) => { ret *= v });
	return ret;
}

Array.prototype.containsVector = function (vector) {
	return this.map((v) => v.equals(vector)).sum() == 1
}

Array.prototype.toHex = function () {
	var ret = "#"
	this.forEach((v) => {
		ret += v.clamp(0, 255).floor().toString(16).fillZeroPrefix(2)
	})
	return ret
}

Array.prototype.copy = function () {
	return this.map(v => v)
}

Array.prototype.shuffle = function (predicatble = false) {
	var src = this.copy()
	var ret = []
	repeat(src.length, (i) => {
		var i = Math.random(src.length - 1, true, ((predicatble) ? i : false))
		ret.push(src[i])
		src.splice(i, 1)
	})
	return ret
}

Array.prototype.countContent = function (content) {
	var ret = 0
	this.forEach((v) => {
		if (typeof content == "function") ret += content(v)
		else if (v == content) ret++
	})

	return ret
}

Array.prototype.clamp = function (max, min) {
	return this.map((v, i) => v.clamp(max[i], min[i]))
}

Array.prototype.toObject = function () {
	var ret = {}
	this.forEach(v => {
		ret[v.key] = v.value
	})
	return ret
}

Array.prototype.safeAt = function(index) {
	return this[Math.clamp(index, 0, this.length - 1)]
}

// @@@endArray
String.prototype.random = Array.prototype.random
String.prototype.firstUpper = function () {
	if (this.length == 0) return ""
	var ret = this.split("")
	ret[0] = ret[0].toUpperCase()
	return ret.join("")
}

String.prototype.escape = function () {
	return JSON.stringify(this)
}

String.prototype.fillZeroPrefix = function (num, filler = "0") {
	return filler.repeat(num - this.length) + this
}



/*Object.defineProperty(Array.prototype,"x",{get:function(){return this[0]},set:function(val){this[0] = val;return value}})
Object.defineProperty(Array.prototype,"y",{get:function(){return this[1]},set:function(val){this[1] = val;return value}})
Object.defineProperty(Array.prototype,"z",{get:function(){return this[2]},set:function(val){this[2] = val;return value}})

Object.defineProperty(Array.prototype,"r",{get:function(){return this[0]},set:function(val){this[0] = val;return value}})
Object.defineProperty(Array.prototype,"g",{get:function(){return this[1]},set:function(val){this[1] = val;return value}})
Object.defineProperty(Array.prototype,"b",{get:function(){return this[2]},set:function(val){this[2] = val;return value}})*/

Number.prototype.notNaN = function () {
	if (isNaN(this)) {
		return 0
	} else {
		return this
	}
}

Number.prototype.between = function (first, second) {
	return this <= Math.max(first, second) && this >= Math.min(first, second)
}

Number.prototype.clamp = function (min, max) {
	var ret = this
	if (ret < min) { ret = min }
	if (ret > max) { ret = max }
	return ret
}
Math.clamp = (num, ...args) => { return num.clamp(...args) }

Number.prototype.overflow = function (min, max) {
	var ret = this
	if (ret < min) { ret = max }
	if (ret > max) { ret = min }
	return ret
}
Math.overflow = function (number, ...args) {
	return number.overflow(...args)
}

Number.prototype.segment = function (amount = 1) {
	return Array.getFilled(amount, this / amount).map((v, i) => { return v * (i + 1) })
}

var oldTS = Number.prototype.toString
Number.prototype.toString = function (radix = 10, length = 0) {
	var ret = oldTS.apply(this, [radix])
	if (ret.length < length) {
		var arr = ret.replace("-", "").split("")
		arr.reverse()
		arr = arr.concat(Array.getFilled(length, "0"))
		arr.length = length
		arr.reverse()
		ret = ((this < 0) ? "-" : "") + arr.join("")
	}
	return ret
}
Number.prototype.toValid = function () {
	if (isNaN(this)) {
		return 0
	} else {
		return this.valueOf()
	}
}

Number.prototype.half = function () {
	return this / 2
}

Number.prototype.dist = function (second) {
	return (this - second).abs()
}

Number.prototype.lerp = function (target, frac) {
	return this + (target - this) * frac
}


Math.__oldRandom__ = Math.random
Math.random = function (max, floor, predictableIndex = false) {
	var rand = (typeof predictableIndex == "number") ? parseFloat('0.' + Math.sin(predictableIndex).toString().substr(6)) : Math.__oldRandom__()
	if (max == undefined) {
		return rand
	}
	rand = rand * max
	if (floor) {
		rand = Math.floor(rand)
	}
	return rand
}
Math.randomInt = function (max) {
	return Math.random(max, true);
}
Math.map = function (ret, currMin, currMax, newMin, newMax) {
	ret -= currMin
	currMax -= currMin
	newMax -= newMin
	ret *= newMax / currMax
	return ret + newMin
}

Math.fraction = function (begin, end, point) {
	return Math.map(point, begin, end, 0, 1)
}

Math.normalizeAngle = function (angle) {
	return angle.overflow(0, Math.PI * 2).valueOf()
}
Math.closestPwrOfTwo = function (v) {
	v--;
	v |= v >> 1;
	v |= v >> 2;
	v |= v >> 4;
	v |= v >> 8;
	v |= v >> 16;
	return v + 1;
}

var colors = { // @@@colors
	red: [255, 0, 0],
	orange: [255, 127, 0],
	yellow: [255, 255, 0],
	green: [0, 255, 0],
	aqua: [0, 255, 255],
	blue: [0, 0, 255],
	purple: [127, 0, 255],
	darkRed: [127, 0, 0],
	brown: [195, 104, 0],
	darkYellow: [127, 127, 0],
	darkGreen: [0, 127, 0],
	darkBlue: [0, 0, 127],
	darkPink: [127, 0, 127],
	pink: [255, 0, 255],
	brightPink: [255, 127, 255],
	white: [255, 255, 255],
	lightGrey: [191, 191, 191],
	grey: [127, 127, 127],
	darkGrey: [63, 63, 63],
	voidGrey: [31, 31, 31],
	black: [0, 0, 0],
	softGreen: [0, 50, 50],
	notepad: [11, 22, 29],
	fromHex: function (hex) {
		var hexs = hex.substr(1).split("")
		return [parseInt(hexs[0] + hexs[1], 16), parseInt(hexs[2] + hexs[3], 16), parseInt(hexs[4] + hexs[5], 16)]
	},
	random: function () {
		return Array.getFilled(3, () => Math.random(255, true))
	},
	fromHSL: function (hsl) {
		var r, g, b;
		var h = hsl[0]
		var s = hsl[1]
		var l = hsl[2]

		if (s == 0) {
			r = g = b = l; // achromatic
		} else {
			function hue2rgb(p, q, t) {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1 / 6) return p + (q - p) * 6 * t;
				if (t < 1 / 2) return q;
				if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
				return p;
			}

			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;
			r = hue2rgb(p, q, h + 1 / 3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1 / 3);
		}

		return [r * 255, g * 255, b * 255];
	}
}

vector = {
	fromString: function (str) {
		var data = str.split(",")
		var ret = []
		data.forEach((v) => {
			ret.push(parseFloat(v))
		})
		return ret
	},
	fromObject: function (object, member) {
		return [object[member + "X"], object[member + "Y"]];
	},
	lerp: function (start, end, fraction) {
		var diff = start.add(end.mul(-1))
		return start.add(diff.mul(-fraction))
	},
	// @@@fromAngle
	fromAngle: function (...a) {
		if (a.length == 1) {
			return [Math.sin(a[0]), Math.cos(a[0])]
		} else if (a.length == 2) {
			var [alpha, beta] = a
			return [
				Math.cos(alpha) * Math.cos(beta),
				Math.sin(beta),
				Math.sin(alpha) * Math.cos(beta)
			]
		}

	},
	random: function (length) {
		return Array.getFilled(length, () => Math.random() * 2 - 1)
	}
}

shapes = {
	rect: function (pos, size) {
		return {
			type: "rect",
			pos: pos,
			size: size,
			volume: size[0] * size[1],
			circumference: (size[0] + size[1]) * 2,
			testPoint: function (pos) {
				return pos.gte(this.pos) && pos.lte(this.pos.add(this.size))
			},
			edges: [
				pos,
				pos.add([0, size[1]]),
				pos.add([size[1], 0]),
				pos.add(size)
			],
			testRect: function (b, isSecond) {
				var match = false
				b.edges.forEach((v) => {
					match = match || this.testPoint(v)
				})
				if (!isSecond) {
					match = match || b.testRect(this, true)
				}
				return match
			},
			testCircle: function (b) {
				var match = false
				this.edges.forEach((v) => {
					match = match || (v.dist(b.pos) <= b.radius)
				})
				match = match || this.testPoint(b.pos)
				return match
			},
			layer: 0
		}
	},
	circle: function (pos, radius) {
		return {
			type: "circle",
			radius: radius,
			pos: pos,
			circumference: 2 * radius * Math.PI,
			volume: radius * radius * Math.PI,
			testCircle: function (b) {
				return this.pos.dist(b.pos) <= Math.min(this.radius, b.radius)
			},
			testRect: function (b) {
				return b.testCircle(this)
			},
			testPoint: function (pos) {
				return pos.dist(this.pos) <= this.radius
			},
			layer: 0
		}
	},
	world: function () {
		return {
			objects: [],
			testCircle: function (c, layer = [0]) {
				var ret = []
				this.objects.forEach(v => {
					if (v.testCircle(c) && layer.indexOf(v.layer) != -1) {
						ret.push(v)
					}
				})
				return ret
			},
			testPoint: function (c, layer = [0]) {
				var ret = []
				this.objects.forEach(v => {
					if (v.testPoint(c) && layer.indexOf(v.layer) != -1) {
						ret.push(v)
					}
				})
				return ret
			},
			testRect: function (c, layer = [0]) {
				var ret = []
				this.objects.forEach(v => {
					if (v.testRect(c) && layer.indexOf(v.layer) != -1) {
						ret.push(v)
					}
				})
				return ret
			},
			raycast: function (pos, dir, max = 500, layer = [0], step = 0.1) {
				var dir = dir.normalize()
				var hit = null
				repeat(Math.ceil(max / step), i => {
					var curr = i * step
					var test = pos.add(dir.mul(curr))
					var hits = this.testPoint(test, layer)
					var shape = hits[0]


					if (hits.length > 0) {
						hit = {
							shape,
							pos: test,
							dist: test.dist(pos)
						}
						return true
					}

				})
				return hit
			}
		}
	},
	pointGrid: function (size, mul = 1, offset = [0, 0]) {
		var ret = {
			type: "pointGrid",
			size,
			mul,
			offset,
			points: Array.getFilled(size[0] * size[1], false),
			get: function (pos) {
				var pos = pos.add(offset.mul(-1)).mul(1 / mul).map(v => Math.floor(v))
				if (pos[0] >= size[0] || pos[0] < 0 || pos[1] >= size[1] || pos[1] < 0) return
				return ret.points[pos[0] + pos[1] * size[0]]
			},
			set: function (pos, val) {
				var pos = pos.add(offset.mul(-1)).mul(1 / mul)
				ret.points[pos[0] + pos[1] * size[0]] = val
			},
			testPoint: function (pos) {
				return ret.get(pos)
			},
			testRect: function (rect) {
				return shapes.rect(pos, [1, 1].mul(mul)).testRect(rect)
			},
			testCircle: function (rect) {
				return shapes.rect(pos, [1, 1].mul(mul)).testCircle(rect)
			},
			layer: 0
		}
		return ret
	}
}

// @@@pathfind
shapes.world.pathfind = function (nodes, startNode, endNode) {
	var solvedNodes = []
	var used = [nodes[startNode]]
	var path = [nodes[startNode]]
	var backtracking = false
	var finalPath = []

	while (true) {
		let curr = path[path.length - 1]
		let conn = curr.conn.map((v) => nodes[v]).filter((v) => {
			return used.indexOf(v) == -1
		})

		if (curr == nodes[endNode]) {
			return path.map(v => v.pos)
		}

		if (conn.length < 1) {
			if (!backtracking) {
				backtracking = true
			}
			if (finalPath.length < 1 || finalPath.last().pos.dist(nodes[endNode].pos) > curr.pos.dist(nodes[endNode].pos)) finalPath = path.clone()
			path.length -= 1
			if (path.length < 1) return finalPath.map(v => v.pos)
			continue
		} else {
			backtracking = false
		}

		let closest = conn[conn.map((v) => v.pos.dist(nodes[endNode].pos)).minI()]
		path.push(closest)
		used.push(closest)
	}
}

repeat = function (times = 1, func) {
	for (var i = 0; i < times; i++) {
		if (func(i, times)) return
	}
}

String.prototype.removeWhitespace = String.prototype.trim

String.prototype.repeat = function (num) {
	return Array.getFilled(num, this).join("")
}

Object.prototype.forEach = function (func) {
	Object.keys(this).forEach((v) => {
		func(this[v], v, this)
	})
}

Object.prototype.map = function (func) {
	ret = {}
	this.forEach((v, i) => {
		ret[i] = func(v, i)
	})
	return ret
}

Object.prototype.copy = function () {
	return Object.assign({}, this)
}

Object.prototype.toArray = function () {
	var ret = []
	this.forEach((v, i) => {
		ret.push({ key: i, value: v })
	})
	return ret
}

Object.prototype.transform = function (func) {
	return func(this)
}

Object.prototype.filter = function (callback) {
	var ret = {}
	this.forEach((v, i) => {
		if (callback(v, i, this)) ret[i] = v
	})
	return ret
}

Object.prototype.assert = function (callback, error) {
	if (!callback(this)) {
		throw error
	}
	return this
}

if (B.isWorker) {
	console.groupEnd("Init")
}


// @@@numberMath
["floor", "ceil", "round", "abs", "map"].forEach((v) => {
	Number.prototype[v] = function (...args) {
		return Math[v](this, ...args)
	}
})

Function.prototype.repeat = function (num, ...args) {
	repeat(num, () => { this(...args) })
}

Function.prototype.promise = function (...args) {
	return new Promise(resolve => {
		this(...args, (...secArgs) => {
			resolve(secArgs)
		})
	})
}

Function.prototype.promiseNCS = function (...args) {
	return new Promise((resolve, reject) => {
		this(...args, (err, ...secArgs) => {
			if (err) return reject(err)
			resolve(secArgs)
		})
	})
}


choice = function choice(value, ...choices) {
	var pairs = []
	var def
	choices.forEach((v, i, a) => {
		if (i % 2 != 0) return
		if (i == a.length - 1 && a.length % 2 != 0) {
			def = v
			return
		}
		pairs.push({
			value: v,
			func: a[i + 1]
		})
	})
	var found = false
	pairs.forEach((v) => {
		if (v.value == value) {
			found = true
			v.func()
		}
	})
	if (!found && typeof def == "function") def(value)
	return found
}

History = function History(maxLength, def) {
	this.maxLength = maxLength
	Array.prototype.push.apply(this, Array.getFilled(maxLength, def))
}
History.prototype = Object.create(Array.prototype)
History.prototype.add = function add(value) {
	this.shift()
	this.push(value)
}

console.__buffer = []
console.buffer = function (...things) {
	this.__buffer.push(things)
}
console.logBuffer = function () {
	var print = []
	this.__buffer.forEach((v, i, a) => {
		print.push(...v)
		if (i < a.length - 1) {
			print.push("\n")
		}
	})
	this.__buffer.length = 0
	console.log(...print)
}

geometry = {
	testLineIntersect: function (p0, p1, p2, p3) {
		var [p0_x, p0_y] = p0
		var [p1_x, p1_y] = p1
		var [p2_x, p2_y] = p2
		var [p3_x, p3_y] = p3

		var s1_x, s1_y, s2_x, s2_y
		var s, t

		s1_x = p1_x - p0_x
		s1_y = p1_y - p0_y
		s2_x = p3_x - p2_x
		s2_y = p3_y - p2_y

		s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y)
		t = (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y)

		if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
			return true
		}
		return false
	},
	getLineIntersect: function (a1, a2, b1, b2) {
		var ret = [a1.cross(a2), b1.cross(b2)]
		var det = [a1[0] - a2[0], a1[1] - a2[1]].cross([b1[0] - b2[0], b1[1] - b2[1]])
		ret = [[ret[0], a1[0] - a2[0]].cross([ret[1], b1[0] - b2[0]]) / det, [ret[0], a1[1] - a2[1]].cross([ret[1], b1[1] - b2[1]]) / det]
		return ret
	},
	getCircleIntersect: function (p0, r0, p1, r1) {
		var x0 = p0[0]
		var y0 = p0[1]
		var x1 = p1[0]
		var y1 = p1[1]
		var a, dx, dy, d, h, rx, ry;
		var x2, y2;

        /* dx and dy are the vertical and horizontal distances between
         * the circle centers.
         */
		dx = x1 - x0;
		dy = y1 - y0;

		/* Determine the straight-line distance between the centers. */
		d = Math.sqrt((dy * dy) + (dx * dx));

		/* Check for solvability. */
		if (d > (r0 + r1)) {
			/* no solution. circles do not intersect. */
			return [];
		}
		if (d < Math.abs(r0 - r1)) {
			/* no solution. one circle is contained in the other */
			return [];
		}

        /* 'point 2' is the point where the line through the circle
         * intersection points crosses the line between the circle
         * centers.  
         */

		/* Determine the distance from point 0 to point 2. */
		a = ((r0 * r0) - (r1 * r1) + (d * d)) / (2.0 * d);

		/* Determine the coordinates of point 2. */
		x2 = x0 + (dx * a / d);
		y2 = y0 + (dy * a / d);

        /* Determine the distance from point 2 to either of the
         * intersection points.
         */
		h = Math.sqrt((r0 * r0) - (a * a));

        /* Now determine the offsets of the intersection points from
         * point 2.
         */
		rx = -dy * (h / d);
		ry = dx * (h / d);

		/* Determine the absolute intersection points. */
		var xi = x2 + rx;
		var xi_prime = x2 - rx;
		var yi = y2 + ry;
		var yi_prime = y2 - ry;

		return [[xi, yi], [xi_prime, yi_prime]];
	}
}


