(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
(function (process,Buffer){(function (){


const quote_p = document.getElementById('quote');
const author_span = document.getElementById('author');

// Read csv file
process.nextTick(function(){(function (err,data) {
  // Error check
  if (err) throw err;
  // Split individual (divided by newline) item into an array
  const quoteArr = data.toString().split('\n');
  // Pick one random quote
  let randomIndex = Math.floor(Math.random() * (quoteArr.length - 1)) + 1;
  const randomQuote = quoteArr[randomIndex];
  console.log(randomQuote);

  // Remove the first and last \" from string using slice, then split it
  let splitted = randomQuote.slice(1, -2).split('","');
  // let quote = '“ ' + splitted[1] + ' ”';
  let quote = splitted[1];
  let author = '—' + splitted[0];
  while(!author) {
    randomIndex--;
    splitted = quoteArr[randomIndex].slice(1, -2).split('","');
    author = splitted[0];
  }
  quote_p.innerText = quote;
  author_span.innerText = author;
  console.log(`${author}\n${quote}`);
})(null,Buffer("IkF1dGhvciIsIlF1b3RlIg0KIlRob21hcyBFZGlzb24iLCJHZW5pdXMgaXMgb25lIHBlcmNlbnQgaW5zcGlyYXRpb24gYW5kIG5pbmV0eS1uaW5lIHBlcmNlbnQgcGVyc3BpcmF0aW9uLiINCiJZb2dpIEJlcnJhIiwiWW91IGNhbiBvYnNlcnZlIGEgbG90IGp1c3QgYnkgd2F0Y2hpbmcuIg0KIkFicmFoYW0gTGluY29sbiIsIkEgaG91c2UgZGl2aWRlZCBhZ2FpbnN0IGl0c2VsZiBjYW5ub3Qgc3RhbmQuIg0KIkpvaGFubiBXb2xmZ2FuZyB2b24gR29ldGhlIiwiRGlmZmljdWx0aWVzIGluY3JlYXNlIHRoZSBuZWFyZXIgd2UgZ2V0IHRvIHRoZSBnb2FsLiINCiJCeXJvbiBQdWxzaWZlciIsIkZhdGUgaXMgaW4geW91ciBoYW5kcyBhbmQgbm8gb25lIGVsc2VzIg0KIkxhbyBUenUiLCJCZSB0aGUgY2hpZWYgYnV0IG5ldmVyIHRoZSBsb3JkLiINCiJDYXJsIFNhbmRidXJnIiwiTm90aGluZyBoYXBwZW5zIHVubGVzcyBmaXJzdCB3ZSBkcmVhbS4iDQoiQXJpc3RvdGxlIiwiV2VsbCBiZWd1biBpcyBoYWxmIGRvbmUuIg0KIllvZ2kgQmVycmEiLCJMaWZlIGlzIGEgbGVhcm5pbmcgZXhwZXJpZW5jZSwgb25seSBpZiB5b3UgbGVhcm4uIg0KIk1hcmdhcmV0IFNhbmdzdGVyIiwiU2VsZi1jb21wbGFjZW5jeSBpcyBmYXRhbCB0byBwcm9ncmVzcy4iDQoiQnVkZGhhIiwiUGVhY2UgY29tZXMgZnJvbSB3aXRoaW4uIERvIG5vdCBzZWVrIGl0IHdpdGhvdXQuIg0KIkJ5cm9uIFB1bHNpZmVyIiwiV2hhdCB5b3UgZ2l2ZSBpcyB3aGF0IHlvdSBnZXQuIg0KIklyaXMgTXVyZG9jaCIsIldlIGNhbiBvbmx5IGxlYXJuIHRvIGxvdmUgYnkgbG92aW5nLiINCiJLYXJlbiBDbGFyayIsIkxpZmUgaXMgY2hhbmdlLiBHcm93dGggaXMgb3B0aW9uYWwuIENob29zZSB3aXNlbHkuIg0KIldheW5lIER5ZXIiLCJZb3UnbGwgc2VlIGl0IHdoZW4geW91IGJlbGlldmUgaXQuIg0KIiIsIlRvZGF5IGlzIHRoZSB0b21vcnJvdyB3ZSB3b3JyaWVkIGFib3V0IHllc3RlcmRheS4iDQoiIiwiSXQncyBlYXNpZXIgdG8gc2VlIHRoZSBtaXN0YWtlcyBvbiBzb21lb25lIGVsc2UncyBwYXBlci4iDQoiIiwiRXZlcnkgbWFuIGRpZXMuIE5vdCBldmVyeSBtYW4gcmVhbGx5IGxpdmVzLiINCiJMYW8gVHp1IiwiVG8gbGVhZCBwZW9wbGUgd2FsayBiZWhpbmQgdGhlbS4iDQoiV2lsbGlhbSBTaGFrZXNwZWFyZSIsIkhhdmluZyBub3RoaW5nLCBub3RoaW5nIGNhbiBoZSBsb3NlLiINCiJIZW5yeSBKLiBLYWlzZXIiLCJUcm91YmxlIGlzIG9ubHkgb3Bwb3J0dW5pdHkgaW4gd29yayBjbG90aGVzLiINCiJQdWJsaWxpdXMgU3lydXMiLCJBIHJvbGxpbmcgc3RvbmUgZ2F0aGVycyBubyBtb3NzLiINCiJOYXBvbGVvbiBIaWxsIiwiSWRlYXMgYXJlIHRoZSBiZWdpbm5pbmcgcG9pbnRzIG9mIGFsbCBmb3J0dW5lcy4iDQoiRG9uYWxkIFRydW1wIiwiRXZlcnl0aGluZyBpbiBsaWZlIGlzIGx1Y2suIg0KIkxhbyBUenUiLCJEb2luZyBub3RoaW5nIGlzIGJldHRlciB0aGFuIGJlaW5nIGJ1c3kgZG9pbmcgbm90aGluZy4iDQoiQmVuamFtaW4gU3BvY2siLCJUcnVzdCB5b3Vyc2VsZi4gWW91IGtub3cgbW9yZSB0aGFuIHlvdSB0aGluayB5b3UgZG8uIg0KIkNvbmZ1Y2l1cyIsIlN0dWR5IHRoZSBwYXN0LCBpZiB5b3Ugd291bGQgZGl2aW5lIHRoZSBmdXR1cmUuIg0KIiIsIlRoZSBkYXkgaXMgYWxyZWFkeSBibGVzc2VkLCBmaW5kIHBlYWNlIHdpdGhpbiBpdC4iDQoiU2lnbXVuZCBGcmV1ZCIsIkZyb20gZXJyb3IgdG8gZXJyb3Igb25lIGRpc2NvdmVycyB0aGUgZW50aXJlIHRydXRoLiINCiJCZW5qYW1pbiBGcmFua2xpbiIsIldlbGwgZG9uZSBpcyBiZXR0ZXIgdGhhbiB3ZWxsIHNhaWQuIg0KIkVsbGEgV2lsbGlhbXMiLCJCaXRlIG9mZiBtb3JlIHRoYW4geW91IGNhbiBjaGV3LCB0aGVuIGNoZXcgaXQuIg0KIkJ1ZGRoYSIsIldvcmsgb3V0IHlvdXIgb3duIHNhbHZhdGlvbi4gRG8gbm90IGRlcGVuZCBvbiBvdGhlcnMuIg0KIkJlbmphbWluIEZyYW5rbGluIiwiT25lIHRvZGF5IGlzIHdvcnRoIHR3byB0b21vcnJvd3MuIg0KIkNocmlzdG9waGVyIFJlZXZlIiwiT25jZSB5b3UgY2hvb3NlIGhvcGUsIGFueXRoaW5ncyBwb3NzaWJsZS4iDQoiQWxiZXJ0IEVpbnN0ZWluIiwiR29kIGFsd2F5cyB0YWtlcyB0aGUgc2ltcGxlc3Qgd2F5LiINCiJDaGFybGVzIEtldHRlcmluZyIsIk9uZSBmYWlscyBmb3J3YXJkIHRvd2FyZCBzdWNjZXNzLiINCiIiLCJGcm9tIHNtYWxsIGJlZ2lubmluZ3MgY29tZSBncmVhdCB0aGluZ3MuIg0KIkNoaW5lc2UgcHJvdmVyYiIsIkxlYXJuaW5nIGlzIGEgdHJlYXN1cmUgdGhhdCB3aWxsIGZvbGxvdyBpdHMgb3duZXIgZXZlcnl3aGVyZSINCiJTb2NyYXRlcyIsIkJlIGFzIHlvdSB3aXNoIHRvIHNlZW0uIg0KIlYuIE5haXBhdWwiLCJUaGUgd29ybGQgaXMgYWx3YXlzIGluIG1vdmVtZW50LiINCiJKb2huIFdvb2RlbiIsIk5ldmVyIG1pc3Rha2UgYWN0aXZpdHkgZm9yIGFjaGlldmVtZW50LiINCiJIYWRkb24gUm9iaW5zb24iLCJXaGF0IHdvcnJpZXMgeW91IG1hc3RlcnMgeW91LiINCiJQZWFybCBCdWNrIiwiT25lIGZhY2VzIHRoZSBmdXR1cmUgd2l0aCBvbmVzIHBhc3QuIg0KIkJyaWFuIFRyYWN5IiwiR29hbHMgYXJlIHRoZSBmdWVsIGluIHRoZSBmdXJuYWNlIG9mIGFjaGlldmVtZW50LiINCiJMZW9uYXJkbyBkYSBWaW5jaSIsIldobyBzb3dzIHZpcnR1ZSByZWFwcyBob25vdXIuIg0KIkRhbGFpIExhbWEiLCJCZSBraW5kIHdoZW5ldmVyIHBvc3NpYmxlLiBJdCBpcyBhbHdheXMgcG9zc2libGUuIg0KIkNoaW5lc2UgcHJvdmVyYiIsIlRhbGsgZG9lc24ndCBjb29rIHJpY2UuIg0KIkJ1ZGRoYSIsIkhlIGlzIGFibGUgd2hvIHRoaW5rcyBoZSBpcyBhYmxlLiINCiJMYXJyeSBFbGRlciIsIkEgZ29hbCB3aXRob3V0IGEgcGxhbiBpcyBqdXN0IGEgd2lzaC4iDQoiTWljaGFlbCBLb3JkYSIsIlRvIHN1Y2NlZWQsIHdlIG11c3QgZmlyc3QgYmVsaWV2ZSB0aGF0IHdlIGNhbi4iDQoiQWxiZXJ0IEVpbnN0ZWluIiwiTGVhcm4gZnJvbSB5ZXN0ZXJkYXksIGxpdmUgZm9yIHRvZGF5LCBob3BlIGZvciB0b21vcnJvdy4iDQoiSmFtZXMgTG93ZWxsIiwiQSB3ZWVkIGlzIG5vIG1vcmUgdGhhbiBhIGZsb3dlciBpbiBkaXNndWlzZS4iDQoiWW9kYSIsIkRvLCBvciBkbyBub3QuIFRoZXJlIGlzIG5vIHRyeS4iDQoiSGFycmlldCBCZWVjaGVyIFN0b3dlIiwiQWxsIHNlcmlvdXMgZGFyaW5nIHN0YXJ0cyBmcm9tIHdpdGhpbi4iDQoiQnlyb24gUHVsc2lmZXIiLCJUaGUgYmVzdCB0ZWFjaGVyIGlzIGV4cGVyaWVuY2UgbGVhcm5lZCBmcm9tIGZhaWx1cmVzLiINCiJNdXJyYXkgR2VsbC1NYW5uIiwiVGhpbmsgaG93IGhhcmQgcGh5c2ljcyB3b3VsZCBiZSBpZiBwYXJ0aWNsZXMgY291bGQgdGhpbmsuIg0KIkpvaG4gTGVubm9uIiwiTG92ZSBpcyB0aGUgZmxvd2VyIHlvdSd2ZSBnb3QgdG8gbGV0IGdyb3cuIg0KIk5hcG9sZW9uIEhpbGwiLCJEb24ndCB3YWl0LiBUaGUgdGltZSB3aWxsIG5ldmVyIGJlIGp1c3QgcmlnaHQuIg0KIlBlcmljbGVzIiwiVGltZSBpcyB0aGUgd2lzZXN0IGNvdW5zZWxsb3Igb2YgYWxsLiINCiJOYXBvbGVvbiBIaWxsIiwiWW91IGdpdmUgYmVmb3JlIHlvdSBnZXQuIg0KIlNvY3JhdGVzIiwiV2lzZG9tIGJlZ2lucyBpbiB3b25kZXIuIg0KIkJhbHRhc2FyIEdyYWNpYW4iLCJXaXRob3V0IGNvdXJhZ2UsIHdpc2RvbSBiZWFycyBubyBmcnVpdC4iDQoiQXJpc3RvdGxlIiwiQ2hhbmdlIGluIGFsbCB0aGluZ3MgaXMgc3dlZXQuIg0KIkJ5cm9uIFB1bHNpZmVyIiwiV2hhdCB5b3UgZmVhciBpcyB0aGF0IHdoaWNoIHJlcXVpcmVzIGFjdGlvbiB0byBvdmVyY29tZS4iDQoiQ3VsbGVuIEhpZ2h0b3dlciIsIldoZW4gcGVyZm9ybWFuY2UgZXhjZWVkcyBhbWJpdGlvbiwgdGhlIG92ZXJsYXAgaXMgY2FsbGVkIHN1Y2Nlc3MuIg0KIkFmcmljYW4gcHJvdmVyYiIsIldoZW4gZGVlZHMgc3BlYWssIHdvcmRzIGFyZSBub3RoaW5nLiINCiJXYXluZSBEeWVyIiwiUmVhbCBtYWdpYyBpbiByZWxhdGlvbnNoaXBzIG1lYW5zIGFuIGFic2VuY2Ugb2YganVkZ2VtZW50IG9mIG90aGVycy4iDQoiQWxiZXJ0IEVpbnN0ZWluIiwiSSBuZXZlciB0aGluayBvZiB0aGUgZnV0dXJlLiBJdCBjb21lcyBzb29uIGVub3VnaC4iDQoiUmFscGggRW1lcnNvbiIsIlNraWxsIHRvIGRvIGNvbWVzIG9mIGRvaW5nLiINCiJTb3Bob2NsZXMiLCJXaXNkb20gaXMgdGhlIHN1cHJlbWUgcGFydCBvZiBoYXBwaW5lc3MuIg0KIk1heWEgQW5nZWxvdSIsIkkgYmVsaWV2ZSB0aGF0IGV2ZXJ5IHBlcnNvbiBpcyBib3JuIHdpdGggdGFsZW50LiINCiJBYnJhaGFtIExpbmNvbG4iLCJJbXBvcnRhbnQgcHJpbmNpcGxlcyBtYXksIGFuZCBtdXN0LCBiZSBpbmZsZXhpYmxlLiINCiJSaWNoYXJkIEV2YW5zIiwiVGhlIHVuZGVydGFraW5nIG9mIGEgbmV3IGFjdGlvbiBicmluZ3MgbmV3IHN0cmVuZ3RoLiINCiJSYWxwaCBFbWVyc29uIiwiVGhlIHllYXJzIHRlYWNoIG11Y2ggd2hpY2ggdGhlIGRheXMgbmV2ZXIga25vdy4iDQoiUmFscGggRW1lcnNvbiIsIk91ciBkaXN0cnVzdCBpcyB2ZXJ5IGV4cGVuc2l2ZS4iDQoiQm9kaGlkaGFybWEiLCJBbGwga25vdyB0aGUgd2F5OyBmZXcgYWN0dWFsbHkgd2FsayBpdC4iDQoiSm9oYW5uIFdvbGZnYW5nIHZvbiBHb2V0aGUiLCJHcmVhdCB0YWxlbnQgZmluZHMgaGFwcGluZXNzIGluIGV4ZWN1dGlvbi4iDQoiTWljaGVsYW5nZWxvIiwiRmFpdGggaW4gb25lc2VsZiBpcyB0aGUgYmVzdCBhbmQgc2FmZXN0IGNvdXJzZS4iDQoiV2luc3RvbiBDaHVyY2hpbGwiLCJDb3VyYWdlIGlzIGdvaW5nIGZyb20gZmFpbHVyZSB0byBmYWlsdXJlIHdpdGhvdXQgbG9zaW5nIGVudGh1c2lhc20uIg0KIkxlbyBUb2xzdG95IiwiVGhlIHR3byBtb3N0IHBvd2VyZnVsIHdhcnJpb3JzIGFyZSBwYXRpZW5jZSBhbmQgdGltZS4iDQoiTGFvIFR6dSIsIkFudGljaXBhdGUgdGhlIGRpZmZpY3VsdCBieSBtYW5hZ2luZyB0aGUgZWFzeS4iDQoiQnVkZGhhIiwiVGhvc2Ugd2hvIGFyZSBmcmVlIG9mIHJlc2VudGZ1bCB0aG91Z2h0cyBzdXJlbHkgZmluZCBwZWFjZS4iDQoiU29waG9jbGVzIiwiQSBzaG9ydCBzYXlpbmcgb2Z0ZW4gY29udGFpbnMgbXVjaCB3aXNkb20uIg0KIiIsIkl0IHRha2VzIGJvdGggc3Vuc2hpbmUgYW5kIHJhaW4gdG8gbWFrZSBhIHJhaW5ib3cuIg0KIiIsIkEgYmVhdXRpZnVsIHRoaW5nIGlzIG5ldmVyIHBlcmZlY3QuIg0KIlByaW5jZXNzIERpYW5hIiwiT25seSBkbyB3aGF0IHlvdXIgaGVhcnQgdGVsbHMgeW91LiINCiJKb2huIFBpZXJyYWtvcyIsIkxpZmUgaXMgbW92ZW1lbnQtd2UgYnJlYXRoZSwgd2UgZWF0LCB3ZSB3YWxrLCB3ZSBtb3ZlISINCiJFbGVhbm9yIFJvb3NldmVsdCIsIk5vIG9uZSBjYW4gbWFrZSB5b3UgZmVlbCBpbmZlcmlvciB3aXRob3V0IHlvdXIgY29uc2VudC4iDQoiUmljaGFyZCBCYWNoIiwiQXJndWUgZm9yIHlvdXIgbGltaXRhdGlvbnMsIGFuZCBzdXJlIGVub3VnaCB0aGV5cmUgeW91cnMuIg0KIlNlbmVjYSIsIkx1Y2sgaXMgd2hhdCBoYXBwZW5zIHdoZW4gcHJlcGFyYXRpb24gbWVldHMgb3Bwb3J0dW5pdHkuIg0KIk5hcG9sZW9uIEJvbmFwYXJ0ZSIsIlZpY3RvcnkgYmVsb25ncyB0byB0aGUgbW9zdCBwZXJzZXZlcmluZy4iDQoiV2lsbGlhbSBTaGFrZXNwZWFyZSIsIkxvdmUgYWxsLCB0cnVzdCBhIGZldywgZG8gd3JvbmcgdG8gbm9uZS4iDQoiUmljaGFyZCBCYWNoIiwiSW4gb3JkZXIgdG8gd2luLCB5b3UgbXVzdCBleHBlY3QgdG8gd2luLiINCiJOYXBvbGVvbiBIaWxsIiwiQSBnb2FsIGlzIGEgZHJlYW0gd2l0aCBhIGRlYWRsaW5lLiINCiJOYXBvbGVvbiBIaWxsIiwiWW91IGNhbiBkbyBpdCBpZiB5b3UgYmVsaWV2ZSB5b3UgY2FuISINCiJCbyBKYWNrc29uIiwiU2V0IHlvdXIgZ29hbHMgaGlnaCwgYW5kIGRvbid0IHN0b3AgdGlsbCB5b3UgZ2V0IHRoZXJlLiINCiIiLCJFdmVyeSBuZXcgZGF5IGlzIGFub3RoZXIgY2hhbmNlIHRvIGNoYW5nZSB5b3VyIGxpZmUuIg0KIlRoaWNoIE5oYXQgSGFuaCIsIlNtaWxlLCBicmVhdGhlLCBhbmQgZ28gc2xvd2x5LiINCiJMaWJlcmFjZSIsIk5vYm9keSB3aWxsIGJlbGlldmUgaW4geW91IHVubGVzcyB5b3UgYmVsaWV2ZSBpbiB5b3Vyc2VsZi4iDQoiV2lsbGlhbSBBcnRodXIgV2FyZCIsIkRvIG1vcmUgdGhhbiBkcmVhbTogd29yay4iDQoiU2VuZWNhIiwiTm8gbWFuIHdhcyBldmVyIHdpc2UgYnkgY2hhbmNlLiINCiIiLCJTb21lIHB1cnN1ZSBoYXBwaW5lc3MsIG90aGVycyBjcmVhdGUgaXQuIg0KIldpbGxpYW0gU2hha2VzcGVhcmUiLCJIZSB0aGF0IGlzIGdpZGR5IHRoaW5rcyB0aGUgd29ybGQgdHVybnMgcm91bmQuIg0KIkVsbGVuIEdpbGNocmlzdCIsIkRvbid0IHJ1aW4gdGhlIHByZXNlbnQgd2l0aCB0aGUgcnVpbmVkIHBhc3QuIg0KIkFsYmVydCBTY2h3ZWl0emVyIiwiRG8gc29tZXRoaW5nIHdvbmRlcmZ1bCwgcGVvcGxlIG1heSBpbWl0YXRlIGl0LiINCiIiLCJXZSBkbyB3aGF0IHdlIGRvIGJlY2F1c2Ugd2UgYmVsaWV2ZS4iDQoiRWxlYW5vciBSb29zZXZlbHQiLCJEbyBvbmUgdGhpbmcgZXZlcnkgZGF5IHRoYXQgc2NhcmVzIHlvdS4iDQoiQnlyb24gUHVsc2lmZXIiLCJJZiB5b3UgY2Fubm90IGJlIHNpbGVudCBiZSBicmlsbGlhbnQgYW5kIHRob3VnaHRmdWwuIg0KIkNhcmwgSnVuZyIsIldobyBsb29rcyBvdXRzaWRlLCBkcmVhbXM7IHdobyBsb29rcyBpbnNpZGUsIGF3YWtlcy4iDQoiQnVkZGhhIiwiV2hhdCB3ZSB0aGluaywgd2UgYmVjb21lLiINCiJMb3JkIEhlcmJlcnQiLCJUaGUgc2hvcnRlc3QgYW5zd2VyIGlzIGRvaW5nLiINCiJMZW9uYXJkbyBkYSBWaW5jaSIsIkFsbCBvdXIga25vd2xlZGdlIGhhcyBpdHMgb3JpZ2lucyBpbiBvdXIgcGVyY2VwdGlvbnMuIg0KIiIsIlRoZSBoYXJkZXIgeW91IGZhbGwsIHRoZSBoaWdoZXIgeW91IGJvdW5jZS4iDQoiQW5uZSBXaWxzb24gU2NoYWVmIiwiVHJ1c3Rpbmcgb3VyIGludHVpdGlvbiBvZnRlbiBzYXZlcyB1cyBmcm9tIGRpc2FzdGVyLiINCiJTb2pvdXJuZXIgVHJ1dGgiLCJUcnV0aCBpcyBwb3dlcmZ1bCBhbmQgaXQgcHJldmFpbHMuIg0KIkVsaXphYmV0aCBCcm93bmluZyIsIkxpZ2h0IHRvbW9ycm93IHdpdGggdG9kYXkhIg0KIkdlcm1hbiBwcm92ZXJiIiwiU2lsZW5jZSBpcyBhIGZlbmNlIGFyb3VuZCB3aXNkb20uIg0KIk1hZGFtZSBkZSBTdGFlbCIsIlNvY2lldHkgZGV2ZWxvcHMgd2l0LCBidXQgaXRzIGNvbnRlbXBsYXRpb24gYWxvbmUgZm9ybXMgZ2VuaXVzLiINCiJSaWNoYXJkIEJhY2giLCJUaGUgc2ltcGxlc3QgdGhpbmdzIGFyZSBvZnRlbiB0aGUgdHJ1ZXN0LiINCiIiLCJFdmVyeW9uZSBzbWlsZXMgaW4gdGhlIHNhbWUgbGFuZ3VhZ2UuIg0KIkJlcm5hZGV0dGUgRGV2bGluIiwiWWVzdGVyZGF5IEkgZGFyZWQgdG8gc3RydWdnbGUuIFRvZGF5IEkgZGFyZSB0byB3aW4uIg0KIk5hcG9sZW9uIEhpbGwiLCJObyBhbGliaSB3aWxsIHNhdmUgeW91IGZyb20gYWNjZXB0aW5nIHRoZSByZXNwb25zaWJpbGl0eS4iDQoiV2FsdCBEaXNuZXkiLCJJZiB5b3UgY2FuIGRyZWFtIGl0LCB5b3UgY2FuIGRvIGl0LiINCiJCdWRkaGEiLCJJdCBpcyBiZXR0ZXIgdG8gdHJhdmVsIHdlbGwgdGhhbiB0byBhcnJpdmUuIg0KIkFuYWlzIE5pbiIsIkxpZmUgc2hyaW5rcyBvciBleHBhbmRzIGluIHByb3BvcnRpb24gdG8gb25lJ3MgY291cmFnZS4iDQoiU3VuIFR6dSIsIllvdSBoYXZlIHRvIGJlbGlldmUgaW4geW91cnNlbGYuIg0KIldheW5lIER5ZXIiLCJPdXIgaW50ZW50aW9uIGNyZWF0ZXMgb3VyIHJlYWxpdHkuIg0KIkNvbmZ1Y2l1cyIsIlNpbGVuY2UgaXMgYSB0cnVlIGZyaWVuZCB3aG8gbmV2ZXIgYmV0cmF5cy4iDQoiSm9oYW5uIFdvbGZnYW5nIHZvbiBHb2V0aGUiLCJDaGFyYWN0ZXIgZGV2ZWxvcHMgaXRzZWxmIGluIHRoZSBzdHJlYW0gb2YgbGlmZS4iDQoiQW1lcmljYW4gcHJvdmVyYiIsIkZyb20gbGl0dGxlIGFjb3JucyBtaWdodHkgb2FrcyBkbyBncm93LiINCiJKb24gS2FiYXQtWmlubiIsIllvdSBjYW4ndCBzdG9wIHRoZSB3YXZlcywgYnV0IHlvdSBjYW4gbGVhcm4gdG8gc3VyZi4iDQoiR3VzdGF2ZSBGbGF1YmVydCIsIlJlYWxpdHkgZG9lcyBub3QgY29uZm9ybSB0byB0aGUgaWRlYWwsIGJ1dCBjb25maXJtcyBpdC4iDQoiV2lsbGlhbSBTaGFrZXNwZWFyZSIsIlNwZWFrIGxvdywgaWYgeW91IHNwZWFrIGxvdmUuIg0KIkpvaGFubiBXb2xmZ2FuZyB2b24gR29ldGhlIiwiQSByZWFsbHkgZ3JlYXQgdGFsZW50IGZpbmRzIGl0cyBoYXBwaW5lc3MgaW4gZXhlY3V0aW9uLiINCiJKb2huIExlbm5vbiIsIlJlYWxpdHkgbGVhdmVzIGEgbG90IHRvIHRoZSBpbWFnaW5hdGlvbi4iDQoiU2VuZWNhIiwiVGhlIGdyZWF0ZXN0IHJlbWVkeSBmb3IgYW5nZXIgaXMgZGVsYXkuIg0KIlBlYXJsIEJ1Y2siLCJHcm93dGggaXRzZWxmIGNvbnRhaW5zIHRoZSBnZXJtIG9mIGhhcHBpbmVzcy4iDQoiIiwiWW91IGNhbiBkbyB3aGF0J3MgcmVhc29uYWJsZSBvciB5b3UgY2FuIGRlY2lkZSB3aGF0J3MgcG9zc2libGUuIg0KIkxlb25hcmRvIGRhIFZpbmNpIiwiTm90aGluZyBzdHJlbmd0aGVucyBhdXRob3JpdHkgc28gbXVjaCBhcyBzaWxlbmNlLiINCiJDb25mdWNpdXMiLCJXaGVyZXZlciB5b3UgZ28sIGdvIHdpdGggYWxsIHlvdXIgaGVhcnQuIg0KIkFsYmVydCBFaW5zdGVpbiIsIlRoZSBvbmx5IHJlYWwgdmFsdWFibGUgdGhpbmcgaXMgaW50dWl0aW9uLiINCiJSYWxwaCBFbWVyc29uIiwiR29vZCBsdWNrIGlzIGFub3RoZXIgbmFtZSBmb3IgdGVuYWNpdHkgb2YgcHVycG9zZS4iDQoiU3lsdmlhIFZvaXJvbCIsIlJhaW5ib3dzIGFwb2xvZ2l6ZSBmb3IgYW5ncnkgc2tpZXMuIg0KIiIsIkZyaWVuZHNoaXAgaXNuJ3QgYSBiaWcgdGhpbmcuIEl0J3MgYSBtaWxsaW9uIGxpdHRsZSB0aGluZ3MuIg0KIlRoZW9waHJhc3R1cyIsIlRpbWUgaXMgdGhlIG1vc3QgdmFsdWFibGUgdGhpbmcgYSBtYW4gY2FuIHNwZW5kLiINCiJUb255IFJvYmJpbnMiLCJXaGF0ZXZlciBoYXBwZW5zLCB0YWtlIHJlc3BvbnNpYmlsaXR5LiINCiJPc2NhciBXaWxkZSIsIkV4cGVyaWVuY2UgaXMgc2ltcGx5IHRoZSBuYW1lIHdlIGdpdmUgb3VyIG1pc3Rha2VzLiINCiJXYXluZSBEeWVyIiwiSSB0aGluayBhbmQgdGhhdCBpcyBhbGwgdGhhdCBJIGFtLiINCiIiLCJBIGdvb2QgcGxhbiB0b2RheSBpcyBiZXR0ZXIgdGhhbiBhIHBlcmZlY3QgcGxhbiB0b21vcnJvdy4iDQoiR2xvcmlhIFN0ZWluZW0iLCJJZiB0aGUgc2hvZSBkb2Vzbid0IGZpdCwgbXVzdCB3ZSBjaGFuZ2UgdGhlIGZvb3Q/Ig0KIk1hcmN1cyBBdXJlbGl1cyIsIkVhY2ggZGF5IHByb3ZpZGVzIGl0cyBvd24gZ2lmdHMuIg0KIlB1YmxpbGl1cyBTeXJ1cyIsIldoaWxlIHdlIHN0b3AgdG8gdGhpbmssIHdlIG9mdGVuIG1pc3Mgb3VyIG9wcG9ydHVuaXR5LiINCiJCZXJuYXJkIFNoYXciLCJMaWZlIGlzbid0IGFib3V0IGZpbmRpbmcgeW91cnNlbGYuIExpZmUgaXMgYWJvdXQgY3JlYXRpbmcgeW91cnNlbGYuIg0KIlJpY2hhcmQgQmFjaCIsIlRvIGJyaW5nIGFueXRoaW5nIGludG8geW91ciBsaWZlLCBpbWFnaW5lIHRoYXQgaXQncyBhbHJlYWR5IHRoZXJlLiINCiJHZXJtYW4gcHJvdmVyYiIsIkJlZ2luIHRvIHdlYXZlIGFuZCBHb2Qgd2lsbCBnaXZlIHlvdSB0aGUgdGhyZWFkLiINCiJDb25mdWNpdXMiLCJUaGUgbW9yZSB5b3Uga25vdyB5b3Vyc2VsZiwgdGhlIG1vcmUgeW91IGZvcmdpdmUgeW91cnNlbGYuIg0KIiIsIlNvbWVvbmUgcmVtZW1iZXJzLCBzb21lb25lIGNhcmVzOyB5b3VyIG5hbWUgaXMgd2hpc3BlcmVkIGluIHNvbWVvbmUncyBwcmF5ZXJzLiINCiJNYXJ5IEJldGh1bmUiLCJXaXRob3V0IGZhaXRoLCBub3RoaW5nIGlzIHBvc3NpYmxlLiBXaXRoIGl0LCBub3RoaW5nIGlzIGltcG9zc2libGUuIg0KIkFsYmVydCBFaW5zdGVpbiIsIk9uY2Ugd2UgYWNjZXB0IG91ciBsaW1pdHMsIHdlIGdvIGJleW9uZCB0aGVtLiINCiIiLCJEb24ndCBiZSBwdXNoZWQgYnkgeW91ciBwcm9ibGVtczsgYmUgbGVkIGJ5IHlvdXIgZHJlYW1zLiINCiJCcmlhbiBUcmFjeSIsIldoYXRldmVyIHdlIGV4cGVjdCB3aXRoIGNvbmZpZGVuY2UgYmVjb21lcyBvdXIgb3duIHNlbGYtZnVsZmlsbGluZyBwcm9waGVjeS4iDQoiUGFibG8gUGljYXNzbyIsIkV2ZXJ5dGhpbmcgeW91IGNhbiBpbWFnaW5lIGlzIHJlYWwuIg0KIlVzbWFuIEFzaWYiLCJGZWFyIGlzIGEgZGFya3Jvb20gd2hlcmUgbmVnYXRpdmVzIGRldmVsb3AuIg0KIk5hcG9sZW9uIEJvbmFwYXJ0ZSIsIlRoZSB0cnVlc3Qgd2lzZG9tIGlzIGEgcmVzb2x1dGUgZGV0ZXJtaW5hdGlvbi4iDQoiVmljdG9yIEh1Z28iLCJMaWZlIGlzIHRoZSBmbG93ZXIgZm9yIHdoaWNoIGxvdmUgaXMgdGhlIGhvbmV5LiINCiJFcGljdGV0dXMiLCJGcmVlZG9tIGlzIHRoZSByaWdodCB0byBsaXZlIGFzIHdlIHdpc2guIg0KIiIsIkNoYW5nZSB5b3VyIHRob3VnaHRzLCBjaGFuZ2UgeW91ciBsaWZlISINCiJSb2JlcnQgSGVsbGVyIiwiTmV2ZXIgaWdub3JlIGEgZ3V0IGZlZWxpbmcsIGJ1dCBuZXZlciBiZWxpZXZlIHRoYXQgaXQncyBlbm91Z2guIg0KIk1hcmN1cyBBdXJlbGl1cyIsIkxvc3MgaXMgbm90aGluZyBlbHNlIGJ1dCBjaGFuZ2UsYW5kIGNoYW5nZSBpcyBOYXR1cmVzIGRlbGlnaHQuIg0KIkJ5cm9uIFB1bHNpZmVyIiwiU29tZW9uZSBpcyBzcGVjaWFsIG9ubHkgaWYgeW91IHRlbGwgdGhlbS4iDQoiIiwiVG9kYXkgaXMgdGhlIHRvbW9ycm93IHlvdSB3b3JyaWVkIGFib3V0IHllc3RlcmRheS4iDQoiVGhpY2ggTmhhdCBIYW5oIiwiVGhlcmUgaXMgbm8gd2F5IHRvIGhhcHBpbmVzcywgaGFwcGluZXNzIGlzIHRoZSB3YXkuIg0KIiIsIlRoZSBkYXkgYWx3YXlzIGxvb2tzIGJyaWdodGVyIGZyb20gYmVoaW5kIGEgc21pbGUuIg0KIiIsIkEgc3R1bWJsZSBtYXkgcHJldmVudCBhIGZhbGwuIg0KIkxhbyBUenUiLCJIZSB3aG8gdGFsa3MgbW9yZSBpcyBzb29uZXIgZXhoYXVzdGVkLiINCiJMYW8gVHp1IiwiSGUgd2hvIGlzIGNvbnRlbnRlZCBpcyByaWNoLiINCiJQbHV0YXJjaCIsIldoYXQgd2UgYWNoaWV2ZSBpbndhcmRseSB3aWxsIGNoYW5nZSBvdXRlciByZWFsaXR5LiINCiJSYWxwaCBXYWxkbyBFbWVyc29uIiwiT3VyIHN0cmVuZ3RoIGdyb3dzIG91dCBvZiBvdXIgd2Vha25lc3Nlcy4iDQoiTWFoYXRtYSBHYW5kaGkiLCJXZSBtdXN0IGJlY29tZSB0aGUgY2hhbmdlIHdlIHdhbnQgdG8gc2VlLiINCiJOYXBvbGVvbiBIaWxsIiwiSGFwcGluZXNzIGlzIGZvdW5kIGluIGRvaW5nLCBub3QgbWVyZWx5IHBvc3Nlc3NpbmcuIg0KIiIsIlB1dCB5b3VyIGZ1dHVyZSBpbiBnb29kIGhhbmRzIDogeW91ciBvd24uIg0KIldpdCIsIldlIGNob29zZSBvdXIgZGVzdGlueSBpbiB0aGUgd2F5IHdlIHRyZWF0IG90aGVycy4iDQoiVm9sdGFpcmUiLCJObyBzbm93Zmxha2UgaW4gYW4gYXZhbGFuY2hlIGV2ZXIgZmVlbHMgcmVzcG9uc2libGUuIg0KIlZpcmdpbCIsIkZvcnR1bmUgZmF2b3VycyB0aGUgYnJhdmUuIg0KIkpvc2VwaCBTdGFsaW4iLCJJIGJlbGlldmUgaW4gb25lIHRoaW5nIG9ubHksIHRoZSBwb3dlciBvZiBodW1hbiB3aWxsLiINCiJSb2JlcnQgRnJvc3QiLCJUaGUgYmVzdCB3YXkgb3V0IGlzIGFsd2F5cyB0aHJvdWdoLiINCiJTZW5lY2EiLCJUaGUgbWluZCB1bmxlYXJucyB3aXRoIGRpZmZpY3VsdHkgd2hhdCBpdCBoYXMgbG9uZyBsZWFybmVkLiINCiJBYnJhaGFtIExpbmNvbG4iLCJJIGRlc3Ryb3kgbXkgZW5lbWllcyB3aGVuIEkgbWFrZSB0aGVtIG15IGZyaWVuZHMuIg0KIlRob21hcyBGdWxsZXIiLCJObyBnYXJkZW4gaXMgd2l0aG91dCBpdHMgd2VlZHMuIg0KIkVsYmVydCBIdWJiYXJkIiwiVGhlcmUgaXMgbm8gZmFpbHVyZSBleGNlcHQgaW4gbm8gbG9uZ2VyIHRyeWluZy4iDQoiVHVya2lzaCBwcm92ZXJiIiwiS2luZCB3b3JkcyB3aWxsIHVubG9jayBhbiBpcm9uIGRvb3IuIg0KIkh1Z2ggTWlsbGVyIiwiUHJvYmxlbXMgYXJlIG9ubHkgb3Bwb3J0dW5pdGllcyB3aXRoIHRob3JucyBvbiB0aGVtLiINCiJBLiBQb3dlbGwgRGF2aWVzIiwiTGlmZSBpcyBqdXN0IGEgY2hhbmNlIHRvIGdyb3cgYSBzb3VsLiINCiJKb2hhbm4gV29sZmdhbmcgdm9uIEdvZXRoZSIsIk1vdW50YWlucyBjYW5ub3QgYmUgc3VybW91bnRlZCBleGNlcHQgYnkgd2luZGluZyBwYXRocy4iDQoiVGhpY2ggTmhhdCBIYW5oIiwiTWF5IG91ciBoZWFydHMgZ2FyZGVuIG9mIGF3YWtlbmluZyBibG9vbSB3aXRoIGh1bmRyZWRzIG9mIGZsb3dlcnMuIg0KIkpvaG4gRHJ5ZGVuIiwiRm9ydHVuZSBiZWZyaWVuZHMgdGhlIGJvbGQuIg0KIkZyaWVkcmljaCB2b24gU2NoaWxsZXIiLCJLZWVwIHRydWUgdG8gdGhlIGRyZWFtcyBvZiB0aHkgeW91dGguIg0KIk1pa2UgRGl0a2EiLCJZb3UncmUgbmV2ZXIgYSBsb3NlciB1bnRpbCB5b3UgcXVpdCB0cnlpbmcuIg0KIkltbWFudWVsIEthbnQiLCJTY2llbmNlIGlzIG9yZ2FuaXplZCBrbm93bGVkZ2UuIFdpc2RvbSBpcyBvcmdhbml6ZWQgbGlmZS4iDQoiSm9oYW5uIFdvbGZnYW5nIHZvbiBHb2V0aGUiLCJLbm93aW5nIGlzIG5vdCBlbm91Z2g7IHdlIG11c3QgYXBwbHkhIg0KIlJpY2hhcmQgQmFjaCIsIlN0cm9uZyBiZWxpZWZzIHdpbiBzdHJvbmcgbWVuLCBhbmQgdGhlbiBtYWtlIHRoZW0gc3Ryb25nZXIuIg0KIkFsYmVydCBDYW11cyIsIkF1dHVtbiBpcyBhIHNlY29uZCBzcHJpbmcgd2hlbiBldmVyeSBsZWFmIGlzIGEgZmxvd2VyLiINCiJUb25pIE1vcnJpc29uIiwiSWYgeW91IHN1cnJlbmRlciB0byB0aGUgd2luZCwgeW91IGNhbiByaWRlIGl0LiINCiJIZWxlbiBLZWxsZXIiLCJLZWVwIHlvdXJzZWxmIHRvIHRoZSBzdW5zaGluZSBhbmQgeW91IGNhbm5vdCBzZWUgdGhlIHNoYWRvdy4iDQoiUGF1bG8gQ29lbGhvIiwiV3JpdGUgeW91ciBwbGFucyBpbiBwZW5jaWwgYW5kIGdpdmUgR29kIHRoZSBlcmFzZXIuIg0KIlBhYmxvIFBpY2Fzc28iLCJJbnNwaXJhdGlvbiBleGlzdHMsIGJ1dCBpdCBoYXMgdG8gZmluZCB1cyB3b3JraW5nLiINCiJKb25hdGhhbiBLb3pvbCIsIlBpY2sgYmF0dGxlcyBiaWcgZW5vdWdoIHRvIG1hdHRlciwgc21hbGwgZW5vdWdoIHRvIHdpbi4iDQoiSmFuaXMgSm9wbGluIiwiRG9uJ3QgY29tcHJvbWlzZSB5b3Vyc2VsZi4gWW91IGFyZSBhbGwgeW91J3ZlIGdvdC4iDQoiU29waG9jbGVzIiwiQSBzaG9ydCBzYXlpbmcgb2Z0IGNvbnRhaW5zIG11Y2ggd2lzZG9tLiINCiJFcGljdGV0dXMiLCJEaWZmaWN1bHRpZXMgYXJlIHRoaW5ncyB0aGF0IHNob3cgYSBwZXJzb24gd2hhdCB0aGV5IGFyZS4iDQoiSG9ub3JlIGRlIEJhbHphYyIsIldoZW4geW91IGRvdWJ0IHlvdXIgcG93ZXIsIHlvdSBnaXZlIHBvd2VyIHRvIHlvdXIgZG91YnQuIg0KIk92aWQiLCJUaGUgY2F1c2UgaXMgaGlkZGVuLiBUaGUgZWZmZWN0IGlzIHZpc2libGUgdG8gYWxsLiINCiJGcmFuY2lzIEJhY29uIiwiQSBwcnVkZW50IHF1ZXN0aW9uIGlzIG9uZSBoYWxmIG9mIHdpc2RvbS4iDQoiVG9ueSBSb2JiaW5zIiwiVGhlIHBhdGggdG8gc3VjY2VzcyBpcyB0byB0YWtlIG1hc3NpdmUsIGRldGVybWluZWQgYWN0aW9uLiINCiJNYW51ZWwgUHVpZyIsIkkgYWxsb3cgbXkgaW50dWl0aW9uIHRvIGxlYWQgbXkgcGF0aC4iDQoiV2lsbGlhbSBSLiBJbmdlIiwiTmF0dXJlIHRha2VzIGF3YXkgYW55IGZhY3VsdHkgdGhhdCBpcyBub3QgdXNlZC4iDQoiRXBpY3RldHVzIiwiSWYgeW91IHdpc2ggdG8gYmUgYSB3cml0ZXIsIHdyaXRlLiINCiJXYXluZSBEeWVyIiwiVGhlcmUgaXMgbm8gd2F5IHRvIHByb3NwZXJpdHksIHByb3NwZXJpdHkgaXMgdGhlIHdheS4iDQoiSmltIFJvaG4iLCJFaXRoZXIgeW91IHJ1biB0aGUgZGF5IG9yIHRoZSBkYXkgcnVucyB5b3UuIg0KIlB1YmxpbGl1cyBTeXJ1cyIsIkJldHRlciBiZSBpZ25vcmFudCBvZiBhIG1hdHRlciB0aGFuIGhhbGYga25vdyBpdC4iDQoiT3ByYWggV2luZnJleSIsIkZvbGxvdyB5b3VyIGluc3RpbmN0cy4gVGhhdCBpcyB3aGVyZSB0cnVlIHdpc2RvbSBtYW5pZmVzdHMgaXRzZWxmLiINCiJCZW5qYW1pbiBGcmFua2xpbiIsIlRoZXJlIG5ldmVyIHdhcyBhIGdvb2Qga25pZmUgbWFkZSBvZiBiYWQgc3RlZWwuIg0KIkFuYXRvbGUgRnJhbmNlIiwiVG8gYWNjb21wbGlzaCBncmVhdCB0aGluZ3MsIHdlIG11c3QgZHJlYW0gYXMgd2VsbCBhcyBhY3QuIg0KIlNhaW50IEF1Z3VzdGluZSIsIlBhdGllbmNlIGlzIHRoZSBjb21wYW5pb24gb2Ygd2lzZG9tLiINCiJCdWRkaGEiLCJUaGUgbWluZCBpcyBldmVyeXRoaW5nLiBXaGF0IHlvdSB0aGluayB5b3UgYmVjb21lLiINCiJWb2x0YWlyZSIsIlRvIGVuam95IGxpZmUsIHdlIG11c3QgdG91Y2ggbXVjaCBvZiBpdCBsaWdodGx5LiINCiJNYXlhIExpbiIsIlRvIGZseSwgd2UgaGF2ZSB0byBoYXZlIHJlc2lzdGFuY2UuIg0KIiIsIldoYXQgeW91IHNlZSBkZXBlbmRzIG9uIHdoYXQgeW91J3JlIGxvb2tpbmcgZm9yLiINCiJCbGFpc2UgUGFzY2FsIiwiVGhlIGhlYXJ0IGhhcyBpdHMgcmVhc29ucyB3aGljaCByZWFzb24ga25vd3Mgbm90IG9mLiINCiJXaWxsaWFtIFNoYWtlc3BlYXJlIiwiQmUgZ3JlYXQgaW4gYWN0LCBhcyB5b3UgaGF2ZSBiZWVuIGluIHRob3VnaHQuIg0KIk5hcG9sZW9uIEJvbmFwYXJ0ZSIsIkltYWdpbmF0aW9uIHJ1bGVzIHRoZSB3b3JsZC4iDQoiQmxhaXNlIFBhc2NhbCIsIktpbmQgd29yZHMgZG8gbm90IGNvc3QgbXVjaC4gWWV0IHRoZXkgYWNjb21wbGlzaCBtdWNoLiINCiJNaWNoZWxhbmdlbG8iLCJUaGVyZSBpcyBubyBncmVhdGVyIGhhcm0gdGhhbiB0aGF0IG9mIHRpbWUgd2FzdGVkLiINCiJKb25hcyBTYWxrIiwiSW50dWl0aW9uIHdpbGwgdGVsbCB0aGUgdGhpbmtpbmcgbWluZCB3aGVyZSB0byBsb29rIG5leHQuIg0KIiIsIldvcnJ5IGdpdmVzIGEgc21hbGwgdGhpbmcgYSBiaWcgc2hhZG93LiINCiJOYXBvbGVvbiBIaWxsIiwiRmVhcnMgYXJlIG5vdGhpbmcgbW9yZSB0aGFuIGEgc3RhdGUgb2YgbWluZC4iDQoiTGFvIFR6dSIsIlRoZSBqb3VybmV5IG9mIGEgdGhvdXNhbmQgbWlsZXMgYmVnaW5zIHdpdGggb25lIHN0ZXAuIg0KIlBldGVyIERydWNrZXIiLCJFZmZpY2llbmN5IGlzIGRvaW5nIHRoaW5ncyByaWdodDsgZWZmZWN0aXZlbmVzcyBpcyBkb2luZyB0aGUgcmlnaHQgdGhpbmdzLiINCiJMdWlzYSBTaWdlYSIsIkJsYXplIHdpdGggdGhlIGZpcmUgdGhhdCBpcyBuZXZlciBleHRpbmd1aXNoZWQuIg0KIkRyLiBTZXVzcyIsIkRvbid0IGNyeSBiZWNhdXNlIGl0J3Mgb3Zlci4gU21pbGUgYmVjYXVzZSBpdCBoYXBwZW5lZC4iDQoiSmFzb24gRnJpZWQiLCJObyBpcyBlYXNpZXIgdG8gZG8uIFllcyBpcyBlYXNpZXIgdG8gc2F5LiINCiJDb25mdWNpdXMiLCJUbyBiZSB3cm9uZyBpcyBub3RoaW5nIHVubGVzcyB5b3UgY29udGludWUgdG8gcmVtZW1iZXIgaXQuIg0KIkJhYmUgUnV0aCIsIlllc3RlcmRheXMgaG9tZSBydW5zIGRvbid0IHdpbiB0b2RheSdzIGdhbWVzLiINCiJDYXJseWxlIiwiU2lsZW5jZSBpcyBkZWVwIGFzIEV0ZXJuaXR5LCBTcGVlY2ggaXMgc2hhbGxvdyBhcyBUaW1lLiINCiJMZW8gRi4gQnVzY2FnbGlhIiwiRG9uJ3Qgc21vdGhlciBlYWNoIG90aGVyLiBObyBvbmUgY2FuIGdyb3cgaW4gdGhlIHNoYWRlLiINCiJMYW8gVHp1IiwiQW4gYW50IG9uIHRoZSBtb3ZlIGRvZXMgbW9yZSB0aGFuIGEgZG96aW5nIG94Ig0KIkluZGlyYSBHYW5kaGkiLCJZb3UgY2FuJ3Qgc2hha2UgaGFuZHMgd2l0aCBhIGNsZW5jaGVkIGZpc3QuIg0KIlBsYXRvIiwiQSBnb29kIGRlY2lzaW9uIGlzIGJhc2VkIG9uIGtub3dsZWRnZSBhbmQgbm90IG9uIG51bWJlcnMuIg0KIkNvbmZ1Y2l1cyIsIlRoZSBjYXV0aW91cyBzZWxkb20gZXJyLiINCiJGcmVkZXJpY2sgRG91Z2xhc3MiLCJJZiB0aGVyZSBpcyBubyBzdHJ1Z2dsZSwgdGhlcmUgaXMgbm8gcHJvZ3Jlc3MuIg0KIldpbGxhIENhdGhlciIsIldoZXJlIHRoZXJlIGlzIGdyZWF0IGxvdmUsIHRoZXJlIGFyZSBhbHdheXMgbWlyYWNsZXMuIg0KIkpvaG4gTGVubm9uIiwiVGltZSB5b3UgZW5qb3kgd2FzdGluZywgd2FzIG5vdCB3YXN0ZWQuIg0KIlJpY2hhcmQgQmFjaCIsIkV2ZXJ5IHByb2JsZW0gaGFzIGEgZ2lmdCBmb3IgeW91IGluIGl0cyBoYW5kcy4iDQoiSmVhbiBkZSBsYSBGb250YWluZSIsIlNhZG5lc3MgZmxpZXMgYXdheSBvbiB0aGUgd2luZ3Mgb2YgdGltZS4iDQoiUHVibGlsaXVzIFN5cnVzIiwiSSBoYXZlIG9mdGVuIHJlZ3JldHRlZCBteSBzcGVlY2gsIG5ldmVyIG15IHNpbGVuY2UuIg0KIlRob21hcyBKZWZmZXJzb24iLCJOZXZlciBwdXQgb2ZmIHRpbGwgdG9tb3Jyb3cgd2hhdCB5b3UgY2FuIGRvIHRvZGF5LiINCiJUaG9tYXMgRGV3YXIiLCJNaW5kcyBhcmUgbGlrZSBwYXJhY2h1dGVzLiBUaGV5IG9ubHkgZnVuY3Rpb24gd2hlbiBvcGVuLiINCiJHZW9yZ2UgUGF0dG9uIiwiSWYgYSBtYW4gZG9lcyBoaXMgYmVzdCwgd2hhdCBlbHNlIGlzIHRoZXJlPyINCiJCZW5qYW1pbiBEaXNyYWVsaSIsIlRoZSBzZWNyZXQgb2Ygc3VjY2VzcyBpcyBjb25zdGFuY3kgdG8gcHVycG9zZS4iDQoiUmFscGggRW1lcnNvbiIsIkxpZmUgaXMgYSBwcm9ncmVzcywgYW5kIG5vdCBhIHN0YXRpb24uIg0KIkhvcmFjZSBGcmllc3MiLCJBbGwgc2Vhc29ucyBhcmUgYmVhdXRpZnVsIGZvciB0aGUgcGVyc29uIHdobyBjYXJyaWVzIGhhcHBpbmVzcyB3aXRoaW4uIg0KIkVsYmVydCBIdWJiYXJkIiwiVG8gYXZvaWQgY3JpdGljaXNtLCBkbyBub3RoaW5nLCBzYXkgbm90aGluZywgYmUgbm90aGluZy4iDQoiT3ZpZCIsIkFsbCB0aGluZ3MgY2hhbmdlOyBub3RoaW5nIHBlcmlzaGVzLiINCiJIYXluZXMgQmF5bHkiLCJBYnNlbmNlIG1ha2VzIHRoZSBoZWFydCBncm93IGZvbmRlci4iDQoiTGF1cmVuIEJhY2FsbCIsIkltYWdpbmF0aW9uIGlzIHRoZSBoaWdoZXN0IGtpdGUgb25lIGNhbiBmbHkuIg0KIkZyYW5rIEhlcmJlcnQiLCJUaGUgYmVnaW5uaW5nIG9mIGtub3dsZWRnZSBpcyB0aGUgZGlzY292ZXJ5IG9mIHNvbWV0aGluZyB3ZSBkbyBub3QgdW5kZXJzdGFuZC4iDQoiRWxpemFiZXRoIEJyb3duaW5nIiwiTG92ZSBkb2Vzbid0IG1ha2UgdGhlIHdvcmxkIGdvIHJvdW5kLCBsb3ZlIGlzIHdoYXQgbWFrZXMgdGhlIHJpZGUgd29ydGh3aGlsZS4iDQoiQXJ0aHVyIENvbmFuIERveWxlIiwiV2hlbmV2ZXIgeW91IGhhdmUgZWxpbWluYXRlZCB0aGUgaW1wb3NzaWJsZSwgd2hhdGV2ZXIgcmVtYWlucywgaG93ZXZlciBpbXByb2JhYmxlLCBtdXN0IGJlIHRoZSB0cnV0aC4iDQoiSi4gV2lsbGFyZCBNYXJyaW90dCIsIkdvb2QgdGltYmVyIGRvZXMgbm90IGdyb3cgd2l0aCBlYXNlOyB0aGUgc3Ryb25nZXIgdGhlIHdpbmQsIHRoZSBzdHJvbmdlciB0aGUgdHJlZXMuIg0KIkRhbGFpIExhbWEiLCJJIGJlbGlldmUgdGhhdCB3ZSBhcmUgZnVuZGFtZW50YWxseSB0aGUgc2FtZSBhbmQgaGF2ZSB0aGUgc2FtZSBiYXNpYyBwb3RlbnRpYWwuIg0KIkVkd2FyZCBHaWJib24iLCJUaGUgd2luZHMgYW5kIHdhdmVzIGFyZSBhbHdheXMgb24gdGhlIHNpZGUgb2YgdGhlIGFibGVzdCBuYXZpZ2F0b3JzLiINCiJFbGVhbm9yIFJvb3NldmVsdCIsIlRoZSBmdXR1cmUgYmVsb25ncyB0byB0aG9zZSB3aG8gYmVsaWV2ZSBpbiB0aGUgYmVhdXR5IG9mIHRoZWlyIGRyZWFtcy4iDQoiIiwiVG8gZ2V0IHNvbWV0aGluZyB5b3UgbmV2ZXIgaGFkLCB5b3UgaGF2ZSB0byBkbyBzb21ldGhpbmcgeW91IG5ldmVyIGRpZC4iDQoiIiwiQmUgdGhhbmtmdWwgd2hlbiB5b3UgZG9uJ3Qga25vdyBzb21ldGhpbmcgZm9yIGl0IGdpdmVzIHlvdSB0aGUgb3Bwb3J0dW5pdHkgdG8gbGVhcm4uIg0KIk1haGF0bWEgR2FuZGhpIiwiU3RyZW5ndGggZG9lcyBub3QgY29tZSBmcm9tIHBoeXNpY2FsIGNhcGFjaXR5LiBJdCBjb21lcyBmcm9tIGFuIGluZG9taXRhYmxlIHdpbGwuIg0KIk9nIE1hbmRpbm8iLCJFYWNoIG1pc2ZvcnR1bmUgeW91IGVuY291bnRlciB3aWxsIGNhcnJ5IGluIGl0IHRoZSBzZWVkIG9mIHRvbW9ycm93cyBnb29kIGx1Y2suIg0KIkxld2lzIEIuIFNtZWRlcyIsIlRvIGZvcmdpdmUgaXMgdG8gc2V0IGEgcHJpc29uZXIgZnJlZSBhbmQgcmVhbGl6ZSB0aGF0IHByaXNvbmVyIHdhcyB5b3UuIg0KIkJ1ZGRoYSIsIkluIHNlcGFyYXRlbmVzcyBsaWVzIHRoZSB3b3JsZCdzIGdyZWF0IG1pc2VyeSwgaW4gY29tcGFzc2lvbiBsaWVzIHRoZSB3b3JsZCdzIHRydWUgc3RyZW5ndGguIg0KIk5pa29zIEthemFudHpha2lzIiwiQnkgYmVsaWV2aW5nIHBhc3Npb25hdGVseSBpbiBzb21ldGhpbmcgdGhhdCBkb2VzIG5vdCB5ZXQgZXhpc3QsIHdlIGNyZWF0ZSBpdC4iDQoiIiwiTGV0dGluZyBnbyBpc24ndCB0aGUgZW5kIG9mIHRoZSB3b3JsZDsgaXQncyB0aGUgYmVnaW5uaW5nIG9mIGEgbmV3IGxpZmUuIg0KIkpvaG4gRWxpb3QiLCJBbGwgdGhlIGdyZWF0IHBlcmZvcm1lcnMgSSBoYXZlIHdvcmtlZCB3aXRoIGFyZSBmdWVsbGVkIGJ5IGEgcGVyc29uYWwgZHJlYW0uIg0KIkEuIEEuIE1pbG5lIiwiT25lIG9mIHRoZSBhZHZhbnRhZ2VzIG9mIGJlaW5nIGRpc29yZGVybHkgaXMgdGhhdCBvbmUgaXMgY29uc3RhbnRseSBtYWtpbmcgZXhjaXRpbmcgZGlzY292ZXJpZXMuIg0KIk1hcmllIEN1cmllIiwiSSBuZXZlciBzZWUgd2hhdCBoYXMgYmVlbiBkb25lOyBJIG9ubHkgc2VlIHdoYXQgcmVtYWlucyB0byBiZSBkb25lLiINCiJTZW5lY2EiLCJCZWdpbiBhdCBvbmNlIHRvIGxpdmUgYW5kIGNvdW50IGVhY2ggc2VwYXJhdGUgZGF5IGFzIGEgc2VwYXJhdGUgbGlmZS4iDQoiTGF3cmVuY2UgUGV0ZXIiLCJJZiB5b3UgZG9uJ3Qga25vdyB3aGVyZSB5b3UgYXJlIGdvaW5nLCB5b3Ugd2lsbCBwcm9iYWJseSBlbmQgdXAgc29tZXdoZXJlIGVsc2UuIg0KIkhhbm5haCBNb3JlIiwiSXQgaXMgbm90IHNvIGltcG9ydGFudCB0byBrbm93IGV2ZXJ5dGhpbmcgYXMgdG8gYXBwcmVjaWF0ZSB3aGF0IHdlIGxlYXJuLiINCiJKb2huIEJlcnJ5IiwiVGhlIGJpcmQgb2YgcGFyYWRpc2UgYWxpZ2h0cyBvbmx5IHVwb24gdGhlIGhhbmQgdGhhdCBkb2VzIG5vdCBncmFzcC4iDQoiV2lsbGlhbSBZZWF0cyIsIlRoaW5rIGFzIGEgd2lzZSBtYW4gYnV0IGNvbW11bmljYXRlIGluIHRoZSBsYW5ndWFnZSBvZiB0aGUgcGVvcGxlLiINCiJFcGljdGV0dXMiLCJQcmFjdGljZSB5b3Vyc2VsZiwgZm9yIGhlYXZlbnMgc2FrZSBpbiBsaXR0bGUgdGhpbmdzLCBhbmQgdGhlbiBwcm9jZWVkIHRvIGdyZWF0ZXIuIg0KIlNlbmVjYSIsIklmIG9uZSBkb2VzIG5vdCBrbm93IHRvIHdoaWNoIHBvcnQgaXMgc2FpbGluZywgbm8gd2luZCBpcyBmYXZvcmFibGUuIg0KIiIsIk91ciBncmVhdGVzdCBnbG9yeSBpcyBub3QgaW4gbmV2ZXIgZmFpbGluZyBidXQgcmlzaW5nIGV2ZXJ5dGltZSB3ZSBmYWxsLiINCiIiLCJCZWluZyByaWdodCBpcyBoaWdobHkgb3ZlcnJhdGVkLiBFdmVuIGEgc3RvcHBlZCBjbG9jayBpcyByaWdodCB0d2ljZSBhIGRheS4iDQoiS2VuIFMuIEtleWVzIiwiVG8gYmUgdXBzZXQgb3ZlciB3aGF0IHlvdSBkb24ndCBoYXZlIGlzIHRvIHdhc3RlIHdoYXQgeW91IGRvIGhhdmUuIg0KIlRob21hcyBFZGlzb24iLCJJZiB3ZSBkaWQgdGhlIHRoaW5ncyB3ZSBhcmUgY2FwYWJsZSBvZiwgd2Ugd291bGQgYXN0b3VuZCBvdXJzZWx2ZXMuIg0KIk1hcmllIEN1cmllIiwiTm90aGluZyBpbiBsaWZlIGlzIHRvIGJlIGZlYXJlZC4gSXQgaXMgb25seSB0byBiZSB1bmRlcnN0b29kLiINCiJUb255IFJvYmJpbnMiLCJTdWNjZXNzZnVsIHBlb3BsZSBhc2sgYmV0dGVyIHF1ZXN0aW9ucywgYW5kIGFzIGEgcmVzdWx0LCB0aGV5IGdldCBiZXR0ZXIgYW5zd2Vycy4iDQoiIiwiTG92ZSBpcyBub3QgYmxpbmQ7IGl0IHNpbXBseSBlbmFibGVzIG9uZSB0byBzZWUgdGhpbmdzIG90aGVycyBmYWlsIHRvIHNlZS4iDQoiQW5uZSBTY2hhZWYiLCJMaWZlIGlzIGEgcHJvY2Vzcy4gV2UgYXJlIGEgcHJvY2Vzcy4gVGhlIHVuaXZlcnNlIGlzIGEgcHJvY2Vzcy4iDQoiRWxlYW5vciBSb29zZXZlbHQiLCJJIHRoaW5rIHNvbWVob3cgd2UgbGVhcm4gd2hvIHdlIHJlYWxseSBhcmUgYW5kIHRoZW4gbGl2ZSB3aXRoIHRoYXQgZGVjaXNpb24uIg0KIktlbm5ldGggUGF0dG9uIiwiV2UgbGVhcm4gd2hhdCB3ZSBoYXZlIHNhaWQgZnJvbSB0aG9zZSB3aG8gbGlzdGVuIHRvIG91ciBzcGVha2luZy4iDQoiS2FobGlsIEdpYnJhbiIsIkEgbGl0dGxlIGtub3dsZWRnZSB0aGF0IGFjdHMgaXMgd29ydGggaW5maW5pdGVseSBtb3JlIHRoYW4gbXVjaCBrbm93bGVkZ2UgdGhhdCBpcyBpZGxlLiINCiIiLCJJZiB5b3UgZ2V0IHVwIG9uZSBtb3JlIHRpbWUgdGhhbiB5b3UgZmFsbCwgeW91IHdpbGwgbWFrZSBpdCB0aHJvdWdoLiINCiJGbG9yYSBXaGl0dGVtb3JlIiwiVGhlIGRvb3JzIHdlIG9wZW4gYW5kIGNsb3NlIGVhY2ggZGF5IGRlY2lkZSB0aGUgbGl2ZXMgd2UgbGl2ZS4iDQoiSC4gVy4gQXJub2xkIiwiVGhlIHdvcnN0IGJhbmtydXB0IGluIHRoZSB3b3JsZCBpcyB0aGUgcGVyc29uIHdobyBoYXMgbG9zdCBoaXMgZW50aHVzaWFzbS4iDQoiQnVkZGhhIiwiSGFwcGluZXNzIGNvbWVzIHdoZW4geW91ciB3b3JrIGFuZCB3b3JkcyBhcmUgb2YgYmVuZWZpdCB0byB5b3Vyc2VsZiBhbmQgb3RoZXJzLiINCiIiLCJEb24ndCBmb2N1cyBvbiBtYWtpbmcgdGhlIHJpZ2h0IGRlY2lzaW9uLCBmb2N1cyBvbiBtYWtpbmcgdGhlIGRlY2lzaW9uIHRoZSByaWdodCBvbmUuIg0KIldheW5lIER5ZXIiLCJFdmVyeXRoaW5nIGlzIHBlcmZlY3QgaW4gdGhlIHVuaXZlcnNlLCBldmVuIHlvdXIgZGVzaXJlIHRvIGltcHJvdmUgaXQuIg0KIkVkZW4gUGhpbGxwb3R0cyIsIlRoZSB1bml2ZXJzZSBpcyBmdWxsIG9mIG1hZ2ljYWwgdGhpbmdzLCBwYXRpZW50bHkgd2FpdGluZyBmb3Igb3VyIHdpdHMgdG8gZ3JvdyBzaGFycGVyLiINCiJCdWRkaGEiLCJKdXN0IGFzIGEgY2FuZGxlIGNhbm5vdCBidXJuIHdpdGhvdXQgZmlyZSwgbWVuIGNhbm5vdCBsaXZlIHdpdGhvdXQgYSBzcGlyaXR1YWwgbGlmZS4iDQoiTWFyayBUd2FpbiIsIkEgdGhpbmcgbG9uZyBleHBlY3RlZCB0YWtlcyB0aGUgZm9ybSBvZiB0aGUgdW5leHBlY3RlZCB3aGVuIGF0IGxhc3QgaXQgY29tZXMuIg0KIkJlbmphbWluIERpc3JhZWxpIiwiQWN0aW9uIG1heSBub3QgYWx3YXlzIGJyaW5nIGhhcHBpbmVzczsgYnV0IHRoZXJlIGlzIG5vIGhhcHBpbmVzcyB3aXRob3V0IGFjdGlvbi4iDQoiT3ByYWggV2luZnJleSIsIkkgZG9uJ3QgYmVsaWV2ZSBpbiBmYWlsdXJlLiBJdCBpcyBub3QgZmFpbHVyZSBpZiB5b3UgZW5qb3llZCB0aGUgcHJvY2Vzcy4iDQoiQ29uZnVjaXVzIiwiV2hhdCB5b3UgZG8gbm90IHdhbnQgZG9uZSB0byB5b3Vyc2VsZiwgZG8gbm90IGRvIHRvIG90aGVycy4iDQoiV2luc3RvbiBDaHVyY2hpbGwiLCJTaG9ydCB3b3JkcyBhcmUgYmVzdCBhbmQgdGhlIG9sZCB3b3JkcyB3aGVuIHNob3J0IGFyZSBiZXN0IG9mIGFsbC4iDQoiQnVkZGhhIiwiSWYgeW91IGxpZ2h0IGEgbGFtcCBmb3Igc29tZWJvZHksIGl0IHdpbGwgYWxzbyBicmlnaHRlbiB5b3VyIHBhdGguIg0KIkxpbi15dXRhbmciLCJJIGhhdmUgZG9uZSBteSBiZXN0OiB0aGF0IGlzIGFib3V0IGFsbCB0aGUgcGhpbG9zb3BoeSBvZiBsaXZpbmcgb25lIG5lZWRzLiINCiJCZW5qYW1pbiBEaXNyYWVsaSIsIlRocm91Z2ggcGVyc2V2ZXJhbmNlIG1hbnkgcGVvcGxlIHdpbiBzdWNjZXNzIG91dCBvZiB3aGF0IHNlZW1lZCBkZXN0aW5lZCB0byBiZSBjZXJ0YWluIGZhaWx1cmUuIg0KIkJ5cm9uIFB1bHNpZmVyIiwiR2l2ZSB0aGFua3MgZm9yIHRoZSByYWluIG9mIGxpZmUgdGhhdCBwcm9wZWxzIHVzIHRvIHJlYWNoIG5ldyBob3Jpem9ucy4iDQoiIiwiTG92ZSBpcyBqdXN0IGEgd29yZCB1bnRpbCBzb21lb25lIGNvbWVzIGFsb25nIGFuZCBnaXZlcyBpdCBtZWFuaW5nLiINCiIiLCJXZSBhbGwgaGF2ZSBwcm9ibGVtcy4gVGhlIHdheSB3ZSBzb2x2ZSB0aGVtIGlzIHdoYXQgbWFrZXMgdXMgZGlmZmVyZW50LiINCiJEYXZlIFdlaW5iYXVtIiwiVGhlIHNlY3JldCB0byBhIHJpY2ggbGlmZSBpcyB0byBoYXZlIG1vcmUgYmVnaW5uaW5ncyB0aGFuIGVuZGluZ3MuIg0KIlJhbHBoIFdhbGRvIEVtZXJzb24iLCJJdCBpcyBvbmx5IHdoZW4gdGhlIG1pbmQgYW5kIGNoYXJhY3RlciBzbHVtYmVyIHRoYXQgdGhlIGRyZXNzIGNhbiBiZSBzZWVuLiINCiJNYXlhIEFuZ2Vsb3UiLCJJZiB5b3UgZG9uJ3QgbGlrZSBzb21ldGhpbmcsIGNoYW5nZSBpdC4gSWYgeW91IGNhbid0IGNoYW5nZSBpdCwgY2hhbmdlIHlvdXIgYXR0aXR1ZGUuIg0KIkNvbmZ1Y2l1cyIsIlJldmlld2luZyB3aGF0IHlvdSBoYXZlIGxlYXJuZWQgYW5kIGxlYXJuaW5nIGFuZXcsIHlvdSBhcmUgZml0IHRvIGJlIGEgdGVhY2hlci4iDQoiQXVndXN0aW51cyBTYW5jdHVzIiwiVGhlIHdvcmxkIGlzIGEgYm9vaywgYW5kIHRob3NlIHdobyBkbyBub3QgdHJhdmVsIHJlYWQgb25seSBhIHBhZ2UuIg0KIkhlbnJpLUZyZWRlcmljIEFtaWVsIiwiU28gbG9uZyBhcyBhIHBlcnNvbiBpcyBjYXBhYmxlIG9mIHNlbGYtcmVuZXdhbCB0aGV5IGFyZSBhIGxpdmluZyBiZWluZy4iDQoiTG91aXNhIEFsY290dCIsIkknbSBub3QgYWZyYWlkIG9mIHN0b3JtcywgZm9yIEltIGxlYXJuaW5nIGhvdyB0byBzYWlsIG15IHNoaXAuIg0KIlZvbHRhaXJlIiwiVGhpbmsgZm9yIHlvdXJzZWx2ZXMgYW5kIGxldCBvdGhlcnMgZW5qb3kgdGhlIHByaXZpbGVnZSB0byBkbyBzbyB0b28uIg0KIkFubmllIERpbGxhcmQiLCJIb3cgd2Ugc3BlbmQgb3VyIGRheXMgaXMsIG9mIGNvdXJzZSwgaG93IHdlIHNwZW5kIG91ciBsaXZlcy4iDQoiTWFuIFJheSIsIkl0IGhhcyBuZXZlciBiZWVuIG15IG9iamVjdCB0byByZWNvcmQgbXkgZHJlYW1zLCBqdXN0IHRvIHJlYWxpemUgdGhlbS4iDQoiU2lnbXVuZCBGcmV1ZCIsIlRoZSBtb3N0IGNvbXBsaWNhdGVkIGFjaGlldmVtZW50cyBvZiB0aG91Z2h0IGFyZSBwb3NzaWJsZSB3aXRob3V0IHRoZSBhc3Npc3RhbmNlIG9mIGNvbnNjaW91c25lc3MuIg0KIldheW5lIER5ZXIiLCJCZSBtaXNlcmFibGUuIE9yIG1vdGl2YXRlIHlvdXJzZWxmLiBXaGF0ZXZlciBoYXMgdG8gYmUgZG9uZSwgaXQncyBhbHdheXMgeW91ciBjaG9pY2UuIg0KIk5hcG9sZW9uIEhpbGwiLCJNb3N0IGdyZWF0IHBlb3BsZSBoYXZlIGF0dGFpbmVkIHRoZWlyIGdyZWF0ZXN0IHN1Y2Nlc3MganVzdCBvbmUgc3RlcCBiZXlvbmQgdGhlaXIgZ3JlYXRlc3QgZmFpbHVyZS4iDQoiSGVucnkgRm9yZCIsIklmIHlvdSB0aGluayB5b3UgY2FuLCB5b3UgY2FuLiBBbmQgaWYgeW91IHRoaW5rIHlvdSBjYW4ndCwgeW91J3JlIHJpZ2h0LiINCiJTdC4gQXVndXN0aW5lIiwiQmV0dGVyIHRvIGhhdmUgbG92ZWQgYW5kIGxvc3QsIHRoYW4gdG8gaGF2ZSBuZXZlciBsb3ZlZCBhdCBhbGwuIg0KIkxlbyBUb2xzdG95IiwiRXZlcnlvbmUgdGhpbmtzIG9mIGNoYW5naW5nIHRoZSB3b3JsZCwgYnV0IG5vIG9uZSB0aGlua3Mgb2YgY2hhbmdpbmcgaGltc2VsZi4iDQoiUmljaGFyZCBCYWNoIiwiVGhlIGJlc3Qgd2F5IHRvIHBheSBmb3IgYSBsb3ZlbHkgbW9tZW50IGlzIHRvIGVuam95IGl0LiINCiJXaW5zdG9uIENodXJjaGlsbCIsIllvdSBoYXZlIGVuZW1pZXM/IEdvb2QuIFRoYXQgbWVhbnMgeW91J3ZlIHN0b29kIHVwIGZvciBzb21ldGhpbmcsIHNvbWV0aW1lIGluIHlvdXIgbGlmZS4iDQoiSm9obiBEZSBQYW9sYSIsIlNsb3cgZG93biBhbmQgZXZlcnl0aGluZyB5b3UgYXJlIGNoYXNpbmcgd2lsbCBjb21lIGFyb3VuZCBhbmQgY2F0Y2ggeW91LiINCiJCdWRkaGEiLCJZb3VyIHdvcnN0IGVuZW15IGNhbm5vdCBoYXJtIHlvdSBhcyBtdWNoIGFzIHlvdXIgb3duIHVuZ3VhcmRlZCB0aG91Z2h0cy4iDQoiTGlseSBUb21saW4iLCJJIGFsd2F5cyB3YW50ZWQgdG8gYmUgc29tZWJvZHksIGJ1dCBJIHNob3VsZCBoYXZlIGJlZW4gbW9yZSBzcGVjaWZpYy4iDQoiSm9obiBMZW5ub24iLCJZZWFoIHdlIGFsbCBzaGluZSBvbiwgbGlrZSB0aGUgbW9vbiwgYW5kIHRoZSBzdGFycywgYW5kIHRoZSBzdW4uIg0KIk1hcnRpbiBGaXNjaGVyIiwiS25vd2xlZGdlIGlzIGEgcHJvY2VzcyBvZiBwaWxpbmcgdXAgZmFjdHM7IHdpc2RvbSBsaWVzIGluIHRoZWlyIHNpbXBsaWZpY2F0aW9uLiINCiJBbGJlcnQgRWluc3RlaW4iLCJMaWZlIGlzIGxpa2UgcmlkaW5nIGEgYmljeWNsZS4gVG8ga2VlcCB5b3VyIGJhbGFuY2UgeW91IG11c3Qga2VlcCBtb3ZpbmcuIg0KIkFsYmVydCBTY2h3ZWl0emVyIiwiV2Ugc2hvdWxkIGFsbCBiZSB0aGFua2Z1bCBmb3IgdGhvc2UgcGVvcGxlIHdobyByZWtpbmRsZSB0aGUgaW5uZXIgc3Bpcml0LiINCiJUaG9tYXMgRWRpc29uIiwiT3Bwb3J0dW5pdHkgaXMgbWlzc2VkIGJ5IG1vc3QgYmVjYXVzZSBpdCBpcyBkcmVzc2VkIGluIG92ZXJhbGxzIGFuZCBsb29rcyBsaWtlIHdvcmsuIg0KIkFsYmVydCBFaW5zdGVpbiIsIkZlZWxpbmcgYW5kIGxvbmdpbmcgYXJlIHRoZSBtb3RpdmUgZm9yY2VzIGJlaGluZCBhbGwgaHVtYW4gZW5kZWF2b3IgYW5kIGh1bWFuIGNyZWF0aW9ucy4iDQoiSm9oYW5uIFdvbGZnYW5nIHZvbiBHb2V0aGUiLCJJbiB0aGUgZW5kIHdlIHJldGFpbiBmcm9tIG91ciBzdHVkaWVzIG9ubHkgdGhhdCB3aGljaCB3ZSBwcmFjdGljYWxseSBhcHBseS4iDQoiTGFvIFR6dSIsIklmIHlvdSBjb3JyZWN0IHlvdXIgbWluZCwgdGhlIHJlc3Qgb2YgeW91ciBsaWZlIHdpbGwgZmFsbCBpbnRvIHBsYWNlLiINCiJSYWxwaCBFbWVyc29uIiwiVGhlIHdvcmxkIG1ha2VzIHdheSBmb3IgdGhlIG1hbiB3aG8ga25vd3Mgd2hlcmUgaGUgaXMgZ29pbmcuIg0KIk5hcG9sZW9uIEhpbGwiLCJXaGVuIHlvdXIgZGVzaXJlcyBhcmUgc3Ryb25nIGVub3VnaCB5b3Ugd2lsbCBhcHBlYXIgdG8gcG9zc2VzcyBzdXBlcmh1bWFuIHBvd2VycyB0byBhY2hpZXZlLiINCiJKb2huIEFkYW1zIiwiUGF0aWVuY2UgYW5kIHBlcnNldmVyYW5jZSBoYXZlIGEgbWFnaWNhbCBlZmZlY3QgYmVmb3JlIHdoaWNoIGRpZmZpY3VsdGllcyBkaXNhcHBlYXIgYW5kIG9ic3RhY2xlcyB2YW5pc2guIg0KIkhlbnJ5IERhdmlkIFRob3JlYXUiLCJJIGNhbm5vdCBtYWtlIG15IGRheXMgbG9uZ2VyIHNvIEkgc3RyaXZlIHRvIG1ha2UgdGhlbSBiZXR0ZXIuIg0KIkNoaW5lc2UgcHJvdmVyYiIsIlRlbnNpb24gaXMgd2hvIHlvdSB0aGluayB5b3Ugc2hvdWxkIGJlLiBSZWxheGF0aW9uIGlzIHdobyB5b3UgYXJlLiINCiJIZWxlbiBLZWxsZXIiLCJOZXZlciBiZW5kIHlvdXIgaGVhZC4gQWx3YXlzIGhvbGQgaXQgaGlnaC4gTG9vayB0aGUgd29ybGQgcmlnaHQgaW4gdGhlIGV5ZS4iDQoiQWxiZXJ0IFNjaHdlaXR6ZXIiLCJPbmUgd2hvIGdhaW5zIHN0cmVuZ3RoIGJ5IG92ZXJjb21pbmcgb2JzdGFjbGVzIHBvc3Nlc3NlcyB0aGUgb25seSBzdHJlbmd0aCB3aGljaCBjYW4gb3ZlcmNvbWUgYWR2ZXJzaXR5LiINCiJDYWx2aW4gQ29vbGlkZ2UiLCJXZSBjYW5ub3QgZG8gZXZlcnl0aGluZyBhdCBvbmNlLCBidXQgd2UgY2FuIGRvIHNvbWV0aGluZyBhdCBvbmNlLiINCiJBYnJhaGFtIExpbmNvbG4iLCJZb3UgaGF2ZSB0byBkbyB5b3VyIG93biBncm93aW5nIG5vIG1hdHRlciBob3cgdGFsbCB5b3VyIGdyYW5kZmF0aGVyIHdhcy4iDQoiIiwiSW52ZW50IHlvdXIgd29ybGQuIFN1cnJvdW5kIHlvdXJzZWxmIHdpdGggcGVvcGxlLCBjb2xvciwgc291bmRzLCBhbmQgd29yayB0aGF0IG5vdXJpc2ggeW91LiINCiJHZW5lcmFsIERvdWdsYXMgTWFjQXJ0aHVyIiwiSXQgaXMgZmF0YWwgdG8gZW50ZXIgYW55IHdhciB3aXRob3V0IHRoZSB3aWxsIHRvIHdpbiBpdC4iDQoiSnVsaXVzIENoYXJsZXMgSGFyZSIsIkJlIHdoYXQgeW91IGFyZS4gVGhpcyBpcyB0aGUgZmlyc3Qgc3RlcCB0b3dhcmQgYmVjb21pbmcgYmV0dGVyIHRoYW4geW91IGFyZS4iDQoiQnVja21pbnN0ZXIgRnVsbGVyIiwiVGhlcmUgaXMgbm90aGluZyBpbiBhIGNhdGVycGlsbGFyIHRoYXQgdGVsbHMgeW91IGl0J3MgZ29pbmcgdG8gYmUgYSBidXR0ZXJmbHkuIg0KIkRhbGFpIExhbWEiLCJMb3ZlIGFuZCBjb21wYXNzaW9uIG9wZW4gb3VyIG93biBpbm5lciBsaWZlLCByZWR1Y2luZyBzdHJlc3MsIGRpc3RydXN0IGFuZCBsb25lbGluZXNzLiINCiJXYWx0ZXIgTGlwcG1hbm4iLCJJZGVhbHMgYXJlIGFuIGltYWdpbmF0aXZlIHVuZGVyc3RhbmRpbmcgb2YgdGhhdCB3aGljaCBpcyBkZXNpcmFibGUgaW4gdGhhdCB3aGljaCBpcyBwb3NzaWJsZS4iDQoiQ29uZnVjaXVzIiwiVGhlIHN1cGVyaW9yIG1hbiBpcyBzYXRpc2ZpZWQgYW5kIGNvbXBvc2VkOyB0aGUgbWVhbiBtYW4gaXMgYWx3YXlzIGZ1bGwgb2YgZGlzdHJlc3MuIg0KIkJydWNlIExlZSIsIklmIHlvdSBzcGVuZCB0b28gbXVjaCB0aW1lIHRoaW5raW5nIGFib3V0IGEgdGhpbmcsIHlvdSdsbCBuZXZlciBnZXQgaXQgZG9uZS4iDQoiQnVkZGhhIiwiVGhlIHdheSBpcyBub3QgaW4gdGhlIHNreS4gVGhlIHdheSBpcyBpbiB0aGUgaGVhcnQuIg0KIkFicmFoYW0gTGluY29sbiIsIk1vc3QgcGVvcGxlIGFyZSBhYm91dCBhcyBoYXBweSBhcyB0aGV5IG1ha2UgdXAgdGhlaXIgbWluZHMgdG8gYmUiDQoiQnVkZGhhIiwiVGhyZWUgdGhpbmdzIGNhbm5vdCBiZSBsb25nIGhpZGRlbjogdGhlIHN1biwgdGhlIG1vb24sIGFuZCB0aGUgdHJ1dGguIg0KIkRhbGFpIExhbWEiLCJNb3JlIG9mdGVuIHRoYW4gbm90LCBhbmdlciBpcyBhY3R1YWxseSBhbiBpbmRpY2F0aW9uIG9mIHdlYWtuZXNzIHJhdGhlciB0aGFuIG9mIHN0cmVuZ3RoLiINCiJKaW0gQmVnZ3MiLCJCZWZvcmUgeW91IHB1dCBvbiBhIGZyb3duLCBtYWtlIGFic29sdXRlbHkgc3VyZSB0aGVyZSBhcmUgbm8gc21pbGVzIGF2YWlsYWJsZS4iDQoiRG9uYWxkIEtpcmNoZXIiLCJBIG1hbiBvZiBhYmlsaXR5IGFuZCB0aGUgZGVzaXJlIHRvIGFjY29tcGxpc2ggc29tZXRoaW5nIGNhbiBkbyBhbnl0aGluZy4iDQoiQnVkZGhhIiwiWW91LCB5b3Vyc2VsZiwgYXMgbXVjaCBhcyBhbnlib2R5IGluIHRoZSBlbnRpcmUgdW5pdmVyc2UsIGRlc2VydmUgeW91ciBsb3ZlIGFuZCBhZmZlY3Rpb24uIg0KIkVja2hhcnQgVG9sbGUiLCJJdCBpcyBub3QgdW5jb21tb24gZm9yIHBlb3BsZSB0byBzcGVuZCB0aGVpciB3aG9sZSBsaWZlIHdhaXRpbmcgdG8gc3RhcnQgbGl2aW5nLiINCiJILiBKYWNrc29uIEJyb3duZSIsIkRvbid0IGJlIGFmcmFpZCB0byBnbyBvdXQgb24gYSBsaW1iLiBUaGF0J3Mgd2hlcmUgdGhlIGZydWl0IGlzLiINCiJNYXJxdWlzIFZhdXZlbmFyZ3VlcyIsIldpY2tlZCBwZW9wbGUgYXJlIGFsd2F5cyBzdXJwcmlzZWQgdG8gZmluZCBhYmlsaXR5IGluIHRob3NlIHRoYXQgYXJlIGdvb2QuIg0KIkNoYXJsb3R0ZSBCcm9udGUiLCJMaWZlIGlzIHNvIGNvbnN0cnVjdGVkIHRoYXQgYW4gZXZlbnQgZG9lcyBub3QsIGNhbm5vdCwgd2lsbCBub3QsIG1hdGNoIHRoZSBleHBlY3RhdGlvbi4iDQoiV2F5bmUgRHllciIsIklmIHlvdSBjaGFuZ2UgdGhlIHdheSB5b3UgbG9vayBhdCB0aGluZ3MsIHRoZSB0aGluZ3MgeW91IGxvb2sgYXQgY2hhbmdlLiINCiJOYXBvbGVvbiBIaWxsIiwiTm8gbWFuIGNhbiBzdWNjZWVkIGluIGEgbGluZSBvZiBlbmRlYXZvciB3aGljaCBoZSBkb2VzIG5vdCBsaWtlLiINCiJCdWRkaGEiLCJZb3Ugd2lsbCBub3QgYmUgcHVuaXNoZWQgZm9yIHlvdXIgYW5nZXIsIHlvdSB3aWxsIGJlIHB1bmlzaGVkIGJ5IHlvdXIgYW5nZXIuIg0KIlJvYmVydCBTdGV2ZW5zb24iLCJEb24ndCBqdWRnZSBlYWNoIGRheSBieSB0aGUgaGFydmVzdCB5b3UgcmVhcCBidXQgYnkgdGhlIHNlZWRzIHlvdSBwbGFudC4iDQoiQW5keSBXYXJob2wiLCJUaGV5IHNheSB0aGF0IHRpbWUgY2hhbmdlcyB0aGluZ3MsIGJ1dCB5b3UgYWN0dWFsbHkgaGF2ZSB0byBjaGFuZ2UgdGhlbSB5b3Vyc2VsZi4iDQoiQmVuamFtaW4gRGlzcmFlbGkiLCJOZXZlciBhcG9sb2dpemUgZm9yIHNob3dpbmcgZmVlbGluZ3MuIFdoZW4geW91IGRvIHNvLCB5b3UgYXBvbG9naXplIGZvciB0aGUgdHJ1dGguIg0KIlBlbWEgQ2hvZHJvbiIsIlRoZSB0cnV0aCB5b3UgYmVsaWV2ZSBhbmQgY2xpbmcgdG8gbWFrZXMgeW91IHVuYXZhaWxhYmxlIHRvIGhlYXIgYW55dGhpbmcgbmV3LiINCiJIb3JhY2UiLCJBZHZlcnNpdHkgaGFzIHRoZSBlZmZlY3Qgb2YgZWxpY2l0aW5nIHRhbGVudHMsIHdoaWNoIGluIHByb3NwZXJvdXMgY2lyY3Vtc3RhbmNlcyB3b3VsZCBoYXZlIGxhaW4gZG9ybWFudC4iDQoiTW9ycmlzIFdlc3QiLCJJZiB5b3Ugc3BlbmQgeW91ciB3aG9sZSBsaWZlIHdhaXRpbmcgZm9yIHRoZSBzdG9ybSwgeW91J2xsIG5ldmVyIGVuam95IHRoZSBzdW5zaGluZS4iDQoiRnJhbmtsaW4gUm9vc2V2ZWx0IiwiVGhlIG9ubHkgbGltaXQgdG8gb3VyIHJlYWxpemF0aW9uIG9mIHRvbW9ycm93IHdpbGwgYmUgb3VyIGRvdWJ0cyBvZiB0b2RheS4iDQoiRWR3aW4gQ2hhcGluIiwiRXZlcnkgYWN0aW9uIG9mIG91ciBsaXZlcyB0b3VjaGVzIG9uIHNvbWUgY2hvcmQgdGhhdCB3aWxsIHZpYnJhdGUgaW4gZXRlcm5pdHkuIg0KIkxlcyBCcm93biIsIlNob290IGZvciB0aGUgbW9vbi4gRXZlbiBpZiB5b3UgbWlzcywgeW91J2xsIGxhbmQgYW1vbmcgdGhlIHN0YXJzLiINCiJDb25mdWNpdXMiLCJJdCBkb2VzIG5vdCBtYXR0ZXIgaG93IHNsb3dseSB5b3UgZ28gYXMgbG9uZyBhcyB5b3UgZG8gbm90IHN0b3AuIg0KIiIsIkV2ZXJ5IGRheSBtYXkgbm90IGJlIGdvb2QsIGJ1dCB0aGVyZSdzIHNvbWV0aGluZyBnb29kIGluIGV2ZXJ5IGRheS4iDQoiQWJyYWhhbSBMaW5jb2xuIiwiTW9zdCBmb2xrcyBhcmUgYWJvdXQgYXMgaGFwcHkgYXMgdGhleSBtYWtlIHVwIHRoZWlyIG1pbmRzIHRvIGJlLiINCiJMYW8gVHp1IiwiSWYgeW91IHdvdWxkIHRha2UsIHlvdSBtdXN0IGZpcnN0IGdpdmUsIHRoaXMgaXMgdGhlIGJlZ2lubmluZyBvZiBpbnRlbGxpZ2VuY2UuIg0KIiIsIlNvbWUgcGVvcGxlIHRoaW5rIGl0J3MgaG9sZGluZyB0aGF0IG1ha2VzIG9uZSBzdHJvbmcsIHNvbWV0aW1lcyBpdCdzIGxldHRpbmcgZ28uIg0KIkhhdmVsb2NrIEVsbGlzIiwiSXQgaXMgb24gb3VyIGZhaWx1cmVzIHRoYXQgd2UgYmFzZSBhIG5ldyBhbmQgZGlmZmVyZW50IGFuZCBiZXR0ZXIgc3VjY2Vzcy4iDQoiSm9obiBSdXNraW4iLCJRdWFsaXR5IGlzIG5ldmVyIGFuIGFjY2lkZW50OyBpdCBpcyBhbHdheXMgdGhlIHJlc3VsdCBvZiBpbnRlbGxpZ2VudCBlZmZvcnQuIg0KIkNvbmZ1Y2l1cyIsIlRvIHN0dWR5IGFuZCBub3QgdGhpbmsgaXMgYSB3YXN0ZS4gVG8gdGhpbmsgYW5kIG5vdCBzdHVkeSBpcyBkYW5nZXJvdXMuIg0KIlJhbHBoIEVtZXJzb24iLCJMaWZlIGlzIGEgc3VjY2Vzc2lvbiBvZiBsZXNzb25zLCB3aGljaCBtdXN0IGJlIGxpdmVkIHRvIGJlIHVuZGVyc3Rvb2QuIg0KIlRob21hcyBIYXJkeSIsIlRpbWUgY2hhbmdlcyBldmVyeXRoaW5nIGV4Y2VwdCBzb21ldGhpbmcgd2l0aGluIHVzIHdoaWNoIGlzIGFsd2F5cyBzdXJwcmlzZWQgYnkgY2hhbmdlLiINCiJXYXluZSBEeWVyIiwiWW91IGFyZSBpbXBvcnRhbnQgZW5vdWdoIHRvIGFzayBhbmQgeW91IGFyZSBibGVzc2VkIGVub3VnaCB0byByZWNlaXZlIGJhY2suIg0KIk5hcG9sZW9uIEhpbGwiLCJJZiB5b3UgY2Fubm90IGRvIGdyZWF0IHRoaW5ncywgZG8gc21hbGwgdGhpbmdzIGluIGEgZ3JlYXQgd2F5LiINCiJPcHJhaCBXaW5mcmV5IiwiSWYgeW91IHdhbnQgeW91ciBsaWZlIHRvIGJlIG1vcmUgcmV3YXJkaW5nLCB5b3UgaGF2ZSB0byBjaGFuZ2UgdGhlIHdheSB5b3UgdGhpbmsuIg0KIkJ5cm9uIFB1bHNpZmVyIiwiVHJhbnNmb3JtYXRpb24gZG9lc24ndCB0YWtlIHBsYWNlIHdpdGggYSB2YWN1dW07IGluc3RlYWQsIGl0IG9jY3VycyB3aGVuIHdlIGFyZSBpbmRpcmVjdGx5IGFuZCBkaXJlY3RseSBjb25uZWN0ZWQgdG8gYWxsIHRob3NlIGFyb3VuZCB1cy4iDQoiTGVvbmFyZG8gUnVpeiIsIlRoZSBvbmx5IGRpZmZlcmVuY2UgYmV0d2VlbiB5b3VyIGFiaWxpdGllcyBhbmQgb3RoZXJzIGlzIHRoZSBhYmlsaXR5IHRvIHB1dCB5b3Vyc2VsZiBpbiB0aGVpciBzaG9lcyBhbmQgYWN0dWFsbHkgdHJ5LiINCiJMZW9uIEJsdW0iLCJUaGUgZnJlZSBtYW4gaXMgaGUgd2hvIGRvZXMgbm90IGZlYXIgdG8gZ28gdG8gdGhlIGVuZCBvZiBoaXMgdGhvdWdodC4iDQoiUmFscGggRW1lcnNvbiIsIkdyZWF0IGFyZSB0aGV5IHdobyBzZWUgdGhhdCBzcGlyaXR1YWwgaXMgc3Ryb25nZXIgdGhhbiBhbnkgbWF0ZXJpYWwgZm9yY2UsIHRoYXQgdGhvdWdodHMgcnVsZSB0aGUgd29ybGQuIg0KIkJlcm5hcmQgU2hhdyIsIkEgbGlmZSBzcGVudCBtYWtpbmcgbWlzdGFrZXMgaXMgbm90IG9ubHkgbW9yZSBob25vdXJhYmxlIGJ1dCBtb3JlIHVzZWZ1bCB0aGFuIGEgbGlmZSBzcGVudCBpbiBkb2luZyBub3RoaW5nLiINCiJMYW8gVHp1IiwiVGhlIHdpc2UgbWFuIGRvZXMgbm90IGxheSB1cCBoaXMgb3duIHRyZWFzdXJlcy4gVGhlIG1vcmUgaGUgZ2l2ZXMgdG8gb3RoZXJzLCB0aGUgbW9yZSBoZSBoYXMgZm9yIGhpcyBvd24uIg0KIkNoYXJsZXMgRGlja2VucyIsIkRvbid0IGxlYXZlIGEgc3RvbmUgdW50dXJuZWQuIEl0J3MgYWx3YXlzIHNvbWV0aGluZywgdG8ga25vdyB5b3UgaGF2ZSBkb25lIHRoZSBtb3N0IHlvdSBjb3VsZC4iDQoiRGFsYWkgTGFtYSIsIkJ5IGdvaW5nIGJleW9uZCB5b3VyIG93biBwcm9ibGVtcyBhbmQgdGFraW5nIGNhcmUgb2Ygb3RoZXJzLCB5b3UgZ2FpbiBpbm5lciBzdHJlbmd0aCwgc2VsZi1jb25maWRlbmNlLCBjb3VyYWdlLCBhbmQgYSBncmVhdGVyIHNlbnNlIG9mIGNhbG0uIg0KIlNhbSBLZWVuIiwiV2UgY29tZSB0byBsb3ZlIG5vdCBieSBmaW5kaW5nIGEgcGVyZmVjdCBwZXJzb24sIGJ1dCBieSBsZWFybmluZyB0byBzZWUgYW4gaW1wZXJmZWN0IHBlcnNvbiBwZXJmZWN0bHkuIg0KIldhbHQgRW1lcnNvbiIsIldoYXQgbGllcyBiZWhpbmQgdXMgYW5kIHdoYXQgbGllcyBiZWZvcmUgdXMgYXJlIHRpbnkgbWF0dGVycyBjb21wYXJlZCB0byB3aGF0IGxpZXMgd2l0aGluIHVzLiINCiJKb2huIEFzdGluIiwiVGhlcmUgYXJlIHRoaW5ncyBzbyBkZWVwIGFuZCBjb21wbGV4IHRoYXQgb25seSBpbnR1aXRpb24gY2FuIHJlYWNoIGl0IGluIG91ciBzdGFnZSBvZiBkZXZlbG9wbWVudCBhcyBodW1hbiBiZWluZ3MuIg0KIkVsYmVydCBIdWJiYXJkIiwiQSBsaXR0bGUgbW9yZSBwZXJzaXN0ZW5jZSwgYSBsaXR0bGUgbW9yZSBlZmZvcnQsIGFuZCB3aGF0IHNlZW1lZCBob3BlbGVzcyBmYWlsdXJlIG1heSB0dXJuIHRvIGdsb3Jpb3VzIHN1Y2Nlc3MuIg0KIkhlbnJ5IE1vb3JlIiwiVGhlcmUgaXMgbm8gcmV0aXJlbWVudCBmb3IgYW4gYXJ0aXN0LCBpdCdzIHlvdXIgd2F5IG9mIGxpdmluZyBzbyB0aGVyZSBpcyBubyBlbmQgdG8gaXQuIg0KIkNvbmZ1Y2l1cyIsIkkgd2lsbCBub3QgYmUgY29uY2VybmVkIGF0IG90aGVyIG1lbiBpcyBub3Qga25vd2luZyBtZTtJIHdpbGwgYmUgY29uY2VybmVkIGF0IG15IG93biB3YW50IG9mIGFiaWxpdHkuIg0KIiIsIldoeSB3b3JyeSBhYm91dCB0aGluZ3MgeW91IGNhbid0IGNvbnRyb2wgd2hlbiB5b3UgY2FuIGtlZXAgeW91cnNlbGYgYnVzeSBjb250cm9sbGluZyB0aGUgdGhpbmdzIHRoYXQgZGVwZW5kIG9uIHlvdT8iDQoiTGFvemkiLCJXaGVuIHlvdSBhcmUgY29udGVudCB0byBiZSBzaW1wbHkgeW91cnNlbGYgYW5kIGRvbid0IGNvbXBhcmUgb3IgY29tcGV0ZSwgZXZlcnlib2R5IHdpbGwgcmVzcGVjdCB5b3UuIg0KIldpbGxpYW0gU2hha2VzcGVhcmUiLCJCZSBub3QgYWZyYWlkIG9mIGdyZWF0bmVzczogc29tZSBhcmUgYm9ybiBncmVhdCwgc29tZSBhY2hpZXZlIGdyZWF0bmVzcywgYW5kIHNvbWUgaGF2ZSBncmVhdG5lc3MgdGhydXN0IHVwb24gdGhlbS4iDQoiR2VvcmdlIFNoZWVoYW4iLCJTdWNjZXNzIG1lYW5zIGhhdmluZyB0aGUgY291cmFnZSwgdGhlIGRldGVybWluYXRpb24sIGFuZCB0aGUgd2lsbCB0byBiZWNvbWUgdGhlIHBlcnNvbiB5b3UgYmVsaWV2ZSB5b3Ugd2VyZSBtZWFudCB0byBiZS4iDQoiVGhvbWFzIEplZmZlcnNvbiIsIkRvIHlvdSB3YW50IHRvIGtub3cgd2hvIHlvdSBhcmU/IERvbid0IGFzay4gQWN0ISBBY3Rpb24gd2lsbCBkZWxpbmVhdGUgYW5kIGRlZmluZSB5b3UuIg0KIkFudG9pbmUgZGUgU2FpbnQtRXh1cGVyeSIsIkl0IGlzIG9ubHkgd2l0aCB0aGUgaGVhcnQgdGhhdCBvbmUgY2FuIHNlZSByaWdodGx5LCB3aGF0IGlzIGVzc2VudGlhbCBpcyBpbnZpc2libGUgdG8gdGhlIGV5ZS4iDQoiTWFyY2VsIFByb3VzdCIsIkxldCB1cyBiZSBncmF0ZWZ1bCB0byBwZW9wbGUgd2hvIG1ha2UgdXMgaGFwcHk7IHRoZXkgYXJlIHRoZSBjaGFybWluZyBnYXJkZW5lcnMgd2hvIG1ha2Ugb3VyIHNvdWxzIGJsb3Nzb20uIg0KIkVwaWN0ZXR1cyIsIk1ha2UgdGhlIGJlc3QgdXNlIG9mIHdoYXQgaXMgaW4geW91ciBwb3dlciwgYW5kIHRha2UgdGhlIHJlc3QgYXMgaXQgaGFwcGVucy4iDQoiTG91aXNlIEhheSIsIlRoZSB0aG91Z2h0cyB3ZSBjaG9vc2UgdG8gdGhpbmsgYXJlIHRoZSB0b29scyB3ZSB1c2UgdG8gcGFpbnQgdGhlIGNhbnZhcyBvZiBvdXIgbGl2ZXMuIg0KIlcuIENsZW1lbnQgU3RvbmUiLCJObyBtYXR0ZXIgaG93IGNhcmVmdWxseSB5b3UgcGxhbiB5b3VyIGdvYWxzIHRoZXkgd2lsbCBuZXZlciBiZSBtb3JlIHRoYXQgcGlwZSBkcmVhbXMgdW5sZXNzIHlvdSBwdXJzdWUgdGhlbSB3aXRoIGd1c3RvLiINCiJSb2JlcnQgTWNLYWluIiwiVGhlIHJlYXNvbiBtb3N0IGdvYWxzIGFyZSBub3QgYWNoaWV2ZWQgaXMgdGhhdCB3ZSBzcGVuZCBvdXIgdGltZSBkb2luZyBzZWNvbmQgdGhpbmdzIGZpcnN0LiINCiJKb2huIFF1aW5jeSBBZGFtcyIsIklmIHlvdXIgYWN0aW9ucyBpbnNwaXJlIG90aGVycyB0byBkcmVhbSBtb3JlLCBsZWFybiBtb3JlLCBkbyBtb3JlIGFuZCBiZWNvbWUgbW9yZSwgeW91IGFyZSBhIGxlYWRlci4iDQoiVGhvbWFzIEplZmZlcnNvbiIsIkknbSBhIGdyZWF0IGJlbGlldmVyIGluIGx1Y2sgYW5kIEkgZmluZCB0aGUgaGFyZGVyIEkgd29yaywgdGhlIG1vcmUgSSBoYXZlIG9mIGl0LiINCiJSYWxwaCBFbWVyc29uIiwiRG8gbm90IHdhc3RlIHlvdXJzZWxmIGluIHJlamVjdGlvbiwgbm9yIGJhcmsgYWdhaW5zdCB0aGUgYmFkLCBidXQgY2hhbnQgdGhlIGJlYXV0eSBvZiB0aGUgZ29vZC4iDQoiSm9oYW5uIFdvbGZnYW5nIHZvbiBHb2V0aGUiLCJUaGUgcGVyc29uIGJvcm4gd2l0aCBhIHRhbGVudCB0aGV5IGFyZSBtZWFudCB0byB1c2Ugd2lsbCBmaW5kIHRoZWlyIGdyZWF0ZXN0IGhhcHBpbmVzcyBpbiB1c2luZyBpdC4iDQoiV2lsbGlhbSBTYXJveWFuIiwiR29vZCBwZW9wbGUgYXJlIGdvb2QgYmVjYXVzZSB0aGV5J3ZlIGNvbWUgdG8gd2lzZG9tIHRocm91Z2ggZmFpbHVyZS4gV2UgZ2V0IHZlcnkgbGl0dGxlIHdpc2RvbSBmcm9tIHN1Y2Nlc3MsIHlvdSBrbm93LiINCiJCeXJvbiBQdWxzaWZlciIsIllvdXIgZGVzdGlueSBpc24ndCBqdXN0IGZhdGU7IGl0IGlzIGhvdyB5b3UgdXNlIHlvdXIgb3duIGRldmVsb3BlZCBhYmlsaXRpZXMgdG8gZ2V0IHdoYXQgeW91IHdhbnQuIg0KIkxlb25hcmRvIGRhIFZpbmNpIiwiSXJvbiBydXN0cyBmcm9tIGRpc3VzZTsgd2F0ZXIgbG9zZXMgaXRzIHB1cml0eSBmcm9tIHN0YWduYXRpb24uLi4gZXZlbiBzbyBkb2VzIGluYWN0aW9uIHNhcCB0aGUgdmlnb3VyIG9mIHRoZSBtaW5kLiINCiJJc2FhYyBBc2ltb3YiLCJBIHN1YnRsZSB0aG91Z2h0IHRoYXQgaXMgaW4gZXJyb3IgbWF5IHlldCBnaXZlIHJpc2UgdG8gZnJ1aXRmdWwgaW5xdWlyeSB0aGF0IGNhbiBlc3RhYmxpc2ggdHJ1dGhzIG9mIGdyZWF0IHZhbHVlLiINCiJIZW5yeSBWYW4gRHlrZSIsIkJlIGdsYWQgb2YgbGlmZSBiZWNhdXNlIGl0IGdpdmVzIHlvdSB0aGUgY2hhbmNlIHRvIGxvdmUsIHRvIHdvcmssIHRvIHBsYXksIGFuZCB0byBsb29rIHVwIGF0IHRoZSBzdGFycy4iDQoiWW9naSBCZXJyYSIsIllvdSBnb3QgdG8gYmUgY2FyZWZ1bCBpZiB5b3UgZG9uJ3Qga25vdyB3aGVyZSB5b3UncmUgZ29pbmcsIGJlY2F1c2UgeW91IG1pZ2h0IG5vdCBnZXQgdGhlcmUuIg0KIk5hZ3VpYiBNYWhmb3V6IiwiWW91IGNhbiB0ZWxsIHdoZXRoZXIgYSBtYW4gaXMgY2xldmVyIGJ5IGhpcyBhbnN3ZXJzLiBZb3UgY2FuIHRlbGwgd2hldGhlciBhIG1hbiBpcyB3aXNlIGJ5IGhpcyBxdWVzdGlvbnMuIg0KIkFudGhvbnkgUm9iYmlucyIsIkxpZmUgaXMgYSBnaWZ0LCBhbmQgaXQgb2ZmZXJzIHVzIHRoZSBwcml2aWxlZ2UsIG9wcG9ydHVuaXR5LCBhbmQgcmVzcG9uc2liaWxpdHkgdG8gZ2l2ZSBzb21ldGhpbmcgYmFjayBieSBiZWNvbWluZyBtb3JlIg0KIkpvaG4gV29vZGVuIiwiWW91IGNhbid0IGxldCBwcmFpc2Ugb3IgY3JpdGljaXNtIGdldCB0byB5b3UuIEl0J3MgYSB3ZWFrbmVzcyB0byBnZXQgY2F1Z2h0IHVwIGluIGVpdGhlciBvbmUuIg0KIk9nIE1hbmRpbm8iLCJJIHdpbGwgbG92ZSB0aGUgbGlnaHQgZm9yIGl0IHNob3dzIG1lIHRoZSB3YXksIHlldCBJIHdpbGwgZW5kdXJlIHRoZSBkYXJrbmVzcyBiZWNhdXNlIGl0IHNob3dzIG1lIHRoZSBzdGFycy4iDQoiSmFuZSBBZGRhbXMiLCJPdXIgZG91YnRzIGFyZSB0cmFpdG9ycyBhbmQgbWFrZSB1cyBsb3NlIHRoZSBnb29kIHdlIG9mdGVuIG1pZ2h0IHdpbiwgYnkgZmVhcmluZyB0byBhdHRlbXB0LiINCiJUaG9tYXMgQ2FybHlsZSIsIkJ5IG5hdHVyZSBtYW4gaGF0ZXMgY2hhbmdlOyBzZWxkb20gd2lsbCBoZSBxdWl0IGhpcyBvbGQgaG9tZSB0aWxsIGl0IGhhcyBhY3R1YWxseSBmYWxsZW4gYXJvdW5kIGhpcyBlYXJzLiINCiJNLiBTY290dCBQZWNrIiwiVW50aWwgeW91IHZhbHVlIHlvdXJzZWxmLCB5b3Ugd29uJ3QgdmFsdWUgeW91ciB0aW1lLiBVbnRpbCB5b3UgdmFsdWUgeW91ciB0aW1lLCB5b3Ugd29uJ3QgZG8gYW55dGhpbmcgd2l0aCBpdC4iDQoiTWF1cmVlbiBEb3dkIiwiVGhlIG1pbnV0ZSB5b3Ugc2V0dGxlIGZvciBsZXNzIHRoYW4geW91IGRlc2VydmUsIHlvdSBnZXQgZXZlbiBsZXNzIHRoYW4geW91IHNldHRsZWQgZm9yLiINCiJDaGFybGVzIERhcndpbiIsIlRoZSBoaWdoZXN0IHN0YWdlIGluIG1vcmFsIHVyZSBhdCB3aGljaCB3ZSBjYW4gYXJyaXZlIGlzIHdoZW4gd2UgcmVjb2duaXplIHRoYXQgd2Ugb3VnaHQgdG8gY29udHJvbCBvdXIgdGhvdWdodHMuIg0KIiIsIkl0IGlzIGJldHRlciB0byB0YWtlIG1hbnkgc21hbGwgc3RlcHMgaW4gdGhlIHJpZ2h0IGRpcmVjdGlvbiB0aGFuIHRvIG1ha2UgYSBncmVhdCBsZWFwIGZvcndhcmQgb25seSB0byBzdHVtYmxlIGJhY2t3YXJkLiINCiJEYWxhaSBMYW1hIiwiSWYgd2UgaGF2ZSBhIHBvc2l0aXZlIG1lbnRhbCBhdHRpdHVkZSwgdGhlbiBldmVuIHdoZW4gc3Vycm91bmRlZCBieSBob3N0aWxpdHksIHdlIHNoYWxsIG5vdCBsYWNrIGlubmVyIHBlYWNlLiINCiJDaHJpc3RvcGhlciBNb3JsZXkiLCJUaGVyZSBpcyBvbmx5IG9uZSBzdWNjZXNzLCB0byBiZSBhYmxlIHRvIHNwZW5kIHlvdXIgbGlmZSBpbiB5b3VyIG93biB3YXkuIg0KIkhhbm5haCBBcmVuZHQiLCJQcm9taXNlcyBhcmUgdGhlIHVuaXF1ZWx5IGh1bWFuIHdheSBvZiBvcmRlcmluZyB0aGUgZnV0dXJlLCBtYWtpbmcgaXQgcHJlZGljdGFibGUgYW5kIHJlbGlhYmxlIHRvIHRoZSBleHRlbnQgdGhhdCB0aGlzIGlzIGh1bWFubHkgcG9zc2libGUuIg0KIkFsYW4gQ29oZW4iLCJBcHByZWNpYXRpb24gaXMgdGhlIGhpZ2hlc3QgZm9ybSBvZiBwcmF5ZXIsIGZvciBpdCBhY2tub3dsZWRnZXMgdGhlIHByZXNlbmNlIG9mIGdvb2Qgd2hlcmV2ZXIgeW91IHNoaW5lIHRoZSBsaWdodCBvZiB5b3VyIHRoYW5rZnVsIHRob3VnaHRzLiINCiJBbGRvdXMgSHV4bGV5IiwiVGhlcmUgaXMgb25seSBvbmUgY29ybmVyIG9mIHRoZSB1bml2ZXJzZSB5b3UgY2FuIGJlIGNlcnRhaW4gb2YgaW1wcm92aW5nLCBhbmQgdGhhdCdzIHlvdXIgb3duIHNlbGYuIg0KIk1hcmlhbiBFZGVsbWFuIiwiWW91J3JlIG5vdCBvYmxpZ2F0ZWQgdG8gd2luLiBZb3UncmUgb2JsaWdhdGVkIHRvIGtlZXAgdHJ5aW5nIHRvIGRvIHRoZSBiZXN0IHlvdSBjYW4gZXZlcnkgZGF5LiINCiJCeXJvbiBQdWxzaWZlciIsIkV2ZXJ5b25lIGNhbiB0YXN0ZSBzdWNjZXNzIHdoZW4gdGhlIGdvaW5nIGlzIGVhc3ksIGJ1dCBmZXcga25vdyBob3cgdG8gdGFzdGUgdmljdG9yeSB3aGVuIHRpbWVzIGdldCB0b3VnaC4iDQoiU3VlIFBhdHRvbiBUaG9lbGUiLCJEZWVwIGxpc3RlbmluZyBpcyBtaXJhY3Vsb3VzIGZvciBib3RoIGxpc3RlbmVyIGFuZCBzcGVha2VyLldoZW4gc29tZW9uZSByZWNlaXZlcyB1cyB3aXRoIG9wZW4taGVhcnRlZCwgbm9uLWp1ZGdpbmcsIGludGVuc2VseSBpbnRlcmVzdGVkIGxpc3RlbmluZywgb3VyIHNwaXJpdHMgZXhwYW5kLiINCiJGcmFuayBDcmFuZSIsIllvdSBtYXkgYmUgZGVjZWl2ZWQgaWYgeW91IHRydXN0IHRvbyBtdWNoLCBidXQgeW91IHdpbGwgbGl2ZSBpbiB0b3JtZW50IGlmIHlvdSBkb24ndCB0cnVzdCBlbm91Z2guIg0KIkxhbyBUenUiLCJHcmVhdCBpbmRlZWQgaXMgdGhlIHN1YmxpbWl0eSBvZiB0aGUgQ3JlYXRpdmUsIHRvIHdoaWNoIGFsbCBiZWluZ3Mgb3dlIHRoZWlyIGJlZ2lubmluZyBhbmQgd2hpY2ggcGVybWVhdGVzIGFsbCBoZWF2ZW4uIg0KIkthdGhsZWVuIE5vcnJpcyIsIkFsbCB0aGF0IGlzIG5lY2Vzc2FyeSBpcyB0byBhY2NlcHQgdGhlIGltcG9zc2libGUsIGRvIHdpdGhvdXQgdGhlIGluZGlzcGVuc2FibGUsIGFuZCBiZWFyIHRoZSBpbnRvbGVyYWJsZS4iDQoiQ29uZnVjaXVzIiwiQ2hvb3NlIGEgam9iIHlvdSBsb3ZlLCBhbmQgeW91IHdpbGwgbmV2ZXIgaGF2ZSB0byB3b3JrIGEgZGF5IGluIHlvdXIgbGlmZS4iDQoiRWNraGFydCBUb2xsZSIsIllvdSBjYW5ub3QgZmluZCB5b3Vyc2VsZiBieSBnb2luZyBpbnRvIHRoZSBwYXN0LiBZb3UgY2FuIGZpbmQgeW91cnNlbGYgYnkgY29taW5nIGludG8gdGhlIHByZXNlbnQuIg0KIkFubmUgQnJvbnRlIiwiQWxsIG91ciB0YWxlbnRzIGluY3JlYXNlIGluIHRoZSB1c2luZywgYW5kIHRoZSBldmVyeSBmYWN1bHR5LCBib3RoIGdvb2QgYW5kIGJhZCwgc3RyZW5ndGhlbiBieSBleGVyY2lzZS4iDQoiUmljaGFyZCBCYWNoIiwiSW4gb3JkZXIgdG8gbGl2ZSBmcmVlIGFuZCBoYXBwaWx5IHlvdSBtdXN0IHNhY3JpZmljZSBib3JlZG9tLiBJdCBpcyBub3QgYWx3YXlzIGFuIGVhc3kgc2FjcmlmaWNlLiINCiJEZXNpZGVyaXVzIEVyYXNtdXMiLCJUaGUgZm94IGhhcyBtYW55IHRyaWNrcy4gVGhlIGhlZGdlaG9nIGhhcyBidXQgb25lLiBCdXQgdGhhdCBpcyB0aGUgYmVzdCBvZiBhbGwuIg0KIkFydGh1ciBSdWJpbnN0ZWluIiwiT2YgY291cnNlIHRoZXJlIGlzIG5vIGZvcm11bGEgZm9yIHN1Y2Nlc3MgZXhjZXB0IHBlcmhhcHMgYW4gdW5jb25kaXRpb25hbCBhY2NlcHRhbmNlIG9mIGxpZmUgYW5kIHdoYXQgaXQgYnJpbmdzLiINCiJMb3VpcyBQYXN0ZXVyIiwiTGV0IG1lIHRlbGwgeW91IHRoZSBzZWNyZXQgdGhhdCBoYXMgbGVkIG1lIHRvIG15IGdvYWw6IG15IHN0cmVuZ3RoIGxpZXMgc29sZWx5IGluIG15IHRlbmFjaXR5Ig0KIlJ1bWkiLCJTb21ldGhpbmcgb3BlbnMgb3VyIHdpbmdzLiBTb21ldGhpbmcgbWFrZXMgYm9yZWRvbSBhbmQgaHVydCBkaXNhcHBlYXIuIFNvbWVvbmUgZmlsbHMgdGhlIGN1cCBpbiBmcm9udCBvZiB1czogV2UgdGFzdGUgb25seSBzYWNyZWRuZXNzLiINCiJTb2d5YWwgUmlucG9jaGUiLCJXZSBtdXN0IG5ldmVyIGZvcmdldCB0aGF0IGl0IGlzIHRocm91Z2ggb3VyIGFjdGlvbnMsIHdvcmRzLCBhbmQgdGhvdWdodHMgdGhhdCB3ZSBoYXZlIGEgY2hvaWNlLiINCiJEZW5uaXMgS2ltYnJvIiwiV2Ugc2VlIHRoaW5ncyBub3QgYXMgdGhleSBhcmUsIGJ1dCBhcyB3ZSBhcmUuIE91ciBwZXJjZXB0aW9uIGlzIHNoYXBlZCBieSBvdXIgcHJldmlvdXMgZXhwZXJpZW5jZXMuIg0KIldpbGxpYW0gUGVubiIsIlRydWUgc2lsZW5jZSBpcyB0aGUgcmVzdCBvZiB0aGUgbWluZDsgaXQgaXMgdG8gdGhlIHNwaXJpdCB3aGF0IHNsZWVwIGlzIHRvIHRoZSBib2R5LCBub3VyaXNobWVudCBhbmQgcmVmcmVzaG1lbnQuIg0KIkltbWFudWVsIEthbnQiLCJBbGwgb3VyIGtub3dsZWRnZSBiZWdpbnMgd2l0aCB0aGUgc2Vuc2VzLCBwcm9jZWVkcyB0aGVuIHRvIHRoZSB1bmRlcnN0YW5kaW5nLCBhbmQgZW5kcyB3aXRoIHJlYXNvbi4gVGhlcmUgaXMgbm90aGluZyBoaWdoZXIgdGhhbiByZWFzb24uIg0KIkJ1ZGRoYSIsIlRoZSB0aG91Z2h0IG1hbmlmZXN0cyBhcyB0aGUgd29yZC4gVGhlIHdvcmQgbWFuaWZlc3RzIGFzIHRoZSBkZWVkLiBUaGUgZGVlZCBkZXZlbG9wcyBpbnRvIGhhYml0LiBBbmQgdGhlIGhhYml0IGhhcmRlbnMgaW50byBjaGFyYWN0ZXIuIg0KIiIsIkFzIHRoZSByZXN0IG9mIHRoZSB3b3JsZCBpcyB3YWxraW5nIG91dCB0aGUgZG9vciwgeW91ciBiZXN0IGZyaWVuZHMgYXJlIHRoZSBvbmVzIHdhbGtpbmcgaW4uIg0KIkJ5cm9uIFB1bHNpZmVyIiwiUGF0aWVuY2UgaXMgYSB2aXJ0dWUgYnV0IHlvdSB3aWxsIG5ldmVyIGV2ZXIgYWNjb21wbGlzaCBhbnl0aGluZyBpZiB5b3UgZG9uJ3QgZXhlcmNpc2UgYWN0aW9uIG92ZXIgcGF0aWVuY2UuIg0KIlJvYmVydCBMeW5kIiwiQW55IG9mIHVzIGNhbiBhY2hpZXZlIHZpcnR1ZSwgaWYgYnkgdmlydHVlIHdlIG1lcmVseSBtZWFuIHRoZSBhdm9pZGFuY2Ugb2YgdGhlIHZpY2VzIHRoYXQgZG8gbm90IGF0dHJhY3QgdXMuIg0KIlJhbHBoIEVtZXJzb24iLCJJZiB0aGUgc2luZ2xlIG1hbiBwbGFudCBoaW1zZWxmIGluZG9taXRhYmx5IG9uIGhpcyBpbnN0aW5jdHMsIGFuZCB0aGVyZSBhYmlkZSwgdGhlIGh1Z2Ugd29ybGQgd2lsbCBjb21lIHJvdW5kIHRvIGhpbS4iDQoiRG9uYWxkIFRydW1wIiwiTW9uZXkgd2FzIG5ldmVyIGEgYmlnIG1vdGl2YXRpb24gZm9yIG1lLCBleGNlcHQgYXMgYSB3YXkgdG8ga2VlcCBzY29yZS4gVGhlIHJlYWwgZXhjaXRlbWVudCBpcyBwbGF5aW5nIHRoZSBnYW1lLiINCiJFbGVhbm9yIFJvb3NldmVsdCIsIkZyaWVuZHNoaXAgd2l0aCBvbmVzZWxmIGlzIGFsbCBpbXBvcnRhbnQgYmVjYXVzZSB3aXRob3V0IGl0IG9uZSBjYW5ub3QgYmUgZnJpZW5kcyB3aXRoIGFueWJvZHkgZWxzZSBpbiB0aGUgd29ybGQuIg0KIlJvYmVydCBGdWxnaHVtIiwiUGVhY2UgaXMgbm90IHNvbWV0aGluZyB5b3Ugd2lzaCBmb3IuIEl0J3Mgc29tZXRoaW5nIHlvdSBtYWtlLCBzb21ldGhpbmcgeW91IGRvLCBzb21ldGhpbmcgeW91IGFyZSwgYW5kIHNvbWV0aGluZyB5b3UgZ2l2ZSBhd2F5LiINCiJCcnVjZSBMZWUiLCJBIHdpc2UgbWFuIGNhbiBsZWFybiBtb3JlIGZyb20gYSBmb29saXNoIHF1ZXN0aW9uIHRoYW4gYSBmb29sIGNhbiBsZWFybiBmcm9tIGEgd2lzZSBhbnN3ZXIuIg0KIkFydGh1ciBTY2hvcGVuaGF1ZXIiLCJFdmVyeSBtYW4gdGFrZXMgdGhlIGxpbWl0cyBvZiBoaXMgb3duIGZpZWxkIG9mIHZpc2lvbiBmb3IgdGhlIGxpbWl0cyBvZiB0aGUgd29ybGQuIg0KIkFuZHJlIEdpZGUiLCJPbmUgZG9lcyBub3QgZGlzY292ZXIgbmV3IGxhbmRzIHdpdGhvdXQgY29uc2VudGluZyB0byBsb3NlIHNpZ2h0IG9mIHRoZSBzaG9yZSBmb3IgYSB2ZXJ5IGxvbmcgdGltZS4iDQoiU2FpIEJhYmEiLCJXaGF0IGlzIG5ldyBpbiB0aGUgd29ybGQ/IE5vdGhpbmcuIFdoYXQgaXMgb2xkIGluIHRoZSB3b3JsZD8gTm90aGluZy4gRXZlcnl0aGluZyBoYXMgYWx3YXlzIGJlZW4gYW5kIHdpbGwgYWx3YXlzIGJlLiINCiJEYWxhaSBMYW1hIiwiR2VudWluZSBsb3ZlIHNob3VsZCBmaXJzdCBiZSBkaXJlY3RlZCBhdCBvbmVzZWxmLiBpZiB3ZSBkbyBub3QgbG92ZSBvdXJzZWx2ZXMsIGhvdyBjYW4gd2UgbG92ZSBvdGhlcnM/Ig0KIlRvbSBMZWhyZXIiLCJMaWZlIGlzIGxpa2UgYSBzZXdlci4gV2hhdCB5b3UgZ2V0IG91dCBvZiBpdCBkZXBlbmRzIG9uIHdoYXQgeW91IHB1dCBpbnRvIGl0LiINCiJCcnVjZSBMZWUiLCJOb3RpY2UgdGhhdCB0aGUgc3RpZmZlc3QgdHJlZSBpcyBtb3N0IGVhc2lseSBjcmFja2VkLCB3aGlsZSB0aGUgYmFtYm9vIG9yIHdpbGxvdyBzdXJ2aXZlcyBieSBiZW5kaW5nIHdpdGggdGhlIHdpbmQuIg0KIkFsZnJlZCBTaGVpbndvbGQiLCJMZWFybiBhbGwgeW91IGNhbiBmcm9tIHRoZSBtaXN0YWtlcyBvZiBvdGhlcnMuIFlvdSB3b24ndCBoYXZlIHRpbWUgdG8gbWFrZSB0aGVtIGFsbCB5b3Vyc2VsZi4iDQoiU3JpIENoaW5tb3kiLCJKdWRnZSBub3RoaW5nLCB5b3Ugd2lsbCBiZSBoYXBweS4gRm9yZ2l2ZSBldmVyeXRoaW5nLCB5b3Ugd2lsbCBiZSBoYXBwaWVyLiBMb3ZlIGV2ZXJ5dGhpbmcsIHlvdSB3aWxsIGJlIGhhcHBpZXN0LiINCiJKb2hhbm4gV29sZmdhbmcgdm9uIEdvZXRoZSIsIlBlb3BsZSBhcmUgc28gY29uc3RpdHV0ZWQgdGhhdCBldmVyeWJvZHkgd291bGQgcmF0aGVyIHVuZGVydGFrZSB3aGF0IHRoZXkgc2VlIG90aGVycyBkbywgd2hldGhlciB0aGV5IGhhdmUgYW4gYXB0aXR1ZGUgZm9yIGl0IG9yIG5vdC4iDQoiSmFtZXMgRnJlZW1hbiBDbGFya2UiLCJXZSBhcmUgZWl0aGVyIHByb2dyZXNzaW5nIG9yIHJldHJvZ3JhZGluZyBhbGwgdGhlIHdoaWxlLiBUaGVyZSBpcyBubyBzdWNoIHRoaW5nIGFzIHJlbWFpbmluZyBzdGF0aW9uYXJ5IGluIHRoaXMgbGlmZS4iDQoiQW5haXMgTmluIiwiVGhlIHBvc3Nlc3Npb24gb2Yga25vd2xlZGdlIGRvZXMgbm90IGtpbGwgdGhlIHNlbnNlIG9mIHdvbmRlciBhbmQgbXlzdGVyeS4gVGhlcmUgaXMgYWx3YXlzIG1vcmUgbXlzdGVyeS4iDQoiTWFyY3VzIEF1cmVsaXVzIiwiRXZlcnl0aGluZyB0aGF0IGhhcHBlbnMgaGFwcGVucyBhcyBpdCBzaG91bGQsIGFuZCBpZiB5b3Ugb2JzZXJ2ZSBjYXJlZnVsbHksIHlvdSB3aWxsIGZpbmQgdGhpcyB0byBiZSBzby4iDQoiV2F5bmUgRHllciIsIldoYXQgd2UgdGhpbmsgZGV0ZXJtaW5lcyB3aGF0IGhhcHBlbnMgdG8gdXMsIHNvIGlmIHdlIHdhbnQgdG8gY2hhbmdlIG91ciBsaXZlcywgd2UgbmVlZCB0byBzdHJldGNoIG91ciBtaW5kcy4iDQoiQnVkZGhhIiwiSW4gYSBjb250cm92ZXJzeSB0aGUgaW5zdGFudCB3ZSBmZWVsIGFuZ2VyIHdlIGhhdmUgYWxyZWFkeSBjZWFzZWQgc3RyaXZpbmcgZm9yIHRoZSB0cnV0aCwgYW5kIGhhdmUgYmVndW4gc3RyaXZpbmcgZm9yIG91cnNlbHZlcy4iDQoiU3lkbmV5IFNtaXRoIiwiSXQgaXMgdGhlIGdyZWF0ZXN0IG9mIGFsbCBtaXN0YWtlcyB0byBkbyBub3RoaW5nIGJlY2F1c2UgeW91IGNhbiBvbmx5IGRvIGxpdHRsZSwgZG8gd2hhdCB5b3UgY2FuLiINCiJDb25mdWNpdXMiLCJXaGVuIHlvdSBzZWUgYSBtYW4gb2Ygd29ydGgsIHRoaW5rIG9mIGhvdyB5b3UgbWF5IGVtdWxhdGUgaGltLiBXaGVuIHlvdSBzZWUgb25lIHdobyBpcyB1bndvcnRoeSwgZXhhbWluZSB5b3Vyc2VsZi4iDQoiTWFyeSBLYXkgQXNoIiwiQWVyb2R5bmFtaWNhbGx5IHRoZSBidW1ibGViZWUgc2hvdWxkbid0IGJlIGFibGUgdG8gZmx5LCBidXQgdGhlIGJ1bWJsZWJlZSBkb2Vzbid0IGtub3cgdGhhdCBzbyBpdCBnb2VzIG9uIGZseWluZyBhbnl3YXkuIg0KIkxsb3lkIEpvbmVzIiwiVGhvc2Ugd2hvIHRyeSB0byBkbyBzb21ldGhpbmcgYW5kIGZhaWwgYXJlIGluZmluaXRlbHkgYmV0dGVyIHRoYW4gdGhvc2Ugd2hvIHRyeSBub3RoaW5nIGFuZCBzdWNjZWVkLiINCiJWaXN0YSBLZWxseSIsIlNub3dmbGFrZXMgYXJlIG9uZSBvZiBuYXR1cmVzIG1vc3QgZnJhZ2lsZSB0aGluZ3MsIGJ1dCBqdXN0IGxvb2sgd2hhdCB0aGV5IGNhbiBkbyB3aGVuIHRoZXkgc3RpY2sgdG9nZXRoZXIuIg0KIkJlbiBTdGVpbiIsIlRoZSBmaXJzdCBzdGVwIHRvIGdldHRpbmcgdGhlIHRoaW5ncyB5b3Ugd2FudCBvdXQgb2YgbGlmZSBpcyB0aGlzOiBkZWNpZGUgd2hhdCB5b3Ugd2FudC4iDQoiIiwiV2h5IGNvbXBhcmUgeW91cnNlbGYgd2l0aCBvdGhlcnM/IE5vIG9uZSBpbiB0aGUgZW50aXJlIHdvcmxkIGNhbiBkbyBhIGJldHRlciBqb2Igb2YgYmVpbmcgeW91IHRoYW4geW91LiINCiJBbGRvdXMgSHV4bGV5IiwiRXhwZXJpZW5jZSBpcyBub3Qgd2hhdCBoYXBwZW5zIHRvIGEgbWFuLiBJdCBpcyB3aGF0IGEgbWFuIGRvZXMgd2l0aCB3aGF0IGhhcHBlbnMgdG8gaGltLiINCiIiLCJBIGdvb2QgdGVhY2hlciBpcyBsaWtlIGEgY2FuZGxlLCBpdCBjb25zdW1lcyBpdHNlbGYgdG8gbGlnaHQgdGhlIHdheSBmb3Igb3RoZXJzLiINCiJPc2NhciBXaWxkZSIsIlRoZSBvbmx5IHRoaW5nIHRvIGRvIHdpdGggZ29vZCBhZHZpY2UgaXMgdG8gcGFzcyBpdCBvbi4gSXQgaXMgbmV2ZXIgb2YgYW55IHVzZSB0byBvbmVzZWxmLiINCiIiLCJMaWZlIGlzIG5vdCBtZWFzdXJlZCBieSB0aGUgYnJlYXRocyB3ZSB0YWtlLCBidXQgYnkgdGhlIG1vbWVudHMgdGhhdCB0YWtlIG91ciBicmVhdGguIg0KIkhvbm9yZSBkZSBCYWx6YWMiLCJUaGUgc21hbGxlc3QgZmxvd2VyIGlzIGEgdGhvdWdodCwgYSBsaWZlIGFuc3dlcmluZyB0byBzb21lIGZlYXR1cmUgb2YgdGhlIEdyZWF0IFdob2xlLCBvZiB3aG9tIHRoZXkgaGF2ZSBhIHBlcnNpc3RlbnQgaW50dWl0aW9uLiINCiJKYWNvYiBCcmF1ZGUiLCJDb25zaWRlciBob3cgaGFyZCBpdCBpcyB0byBjaGFuZ2UgeW91cnNlbGYgYW5kIHlvdSdsbCB1bmRlcnN0YW5kIHdoYXQgbGl0dGxlIGNoYW5jZSB5b3UgaGF2ZSBpbiB0cnlpbmcgdG8gY2hhbmdlIG90aGVycy4iDQoiVmluY2UgTG9tYmFyZGkiLCJJZiB5b3UnbGwgbm90IHNldHRsZSBmb3IgYW55dGhpbmcgbGVzcyB0aGFuIHlvdXIgYmVzdCwgeW91IHdpbGwgYmUgYW1hemVkIGF0IHdoYXQgeW91IGNhbiBhY2NvbXBsaXNoIGluIHlvdXIgbGl2ZXMuIg0KIk9saXZlciBIb2xtZXMiLCJXaGF0IGxpZXMgYmVoaW5kIHVzIGFuZCB3aGF0IGxpZXMgYmVmb3JlIHVzIGFyZSBzbWFsbCBtYXR0ZXJzIGNvbXBhcmVkIHRvIHdoYXQgbGllcyB3aXRoaW4gdXMuIg0KIkRhbGFpIExhbWEiLCJXaXRoIHRoZSByZWFsaXphdGlvbiBvZiBvbmVzIG93biBwb3RlbnRpYWwgYW5kIHNlbGYtY29uZmlkZW5jZSBpbiBvbmVzIGFiaWxpdHksIG9uZSBjYW4gYnVpbGQgYSBiZXR0ZXIgd29ybGQuIg0KIk5lbHNvbiBNYW5kZWxhIiwiVGhlcmUgaXMgbm90aGluZyBsaWtlIHJldHVybmluZyB0byBhIHBsYWNlIHRoYXQgcmVtYWlucyB1bmNoYW5nZWQgdG8gZmluZCB0aGUgd2F5cyBpbiB3aGljaCB5b3UgeW91cnNlbGYgaGF2ZSBhbHRlcmVkLiINCiJSb2JlcnQgQW50aG9ueSIsIkZvcmdldCBhYm91dCBhbGwgdGhlIHJlYXNvbnMgd2h5IHNvbWV0aGluZyBtYXkgbm90IHdvcmsuIFlvdSBvbmx5IG5lZWQgdG8gZmluZCBvbmUgZ29vZCByZWFzb24gd2h5IGl0IHdpbGwuIg0KIkFyaXN0b3RsZSIsIkl0IGlzIHRoZSBtYXJrIG9mIGFuIGVkdWNhdGVkIG1pbmQgdG8gYmUgYWJsZSB0byBlbnRlcnRhaW4gYSB0aG91Z2h0IHdpdGhvdXQgYWNjZXB0aW5nIGl0LiINCiJXYXNoaW5ndG9uIElydmluZyIsIkxvdmUgaXMgbmV2ZXIgbG9zdC4gSWYgbm90IHJlY2lwcm9jYXRlZCwgaXQgd2lsbCBmbG93IGJhY2sgYW5kIHNvZnRlbiBhbmQgcHVyaWZ5IHRoZSBoZWFydC4iDQoiQW5uZSBGcmFuayIsIldlIGFsbCBsaXZlIHdpdGggdGhlIG9iamVjdGl2ZSBvZiBiZWluZyBoYXBweTsgb3VyIGxpdmVzIGFyZSBhbGwgZGlmZmVyZW50IGFuZCB5ZXQgdGhlIHNhbWUuIg0KIkJ5cm9uIFB1bHNpZmVyIiwiTWFueSBwZW9wbGUgdGhpbmsgb2YgcHJvc3Blcml0eSB0aGF0IGNvbmNlcm5zIG1vbmV5IG9ubHkgdG8gZm9yZ2V0IHRoYXQgdHJ1ZSBwcm9zcGVyaXR5IGlzIG9mIHRoZSBtaW5kLiINCiJUaGljaCBOaGF0IEhhbmgiLCJUbyBiZSBiZWF1dGlmdWwgbWVhbnMgdG8gYmUgeW91cnNlbGYuIFlvdSBkb24ndCBuZWVkIHRvIGJlIGFjY2VwdGVkIGJ5IG90aGVycy4gWW91IG5lZWQgdG8gYWNjZXB0IHlvdXJzZWxmLiINCiJCdWRkaGEiLCJEbyBub3Qgb3ZlcnJhdGUgd2hhdCB5b3UgaGF2ZSByZWNlaXZlZCwgbm9yIGVudnkgb3RoZXJzLiBIZSB3aG8gZW52aWVzIG90aGVycyBkb2VzIG5vdCBvYnRhaW4gcGVhY2Ugb2YgbWluZC4iDQoiSmVzc2FteW4gV2VzdCIsIkl0IGlzIHZlcnkgZWFzeSB0byBmb3JnaXZlIG90aGVycyB0aGVpciBtaXN0YWtlczsgaXQgdGFrZXMgbW9yZSBncml0IHRvIGZvcmdpdmUgdGhlbSBmb3IgaGF2aW5nIHdpdG5lc3NlZCB5b3VyIG93bi4iDQoiUGxhdG8iLCJCb2RpbHkgZXhlcmNpc2UsIHdoZW4gY29tcHVsc29yeSwgZG9lcyBubyBoYXJtIHRvIHRoZSBib2R5OyBidXQga25vd2xlZGdlIHdoaWNoIGlzIGFjcXVpcmVkIHVuZGVyIGNvbXB1bHNpb24gb2J0YWlucyBubyBob2xkIG9uIHRoZSBtaW5kLiINCiJCcnVjZSBMZWUiLCJBbHdheXMgYmUgeW91cnNlbGYsIGV4cHJlc3MgeW91cnNlbGYsIGhhdmUgZmFpdGggaW4geW91cnNlbGYsIGRvIG5vdCBnbyBvdXQgYW5kIGxvb2sgZm9yIGEgc3VjY2Vzc2Z1bCBwZXJzb25hbGl0eSBhbmQgZHVwbGljYXRlIGl0LiINCiJDaGFybG90dGUgR2lsbWFuIiwiTGV0IHVzIHJldmVyZSwgbGV0IHVzIHdvcnNoaXAsIGJ1dCBlcmVjdCBhbmQgb3Blbi1leWVkLCB0aGUgaGlnaGVzdCwgbm90IHRoZSBsb3dlc3Q7IHRoZSBmdXR1cmUsIG5vdCB0aGUgcGFzdCEiDQoiTW90aGVyIFRlcmVzYSIsIkV2ZXJ5IHRpbWUgeW91IHNtaWxlIGF0IHNvbWVvbmUsIGl0IGlzIGFuIGFjdGlvbiBvZiBsb3ZlLCBhIGdpZnQgdG8gdGhhdCBwZXJzb24sIGEgYmVhdXRpZnVsIHRoaW5nLiINCiJNYXJnYXJldCBSdW5iZWNrIiwiU2lsZW5jZXMgbWFrZSB0aGUgcmVhbCBjb252ZXJzYXRpb25zIGJldHdlZW4gZnJpZW5kcy4gTm90IHRoZSBzYXlpbmcgYnV0IHRoZSBuZXZlciBuZWVkaW5nIHRvIHNheSBpcyB3aGF0IGNvdW50cy4iDQoiRGFsYWkgTGFtYSIsIlRoZSBrZXkgdG8gdHJhbnNmb3JtaW5nIG91ciBoZWFydHMgYW5kIG1pbmRzIGlzIHRvIGhhdmUgYW4gdW5kZXJzdGFuZGluZyBvZiBob3cgb3VyIHRob3VnaHRzIGFuZCBlbW90aW9ucyB3b3JrLiINCiJKb2hhbm4gV29sZmdhbmcgdm9uIEdvZXRoZSIsIklmIHlvdSBtdXN0IHRlbGwgbWUgeW91ciBvcGluaW9ucywgdGVsbCBtZSB3aGF0IHlvdSBiZWxpZXZlIGluLiBJIGhhdmUgcGxlbnR5IG9mIGRvdXRzIG9mIG15IG93bi4iDQoiT3ZpZCIsIkNoYW5jZSBpcyBhbHdheXMgcG93ZXJmdWwuIExldCB5b3VyIGhvb2sgYmUgYWx3YXlzIGNhc3Q7IGluIHRoZSBwb29sIHdoZXJlIHlvdSBsZWFzdCBleHBlY3QgaXQsIHRoZXJlIHdpbGwgYmUgYSBmaXNoLiINCiJPZyBNYW5kaW5vIiwiSSBzZWVrIGNvbnN0YW50bHkgdG8gaW1wcm92ZSBteSBtYW5uZXJzIGFuZCBncmFjZXMsIGZvciB0aGV5IGFyZSB0aGUgc3VnYXIgdG8gd2hpY2ggYWxsIGFyZSBhdHRyYWN0ZWQuIg0KIkphbWVzIEJhcnJpZSIsIldlIG5ldmVyIHVuZGVyc3RhbmQgaG93IGxpdHRsZSB3ZSBuZWVkIGluIHRoaXMgd29ybGQgdW50aWwgd2Uga25vdyB0aGUgbG9zcyBvZiBpdC4iDQoiIiwiVGhlIHJlYWwgbWVhc3VyZSBvZiB5b3VyIHdlYWx0aCBpcyBob3cgbXVjaCB5b3VkIGJlIHdvcnRoIGlmIHlvdSBsb3N0IGFsbCB5b3VyIG1vbmV5LiINCiJCdWRkaGEiLCJUbyBrZWVwIHRoZSBib2R5IGluIGdvb2QgaGVhbHRoIGlzIGEgZHV0eS4uLiBvdGhlcndpc2Ugd2Ugc2hhbGwgbm90IGJlIGFibGUgdG8ga2VlcCBvdXIgbWluZCBzdHJvbmcgYW5kIGNsZWFyLiINCiJCcnVjZSBMZWUiLCJUYWtlIG5vIHRob3VnaHQgb2Ygd2hvIGlzIHJpZ2h0IG9yIHdyb25nIG9yIHdobyBpcyBiZXR0ZXIgdGhhbi4gQmUgbm90IGZvciBvciBhZ2FpbnN0LiINCiJFdmVyZXR0IERpcmtzZW4iLCJJIGFtIGEgbWFuIG9mIGZpeGVkIGFuZCB1bmJlbmRpbmcgcHJpbmNpcGxlcywgdGhlIGZpcnN0IG9mIHdoaWNoIGlzIHRvIGJlIGZsZXhpYmxlIGF0IGFsbCB0aW1lcy4iDQoiQnlyb24gUHVsc2lmZXIiLCJUb2RheSwgZ2l2ZSBhIHN0cmFuZ2VyIGEgc21pbGUgd2l0aG91dCB3YWl0aW5nIGZvciBpdCBtYXkgYmUgdGhlIGpveSB0aGV5IG5lZWQgdG8gaGF2ZSBhIGdyZWF0IGRheS4iDQoiSGVucnkgTWlsbGVyIiwiVGhlIG1vbWVudCBvbmUgZ2l2ZXMgY2xvc2UgYXR0ZW50aW9uIHRvIGFueXRoaW5nLCBldmVuIGEgYmxhZGUgb2YgZ3Jhc3MsIGl0IGJlY29tZXMgYSBteXN0ZXJpb3VzLCBhd2Vzb21lLCBpbmRlc2NyaWJhYmx5IG1hZ25pZmljZW50IHdvcmxkIGluIGl0c2VsZi4iDQoiTGFvIFR6dSIsIkF0IHRoZSBjZW50ZXIgb2YgeW91ciBiZWluZyB5b3UgaGF2ZSB0aGUgYW5zd2VyOyB5b3Uga25vdyB3aG8geW91IGFyZSBhbmQgeW91IGtub3cgd2hhdCB5b3Ugd2FudC4iDQoiTmllbHMgQm9ociIsIkhvdyB3b25kZXJmdWwgdGhhdCB3ZSBoYXZlIG1ldCB3aXRoIGEgcGFyYWRveC4gTm93IHdlIGhhdmUgc29tZSBob3BlIG9mIG1ha2luZyBwcm9ncmVzcy4iDQoiR2VvcmcgTGljaHRlbmJlcmciLCJFdmVyeW9uZSBpcyBhIGdlbml1cyBhdCBsZWFzdCBvbmNlIGEgeWVhci4gQSByZWFsIGdlbml1cyBoYXMgaGlzIG9yaWdpbmFsIGlkZWFzIGNsb3NlciB0b2dldGhlci4iDQoiQW5haXMgTmluIiwiRHJlYW1zIHBhc3MgaW50byB0aGUgcmVhbGl0eSBvZiBhY3Rpb24uIEZyb20gdGhlIGFjdGlvbnMgc3RlbXMgdGhlIGRyZWFtIGFnYWluOyBhbmQgdGhpcyBpbnRlcmRlcGVuZGVuY2UgcHJvZHVjZXMgdGhlIGhpZ2hlc3QgZm9ybSBvZiBsaXZpbmcuIg0KIkdsb3JpYSBTdGVpbmVtIiwiV2l0aG91dCBsZWFwcyBvZiBpbWFnaW5hdGlvbiwgb3IgZHJlYW1pbmcsIHdlIGxvc2UgdGhlIGV4Y2l0ZW1lbnQgb2YgcG9zc2liaWxpdGllcy4gRHJlYW1pbmcsIGFmdGVyIGFsbCwgaXMgYSBmb3JtIG9mIHBsYW5uaW5nLiINCiJCeXJvbiBQdWxzaWZlciIsIlNhZG5lc3MgbWF5IGJlIHBhcnQgb2YgbGlmZSBidXQgdGhlcmUgaXMgbm8gbmVlZCB0byBsZXQgaXQgZG9taW5hdGUgeW91ciBlbnRpcmUgbGlmZS4iDQoiQ2hhcmxlcyBTY2h3YWIiLCJLZWVwaW5nIGEgbGl0dGxlIGFoZWFkIG9mIGNvbmRpdGlvbnMgaXMgb25lIG9mIHRoZSBzZWNyZXRzIG9mIGJ1c2luZXNzLCB0aGUgdHJhaWxlciBzZWxkb20gZ29lcyBmYXIuIg0KIkVwaWN0ZXR1cyIsIk5hdHVyZSBnYXZlIHVzIG9uZSB0b25ndWUgYW5kIHR3byBlYXJzIHNvIHdlIGNvdWxkIGhlYXIgdHdpY2UgYXMgbXVjaCBhcyB3ZSBzcGVhay4iDQoiQmFyYmFyYSBCYXJvbiIsIkRvbid0IHdhaXQgZm9yIHlvdXIgZmVlbGluZ3MgdG8gY2hhbmdlIHRvIHRha2UgdGhlIGFjdGlvbi4gVGFrZSB0aGUgYWN0aW9uIGFuZCB5b3VyIGZlZWxpbmdzIHdpbGwgY2hhbmdlLiINCiJSaWNoYXJkIEJhY2giLCJZb3UgYXJlIGFsd2F5cyBmcmVlIHRvIGNoYW5nZSB5b3VyIG1pbmQgYW5kIGNob29zZSBhIGRpZmZlcmVudCBmdXR1cmUsIG9yIGEgZGlmZmVyZW50IHBhc3QuIg0KIkxvdSBIb2x0eiIsIllvdSB3ZXJlIG5vdCBib3JuIGEgd2lubmVyLCBhbmQgeW91IHdlcmUgbm90IGJvcm4gYSBsb3Nlci4gWW91IGFyZSB3aGF0IHlvdSBtYWtlIHlvdXJzZWxmIGJlLiINCiJOYXBvbGVvbiBIaWxsIiwiQ2hlcmlzaCB5b3VyIHZpc2lvbnMgYW5kIHlvdXIgZHJlYW1zIGFzIHRoZXkgYXJlIHRoZSBjaGlsZHJlbiBvZiB5b3VyIHNvdWwsIHRoZSBibHVlcHJpbnRzIG9mIHlvdXIgdWx0aW1hdGUgYWNoaWV2ZW1lbnRzLiINCiJOYXBvbGVvbiBIaWxsIiwiQ2hlcmlzaCB5b3VyIHZpc2lvbnMgYW5kIHlvdXIgZHJlYW1zIGFzIHRoZXkgYXJlIHRoZSBjaGlsZHJlbiBvZiB5b3VyIHNvdWw7IHRoZSBibHVlcHJpbnRzIG9mIHlvdXIgdWx0aW1hdGUgYWNoaWV2ZW1lbnRzLiINCiJSb2JlcnQgU3RldmVuc29uIiwiVG8gYmUgd2hhdCB3ZSBhcmUsIGFuZCB0byBiZWNvbWUgd2hhdCB3ZSBhcmUgY2FwYWJsZSBvZiBiZWNvbWluZywgaXMgdGhlIG9ubHkgZW5kIG9mIGxpZmUuIg0KIkNoYXJsZXMgRGVMaW50IiwiVGhlIHJvYWQgbGVhZGluZyB0byBhIGdvYWwgZG9lcyBub3Qgc2VwYXJhdGUgeW91IGZyb20gdGhlIGRlc3RpbmF0aW9uOyBpdCBpcyBlc3NlbnRpYWxseSBhIHBhcnQgb2YgaXQuIg0KIkJydWNlIExlZSIsIlRha2UgdGhpbmdzIGFzIHRoZXkgYXJlLiBQdW5jaCB3aGVuIHlvdSBoYXZlIHRvIHB1bmNoLiBLaWNrIHdoZW4geW91IGhhdmUgdG8ga2ljay4iDQoiQWxiZXJ0IEVpbnN0ZWluIiwiSSBiZWxpZXZlIHRoYXQgYSBzaW1wbGUgYW5kIHVuYXNzdW1pbmcgbWFubmVyIG9mIGxpZmUgaXMgYmVzdCBmb3IgZXZlcnlvbmUsIGJlc3QgYm90aCBmb3IgdGhlIGJvZHkgYW5kIHRoZSBtaW5kLiINCiIiLCJUaG91Z2ggbm8gb25lIGNhbiBnbyBiYWNrIGFuZCBtYWtlIGEgYnJhbmQgbmV3IHN0YXJ0LCBhbnlvbmUgY2FuIHN0YXJ0IGZyb20gbm93IGFuZCBtYWtlIGEgYnJhbmQgbmV3IGVuZGluZy4iDQoiUGFhdm8gTnVybWkiLCJNaW5kIGlzIGV2ZXJ5dGhpbmc6IG11c2NsZSwgcGllY2VzIG9mIHJ1YmJlci4gQWxsIHRoYXQgSSBhbSwgSSBhbSBiZWNhdXNlIG9mIG15IG1pbmQuIg0KIkFubmUgRnJhbmsiLCJIb3cgd29uZGVyZnVsIGl0IGlzIHRoYXQgbm9ib2R5IG5lZWQgd2FpdCBhIHNpbmdsZSBtb21lbnQgYmVmb3JlIHN0YXJ0aW5nIHRvIGltcHJvdmUgdGhlIHdvcmxkLiINCiIiLCJBIGZyaWVuZCBpcyBzb21lb25lIHdobyB1bmRlcnN0YW5kcyB5b3VyIHBhc3QsIGJlbGlldmVzIGluIHlvdXIgZnV0dXJlLCBhbmQgYWNjZXB0cyB5b3UganVzdCB0aGUgd2F5IHlvdSBhcmUuIg0KIlJhbHBoIEVtZXJzb24iLCJJdCBpcyBvbmUgb2YgdGhlIGJsZXNzaW5ncyBvZiBvbGQgZnJpZW5kcyB0aGF0IHlvdSBjYW4gYWZmb3JkIHRvIGJlIHN0dXBpZCB3aXRoIHRoZW0uIg0KIlRyeW9uIEVkd2FyZHMiLCJIZSB0aGF0IG5ldmVyIGNoYW5nZXMgaGlzIG9waW5pb25zLCBuZXZlciBjb3JyZWN0cyBoaXMgbWlzdGFrZXMsIGFuZCB3aWxsIG5ldmVyIGJlIHdpc2VyIG9uIHRoZSBtb3Jyb3cgdGhhbiBoZSBpcyB0b2RheS4iDQoiQWJyYWhhbSBMaW5jb2xuIiwiR2l2ZSBtZSBzaXggaG91cnMgdG8gY2hvcCBkb3duIGEgdHJlZSBhbmQgSSB3aWxsIHNwZW5kIHRoZSBmaXJzdCBmb3VyIHNoYXJwZW5pbmcgdGhlIGF4ZS4iDQoiRS4gTS4gRm9yc3RlciIsIk9uZSBtdXN0IGJlIGZvbmQgb2YgcGVvcGxlIGFuZCB0cnVzdCB0aGVtIGlmIG9uZSBpcyBub3QgdG8gbWFrZSBhIG1lc3Mgb2YgbGlmZS4iDQoiRGF2aWQgU2VhbWFucyIsIldlIGNhbm5vdCBjaGFuZ2Ugb3VyIG1lbW9yaWVzLCBidXQgd2UgY2FuIGNoYW5nZSB0aGVpciBtZWFuaW5nIGFuZCB0aGUgcG93ZXIgdGhleSBoYXZlIG92ZXIgdXMuIg0KIkNvbmZ1Y2l1cyIsIkJlaW5nIGluIGh1bWFuZW5lc3MgaXMgZ29vZC4gSWYgd2Ugc2VsZWN0IG90aGVyIGdvb2RuZXNzIGFuZCB0aHVzIGFyZSBmYXIgYXBhcnQgZnJvbSBodW1hbmVuZXNzLCBob3cgY2FuIHdlIGJlIHRoZSB3aXNlPyINCiJCeXJvbiBQdWxzaWZlciIsIlRvIGdpdmUgaG9wZSB0byBzb21lb25lIG9jY3VycyB3aGVuIHlvdSB0ZWFjaCB0aGVtIGhvdyB0byB1c2UgdGhlIHRvb2xzIHRvIGRvIGl0IGZvciB0aGVtc2VsdmVzLiINCiJMdWNpbGxlIEJhbGwiLCJJZCByYXRoZXIgcmVncmV0IHRoZSB0aGluZ3MgdGhhdCBJIGhhdmUgZG9uZSB0aGFuIHRoZSB0aGluZ3MgdGhhdCBJIGhhdmUgbm90IGRvbmUuIg0KIkVja2hhcnQgVG9sbGUiLCJUaGUgcGFzdCBoYXMgbm8gcG93ZXIgdG8gc3RvcCB5b3UgZnJvbSBiZWluZyBwcmVzZW50IG5vdy4gT25seSB5b3VyIGdyaWV2YW5jZSBhYm91dCB0aGUgcGFzdCBjYW4gZG8gdGhhdC4iDQoiUmFscGggRW1lcnNvbiIsIklmIHRoZSBzdGFycyBzaG91bGQgYXBwZWFyIGJ1dCBvbmUgbmlnaHQgZXZlcnkgdGhvdXNhbmQgeWVhcnMgaG93IG1hbiB3b3VsZCBtYXJ2ZWwgYW5kIGFkb3JlLiINCiJMYXVyZW5jZSBKLiBQZXRlciIsIlRoZXJlIGFyZSB0d28ga2luZHMgb2YgZmFpbHVyZXM6IHRob3NlIHdobyB0aG91Z2h0IGFuZCBuZXZlciBkaWQsIGFuZCB0aG9zZSB3aG8gZGlkIGFuZCBuZXZlciB0aG91Z2h0LiINCiJFbGl6YWJldGggQXJkZW4iLCJJJ20gbm90IGludGVyZXN0ZWQgaW4gYWdlLiBQZW9wbGUgd2hvIHRlbGwgbWUgdGhlaXIgYWdlIGFyZSBzaWxseS4gWW91J3JlIGFzIG9sZCBhcyB5b3UgZmVlbC4iDQoiRGFsYWkgTGFtYSIsIkkgZmluZCBob3BlIGluIHRoZSBkYXJrZXN0IG9mIGRheXMsIGFuZCBmb2N1cyBpbiB0aGUgYnJpZ2h0ZXN0LiBJIGRvIG5vdCBqdWRnZSB0aGUgdW5pdmVyc2UuIg0KIkNvbmZ1Y2l1cyIsIldoZW4gaXQgaXMgb2J2aW91cyB0aGF0IHRoZSBnb2FscyBjYW5ub3QgYmUgcmVhY2hlZCwgZG9uJ3QgYWRqdXN0IHRoZSBnb2FscywgYWRqdXN0IHRoZSBhY3Rpb24gc3RlcHMuIg0KIk5pa29sYSBUZXNsYSIsIk91ciB2aXJ0dWVzIGFuZCBvdXIgZmFpbGluZ3MgYXJlIGluc2VwYXJhYmxlLCBsaWtlIGZvcmNlIGFuZCBtYXR0ZXIuIFdoZW4gdGhleSBzZXBhcmF0ZSwgbWFuIGlzIG5vIG1vcmUuIg0KIkxlbyBBaWttYW4iLCJCbGVzc2VkIGlzIHRoZSBwZXJzb24gd2hvIGlzIHRvbyBidXN5IHRvIHdvcnJ5IGluIHRoZSBkYXl0aW1lLCBhbmQgdG9vIHNsZWVweSB0byB3b3JyeSBhdCBuaWdodC4iDQoiUGFibG8gUGljYXNzbyIsIkhlIGNhbiB3aG8gdGhpbmtzIGhlIGNhbiwgYW5kIGhlIGNhbid0IHdobyB0aGlua3MgaGUgY2FuJ3QuIFRoaXMgaXMgYW4gaW5leG9yYWJsZSwgaW5kaXNwdXRhYmxlIGxhdy4iDQoiVmVybm9uIENvb3BlciIsIlRoZXNlIGRheXMgcGVvcGxlIHNlZWsga25vd2xlZGdlLCBub3Qgd2lzZG9tLiBLbm93bGVkZ2UgaXMgb2YgdGhlIHBhc3QsIHdpc2RvbSBpcyBvZiB0aGUgZnV0dXJlLiINCiJCZW5qYW1pbiBEaXNyYWVsaSIsIk9uZSBzZWNyZXQgb2Ygc3VjY2VzcyBpbiBsaWZlIGlzIGZvciBhIG1hbiB0byBiZSByZWFkeSBmb3IgaGlzIG9wcG9ydHVuaXR5IHdoZW4gaXQgY29tZXMuIg0KIkRhbGFpIExhbWEiLCJQZW9wbGUgdGFrZSBkaWZmZXJlbnQgcm9hZHMgc2Vla2luZyBmdWxmaWxtZW50IGFuZCBoYXBwaW5lc3MuIEp1c3QgYmVjYXVzZSB0aGV5cmUgbm90IG9uIHlvdXIgcm9hZCBkb2Vzbid0IG1lYW4gdGhleSd2ZSBnb3R0ZW4gbG9zdC4iDQoiQ2FybCBKdW5nIiwiVGhlIHNob2UgdGhhdCBmaXRzIG9uZSBwZXJzb24gcGluY2hlcyBhbm90aGVyOyB0aGVyZSBpcyBubyByZWNpcGUgZm9yIGxpdmluZyB0aGF0IHN1aXRzIGFsbCBjYXNlcy4iDQoiQnVkZGhhIiwiVGhlcmUgYXJlIG9ubHkgdHdvIG1pc3Rha2VzIG9uZSBjYW4gbWFrZSBhbG9uZyB0aGUgcm9hZCB0byB0cnV0aDsgbm90IGdvaW5nIGFsbCB0aGUgd2F5LCBhbmQgbm90IHN0YXJ0aW5nLiINCiJNYXJjdXMgQXVyZWxpdXMiLCJWZXJ5IGxpdHRsZSBpcyBuZWVkZWQgdG8gbWFrZSBhIGhhcHB5IGxpZmU7IGl0IGlzIGFsbCB3aXRoaW4geW91cnNlbGYsIGluIHlvdXIgd2F5IG9mIHRoaW5raW5nLiINCiIiLCJHaXZpbmcgdXAgZG9lc24ndCBhbHdheXMgbWVhbiB5b3UgYXJlIHdlYWsuIFNvbWV0aW1lcyBpdCBtZWFucyB0aGF0IHlvdSBhcmUgc3Ryb25nIGVub3VnaCB0byBsZXQgZ28uIg0KIkpvaGFubiBXb2xmZ2FuZyB2b24gR29ldGhlIiwiVHJlYXQgcGVvcGxlIGFzIGlmIHRoZXkgd2VyZSB3aGF0IHRoZXkgb3VnaHQgdG8gYmUgYW5kIHlvdSBoZWxwIHRoZW0gdG8gYmVjb21lIHdoYXQgdGhleSBhcmUgY2FwYWJsZSBvZiBiZWluZy4iDQoiVGhpY2ggTmhhdCBIYW5oIiwiVGhlIG1vc3QgcHJlY2lvdXMgZ2lmdCB3ZSBjYW4gb2ZmZXIgYW55b25lIGlzIG91ciBhdHRlbnRpb24uIFdoZW4gbWluZGZ1bG5lc3MgZW1icmFjZXMgdGhvc2Ugd2UgbG92ZSwgdGhleSB3aWxsIGJsb29tIGxpa2UgZmxvd2Vycy4iDQoiSmFjayBEaXhvbiIsIklmIHlvdSBmb2N1cyBvbiByZXN1bHRzLCB5b3Ugd2lsbCBuZXZlciBjaGFuZ2UuIElmIHlvdSBmb2N1cyBvbiBjaGFuZ2UsIHlvdSB3aWxsIGdldCByZXN1bHRzLiINCiJHLiBLLiBDaGVzdGVydG9uIiwiSSB3b3VsZCBtYWludGFpbiB0aGF0IHRoYW5rcyBhcmUgdGhlIGhpZ2hlc3QgZm9ybSBvZiB0aG91Z2h0LCBhbmQgdGhhdCBncmF0aXR1ZGUgaXMgaGFwcGluZXNzIGRvdWJsZWQgYnkgd29uZGVyLiINCiJEZW5pcyBXYWl0bGV5IiwiVGhlcmUgYXJlIHR3byBwcmltYXJ5IGNob2ljZXMgaW4gbGlmZTogdG8gYWNjZXB0IGNvbmRpdGlvbnMgYXMgdGhleSBleGlzdCwgb3IgYWNjZXB0IHRoZSByZXNwb25zaWJpbGl0eSBmb3IgY2hhbmdpbmcgdGhlbS4iDQoiTGFvLVR6dSIsIkFsbCBkaWZmaWN1bHQgdGhpbmdzIGhhdmUgdGhlaXIgb3JpZ2luIGluIHRoYXQgd2hpY2ggaXMgZWFzeSwgYW5kIGdyZWF0IHRoaW5ncyBpbiB0aGF0IHdoaWNoIGlzIHNtYWxsLiINCiJCeXJvbiBQdWxzaWZlciIsIllvdSBjYW4gYmUgd2hhdCB5b3Ugd2FudCB0byBiZS4gWW91IGhhdmUgdGhlIHBvd2VyIHdpdGhpbiBhbmQgd2Ugd2lsbCBoZWxwIHlvdSBhbHdheXMuIg0KIkpvaGFubmVzIEdhZXJ0bmVyIiwiVG8gc3BlYWsgZ3JhdGl0dWRlIGlzIGNvdXJ0ZW91cyBhbmQgcGxlYXNhbnQsIHRvIGVuYWN0IGdyYXRpdHVkZSBpcyBnZW5lcm91cyBhbmQgbm9ibGUsIGJ1dCB0byBsaXZlIGdyYXRpdHVkZSBpcyB0byB0b3VjaCBIZWF2ZW4uIg0KIkRvdWcgTGFyc29uIiwiV2lzZG9tIGlzIHRoZSByZXdhcmQgeW91IGdldCBmb3IgYSBsaWZldGltZSBvZiBsaXN0ZW5pbmcgd2hlbiB5b3UnZCBoYXZlIHByZWZlcnJlZCB0byB0YWxrLiINCiJDaGFybGVzIExhbWIiLCJUaGUgZ3JlYXRlc3QgcGxlYXN1cmUgSSBrbm93IGlzIHRvIGRvIGEgZ29vZCBhY3Rpb24gYnkgc3RlYWx0aCwgYW5kIHRvIGhhdmUgaXQgZm91bmQgb3V0IGJ5IGFjY2lkZW50LiINCiJKb2huIE11aXIiLCJXaGVuIG9uZSB0dWdzIGF0IGEgc2luZ2xlIHRoaW5nIGluIG5hdHVyZSwgaGUgZmluZHMgaXQgYXR0YWNoZWQgdG8gdGhlIHJlc3Qgb2YgdGhlIHdvcmxkLiINCiJXaW5zdG9uIENodXJjaGlsbCIsIkNvdXJhZ2UgaXMgd2hhdCBpdCB0YWtlcyB0byBzdGFuZCB1cCBhbmQgc3BlYWs7IGNvdXJhZ2UgaXMgYWxzbyB3aGF0IGl0IHRha2VzIHRvIHNpdCBkb3duIGFuZCBsaXN0ZW4uIg0KIkhlbGVuIEtlbGxlciIsIlRoZSBtb3N0IGJlYXV0aWZ1bCB0aGluZ3MgaW4gdGhlIHdvcmxkIGNhbm5vdCBiZSBzZWVuIG9yIGV2ZW4gdG91Y2hlZC4gVGhleSBtdXN0IGJlIGZlbHQgd2l0aCB0aGUgaGVhcnQuIg0KIkJ1ZGRoYSIsIlRvIGxpdmUgYSBwdXJlIHVuc2VsZmlzaCBsaWZlLCBvbmUgbXVzdCBjb3VudCBub3RoaW5nIGFzIG9uZXMgb3duIGluIHRoZSBtaWRzdCBvZiBhYnVuZGFuY2UuIg0KIlRob21hcyBFZGlzb24iLCJNYW55IG9mIGxpZmUncyBmYWlsdXJlcyBhcmUgcGVvcGxlIHdobyBkaWQgbm90IHJlYWxpemUgaG93IGNsb3NlIHRoZXkgd2VyZSB0byBzdWNjZXNzIHdoZW4gdGhleSBnYXZlIHVwLiINCiJXaWxsaWFtIFdhcmQiLCJXaGVuIHdlIHNlZWsgdG8gZGlzY292ZXIgdGhlIGJlc3QgaW4gb3RoZXJzLCB3ZSBzb21laG93IGJyaW5nIG91dCB0aGUgYmVzdCBpbiBvdXJzZWx2ZXMuIg0KIk1pY2hhZWwgSm9yZGFuIiwiSWYgeW91IGFjY2VwdCB0aGUgZXhwZWN0YXRpb25zIG9mIG90aGVycywgZXNwZWNpYWxseSBuZWdhdGl2ZSBvbmVzLCB0aGVuIHlvdSBuZXZlciB3aWxsIGNoYW5nZSB0aGUgb3V0Y29tZS4iDQoiT2xpdmVyIEhvbG1lcyIsIkEgbWFuIG1heSBmdWxmaWwgdGhlIG9iamVjdCBvZiBoaXMgZXhpc3RlbmNlIGJ5IGFza2luZyBhIHF1ZXN0aW9uIGhlIGNhbm5vdCBhbnN3ZXIsIGFuZCBhdHRlbXB0aW5nIGEgdGFzayBoZSBjYW5ub3QgYWNoaWV2ZS4iDQoiQ29uZnVjaXVzIiwiSSBhbSBub3QgYm90aGVyZWQgYnkgdGhlIGZhY3QgdGhhdCBJIGFtIHVua25vd24uIEkgYW0gYm90aGVyZWQgd2hlbiBJIGRvIG5vdCBrbm93IG90aGVycy4iDQoiRXBpY3RldHVzIiwiSGUgaXMgYSB3aXNlIG1hbiB3aG8gZG9lcyBub3QgZ3JpZXZlIGZvciB0aGUgdGhpbmdzIHdoaWNoIGhlIGhhcyBub3QsIGJ1dCByZWpvaWNlcyBmb3IgdGhvc2Ugd2hpY2ggaGUgaGFzLiINCiJQYWJsbyBQaWNhc3NvIiwiSSBhbSBhbHdheXMgZG9pbmcgdGhhdCB3aGljaCBJIGNhbm5vdCBkbywgaW4gb3JkZXIgdGhhdCBJIG1heSBsZWFybiBob3cgdG8gZG8gaXQuIg0KIkJhcmFjayBPYmFtYSIsIklmIHlvdSdyZSB3YWxraW5nIGRvd24gdGhlIHJpZ2h0IHBhdGggYW5kIHlvdSdyZSB3aWxsaW5nIHRvIGtlZXAgd2Fsa2luZywgZXZlbnR1YWxseSB5b3UnbGwgbWFrZSBwcm9ncmVzcy4iDQoiSXZ5IEJha2VyIFByaWVzdCIsIlRoZSB3b3JsZCBpcyByb3VuZCBhbmQgdGhlIHBsYWNlIHdoaWNoIG1heSBzZWVtIGxpa2UgdGhlIGVuZCBtYXkgYWxzbyBiZSB0aGUgYmVnaW5uaW5nLiINCiIiLCJOZXZlciBtaXNzIGFuIG9wcG9ydHVuaXR5IHRvIG1ha2Ugb3RoZXJzIGhhcHB5LCBldmVuIGlmIHlvdSBoYXZlIHRvIGxlYXZlIHRoZW0gYWxvbmUgaW4gb3JkZXIgdG8gZG8gaXQuIg0KIkRhbmllbGxlIEluZ3J1bSIsIkdpdmUgaXQgYWxsIHlvdSd2ZSBnb3QgYmVjYXVzZSB5b3UgbmV2ZXIga25vdyBpZiB0aGVyZSdzIGdvaW5nIHRvIGJlIGEgbmV4dCB0aW1lLiINCiJPbGQgR2VybWFuIHByb3ZlcmIiLCJZb3UgaGF2ZSB0byB0YWtlIGl0IGFzIGl0IGhhcHBlbnMsIGJ1dCB5b3Ugc2hvdWxkIHRyeSB0byBtYWtlIGl0IGhhcHBlbiB0aGUgd2F5IHlvdSB3YW50IHRvIHRha2UgaXQuIg0KIlJhbHBoIEJsdW0iLCJOb3RoaW5nIGlzIHByZWRlc3RpbmVkOiBUaGUgb2JzdGFjbGVzIG9mIHlvdXIgcGFzdCBjYW4gYmVjb21lIHRoZSBnYXRld2F5cyB0aGF0IGxlYWQgdG8gbmV3IGJlZ2lubmluZ3MuIg0KIkJydWNlIExlZSIsIkltIG5vdCBpbiB0aGlzIHdvcmxkIHRvIGxpdmUgdXAgdG8geW91ciBleHBlY3RhdGlvbnMgYW5kIHlvdSdyZSBub3QgaW4gdGhpcyB3b3JsZCB0byBsaXZlIHVwIHRvIG1pbmUuIg0KIlRoaWNoIE5oYXQgSGFuaCIsIlNvbWV0aW1lcyB5b3VyIGpveSBpcyB0aGUgc291cmNlIG9mIHlvdXIgc21pbGUsIGJ1dCBzb21ldGltZXMgeW91ciBzbWlsZSBjYW4gYmUgdGhlIHNvdXJjZSBvZiB5b3VyIGpveS4iDQoiV2FsdGVyIENyb25raXRlIiwiSSBjYW4ndCBpbWFnaW5lIGEgcGVyc29uIGJlY29taW5nIGEgc3VjY2VzcyB3aG8gZG9lc24ndCBnaXZlIHRoaXMgZ2FtZSBvZiBsaWZlIGV2ZXJ5dGhpbmcgaGVzIGdvdC4iDQoiU29jcmF0ZXMiLCJUaGUgZ3JlYXRlc3Qgd2F5IHRvIGxpdmUgd2l0aCBob25vciBpbiB0aGlzIHdvcmxkIGlzIHRvIGJlIHdoYXQgd2UgcHJldGVuZCB0byBiZS4iDQoiU2VuZWNhIiwiVGhlIGNvbmRpdGlvbnMgb2YgY29ucXVlc3QgYXJlIGFsd2F5cyBlYXN5LiBXZSBoYXZlIGJ1dCB0byB0b2lsIGF3aGlsZSwgZW5kdXJlIGF3aGlsZSwgYmVsaWV2ZSBhbHdheXMsIGFuZCBuZXZlciB0dXJuIGJhY2suIg0KIkNoYWxtZXJzIiwiVGhlIGdyYW5kIGVzc2VudGlhbHMgb2YgaGFwcGluZXNzIGFyZTogc29tZXRoaW5nIHRvIGRvLCBzb21ldGhpbmcgdG8gbG92ZSwgYW5kIHNvbWV0aGluZyB0byBob3BlIGZvci4iDQoiVGhpY2ggTmhhdCBIYW5oIiwiQnkgbGl2aW5nIGRlZXBseSBpbiB0aGUgcHJlc2VudCBtb21lbnQgd2UgY2FuIHVuZGVyc3RhbmQgdGhlIHBhc3QgYmV0dGVyIGFuZCB3ZSBjYW4gcHJlcGFyZSBmb3IgYSBiZXR0ZXIgZnV0dXJlLiINCiJSYWxwaCBFbWVyc29uIiwiRG8gbm90IGJlIHRvbyB0aW1pZCBhbmQgc3F1ZWFtaXNoIGFib3V0IHlvdXIgcmVhY3Rpb25zLiBBbGwgbGlmZSBpcyBhbiBleHBlcmltZW50LiBUaGUgbW9yZSBleHBlcmltZW50cyB5b3UgbWFrZSB0aGUgYmV0dGVyLiINCiJSYWxwaCBFbWVyc29uIiwiRG8gbm90IGdvIHdoZXJlIHRoZSBwYXRoIG1heSBsZWFkLCBnbyBpbnN0ZWFkIHdoZXJlIHRoZXJlIGlzIG5vIHBhdGggYW5kIGxlYXZlIGEgdHJhaWwuIg0KIlJvYmVydCBMb3VpcyBTdGV2ZW5zb24iLCJUaGVyZSBpcyBubyBkdXR5IHdlIHNvIHVuZGVycmF0ZSBhcyB0aGUgZHV0eSBvZiBiZWluZyBoYXBweS4gQnkgYmVpbmcgaGFwcHkgd2Ugc293IGFub255bW91cyBiZW5lZml0cyB1cG9uIHRoZSB3b3JsZC4iDQoiTmFwb2xlb24gSGlsbCIsIkVkaXNvbiBmYWlsZWQgMTAsMDAwIHRpbWVzIGJlZm9yZSBoZSBtYWRlIHRoZSBlbGVjdHJpYyBsaWdodC4gRG8gbm90IGJlIGRpc2NvdXJhZ2VkIGlmIHlvdSBmYWlsIGEgZmV3IHRpbWVzLiINCiIiLCJZZXN0ZXJkYXkgaXMgaGlzdG9yeS4gVG9tb3Jyb3cgaXMgYSBteXN0ZXJ5LiBBbmQgdG9kYXk/IFRvZGF5IGlzIGEgZ2lmdCB0aGF0J3Mgd2h5IHRoZXkgY2FsbCBpdCB0aGUgcHJlc2VudC4iDQoiSGVucnkgVGhvcmVhdSIsIlRoZSBvbmx5IHdheSB0byB0ZWxsIHRoZSB0cnV0aCBpcyB0byBzcGVhayB3aXRoIGtpbmRuZXNzLiBPbmx5IHRoZSB3b3JkcyBvZiBhIGxvdmluZyBtYW4gY2FuIGJlIGhlYXJkLiINCiJCZW5qYW1pbiBEaXNyYWVsaSIsIlRoZSBncmVhdGVzdCBnb29kIHlvdSBjYW4gZG8gZm9yIGFub3RoZXIgaXMgbm90IGp1c3QgdG8gc2hhcmUgeW91ciByaWNoZXMgYnV0IHRvIHJldmVhbCB0byBoaW0gaGlzIG93bi4iDQoiQnJpYW4gVHJhY3kiLCJZb3UgY2FuIG9ubHkgZ3JvdyBpZiB5b3UncmUgd2lsbGluZyB0byBmZWVsIGF3a3dhcmQgYW5kIHVuY29tZm9ydGFibGUgd2hlbiB5b3UgdHJ5IHNvbWV0aGluZyBuZXcuIg0KIkpvYW4gRGlkaW9uIiwiVG8gZnJlZSB1cyBmcm9tIHRoZSBleHBlY3RhdGlvbnMgb2Ygb3RoZXJzLCB0byBnaXZlIHVzIGJhY2sgdG8gb3Vyc2VsdmVzLCB0aGVyZSBsaWVzIHRoZSBncmVhdCwgc2luZ3VsYXIgcG93ZXIgb2Ygc2VsZi1yZXNwZWN0LiINCiJNYWJlbCBOZXdjb21iZXIiLCJJdCBpcyBtb3JlIGltcG9ydGFudCB0byBrbm93IHdoZXJlIHlvdSBhcmUgZ29pbmcgdGhhbiB0byBnZXQgdGhlcmUgcXVpY2tseS4gRG8gbm90IG1pc3Rha2UgYWN0aXZpdHkgZm9yIGFjaGlldmVtZW50LiINCiIiLCJXaGVuIHlvdSBkb24ndCBrbm93IHdoYXQgeW91IGJlbGlldmUsIGV2ZXJ5dGhpbmcgYmVjb21lcyBhbiBhcmd1bWVudC4gRXZlcnl0aGluZyBpcyBkZWJhdGFibGUuIEJ1dCB3aGVuIHlvdSBzdGFuZCBmb3Igc29tZXRoaW5nLCBkZWNpc2lvbnMgYXJlIG9idmlvdXMuIg0KIlJvYmVydCBHcmF2ZXMiLCJJbnR1aXRpb24gaXMgdGhlIHN1cHJhLWxvZ2ljIHRoYXQgY3V0cyBvdXQgYWxsIHRoZSByb3V0aW5lIHByb2Nlc3NlcyBvZiB0aG91Z2h0IGFuZCBsZWFwcyBzdHJhaWdodCBmcm9tIHRoZSBwcm9ibGVtIHRvIHRoZSBhbnN3ZXIuIg0KIkZyYW5rIFdyaWdodCIsIlRoZSB0aGluZyBhbHdheXMgaGFwcGVucyB0aGF0IHlvdSByZWFsbHkgYmVsaWV2ZSBpbjsgYW5kIHRoZSBiZWxpZWYgaW4gYSB0aGluZyBtYWtlcyBpdCBoYXBwZW4uIg0KIkZyYW5jb2lzIGRlIExhIFJvY2hlZm91Y2F1bGQiLCJBIHRydWUgZnJpZW5kIGlzIHRoZSBtb3N0IHByZWNpb3VzIG9mIGFsbCBwb3NzZXNzaW9ucyBhbmQgdGhlIG9uZSB3ZSB0YWtlIHRoZSBsZWFzdCB0aG91Z2h0IGFib3V0IGFjcXVpcmluZy4iDQoiRXBpY3RldHVzIiwiVGhlcmUgaXMgb25seSBvbmUgd2F5IHRvIGhhcHBpbmVzcyBhbmQgdGhhdCBpcyB0byBjZWFzZSB3b3JyeWluZyBhYm91dCB0aGluZ3Mgd2hpY2ggYXJlIGJleW9uZCB0aGUgcG93ZXIgb2Ygb3VyIHdpbGwuIg0KIk1hcmdhcmV0IENvdXNpbnMiLCJBcHByZWNpYXRpb24gY2FuIG1ha2UgYSBkYXksIGV2ZW4gY2hhbmdlIGEgbGlmZS4gWW91ciB3aWxsaW5nbmVzcyB0byBwdXQgaXQgaW50byB3b3JkcyBpcyBhbGwgdGhhdCBpcyBuZWNlc3NhcnkuIg0KIiIsIkV2ZXJ5IHNpeHR5IHNlY29uZHMgeW91IHNwZW5kIGFuZ3J5LCB1cHNldCBvciBtYWQsIGlzIGEgZnVsbCBtaW51dGUgb2YgaGFwcGluZXNzIHlvdSdsbCBuZXZlciBnZXQgYmFjay4iDQoiVGhvbWFzIENhcmx5bGUiLCJUaGlzIHdvcmxkLCBhZnRlciBhbGwgb3VyIHNjaWVuY2UgYW5kIHNjaWVuY2VzLCBpcyBzdGlsbCBhIG1pcmFjbGU7IHdvbmRlcmZ1bCwgaW5zY3J1dGFibGUsIG1hZ2ljYWwgYW5kIG1vcmUsIHRvIHdob3NvZXZlciB3aWxsIHRoaW5rIG9mIGl0LiINCiJQZWFybCBCdWNrIiwiRXZlcnkgZ3JlYXQgbWlzdGFrZSBoYXMgYSBoYWxmd2F5IG1vbWVudCwgYSBzcGxpdCBzZWNvbmQgd2hlbiBpdCBjYW4gYmUgcmVjYWxsZWQgYW5kIHBlcmhhcHMgcmVtZWRpZWQuIg0KIkNhdGhlcmluZSBQdWxzaWZlciIsIllvdSBjYW4gYWRvcHQgdGhlIGF0dGl0dWRlIHRoZXJlIGlzIG5vdGhpbmcgeW91IGNhbiBkbywgb3IgeW91IGNhbiBzZWUgdGhlIGNoYWxsZW5nZSBhcyB5b3VyIGNhbGwgdG8gYWN0aW9uLiINCiJBbGZyZWQgVGVubnlzb24iLCJUaGUgaGFwcGluZXNzIG9mIGEgbWFuIGluIHRoaXMgbGlmZSBkb2VzIG5vdCBjb25zaXN0IGluIHRoZSBhYnNlbmNlIGJ1dCBpbiB0aGUgbWFzdGVyeSBvZiBoaXMgcGFzc2lvbnMuIg0KIk1hcmdhcmV0IE1lYWQiLCJOZXZlciBkb3VidCB0aGF0IGEgc21hbGwgZ3JvdXAgb2YgdGhvdWdodGZ1bCwgY29tbWl0dGVkIHBlb3BsZSBjYW4gY2hhbmdlIHRoZSB3b3JsZC4gSW5kZWVkLiBJdCBpcyB0aGUgb25seSB0aGluZyB0aGF0IGV2ZXIgaGFzLiINCiJPdmlkIiwiTGV0IHlvdXIgaG9vayBhbHdheXMgYmUgY2FzdDsgaW4gdGhlIHBvb2wgd2hlcmUgeW91IGxlYXN0IGV4cGVjdCBpdCwgdGhlcmUgd2lsbCBiZSBhIGZpc2guIg0KIlJlbWV6IFNhc3NvbiIsIllvdSBnZXQgcGVhY2Ugb2YgbWluZCBub3QgYnkgdGhpbmtpbmcgYWJvdXQgaXQgb3IgaW1hZ2luaW5nIGl0LCBidXQgYnkgcXVpZXRlbmluZyBhbmQgcmVsYXhpbmcgdGhlIHJlc3RsZXNzIG1pbmQuIg0KIlJpY2hhcmQgQmFjaCIsIllvdXIgZnJpZW5kcyB3aWxsIGtub3cgeW91IGJldHRlciBpbiB0aGUgZmlyc3QgbWludXRlIHlvdSBtZWV0IHRoYW4geW91ciBhY3F1YWludGFuY2VzIHdpbGwga25vdyB5b3UgaW4gYSB0aG91c2FuZCB5ZWFycy4iDQoiUGVtYSBDaG9kcm9uIiwiV2hlbiB5b3UgYmVnaW4gdG8gdG91Y2ggeW91ciBoZWFydCBvciBsZXQgeW91ciBoZWFydCBiZSB0b3VjaGVkLCB5b3UgYmVnaW4gdG8gZGlzY292ZXIgdGhhdCBpdCdzIGJvdHRvbWxlc3MuIg0KIlJpY2hhcmQgQmFjaCIsIklmIHlvdSBsb3ZlIHNvbWVvbmUsIHNldCB0aGVtIGZyZWUuIElmIHRoZXkgY29tZSBiYWNrIHRoZXkncmUgeW91cnM7IGlmIHRoZXkgZG9uJ3QgdGhleSBuZXZlciB3ZXJlLiINCiJEYXZpZCBKb3JkYW4iLCJXaXNkb20gaXMga25vd2luZyB3aGF0IHRvIGRvIG5leHQ7IFNraWxsIGlzIGtub3dpbmcgaG93IHRvIGRvIGl0LCBhbmQgVmlydHVlIGlzIGRvaW5nIGl0LiINCiJSaWNoYXJkIEJhY2giLCJCYWQgdGhpbmdzIGFyZSBub3QgdGhlIHdvcnN0IHRoaW5ncyB0aGF0IGNhbiBoYXBwZW4gdG8gdXMuIE5vdGhpbmcgaXMgdGhlIHdvcnN0IHRoaW5nIHRoYXQgY2FuIGhhcHBlbiB0byB1cyEiDQoiQWxhbiBXYXR0cyIsIk5vIHZhbGlkIHBsYW5zIGZvciB0aGUgZnV0dXJlIGNhbiBiZSBtYWRlIGJ5IHRob3NlIHdobyBoYXZlIG5vIGNhcGFjaXR5IGZvciBsaXZpbmcgbm93LiINCiJPc2NhciBXaWxkZSIsIlRoZSBhaW0gb2YgbGlmZSBpcyBzZWxmLWRldmVsb3BtZW50LiBUbyByZWFsaXplIG9uZXMgbmF0dXJlIHBlcmZlY3RseSwgdGhhdCBpcyB3aGF0IGVhY2ggb2YgdXMgaXMgaGVyZSBmb3IuIg0KIkFuYXRvbGUgRnJhbmNlIiwiVG8gYWNjb21wbGlzaCBncmVhdCB0aGluZ3MsIHdlIG11c3Qgbm90IG9ubHkgYWN0LCBidXQgYWxzbyBkcmVhbTsgbm90IG9ubHkgcGxhbiwgYnV0IGFsc28gYmVsaWV2ZS4iDQoiVGhvbWFzIEVkaXNvbiIsIlRoZSBmaXJzdCByZXF1aXNpdGUgZm9yIHN1Y2Nlc3MgaXMgdGhlIGFiaWxpdHkgdG8gYXBwbHkgeW91ciBwaHlzaWNhbCBhbmQgbWVudGFsIGVuZXJnaWVzIHRvIG9uZSBwcm9ibGVtIGluY2Vzc2FudGx5IHdpdGhvdXQgZ3Jvd2luZyB3ZWFyeS4iDQoiSm9obiBTdGVpbmJlY2siLCJJZiB3ZSBjb3VsZCBsZWFybiB0byBsaWtlIG91cnNlbHZlcywgZXZlbiBhIGxpdHRsZSwgbWF5YmUgb3VyIGNydWVsdGllcyBhbmQgYW5nZXJzIG1pZ2h0IG1lbHQgYXdheS4iDQoiIiwiSWYgd2UgYXJlIGZhY2luZyBpbiB0aGUgcmlnaHQgZGlyZWN0aW9uLCBhbGwgd2UgaGF2ZSB0byBkbyBpcyBrZWVwIG9uIHdhbGtpbmcuIg0KIkVsZWFub3IgUm9vc2V2ZWx0IiwiUmVtZW1iZXIgYWx3YXlzIHRoYXQgeW91IG5vdCBvbmx5IGhhdmUgdGhlIHJpZ2h0IHRvIGJlIGFuIGluZGl2aWR1YWwsIHlvdSBoYXZlIGFuIG9ibGlnYXRpb24gdG8gYmUgb25lLiINCiJEZW5pcyBXYWl0bGV5IiwiVGhlcmUgYXJlIHR3byBwcmltYXJ5IGNob2ljZXMgaW4gbGlmZTogdG8gYWNjZXB0IGNvbmRpdGlvbnMgYXMgdGhleSBleGlzdCwgb3IgYWNjZXB0IHJlc3BvbnNpYmlsaXR5IGZvciBjaGFuZ2luZyB0aGVtLiINCiJFcGljdGV0dXMiLCJJZiB5b3Ugc2VlayB0cnV0aCB5b3Ugd2lsbCBub3Qgc2VlayB2aWN0b3J5IGJ5IGRpc2hvbm91cmFibGUgbWVhbnMsIGFuZCBpZiB5b3UgZmluZCB0cnV0aCB5b3Ugd2lsbCBiZWNvbWUgaW52aW5jaWJsZS4iDQoiRWtuYXRoIEVhc3dhcmFuIiwiVGhyb3VnaCBtZWRpdGF0aW9uIGFuZCBieSBnaXZpbmcgZnVsbCBhdHRlbnRpb24gdG8gb25lIHRoaW5nIGF0IGEgdGltZSwgd2UgY2FuIGxlYXJuIHRvIGRpcmVjdCBhdHRlbnRpb24gd2hlcmUgd2UgY2hvb3NlLiINCiJIZWxlbiBLZWxsZXIiLCJXZSBjb3VsZCBuZXZlciBsZWFybiB0byBiZSBicmF2ZSBhbmQgcGF0aWVudCBpZiB0aGVyZSB3ZXJlIG9ubHkgam95IGluIHRoZSB3b3JsZC4iDQoiTWFyY3VzIEF1cmVsaXVzIiwiSWYgaXQgaXMgbm90IHJpZ2h0IGRvIG5vdCBkbyBpdDsgaWYgaXQgaXMgbm90IHRydWUgZG8gbm90IHNheSBpdC4iDQoiTm9ybWFuIFNjaHdhcnprb3BmIiwiVGhlIHRydXRoIG9mIHRoZSBtYXR0ZXIgaXMgdGhhdCB5b3UgYWx3YXlzIGtub3cgdGhlIHJpZ2h0IHRoaW5nIHRvIGRvLiBUaGUgaGFyZCBwYXJ0IGlzIGRvaW5nIGl0LiINCiJKdWxpZSBNb3JnZW5zdGVybiIsIlNvbWUgcGVvcGxlIHRocml2ZSBvbiBodWdlLCBkcmFtYXRpYyBjaGFuZ2UuIFNvbWUgcGVvcGxlIHByZWZlciB0aGUgc2xvdyBhbmQgc3RlYWR5IHJvdXRlLiBEbyB3aGF0J3MgcmlnaHQgZm9yIHlvdS4iDQoiQmxhaXNlIFBhc2NhbCIsIk1hbiBpcyBlcXVhbGx5IGluY2FwYWJsZSBvZiBzZWVpbmcgdGhlIG5vdGhpbmduZXNzIGZyb20gd2hpY2ggaGUgZW1lcmdlcyBhbmQgdGhlIGluZmluaXR5IGluIHdoaWNoIGhlIGlzIGVuZ3VsZmVkLiINCiJMYXVyYSBUZXJlc2EgTWFycXVleiIsIkFycm9nYW5jZSBhbmQgcnVkZW5lc3MgYXJlIHRyYWluaW5nIHdoZWVscyBvbiB0aGUgYmljeWNsZSBvZiBsaWZlLCBmb3Igd2VhayBwZW9wbGUgd2hvIGNhbm5vdCBrZWVwIHRoZWlyIGJhbGFuY2Ugd2l0aG91dCB0aGVtLiINCiJDaGluZXNlIHByb3ZlcmIiLCJJZiB5b3UgYXJlIHBhdGllbnQgaW4gb25lIG1vbWVudCBvZiBhbmdlciwgeW91IHdpbGwgZXNjYXBlIG9uZSBodW5kcmVkIGRheXMgb2Ygc29ycm93LiINCiJBYnJhaGFtIExpbmNvbG4iLCJXaGVuIHlvdSBoYXZlIGdvdCBhbiBlbGVwaGFudCBieSB0aGUgaGluZCBsZWdzIGFuZCBoZSBpcyB0cnlpbmcgdG8gcnVuIGF3YXksIGl0J3MgYmVzdCB0byBsZXQgaGltIHJ1bi4iDQoiQnlyb24gUHVsc2lmZXIiLCJDb3VyYWdlIGlzIG5vdCBhYm91dCB0YWtpbmcgcmlza3MgdW5rbm93aW5nbHkgYnV0IHB1dHRpbmcgeW91ciBvd24gYmVpbmcgaW4gZnJvbnQgb2YgY2hhbGxlbmdlcyB0aGF0IG90aGVycyBtYXkgbm90IGJlIGFibGUgdG8uIg0KIlJpY2hhcmQgQmFjaCIsIkNhbiBtaWxlcyB0cnVseSBzZXBhcmF0ZSB5b3UgZnJvbSBmcmllbmRzLi4uIElmIHlvdSB3YW50IHRvIGJlIHdpdGggc29tZW9uZSB5b3UgbG92ZSwgYXJlbid0IHlvdSBhbHJlYWR5IHRoZXJlPyINCiJIYXJyeSBLZW1wIiwiVGhlIHBvb3IgbWFuIGlzIG5vdCBoZSB3aG8gaXMgd2l0aG91dCBhIGNlbnQsIGJ1dCBoZSB3aG8gaXMgd2l0aG91dCBhIGRyZWFtLiINCiJCZW5qYW1pbiBEaXNyYWVsaSIsIlRoZSBncmVhdGVzdCBnb29kIHlvdSBjYW4gZG8gZm9yIGFub3RoZXIgaXMgbm90IGp1c3Qgc2hhcmUgeW91ciByaWNoZXMsIGJ1dCByZXZlYWwgdG8gdGhlbSB0aGVpciBvd24uIg0KIkJ1ZGRoYSIsIkRvIG5vdCBkd2VsbCBpbiB0aGUgcGFzdCwgZG8gbm90IGRyZWFtIG9mIHRoZSBmdXR1cmUsIGNvbmNlbnRyYXRlIHRoZSBtaW5kIG9uIHRoZSBwcmVzZW50IG1vbWVudC4iDQoiIiwiUGVhY2Ugb2YgbWluZCBpcyBub3QgdGhlIGFic2VuY2Ugb2YgY29uZmxpY3QgZnJvbSBsaWZlLCBidXQgdGhlIGFiaWxpdHkgdG8gY29wZSB3aXRoIGl0LiINCiJIZWxlbiBLZWxsZXIiLCJGYWNlIHlvdXIgZGVmaWNpZW5jaWVzIGFuZCBhY2tub3dsZWRnZSB0aGVtOyBidXQgZG8gbm90IGxldCB0aGVtIG1hc3RlciB5b3UuIExldCB0aGVtIHRlYWNoIHlvdSBwYXRpZW5jZSwgc3dlZXRuZXNzLCBpbnNpZ2h0LiINCiJKb2huIEtlbm5lZHkiLCJDaGFuZ2UgaXMgdGhlIGxhdyBvZiBsaWZlLiBBbmQgdGhvc2Ugd2hvIGxvb2sgb25seSB0byB0aGUgcGFzdCBvciBwcmVzZW50IGFyZSBjZXJ0YWluIHRvIG1pc3MgdGhlIGZ1dHVyZS4iDQoiTWFyY3VzIEF1cmVsaXVzIiwiWW91IGhhdmUgcG93ZXIgb3ZlciB5b3VyIG1pbmQsIG5vdCBvdXRzaWRlIGV2ZW50cy4gUmVhbGl6ZSB0aGlzLCBhbmQgeW91IHdpbGwgZmluZCBzdHJlbmd0aC4iDQoiTG91aXMgUGFzdGV1ciIsIkxldCBtZSB0ZWxsIHlvdSB0aGUgc2VjcmV0IHRoYXQgaGFzIGxlZCBtZSB0byBteSBnb2FsOiBteSBzdHJlbmd0aCBsaWVzIHNvbGVseSBpbiBteSB0ZW5hY2l0eS4iDQoiQnVkZGhhIiwiV2UgYXJlIHdoYXQgd2UgdGhpbmsuIEFsbCB0aGF0IHdlIGFyZSBhcmlzZXMgd2l0aCBvdXIgdGhvdWdodHMuIFdpdGggb3VyIHRob3VnaHRzLCB3ZSBtYWtlIHRoZSB3b3JsZC4iDQoiSGVucnkgTG9uZ2ZlbGxvdyIsIkhlIHRoYXQgcmVzcGVjdHMgaGltc2VsZiBpcyBzYWZlIGZyb20gb3RoZXJzOyBoZSB3ZWFycyBhIGNvYXQgb2YgbWFpbCB0aGF0IG5vbmUgY2FuIHBpZXJjZS4iDQoiV2F5bmUgRHllciIsIkkgY2Fubm90IGFsd2F5cyBjb250cm9sIHdoYXQgZ29lcyBvbiBvdXRzaWRlLiBCdXQgSSBjYW4gYWx3YXlzIGNvbnRyb2wgd2hhdCBnb2VzIG9uIGluc2lkZS4iDQoiRGFpc2FrdSBJa2VkYSIsIldoYXQgbWF0dGVycyBpcyB0aGUgdmFsdWUgd2UndmUgY3JlYXRlZCBpbiBvdXIgbGl2ZXMsIHRoZSBwZW9wbGUgd2UndmUgbWFkZSBoYXBweSBhbmQgaG93IG11Y2ggd2UndmUgZ3Jvd24gYXMgcGVvcGxlLiINCiJFcGljdGV0dXMiLCJXaGVuIHlvdSBhcmUgb2ZmZW5kZWQgYXQgYW55IG1hbidzIGZhdWx0LCB0dXJuIHRvIHlvdXJzZWxmIGFuZCBzdHVkeSB5b3VyIG93biBmYWlsaW5ncy4gVGhlbiB5b3Ugd2lsbCBmb3JnZXQgeW91ciBhbmdlci4iDQoiUnVtaSIsIkV2ZXJ5b25lIGhhcyBiZWVuIG1hZGUgZm9yIHNvbWUgcGFydGljdWxhciB3b3JrLCBhbmQgdGhlIGRlc2lyZSBmb3IgdGhhdCB3b3JrIGhhcyBiZWVuIHB1dCBpbiBldmVyeSBoZWFydC4iDQoiTmFwb2xlb24gQm9uYXBhcnRlIiwiVGFrZSB0aW1lIHRvIGRlbGliZXJhdGUsIGJ1dCB3aGVuIHRoZSB0aW1lIGZvciBhY3Rpb24gaGFzIGFycml2ZWQsIHN0b3AgdGhpbmtpbmcgYW5kIGdvIGluLiINCiJEYWxhaSBMYW1hIiwiV2l0aCByZWFsaXphdGlvbiBvZiBvbmVzIG93biBwb3RlbnRpYWwgYW5kIHNlbGYtY29uZmlkZW5jZSBpbiBvbmVzIGFiaWxpdHksIG9uZSBjYW4gYnVpbGQgYSBiZXR0ZXIgd29ybGQuIg0KIkZyYW5rbGluIFJvb3NldmVsdCIsIkhhcHBpbmVzcyBpcyBub3QgaW4gdGhlIG1lcmUgcG9zc2Vzc2lvbiBvZiBtb25leTsgaXQgbGllcyBpbiB0aGUgam95IG9mIGFjaGlldmVtZW50LCBpbiB0aGUgdGhyaWxsIG9mIGNyZWF0aXZlIGVmZm9ydC4iDQoiUGVhcmwgQnVjayIsIllvdSBjYW5ub3QgbWFrZSB5b3Vyc2VsZiBmZWVsIHNvbWV0aGluZyB5b3UgZG8gbm90IGZlZWwsIGJ1dCB5b3UgY2FuIG1ha2UgeW91cnNlbGYgZG8gcmlnaHQgaW4gc3BpdGUgb2YgeW91ciBmZWVsaW5ncy4iDQoiTWFyeSBLYXkgQXNoIiwiVGhvc2Ugd2hvIGFyZSBibGVzc2VkIHdpdGggdGhlIG1vc3QgdGFsZW50IGRvbid0IG5lY2Vzc2FyaWx5IG91dHBlcmZvcm0gZXZlcnlvbmUgZWxzZS4gSXQncyB0aGUgcGVvcGxlIHdpdGggZm9sbG93LXRocm91Z2ggd2hvIGV4Y2VsLiINCiJBbGJlcnQgRWluc3RlaW4iLCJUcnkgbm90IHRvIGJlY29tZSBhIG1hbiBvZiBzdWNjZXNzLCBidXQgcmF0aGVyIHRyeSB0byBiZWNvbWUgYSBtYW4gb2YgdmFsdWUuIg0KIlNvcGhvY2xlcyIsIk1lbiBvZiBwZXJ2ZXJzZSBvcGluaW9uIGRvIG5vdCBrbm93IHRoZSBleGNlbGxlbmNlIG9mIHdoYXQgaXMgaW4gdGhlaXIgaGFuZHMsIHRpbGwgc29tZSBvbmUgZGFzaCBpdCBmcm9tIHRoZW0uIg0KIlJlbmUgRGVzY2FydGVzIiwiSXQgaXMgbm90IGVub3VnaCB0byBoYXZlIGEgZ29vZCBtaW5kOyB0aGUgbWFpbiB0aGluZyBpcyB0byB1c2UgaXQgd2VsbC4iDQoiQnlyb24gUHVsc2lmZXIiLCJSZXNwb25zaWJpbGl0eSBpcyBub3QgaW5oZXJpdGVkLCBpdCBpcyBhIGNob2ljZSB0aGF0IGV2ZXJ5b25lIG5lZWRzIHRvIG1ha2UgYXQgc29tZSBwb2ludCBpbiB0aGVpciBsaWZlLiINCiJBbWVsaWEgRWFyaGFydCIsIk5ldmVyIGRvIHRoaW5ncyBvdGhlcnMgY2FuIGRvIGFuZCB3aWxsIGRvLCBpZiB0aGVyZSBhcmUgdGhpbmdzIG90aGVycyBjYW5ub3QgZG8gb3Igd2lsbCBub3QgZG8uIg0KIkppbW15IERlYW4iLCJJIGNhbid0IGNoYW5nZSB0aGUgZGlyZWN0aW9uIG9mIHRoZSB3aW5kLCBidXQgSSBjYW4gYWRqdXN0IG15IHNhaWxzIHRvIGFsd2F5cyByZWFjaCBteSBkZXN0aW5hdGlvbi4iDQoiR2VvcmdlIEFsbGVuIiwiUGVvcGxlIG9mIG1lZGlvY3JlIGFiaWxpdHkgc29tZXRpbWVzIGFjaGlldmUgb3V0c3RhbmRpbmcgc3VjY2VzcyBiZWNhdXNlIHRoZXkgZG9uJ3Qga25vdyB3aGVuIHRvIHF1aXQuIE1vc3QgbWVuIHN1Y2NlZWQgYmVjYXVzZSB0aGV5IGFyZSBkZXRlcm1pbmVkIHRvLiINCiJKb3NlcGggUm91eCIsIkEgZmluZSBxdW90YXRpb24gaXMgYSBkaWFtb25kIG9uIHRoZSBmaW5nZXIgb2YgYSBtYW4gb2Ygd2l0LCBhbmQgYSBwZWJibGUgaW4gdGhlIGhhbmQgb2YgYSBmb29sLiINCiJCZXJuaWNlIFJlYWdvbiIsIkxpZmUncyBjaGFsbGVuZ2VzIGFyZSBub3Qgc3VwcG9zZWQgdG8gcGFyYWx5c2UgeW91LCB0aGV5J3JlIHN1cHBvc2VkIHRvIGhlbHAgeW91IGRpc2NvdmVyIHdobyB5b3UgYXJlLiINCiJTb2NyYXRlcyIsIlRoZSBncmVhdGVzdCB3YXkgdG8gbGl2ZSB3aXRoIGhvbm91ciBpbiB0aGlzIHdvcmxkIGlzIHRvIGJlIHdoYXQgd2UgcHJldGVuZCB0byBiZS4iDQoiSGVucmkgQmVyZ3NvbiIsIlRvIGV4aXN0IGlzIHRvIGNoYW5nZSwgdG8gY2hhbmdlIGlzIHRvIG1hdHVyZSwgdG8gbWF0dXJlIGlzIHRvIGdvIG9uIGNyZWF0aW5nIG9uZXNlbGYgZW5kbGVzc2x5LiINCiJBbGJlcnQgRWluc3RlaW4iLCJUcnkgbm90IHRvIGJlY29tZSBhIG1hbiBvZiBzdWNjZXNzIGJ1dCByYXRoZXIgdHJ5IHRvIGJlY29tZSBhIG1hbiBvZiB2YWx1ZS4iDQoiQnlyb24gUHVsc2lmZXIiLCJZb3UgY2FuJ3QgY3JlYXRlIGluIGEgdmFjdXVtLiBMaWZlIGdpdmVzIHlvdSB0aGUgbWF0ZXJpYWwgYW5kIGRyZWFtcyBjYW4gcHJvcGVsIG5ldyBiZWdpbm5pbmdzLiINCiJCdWRkaGEiLCJZb3VyIHdvcmsgaXMgdG8gZGlzY292ZXIgeW91ciB3b3JsZCBhbmQgdGhlbiB3aXRoIGFsbCB5b3VyIGhlYXJ0IGdpdmUgeW91cnNlbGYgdG8gaXQuIg0KIkRhaXNha3UgSWtlZGEiLCJUaGUgcGVyc29uIHdobyBsaXZlcyBsaWZlIGZ1bGx5LCBnbG93aW5nIHdpdGggbGlmZSdzIGVuZXJneSwgaXMgdGhlIHBlcnNvbiB3aG8gbGl2ZXMgYSBzdWNjZXNzZnVsIGxpZmUuIg0KIlJpY2hhcmQgQmFjaCIsIkRvbid0IHR1cm4gYXdheSBmcm9tIHBvc3NpYmxlIGZ1dHVyZXMgYmVmb3JlIHlvdSdyZSBjZXJ0YWluIHlvdSBkb24ndCBoYXZlIGFueXRoaW5nIHRvIGxlYXJuIGZyb20gdGhlbS4iDQoiRGF2aWQgQnJpbmtsZXkiLCJBIHN1Y2Nlc3NmdWwgcGVyc29uIGlzIG9uZSB3aG8gY2FuIGxheSBhIGZpcm0gZm91bmRhdGlvbiB3aXRoIHRoZSBicmlja3MgdGhhdCBvdGhlcnMgdGhyb3cgYXQgaGltIG9yIGhlci4iDQoiQnVkZGhhIiwiQWxsIHRoYXQgd2UgYXJlIGlzIHRoZSByZXN1bHQgb2Ygd2hhdCB3ZSBoYXZlIHRob3VnaHQuIFRoZSBtaW5kIGlzIGV2ZXJ5dGhpbmcuIFdoYXQgd2UgdGhpbmsgd2UgYmVjb21lLiINCiJIZW5yaS1GcmVkZXJpYyBBbWllbCIsIldvcmsgd2hpbGUgeW91IGhhdmUgdGhlIGxpZ2h0LiBZb3UgYXJlIHJlc3BvbnNpYmxlIGZvciB0aGUgdGFsZW50IHRoYXQgaGFzIGJlZW4gZW50cnVzdGVkIHRvIHlvdS4iDQoiV2lsbGlhbSBTaGFrZXNwZWFyZSIsIkhvdyBmYXIgdGhhdCBsaXR0bGUgY2FuZGxlIHRocm93cyBpdHMgYmVhbXMhIFNvIHNoaW5lcyBhIGdvb2QgZGVlZCBpbiBhIG5hdWdodHkgd29ybGQuIg0KIk5hcG9sZW9uIEhpbGwiLCJFdmVyeSBhZHZlcnNpdHksIGV2ZXJ5IGZhaWx1cmUsIGV2ZXJ5IGhlYXJ0YWNoZSBjYXJyaWVzIHdpdGggaXQgdGhlIHNlZWQgb2YgYW4gZXF1YWwgb3IgZ3JlYXRlciBiZW5lZml0LiINCiJUb255IFJvYmJpbnMiLCJJdCBpcyBpbiB5b3VyIG1vbWVudHMgb2YgZGVjaXNpb24gdGhhdCB5b3VyIGRlc3RpbnkgaXMgc2hhcGVkLiINCiIiLCJBbiBvYnN0YWNsZSBtYXkgYmUgZWl0aGVyIGEgc3RlcHBpbmcgc3RvbmUgb3IgYSBzdHVtYmxpbmcgYmxvY2suIg0KIlBpZXJyZSBBdWd1c3RlIFJlbm9pciIsIlRoZSBwYWluIHBhc3NlcywgYnV0IHRoZSBiZWF1dHkgcmVtYWlucy4iDQoiQm9iIE5ld2hhcnQiLCJBbGwgSSBjYW4gc2F5IGFib3V0IGxpZmUgaXMsIE9oIEdvZCwgZW5qb3kgaXQhIg0KIlJpdGEgTWFlIEJyb3duIiwiQ3JlYXRpdml0eSBjb21lcyBmcm9tIHRydXN0LiBUcnVzdCB5b3VyIGluc3RpbmN0cy4gQW5kIG5ldmVyIGhvcGUgbW9yZSB0aGFuIHlvdSB3b3JrLiINCiJMdWx1bGVtb24iLCJZb3VyIG91dGxvb2sgb24gbGlmZSBpcyBhIGRpcmVjdCByZWZsZWN0aW9uIG9uIGhvdyBtdWNoIHlvdSBsaWtlIHlvdXJzZWxmLiINCiJMYW8gVHp1IiwiSSBoYXZlIGp1c3QgdGhyZWUgdGhpbmdzIHRvIHRlYWNoOiBzaW1wbGljaXR5LCBwYXRpZW5jZSwgY29tcGFzc2lvbi4gVGhlc2UgdGhyZWUgYXJlIHlvdXIgZ3JlYXRlc3QgdHJlYXN1cmVzLiINCiJLaW4gSHViYmFyZCIsIllvdSB3b24ndCBza2lkIGlmIHlvdSBzdGF5IGluIGEgcnV0LiINCiJNYXJ5IE1vcnJpc3NleSIsIllvdSBibG9jayB5b3VyIGRyZWFtIHdoZW4geW91IGFsbG93IHlvdXIgZmVhciB0byBncm93IGJpZ2dlciB0aGFuIHlvdXIgZmFpdGguIg0KIkFyaXN0b3RsZSIsIkhhcHBpbmVzcyBkZXBlbmRzIHVwb24gb3Vyc2VsdmVzLiINCiJBbGJlcnQgU2Nod2VpdHplciIsIldoZXJldmVyIGEgbWFuIHR1cm5zIGhlIGNhbiBmaW5kIHNvbWVvbmUgd2hvIG5lZWRzIGhpbS4iDQoiTWF5YSBBbmdlbG91IiwiSWYgb25lIGlzIGx1Y2t5LCBhIHNvbGl0YXJ5IGZhbnRhc3kgY2FuIHRvdGFsbHkgdHJhbnNmb3JtIG9uZSBtaWxsaW9uIHJlYWxpdGllcy4iDQoiTGVvIEJ1c2NhZ2xpYSIsIk5ldmVyIGlkZWFsaXplIG90aGVycy4gVGhleSB3aWxsIG5ldmVyIGxpdmUgdXAgdG8geW91ciBleHBlY3RhdGlvbnMuIg0KIkxhbyBUenUiLCJXaGVuIHlvdSByZWFsaXplIHRoZXJlIGlzIG5vdGhpbmcgbGFja2luZywgdGhlIHdob2xlIHdvcmxkIGJlbG9uZ3MgdG8geW91LiINCiJEYWxhaSBMYW1hIiwiSGFwcGluZXNzIGlzIG5vdCBzb21ldGhpbmcgcmVhZHkgbWFkZS4gSXQgY29tZXMgZnJvbSB5b3VyIG93biBhY3Rpb25zLiINCiJQZXRlciBFbGJvdyIsIk1lYW5pbmcgaXMgbm90IHdoYXQgeW91IHN0YXJ0IHdpdGggYnV0IHdoYXQgeW91IGVuZCB1cCB3aXRoLiINCiJBbm5lIEZyYW5rIiwiTm8gb25lIGhhcyBldmVyIGJlY29tZSBwb29yIGJ5IGdpdmluZy4iDQoiTW90aGVyIFRlcmVzYSIsIkJlIGZhaXRoZnVsIGluIHNtYWxsIHRoaW5ncyBiZWNhdXNlIGl0IGlzIGluIHRoZW0gdGhhdCB5b3VyIHN0cmVuZ3RoIGxpZXMuIg0KIkhlcmFjbGl0dXMiLCJBbGwgaXMgZmx1eDsgbm90aGluZyBzdGF5cyBzdGlsbC4iDQoiTGVvbmFyZG8gZGEgVmluY2kiLCJIZSB3aG8gaXMgZml4ZWQgdG8gYSBzdGFyIGRvZXMgbm90IGNoYW5nZSBoaXMgbWluZC4iDQoiTWFyY3VzIEF1cmVsaXVzIiwiSGUgd2hvIGxpdmVzIGluIGhhcm1vbnkgd2l0aCBoaW1zZWxmIGxpdmVzIGluIGhhcm1vbnkgd2l0aCB0aGUgdW5pdmVyc2UuIg0KIlNvcGhvY2xlcyIsIklnbm9yYW50IG1lbiBkb24ndCBrbm93IHdoYXQgZ29vZCB0aGV5IGhvbGQgaW4gdGhlaXIgaGFuZHMgdW50aWwgdGhleSd2ZSBmbHVuZyBpdCBhd2F5LiINCiJBbGJlcnQgRWluc3RlaW4iLCJXaGVuIHRoZSBzb2x1dGlvbiBpcyBzaW1wbGUsIEdvZCBpcyBhbnN3ZXJpbmcuIg0KIk5hcG9sZW9uIEhpbGwiLCJBbGwgYWNoaWV2ZW1lbnRzLCBhbGwgZWFybmVkIHJpY2hlcywgaGF2ZSB0aGVpciBiZWdpbm5pbmcgaW4gYW4gaWRlYS4iDQoiUHVibGlsaXVzIFN5cnVzIiwiRG8gbm90IHR1cm4gYmFjayB3aGVuIHlvdSBhcmUganVzdCBhdCB0aGUgZ29hbC4iDQoiQnlyb24gUHVsc2lmZXIiLCJZb3UgY2FuJ3QgdHJ1c3Qgd2l0aG91dCByaXNrIGJ1dCBuZWl0aGVyIGNhbiB5b3UgbGl2ZSBpbiBhIGNvY29vbi4iDQoiUnVkb2xmIEFybmhlaW0iLCJBbGwgcGVyY2VpdmluZyBpcyBhbHNvIHRoaW5raW5nLCBhbGwgcmVhc29uaW5nIGlzIGFsc28gaW50dWl0aW9uLCBhbGwgb2JzZXJ2YXRpb24gaXMgYWxzbyBpbnZlbnRpb24uIg0KIkNoYW5uaW5nIiwiRXJyb3IgaXMgZGlzY2lwbGluZSB0aHJvdWdoIHdoaWNoIHdlIGFkdmFuY2UuIg0KIlBlYXJsIEJ1Y2siLCJUaGUgdHJ1dGggaXMgYWx3YXlzIGV4Y2l0aW5nLiBTcGVhayBpdCwgdGhlbi4gTGlmZSBpcyBkdWxsIHdpdGhvdXQgaXQuIg0KIkNvbmZ1Y2l1cyIsIlRoZSBzdXBlcmlvciBtYW4gaXMgbW9kZXN0IGluIGhpcyBzcGVlY2gsIGJ1dCBleGNlZWRzIGluIGhpcyBhY3Rpb25zLiINCiJWb2x0YWlyZSIsIlRoZSBsb25nZXIgd2UgZHdlbGwgb24gb3VyIG1pc2ZvcnR1bmVzLCB0aGUgZ3JlYXRlciBpcyB0aGVpciBwb3dlciB0byBoYXJtIHVzLiINCiJDZXJ2YW50ZXMiLCJUaG9zZSB3aG8gd2lsbCBwbGF5IHdpdGggY2F0cyBtdXN0IGV4cGVjdCB0byBiZSBzY3JhdGNoZWQuIg0KIiIsIkkndmUgbmV2ZXIgc2VlbiBhIHNtaWxpbmcgZmFjZSB0aGF0IHdhcyBub3QgYmVhdXRpZnVsLiINCiJBcmlzdG90bGUiLCJJbiBhbGwgdGhpbmdzIG9mIG5hdHVyZSB0aGVyZSBpcyBzb21ldGhpbmcgb2YgdGhlIG1hcnZlbGxvdXMuIg0KIk1hcmN1cyBBdXJlbGl1cyIsIlRoZSB1bml2ZXJzZSBpcyB0cmFuc2Zvcm1hdGlvbjsgb3VyIGxpZmUgaXMgd2hhdCBvdXIgdGhvdWdodHMgbWFrZSBpdC4iDQoiU2FtdWVsIEpvaG5zb24iLCJNZW1vcnkgaXMgdGhlIG1vdGhlciBvZiBhbGwgd2lzZG9tLiINCiJDb25mdWNpdXMiLCJTaWxlbmNlIGlzIHRoZSB0cnVlIGZyaWVuZCB0aGF0IG5ldmVyIGJldHJheXMuIg0KIk5hcG9sZW9uIEhpbGwiLCJZb3UgbWlnaHQgd2VsbCByZW1lbWJlciB0aGF0IG5vdGhpbmcgY2FuIGJyaW5nIHlvdSBzdWNjZXNzIGJ1dCB5b3Vyc2VsZi4iDQoiQmVuamFtaW4gRnJhbmtsaW4iLCJXYXRjaCB0aGUgbGl0dGxlIHRoaW5nczsgYSBzbWFsbCBsZWFrIHdpbGwgc2luayBhIGdyZWF0IHNoaXAuIg0KIldpbGxpYW0gU2hha2VzcGVhcmUiLCJHb2QgaGFzIGdpdmVuIHlvdSBvbmUgZmFjZSwgYW5kIHlvdSBtYWtlIHlvdXJzZWxmIGFub3RoZXIuIg0KIkNvbmZ1Y2l1cyIsIlRvIGJlIHdyb25nZWQgaXMgbm90aGluZyB1bmxlc3MgeW91IGNvbnRpbnVlIHRvIHJlbWVtYmVyIGl0LiINCiIiLCJLaW5kbmVzcyBpcyB0aGUgZ3JlYXRlc3Qgd2lzZG9tLiINCiJUZWh5aSBIc2llaCIsIkFjdGlvbiB3aWxsIHJlbW92ZSB0aGUgZG91YnRzIHRoYXQgdGhlb3J5IGNhbm5vdCBzb2x2ZS4iDQoiIiwiRG9uJ3QgbWlzcyBhbGwgdGhlIGJlYXV0aWZ1bCBjb2xvcnMgb2YgdGhlIHJhaW5ib3cgbG9va2luZyBmb3IgdGhhdCBwb3Qgb2YgZ29sZC4iDQoiTmFwb2xlb24gSGlsbCIsIllvdXIgYmlnIG9wcG9ydHVuaXR5IG1heSBiZSByaWdodCB3aGVyZSB5b3UgYXJlIG5vdy4iDQoiQ2hpbmVzZSBwcm92ZXJiIiwiUGVvcGxlIHdobyBzYXkgaXQgY2Fubm90IGJlIGRvbmUgc2hvdWxkIG5vdCBpbnRlcnJ1cHQgdGhvc2Ugd2hvIGFyZSBkb2luZyBpdC4iDQoiSmFwYW5lc2UgcHJvdmVyYiIsIlRoZSBkYXkgeW91IGRlY2lkZSB0byBkbyBpdCBpcyB5b3VyIGx1Y2t5IGRheS4iDQoiQ2ljZXJvIiwiV2UgbXVzdCBub3Qgc2F5IGV2ZXJ5IG1pc3Rha2UgaXMgYSBmb29saXNoIG9uZS4iDQoiR2VvcmdlIFBhdHRvbiIsIkFjY2VwdCBjaGFsbGVuZ2VzLCBzbyB0aGF0IHlvdSBtYXkgZmVlbCB0aGUgZXhoaWxhcmF0aW9uIG9mIHZpY3RvcnkuIg0KIkFuYXRvbGUgRnJhbmNlIiwiSXQgaXMgYmV0dGVyIHRvIHVuZGVyc3RhbmQgYSBsaXR0bGUgdGhhbiB0byBtaXN1bmRlcnN0YW5kIGEgbG90LiINCiIiLCJZb3UgZG9uJ3QgZHJvd24gYnkgZmFsbGluZyBpbiB3YXRlci4gWW91IGRyb3duIGJ5IHN0YXlpbmcgdGhlcmUuIg0KIiIsIk5ldmVyIGJlIGFmcmFpZCB0byB0cnksIHJlbWVtYmVyLi4uIEFtYXRldXJzIGJ1aWx0IHRoZSBhcmssIFByb2Zlc3Npb25hbHMgYnVpbHQgdGhlIFRpdGFuaWMuIg0KIkpvaGFubiBXb2xmZ2FuZyB2b24gR29ldGhlIiwiQ29ycmVjdGlvbiBkb2VzIG11Y2gsIGJ1dCBlbmNvdXJhZ2VtZW50IGRvZXMgbW9yZS4iDQoiRXBpY3RldHVzIiwiS25vdywgZmlyc3QsIHdobyB5b3UgYXJlLCBhbmQgdGhlbiBhZG9ybiB5b3Vyc2VsZiBhY2NvcmRpbmdseS4iDQoiT3ByYWggV2luZnJleSIsIlRoZSBiaWdnZXN0IGFkdmVudHVyZSB5b3UgY2FuIGV2ZXIgdGFrZSBpcyB0byBsaXZlIHRoZSBsaWZlIG9mIHlvdXIgZHJlYW1zLiINCiJDaGFybGVzIFN3aW5kb2xsIiwiTGlmZSBpcyAxMCUgd2hhdCBoYXBwZW5zIHRvIHlvdSBhbmQgOTAlIGhvdyB5b3UgcmVhY3QgdG8gaXQuIg0KIkN5bnRoaWEgT3ppY2siLCJUbyB3YW50IHRvIGJlIHdoYXQgb25lIGNhbiBiZSBpcyBwdXJwb3NlIGluIGxpZmUuIg0KIkRhbGFpIExhbWEiLCJSZW1lbWJlciB0aGF0IHNvbWV0aW1lcyBub3QgZ2V0dGluZyB3aGF0IHlvdSB3YW50IGlzIGEgd29uZGVyZnVsIHN0cm9rZSBvZiBsdWNrLiINCiJXaW5zdG9uIENodXJjaGlsbCIsIkhpc3Rvcnkgd2lsbCBiZSBraW5kIHRvIG1lIGZvciBJIGludGVuZCB0byB3cml0ZSBpdC4iDQoiV2F5bmUgRHllciIsIk91ciBsaXZlcyBhcmUgYSBzdW0gdG90YWwgb2YgdGhlIGNob2ljZXMgd2UgaGF2ZSBtYWRlLiINCiJMZW9uYXJkbyBkYSBWaW5jaSIsIlRpbWUgc3RheXMgbG9uZyBlbm91Z2ggZm9yIGFueW9uZSB3aG8gd2lsbCB1c2UgaXQuIg0KIiIsIk5ldmVyIHRlbGwgbWUgdGhlIHNreSdzIHRoZSBsaW1pdCB3aGVuIHRoZXJlIGFyZSBmb290cHJpbnRzIG9uIHRoZSBtb29uLiINCiJEZW5pcyBXYWl0bGV5IiwiWW91IG11c3Qgd2VsY29tZSBjaGFuZ2UgYXMgdGhlIHJ1bGUgYnV0IG5vdCBhcyB5b3VyIHJ1bGVyLiINCiJKaW0gUm9obiIsIkdpdmUgd2hhdGV2ZXIgeW91IGFyZSBkb2luZyBhbmQgd2hvZXZlciB5b3UgYXJlIHdpdGggdGhlIGdpZnQgb2YgeW91ciBhdHRlbnRpb24uIg0KIkxlbmEgSG9ybmUiLCJBbHdheXMgYmUgc21hcnRlciB0aGFuIHRoZSBwZW9wbGUgd2hvIGhpcmUgeW91LiINCiJUb20gUGV0ZXJzIiwiRm9ybXVsYSBmb3Igc3VjY2VzczogdW5kZXIgcHJvbWlzZSBhbmQgb3ZlciBkZWxpdmVyLiINCiJIZW5yaSBCZXJnc29uIiwiVGhlIGV5ZSBzZWVzIG9ubHkgd2hhdCB0aGUgbWluZCBpcyBwcmVwYXJlZCB0byBjb21wcmVoZW5kLiINCiJMZWUgTWlsZG9uIiwiUGVvcGxlIHNlbGRvbSBub3RpY2Ugb2xkIGNsb3RoZXMgaWYgeW91IHdlYXIgYSBiaWcgc21pbGUuIg0KIlNoYWt0aSBHYXdhaW4iLCJUaGUgbW9yZSBsaWdodCB5b3UgYWxsb3cgd2l0aGluIHlvdSwgdGhlIGJyaWdodGVyIHRoZSB3b3JsZCB5b3UgbGl2ZSBpbiB3aWxsIGJlLiINCiJXYWx0ZXIgQW5kZXJzb24iLCJOb3RoaW5nIGRpbWluaXNoZXMgYW54aWV0eSBmYXN0ZXIgdGhhbiBhY3Rpb24uIg0KIkFuZHJlIEdpZGUiLCJNYW4gY2Fubm90IGRpc2NvdmVyIG5ldyBvY2VhbnMgdW5sZXNzIGhlIGhhcyB0aGUgY291cmFnZSB0byBsb3NlIHNpZ2h0IG9mIHRoZSBzaG9yZS4iDQoiQ2FybCBKdW5nIiwiRXZlcnl0aGluZyB0aGF0IGlycml0YXRlcyB1cyBhYm91dCBvdGhlcnMgY2FuIGxlYWQgdXMgdG8gYW4gdW5kZXJzdGFuZGluZyBhYm91dCBvdXJzZWx2ZXMuIg0KIlN1biBUenUiLCJDYW4geW91IGltYWdpbmUgd2hhdCBJIHdvdWxkIGRvIGlmIEkgY291bGQgZG8gYWxsIEkgY2FuPyINCiJCZW5qYW1pbiBEaXNyYWVsaSIsIklnbm9yYW5jZSBuZXZlciBzZXR0bGUgYSBxdWVzdGlvbi4iDQoiUGF1bCBDZXphbm5lIiwiVGhlIGF3YXJlbmVzcyBvZiBvdXIgb3duIHN0cmVuZ3RoIG1ha2VzIHVzIG1vZGVzdC4iDQoiQ29uZnVjaXVzIiwiVGhleSBtdXN0IG9mdGVuIGNoYW5nZSwgd2hvIHdvdWxkIGJlIGNvbnN0YW50IGluIGhhcHBpbmVzcyBvciB3aXNkb20uIg0KIlRvbSBLcmF1c2UiLCJUaGVyZSBhcmUgbm8gZmFpbHVyZXMuIEp1c3QgZXhwZXJpZW5jZXMgYW5kIHlvdXIgcmVhY3Rpb25zIHRvIHRoZW0uIg0KIkZyYW5rIFR5Z2VyIiwiWW91ciBmdXR1cmUgZGVwZW5kcyBvbiBtYW55IHRoaW5ncywgYnV0IG1vc3RseSBvbiB5b3UuIg0KIkRvcm90aHkgVGhvbXBzb24iLCJGZWFyIGdyb3dzIGluIGRhcmtuZXNzOyBpZiB5b3UgdGhpbmsgdGhlcmVzIGEgYm9nZXltYW4gYXJvdW5kLCB0dXJuIG9uIHRoZSBsaWdodC4iDQoiU2h1bnJ5dSBTdXp1a2kiLCJUaGUgbW9zdCBpbXBvcnRhbnQgcG9pbnQgaXMgdG8gYWNjZXB0IHlvdXJzZWxmIGFuZCBzdGFuZCBvbiB5b3VyIHR3byBmZWV0LiINCiJUb21hcyBFbGlvdCIsIkRvIG5vdCBleHBlY3QgdGhlIHdvcmxkIHRvIGxvb2sgYnJpZ2h0LCBpZiB5b3UgaGFiaXR1YWxseSB3ZWFyIGdyYXktYnJvd24gZ2xhc3Nlcy4iDQoiRG9uYWxkIFRydW1wIiwiQXMgbG9uZyBhcyB5b3VyIGdvaW5nIHRvIGJlIHRoaW5raW5nIGFueXdheSwgdGhpbmsgYmlnLiINCiJKb2huIERld2V5IiwiV2l0aG91dCBzb21lIGdvYWxzIGFuZCBzb21lIGVmZm9ydHMgdG8gcmVhY2ggaXQsIG5vIG1hbiBjYW4gbGl2ZS4iDQoiUmljaGFyZCBCcmF1bnN0ZWluIiwiSGUgd2hvIG9idGFpbnMgaGFzIGxpdHRsZS4gSGUgd2hvIHNjYXR0ZXJzIGhhcyBtdWNoLiINCiJHZW9yZ2UgT3J3ZWxsIiwiTXl0aHMgd2hpY2ggYXJlIGJlbGlldmVkIGluIHRlbmQgdG8gYmVjb21lIHRydWUuIg0KIkJ1ZGRoYSIsIlRoZSBmb290IGZlZWxzIHRoZSBmb290IHdoZW4gaXQgZmVlbHMgdGhlIGdyb3VuZC4iDQoiSm9obiBQZXRpdC1TZW5uIiwiTm90IHdoYXQgd2UgaGF2ZSBidXQgd2hhdCB3ZSBlbmpveSBjb25zdGl0dXRlcyBvdXIgYWJ1bmRhbmNlLiINCiJHZW9yZ2UgRWxpb3QiLCJJdCBpcyBuZXZlciB0b28gbGF0ZSB0byBiZSB3aGF0IHlvdSBtaWdodCBoYXZlIGJlZW4uIg0KIk1hcnkgV29sbHN0b25lY3JhZnQiLCJUaGUgYmVnaW5uaW5nIGlzIGFsd2F5cyB0b2RheS4iDQoiU2hlbGRvbiBLb3BwIiwiSW4gdGhlIGxvbmcgcnVuIHdlIGdldCBubyBtb3JlIHRoYW4gd2UgaGF2ZSBiZWVuIHdpbGxpbmcgdG8gcmlzayBnaXZpbmcuIg0KIlJhbHBoIEVtZXJzb24iLCJTZWxmLXRydXN0IGlzIHRoZSBmaXJzdCBzZWNyZXQgb2Ygc3VjY2Vzcy4iDQoiU2F0Y2hlbCBQYWlnZSIsIkRvbid0IGxvb2sgYmFjay4gU29tZXRoaW5nIG1pZ2h0IGJlIGdhaW5pbmcgb24geW91LiINCiJNYXJjdXMgQXVyZWxpdXMiLCJMb29rIGJhY2sgb3ZlciB0aGUgcGFzdCwgd2l0aCBpdHMgY2hhbmdpbmcgZW1waXJlcyB0aGF0IHJvc2UgYW5kIGZlbGwsIGFuZCB5b3UgY2FuIGZvcmVzZWUgdGhlIGZ1dHVyZSwgdG9vLiINCiJHZW9yZ2UgQmVybmFyZCBTaGF3IiwiQSBsaWZlIHNwZW50IG1ha2luZyBtaXN0YWtlcyBpcyBub3Qgb25seSBtb3JlIGhvbm91cmFibGUsIGJ1dCBtb3JlIHVzZWZ1bCB0aGFuIGEgbGlmZSBzcGVudCBkb2luZyBub3RoaW5nLiINCiJFcGljdGV0dXMiLCJNZW4gYXJlIGRpc3R1cmJlZCBub3QgYnkgdGhpbmdzLCBidXQgYnkgdGhlIHZpZXcgd2hpY2ggdGhleSB0YWtlIG9mIHRoZW0uIg0KIkJsYWlzZSBQYXNjYWwiLCJJbWFnaW5hdGlvbiBkaXNwb3NlcyBvZiBldmVyeXRoaW5nOyBpdCBjcmVhdGVzIGJlYXV0eSwganVzdGljZSwgYW5kIGhhcHBpbmVzcywgd2hpY2ggYXJlIGV2ZXJ5dGhpbmcgaW4gdGhpcyB3b3JsZC4iDQoiTWFyayBUd2FpbiIsIkhhcHBpbmVzcyBpcyBhIFN3ZWRpc2ggc3Vuc2V0LCBpdCBpcyB0aGVyZSBmb3IgYWxsLCBidXQgbW9zdCBvZiB1cyBsb29rIHRoZSBvdGhlciB3YXkgYW5kIGxvc2UgaXQuIg0KIiIsIkEgc21pbGUgaXMgYSBsaWdodCBpbiB0aGUgd2luZG93IG9mIHlvdXIgZmFjZSB0byBzaG93IHlvdXIgaGVhcnQgaXMgYXQgaG9tZS4iDQoiQnlyb24gUHVsc2lmZXIiLCJMb29rIGZvcndhcmQgdG8gc3ByaW5nIGFzIGEgdGltZSB3aGVuIHlvdSBjYW4gc3RhcnQgdG8gc2VlIHdoYXQgbmF0dXJlIGhhcyB0byBvZmZlciBvbmNlIGFnYWluLiINCiJCaWxseSBXaWxkZXIiLCJUcnVzdCB5b3VyIG93biBpbnN0aW5jdC4gWW91ciBtaXN0YWtlcyBtaWdodCBhcyB3ZWxsIGJlIHlvdXIgb3duLCBpbnN0ZWFkIG9mIHNvbWVvbmUgZWxzZXMuIg0KIkJsYWlzZSBQYXNjYWwiLCJUaGUgbGVhc3QgbW92ZW1lbnQgaXMgb2YgaW1wb3J0YW5jZSB0byBhbGwgbmF0dXJlLiBUaGUgZW50aXJlIG9jZWFuIGlzIGFmZmVjdGVkIGJ5IGEgcGViYmxlLiINCiJQYWJsbyBQaWNhc3NvIiwiSSBhbSBhbHdheXMgZG9pbmcgdGhhdCB3aGljaCBJIGNhbiBub3QgZG8sIGluIG9yZGVyIHRoYXQgSSBtYXkgbGVhcm4gaG93IHRvIGRvIGl0LiINCiJOaWNjb2xvIE1hY2hpYXZlbGxpIiwiTWVuIGluIGdlbmVyYWwganVkZ2UgbW9yZSBmcm9tIGFwcGVhcmFuY2VzIHRoYW4gZnJvbSByZWFsaXR5LiBBbGwgbWVuIGhhdmUgZXllcywgYnV0IGZldyBoYXZlIHRoZSBnaWZ0IG9mIHBlbmV0cmF0aW9uLiINCiIiLCJZb3UgbWF5IG9ubHkgYmUgc29tZW9uZSBpbiB0aGUgd29ybGQsIGJ1dCB0byBzb21lb25lIGVsc2UsIHlvdSBtYXkgYmUgdGhlIHdvcmxkLiINCiJIZW5yeSBXYXJkIEJlZWNoZXIiLCJFdmVyeSBhcnRpc3QgZGlwcyBoaXMgYnJ1c2ggaW4gaGlzIG93biBzb3VsLCBhbmQgcGFpbnRzIGhpcyBvd24gbmF0dXJlIGludG8gaGlzIHBpY3R1cmVzLiINCiJKYW1lcyBGYXVzdCIsIklmIHlvdSB0YWtlIGVhY2ggY2hhbGxlbmdlIG9uZSBzdGVwIGF0IGEgdGltZSwgd2l0aCBmYWl0aCBpbiBldmVyeSBmb290c3RlcCwgeW91ciBzdHJlbmd0aCBhbmQgdW5kZXJzdGFuZGluZyB3aWxsIGluY3JlYXNlLiINCiJEZW5pcyBXYWl0bGV5IiwiSGFwcGluZXNzIGNhbm5vdCBiZSB0cmF2ZWxsZWQgdG8sIG93bmVkLCBlYXJuZWQsIHdvcm4gb3IgY29uc3VtZWQuIEhhcHBpbmVzcyBpcyB0aGUgc3Bpcml0dWFsIGV4cGVyaWVuY2Ugb2YgbGl2aW5nIGV2ZXJ5IG1pbnV0ZSB3aXRoIGxvdmUsIGdyYWNlIGFuZCBncmF0aXR1ZGUuIg0KIkhhc2lkaWMgc2F5aW5nIiwiRXZlcnlvbmUgc2hvdWxkIGNhcmVmdWxseSBvYnNlcnZlIHdoaWNoIHdheSBoaXMgaGVhcnQgZHJhd3MgaGltLCBhbmQgdGhlbiBjaG9vc2UgdGhhdCB3YXkgd2l0aCBhbGwgaGlzIHN0cmVuZ3RoLiINCiJKb3NlcGggQ2FtcGJlbGwiLCJXaGVuIHdlIHF1aXQgdGhpbmtpbmcgcHJpbWFyaWx5IGFib3V0IG91cnNlbHZlcyBhbmQgb3VyIG93biBzZWxmLXByZXNlcnZhdGlvbiwgd2UgdW5kZXJnbyBhIHRydWx5IGhlcm9pYyB0cmFuc2Zvcm1hdGlvbiBvZiBjb25zY2lvdXNuZXNzLiINCiJEaGFtbWFwYWRhIiwiRG8gbm90IGdpdmUgeW91ciBhdHRlbnRpb24gdG8gd2hhdCBvdGhlcnMgZG8gb3IgZmFpbCB0byBkbzsgZ2l2ZSBpdCB0byB3aGF0IHlvdSBkbyBvciBmYWlsIHRvIGRvLiINCiJQZXRlciBEcnVja2VyIiwiRm9sbG93IGVmZmVjdGl2ZSBhY3Rpb24gd2l0aCBxdWlldCByZWZsZWN0aW9uLiBGcm9tIHRoZSBxdWlldCByZWZsZWN0aW9uIHdpbGwgY29tZSBldmVuIG1vcmUgZWZmZWN0aXZlIGFjdGlvbi4iDQoiQmVybmljZSBSZWFnb24iLCJMaWZlJ3MgY2hhbGxlbmdlcyBhcmUgbm90IHN1cHBvc2VkIHRvIHBhcmFseXplIHlvdSwgdGhleSdyZSBzdXBwb3NlZCB0byBoZWxwIHlvdSBkaXNjb3ZlciB3aG8geW91IGFyZS4iDQoiRmFubmllIEhhbWVyIiwiVGhlcmUgaXMgb25lIHRoaW5nIHlvdSBoYXZlIGdvdCB0byBsZWFybiBhYm91dCBvdXIgbW92ZW1lbnQuIFRocmVlIHBlb3BsZSBhcmUgYmV0dGVyIHRoYW4gbm8gcGVvcGxlLiINCiJSYWxwaCBXYWxkbyBFbWVyc29uIiwiSGFwcGluZXNzIGlzIGEgcGVyZnVtZSB5b3UgY2Fubm90IHBvdXIgb24gb3RoZXJzIHdpdGhvdXQgZ2V0dGluZyBhIGZldyBkcm9wcyBvbiB5b3Vyc2VsZi4iDQoiQnlyb24gUm9iZXJ0cyIsIkl0IGlzIG5vdCB0aGUgbWlzdGFrZSB0aGF0IGhhcyB0aGUgbW9zdCBwb3dlciwgaW5zdGVhZCwgaXQgaXMgbGVhcm5pbmcgZnJvbSB0aGUgbWlzdGFrZSB0byBhZHZhbmNlIHlvdXIgb3duIGF0dHJpYnV0ZXMuIg0KIlRoaWNoIE5oYXQgSGFuaCIsIlRoZSBhbW91bnQgb2YgaGFwcGluZXNzIHRoYXQgeW91IGhhdmUgZGVwZW5kcyBvbiB0aGUgYW1vdW50IG9mIGZyZWVkb20geW91IGhhdmUgaW4geW91ciBoZWFydC4iDQoiQ2FybCBKdW5nIiwiWW91ciB2aXNpb24gd2lsbCBiZWNvbWUgY2xlYXIgb25seSB3aGVuIHlvdSBsb29rIGludG8geW91ciBoZWFydC4gV2hvIGxvb2tzIG91dHNpZGUsIGRyZWFtcy4gV2hvIGxvb2tzIGluc2lkZSwgYXdha2Vucy4iDQoiQmFiYXR1bmRlIE9sYXR1bmppIiwiWWVzdGVyZGF5IGlzIGhpc3RvcnkuIFRvbW9ycm93IGlzIGEgbXlzdGVyeS4gQW5kIHRvZGF5PyBUb2RheSBpcyBhIGdpZnQuIFRoYXQgaXMgd2h5IHdlIGNhbGwgaXQgdGhlIHByZXNlbnQuIg0KIlRvbnkgUm9iYmlucyIsIlRoZSB3YXkgd2UgY29tbXVuaWNhdGUgd2l0aCBvdGhlcnMgYW5kIHdpdGggb3Vyc2VsdmVzIHVsdGltYXRlbHkgZGV0ZXJtaW5lcyB0aGUgcXVhbGl0eSBvZiBvdXIgbGl2ZXMuIg0KIlRvbnkgQmxhaXIiLCJTb21ldGltZXMgaXQgaXMgYmV0dGVyIHRvIGxvc2UgYW5kIGRvIHRoZSByaWdodCB0aGluZyB0aGFuIHRvIHdpbiBhbmQgZG8gdGhlIHdyb25nIHRoaW5nLiINCiJNb3RoZXIgVGVyZXNhIiwiTGV0IHVzIGFsd2F5cyBtZWV0IGVhY2ggb3RoZXIgd2l0aCBzbWlsZSwgZm9yIHRoZSBzbWlsZSBpcyB0aGUgYmVnaW5uaW5nIG9mIGxvdmUuIg0KIiIsIkEgYmVuZCBpbiB0aGUgcm9hZCBpcyBub3QgdGhlIGVuZCBvZiB0aGUgcm9hZC4uLnVubGVzcyB5b3UgZmFpbCB0byBtYWtlIHRoZSB0dXJuLiINCiJBcmlzdG90bGUiLCJXZSBhcmUgd2hhdCB3ZSByZXBlYXRlZGx5IGRvLiBFeGNlbGxlbmNlLCB0aGVuLCBpcyBub3QgYW4gYWN0LCBidXQgYSBoYWJpdC4iDQoiUmF5IEJyYWRidXJ5IiwiTGl2aW5nIGF0IHJpc2sgaXMganVtcGluZyBvZmYgdGhlIGNsaWZmIGFuZCBidWlsZGluZyB5b3VyIHdpbmdzIG9uIHRoZSB3YXkgZG93bi4iDQoiQWxiZXJ0IENhbXVzIiwiSW4gdGhlIGRlcHRoIG9mIHdpbnRlciwgSSBmaW5hbGx5IGxlYXJuZWQgdGhhdCB0aGVyZSB3YXMgd2l0aGluIG1lIGFuIGludmluY2libGUgc3VtbWVyLiINCiJNYWRhbWUgZGUgU3RhZWwiLCJXaXQgbGllcyBpbiByZWNvZ25pemluZyB0aGUgcmVzZW1ibGFuY2UgYW1vbmcgdGhpbmdzIHdoaWNoIGRpZmZlciBhbmQgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGluZ3Mgd2hpY2ggYXJlIGFsaWtlLiINCiJFbGJlcnQgSHViYmFyZCIsIkEgZmFpbHVyZSBpcyBhIG1hbiB3aG8gaGFzIGJsdW5kZXJlZCBidXQgaXMgbm90IGNhcGFibGUgb2YgY2FzaGluZyBpbiBvbiB0aGUgZXhwZXJpZW5jZS4iDQoiSGVyYmVydCBTd29wZSIsIkkgY2Fubm90IGdpdmUgeW91IHRoZSBmb3JtdWxhIGZvciBzdWNjZXNzLCBidXQgSSBjYW4gZ2l2ZSB5b3UgdGhlIGZvcm11bGEgZm9yIGZhaWx1cmU6IHdoaWNoIGlzOiBUcnkgdG8gcGxlYXNlIGV2ZXJ5Ym9keS4iDQoiIiwiT25lIHdobyBhc2tzIGEgcXVlc3Rpb24gaXMgYSBmb29sIGZvciBmaXZlIG1pbnV0ZXM7IG9uZSB3aG8gZG9lcyBub3QgYXNrIGEgcXVlc3Rpb24gcmVtYWlucyBhIGZvb2wgZm9yZXZlci4iDQoiTGFvemkiLCJUaGUgcG93ZXIgb2YgaW50dWl0aXZlIHVuZGVyc3RhbmRpbmcgd2lsbCBwcm90ZWN0IHlvdSBmcm9tIGhhcm0gdW50aWwgdGhlIGVuZCBvZiB5b3VyIGRheXMuIg0KIkFicmFoYW0gTGluY29sbiIsIlRoZSBiZXN0IHRoaW5nIGFib3V0IHRoZSBmdXR1cmUgaXMgdGhhdCBpdCBvbmx5IGNvbWVzIG9uZSBkYXkgYXQgYSB0aW1lLiINCiJFcGljdGV0dXMiLCJXZSBoYXZlIHR3byBlYXJzIGFuZCBvbmUgbW91dGggc28gdGhhdCB3ZSBjYW4gbGlzdGVuIHR3aWNlIGFzIG11Y2ggYXMgd2Ugc3BlYWsuIg0KIkJ5cm9uIFB1bHNpZmVyIiwiRmVhciBvZiBmYWlsdXJlIGlzIG9uZSBhdHRpdHVkZSB0aGF0IHdpbGwga2VlcCB5b3UgYXQgdGhlIHNhbWUgcG9pbnQgaW4geW91ciBsaWZlLiINCiJFZCBDdW5uaW5naGFtIiwiRnJpZW5kcyBhcmUgdGhvc2UgcmFyZSBwZW9wbGUgd2hvIGFzayBob3cgd2UgYXJlIGFuZCB0aGVuIHdhaXQgdG8gaGVhciB0aGUgYW5zd2VyLiINCiJQZW1hIENob2Ryb24iLCJJZiB3ZSBsZWFybiB0byBvcGVuIG91ciBoZWFydHMsIGFueW9uZSwgaW5jbHVkaW5nIHRoZSBwZW9wbGUgd2hvIGRyaXZlIHVzIGNyYXp5LCBjYW4gYmUgb3VyIHRlYWNoZXIuIg0KIkVsZWFub3IgUm9vc2V2ZWx0IiwiUGVvcGxlIGdyb3cgdGhyb3VnaCBleHBlcmllbmNlIGlmIHRoZXkgbWVldCBsaWZlIGhvbmVzdGx5IGFuZCBjb3VyYWdlb3VzbHkuIFRoaXMgaXMgaG93IGNoYXJhY3RlciBpcyBidWlsdC4iDQoiUmFscGggV2FsZG8gRW1lcnNvbiIsIkEgaGVybyBpcyBubyBicmF2ZXIgdGhhbiBhbiBvcmRpbmFyeSBtYW4sIGJ1dCBoZSBpcyBicmF2ZXIgZml2ZSBtaW51dGVzIGxvbmdlci4iDQoiQW5nZWxhIFNjaHdpbmR0IiwiV2hpbGUgd2UgdHJ5IHRvIHRlYWNoIG91ciBjaGlsZHJlbiBhbGwgYWJvdXQgbGlmZSwgb3VyIGNoaWxkcmVuIHRlYWNoIHVzIHdoYXQgbGlmZSBpcyBhbGwgYWJvdXQuIg0KIldheW5lIER5ZXIiLCJXaGVuIHlvdSBkYW5jZSwgeW91ciBwdXJwb3NlIGlzIG5vdCB0byBnZXQgdG8gYSBjZXJ0YWluIHBsYWNlIG9uIHRoZSBmbG9vci4gSXQncyB0byBlbmpveSBlYWNoIHN0ZXAgYWxvbmcgdGhlIHdheS4iDQoiRGFsYWkgTGFtYSIsIkdlbnVpbmUgbG92ZSBzaG91bGQgZmlyc3QgYmUgZGlyZWN0ZWQgYXQgb25lc2VsZiwgaWYgd2UgZG8gbm90IGxvdmUgb3Vyc2VsdmVzLCBob3cgY2FuIHdlIGxvdmUgb3RoZXJzPyINCiJPcmlzb24gTWFyZGVuIiwiVGhlIENyZWF0b3IgaGFzIG5vdCBnaXZlbiB5b3UgYSBsb25naW5nIHRvIGRvIHRoYXQgd2hpY2ggeW91IGhhdmUgbm8gYWJpbGl0eSB0byBkby4iDQoiU2FtIExldmVuc29uIiwiSXQncyBzbyBzaW1wbGUgdG8gYmUgd2lzZS4gSnVzdCB0aGluayBvZiBzb21ldGhpbmcgc3R1cGlkIHRvIHNheSBhbmQgdGhlbiBkb24ndCBzYXkgaXQuIg0KIkRhbGFpIExhbWEiLCJDb25zaWRlciB0aGF0IG5vdCBvbmx5IGRvIG5lZ2F0aXZlIHRob3VnaHRzIGFuZCBlbW90aW9ucyBkZXN0cm95IG91ciBleHBlcmllbmNlIG9mIHBlYWNlLCB0aGV5IGFsc28gdW5kZXJtaW5lIG91ciBoZWFsdGguIg0KIkRvcmlzIE1vcnRtYW4iLCJVbnRpbCB5b3UgbWFrZSBwZWFjZSB3aXRoIHdobyB5b3UgYXJlLCB5b3Ugd2lsbCBuZXZlciBiZSBjb250ZW50IHdpdGggd2hhdCB5b3UgaGF2ZS4iDQoiQnVkZGhhIiwiTm8gb25lIHNhdmVzIHVzIGJ1dCBvdXJzZWx2ZXMuIE5vIG9uZSBjYW4gYW5kIG5vIG9uZSBtYXkuIFdlIG91cnNlbHZlcyBtdXN0IHdhbGsgdGhlIHBhdGguIg0KIkhlbnJ5IE1pbGxlciIsIlRoZSBtb21lbnQgb25lIGdpdmVzIGNsb3NlIGF0dGVudGlvbiB0byBhbnl0aGluZywgaXQgYmVjb21lcyBhIG15c3RlcmlvdXMsIGF3ZXNvbWUsIGluZGVzY3JpYmFibHkgbWFnbmlmaWNlbnQgd29ybGQgaW4gaXRzZWxmLiINCiJNb2hhbmRhcyBHYW5kaGkiLCJIYXBwaW5lc3MgaXMgd2hlbiB3aGF0IHlvdSB0aGluaywgd2hhdCB5b3Ugc2F5LCBhbmQgd2hhdCB5b3UgZG8gYXJlIGluIGhhcm1vbnkuIg0KIkRhbGFpIExhbWEiLCJUaGUgZ3JlYXRlc3QgYW50aWRvdGUgdG8gaW5zZWN1cml0eSBhbmQgdGhlIHNlbnNlIG9mIGZlYXIgaXMgY29tcGFzc2lvbiwgaXQgYnJpbmdzIG9uZSBiYWNrIHRvIHRoZSBiYXNpcyBvZiBvbmUncyBpbm5lciBzdHJlbmd0aCINCiIiLCJDb3VyYWdlIGlzIHRoZSBkaXNjb3ZlcnkgdGhhdCB5b3UgbWF5IG5vdCB3aW4sIGFuZCB0cnlpbmcgd2hlbiB5b3Uga25vdyB5b3UgY2FuIGxvc2UuIg0KIkJ5cm9uIFB1bHNpZmVyIiwiVG8gYmUgdGhvdWdodGZ1bCBhbmQga2luZCBvbmx5IHRha2VzIGEgZmV3IHNlY29uZHMgY29tcGFyZWQgdG8gdGhlIHRpbWVsZXNzIGh1cnQgY2F1c2VkIGJ5IG9uZSBydWRlIGdlc3R1cmUuIg0KIk1vcnRpbWVyIEFkbGVyIiwiVGhlIHB1cnBvc2Ugb2YgbGVhcm5pbmcgaXMgZ3Jvd3RoLCBhbmQgb3VyIG1pbmRzLCB1bmxpa2Ugb3VyIGJvZGllcywgY2FuIGNvbnRpbnVlIGdyb3dpbmcgYXMgd2UgY29udGludWUgdG8gbGl2ZS4iDQoiQnVkZGhhIiwiV2hlbiB5b3UgcmVhbGl6ZSBob3cgcGVyZmVjdCBldmVyeXRoaW5nIGlzIHlvdSB3aWxsIHRpbHQgeW91ciBoZWFkIGJhY2sgYW5kIGxhdWdoIGF0IHRoZSBza3kuIg0KIk1hcnkgS2F5IEFzaCIsIkZvciBldmVyeSBmYWlsdXJlLCB0aGVyZSdzIGFuIGFsdGVybmF0aXZlIGNvdXJzZSBvZiBhY3Rpb24uIFlvdSBqdXN0IGhhdmUgdG8gZmluZCBpdC4gV2hlbiB5b3UgY29tZSB0byBhIHJvYWRibG9jaywgdGFrZSBhIGRldG91ci4iDQoiV2FsdGVyIExpbm4iLCJJdCBpcyBzdXJwcmlzaW5nIHdoYXQgYSBtYW4gY2FuIGRvIHdoZW4gaGUgaGFzIHRvLCBhbmQgaG93IGxpdHRsZSBtb3N0IG1lbiB3aWxsIGRvIHdoZW4gdGhleSBkb24ndCBoYXZlIHRvLiINCiJUZW56aW4gR3lhdHNvIiwiVG8gYmUgYXdhcmUgb2YgYSBzaW5nbGUgc2hvcnRjb21pbmcgaW4gb25lc2VsZiBpcyBtb3JlIHVzZWZ1bCB0aGFuIHRvIGJlIGF3YXJlIG9mIGEgdGhvdXNhbmQgaW4gc29tZW9uZSBlbHNlLiINCiJFZG11bmQgQnVya2UiLCJOb2JvZHkgbWFkZSBhIGdyZWF0ZXIgbWlzdGFrZSB0aGFuIGhlIHdobyBkaWQgbm90aGluZyBiZWNhdXNlIGhlIGNvdWxkIGRvIG9ubHkgYSBsaXR0bGUuIg0KIkFsYmVydCBTY2h3ZWl0emVyIiwiQ29uc3RhbnQga2luZG5lc3MgY2FuIGFjY29tcGxpc2ggbXVjaC4gQXMgdGhlIHN1biBtYWtlcyBpY2UgbWVsdCwga2luZG5lc3MgY2F1c2VzIG1pc3VuZGVyc3RhbmRpbmcsIG1pc3RydXN0LCBhbmQgaG9zdGlsaXR5IHRvIGV2YXBvcmF0ZS4iDQoiUmVuZSBEZXNjYXJ0ZXMiLCJUaGUgZ3JlYXRlc3QgbWluZHMgYXJlIGNhcGFibGUgb2YgdGhlIGdyZWF0ZXN0IHZpY2VzIGFzIHdlbGwgYXMgb2YgdGhlIGdyZWF0ZXN0IHZpcnR1ZXMuIg0KIkFsYmVydCBFaW5zdGVpbiIsIkEgbWFuIHNob3VsZCBsb29rIGZvciB3aGF0IGlzLCBhbmQgbm90IGZvciB3aGF0IGhlIHRoaW5rcyBzaG91bGQgYmUuIg0KIldpbGxpYW0gQ2hhbm5pbmciLCJEaWZmaWN1bHRpZXMgYXJlIG1lYW50IHRvIHJvdXNlLCBub3QgZGlzY291cmFnZS4gVGhlIGh1bWFuIHNwaXJpdCBpcyB0byBncm93IHN0cm9uZyBieSBjb25mbGljdC4iDQoiQnlyb24gUHVsc2lmZXIiLCJJZiB5b3UgaGF2ZSBubyByZXNwZWN0IGZvciB5b3VyIG93biB2YWx1ZXMgaG93IGNhbiB5b3UgYmUgd29ydGh5IG9mIHJlc3BlY3QgZnJvbSBvdGhlcnMuIg0KIkFscGhvbnNlIEthcnIiLCJTb21lIHBlb3BsZSBhcmUgYWx3YXlzIGdydW1ibGluZyBiZWNhdXNlIHJvc2VzIGhhdmUgdGhvcm5zOyBJIGFtIHRoYW5rZnVsIHRoYXQgdGhvcm5zIGhhdmUgcm9zZXMuIg0KIlcuIEguIEF1ZGVuIiwiVG8gY2hvb3NlIHdoYXQgaXMgZGlmZmljdWx0IGFsbCBvbmVzIGRheXMsIGFzIGlmIGl0IHdlcmUgZWFzeSwgdGhhdCBpcyBmYWl0aC4iDQoiTG91IEhvbHR6IiwiQWJpbGl0eSBpcyB3aGF0IHlvdSdyZSBjYXBhYmxlIG9mIGRvaW5nLiBNb3RpdmF0aW9uIGRldGVybWluZXMgd2hhdCB5b3UgZG8uQXR0aXR1ZGUgZGV0ZXJtaW5lcyBob3cgd2VsbCB5b3UgZG8gaXQuIg0KIlRob21hcyBDYXJseWxlIiwiRG8gbm90IGJlIGVtYmFycmFzc2VkIGJ5IHlvdXIgbWlzdGFrZXMuIE5vdGhpbmcgY2FuIHRlYWNoIHVzIGJldHRlciB0aGFuIG91ciB1bmRlcnN0YW5kaW5nIG9mIHRoZW0uIFRoaXMgaXMgb25lIG9mIHRoZSBiZXN0IHdheXMgb2Ygc2VsZi1lZHVjYXRpb24uIg0KIkJ1ZGRoYSIsIlRob3VzYW5kcyBvZiBjYW5kbGVzIGNhbiBiZSBsaWdodGVkIGZyb20gYSBzaW5nbGUgY2FuZGxlLCBhbmQgdGhlIGxpZmUgb2YgdGhlIGNhbmRsZSB3aWxsIG5vdCBiZSBzaG9ydGVuZWQuIEhhcHBpbmVzcyBuZXZlciBkZWNyZWFzZXMgYnkgYmVpbmcgc2hhcmVkLiINCiJNaWNoZWwgZGUgTW9udGFpZ25lIiwiSSBjYXJlIG5vdCBzbyBtdWNoIHdoYXQgSSBhbSB0byBvdGhlcnMgYXMgd2hhdCBJIGFtIHRvIG15c2VsZi4gSSB3aWxsIGJlIHJpY2ggYnkgbXlzZWxmLCBhbmQgbm90IGJ5IGJvcnJvd2luZy4iDQoiTWFyZ2FyZXQgTGF1cmVuY2UiLCJLbm93IHRoYXQgYWx0aG91Z2ggaW4gdGhlIGV0ZXJuYWwgc2NoZW1lIG9mIHRoaW5ncyB5b3UgYXJlIHNtYWxsLCB5b3UgYXJlIGFsc28gdW5pcXVlIGFuZCBpcnJlcGxhY2VhYmxlLCBhcyBhcmUgYWxsIHlvdXIgZmVsbG93IGh1bWFucyBldmVyeXdoZXJlIGluIHRoZSB3b3JsZC4iDQoiTmFwb2xlb24gQm9uYXBhcnRlIiwiVG8gZG8gYWxsIHRoYXQgb25lIGlzIGFibGUgdG8gZG8sIGlzIHRvIGJlIGEgbWFuOyB0byBkbyBhbGwgdGhhdCBvbmUgd291bGQgbGlrZSB0byBkbywgaXMgdG8gYmUgYSBnb2QuIg0KIkFqYWhuIENoYWgiLCJJZiB5b3UgbGV0IGdvIGEgbGl0dGxlLCB5b3Ugd2lsbCBoYXZlIGEgbGl0dGxlIHBlYWNlLiBJZiB5b3UgbGV0IGdvIGEgbG90LCB5b3Ugd2lsbCBoYXZlIGEgbG90IG9mIHBlYWNlLiINCiJEYWxhaSBMYW1hIiwiVGhlcmUgaXMgbm8gbmVlZCBmb3IgdGVtcGxlcywgbm8gbmVlZCBmb3IgY29tcGxpY2F0ZWQgcGhpbG9zb3BoaWVzLiBNeSBicmFpbiBhbmQgbXkgaGVhcnQgYXJlIG15IHRlbXBsZXM7IG15IHBoaWxvc29waHkgaXMga2luZG5lc3MuIg0KIlZpbmNlbnQgTG9tYmFyZGkiLCJUaGUgc3Bpcml0LCB0aGUgd2lsbCB0byB3aW4sIGFuZCB0aGUgd2lsbCB0byBleGNlbCwgYXJlIHRoZSB0aGluZ3MgdGhhdCBlbmR1cmUuIFRoZXNlIHF1YWxpdGllcyBhcmUgc28gbXVjaCBtb3JlIGltcG9ydGFudCB0aGFuIHRoZSBldmVudHMgdGhhdCBvY2N1ci4iDQoiSmVhbi1QYXVsIFNhcnRyZSIsIk1hbiBpcyBub3Qgc3VtIG9mIHdoYXQgaGUgaGFzIGFscmVhZHksIGJ1dCByYXRoZXIgdGhlIHN1bSBvZiB3aGF0IGhlIGRvZXMgbm90IHlldCBoYXZlLCBvZiB3aGF0IGhlIGNvdWxkIGhhdmUuIg0KIlJpY2hhcmQgQmFjaCIsIkRvbid0IGJlbGlldmUgd2hhdCB5b3VyIGV5ZXMgYXJlIHRlbGxpbmcgeW91LiBBbGwgdGhleSBzaG93IGlzIGxpbWl0YXRpb24uIExvb2sgd2l0aCB5b3VyIHVuZGVyc3RhbmRpbmcsIGZpbmQgb3V0IHdoYXQgeW91IGFscmVhZHkga25vdywgYW5kIHlvdSdsbCBzZWUgdGhlIHdheSB0byBmbHkuIg0KIkVsaXNhYmV0aCBLdWJsZXItUm9zcyIsIkkgYmVsaWV2ZSB0aGF0IHdlIGFyZSBzb2xlbHkgcmVzcG9uc2libGUgZm9yIG91ciBjaG9pY2VzLCBhbmQgd2UgaGF2ZSB0byBhY2NlcHQgdGhlIGNvbnNlcXVlbmNlcyBvZiBldmVyeSBkZWVkLCB3b3JkLCBhbmQgdGhvdWdodCB0aHJvdWdob3V0IG91ciBsaWZldGltZS4iDQoiQnlyb24gUHVsc2lmZXIiLCJXaXNoZXMgY2FuIGJlIHlvdXIgYmVzdCBhdmVudWUgb2YgZ2V0dGluZyB3aGF0IHlvdSB3YW50IHdoZW4geW91IHR1cm4gd2lzaGVzIGludG8gYWN0aW9uLiBBY3Rpb24gbW92ZXMgeW91ciB3aXNoIHRvIHRoZSBmb3JlZnJvbnQgZnJvbSB0aG91Z2h0IHRvIHJlYWxpdHkuIg0KIkthaGxpbCBHaWJyYW4iLCJUbyB1bmRlcnN0YW5kIHRoZSBoZWFydCBhbmQgbWluZCBvZiBhIHBlcnNvbiwgbG9vayBub3QgYXQgd2hhdCBoZSBoYXMgYWxyZWFkeSBhY2hpZXZlZCwgYnV0IGF0IHdoYXQgaGUgYXNwaXJlcyB0byBkby4iDQoiQmVybmFyZCBTaGF3IiwiSSBhbSBvZiB0aGUgb3BpbmlvbiB0aGF0IG15IGxpZmUgYmVsb25ncyB0byB0aGUgY29tbXVuaXR5LCBhbmQgYXMgbG9uZyBhcyBJIGxpdmUgaXQgaXMgbXkgcHJpdmlsZWdlIHRvIGRvIGZvciBpdCB3aGF0ZXZlciBJIGNhbi4iDQoiQWxiZXJ0IEVpbnN0ZWluIiwiSW1hZ2luYXRpb24gaXMgbW9yZSBpbXBvcnRhbnQgdGhhbiBrbm93bGVkZ2UuIEZvciB3aGlsZSBrbm93bGVkZ2UgZGVmaW5lcyBhbGwgd2UgY3VycmVudGx5IGtub3cgYW5kIHVuZGVyc3RhbmQsIGltYWdpbmF0aW9uIHBvaW50cyB0byBhbGwgd2UgbWlnaHQgeWV0IGRpc2NvdmVyIGFuZCBjcmVhdGUuIg0KIkNvbmZ1Y2l1cyIsIldoZW4geW91IHNlZSBhIGdvb2QgcGVyc29uLCB0aGluayBvZiBiZWNvbWluZyBsaWtlIGhpbS4gV2hlbiB5b3Ugc2VlIHNvbWVvbmUgbm90IHNvIGdvb2QsIHJlZmxlY3Qgb24geW91ciBvd24gd2VhayBwb2ludHMuIg0KIkFubmUgTGluZGJlcmdoIiwiSWYgb25lIGlzIGVzdHJhbmdlZCBmcm9tIG9uZXNlbGYsIHRoZW4gb25lIGlzIGVzdHJhbmdlZCBmcm9tIG90aGVycyB0b28uIElmIG9uZSBpcyBvdXQgb2YgdG91Y2ggd2l0aCBvbmVzZWxmLCB0aGVuIG9uZSBjYW5ub3QgdG91Y2ggb3RoZXJzLiINCiJEYWxlIENhcm5lZ2llIiwiTW9zdCBvZiB0aGUgaW1wb3J0YW50IHRoaW5ncyBpbiB0aGUgd29ybGQgaGF2ZSBiZWVuIGFjY29tcGxpc2hlZCBieSBwZW9wbGUgd2hvIGhhdmUga2VwdCBvbiB0cnlpbmcgd2hlbiB0aGVyZSBzZWVtZWQgdG8gYmUgbm8gaG9wZSBhdCBhbGwuIg0KIkpvaG4gTGVubm9uIiwiWW91IG1heSBzYXkgSW0gYSBkcmVhbWVyLCBidXQgSW0gbm90IHRoZSBvbmx5IG9uZSwgSSBob3BlIHNvbWVkYXkgeW91IHdpbGwgam9pbiB1cywgYW5kIHRoZSB3b3JsZCB3aWxsIGxpdmUgYXMgb25lLiINCiJOYXRoYW5pZWwgSGF3dGhvcm5lIiwiSGFwcGluZXNzIGlzIGFzIGEgYnV0dGVyZmx5IHdoaWNoLCB3aGVuIHB1cnN1ZWQsIGlzIGFsd2F5cyBiZXlvbmQgb3VyIGdyYXNwLCBidXQgd2hpY2ggaWYgeW91IHdpbGwgc2l0IGRvd24gcXVpZXRseSwgbWF5IGFsaWdodCB1cG9uIHlvdS4iDQoiQnVkZGhhIiwiSGUgd2hvIGV4cGVyaWVuY2VzIHRoZSB1bml0eSBvZiBsaWZlIHNlZXMgaGlzIG93biBTZWxmIGluIGFsbCBiZWluZ3MsIGFuZCBhbGwgYmVpbmdzIGluIGhpcyBvd24gU2VsZiwgYW5kIGxvb2tzIG9uIGV2ZXJ5dGhpbmcgd2l0aCBhbiBpbXBhcnRpYWwgZXllLiINCiJCdWRkaGEiLCJJbiB0aGUgc2t5LCB0aGVyZSBpcyBubyBkaXN0aW5jdGlvbiBvZiBlYXN0IGFuZCB3ZXN0OyBwZW9wbGUgY3JlYXRlIGRpc3RpbmN0aW9ucyBvdXQgb2YgdGhlaXIgb3duIG1pbmRzIGFuZCB0aGVuIGJlbGlldmUgdGhlbSB0byBiZSB0cnVlLiINCiJDYXJvbGluZSBNeXNzIiwiWW91IGNhbm5vdCBjaGFuZ2UgYW55dGhpbmcgaW4geW91ciBsaWZlIHdpdGggaW50ZW50aW9uIGFsb25lLCB3aGljaCBjYW4gYmVjb21lIGEgd2F0ZXJlZC1kb3duLCBvY2Nhc2lvbmFsIGhvcGUgdGhhdCB5b3UnbGwgZ2V0IHRvIHRvbW9ycm93LiBJbnRlbnRpb24gd2l0aG91dCBhY3Rpb24gaXMgdXNlbGVzcy4iDQoiV2luc3RvbiBDaHVyY2hpbGwiLCJCZWZvcmUgeW91IGNhbiBpbnNwaXJlIHdpdGggZW1vdGlvbiwgeW91IG11c3QgYmUgc3dhbXBlZCB3aXRoIGl0IHlvdXJzZWxmLiBCZWZvcmUgeW91IGNhbiBtb3ZlIHRoZWlyIHRlYXJzLCB5b3VyIG93biBtdXN0IGZsb3cuIFRvIGNvbnZpbmNlIHRoZW0sIHlvdSBtdXN0IHlvdXJzZWxmIGJlbGlldmUuIg0KIldpbGxpYW0gSmFtZXMiLCJUaGUgZ3JlYXRlc3QgZGlzY292ZXJ5IG9mIG91ciBnZW5lcmF0aW9uIGlzIHRoYXQgaHVtYW4gYmVpbmdzIGNhbiBhbHRlciB0aGVpciBsaXZlcyBieSBhbHRlcmluZyB0aGVpciBhdHRpdHVkZXMgb2YgbWluZC4gQXMgeW91IHRoaW5rLCBzbyBzaGFsbCB5b3UgYmUuIg0KIkhlbnJ5IERhdmlkIFRob3JlYXUiLCJJZiBvbmUgYWR2YW5jZXMgY29uZmlkZW50bHkgaW4gdGhlIGRpcmVjdGlvbiBvZiBoaXMgZHJlYW0sIGFuZCBlbmRlYXZvdXJzIHRvIGxpdmUgdGhlIGxpZmUgd2hpY2ggaGUgaGFkIGltYWdpbmVzLCBoZSB3aWxsIG1lZXQgd2l0aCBhIHN1Y2Nlc3MgdW5leHBlY3RlZCBpbiBjb21tb24gaG91cnMuIg0KIlBlYXJsIEJ1Y2siLCJUaGUgc2VjcmV0IG9mIGpveSBpbiB3b3JrIGlzIGNvbnRhaW5lZCBpbiBvbmUgd29yZCwgZXhjZWxsZW5jZS4gVG8ga25vdyBob3cgdG8gZG8gc29tZXRoaW5nIHdlbGwgaXMgdG8gZW5qb3kgaXQuIg0KIkNvbmZ1Y2l1cyIsIldoZW4geW91IG1lZXQgc29tZW9uZSBiZXR0ZXIgdGhhbiB5b3Vyc2VsZiwgdHVybiB5b3VyIHRob3VnaHRzIHRvIGJlY29taW5nIGhpcyBlcXVhbC4gV2hlbiB5b3UgbWVldCBzb21lb25lIG5vdCBhcyBnb29kIGFzIHlvdSBhcmUsIGxvb2sgd2l0aGluIGFuZCBleGFtaW5lIHlvdXIgb3duIHNlbGYuIg0KIlV0YSBIYWdlbiIsIldlIG11c3Qgb3ZlcmNvbWUgdGhlIG5vdGlvbiB0aGF0IHdlIG11c3QgYmUgcmVndWxhci4gSXQgcm9icyB5b3Ugb2YgdGhlIGNoYW5jZSB0byBiZSBleHRyYW9yZGluYXJ5IGFuZCBsZWFkcyB5b3UgdG8gdGhlIG1lZGlvY3JlLiINCiJPcmlzb24gTWFyZGVuIiwiTW9zdCBvZiBvdXIgb2JzdGFjbGVzIHdvdWxkIG1lbHQgYXdheSBpZiwgaW5zdGVhZCBvZiBjb3dlcmluZyBiZWZvcmUgdGhlbSwgd2Ugc2hvdWxkIG1ha2UgdXAgb3VyIG1pbmRzIHRvIHdhbGsgYm9sZGx5IHRocm91Z2ggdGhlbS4iDQoiVmljdG9yIEZyYW5rbCIsIkV2ZXJ5dGhpbmcgY2FuIGJlIHRha2VuIGZyb20gYSBtYW4gYnV0IC4uLiB0aGUgbGFzdCBvZiB0aGUgaHVtYW4gZnJlZWRvbXMsIHRvIGNob29zZSBvbmVzIGF0dGl0dWRlIGluIGFueSBnaXZlbiBzZXQgb2YgY2lyY3Vtc3RhbmNlcywgdG8gY2hvb3NlIG9uZXMgb3duIHdheS4iDQoiRWR3YXJkIGRlIEJvbm8iLCJJdCBpcyBiZXR0ZXIgdG8gaGF2ZSBlbm91Z2ggaWRlYXMgZm9yIHNvbWUgb2YgdGhlbSB0byBiZSB3cm9uZywgdGhhbiB0byBiZSBhbHdheXMgcmlnaHQgYnkgaGF2aW5nIG5vIGlkZWFzIGF0IGFsbC4iDQoiQWJyYWhhbSBMaW5jb2xuIiwiQ2hhcmFjdGVyIGlzIGxpa2UgYSB0cmVlIGFuZCByZXB1dGF0aW9uIGxpa2UgYSBzaGFkb3cuIFRoZSBzaGFkb3cgaXMgd2hhdCB3ZSB0aGluayBvZiBpdDsgdGhlIHRyZWUgaXMgdGhlIHJlYWwgdGhpbmcuIg0KIkxhbyBUenUiLCJCeSBsZXR0aW5nIGl0IGdvIGl0IGFsbCBnZXRzIGRvbmUuIFRoZSB3b3JsZCBpcyB3b24gYnkgdGhvc2Ugd2hvIGxldCBpdCBnby4gQnV0IHdoZW4geW91IHRyeSBhbmQgdHJ5LiBUaGUgd29ybGQgaXMgYmV5b25kIHRoZSB3aW5uaW5nLiINCiJBbXkgVGFuIiwiSSBhbSBsaWtlIGEgZmFsbGluZyBzdGFyIHdobyBoYXMgZmluYWxseSBmb3VuZCBoZXIgcGxhY2UgbmV4dCB0byBhbm90aGVyIGluIGEgbG92ZWx5IGNvbnN0ZWxsYXRpb24sIHdoZXJlIHdlIHdpbGwgc3BhcmtsZSBpbiB0aGUgaGVhdmVucyBmb3JldmVyLiINCiJFcGljdGV0dXMiLCJOb3QgZXZlcnkgZGlmZmljdWx0IGFuZCBkYW5nZXJvdXMgdGhpbmcgaXMgc3VpdGFibGUgZm9yIHRyYWluaW5nLCBidXQgb25seSB0aGF0IHdoaWNoIGlzIGNvbmR1Y2l2ZSB0byBzdWNjZXNzIGluIGFjaGlldmluZyB0aGUgb2JqZWN0IG9mIG91ciBlZmZvcnQuIg0KIlN0ZXBoZW4gQ292ZXkiLCJXZSBhcmUgbm90IGFuaW1hbHMuIFdlIGFyZSBub3QgYSBwcm9kdWN0IG9mIHdoYXQgaGFzIGhhcHBlbmVkIHRvIHVzIGluIG91ciBwYXN0LiBXZSBoYXZlIHRoZSBwb3dlciBvZiBjaG9pY2UuIg0KIlBhdWwgR3JhaGFtIiwiVGhlIG1vc3QgZGFuZ2Vyb3VzIHdheSB0byBsb3NlIHRpbWUgaXMgbm90IHRvIHNwZW5kIGl0IGhhdmluZyBmdW4sIGJ1dCB0byBzcGVuZCBpdCBkb2luZyBmYWtlIHdvcmsuIFdoZW4geW91IHNwZW5kIHRpbWUgaGF2aW5nIGZ1biwgeW91IGtub3cgeW91J3JlIGJlaW5nIHNlbGYtaW5kdWxnZW50LiINCiJCdWRkaGEiLCJUaG91c2FuZHMgb2YgY2FuZGxlcyBjYW4gYmUgbGl0IGZyb20gYSBzaW5nbGUsIGFuZCB0aGUgbGlmZSBvZiB0aGUgY2FuZGxlIHdpbGwgbm90IGJlIHNob3J0ZW5lZC4gSGFwcGluZXNzIG5ldmVyIGRlY3JlYXNlcyBieSBiZWluZyBzaGFyZWQuIg0KIkNodWNrIE5vcnJpcyIsIkEgbG90IG9mIHRpbWVzIHBlb3BsZSBsb29rIGF0IHRoZSBuZWdhdGl2ZSBzaWRlIG9mIHdoYXQgdGhleSBmZWVsIHRoZXkgY2FuJ3QgZG8uIEkgYWx3YXlzIGxvb2sgb24gdGhlIHBvc2l0aXZlIHNpZGUgb2Ygd2hhdCBJIGNhbiBkby4iDQoiQW1pZWwiLCJXaXRob3V0IHBhc3Npb24gbWFuIGlzIGEgbWVyZSBsYXRlbnQgZm9yY2UgYW5kIHBvc3NpYmlsaXR5LCBsaWtlIHRoZSBmbGludCB3aGljaCBhd2FpdHMgdGhlIHNob2NrIG9mIHRoZSBpcm9uIGJlZm9yZSBpdCBjYW4gZ2l2ZSBmb3J0aCBpdHMgc3BhcmsuIg0KIkFteSBCbG9vbSIsIkxvdmUgYXQgZmlyc3Qgc2lnaHQgaXMgZWFzeSB0byB1bmRlcnN0YW5kOyBpdHMgd2hlbiB0d28gcGVvcGxlIGhhdmUgYmVlbiBsb29raW5nIGF0IGVhY2ggb3RoZXIgZm9yIGEgbGlmZXRpbWUgdGhhdCBpdCBiZWNvbWVzIGEgbWlyYWNsZS4iDQoiS2VzaGF2YW4gTmFpciIsIldpdGggY291cmFnZSB5b3Ugd2lsbCBkYXJlIHRvIHRha2Ugcmlza3MsIGhhdmUgdGhlIHN0cmVuZ3RoIHRvIGJlIGNvbXBhc3Npb25hdGUsIGFuZCB0aGUgd2lzZG9tIHRvIGJlIGh1bWJsZS4gQ291cmFnZSBpcyB0aGUgZm91bmRhdGlvbiBvZiBpbnRlZ3JpdHkuIg0KIk1hcmdhcmV0IFNtaXRoIiwiVGhlIHJpZ2h0IHdheSBpcyBub3QgYWx3YXlzIHRoZSBwb3B1bGFyIGFuZCBlYXN5IHdheS4gU3RhbmRpbmcgZm9yIHJpZ2h0IHdoZW4gaXQgaXMgdW5wb3B1bGFyIGlzIGEgdHJ1ZSB0ZXN0IG9mIG1vcmFsIGNoYXJhY3Rlci4iDQoiRnJlZGVyaWNrIERvdWdsYXNzIiwiSSBwcmVmZXIgdG8gYmUgdHJ1ZSB0byBteXNlbGYsIGV2ZW4gYXQgdGhlIGhhemFyZCBvZiBpbmN1cnJpbmcgdGhlIHJpZGljdWxlIG9mIG90aGVycywgcmF0aGVyIHRoYW4gdG8gYmUgZmFsc2UsIGFuZCB0byBpbmN1ciBteSBvd24gYWJob3JyZW5jZS4iDQoiSGVsZW4gS2VsbGVyIiwiTm8gcGVzc2ltaXN0IGV2ZXIgZGlzY292ZXJlZCB0aGUgc2VjcmV0cyBvZiB0aGUgc3RhcnMsIG9yIHNhaWxlZCB0byBhbiB1bmNoYXJ0ZWQgbGFuZCwgb3Igb3BlbmVkIGEgbmV3IGhlYXZlbiB0byB0aGUgaHVtYW4gc3Bpcml0LiINCiJNYXJjdXMgQXVyZWxpdXMiLCJXaGVuIHlvdSBhcmlzZSBpbiB0aGUgbW9ybmluZywgdGhpbmsgb2Ygd2hhdCBhIHByZWNpb3VzIHByaXZpbGVnZSBpdCBpcyB0byBiZSBhbGl2ZSwgdG8gYnJlYXRoZSwgdG8gdGhpbmssIHRvIGVuam95LCB0byBsb3ZlLiINCiJIZWxlbiBLZWxsZXIiLCJDaGFyYWN0ZXIgY2Fubm90IGJlIGRldmVsb3BlZCBpbiBlYXNlIGFuZCBxdWlldC4gT25seSB0aHJvdWdoIGV4cGVyaWVuY2Ugb2YgdHJpYWwgYW5kIHN1ZmZlcmluZyBjYW4gdGhlIHNvdWwgYmUgc3RyZW5ndGhlbmVkLCB2aXNpb24gY2xlYXJlZCwgYW1iaXRpb24gaW5zcGlyZWQsIGFuZCBzdWNjZXNzIGFjaGlldmVkLiINCiJPcHJhaCBXaW5mcmV5IiwiQWx0aG91Z2ggdGhlcmUgbWF5IGJlIHRyYWdlZHkgaW4geW91ciBsaWZlLCB0aGVyZSdzIGFsd2F5cyBhIHBvc3NpYmlsaXR5IHRvIHRyaXVtcGguIEl0IGRvZXNuJ3QgbWF0dGVyIHdobyB5b3UgYXJlLCB3aGVyZSB5b3UgY29tZSBmcm9tLiBUaGUgYWJpbGl0eSB0byB0cml1bXBoIGJlZ2lucyB3aXRoIHlvdS4gQWx3YXlzLiINCiJJbmdyaWQgQmVyZ21hbiIsIllvdSBtdXN0IHRyYWluIHlvdXIgaW50dWl0aW9uLCB5b3UgbXVzdCB0cnVzdCB0aGUgc21hbGwgdm9pY2UgaW5zaWRlIHlvdSB3aGljaCB0ZWxscyB5b3UgZXhhY3RseSB3aGF0IHRvIHNheSwgd2hhdCB0byBkZWNpZGUuIg0KIk1hcmN1cyBBdXJlbGl1cyIsIkFjY2VwdCB0aGUgdGhpbmdzIHRvIHdoaWNoIGZhdGUgYmluZHMgeW91LCBhbmQgbG92ZSB0aGUgcGVvcGxlIHdpdGggd2hvbSBmYXRlIGJyaW5ncyB5b3UgdG9nZXRoZXIsIGJ1dCBkbyBzbyB3aXRoIGFsbCB5b3VyIGhlYXJ0LiINCiJKb2huIEtlbm5lZHkiLCJMZXQgdXMgcmVzb2x2ZSB0byBiZSBtYXN0ZXJzLCBub3QgdGhlIHZpY3RpbXMsIG9mIG91ciBoaXN0b3J5LCBjb250cm9sbGluZyBvdXIgb3duIGRlc3Rpbnkgd2l0aG91dCBnaXZpbmcgd2F5IHRvIGJsaW5kIHN1c3BpY2lvbnMgYW5kIGVtb3Rpb25zLiINCiJNYXJpZSBDdXJpZSIsIk5vdGhpbmcgaW4gbGlmZSBpcyB0byBiZSBmZWFyZWQsIGl0IGlzIG9ubHkgdG8gYmUgdW5kZXJzdG9vZC4gTm93IGlzIHRoZSB0aW1lIHRvIHVuZGVyc3RhbmQgbW9yZSwgc28gdGhhdCB3ZSBtYXkgZmVhciBsZXNzLiINCiJBbm5lIEZyYW5rIiwiUGFyZW50cyBjYW4gb25seSBnaXZlIGdvb2QgYWR2aWNlIG9yIHB1dCB0aGVtIG9uIHRoZSByaWdodCBwYXRocywgYnV0IHRoZSBmaW5hbCBmb3JtaW5nIG9mIGEgcGVyc29ucyBjaGFyYWN0ZXIgbGllcyBpbiB0aGVpciBvd24gaGFuZHMuIg0KIkJ5cm9uIFB1bHNpZmVyIiwiQWR2ZXJzaXR5IGlzbid0IHNldCBhZ2FpbnN0IHlvdSB0byBmYWlsOyBhZHZlcnNpdHkgaXMgYSB3YXkgdG8gYnVpbGQgeW91ciBjaGFyYWN0ZXIgc28gdGhhdCB5b3UgY2FuIHN1Y2NlZWQgb3ZlciBhbmQgb3ZlciBhZ2FpbiB0aHJvdWdoIHBlcnNldmVyYW5jZS4iDQoiUm9iZXJ0IEZ1bGdodW0iLCJJZiB5b3UgYnJlYWsgeW91ciBuZWNrLCBpZiB5b3UgaGF2ZSBub3RoaW5nIHRvIGVhdCwgaWYgeW91ciBob3VzZSBpcyBvbiBmaXJlLCB0aGVuIHlvdSBnb3QgYSBwcm9ibGVtLiBFdmVyeXRoaW5nIGVsc2UgaXMgaW5jb252ZW5pZW5jZS4iDQoiQWxiZXJ0IFNjaHdlaXR6ZXIiLCJTdWNjZXNzIGlzIG5vdCB0aGUga2V5IHRvIGhhcHBpbmVzcy4gSGFwcGluZXNzIGlzIHRoZSBrZXkgdG8gc3VjY2Vzcy4gSWYgeW91IGxvdmUgd2hhdCB5b3UgYXJlIGRvaW5nLCB5b3Ugd2lsbCBiZSBzdWNjZXNzZnVsLiINCiJBbGJlcnQgRWluc3RlaW4iLCJJZiBBIGlzIHN1Y2Nlc3MgaW4gbGlmZSwgdGhlbiBBIGVxdWFscyB4IHBsdXMgeSBwbHVzIHouIFdvcmsgaXMgeDsgeSBpcyBwbGF5OyBhbmQgeiBpcyBrZWVwaW5nIHlvdXIgbW91dGggc2h1dC4iDQoiVGhvcm50b24gV2lsZGVyIiwiTXkgYWR2aWNlIHRvIHlvdSBpcyBub3QgdG8gaW5xdWlyZSB3aHkgb3Igd2hpdGhlciwgYnV0IGp1c3QgZW5qb3kgeW91ciBpY2UgY3JlYW0gd2hpbGUgaXRzIG9uIHlvdXIgcGxhdGUsIHRoYXQncyBteSBwaGlsb3NvcGh5LiINCiJKb2huIERld2V5IiwiQ29uZmxpY3QgaXMgdGhlIGdhZGZseSBvZiB0aG91Z2h0LiBJdCBzdGlycyB1cyB0byBvYnNlcnZhdGlvbiBhbmQgbWVtb3J5LiBJdCBpbnN0aWdhdGVzIHRvIGludmVudGlvbi4gSXQgc2hvY2tzIHVzIG91dCBvZiBzaGVlcGxpa2UgcGFzc2l2aXR5LCBhbmQgc2V0cyB1cyBhdCBub3RpbmcgYW5kIGNvbnRyaXZpbmcuIg0KIkxhbyBUenUiLCJIZSB3aG8gY29ucXVlcnMgb3RoZXJzIGlzIHN0cm9uZzsgSGUgd2hvIGNvbnF1ZXJzIGhpbXNlbGYgaXMgbWlnaHR5LiINCiJXYXluZSBEeWVyIiwiQW55dGhpbmcgeW91IHJlYWxseSB3YW50LCB5b3UgY2FuIGF0dGFpbiwgaWYgeW91IHJlYWxseSBnbyBhZnRlciBpdC4iDQoiSm9obiBEZXdleSIsIkFycml2aW5nIGF0IG9uZSBwb2ludCBpcyB0aGUgc3RhcnRpbmcgcG9pbnQgdG8gYW5vdGhlci4iDQoiSmFtZXMgT3BwZW5oZWltIiwiVGhlIGZvb2xpc2ggbWFuIHNlZWtzIGhhcHBpbmVzcyBpbiB0aGUgZGlzdGFuY2UsIHRoZSB3aXNlIGdyb3dzIGl0IHVuZGVyIGhpcyBmZWV0LiINCiJNYXJ0aGEgV2FzaGluZ3RvbiIsIlRoZSBncmVhdGVzdCBwYXJ0IG9mIG91ciBoYXBwaW5lc3MgZGVwZW5kcyBvbiBvdXIgZGlzcG9zaXRpb25zLCBub3Qgb3VyIGNpcmN1bXN0YW5jZXMuIg0KIk1hcmdhcmV0IEJvbm5hbm8iLCJJdCBpcyBvbmx5IHBvc3NpYmxlIHRvIGxpdmUgaGFwcGlseSBldmVyIGFmdGVyIG9uIGEgZGF5IHRvIGRheSBiYXNpcy4iDQoiR29ldGhlIiwiQSBtYW4gc2VlcyBpbiB0aGUgd29ybGQgd2hhdCBoZSBjYXJyaWVzIGluIGhpcyBoZWFydC4iDQoiQmVuamFtaW4gRGlzcmFlbGkiLCJBY3Rpb24gbWF5IG5vdCBhbHdheXMgYnJpbmcgaGFwcGluZXNzLCBidXQgdGhlcmUgaXMgbm8gaGFwcGluZXNzIHdpdGhvdXQgYWN0aW9uLiINCiJKb2UgUGF0ZXJubyIsIkJlbGlldmUgZGVlcCBkb3duIGluIHlvdXIgaGVhcnQgdGhhdCB5b3UncmUgZGVzdGluZWQgdG8gZG8gZ3JlYXQgdGhpbmdzLiINCiJSaWNoYXJkIEJhY2giLCJTb29uZXIgb3IgbGF0ZXIsIHRob3NlIHdobyB3aW4gYXJlIHRob3NlIHdobyB0aGluayB0aGV5IGNhbi4iDQoiVG9ueSBSb2JiaW5zIiwiVGhlIG9ubHkgbGltaXQgdG8geW91ciBpbXBhY3QgaXMgeW91ciBpbWFnaW5hdGlvbiBhbmQgY29tbWl0bWVudC4iDQoiQ2F0aHkgUHVsc2lmZXIiLCJZb3UgYXJlIHNwZWNpYWwsIHlvdSBhcmUgdW5pcXVlLCB5b3UgYXJlIHRoZSBiZXN0ISINCiJXaWxsaWFtIEFydGh1ciBXYXJkIiwiRm91ciBzdGVwcyB0byBhY2hpZXZlbWVudDogUGxhbiBwdXJwb3NlZnVsbHkuIFByZXBhcmUgcHJheWVyZnVsbHkuIFByb2NlZWQgcG9zaXRpdmVseS4gUHVyc3VlIHBlcnNpc3RlbnRseS4iDQoiQnJ1Y2UgTGVlIiwiVG8ga25vdyBvbmVzZWxmIGlzIHRvIHN0dWR5IG9uZXNlbGYgaW4gYWN0aW9uIHdpdGggYW5vdGhlciBwZXJzb24uIg0KIkJpc2hvcCBEZXNtb25kIFR1dHUiLCJXZSBtdXN0IG5vdCBhbGxvdyBvdXJzZWx2ZXMgdG8gYmVjb21lIGxpa2UgdGhlIHN5c3RlbSB3ZSBvcHBvc2UuIg0KIlRoaWNoIE5oYXQgSGFuaCIsIlNtaWxlLCBicmVhdGhlIGFuZCBnbyBzbG93bHkuIg0KIkFsYmVydCBFaW5zdGVpbiIsIlJlYWxpdHkgaXMgbWVyZWx5IGFuIGlsbHVzaW9uLCBhbGJlaXQgYSB2ZXJ5IHBlcnNpc3RlbnQgb25lLiINCiJGcmFua2xpbiBSb29zZXZlbHQiLCJXaGVuIHlvdSBjb21lIHRvIHRoZSBlbmQgb2YgeW91ciByb3BlLCB0aWUgYSBrbm90IGFuZCBoYW5nIG9uLiINCiJCdWRkaGEiLCJBbHdheXMgYmUgbWluZGZ1bCBvZiB0aGUga2luZG5lc3MgYW5kIG5vdCB0aGUgZmF1bHRzIG9mIG90aGVycy4iDQoiQ2FybCBKdW5nIiwiRXZlcnl0aGluZyB0aGF0IGlycml0YXRlcyB1cyBhYm91dCBvdGhlcnMgY2FuIGxlYWQgdXMgdG8gYW4gdW5kZXJzdGFuZGluZyBvZiBvdXJzZWx2ZXMuIg0KIkRhbGUgQ2FybmVnaWUiLCJXaGVuIGZhdGUgaGFuZHMgdXMgYSBsZW1vbiwgbGV0cyB0cnkgdG8gbWFrZSBsZW1vbmFkZS4iDQoiTW9oYW5kYXMgR2FuZGhpIiwiVGhlIHdlYWsgY2FuIG5ldmVyIGZvcmdpdmUuIEZvcmdpdmVuZXNzIGlzIHRoZSBhdHRyaWJ1dGUgb2YgdGhlIHN0cm9uZy4iDQoiQ2hhbmFreWEiLCJBIG1hbiBpcyBncmVhdCBieSBkZWVkcywgbm90IGJ5IGJpcnRoLiINCiJEYWxlIENhcm5lZ2llIiwiU3VjY2VzcyBpcyBnZXR0aW5nIHdoYXQgeW91IHdhbnQuIEhhcHBpbmVzcyBpcyB3YW50aW5nIHdoYXQgeW91IGdldC4iDQoiIiwiUHV0IHlvdXIgZnV0dXJlIGluIGdvb2QgaGFuZHMsIHlvdXIgb3duLiINCiJCeXJvbiBQdWxzaWZlciIsIlRydXRoIGlzbid0IGFsbCBhYm91dCB3aGF0IGFjdHVhbGx5IGhhcHBlbnMgYnV0IG1vcmUgYWJvdXQgaG93IHdoYXQgaGFzIGhhcHBlbmVkIGlzIGludGVycHJldGVkLiINCiIiLCJBIGdvb2QgcmVzdCBpcyBoYWxmIHRoZSB3b3JrLiINCiJSb2JlcnQgU3RldmVuc29uIiwiRG9uJ3QganVkZ2UgZWFjaCBkYXkgYnkgdGhlIGhhcnZlc3QgeW91IHJlYXAgYnV0IGJ5IHRoZSBzZWVkcyB0aGF0IHlvdSBwbGFudC4iDQoiRGVtb3N0aGVuZXMiLCJTbWFsbCBvcHBvcnR1bml0aWVzIGFyZSBvZnRlbiB0aGUgYmVnaW5uaW5nIG9mIGdyZWF0IGVudGVycHJpc2VzLiINCiJHYWlsIFNoZWVoeSIsIlRvIGJlIHRlc3RlZCBpcyBnb29kLiBUaGUgY2hhbGxlbmdlZCBsaWZlIG1heSBiZSB0aGUgYmVzdCB0aGVyYXBpc3QuIg0KIkVuZ2xpc2ggcHJvdmVyYiIsIlRha2UgaGVlZDogeW91IGRvIG5vdCBmaW5kIHdoYXQgeW91IGRvIG5vdCBzZWVrLiINCiJSaWNoYXJkIEJhY2giLCJIYXBwaW5lc3MgaXMgdGhlIHJld2FyZCB3ZSBnZXQgZm9yIGxpdmluZyB0byB0aGUgaGlnaGVzdCByaWdodCB3ZSBrbm93LiINCiJDZXJ2YW50ZXMiLCJCZSBzbG93IG9mIHRvbmd1ZSBhbmQgcXVpY2sgb2YgZXllLiINCiJNb2hhbmRhcyBHYW5kaGkiLCJGcmVlZG9tIGlzIG5vdCB3b3J0aCBoYXZpbmcgaWYgaXQgZG9lcyBub3QgY29ubm90ZSBmcmVlZG9tIHRvIGVyci4iDQoiSm9obiBMb2NrZSIsIkkgaGF2ZSBhbHdheXMgdGhvdWdodCB0aGUgYWN0aW9ucyBvZiBtZW4gdGhlIGJlc3QgaW50ZXJwcmV0ZXJzIG9mIHRoZWlyIHRob3VnaHRzLiINCiJTb3JlbiBLaWVya2VnYWFyZCIsIlRvIGRhcmUgaXMgdG8gbG9zZSBvbmVzIGZvb3RpbmcgbW9tZW50YXJpbHkuIFRvIG5vdCBkYXJlIGlzIHRvIGxvc2Ugb25lc2VsZi4iDQoiRGF2aWQgRWRkaW5ncyIsIk5vIGRheSBpbiB3aGljaCB5b3UgbGVhcm4gc29tZXRoaW5nIGlzIGEgY29tcGxldGUgbG9zcy4iDQoiQWxiZXJ0IEVpbnN0ZWluIiwiUGVhY2UgY2Fubm90IGJlIGtlcHQgYnkgZm9yY2UuIEl0IGNhbiBvbmx5IGJlIGFjaGlldmVkIGJ5IHVuZGVyc3RhbmRpbmcuIg0KIkRhdmlkIE1jQ3VsbG91Z2giLCJSZWFsIHN1Y2Nlc3MgaXMgZmluZGluZyB5b3VyIGxpZmV3b3JrIGluIHRoZSB3b3JrIHRoYXQgeW91IGxvdmUuIg0KIkJ1ZGRoYSIsIkJldHRlciB0aGFuIGEgdGhvdXNhbmQgaG9sbG93IHdvcmRzLCBpcyBvbmUgd29yZCB0aGF0IGJyaW5ncyBwZWFjZS4iDQoiIiwiQWxsIHRoZSBmbG93ZXJzIG9mIGFsbCB0aGUgdG9tb3Jyb3dzIGFyZSBpbiB0aGUgc2VlZHMgb2YgdG9kYXkuIg0KIkpvc2VwaCBDYW1wYmVsbCIsIllvdXIgc2FjcmVkIHNwYWNlIGlzIHdoZXJlIHlvdSBjYW4gZmluZCB5b3Vyc2VsZiBhZ2FpbiBhbmQgYWdhaW4uIg0KIkJydWNlIExlZSIsIkFzIHlvdSB0aGluaywgc28gc2hhbGwgeW91IGJlY29tZS4iDQoiV2lsbGlhbSBCbGFrZSIsIkluIHNlZWQgdGltZSBsZWFybiwgaW4gaGFydmVzdCB0ZWFjaCwgaW4gd2ludGVyIGVuam95LiINCiJDaGVuZyBZZW4iLCJIYXBwaW5lc3MgZG9lcyBub3QgY29tZSBmcm9tIGhhdmluZyBtdWNoLCBidXQgZnJvbSBiZWluZyBhdHRhY2hlZCB0byBsaXR0bGUuIg0KIlJpY2hhcmQgQmFjaCIsIkV2ZXJ5IGdpZnQgZnJvbSBhIGZyaWVuZCBpcyBhIHdpc2ggZm9yIHlvdXIgaGFwcGluZXNzLiINCiJSYWxwaCBFbWVyc29uIiwiR28gcHV0IHlvdXIgY3JlZWQgaW50byB0aGUgZGVlZC4gTm9yIHNwZWFrIHdpdGggZG91YmxlIHRvbmd1ZS4iDQoiRXVyaXBpZGVzIiwiVGhlIHdpc2VzdCBtZW4gZm9sbG93IHRoZWlyIG93biBkaXJlY3Rpb24uIg0KIldpbGxpYW0gU2xvYW5lIENvZmZpbiIsIkhvcGUgYXJvdXNlcywgYXMgbm90aGluZyBlbHNlIGNhbiBhcm91c2UsIGEgcGFzc2lvbiBmb3IgdGhlIHBvc3NpYmxlLiINCiJDb25mdWNpdXMiLCJFdmVyeXRoaW5nIGhhcyBiZWF1dHksIGJ1dCBub3QgZXZlcnlvbmUgc2VlcyBpdC4iDQoiUGVtYSBDaG9kcm9uIiwiTm90aGluZyBldmVyIGdvZXMgYXdheSB1bnRpbCBpdCBoYXMgdGF1Z2h0IHVzIHdoYXQgd2UgbmVlZCB0byBrbm93LiINCiJNYXlhIEFuZ2Vsb3UiLCJXaGVuIHlvdSBsZWFybiwgdGVhY2guIFdoZW4geW91IGdldCwgZ2l2ZS4iDQoiRG9yb3RoeSBUaG9tcHNvbiIsIk9ubHkgd2hlbiB3ZSBhcmUgbm8gbG9uZ2VyIGFmcmFpZCBkbyB3ZSBiZWdpbiB0byBsaXZlLiINCiJBbmR5IFJvb25leSIsIklmIHlvdSBzbWlsZSB3aGVuIG5vIG9uZSBlbHNlIGlzIGFyb3VuZCwgeW91IHJlYWxseSBtZWFuIGl0LiINCiJNYXJ0aW4gTHV0aGVyIEtpbmcsIEpyLiIsIkxvdmUgaXMgdGhlIG9ubHkgZm9yY2UgY2FwYWJsZSBvZiB0cmFuc2Zvcm1pbmcgYW4gZW5lbXkgaW50byBmcmllbmQuIg0KIkNhcmwgSnVuZyIsIkluIGFsbCBjaGFvcyB0aGVyZSBpcyBhIGNvc21vcywgaW4gYWxsIGRpc29yZGVyIGEgc2VjcmV0IG9yZGVyLiINCiIiLCJBIG1hbiBpcyBub3Qgd2hlcmUgaGUgbGl2ZXMgYnV0IHdoZXJlIGhlIGxvdmVzLiINCiJXaW5zdG9uIENodXJjaGlsbCIsIlRoZSBwcmljZSBvZiBncmVhdG5lc3MgaXMgcmVzcG9uc2liaWxpdHkuIg0KIlBhdWwgVGlsbGljaCIsIkRlY2lzaW9uIGlzIGEgcmlzayByb290ZWQgaW4gdGhlIGNvdXJhZ2Ugb2YgYmVpbmcgZnJlZS4iDQoiV2lsbGlhbSBCdXJyb3VnaHMiLCJZb3VyIG1pbmQgd2lsbCBhbnN3ZXIgbW9zdCBxdWVzdGlvbnMgaWYgeW91IGxlYXJuIHRvIHJlbGF4IGFuZCB3YWl0IGZvciB0aGUgYW5zd2VyLiINCiIiLCJUaGUgd29ybGQgZG9lc24ndCBoYXBwZW4gdG8geW91IGl0IGhhcHBlbnMgZnJvbSB5b3UuIg0KIkFsYmVydCBFaW5zdGVpbiIsIldlIGNhbm5vdCBzb2x2ZSBvdXIgcHJvYmxlbXMgd2l0aCB0aGUgc2FtZSB0aGlua2luZyB3ZSB1c2VkIHdoZW4gd2UgY3JlYXRlZCB0aGVtLiINCiIiLCJNb3JlIHBvd2VyZnVsIHRoYW4gdGhlIHdpbGwgdG8gd2luIGlzIHRoZSBjb3VyYWdlIHRvIGJlZ2luLiINCiJSaWNoYXJkIEJhY2giLCJMZWFybmluZyBpcyBmaW5kaW5nIG91dCB3aGF0IHlvdSBhbHJlYWR5IGtub3cuIg0KIkFsZnJlZCBQYWludGVyIiwiU2F5aW5nIHRoYW5rIHlvdSBpcyBtb3JlIHRoYW4gZ29vZCBtYW5uZXJzLiBJdCBpcyBnb29kIHNwaXJpdHVhbGl0eS4iDQoiTGFvIFR6dSIsIlNpbGVuY2UgaXMgYSBzb3VyY2Ugb2YgZ3JlYXQgc3RyZW5ndGguIg0KIkFubmUgTGFtb3R0IiwiSm95IGlzIHRoZSBiZXN0IG1ha2V1cC4iDQoiU2VuZWNhIiwiVGhlcmUgaXMgbm8gZ3JlYXQgZ2VuaXVzIHdpdGhvdXQgc29tZSB0b3VjaCBvZiBtYWRuZXNzLiINCiJCdWRkaGEiLCJBIGp1ZyBmaWxscyBkcm9wIGJ5IGRyb3AuIg0KIkRvcmlzIE1vcnRtYW4iLCJVbnRpbCB5b3UgbWFrZSBwZWFjZSB3aXRoIHdobyB5b3UgYXJlLCB5b3UnbGwgbmV2ZXIgYmUgY29udGVudCB3aXRoIHdoYXQgeW91IGhhdmUuIg0KIlJhbHBoIEVtZXJzb24iLCJXZSBhaW0gYWJvdmUgdGhlIG1hcmsgdG8gaGl0IHRoZSBtYXJrLiINCiJDYXRoZXJpbmUgUHVsc2lmZXIiLCJCZWluZyBhbmdyeSBuZXZlciBzb2x2ZXMgYW55dGhpbmcuIg0KIk9yaXNvbiBNYXJkZW4iLCJBbGwgbWVuIHdobyBoYXZlIGFjaGlldmVkIGdyZWF0IHRoaW5ncyBoYXZlIGJlZW4gZ3JlYXQgZHJlYW1lcnMuIg0KIkFydGh1ciBDb25hbiBEb3lsZSIsIk1lZGlvY3JpdHkga25vd3Mgbm90aGluZyBoaWdoZXIgdGhhbiBpdHNlbGYsIGJ1dCB0YWxlbnQgaW5zdGFudGx5IHJlY29nbml6ZXMgZ2VuaXVzLiINCiJXYWx0ZXIgTGlwcG1hbm4iLCJXaGVyZSBhbGwgdGhpbmsgYWxpa2UsIG5vIG9uZSB0aGlua3MgdmVyeSBtdWNoLiINCiJNYXJjdXMgQXVyZWxpdXMiLCJFdmVyeXRoaW5nIHRoYXQgZXhpc3RzIGlzIGluIGEgbWFubmVyIHRoZSBzZWVkIG9mIHRoYXQgd2hpY2ggd2lsbCBiZS4iDQoiTWFyaWUgQ3VyaWUiLCJCZSBsZXNzIGN1cmlvdXMgYWJvdXQgcGVvcGxlIGFuZCBtb3JlIGN1cmlvdXMgYWJvdXQgaWRlYXMuIg0KIkNoYXJsZXMgUGVya2h1cnN0IiwiVGhlIGhlYXJ0IGhhcyBleWVzIHdoaWNoIHRoZSBicmFpbiBrbm93cyBub3RoaW5nIG9mLiINCiJSb2JlcnQgS2VubmVkeSIsIk9ubHkgdGhvc2Ugd2hvIGRhcmUgdG8gZmFpbCBncmVhdGx5IGNhbiBldmVyIGFjaGlldmUgZ3JlYXRseS4iDQoiUmljaGFyZCBXaGF0ZWx5IiwiTG9zZSBhbiBob3VyIGluIHRoZSBtb3JuaW5nLCBhbmQgeW91IHdpbGwgc3BlbmQgYWxsIGRheSBsb29raW5nIGZvciBpdC4iDQoiQnJ1Y2UgTGVlIiwiTWlzdGFrZXMgYXJlIGFsd2F5cyBmb3JnaXZhYmxlLCBpZiBvbmUgaGFzIHRoZSBjb3VyYWdlIHRvIGFkbWl0IHRoZW0uIg0KIldpbGxpYW0gU2hha2VzcGVhcmUiLCJHbyB0byB5b3VyIGJvc29tOiBLbm9jayB0aGVyZSwgYW5kIGFzayB5b3VyIGhlYXJ0IHdoYXQgaXQgZG90aCBrbm93LiINCiJEYWxhaSBMYW1hIiwiSGFwcGluZXNzIG1haW5seSBjb21lcyBmcm9tIG91ciBvd24gYXR0aXR1ZGUsIHJhdGhlciB0aGFuIGZyb20gZXh0ZXJuYWwgZmFjdG9ycy4iDQoiTGFvIFR6dSIsIklmIHlvdSBkbyBub3QgY2hhbmdlIGRpcmVjdGlvbiwgeW91IG1heSBlbmQgdXAgd2hlcmUgeW91IGFyZSBoZWFkaW5nLiINCiIiLCJXaGF0IHdlIHNlZSBpcyBtYWlubHkgd2hhdCB3ZSBsb29rIGZvci4iDQoiTWFyc2hhIFBldHJpZSBTdWUiLCJTdGF5IGF3YXkgZnJvbSB3aGF0IG1pZ2h0IGhhdmUgYmVlbiBhbmQgbG9vayBhdCB3aGF0IHdpbGwgYmUuIg0KIldpbGxpYW0gSmFtZXMiLCJBY3QgYXMgaWYgd2hhdCB5b3UgZG8gbWFrZXMgYSBkaWZmZXJlbmNlLiBJdCBkb2VzLiINCiJCeXJvbiBQdWxzaWZlciIsIlBhc3Npb24gY3JlYXRlcyB0aGUgZGVzaXJlIGZvciBtb3JlIGFuZCBhY3Rpb24gZnVlbGxlZCBieSBwYXNzaW9uIGNyZWF0ZXMgYSBmdXR1cmUuIg0KIkFsZXhhbmRlciBQb3BlIiwiRG8gZ29vZCBieSBzdGVhbHRoLCBhbmQgYmx1c2ggdG8gZmluZCBpdCBmYW1lLiINCiJOYXBvbGVvbiBIaWxsIiwiT3Bwb3J0dW5pdHkgb2Z0ZW4gY29tZXMgZGlzZ3Vpc2VkIGluIHRoZSBmb3JtIG9mIG1pc2ZvcnR1bmUsIG9yIHRlbXBvcmFyeSBkZWZlYXQuIg0KIlRob21hcyBKZWZmZXJzb24iLCJEb24ndCB0YWxrIGFib3V0IHdoYXQgeW91IGhhdmUgZG9uZSBvciB3aGF0IHlvdSBhcmUgZ29pbmcgdG8gZG8uIg0KIlNlbmVjYSIsIk1vc3QgcG93ZXJmdWwgaXMgaGUgd2hvIGhhcyBoaW1zZWxmIGluIGhpcyBvd24gcG93ZXIuIg0KIkJlcm5hcmQgU2hhdyIsIldlIGRvbid0IHN0b3AgcGxheWluZyBiZWNhdXNlIHdlIGdyb3cgb2xkOyB3ZSBncm93IG9sZCBiZWNhdXNlIHdlIHN0b3AgcGxheWluZy4iDQoiQnlyb24gUHVsc2lmZXIiLCJFeHBlcmllbmNlIGNhbiBvbmx5IGJlIGdhaW5lZCBieSBkb2luZyBub3QgYnkgdGhpbmtpbmcgb3IgZHJlYW1pbmcuIg0KIk1hcmsgVHdhaW4iLCJBbHdheXMgdGVsbCB0aGUgdHJ1dGguIFRoYXQgd2F5LCB5b3UgZG9uJ3QgaGF2ZSB0byByZW1lbWJlciB3aGF0IHlvdSBzYWlkLiINCiJMYW8gVHp1IiwiRnJvbSB3b25kZXIgaW50byB3b25kZXIgZXhpc3RlbmNlIG9wZW5zLiINCiJOYXBvbGVvbiBCb25hcGFydGUiLCJIZSB3aG8gZmVhcnMgYmVpbmcgY29ucXVlcmVkIGlzIHN1cmUgb2YgZGVmZWF0LiINCiJKb2huIExlbm5vbiIsIkxpZmUgaXMgd2hhdCBoYXBwZW5zIHdoaWxlIHlvdSBhcmUgbWFraW5nIG90aGVyIHBsYW5zLiINCiJXYXluZSBEeWVyIiwiRG9pbmcgd2hhdCB5b3UgbG92ZSBpcyB0aGUgY29ybmVyc3RvbmUgb2YgaGF2aW5nIGFidW5kYW5jZSBpbiB5b3VyIGxpZmUuIg0KIkpvaGFubiBXb2xmZ2FuZyB2b24gR29ldGhlIiwiS2luZG5lc3MgaXMgdGhlIGdvbGRlbiBjaGFpbiBieSB3aGljaCBzb2NpZXR5IGlzIGJvdW5kIHRvZ2V0aGVyLiINCiJOaWV0enNjaGUiLCJZb3UgbmVlZCBjaGFvcyBpbiB5b3VyIHNvdWwgdG8gZ2l2ZSBiaXJ0aCB0byBhIGRhbmNpbmcgc3Rhci4iDQoiQnlyb24gUHVsc2lmZXIiLCJJdCBjYW4ndCBiZSBzcHJpbmcgaWYgeW91ciBoZWFydCBpcyBmaWxsZWQgd2l0aCBwYXN0IGZhaWx1cmVzLiINCiJCcmVuZGFuIEZyYW5jaXMiLCJObyB5ZXN0ZXJkYXlzIGFyZSBldmVyIHdhc3RlZCBmb3IgdGhvc2Ugd2hvIGdpdmUgdGhlbXNlbHZlcyB0byB0b2RheS4iDQoiVG9tIEtyYXVzZSIsIlRoZXJlIGFyZSBubyBmYWlsdXJlcywganVzdCBleHBlcmllbmNlcyBhbmQgeW91ciByZWFjdGlvbnMgdG8gdGhlbS4iDQoiUGFibG8gUGljYXNzbyIsIkFjdGlvbiBpcyB0aGUgZm91bmRhdGlvbmFsIGtleSB0byBhbGwgc3VjY2Vzcy4iDQoiQWJyYWhhbSBNYXNsb3ciLCJXaGF0IGlzIG5lY2Vzc2FyeSB0byBjaGFuZ2UgYSBwZXJzb24gaXMgdG8gY2hhbmdlIGhpcyBhd2FyZW5lc3Mgb2YgaGltc2VsZi4iDQoiWmlnIFppZ2xhciIsIlBvc2l0aXZlIHRoaW5raW5nIHdpbGwgbGV0IHlvdSBkbyBldmVyeXRoaW5nIGJldHRlciB0aGFuIG5lZ2F0aXZlIHRoaW5raW5nIHdpbGwuIg0KIk1vdGhlciBUZXJlc2EiLCJXZSBzaGFsbCBuZXZlciBrbm93IGFsbCB0aGUgZ29vZCB0aGF0IGEgc2ltcGxlIHNtaWxlIGNhbiBkby4iDQoiRnJhbmNlcyBkZSBTYWxlcyIsIk5vdGhpbmcgaXMgc28gc3Ryb25nIGFzIGdlbnRsZW5lc3MuIE5vdGhpbmcgaXMgc28gZ2VudGxlIGFzIHJlYWwgc3RyZW5ndGguIg0KIlJhbHBoIFdhbGRvIEVtZXJzb24iLCJJbWFnaW5hdGlvbiBpcyBub3QgYSB0YWxlbnQgb2Ygc29tZSBtZW4gYnV0IGlzIHRoZSBoZWFsdGggb2YgZXZlcnkgbWFuLiINCiJLZW5qaSBNaXlhemF3YSIsIldlIG11c3QgZW1icmFjZSBwYWluIGFuZCBidXJuIGl0IGFzIGZ1ZWwgZm9yIG91ciBqb3VybmV5LiINCiIiLCJEb24ndCB3YWl0IGZvciBwZW9wbGUgdG8gYmUgZnJpZW5kbHkuIFNob3cgdGhlbSBob3cuIg0KIkNoaW5lc2UgcHJvdmVyYiIsIkEgZ2VtIGNhbm5vdCBiZSBwb2xpc2hlZCB3aXRob3V0IGZyaWN0aW9uLCBub3IgYSBtYW4gcGVyZmVjdGVkIHdpdGhvdXQgdHJpYWxzLiINCiJHZW9yZ2UgTWF0dGhldyBBZGFtcyIsIkVhY2ggZGF5IGNhbiBiZSBvbmUgb2YgdHJpdW1waCBpZiB5b3Uga2VlcCB1cCB5b3VyIGludGVyZXN0cy4iDQoiUm9iZXJ0IE0uIFBpcnNpZyIsIlRoZSBwbGFjZSB0byBpbXByb3ZlIHRoZSB3b3JsZCBpcyBmaXJzdCBpbiBvbmUncyBvd24gaGVhcnQgYW5kIGhlYWQgYW5kIGhhbmRzLiINCiJXaW5zdG9uIENodXJjaGlsbCIsIlRoZSBwZXNzaW1pc3Qgc2VlcyBkaWZmaWN1bHR5IGluIGV2ZXJ5IG9wcG9ydHVuaXR5LiBUaGUgb3B0aW1pc3Qgc2VlcyB0aGUgb3Bwb3J0dW5pdHkgaW4gZXZlcnkgZGlmZmljdWx0eS4iDQoiQWxiZXJ0IEdyYXkiLCJXaW5uZXJzIGhhdmUgc2ltcGx5IGZvcm1lZCB0aGUgaGFiaXQgb2YgZG9pbmcgdGhpbmdzIGxvc2VycyBkb24ndCBsaWtlIHRvIGRvLiINCiJSYWxwaCBFbWVyc29uIiwiTmF0dXJlIGlzIGEgbXV0YWJsZSBjbG91ZCB3aGljaCBpcyBhbHdheXMgYW5kIG5ldmVyIHRoZSBzYW1lLiINCiJHcmFuZG1hIE1vc2VzIiwiTGlmZSBpcyB3aGF0IHlvdSBtYWtlIG9mIGl0LiBBbHdheXMgaGFzIGJlZW4sIGFsd2F5cyB3aWxsIGJlLiINCiJTd2VkaXNoIHByb3ZlcmIiLCJXb3JyeSBvZnRlbiBnaXZlcyBhIHNtYWxsIHRoaW5nIGEgYmlnIHNoYWRvdy4iDQoiQ29uZnVjaXVzIiwiSSB3YW50IHlvdSB0byBiZSBldmVyeXRoaW5nIHRoYXQncyB5b3UsIGRlZXAgYXQgdGhlIGNlbnRlciBvZiB5b3VyIGJlaW5nLiINCiJXaWxsaWFtIFNoYWtlc3BlYXJlIiwiV2Uga25vdyB3aGF0IHdlIGFyZSwgYnV0IGtub3cgbm90IHdoYXQgd2UgbWF5IGJlLiINCiJKZWFuLVBhdWwgU2FydHJlIiwiRnJlZWRvbSBpcyB3aGF0IHlvdSBkbyB3aXRoIHdoYXQncyBiZWVuIGRvbmUgdG8geW91LiINCiJGZWxpeCBBZGxlciIsIlRoZSB0cnV0aCB3aGljaCBoYXMgbWFkZSB1cyBmcmVlIHdpbGwgaW4gdGhlIGVuZCBtYWtlIHVzIGdsYWQgYWxzby4iDQoiSm9zZXBoIEpvdWJlcnQiLCJIZSB3aG8gaGFzIGltYWdpbmF0aW9uIHdpdGhvdXQgbGVhcm5pbmcgaGFzIHdpbmdzIGJ1dCBubyBmZWV0LiINCiJFbGl6YWJldGggQnJvd25pbmciLCJXaG9zbyBsb3ZlcywgYmVsaWV2ZXMgdGhlIGltcG9zc2libGUuIg0KIkVsbGEgRml0emdlcmFsZCIsIkl0IGlzbid0IHdoZXJlIHlvdSBjb21lIGZyb20sIGl0J3Mgd2hlcmUgeW91J3JlIGdvaW5nIHRoYXQgY291bnRzLiINCiJQZW1hIENob2Ryb24iLCJUaGUgZ3JlYXRlc3Qgb2JzdGFjbGUgdG8gY29ubmVjdGluZyB3aXRoIG91ciBqb3kgaXMgcmVzZW50bWVudC4iDQoiQy4gUHVsc2lmZXIiLCJXaGVuIGFuZ2VyIHVzZSB5b3VyIGVuZXJneSB0byBkbyBzb21ldGhpbmcgcHJvZHVjdGl2ZS4iDQoiQmxhaXNlIFBhc2NhbCIsIldlIGFyZSBhbGwgc29tZXRoaW5nLCBidXQgbm9uZSBvZiB1cyBhcmUgZXZlcnl0aGluZy4iDQoiQWxiZXJ0IEVpbnN0ZWluIiwiSWYgeW91IGNhbid0IGV4cGxhaW4gaXQgc2ltcGx5LCB5b3UgZG9uJ3QgdW5kZXJzdGFuZCBpdCB3ZWxsIGVub3VnaC4iDQoiTWFyY3VzIEF1cmVsaXVzIiwiSGUgd2hvIGxpdmVzIGluIGhhcm1vbnkgd2l0aCBoaW1zZWxmIGxpdmVzIGluIGhhcm1vbnkgd2l0aCB0aGUgd29ybGQuIg0KIkxhbyBUenUiLCJIZSB3aG8ga25vd3MgaGltc2VsZiBpcyBlbmxpZ2h0ZW5lZC4iDQoiUmFscGggRW1lcnNvbiIsIkJ1aWxkIGEgYmV0dGVyIG1vdXNldHJhcCBhbmQgdGhlIHdvcmxkIHdpbGwgYmVhdCBhIHBhdGggdG8geW91ciBkb29yLiINCiJBYnJhaGFtIExpbmNvbG4iLCJBcyBvdXIgY2FzZSBpcyBuZXcsIHdlIG11c3QgdGhpbmsgYW5kIGFjdCBhbmV3LiINCiJNb3RoZXIgVGVyZXNhIiwiSWYgeW91IGNhbid0IGZlZWQgYSBodW5kcmVkIHBlb3BsZSwgdGhlbiBmZWVkIGp1c3Qgb25lLiINCiJSb2JlcnQgRnJvc3QiLCJJbiB0aHJlZSB3b3JkcyBJIGNhbiBzdW0gdXAgZXZlcnl0aGluZyBJdmUgbGVhcm5lZCBhYm91dCBsaWZlOiBpdCBnb2VzIG9uLiINCiIiLCJEb24ndCBsZXQgdG9kYXkncyBkaXNhcHBvaW50bWVudHMgY2FzdCBhIHNoYWRvdyBvbiB0b21vcnJvdydzIGRyZWFtcy4iDQoiVG9ueSBSb2JiaW5zIiwiWW91IGFsd2F5cyBzdWNjZWVkIGluIHByb2R1Y2luZyBhIHJlc3VsdC4iDQoiV2F5bmUgRHllciIsIkV2ZXJ5dGhpbmcgeW91IGFyZSBhZ2FpbnN0IHdlYWtlbnMgeW91LiBFdmVyeXRoaW5nIHlvdSBhcmUgZm9yIGVtcG93ZXJzIHlvdS4iDQoiRnJhbiBXYXRzb24iLCJBcyB3ZSByaXNrIG91cnNlbHZlcywgd2UgZ3Jvdy4gRWFjaCBuZXcgZXhwZXJpZW5jZSBpcyBhIHJpc2suIg0KIk1hcnkgQWxtYW5hYyIsIldobyB3ZSBhcmUgbmV2ZXIgY2hhbmdlcy4gV2hvIHdlIHRoaW5rIHdlIGFyZSBkb2VzLiINCiJFbGJlcnQgSHViYmFyZCIsIlRoZSBmaW5hbCBwcm9vZiBvZiBncmVhdG5lc3MgbGllcyBpbiBiZWluZyBhYmxlIHRvIGVuZHVyZSBjcml0aWNpc20gd2l0aG91dCByZXNlbnRtZW50LiINCiJWaWN0b3IgSHVnbyIsIkFuIGludmFzaW9uIG9mIGFybWllcyBjYW4gYmUgcmVzaXN0ZWQsIGJ1dCBub3QgYW4gaWRlYSB3aG9zZSB0aW1lIGhhcyBjb21lLiINCiIiLCJOZXZlciBsZXQgbGFjayBvZiBtb25leSBpbnRlcmZlcmUgd2l0aCBoYXZpbmcgZnVuLiINCiJSYWxwaCBNYXJzdG9uIiwiRXhjZWxsZW5jZSBpcyBub3QgYSBza2lsbC4gSXQgaXMgYW4gYXR0aXR1ZGUuIg0KIkxld2lzIENhc3MiLCJQZW9wbGUgbWF5IGRvdWJ0IHdoYXQgeW91IHNheSwgYnV0IHRoZXkgd2lsbCBiZWxpZXZlIHdoYXQgeW91IGRvLiINCiJUaG9tYXMgUGFpbmUiLCJUaGUgbW9zdCBmb3JtaWRhYmxlIHdlYXBvbiBhZ2FpbnN0IGVycm9ycyBvZiBldmVyeSBraW5kIGlzIHJlYXNvbi4iDQoiRGFuaWxvIERvbGNpIiwiSXQncyBpbXBvcnRhbnQgdG8ga25vdyB0aGF0IHdvcmRzIGRvbid0IG1vdmUgbW91bnRhaW5zLiBXb3JrLCBleGFjdGluZyB3b3JrIG1vdmVzIG1vdW50YWlucy4iDQoiRnJhbnogTGlzenQiLCJCZXdhcmUgb2YgbWlzc2luZyBjaGFuY2VzOyBvdGhlcndpc2UgaXQgbWF5IGJlIGFsdG9nZXRoZXIgdG9vIGxhdGUgc29tZSBkYXkuIg0KIkJ1ZGRoYSIsIllvdSBvbmx5IGxvc2Ugd2hhdCB5b3UgY2xpbmcgdG8uIg0KIkNvcml0YSBLZW50IiwiTGlmZSBpcyBhIHN1Y2Nlc3Npb24gb2YgbW9tZW50cy4gVG8gbGl2ZSBlYWNoIG9uZSBpcyB0byBzdWNjZWVkLiINCiJSYWxwaCBXYWxkbyBFbWVyc29uIiwiTW9zdCBvZiB0aGUgc2hhZG93cyBvZiBsaWZlIGFyZSBjYXVzZWQgYnkgc3RhbmRpbmcgaW4gb3VyIG93biBzdW5zaGluZS4iDQoiUGxhdG8iLCJHb29kIGFjdGlvbnMgZ2l2ZSBzdHJlbmd0aCB0byBvdXJzZWx2ZXMgYW5kIGluc3BpcmUgZ29vZCBhY3Rpb25zIGluIG90aGVycy4iDQoiQW50b2luZSBkZSBTYWludC1FeHVwZXJ5IiwiSSBrbm93IGJ1dCBvbmUgZnJlZWRvbSBhbmQgdGhhdCBpcyB0aGUgZnJlZWRvbSBvZiB0aGUgbWluZC4iDQoiQWxiZXJ0IEVpbnN0ZWluIiwiSW4gdGhlIG1pZGRsZSBvZiBldmVyeSBkaWZmaWN1bHR5IGxpZXMgb3Bwb3J0dW5pdHkuIg0KIkJ1ZGRoYSIsIkV2ZXJ5IGh1bWFuIGJlaW5nIGlzIHRoZSBhdXRob3Igb2YgaGlzIG93biBoZWFsdGggb3IgZGlzZWFzZS4iDQoiTWFyayBUd2FpbiIsIldoZW4gaW4gZG91YnQsIHRlbGwgdGhlIHRydXRoLiINCiJKb2huIERld2V5IiwiRXZlcnkgZ3JlYXQgYWR2YW5jZSBpbiBzY2llbmNlIGhhcyBpc3N1ZWQgZnJvbSBhIG5ldyBhdWRhY2l0eSBvZiB0aGUgaW1hZ2luYXRpb24uIg0KIk5hcG9sZW9uIEhpbGwiLCJUaGUgbGFkZGVyIG9mIHN1Y2Nlc3MgaXMgbmV2ZXIgY3Jvd2RlZCBhdCB0aGUgdG9wLiINCiIiLCJIZSB3aG8gaGFzIGhlYWx0aCBoYXMgaG9wZSwgYW5kIGhlIHdobyBoYXMgaG9wZSBoYXMgZXZlcnl0aGluZy4iDQoiTWF5YSBBbmdlbG91IiwiQWxsIGdyZWF0IGFjaGlldmVtZW50cyByZXF1aXJlIHRpbWUuIg0KIkFsaWNlIFdhbGtlciIsIk5vIHBlcnNvbiBpcyB5b3VyIGZyaWVuZCB3aG8gZGVtYW5kcyB5b3VyIHNpbGVuY2UsIG9yIGRlbmllcyB5b3VyIHJpZ2h0IHRvIGdyb3cuIg0KIkNoYXJsZXMgQ2hlc251dHQiLCJJbXBvc3NpYmlsaXRpZXMgYXJlIG1lcmVseSB0aGluZ3Mgd2hpY2ggd2UgaGF2ZSBub3QgeWV0IGxlYXJuZWQuIg0KIkphcGFuZXNlIHByb3ZlcmIiLCJWaXNpb24gd2l0aG91dCBhY3Rpb24gaXMgYSBkYXlkcmVhbS4gQWN0aW9uIHdpdGhvdXQgdmlzaW9uIGlzIGEgbmlnaHRtYXJlLiINCiJDb25mdWNpdXMiLCJUaGUgU3VwZXJpb3IgTWFuIGlzIGF3YXJlIG9mIFJpZ2h0ZW91c25lc3MsIHRoZSBpbmZlcmlvciBtYW4gaXMgYXdhcmUgb2YgYWR2YW50YWdlLiINCiJFbGl6YWJldGggS2VubnkiLCJIZSB3aG8gYW5nZXJzIHlvdSBjb25xdWVycyB5b3UuIg0KIldpbnN0b24gQ2h1cmNoaWxsIiwiSSBuZXZlciB3b3JyeSBhYm91dCBhY3Rpb24sIGJ1dCBvbmx5IGluYWN0aW9uLiINCiJFcGljdGV0dXMiLCJObyBtYW4gaXMgZnJlZSB3aG8gaXMgbm90IG1hc3RlciBvZiBoaW1zZWxmLiINCiJBcmlzdG90bGUiLCJUaG9zZSB0aGF0IGtub3csIGRvLiBUaG9zZSB0aGF0IHVuZGVyc3RhbmQsIHRlYWNoLiINCiJUaGljaCBOaGF0IEhhbmgiLCJJZiB3ZSBhcmUgbm90IGZ1bGx5IG91cnNlbHZlcywgdHJ1bHkgaW4gdGhlIHByZXNlbnQgbW9tZW50LCB3ZSBtaXNzIGV2ZXJ5dGhpbmcuIg0KIkFlc29wIiwiTm8gYWN0IG9mIGtpbmRuZXNzLCBubyBtYXR0ZXIgaG93IHNtYWxsLCBpcyBldmVyIHdhc3RlZC4iDQoiQ2hhbm5pbmciLCJFdmVyeSBtYW4gaXMgYSB2b2x1bWUgaWYgeW91IGtub3cgaG93IHRvIHJlYWQgaGltLiINCiIiLCJUaGUgZGlmZmljdWx0aWVzIG9mIGxpZmUgYXJlIGludGVuZGVkIHRvIG1ha2UgdXMgYmV0dGVyLCBub3QgYml0dGVyLiINCiJIZW5yeSBGb3JkIiwiUXVhbGl0eSBtZWFucyBkb2luZyBpdCByaWdodCB3aGVuIG5vIG9uZSBpcyBsb29raW5nLiINCiIiLCJDaGFuZ2UgeW91ciB3b3Jkcy4gQ2hhbmdlIHlvdXIgd29ybGQuIg0KIkxhbyBUenUiLCJHcmVhdCBhY3RzIGFyZSBtYWRlIHVwIG9mIHNtYWxsIGRlZWRzLiINCiJNYWwgUGFuY29hc3QiLCJUaGUgb2RkcyBvZiBoaXR0aW5nIHlvdXIgdGFyZ2V0IGdvIHVwIGRyYW1hdGljYWxseSB3aGVuIHlvdSBhaW0gYXQgaXQuIg0KIiIsIk9wZW4gbWluZHMgbGVhZCB0byBvcGVuIGRvb3JzLiINCiJWaXJnaWwiLCJUaGV5IGNhbiBkbyBhbGwgYmVjYXVzZSB0aGV5IHRoaW5rIHRoZXkgY2FuLiINCiJEb25hbGQgVHJ1bXAiLCJZb3UgaGF2ZSB0byB0aGluayBhbnl3YXksIHNvIHdoeSBub3QgdGhpbmsgYmlnPyINCiJFZHdhcmQgWW91bmciLCJPbiBldmVyeSB0aG9ybiwgZGVsaWdodGZ1bCB3aXNkb20gZ3Jvd3MsIEluIGV2ZXJ5IHJpbGwgYSBzd2VldCBpbnN0cnVjdGlvbiBmbG93cy4iDQoiQnVkZGhhIiwiWW91ciBib2R5IGlzIHByZWNpb3VzLiBJdCBpcyBvdXIgdmVoaWNsZSBmb3IgYXdha2VuaW5nLiBUcmVhdCBpdCB3aXRoIGNhcmUuIg0KIkNsYWlyZSBDaGFybW9udCIsIlRoZSBvbmUgd2hvIGFsd2F5cyBsb3NlcywgaXMgdGhlIG9ubHkgcGVyc29uIHdobyBnZXRzIHRoZSByZXdhcmQuIg0KIlBlbWEgQ2hvZHJvbiIsIlRoZSBmdXR1cmUgaXMgY29tcGxldGVseSBvcGVuLCBhbmQgd2UgYXJlIHdyaXRpbmcgaXQgbW9tZW50IHRvIG1vbWVudC4iDQoiIiwiRWFjaCB0aW1lIHdlIGZhY2UgYSBmZWFyLCB3ZSBnYWluIHN0cmVuZ3RoLCBjb3VyYWdlLCBhbmQgY29uZmlkZW5jZSBpbiB0aGUgZG9pbmcuIg0KIlJpY2hhcmQgQmFjaCIsIkFzayB5b3Vyc2VsZiB0aGUgc2VjcmV0IG9mIHlvdXIgc3VjY2Vzcy4gTGlzdGVuIHRvIHlvdXIgYW5zd2VyLCBhbmQgcHJhY3RpY2UgaXQuIg0KIlNpbnZ5ZXN0IFRhbiIsIkRvbid0IGZyb3duIGJlY2F1c2UgeW91IG5ldmVyIGtub3cgd2hvIGlzIGZhbGxpbmcgaW4gbG92ZSB3aXRoIHlvdXIgc21pbGUuIg0KIkpveWNlIEJyb3RoZXJzIiwiVHJ1c3QgeW91ciBodW5jaGVzLiBUaGV5J3JlIHVzdWFsbHkgYmFzZWQgb24gZmFjdHMgZmlsZWQgYXdheSBqdXN0IGJlbG93IHRoZSBjb25zY2lvdXMgbGV2ZWwuIg0KIlJhbHBoIEVtZXJzb24iLCJOb3RoaW5nIGlzIGF0IGxhc3Qgc2FjcmVkIGJ1dCB0aGUgaW50ZWdyaXR5IG9mIHlvdXIgb3duIG1pbmQuIg0KIkFudGhvbnkgRCdBbmdlbG8iLCJMaXN0ZW4gdG8geW91ciBpbnR1aXRpb24uIEl0IHdpbGwgdGVsbCB5b3UgZXZlcnl0aGluZyB5b3UgbmVlZCB0byBrbm93LiINCiJBbmFpcyBOaW4iLCJUaGUgcGVyc29uYWwgbGlmZSBkZWVwbHkgbGl2ZWQgYWx3YXlzIGV4cGFuZHMgaW50byB0cnV0aHMgYmV5b25kIGl0c2VsZi4iDQoiRWNraGFydCBUb2xsZSIsIldoZW5ldmVyIHNvbWV0aGluZyBuZWdhdGl2ZSBoYXBwZW5zIHRvIHlvdSwgdGhlcmUgaXMgYSBkZWVwIGxlc3NvbiBjb25jZWFsZWQgd2l0aGluIGl0LiINCiJHb2V0aGUiLCJXaGF0IGlzIG5vdCBzdGFydGVkIHRvZGF5IGlzIG5ldmVyIGZpbmlzaGVkIHRvbW9ycm93LiINCiJHb3Jkb24gSGluY2tsZXkiLCJPdXIga2luZG5lc3MgbWF5IGJlIHRoZSBtb3N0IHBlcnN1YXNpdmUgYXJndW1lbnQgZm9yIHRoYXQgd2hpY2ggd2UgYmVsaWV2ZS4iDQoiQnVkZGhhIiwiQ2hhb3MgaXMgaW5oZXJlbnQgaW4gYWxsIGNvbXBvdW5kZWQgdGhpbmdzLiBTdHJpdmUgb24gd2l0aCBkaWxpZ2VuY2UuIg0KIkFicmFoYW0gTGluY29sbiIsIkJlIHN1cmUgeW91IHB1dCB5b3VyIGZlZXQgaW4gdGhlIHJpZ2h0IHBsYWNlLCB0aGVuIHN0YW5kIGZpcm0uIg0KIlJhbHBoIEVtZXJzb24iLCJOb3RoaW5nIGdyZWF0IHdhcyBldmVyIGFjaGlldmVkIHdpdGhvdXQgZW50aHVzaWFzbS4iDQoiUmljaGFyZCBCYWNoIiwiVGhlIG1lYW5pbmcgSSBwaWNrZWQsIHRoZSBvbmUgdGhhdCBjaGFuZ2VkIG15IGxpZmU6IE92ZXJjb21lIGZlYXIsIGJlaG9sZCB3b25kZXIuIg0KIlBsdXRhcmNoIiwiS25vdyBob3cgdG8gbGlzdGVuLCBhbmQgeW91IHdpbGwgcHJvZml0IGV2ZW4gZnJvbSB0aG9zZSB3aG8gdGFsayBiYWRseS4iDQoiRWRtb25kIFJvc3RhbmQiLCJBIG1hbiBpcyBub3Qgb2xkIGFzIGxvbmcgYXMgaGUgaXMgc2Vla2luZyBzb21ldGhpbmcuIg0KIlltYmVyIERlbGVjdG8iLCJUaGUgdGltZSB5b3UgdGhpbmsgeW91J3JlIG1pc3NpbmcsIG1pc3NlcyB5b3UgdG9vLiINCiJNaWNoYWVsIFZhbmNlIiwiTGlmZSBpcyBub3QgbWVhc3VyZWQgYnkgdGhlIGJyZWF0aHMgeW91IHRha2UsIGJ1dCBieSBpdHMgYnJlYXRodGFraW5nIG1vbWVudHMuIg0KIlNvcGhvY2xlcyIsIk11Y2ggd2lzZG9tIG9mdGVuIGdvZXMgd2l0aCBmZXdlciB3b3Jkcy4iDQoiQnJ1Y2UgTGVlIiwiSWYgeW91IGxvdmUgbGlmZSwgZG9uJ3Qgd2FzdGUgdGltZSwgZm9yIHRpbWUgaXMgd2hhdCBsaWZlIGlzIG1hZGUgdXAgb2YuIg0KIlNhbXVlbCBUYXlsb3IgQ29sZXJpZGdlIiwiSW1hZ2luYXRpb24gaXMgdGhlIGxpdmluZyBwb3dlciBhbmQgcHJpbWUgYWdlbnQgb2YgYWxsIGh1bWFuIHBlcmNlcHRpb24uIg0KIk5hb21pIFdpbGxpYW1zIiwiSXQgaXMgaW1wb3NzaWJsZSB0byBmZWVsIGdyYXRlZnVsIGFuZCBkZXByZXNzZWQgaW4gdGhlIHNhbWUgbW9tZW50LiINCiJGcmVkZXJpY2sgV2lsY294IiwiUHJvZ3Jlc3MgYWx3YXlzIGludm9sdmVzIHJpc2tzLiBZb3UgY2FuJ3Qgc3RlYWwgc2Vjb25kIGJhc2UgYW5kIGtlZXAgeW91ciBmb290IG9uIGZpcnN0LiINCiJTaW1vbmUgV2VpbCIsIkxpYmVydHksIHRha2luZyB0aGUgd29yZCBpbiBpdHMgY29uY3JldGUgc2Vuc2UsIGNvbnNpc3RzIGluIHRoZSBhYmlsaXR5IHRvIGNob29zZS4iDQoiSm9obiBEcnlkZW4iLCJBIHRoaW5nIHdlbGwgc2FpZCB3aWxsIGJlIHdpdCBpbiBhbGwgbGFuZ3VhZ2VzLiINCiJPZyBNYW5kaW5vIiwiQWx3YXlzIGRvIHlvdXIgYmVzdC4gV2hhdCB5b3UgcGxhbnQgbm93LCB5b3Ugd2lsbCBoYXJ2ZXN0IGxhdGVyLiINCiJGb3JyZXN0IEd1bXAiLCJNeSBtYW1hIGFsd2F5cyBzYWlkOiBsaWZlJ3MgbGlrZSBhIGJveCBvZiBjaG9jb2xhdGUsIHlvdSBuZXZlciBrbm93IHdoYXQgeW91IGdvbm5hIGdldC4iDQoiSmVhbiBMYWNvcmRhaXJlIiwiV2UgYXJlIHRoZSBsZWF2ZXMgb2Ygb25lIGJyYW5jaCwgdGhlIGRyb3BzIG9mIG9uZSBzZWEsIHRoZSBmbG93ZXJzIG9mIG9uZSBnYXJkZW4uIg0KIiIsIklmIHlvdSBjb21lIHRvIGEgZm9yayBpbiB0aGUgcm9hZCwgdGFrZSBpdC4iDQoiTW9saWVyZSIsIkl0IGlzIG5vdCBvbmx5IGZvciB3aGF0IHdlIGRvIHRoYXQgd2UgYXJlIGhlbGQgcmVzcG9uc2libGUsIGJ1dCBhbHNvIGZvciB3aGF0IHdlIGRvIG5vdCBkby4iDQoiIiwiTm9ib2R5IGNhbiBkbyBldmVyeXRoaW5nLCBidXQgZXZlcnlib2R5IGNhbiBkbyBzb21ldGhpbmcuIg0KIk5hcG9sZW9uIEhpbGwiLCJUaGUgd29ybGQgaGFzIHRoZSBoYWJpdCBvZiBtYWtpbmcgcm9vbSBmb3IgdGhlIG1hbiB3aG9zZSBhY3Rpb25zIHNob3cgdGhhdCBoZSBrbm93cyB3aGVyZSBoZSBpcyBnb2luZy4iDQoiSGVyYWNsaXR1cyIsIllvdSBjYW5ub3Qgc3RlcCB0d2ljZSBpbnRvIHRoZSBzYW1lIHJpdmVyLCBmb3Igb3RoZXIgd2F0ZXJzIGFyZSBjb250aW51YWxseSBmbG93aW5nIGluLiINCiJCb29rZXIgV2FzaGluZ3RvbiIsIkV4Y2VsbGVuY2UgaXMgdG8gZG8gYSBjb21tb24gdGhpbmcgaW4gYW4gdW5jb21tb24gd2F5LiINCiJCdWRkaGEiLCJObyBtYXR0ZXIgaG93IGhhcmQgdGhlIHBhc3QsIHlvdSBjYW4gYWx3YXlzIGJlZ2luIGFnYWluLiINCiJQYWJsbyBQaWNhc3NvIiwiSSBiZWdpbiB3aXRoIGFuIGlkZWEgYW5kIHRoZW4gaXQgYmVjb21lcyBzb21ldGhpbmcgZWxzZS4iDQoiTWFyayBUd2FpbiIsIldob2V2ZXIgaXMgaGFwcHkgd2lsbCBtYWtlIG90aGVycyBoYXBweSwgdG9vLiINCiJCdWRkaGEiLCJZb3VyIHdvcmsgaXMgdG8gZGlzY292ZXIgeW91ciB3b3JrIGFuZCB0aGVuIHdpdGggYWxsIHlvdXIgaGVhcnQgdG8gZ2l2ZSB5b3Vyc2VsZiB0byBpdC4iDQoiRXBpY3RldHVzIiwiSXQncyBub3Qgd2hhdCBoYXBwZW5zIHRvIHlvdSwgYnV0IGhvdyB5b3UgcmVhY3QgdG8gaXQgdGhhdCBtYXR0ZXJzLiINCiJXb29keSBHdXRocmllIiwiVGFrZSBpdCBlYXN5LCBidXQgdGFrZSBpdC4iDQoiQmVuamFtaW4gRGlzcmFlbGkiLCJOZXZlciBhcG9sb2dpemUgZm9yIHNob3dpbmcgZmVlbGluZy4gV2hlbiB5b3UgZG8gc28sIHlvdSBhcG9sb2dpemUgZm9yIHRydXRoLiINCiJPdmlkIiwiVGFrZSByZXN0OyBhIGZpZWxkIHRoYXQgaGFzIHJlc3RlZCBnaXZlcyBhIGJvdW50aWZ1bCBjcm9wLiINCiJBbmFpcyBOaW4iLCJBZ2UgZG9lcyBub3QgcHJvdGVjdCB5b3UgZnJvbSBsb3ZlLiBCdXQgbG92ZSwgdG8gc29tZSBleHRlbnQsIHByb3RlY3RzIHlvdSBmcm9tIGFnZS4iDQoiRm9ycmVzdCBDaHVyY2giLCJEbyB3aGF0IHlvdSBjYW4uIFdhbnQgd2hhdCB5b3UgaGF2ZS4gQmUgd2hvIHlvdSBhcmUuIg0KIkNvY28gQ2hhbmVsIiwiVGhlcmUgYXJlIHBlb3BsZSB3aG8gaGF2ZSBtb25leSBhbmQgcGVvcGxlIHdobyBhcmUgcmljaC4iDQoiIiwiV2h5IHdvcnJ5IGFib3V0IHRvbW9ycm93LCB3aGVuIHRvZGF5IGlzIGFsbCB3ZSBoYXZlPyINCiJBbWJyb3NlIEJpZXJjZSIsIlNwZWFrIHdoZW4geW91IGFyZSBhbmdyeSBhbmQgeW91IHdpbGwgbWFrZSB0aGUgYmVzdCBzcGVlY2ggeW91IHdpbGwgZXZlciByZWdyZXQuIg0KIkhlbnJ5IFRob3JlYXUiLCJUaGluZ3MgZG8gbm90IGNoYW5nZSwgd2UgY2hhbmdlLiINCiJNYXJrIFR3YWluIiwiVGhlIGV4ZXJjaXNlIG9mIGFuIGV4dHJhb3JkaW5hcnkgZ2lmdCBpcyB0aGUgc3VwcmVtZXN0IHBsZWFzdXJlIGluIGxpZmUuIg0KIkV0dHkgSGlsbGVzdW0iLCJTb21ldGltZXMgdGhlIG1vc3QgaW1wb3J0YW50IHRoaW5nIGluIGEgd2hvbGUgZGF5IGlzIHRoZSByZXN0IHdlIHRha2UgYmV0d2VlbiB0d28gZGVlcCBicmVhdGhzLiINCiJNb2hhbmRhcyBHYW5kaGkiLCJGb3JnaXZlbmVzcyBpcyBjaG9vc2luZyB0byBsb3ZlLiBJdCBpcyB0aGUgZmlyc3Qgc2tpbGwgb2Ygc2VsZi1naXZpbmcgbG92ZS4iDQoiV2lsbGlhbSBMb25kZW4iLCJUbyBlbnN1cmUgZ29vZCBoZWFsdGg6IGVhdCBsaWdodGx5LCBicmVhdGhlIGRlZXBseSwgbGl2ZSBtb2RlcmF0ZWx5LCBjdWx0aXZhdGUgY2hlZXJmdWxuZXNzLCBhbmQgbWFpbnRhaW4gYW4gaW50ZXJlc3QgaW4gbGlmZS4iDQoiIiwiTW9zdCBzbWlsZXMgYXJlIHN0YXJ0ZWQgYnkgYW5vdGhlciBzbWlsZS4iDQoiTGFvIFR6dSIsIk5vdGhpbmcgaXMgc29mdGVyIG9yIG1vcmUgZmxleGlibGUgdGhhbiB3YXRlciwgeWV0IG5vdGhpbmcgY2FuIHJlc2lzdCBpdC4iDQoiRGFsYWkgTGFtYSIsIkl0IGlzIGRpZmZpY3VsdCB0byBhY2hpZXZlIGEgc3Bpcml0IG9mIGdlbnVpbmUgY29vcGVyYXRpb24gYXMgbG9uZyBhcyBwZW9wbGUgcmVtYWluIGluZGlmZmVyZW50IHRvIHRoZSBmZWVsaW5ncyBhbmQgaGFwcGluZXNzIG9mIG90aGVycy4iDQoiQmVuamFtaW4gRnJhbmtsaW4iLCJFeHBlcmllbmNlIGtlZXBzIGEgZGVhciBzY2hvb2wsIGJ1dCBmb29scyB3aWxsIGxlYXJuIGluIG5vIG90aGVyLiINCiJUaG9ybnRvbiBXaWxkZXIiLCJXZSBjYW4gb25seSBiZSBzYWlkIHRvIGJlIGFsaXZlIGluIHRob3NlIG1vbWVudHMgd2hlbiBvdXIgaGVhcnRzIGFyZSBjb25zY2lvdXMgb2Ygb3VyIHRyZWFzdXJlcy4iDQoiQ29uZnVjaXVzIiwiRmluZSB3b3JkcyBhbmQgYW4gaW5zaW51YXRpbmcgYXBwZWFyYW5jZSBhcmUgc2VsZG9tIGFzc29jaWF0ZWQgd2l0aCB0cnVlIHZpcnR1ZSINCiJPbGl2ZXIgSG9sbWVzIiwiV2UgZG8gbm90IHF1aXQgcGxheWluZyBiZWNhdXNlIHdlIGdyb3cgb2xkLCB3ZSBncm93IG9sZCBiZWNhdXNlIHdlIHF1aXQgcGxheWluZy4iDQoiV2F5bmUgRHllciIsIllvdSBjYW4ndCBjaG9vc2UgdXAgc2lkZXMgb24gYSByb3VuZCB3b3JsZC4iDQoiTWFyayBUd2FpbiIsIktpbmRuZXNzIGlzIHRoZSBsYW5ndWFnZSB3aGljaCB0aGUgZGVhZiBjYW4gaGVhciBhbmQgdGhlIGJsaW5kIGNhbiBzZWUuIg0KIkJ5cm9uIFB1bHNpZmVyIiwiSSBtYXkgbm90IGtub3cgZXZlcnl0aGluZywgYnV0IGV2ZXJ5dGhpbmcgaXMgbm90IGtub3duIHlldCBhbnl3YXkuIg0KIkJ1ZGRoYSIsIklmIHdlIGNvdWxkIHNlZSB0aGUgbWlyYWNsZSBvZiBhIHNpbmdsZSBmbG93ZXIgY2xlYXJseSwgb3VyIHdob2xlIGxpZmUgd291bGQgY2hhbmdlLiINCiJDYXJsIEp1bmciLCJXaXRob3V0IHRoaXMgcGxheWluZyB3aXRoIGZhbnRhc3kgbm8gY3JlYXRpdmUgd29yayBoYXMgZXZlciB5ZXQgY29tZSB0byBiaXJ0aC4gVGhlIGRlYnQgd2Ugb3dlIHRvIHRoZSBwbGF5IG9mIHRoZSBpbWFnaW5hdGlvbiBpcyBpbmNhbGN1bGFibGUuIg0KIkJ1ZGRoYSIsIllvdSBjYW5ub3QgdHJhdmVsIHRoZSBwYXRoIHVudGlsIHlvdSBoYXZlIGJlY29tZSB0aGUgcGF0aCBpdHNlbGYuIg0KIlRoZW9kb3JlIFJvb3NldmVsdCIsIktlZXAgeW91ciBleWVzIG9uIHRoZSBzdGFycyBhbmQgeW91ciBmZWV0IG9uIHRoZSBncm91bmQuIg0KIldpbGxpYW0gV2hpdGUiLCJJIGFtIG5vdCBhZnJhaWQgb2YgdG9tb3Jyb3csIGZvciBJIGhhdmUgc2VlbiB5ZXN0ZXJkYXkgYW5kIEkgbG92ZSB0b2RheS4iDQoiSmFtaWUgUGFvbGluZXR0aSIsIkxpbWl0YXRpb25zIGxpdmUgb25seSBpbiBvdXIgbWluZHMuIEJ1dCBpZiB3ZSB1c2Ugb3VyIGltYWdpbmF0aW9ucywgb3VyIHBvc3NpYmlsaXRpZXMgYmVjb21lIGxpbWl0bGVzcy4iDQoiIiwiV2hlbiB5b3UgbG9zZSwgZG9uJ3QgbG9zZSB0aGUgbGVzc29uLiINCiJOYXBvbGVvbiBCb25hcGFydGUiLCJJZiB5b3Ugd2FudCBhIHRoaW5nIGRvbmUgd2VsbCwgZG8gaXQgeW91cnNlbGYuIg0KIkVyaWtzc29uIiwiVGhlIGdyZWF0ZXN0IGJhcnJpZXIgdG8gc3VjY2VzcyBpcyB0aGUgZmVhciBvZiBmYWlsdXJlLiINCiJKb2huIFJ1c2tpbiIsIlN1bnNoaW5lIGlzIGRlbGljaW91cywgcmFpbiBpcyByZWZyZXNoaW5nLCB3aW5kIGJyYWNlcyB1cyB1cCwgc25vdyBpcyBleGhpbGFyYXRpbmc7IHRoZXJlIGlzIHJlYWxseSBubyBzdWNoIHRoaW5nIGFzIGJhZCB3ZWF0aGVyLCBvbmx5IGRpZmZlcmVudCBraW5kcyBvZiBnb29kIHdlYXRoZXIuIg0KIkpvZSBOYW1hdGgiLCJJZiB5b3UgYXJlbid0IGdvaW5nIGFsbCB0aGUgd2F5LCB3aHkgZ28gYXQgYWxsPyINCiJDb25mdWNpdXMiLCJPdXIgZ3JlYXRlc3QgZ2xvcnkgaXMgbm90IGluIG5ldmVyIGZhbGxpbmcsIGJ1dCBpbiByaXNpbmcgZXZlcnkgdGltZSB3ZSBmYWxsLiINCiJQaWVycmUgQWJlbGFyZCIsIlRoZSBiZWdpbm5pbmcgb2Ygd2lzZG9tIGlzIGZvdW5kIGluIGRvdWJ0aW5nOyBieSBkb3VidGluZyB3ZSBjb21lIHRvIHRoZSBxdWVzdGlvbiwgYW5kIGJ5IHNlZWtpbmcgd2UgbWF5IGNvbWUgdXBvbiB0aGUgdHJ1dGguIg0KIiIsIklmIEkgY291bGQgcmVhY2ggdXAgYW5kIGhvbGQgYSBzdGFyIGZvciBldmVyeSB0aW1lIHlvdSd2ZSBtYWRlIG1lIHNtaWxlLCB0aGUgZW50aXJlIGV2ZW5pbmcgc2t5IHdvdWxkIGJlIGluIHRoZSBwYWxtIG9mIG15IGhhbmQuIg0KIkJ1ZGRoYSIsIldlIGFyZSBzaGFwZWQgYnkgb3VyIHRob3VnaHRzOyB3ZSBiZWNvbWUgd2hhdCB3ZSB0aGluay4gV2hlbiB0aGUgbWluZCBpcyBwdXJlLCBqb3kgZm9sbG93cyBsaWtlIGEgc2hhZG93IHRoYXQgbmV2ZXIgbGVhdmVzLiINCiJUb255IFJvYmJpbnMiLCJTdGF5IGNvbW1pdHRlZCB0byB5b3VyIGRlY2lzaW9ucywgYnV0IHN0YXkgZmxleGlibGUgaW4geW91ciBhcHByb2FjaC4iDQoiQWxiZXJ0IFNjaHdlaXR6ZXIiLCJBbiBvcHRpbWlzdCBpcyBhIHBlcnNvbiB3aG8gc2VlcyBhIGdyZWVuIGxpZ2h0IGV2ZXJ5d2hlcmUsIHdoaWxlIHRoZSBwZXNzaW1pc3Qgc2VlcyBvbmx5IHRoZSByZWQgc3BvdGxpZ2h0Li4uIFRoZSB0cnVseSB3aXNlIHBlcnNvbiBpcyBjb2xvdXItYmxpbmQuIg0KIkRvbmFsZCBUcnVtcCIsIldoYXQgc2VwYXJhdGVzIHRoZSB3aW5uZXJzIGZyb20gdGhlIGxvc2VycyBpcyBob3cgYSBwZXJzb24gcmVhY3RzIHRvIGVhY2ggbmV3IHR3aXN0IG9mIGZhdGUuIg0KIlJhbHBoIEVtZXJzb24iLCJFYWNoIG1hbiBoYXMgaGlzIG93biB2b2NhdGlvbjsgaGlzIHRhbGVudCBpcyBoaXMgY2FsbC4gVGhlcmUgaXMgb25lIGRpcmVjdGlvbiBpbiB3aGljaCBhbGwgc3BhY2UgaXMgb3BlbiB0byBoaW0uIg0KIkRoYW1tYXBhZGEiLCJKdXN0IGFzIGEgZmxvd2VyLCB3aGljaCBzZWVtcyBiZWF1dGlmdWwgaGFzIGNvbG9yIGJ1dCBubyBwZXJmdW1lLCBzbyBhcmUgdGhlIGZydWl0bGVzcyB3b3JkcyBvZiBhIG1hbiB3aG8gc3BlYWtzIHRoZW0gYnV0IGRvZXMgdGhlbSBub3QuIg0KIldpbGxpYW0gSmFtZXMiLCJUbyBjaGFuZ2Ugb25lcyBsaWZlLCBzdGFydCBpbW1lZGlhdGVseSwgZG8gaXQgZmxhbWJveWFudGx5LCBubyBleGNlcHRpb25zLiINCiJKb2huIEYuIEtlbm5lZHkiLCJBcyB3ZSBleHByZXNzIG91ciBncmF0aXR1ZGUsIHdlIG11c3QgbmV2ZXIgZm9yZ2V0IHRoYXQgdGhlIGhpZ2hlc3QgYXBwcmVjaWF0aW9uIGlzIG5vdCB0byB1dHRlciB3b3JkcywgYnV0IHRvIGxpdmUgYnkgdGhlbS4iDQoiQm9va2VyIFdhc2hpbmd0b24iLCJUaGUgd29ybGQgY2FyZXMgdmVyeSBsaXR0bGUgYWJvdXQgd2hhdCBhIG1hbiBvciB3b21hbiBrbm93czsgaXQgaXMgd2hhdCBhIG1hbiBvciB3b21hbiBpcyBhYmxlIHRvIGRvIHRoYXQgY291bnRzLiINCiIiLCJUaGUgc3RlZXBlciB0aGUgbW91bnRhaW4gdGhlIGhhcmRlciB0aGUgY2xpbWIgdGhlIGJldHRlciB0aGUgdmlldyBmcm9tIHRoZSBmaW5pc2hpbmcgbGluZSINCiJEci4gRGF2aWQgTS4gQnVybnMiLCJBaW0gZm9yIHN1Y2Nlc3MsIG5vdCBwZXJmZWN0aW9uLiBOZXZlciBnaXZlIHVwIHlvdXIgcmlnaHQgdG8gYmUgd3JvbmcsIGJlY2F1c2UgdGhlbiB5b3Ugd2lsbCBsb3NlIHRoZSBhYmlsaXR5IHRvIGxlYXJuIG5ldyB0aGluZ3MgYW5kIG1vdmUgZm9yd2FyZCB3aXRoIHlvdXIgbGlmZS4iDQoiTGFvIFR6dSIsIldoZW4gSSBsZXQgZ28gb2Ygd2hhdCBJIGFtLCBJIGJlY29tZSB3aGF0IEkgbWlnaHQgYmUuIg0KIkJ5cm9uIFB1bHNpZmVyIiwiVHJhbnNmb3JtYXRpb24gZG9lcyBub3Qgc3RhcnQgd2l0aCBzb21lIG9uZSBlbHNlIGNoYW5naW5nIHlvdTsgdHJhbnNmb3JtYXRpb24gaXMgYW4gaW5uZXIgc2VsZiByZXdvcmtpbmcgb2Ygd2hhdCB5b3UgYXJlIG5vdyB0byB3aGF0IHlvdSB3aWxsIGJlLiINCiJCeXJvbiBQdWxzaWZlciIsIlRpbWUgaXMgbm90IGEgbWVhc3VyZSB0aGUgbGVuZ3RoIG9mIGEgZGF5IG9yIG1vbnRoIG9yIHllYXIgYnV0IG1vcmUgYSBtZWFzdXJlIG9mIHdoYXQgeW91IGhhdmUgYWNjb21wbGlzaGVkLiINCiJKb2hhbm4gV29sZmdhbmcgdm9uIEdvZXRoZSIsIldoZXJldmVyIGEgbWFuIG1heSBoYXBwZW4gdG8gdHVybiwgd2hhdGV2ZXIgYSBtYW4gbWF5IHVuZGVydGFrZSwgaGUgd2lsbCBhbHdheXMgZW5kIHVwIGJ5IHJldHVybmluZyB0byB0aGUgcGF0aCB3aGljaCBuYXR1cmUgaGFzIG1hcmtlZCBvdXQgZm9yIGhpbS4iDQoiQnVkZGhhIiwiSG9sZGluZyBvbiB0byBhbmdlciBpcyBsaWtlIGdyYXNwaW5nIGEgaG90IGNvYWwgd2l0aCB0aGUgaW50ZW50IG9mIHRocm93aW5nIGl0IGF0IHNvbWVvbmUgZWxzZTsgeW91IGFyZSB0aGUgb25lIHdobyBnZXRzIGJ1cm5lZC4iDQoiQWZyaWNhbiBwcm92ZXJiIiwiV2hlbiB0aGVyZSBpcyBubyBlbmVteSB3aXRoaW4sIHRoZSBlbmVtaWVzIG91dHNpZGUgY2Fubm90IGh1cnQgeW91LiINCiJMYW8gVHp1IiwiSGUgd2hvIGNvbnRyb2xzIG90aGVycyBtYXkgYmUgcG93ZXJmdWwsIGJ1dCBoZSB3aG8gaGFzIG1hc3RlcmVkIGhpbXNlbGYgaXMgbWlnaHRpZXIgc3RpbGwuIg0KIldheW5lIER5ZXIiLCJUaGVyZSBpcyBubyBzY2FyY2l0eSBvZiBvcHBvcnR1bml0eSB0byBtYWtlIGEgbGl2aW5nIGF0IHdoYXQgeW91IGxvdmU7IHRoZXJlcyBvbmx5IHNjYXJjaXR5IG9mIHJlc29sdmUgdG8gbWFrZSBpdCBoYXBwZW4uIg0KIldvbGZnYW5nIEFtYWRldXMgTW96YXJ0IiwiTmVpdGhlciBhIGxvZnR5IGRlZ3JlZSBvZiBpbnRlbGxpZ2VuY2Ugbm9yIGltYWdpbmF0aW9uIG5vciBib3RoIHRvZ2V0aGVyIGdvIHRvIHRoZSBtYWtpbmcgb2YgZ2VuaXVzLiBMb3ZlLCBsb3ZlLCBsb3ZlLCB0aGF0IGlzIHRoZSBzb3VsIG9mIGdlbml1cy4iDQoiSC4gQmVydHJhbSBMZXdpcyIsIlRoZSBoYXBweSBhbmQgZWZmaWNpZW50IHBlb3BsZSBpbiB0aGlzIHdvcmxkIGFyZSB0aG9zZSB3aG8gYWNjZXB0IHRyb3VibGUgYXMgYSBub3JtYWwgZGV0YWlsIG9mIGh1bWFuIGxpZmUgYW5kIHJlc29sdmUgdG8gY2FwaXRhbGl6ZSBpdCB3aGVuIGl0IGNvbWVzIGFsb25nLiINCiJTYXVsIEFsaW5za3kiLCJBcyBhbiBvcmdhbml6ZXIgSSBzdGFydCBmcm9tIHdoZXJlIHRoZSB3b3JsZCBpcywgYXMgaXQgaXMsIG5vdCBhcyBJIHdvdWxkIGxpa2UgaXQgdG8gYmUuIg0KIlppZyBaaWdsYXIiLCJZb3UgYXJlIHRoZSBvbmx5IHBlcnNvbiBvbiBFYXJ0aCB3aG8gY2FuIHVzZSB5b3VyIGFiaWxpdHkuIg0KIiIsIkRvbid0IGxldCB3aGF0IHlvdSBjYW4ndCBkbyBzdG9wIHlvdSBmcm9tIGRvaW5nIHdoYXQgeW91IGNhbiBkby4iDQoiQnlyb24gUHVsc2lmZXIiLCJDb21wbGFpbmluZyBkb2Vzbid0IGNoYW5nZSBhIHRoaW5nIG9ubHkgdGFraW5nIGFjdGlvbiBkb2VzLiINCiJDaGFybGVzIEEuIExpbmRiZXJnaCIsIkxpZmUgYSBjdWxtaW5hdGlvbiBvZiB0aGUgcGFzdCwgYW4gYXdhcmVuZXNzIG9mIHRoZSBwcmVzZW50LCBhbiBpbmRpY2F0aW9uIG9mIHRoZSBmdXR1cmUgYmV5b25kIGtub3dsZWRnZSwgdGhlIHF1YWxpdHkgdGhhdCBnaXZlcyBhIHRvdWNoIG9mIGRpdmluaXR5IHRvIG1hdHRlci4iDQoiUm9iZXJ0IEJyYXVsdCIsIkVuam95IHRoZSBsaXR0bGUgdGhpbmdzLCBmb3Igb25lIGRheSB5b3UgbWF5IGxvb2sgYmFjayBhbmQgcmVhbGl6ZSB0aGV5IHdlcmUgdGhlIGJpZyB0aGluZ3MuIg0KIk9wcmFoIFdpbmZyZXkiLCJXaXRoIGV2ZXJ5IGV4cGVyaWVuY2UsIHlvdSBhbG9uZSBhcmUgcGFpbnRpbmcgeW91ciBvd24gY2FudmFzLCB0aG91Z2h0IGJ5IHRob3VnaHQsIGNob2ljZSBieSBjaG9pY2UuIg0KIlJ1bWkiLCJMZXQgdGhlIGJlYXV0eSBvZiB3aGF0IHlvdSBsb3ZlIGJlIHdoYXQgeW91IGRvLiINCiJFcGljdGV0dXMiLCJUaGUgd29ybGQgdHVybnMgYXNpZGUgdG8gbGV0IGFueSBtYW4gcGFzcyB3aG8ga25vd3Mgd2hlcmUgaGUgaXMgZ29pbmcuIg0KIkthaGxpbCBHaWJyYW4iLCJCZWF1dHkgaXMgbm90IGluIHRoZSBmYWNlOyBiZWF1dHkgaXMgYSBsaWdodCBpbiB0aGUgaGVhcnQuIg0KIkpvaG4gTHViYm9jayIsIkEgZGF5IG9mIHdvcnJ5IGlzIG1vcmUgZXhoYXVzdGluZyB0aGFuIGEgZGF5IG9mIHdvcmsuIg0KIlJhbHBoIEVtZXJzb24iLCJUcnV0aCwgYW5kIGdvb2RuZXNzLCBhbmQgYmVhdXR5IGFyZSBidXQgZGlmZmVyZW50IGZhY2VzIG9mIHRoZSBzYW1lIGFsbC4iDQoiUmFscGggRW1lcnNvbiIsIlRvIGJlIGdyZWF0IGlzIHRvIGJlIG1pc3VuZGVyc3Rvb2QuIg0KIkFsZnJlZCBBZGxlciIsIlRydXN0IG9ubHkgbW92ZW1lbnQuIExpZmUgaGFwcGVucyBhdCB0aGUgbGV2ZWwgb2YgZXZlbnRzLCBub3Qgb2Ygd29yZHMuIFRydXN0IG1vdmVtZW50LiINCiJXaW5zdG9uIENodXJjaGlsbCIsIk5ldmVyLCBuZXZlciwgbmV2ZXIgZ2l2ZSB1cC4iDQoiQW5kcmUgR2lkZSIsIlRoZSBtb3N0IGRlY2lzaXZlIGFjdGlvbnMgb2Ygb3VyIGxpZmUuLi4gYXJlIG1vc3Qgb2Z0ZW4gdW5jb25zaWRlcmVkIGFjdGlvbnMuIg0KIlJvYmVydCBTY2h1bGxlciIsIkFzIHdlIGdyb3cgYXMgdW5pcXVlIHBlcnNvbnMsIHdlIGxlYXJuIHRvIHJlc3BlY3QgdGhlIHVuaXF1ZW5lc3Mgb2Ygb3RoZXJzLiINCiJSb2JlcnQgU2NodWxsZXIiLCJGYWlsdXJlIGRvZXNuJ3QgbWVhbiB5b3UgYXJlIGEgZmFpbHVyZSBpdCBqdXN0IG1lYW5zIHlvdSBoYXZlbid0IHN1Y2NlZWRlZCB5ZXQuIg0KIk1haGF0bWEgR2FuZGhpIiwiSXQgaXMgdGhlIHF1YWxpdHkgb2Ygb3VyIHdvcmsgd2hpY2ggd2lsbCBwbGVhc2UgR29kLCBub3QgdGhlIHF1YW50aXR5LiINCiJTdGVwaGVuIEthZ2d3YSIsIlRyeSBhbmQgZmFpbCwgYnV0IGRvbid0IGZhaWwgdG8gdHJ5LiINCiJFcGljdGV0dXMiLCJGaXJzdCBzYXkgdG8geW91cnNlbGYgd2hhdCB5b3Ugd291bGQgYmU7IGFuZCB0aGVuIGRvIHdoYXQgeW91IGhhdmUgdG8gZG8uIg0KIkNhcmwgSnVuZyIsIlRocm91Z2ggcHJpZGUgd2UgYXJlIGV2ZXIgZGVjZWl2aW5nIG91cnNlbHZlcy4gQnV0IGRlZXAgZG93biBiZWxvdyB0aGUgc3VyZmFjZSBvZiB0aGUgYXZlcmFnZSBjb25zY2llbmNlIGEgc3RpbGwsIHNtYWxsIHZvaWNlIHNheXMgdG8gdXMsIFNvbWV0aGluZyBpcyBvdXQgb2YgdHVuZS4iDQoiRXBpY3RldHVzIiwiS2VlcCBzaWxlbmNlIGZvciB0aGUgbW9zdCBwYXJ0LCBhbmQgc3BlYWsgb25seSB3aGVuIHlvdSBtdXN0LCBhbmQgdGhlbiBicmllZmx5LiINCiJQZXJjeSBTaGVsbGV5IiwiRmVhciBub3QgZm9yIHRoZSBmdXR1cmUsIHdlZXAgbm90IGZvciB0aGUgcGFzdC4iDQoiV2F5bmUgRHllciIsIldlIGFyZSBEaXZpbmUgZW5vdWdoIHRvIGFzayBhbmQgd2UgYXJlIGltcG9ydGFudCBlbm91Z2ggdG8gcmVjZWl2ZS4iDQoiS29yZWFuIHByb3ZlcmIiLCJJZiB5b3Uga2ljayBhIHN0b25lIGluIGFuZ2VyLCB5b3UnbGwgaHVydCB5b3VyIG93biBmb290LiINCiJMYW8gVHp1IiwiVG8gc2VlIHRoaW5ncyBpbiB0aGUgc2VlZCwgdGhhdCBpcyBnZW5pdXMuIg0KIkJlcnRyYW5kIFJ1c3NlbGwiLCJUaGUgaGFwcGluZXNzIHRoYXQgaXMgZ2VudWluZWx5IHNhdGlzZnlpbmcgaXMgYWNjb21wYW5pZWQgYnkgdGhlIGZ1bGxlc3QgZXhlcmNpc2Ugb2Ygb3VyIGZhY3VsdGllcyBhbmQgdGhlIGZ1bGxlc3QgcmVhbGl6YXRpb24gb2YgdGhlIHdvcmxkIGluIHdoaWNoIHdlIGxpdmUuIg0KIkRvdWdsYXMgQWRhbXMiLCJIdW1hbiBiZWluZ3MsIHdobyBhcmUgYWxtb3N0IHVuaXF1ZSBpbiBoYXZpbmcgdGhlIGFiaWxpdHkgdG8gbGVhcm4gZnJvbSB0aGUgZXhwZXJpZW5jZSBvZiBvdGhlcnMsIGFyZSBhbHNvIHJlbWFya2FibGUgZm9yIHRoZWlyIGFwcGFyZW50IGRpc2luY2xpbmF0aW9uIHRvIGRvIHNvLiINCiJSYWxwaCBFbWVyc29uIiwiTWFrZSB0aGUgbW9zdCBvZiB5b3Vyc2VsZiwgZm9yIHRoYXQgaXMgYWxsIHRoZXJlIGlzIG9mIHlvdS4iDQoiTXVyaWVsIFJ1a2V5c2VyIiwiVGhlIHVuaXZlcnNlIGlzIG1hZGUgb2Ygc3Rvcmllcywgbm90IGF0b21zLiINCiJGcmFuayBXcmlnaHQiLCJSZXNwZWN0IHNob3VsZCBiZSBlYXJuZWQgYnkgYWN0aW9ucywgYW5kIG5vdCBhY3F1aXJlZCBieSB5ZWFycy4iDQoiQ29uZnVjaXVzIiwiSSBoZWFyIGFuZCBJIGZvcmdldC4gSSBzZWUgYW5kIEkgcmVtZW1iZXIuIEkgZG8gYW5kIEkgdW5kZXJzdGFuZC4iDQoiV2lsbCBEdXJhbnQiLCJUaGUgdHJvdWJsZSB3aXRoIG1vc3QgcGVvcGxlIGlzIHRoYXQgdGhleSB0aGluayB3aXRoIHRoZWlyIGhvcGVzIG9yIGZlYXJzIG9yIHdpc2hlcyByYXRoZXIgdGhhbiB3aXRoIHRoZWlyIG1pbmRzLiINCiJDaHVjayBOb3JyaXMiLCJBIGxvdCBvZiBwZW9wbGUgZ2l2ZSB1cCBqdXN0IGJlZm9yZSB0aGV5cmUgYWJvdXQgdG8gbWFrZSBpdC4gWW91IGtub3cgeW91IG5ldmVyIGtub3cgd2hlbiB0aGF0IG5leHQgb2JzdGFjbGUgaXMgZ29pbmcgdG8gYmUgdGhlIGxhc3Qgb25lLiINCiJMYXVyZW4gUmFmZm8iLCJTb21ldGltZXMgdGhlIGJpZ2dlc3QgYWN0IG9mIGNvdXJhZ2UgaXMgYSBzbWFsbCBvbmUuIg0KIlRvbnkgUm9iYmlucyIsIlBlb3BsZSBhcmUgbm90IGxhenkuIFRoZXkgc2ltcGx5IGhhdmUgaW1wb3RlbnQgZ29hbHMsIHRoYXQgaXMsIGdvYWxzIHRoYXQgZG8gbm90IGluc3BpcmUgdGhlbS4iDQoiRWNraGFydCBUb2xsZSIsIllvdSBkbyBub3QgYmVjb21lIGdvb2QgYnkgdHJ5aW5nIHRvIGJlIGdvb2QsIGJ1dCBieSBmaW5kaW5nIHRoZSBnb29kbmVzcyB0aGF0IGlzIGFscmVhZHkgd2l0aGluIHlvdS4iDQoiTWFyY3VzIEF1cmVsaXVzIiwiV2FzdGUgbm8gbW9yZSB0aW1lIGFyZ3VpbmcgYWJvdXQgd2hhdCBhIGdvb2QgbWFuIHNob3VsZCBiZS4gQmUgb25lLiINCiJKb2huIEJhcnJ5bW9yZSIsIkhhcHBpbmVzcyBvZnRlbiBzbmVha3MgaW4gdGhyb3VnaCBhIGRvb3IgeW91IGRpZG4ndCBrbm93IHlvdSBsZWZ0IG9wZW4uIg0KIk1hcmsgVHdhaW4iLCJUaGVyZSBhcmUgYmFzaWNhbGx5IHR3byB0eXBlcyBvZiBwZW9wbGUuIFBlb3BsZSB3aG8gYWNjb21wbGlzaCB0aGluZ3MsIGFuZCBwZW9wbGUgd2hvIGNsYWltIHRvIGhhdmUgYWNjb21wbGlzaGVkIHRoaW5ncy4gVGhlIGZpcnN0IGdyb3VwIGlzIGxlc3MgY3Jvd2RlZC4iDQoiV2luaWZyZWQgSG9sdGJ5IiwiVGhlIHRoaW5ncyB0aGF0IG9uZSBtb3N0IHdhbnRzIHRvIGRvIGFyZSB0aGUgdGhpbmdzIHRoYXQgYXJlIHByb2JhYmx5IG1vc3Qgd29ydGggZG9pbmcuIg0KIkFicmFoYW0gTGluY29sbiIsIkFsd2F5cyBiZWFyIGluIG1pbmQgdGhhdCB5b3VyIG93biByZXNvbHV0aW9uIHRvIHN1Y2NlZWQgaXMgbW9yZSBpbXBvcnRhbnQgdGhhbiBhbnkgb25lIHRoaW5nLiINCiJBbGJlcnQgRWluc3RlaW4iLCJTZXR0aW5nIGFuIGV4YW1wbGUgaXMgbm90IHRoZSBtYWluIG1lYW5zIG9mIGluZmx1ZW5jaW5nIGFub3RoZXIsIGl0IGlzIHRoZSBvbmx5IG1lYW5zLiINCiJSaWNoYXJkIEdhcnJpb3R0IiwiQ2hhb3MgYW5kIE9yZGVyIGFyZSBub3QgZW5lbWllcywgb25seSBvcHBvc2l0ZXMuIg0KIkhlbnJ5IExvbmdmZWxsb3ciLCJQZXJzZXZlcmFuY2UgaXMgYSBncmVhdCBlbGVtZW50IG9mIHN1Y2Nlc3MuIElmIHlvdSBvbmx5IGtub2NrIGxvbmcgZW5vdWdoIGFuZCBsb3VkIGVub3VnaCBhdCB0aGUgZ2F0ZSwgeW91IGFyZSBzdXJlIHRvIHdha2UgdXAgc29tZWJvZHkuIg0KIkhhcnJpZXQgTGVybmVyIiwiT25seSB0aHJvdWdoIG91ciBjb25uZWN0ZWRuZXNzIHRvIG90aGVycyBjYW4gd2UgcmVhbGx5IGtub3cgYW5kIGVuaGFuY2UgdGhlIHNlbGYuIEFuZCBvbmx5IHRocm91Z2ggd29ya2luZyBvbiB0aGUgc2VsZiBjYW4gd2UgYmVnaW4gdG8gZW5oYW5jZSBvdXIgY29ubmVjdGVkbmVzcyB0byBvdGhlcnMuIg0KIkNoaW5lc2UgcHJvdmVyYiIsIkhlIHdobyBkZWxpYmVyYXRlcyBmdWxseSBiZWZvcmUgdGFraW5nIGEgc3RlcCB3aWxsIHNwZW5kIGhpcyBlbnRpcmUgbGlmZSBvbiBvbmUgbGVnLiINCiJNb3RoZXIgVGVyZXNhIiwiUGVhY2UgYmVnaW5zIHdpdGggYSBzbWlsZS4iDQoiRG91ZyBIb3J0b24iLCJCZSB5b3VyIG93biBoZXJvLCBpdCdzIGNoZWFwZXIgdGhhbiBhIG1vdmllIHRpY2tldC4iDQoiTWFvcmkgcHJvdmVyYiIsIlR1cm4geW91ciBmYWNlIHRvd2FyZCB0aGUgc3VuIGFuZCB0aGUgc2hhZG93cyB3aWxsIGZhbGwgYmVoaW5kIHlvdS4iDQoiSmFjayBCdWNrIiwiVGhpbmdzIHR1cm4gb3V0IGJlc3QgZm9yIHRob3NlIHdobyBtYWtlIHRoZSBiZXN0IG9mIHRoZSB3YXkgdGhpbmdzIHR1cm4gb3V0LiINCiJXaG9vcGkgR29sZGJlcmciLCJXZXJlIGhlcmUgZm9yIGEgcmVhc29uLiBJIGJlbGlldmUgYSBiaXQgb2YgdGhlIHJlYXNvbiBpcyB0byB0aHJvdyBsaXR0bGUgdG9yY2hlcyBvdXQgdG8gbGVhZCBwZW9wbGUgdGhyb3VnaCB0aGUgZGFyay4iDQoiQW50aG9ueSBSb2JiaW5zIiwiVG8gZWZmZWN0aXZlbHkgY29tbXVuaWNhdGUsIHdlIG11c3QgcmVhbGl6ZSB0aGF0IHdlIGFyZSBhbGwgZGlmZmVyZW50IGluIHRoZSB3YXkgd2UgcGVyY2VpdmUgdGhlIHdvcmxkIGFuZCB1c2UgdGhpcyB1bmRlcnN0YW5kaW5nIGFzIGEgZ3VpZGUgdG8gb3VyIGNvbW11bmljYXRpb24gd2l0aCBvdGhlcnMuIg0KIkNvbmZ1Y2l1cyIsIkFiaWxpdHkgd2lsbCBuZXZlciBjYXRjaCB1cCB3aXRoIHRoZSBkZW1hbmQgZm9yIGl0LiINCiJBbGJlcnQgU2Nod2VpdHplciIsIk5ldmVyIHNheSB0aGVyZSBpcyBub3RoaW5nIGJlYXV0aWZ1bCBpbiB0aGUgd29ybGQgYW55IG1vcmUuIFRoZXJlIGlzIGFsd2F5cyBzb21ldGhpbmcgdG8gbWFrZSB5b3Ugd29uZGVyIGluIHRoZSBzaGFwZSBvZiBhIHRyZWUsIHRoZSB0cmVtYmxpbmcgb2YgYSBsZWFmLiINCiJIZW5yeSBSZWVkIiwiSW50dWl0aW9uIGlzIHRoZSB2ZXJ5IGZvcmNlIG9yIGFjdGl2aXR5IG9mIHRoZSBzb3VsIGluIGl0cyBleHBlcmllbmNlIHRocm91Z2ggd2hhdGV2ZXIgaGFzIGJlZW4gdGhlIGV4cGVyaWVuY2Ugb2YgdGhlIHNvdWwgaXRzZWxmLiINCiJUb255IFJvYmJpbnMiLCJTZXR0aW5nIGdvYWxzIGlzIHRoZSBmaXJzdCBzdGVwIGluIHR1cm5pbmcgdGhlIGludmlzaWJsZSBpbnRvIHRoZSB2aXNpYmxlLiINCiJQYXQgUmlsZXkiLCJDb3VyYWdlIGlzIG5vdCB0aGUgYWJzZW5jZSBvZiBmZWFyLCBidXQgc2ltcGx5IG1vdmluZyBvbiB3aXRoIGRpZ25pdHkgZGVzcGl0ZSB0aGF0IGZlYXIuIg0KIkdhbGlsZW8gR2FsaWxlaSIsIkFsbCB0cnV0aHMgYXJlIGVhc3kgdG8gdW5kZXJzdGFuZCBvbmNlIHRoZXkgYXJlIGRpc2NvdmVyZWQ7IHRoZSBwb2ludCBpcyB0byBkaXNjb3ZlciB0aGVtLiINCiJPc2NhciBXaWxkZSIsIlRoZSBzbWFsbGVzdCBhY3Qgb2Yga2luZG5lc3MgaXMgd29ydGggbW9yZSB0aGFuIHRoZSBncmFuZGVzdCBpbnRlbnRpb24uIg0KIk1hcmdhcmV0IFdoZWF0bGV5IiwiV2Uga25vdyBmcm9tIHNjaWVuY2UgdGhhdCBub3RoaW5nIGluIHRoZSB1bml2ZXJzZSBleGlzdHMgYXMgYW4gaXNvbGF0ZWQgb3IgaW5kZXBlbmRlbnQgZW50aXR5LiINCiJSYWxwaCBFbWVyc29uIiwiRXZlcnl0aGluZyBpbiB0aGUgdW5pdmVyc2UgZ29lcyBieSBpbmRpcmVjdGlvbi4gVGhlcmUgYXJlIG5vIHN0cmFpZ2h0IGxpbmVzLiINCiJHZW9yZ2UgRWxpb3QiLCJXaGF0IGRvIHdlIGxpdmUgZm9yLCBpZiBpdCBpcyBub3QgdG8gbWFrZSBsaWZlIGxlc3MgZGlmZmljdWx0IGZvciBlYWNoIG90aGVyPyINCiJUZW56aW4gR3lhdHNvIiwiV2hlbiB3ZSBmZWVsIGxvdmUgYW5kIGtpbmRuZXNzIHRvd2FyZCBvdGhlcnMsIGl0IG5vdCBvbmx5IG1ha2VzIG90aGVycyBmZWVsIGxvdmVkIGFuZCBjYXJlZCBmb3IsIGJ1dCBpdCBoZWxwcyB1cyBhbHNvIHRvIGRldmVsb3AgaW5uZXIgaGFwcGluZXNzIGFuZCBwZWFjZS4iDQoiTWF5YSBBbmdlbG91IiwiV2UgbWF5IGVuY291bnRlciBtYW55IGRlZmVhdHMgYnV0IHdlIG11c3Qgbm90IGJlIGRlZmVhdGVkLiINCiJSaWNoYXJkIEJhY2giLCJFdmVyeSBwZXJzb24sIGFsbCB0aGUgZXZlbnRzIG9mIHlvdXIgbGlmZSBhcmUgdGhlcmUgYmVjYXVzZSB5b3UgaGF2ZSBkcmF3biB0aGVtIHRoZXJlLiBXaGF0IHlvdSBjaG9vc2UgdG8gZG8gd2l0aCB0aGVtIGlzIHVwIHRvIHlvdS4iDQoiQWxiZXJ0IEVpbnN0ZWluIiwiTG9naWMgd2lsbCBnZXQgeW91IGZyb20gQSB0byBCLiBJbWFnaW5hdGlvbiB3aWxsIHRha2UgeW91IGV2ZXJ5d2hlcmUuIg0KIlNhcmFoIEJyZWF0aG5hY2giLCJPdXIgZGVlcGVzdCB3aXNoZXMgYXJlIHdoaXNwZXJzIG9mIG91ciBhdXRoZW50aWMgc2VsdmVzLiBXZSBtdXN0IGxlYXJuIHRvIHJlc3BlY3QgdGhlbS4gV2UgbXVzdCBsZWFybiB0byBsaXN0ZW4uIg0KIkhlbnJ5IFRob3JlYXUiLCJUaGUgd29ybGQgaXMgYnV0IGEgY2FudmFzIHRvIHRoZSBpbWFnaW5hdGlvbi4iDQoiTGlzYSBBbHRoZXIiLCJUaGF0cyB0aGUgcmlzayB5b3UgdGFrZSBpZiB5b3UgY2hhbmdlOiB0aGF0IHBlb3BsZSB5b3UndmUgYmVlbiBpbnZvbHZlZCB3aXRoIHdvbid0IGxpa2UgdGhlIG5ldyB5b3UuIEJ1dCBvdGhlciBwZW9wbGUgd2hvIGRvIHdpbGwgY29tZSBhbG9uZy4iDQoiV2FsdGVyIEJlbmphbWluIiwiVG8gYmUgaGFwcHkgaXMgdG8gYmUgYWJsZSB0byBiZWNvbWUgYXdhcmUgb2Ygb25lc2VsZiB3aXRob3V0IGZyaWdodC4iDQoiQnlyb24gUHVsc2lmZXIiLCJTdHJlbmd0aCB0byBjYXJyeSBvbiBkZXNwaXRlIHRoZSBvZGRzIG1lYW5zIHlvdSBoYXZlIGZhaXRoIGluIHlvdXIgb3duIGFiaWxpdGllcyBhbmQga25vdyBob3cuIg0KIlJhbHBoIEVtZXJzb24iLCJNYWtlIHRoZSBtb3N0IG9mIHlvdXJzZWxmIGZvciB0aGF0IGlzIGFsbCB0aGVyZSBpcyBvZiB5b3UuIg0KIkxhbWEgWWVzaGUiLCJCZSBnZW50bGUgZmlyc3Qgd2l0aCB5b3Vyc2VsZiBpZiB5b3Ugd2lzaCB0byBiZSBnZW50bGUgd2l0aCBvdGhlcnMuIg0KIkNhcmRpbmFsIFJldHoiLCJBIG1hbiB3aG8gZG9lc24ndCB0cnVzdCBoaW1zZWxmIGNhbiBuZXZlciByZWFsbHkgdHJ1c3QgYW55b25lIGVsc2UuIg0KIkJlbmphbWluIERpc3JhZWxpIiwiV2UgbWFrZSBvdXIgb3duIGZvcnR1bmVzIGFuZCB3ZSBjYWxsIHRoZW0gZmF0ZS4iDQoiVmluY2UgTG9tYmFyZGkiLCJMZWFkZXJzIGFyZW4ndCBib3JuIHRoZXkgYXJlIG1hZGUuIEFuZCB0aGV5IGFyZSBtYWRlIGp1c3QgbGlrZSBhbnl0aGluZyBlbHNlLCB0aHJvdWdoIGhhcmQgd29yay4gQW5kIHRoYXQncyB0aGUgcHJpY2Ugd2VsbCBoYXZlIHRvIHBheSB0byBhY2hpZXZlIHRoYXQgZ29hbCwgb3IgYW55IGdvYWwuIg0KIkUuIEUuIEN1bW1pbmdzIiwiSXQgdGFrZXMgY291cmFnZSB0byBncm93IHVwIGFuZCBiZWNvbWUgd2hvIHlvdSByZWFsbHkgYXJlLiINCiJPZyBNYW5kaW5vIiwiQWx3YXlzIHNlZWsgb3V0IHRoZSBzZWVkIG9mIHRyaXVtcGggaW4gZXZlcnkgYWR2ZXJzaXR5LiINCiJDYXRoZXJpbmUgUHVsc2lmZXIiLCJSYXRoZXIgdGhhbiB3aXNoaW5nIGZvciBjaGFuZ2UsIHlvdSBmaXJzdCBtdXN0IGJlIHByZXBhcmVkIHRvIGNoYW5nZS4iDQoiQnVkZGhhIiwiSSBkbyBub3QgYmVsaWV2ZSBpbiBhIGZhdGUgdGhhdCBmYWxscyBvbiBtZW4gaG93ZXZlciB0aGV5IGFjdDsgYnV0IEkgZG8gYmVsaWV2ZSBpbiBhIGZhdGUgdGhhdCBmYWxscyBvbiB0aGVtIHVubGVzcyB0aGV5IGFjdC4iDQoiSG9sbWVzIiwiRmFtZSB1c3VhbGx5IGNvbWVzIHRvIHRob3NlIHdobyBhcmUgdGhpbmtpbmcgYWJvdXQgc29tZXRoaW5nIGVsc2UuIg0KIk5hcG9sZW9uIEhpbGwiLCJGaXJzdCBjb21lcyB0aG91Z2h0OyB0aGVuIG9yZ2FuaXphdGlvbiBvZiB0aGF0IHRob3VnaHQsIGludG8gaWRlYXMgYW5kIHBsYW5zOyB0aGVuIHRyYW5zZm9ybWF0aW9uIG9mIHRob3NlIHBsYW5zIGludG8gcmVhbGl0eS4gVGhlIGJlZ2lubmluZywgYXMgeW91IHdpbGwgb2JzZXJ2ZSwgaXMgaW4geW91ciBpbWFnaW5hdGlvbi4iDQoiQ29uZnVjaXVzIiwiVGhlIHN1cGVyaW9yIG1hbiBhY3RzIGJlZm9yZSBoZSBzcGVha3MsIGFuZCBhZnRlcndhcmRzIHNwZWFrcyBhY2NvcmRpbmcgdG8gaGlzIGFjdGlvbi4iDQoiQ2hpbmVzZSBwcm92ZXJiIiwiQSBzaW5nbGUgY29udmVyc2F0aW9uIGFjcm9zcyB0aGUgdGFibGUgd2l0aCBhIHdpc2UgcGVyc29uIGlzIHdvcnRoIGEgbW9udGhzIHN0dWR5IG9mIGJvb2tzLiINCiJNb2hhbmRhcyBHYW5kaGkiLCJUaGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHdoYXQgd2UgZG8gYW5kIHdoYXQgd2UgYXJlIGNhcGFibGUgb2YgZG9pbmcgd291bGQgc3VmZmljZSB0byBzb2x2ZSBtb3N0IG9mIHRoZSB3b3JsZHMgcHJvYmxlbXMuIg0KIiIsIllvdSBjYW4gbmV2ZXIgY3Jvc3MgdGhlIG9jZWFuIHVubGVzcyB5b3UgaGF2ZSB0aGUgY291cmFnZSB0byBsb3NlIHNpZ2h0IG9mIHRoZSBzaG9yZS4iDQoiVmFjbGF2IEhhdmVsIiwiV29yayBmb3Igc29tZXRoaW5nIGJlY2F1c2UgaXQgaXMgZ29vZCwgbm90IGp1c3QgYmVjYXVzZSBpdCBzdGFuZHMgYSBjaGFuY2UgdG8gc3VjY2VlZC4iDQoiQ2FybCBKdW5nIiwiS25vd2xlZGdlIHJlc3RzIG5vdCB1cG9uIHRydXRoIGFsb25lLCBidXQgdXBvbiBlcnJvciBhbHNvLiINCiJLYXRoZXJpbmUgTWFuc2ZpZWxkIiwiTWFrZSBpdCBhIHJ1bGUgb2YgbGlmZSBuZXZlciB0byByZWdyZXQgYW5kIG5ldmVyIHRvIGxvb2sgYmFjay4gUmVncmV0IGlzIGFuIGFwcGFsbGluZyB3YXN0ZSBvZiBlbmVyZ3k7IHlvdSBjYW4ndCBidWlsZCBvbiBpdDsgaXQncyBvbmx5IGZvciB3YWxsb3dpbmcgaW4uIg0KIlZpY3RvcmlhIEhvbHQiLCJOZXZlciByZWdyZXQuIElmIGl0J3MgZ29vZCwgaXQncyB3b25kZXJmdWwuIElmIGl0J3MgYmFkLCBpdCdzIGV4cGVyaWVuY2UuIg0KIkNodWFuZyBUenUiLCJXaGVuIGRlZWRzIGFuZCB3b3JkcyBhcmUgaW4gYWNjb3JkLCB0aGUgd2hvbGUgd29ybGQgaXMgdHJhbnNmb3JtZWQuIg0KIk1vdGhlciBUZXJlc2EiLCJLaW5kIHdvcmRzIGNhbiBiZSBzaG9ydCBhbmQgZWFzeSB0byBzcGVhayBidXQgdGhlaXIgZWNob2VzIGFyZSB0cnVseSBlbmRsZXNzLiINCiJXaWxsaWFtIEJsYWtlIiwiRm9yIGV2ZXJ5dGhpbmcgdGhhdCBsaXZlcyBpcyBob2x5LCBsaWZlIGRlbGlnaHRzIGluIGxpZmUuIg0KIkRhbGFpIExhbWEiLCJUaGUgbW9zdCBpbXBvcnRhbnQgdGhpbmcgaXMgdHJhbnNmb3JtaW5nIG91ciBtaW5kcywgZm9yIGEgbmV3IHdheSBvZiB0aGlua2luZywgYSBuZXcgb3V0bG9vazogd2Ugc2hvdWxkIHN0cml2ZSB0byBkZXZlbG9wIGEgbmV3IGlubmVyIHdvcmxkLiINCiJCaWxsaWUgQXJtc3Ryb25nIiwiT3VyIHBhc3Npb24gaXMgb3VyIHN0cmVuZ3RoLiINCiJMZW9uYXJkbyBkYSBWaW5jaSIsIkluIHJpdmVycywgdGhlIHdhdGVyIHRoYXQgeW91IHRvdWNoIGlzIHRoZSBsYXN0IG9mIHdoYXQgaGFzIHBhc3NlZCBhbmQgdGhlIGZpcnN0IG9mIHRoYXQgd2hpY2ggY29tZXM7IHNvIHdpdGggcHJlc2VudCB0aW1lLiINCiJCeXJvbiBQdWxzaWZlciIsIlNwcmluZyBpcyBhIHRpbWUgZm9yIHJlYmlydGggYW5kIHRoZSBmdWxmaWxtZW50IG9mIG5ldyBsaWZlLiINCiJNYXJjdXMgQXVyZWxpdXMiLCJUaGVyZSBpcyBub3RoaW5nIGhhcHBlbnMgdG8gYW55IHBlcnNvbiBidXQgd2hhdCB3YXMgaW4gaGlzIHBvd2VyIHRvIGdvIHRocm91Z2ggd2l0aC4iDQoiQWxmcmVkIEtvcnp5YnNraSIsIlRoZXJlIGFyZSB0d28gd2F5cyB0byBzbGlkZSBlYXNpbHkgdGhyb3VnaCBsaWZlOiB0byBiZWxpZXZlIGV2ZXJ5dGhpbmcgb3IgdG8gZG91YnQgZXZlcnl0aGluZzsgYm90aCB3YXlzIHNhdmUgdXMgZnJvbSB0aGlua2luZy4iDQoiQWxmcmVkIFdoaXRlaGVhZCIsIlRoZSBhcnQgb2YgcHJvZ3Jlc3MgaXMgdG8gcHJlc2VydmUgb3JkZXIgYW1pZCBjaGFuZ2UsIGFuZCB0byBwcmVzZXJ2ZSBjaGFuZ2UgYW1pZCBvcmRlci4iDQoiV2luc3RvbiBDaHVyY2hpbGwiLCJXZSBtYWtlIGEgbGl2aW5nIGJ5IHdoYXQgd2UgZ2V0LCBidXQgd2UgbWFrZSBhIGxpZmUgYnkgd2hhdCB3ZSBnaXZlLiINCiJGcmllZHJpY2ggdm9uIFNjaGlsbGVyIiwiSWYgeW91IHdhbnQgdG8gc3R1ZHkgeW91cnNlbGYsIGxvb2sgaW50byB0aGUgaGVhcnRzIG9mIG90aGVyIHBlb3BsZS4gSWYgeW91IHdhbnQgdG8gc3R1ZHkgb3RoZXIgcGVvcGxlLCBsb29rIGludG8geW91ciBvd24gaGVhcnQuIg0KIldheW5lIER5ZXIiLCJNYXhpbSBmb3IgbGlmZTogWW91IGdldCB0cmVhdGVkIGluIGxpZmUgdGhlIHdheSB5b3UgdGVhY2ggcGVvcGxlIHRvIHRyZWF0IHlvdS4iDQoiQ2hhcmxvdHRlIFBlcmtpbnMgR2lsbWFuIiwiVGhlIGZpcnN0IGR1dHkgb2YgYSBodW1hbiBiZWluZyBpcyB0byBhc3N1bWUgdGhlIHJpZ2h0IGZ1bmN0aW9uYWwgcmVsYXRpb25zaGlwIHRvIHNvY2lldHksIG1vcmUgYnJpZWZseSwgdG8gZmluZCB5b3VyIHJlYWwgam9iLCBhbmQgZG8gaXQuIg0KIkxhbyBUenUiLCJUaGUga2V5IHRvIGdyb3d0aCBpcyB0aGUgaW50cm9kdWN0aW9uIG9mIGhpZ2hlciBkaW1lbnNpb25zIG9mIGNvbnNjaW91c25lc3MgaW50byBvdXIgYXdhcmVuZXNzLiINCiJSYWxwaCBFbWVyc29uIiwiVGhvdWdodCBpcyB0aGUgYmxvc3NvbTsgbGFuZ3VhZ2UgdGhlIGJ1ZDsgYWN0aW9uIHRoZSBmcnVpdCBiZWhpbmQgaXQuIg0KIkRhaXNha3UgSWtlZGEiLCJUcnVlIGhhcHBpbmVzcyBtZWFucyBmb3JnaW5nIGEgc3Ryb25nIHNwaXJpdCB0aGF0IGlzIHVuZGVmZWF0ZWQsIG5vIG1hdHRlciBob3cgdHJ5aW5nIG91ciBjaXJjdW1zdGFuY2VzLiINCiJQZXRlciBEcnVja2VyIiwiVGhlcmUgaXMgbm90aGluZyBzbyB1c2VsZXNzIGFzIGRvaW5nIGVmZmljaWVudGx5IHRoYXQgd2hpY2ggc2hvdWxkIG5vdCBiZSBkb25lIGF0IGFsbC4iDQoiTGVvbmFyZG8gZGEgVmluY2kiLCJJIGhhdmUgYmVlbiBpbXByZXNzZWQgd2l0aCB0aGUgdXJnZW5jeSBvZiBkb2luZy4gS25vd2luZyBpcyBub3QgZW5vdWdoOyB3ZSBtdXN0IGFwcGx5LiBCZWluZyB3aWxsaW5nIGlzIG5vdCBlbm91Z2g7IHdlIG11c3QgZG8uIg0KIldpbGxpYW0gU2hha2VzcGVhcmUiLCJBbGwgdGhlIHdvcmxkIGlzIGEgc3RhZ2UsIEFuZCBhbGwgdGhlIG1lbiBhbmQgd29tZW4gbWVyZWx5IHBsYXllcnMuVGhleSBoYXZlIHRoZWlyIGV4aXRzIGFuZCBlbnRyYW5jZXM7IEVhY2ggbWFuIGluIGhpcyB0aW1lIHBsYXlzIG1hbnkgcGFydHMuIg0KIk5lbHNvbiBNYW5kZWxhIiwiQXMgd2UgYXJlIGxpYmVyYXRlZCBmcm9tIG91ciBvd24gZmVhciwgb3VyIHByZXNlbmNlIGF1dG9tYXRpY2FsbHkgbGliZXJhdGVzIG90aGVycy4iDQoiSmFtZXMgWW9ya2UiLCJUaGUgbW9zdCBzdWNjZXNzZnVsIHBlb3BsZSBhcmUgdGhvc2Ugd2hvIGFyZSBnb29kIGF0IHBsYW4gQi4iDQoiQXJpc3RvdGxlIiwiQ3JpdGljaXNtIGlzIHNvbWV0aGluZyB5b3UgY2FuIGVhc2lseSBhdm9pZCBieSBzYXlpbmcgbm90aGluZywgZG9pbmcgbm90aGluZywgYW5kIGJlaW5nIG5vdGhpbmcuIg0KIlJpY2hhcmQgQmFjaCIsIlRvIGZseSBhcyBmYXN0IGFzIHRob3VnaHQsIHlvdSBtdXN0IGJlZ2luIGJ5IGtub3dpbmcgdGhhdCB5b3UgaGF2ZSBhbHJlYWR5IGFycml2ZWQuIg0KIkhhbm5haCBNb3JlIiwiT2JzdGFjbGVzIGFyZSB0aG9zZSB0aGluZ3MgeW91IHNlZSB3aGVuIHlvdSB0YWtlIHlvdXIgZXllcyBvZmYgdGhlIGdvYWwuIg0KIk1pY2hlbGFuZ2VsbyIsIlRoZSBncmVhdGVzdCBkYW5nZXIgZm9yIG1vc3Qgb2YgdXMgaXMgbm90IHRoYXQgb3VyIGFpbSBpcyB0b28gaGlnaCBhbmQgd2UgbWlzcyBpdCwgYnV0IHRoYXQgaXQgaXMgdG9vIGxvdyBhbmQgd2UgcmVhY2ggaXQuIg0KIkFsYmVydCBFaW5zdGVpbiIsIkdyZWF0IGlkZWFzIG9mdGVuIHJlY2VpdmUgdmlvbGVudCBvcHBvc2l0aW9uIGZyb20gbWVkaW9jcmUgbWluZHMuIg0KIlRvbnkgUm9iYmlucyIsIldlIGNhbiBjaGFuZ2Ugb3VyIGxpdmVzLiBXZSBjYW4gZG8sIGhhdmUsIGFuZCBiZSBleGFjdGx5IHdoYXQgd2Ugd2lzaC4iDQoiWmlnIFppZ2xhciIsIllvdSBhcmUgdGhlIG9ubHkgcGVyc29uIG9uIGVhcnRoIHdobyBjYW4gdXNlIHlvdXIgYWJpbGl0eS4iDQoiSmVhbiBMYWNvcmRhaXJlIiwiTmVpdGhlciBnZW5pdXMsIGZhbWUsIG5vciBsb3ZlIHNob3cgdGhlIGdyZWF0bmVzcyBvZiB0aGUgc291bC4gT25seSBraW5kbmVzcyBjYW4gZG8gdGhhdC4iDQoiQ2FybCBKdW5nIiwiVGhlIGxlYXN0IG9mIHRoaW5ncyB3aXRoIGEgbWVhbmluZyBpcyB3b3J0aCBtb3JlIGluIGxpZmUgdGhhbiB0aGUgZ3JlYXRlc3Qgb2YgdGhpbmdzIHdpdGhvdXQgaXQuIg0KIklzb2NyYXRlcyIsIlRoZSBub2JsZXN0IHdvcnNoaXAgaXMgdG8gbWFrZSB5b3Vyc2VsZiBhcyBnb29kIGFuZCBhcyBqdXN0IGFzIHlvdSBjYW4uIg0KIkNhcmwgQmFyZCIsIlRob3VnaCBubyBvbmUgY2FuIGdvIGJhY2sgYW5kIG1ha2UgYSBicmFuZCBuZXcgc3RhcnQsIGFueW9uZSBjYW4gc3RhcnQgZnJvbSBub3QgYW5kIG1ha2UgYSBicmFuZCBuZXcgZW5kaW5nLiINCiJEZW5pcyBXYWl0bGV5IiwiQSBkcmVhbSBpcyB5b3VyIGNyZWF0aXZlIHZpc2lvbiBmb3IgeW91ciBsaWZlIGluIHRoZSBmdXR1cmUuIFlvdSBtdXN0IGJyZWFrIG91dCBvZiB5b3VyIGN1cnJlbnQgY29tZm9ydCB6b25lIGFuZCBiZWNvbWUgY29tZm9ydGFibGUgd2l0aCB0aGUgdW5mYW1pbGlhciBhbmQgdGhlIHVua25vd24uIg0KIlJvYmVydCBPcmJlbiIsIkRvbid0IHRoaW5rIG9mIGl0IGFzIGZhaWx1cmUuIFRoaW5rIG9mIGl0IGFzIHRpbWUtcmVsZWFzZWQgc3VjY2Vzcy4iDQoiQXJpc3RvdGxlIiwiV2UgYXJlIHdoYXQgd2UgcmVwZWF0ZWRseSBkby4gRXhjZWxsZW5jZSwgdGhlbiwgaXMgbm90IGFuIGFjdCBidXQgYSBoYWJpdC4iDQoiQWJyYWhhbSBMaW5jb2xuIiwiSSB3YWxrIHNsb3dseSwgYnV0IEkgbmV2ZXIgd2FsayBiYWNrd2FyZC4iDQoiUmVuZSBEZXNjYXJ0ZXMiLCJEaXZpZGUgZWFjaCBkaWZmaWN1bHR5IGludG8gYXMgbWFueSBwYXJ0cyBhcyBpcyBmZWFzaWJsZSBhbmQgbmVjZXNzYXJ5IHRvIHJlc29sdmUgaXQuIg0KIiIsIlRoZSBiZXN0IHBsYWNlIHRvIGZpbmQgYSBoZWxwaW5nIGhhbmQgaXMgYXQgdGhlIGVuZCBvZiB5b3VyIG93biBhcm0uIg0KIkJsYWlzZSBQYXNjYWwiLCJXZSBrbm93IHRoZSB0cnV0aCwgbm90IG9ubHkgYnkgdGhlIHJlYXNvbiwgYnV0IGJ5IHRoZSBoZWFydC4iDQoiS2FobGlsIEdpYnJhbiIsIldlIGNob29zZSBvdXIgam95cyBhbmQgc29ycm93cyBsb25nIGJlZm9yZSB3ZSBleHBlcmllbmNlIHRoZW0uIg0KIk9zY2FyIFdpbGRlIiwiQW55Ym9keSBjYW4gbWFrZSBoaXN0b3J5LiBPbmx5IGEgZ3JlYXQgbWFuIGNhbiB3cml0ZSBpdC4iDQoiSGVybWFubiBIZXNzZSIsIklmIEkga25vdyB3aGF0IGxvdmUgaXMsIGl0IGlzIGJlY2F1c2Ugb2YgeW91LiINCiJSaWNoYXJkIEJhY2giLCJBbGxvdyB0aGUgd29ybGQgdG8gbGl2ZSBhcyBpdCBjaG9vc2VzLCBhbmQgYWxsb3cgeW91cnNlbGYgdG8gbGl2ZSBhcyB5b3UgY2hvb3NlLiINCiJCYXJhY2sgT2JhbWEiLCJGb2N1c2luZyB5b3VyIGxpZmUgc29sZWx5IG9uIG1ha2luZyBhIGJ1Y2sgc2hvd3MgYSBwb3ZlcnR5IG9mIGFtYml0aW9uLiBJdCBhc2tzIHRvbyBsaXR0bGUgb2YgeW91cnNlbGYuIEFuZCBpdCB3aWxsIGxlYXZlIHlvdSB1bmZ1bGZpbGxlZC4iDQoiRGFsYWkgTGFtYSIsIkNvbXBhc3Npb24gYW5kIGhhcHBpbmVzcyBhcmUgbm90IGEgc2lnbiBvZiB3ZWFrbmVzcyBidXQgYSBzaWduIG9mIHN0cmVuZ3RoLiINCiJGcmFua2xpbiBELiBSb29zZXZlbHQiLCJJdCBpcyBjb21tb24gc2Vuc2UgdG8gdGFrZSBhIG1ldGhvZCBhbmQgdHJ5IGl0LiBJZiBpdCBmYWlscywgYWRtaXQgaXQgZnJhbmtseSBhbmQgdHJ5IGFub3RoZXIuIEJ1dCBhYm92ZSBhbGwsIHRyeSBzb21ldGhpbmcuIg0KIkRhdmlkIEJhZGVyIiwiQmUgaGVyZSBub3cuIEJlIHNvbWVwbGFjZSBlbHNlIGxhdGVyLiBJcyB0aGF0IHNvIGNvbXBsaWNhdGVkPyINCiJNYWh1bW1hZCBBbGkiLCJUbyBiZSBhYmxlIHRvIGdpdmUgYXdheSByaWNoZXMgaXMgbWFuZGF0b3J5IGlmIHlvdSB3aXNoIHRvIHBvc3Nlc3MgdGhlbS4gVGhpcyBpcyB0aGUgb25seSB3YXkgdGhhdCB5b3Ugd2lsbCBiZSB0cnVseSByaWNoLiINCiJDb25mdWNpdXMiLCJMZWFybmluZyB3aXRob3V0IHJlZmxlY3Rpb24gaXMgYSB3YXN0ZSwgcmVmbGVjdGlvbiB3aXRob3V0IGxlYXJuaW5nIGlzIGRhbmdlcm91cy4iDQoiIiwiRG9uJ3QgZmVhciBmYWlsdXJlIHNvIG11Y2ggdGhhdCB5b3UgcmVmdXNlIHRvIHRyeSBuZXcgdGhpbmdzLiBUaGUgc2FkZGVzdCBzdW1tYXJ5IG9mIGxpZmUgY29udGFpbnMgdGhyZWUgZGVzY3JpcHRpb25zOiBjb3VsZCBoYXZlLCBtaWdodCBoYXZlLCBhbmQgc2hvdWxkIGhhdmUuIg0KIkJydWNlIExlZSIsIkFsbCBmaXhlZCBzZXQgcGF0dGVybnMgYXJlIGluY2FwYWJsZSBvZiBhZGFwdGFiaWxpdHkgb3IgcGxpYWJpbGl0eS4gVGhlIHRydXRoIGlzIG91dHNpZGUgb2YgYWxsIGZpeGVkIHBhdHRlcm5zLiINCiJPcHJhaCBXaW5mcmV5IiwiSSBkb24ndCBiZWxpZXZlIGluIGZhaWx1cmUuIEl0J3Mgbm90IGZhaWx1cmUgaWYgeW91IGVuam95ZWQgdGhlIHByb2Nlc3MuIg0KIkhlbGVuIEtlbGxlciIsIlRoZSBiZXN0IGFuZCBtb3N0IGJlYXV0aWZ1bCB0aGluZ3MgaW4gdGhlIHdvcmxkIGNhbm5vdCBiZSBzZWVuLCBub3IgdG91Y2hlZC4uLiBidXQgYXJlIGZlbHQgaW4gdGhlIGhlYXJ0LiINCiJEYXZpZCBSb2NrZWZlbGxlciIsIlN1Y2Nlc3MgaW4gYnVzaW5lc3MgcmVxdWlyZXMgdHJhaW5pbmcgYW5kIGRpc2NpcGxpbmUgYW5kIGhhcmQgd29yay4gQnV0IGlmIHlvdSdyZSBub3QgZnJpZ2h0ZW5lZCBieSB0aGVzZSB0aGluZ3MsIHRoZSBvcHBvcnR1bml0aWVzIGFyZSBqdXN0IGFzIGdyZWF0IHRvZGF5IGFzIHRoZXkgZXZlciB3ZXJlLiINCiJDYXZvdXIiLCJUaGUgbWFuIHdobyB0cnVzdHMgbWVuIHdpbGwgbWFrZSBmZXdlciBtaXN0YWtlcyB0aGFuIGhlIHdobyBkaXN0cnVzdHMgdGhlbS4iDQoiQnJ1Y2UgTGVlIiwiVGhlIGxlc3MgZWZmb3J0LCB0aGUgZmFzdGVyIGFuZCBtb3JlIHBvd2VyZnVsIHlvdSB3aWxsIGJlLiINCiJSYWxwaCBFbWVyc29uIiwiV2UgbXVzdCBiZSBhcyBjb3VydGVvdXMgdG8gYSBtYW4gYXMgd2UgYXJlIHRvIGEgcGljdHVyZSwgd2hpY2ggd2UgYXJlIHdpbGxpbmcgdG8gZ2l2ZSB0aGUgYWR2YW50YWdlIG9mIGEgZ29vZCBsaWdodC4iDQoiQW5haXMgTmluIiwiVGhlIGRyZWFtIHdhcyBhbHdheXMgcnVubmluZyBhaGVhZCBvZiBtZS4gVG8gY2F0Y2ggdXAsIHRvIGxpdmUgZm9yIGEgbW9tZW50IGluIHVuaXNvbiB3aXRoIGl0LCB0aGF0IHdhcyB0aGUgbWlyYWNsZS4iDQoiRWxsZW4gUGFyciIsIlRoZSBjdXJlIGZvciBib3JlZG9tIGlzIGN1cmlvc2l0eS4gVGhlcmUgaXMgbm8gY3VyZSBmb3IgY3VyaW9zaXR5LiINCiJNb3RoZXIgVGVyZXNhIiwiV2UgY2FuIGRvIG5vIGdyZWF0IHRoaW5ncywgb25seSBzbWFsbCB0aGluZ3Mgd2l0aCBncmVhdCBsb3ZlLiINCiJLYWhsaWwgR2licmFuIiwiQmUgbGlrZSB0aGUgZmxvd2VyLCB0dXJuIHlvdXIgZmFjZSB0byB0aGUgc3VuLiINCiJCdWRkaGEiLCJSZW1lbWJlcmluZyBhIHdyb25nIGlzIGxpa2UgY2FycnlpbmcgYSBidXJkZW4gb24gdGhlIG1pbmQuIg0KIkphbWVzIE9wZW5oZWltIiwiVGhlIGZvb2xpc2ggbWFuIHNlZWtzIGhhcHBpbmVzcyBpbiB0aGUgZGlzdGFuY2U7IHRoZSB3aXNlIGdyb3dzIGl0IHVuZGVyIGhpcyBmZWV0LiINCiJIZW5yeSBCZWVjaGVyIiwiR3JhdGl0dWRlIGlzIHRoZSBmYWlyZXN0IGJsb3Nzb20gd2hpY2ggc3ByaW5ncyBmcm9tIHRoZSBzb3VsLiINCiJDb25mdWNpdXMiLCJJZiB5b3UgbG9vayBpbnRvIHlvdXIgb3duIGhlYXJ0LCBhbmQgeW91IGZpbmQgbm90aGluZyB3cm9uZyB0aGVyZSwgd2hhdCBpcyB0aGVyZSB0byB3b3JyeSBhYm91dD8gV2hhdCBpcyB0aGVyZSB0byBmZWFyPyINCiJKb2huIEFjb3N0YSIsIllvdSBjYW5ub3QgaGF2ZSB3aGF0IHlvdSBkbyBub3Qgd2FudC4iDQoiUmFscGggV2FsZG8gRW1lcnNvbiIsIkRvIG5vdCBmb2xsb3cgd2hlcmUgdGhlIHBhdGggbWF5IGxlYWQuIEdvLCBpbnN0ZWFkLCB3aGVyZSB0aGVyZSBpcyBubyBwYXRoIGFuZCBsZWF2ZSBhIHRyYWlsLiINCiJFbGVhbm9yIFJvb3NldmVsdCIsIkl0IGlzIG5vdCBmYWlyIHRvIGFzayBvZiBvdGhlcnMgd2hhdCB5b3UgYXJlIHVud2lsbGluZyB0byBkbyB5b3Vyc2VsZi4iDQoiQ2FybCBKdW5nIiwiS25vd2luZyB5b3VyIG93biBkYXJrbmVzcyBpcyB0aGUgYmVzdCBtZXRob2QgZm9yIGRlYWxpbmcgd2l0aCB0aGUgZGFya25lc3NlcyBvZiBvdGhlciBwZW9wbGUuIg0KIk1vbmN1cmUgQ29ud2F5IiwiVGhlIGJlc3QgdGhpbmcgaW4gZXZlcnkgbm9ibGUgZHJlYW0gaXMgdGhlIGRyZWFtZXIuLi4iDQoiV2FsdCBEaXNuZXkiLCJXZXZlIGdvdCB0byBoYXZlIGEgZHJlYW0gaWYgd2UgYXJlIGdvaW5nIHRvIG1ha2UgYSBkcmVhbSBjb21lIHRydWUuIg0KIk5vcm1hbiBQZWFsZSIsIklmIHlvdSB3YW50IHRoaW5ncyB0byBiZSBkaWZmZXJlbnQsIHBlcmhhcHMgdGhlIGFuc3dlciBpcyB0byBiZWNvbWUgZGlmZmVyZW50IHlvdXJzZWxmLiINCiJBbGV4YW5kZXIgdGhlIEdyZWF0IiwiVGhlcmUgaXMgbm90aGluZyBpbXBvc3NpYmxlIHRvIGhpbSB3aG8gd2lsbCB0cnkuIg0KIlRoZW9kb3JlIFJ1YmluIiwiS2luZG5lc3MgaXMgbW9yZSBpbXBvcnRhbnQgdGhhbiB3aXNkb20sIGFuZCB0aGUgcmVjb2duaXRpb24gb2YgdGhpcyBpcyB0aGUgYmVnaW5uaW5nIG9mIHdpc2RvbS4iDQoiSGFycmlldCBUdWJtYW4iLCJFdmVyeSBncmVhdCBkcmVhbSBiZWdpbnMgd2l0aCBhIGRyZWFtZXIuIEFsd2F5cyByZW1lbWJlciwgeW91IGhhdmUgd2l0aGluIHlvdSB0aGUgc3RyZW5ndGgsIHRoZSBwYXRpZW5jZSwgYW5kIHRoZSBwYXNzaW9uIHRvIHJlYWNoIGZvciB0aGUgc3RhcnMgdG8gY2hhbmdlIHRoZSB3b3JsZC4iDQoiQnVkZGhhIiwiVGhlIG9ubHkgcmVhbCBmYWlsdXJlIGluIGxpZmUgaXMgbm90IHRvIGJlIHRydWUgdG8gdGhlIGJlc3Qgb25lIGtub3dzLiINCiJBbGJlcnQgRWluc3RlaW4iLCJBbnlvbmUgd2hvIGRvZXNuJ3QgdGFrZSB0cnV0aCBzZXJpb3VzbHkgaW4gc21hbGwgbWF0dGVycyBjYW5ub3QgYmUgdHJ1c3RlZCBpbiBsYXJnZSBvbmVzIGVpdGhlci4iDQoiQmFyYWNrIE9iYW1hIiwiQ2hhbmdlIHdpbGwgbm90IGNvbWUgaWYgd2Ugd2FpdCBmb3Igc29tZSBvdGhlciBwZXJzb24gb3Igc29tZSBvdGhlciB0aW1lLiBXZSBhcmUgdGhlIG9uZXMgd2V2ZSBiZWVuIHdhaXRpbmcgZm9yLiBXZSBhcmUgdGhlIGNoYW5nZSB0aGF0IHdlIHNlZWsuIg0KIkdlb3JnZSBTYW50YXlhbiIsIlRob3NlIHdobyBjYW5ub3QgbGVhcm4gZnJvbSBoaXN0b3J5IGFyZSBkb29tZWQgdG8gcmVwZWF0IGl0LiINCiJDYXJsb3MgQ2FzdGFuZWRhIiwiVGhlIHRyaWNrIGlzIGluIHdoYXQgb25lIGVtcGhhc2l6ZXMuIFdlIGVpdGhlciBtYWtlIG91cnNlbHZlcyBtaXNlcmFibGUsIG9yIHdlIG1ha2Ugb3Vyc2VsdmVzIGhhcHB5LiBUaGUgYW1vdW50IG9mIHdvcmsgaXMgdGhlIHNhbWUuIg0KIlNlbmVjYSIsIlRoaW5ncyB0aGF0IHdlcmUgaGFyZCB0byBiZWFyIGFyZSBzd2VldCB0byByZW1lbWJlci4iDQoiSGVucnkgSmFtZXMiLCJUaHJlZSB0aGluZ3MgaW4gaHVtYW4gbGlmZSBhcmUgaW1wb3J0YW50LiBUaGUgZmlyc3QgaXMgdG8gYmUga2luZC4gVGhlIHNlY29uZCBpcyB0byBiZSBraW5kLiBUaGUgdGhpcmQgaXMgdG8gYmUga2luZC4iDQoiQnVkZGhhIiwiSG93ZXZlciBtYW55IGhvbHkgd29yZHMgeW91IHJlYWQsIEhvd2V2ZXIgbWFueSB5b3Ugc3BlYWssIFdoYXQgZ29vZCB3aWxsIHRoZXkgZG8geW91IElmIHlvdSBkbyBub3QgYWN0IG9uIHVwb24gdGhlbT8iDQoiVmlyZ2lsIiwiVGhleSBjYW4gY29ucXVlciB3aG8gYmVsaWV2ZSB0aGV5IGNhbi4iDQoiRnJhbmsgVHlnZXIiLCJMZWFybiB0byBsaXN0ZW4uIE9wcG9ydHVuaXR5IGNvdWxkIGJlIGtub2NraW5nIGF0IHlvdXIgZG9vciB2ZXJ5IHNvZnRseS4iDQoiU2FpIEJhYmEiLCJBbGwgYWN0aW9uIHJlc3VsdHMgZnJvbSB0aG91Z2h0LCBzbyBpdCBpcyB0aG91Z2h0cyB0aGF0IG1hdHRlci4iDQoiQWxiZXJ0IEVpbnN0ZWluIiwiVGhlcmUgYXJlIG9ubHkgdHdvIHdheXMgdG8gbGl2ZSB5b3VyIGxpZmUuIE9uZSBpcyBhcyB0aG91Z2ggbm90aGluZyBpcyBhIG1pcmFjbGUuIFRoZSBvdGhlciBpcyBhcyB0aG91Z2ggZXZlcnl0aGluZyBpcyBhIG1pcmFjbGUuIg0KIkNvbGV0dGUiLCJJIGxvdmUgbXkgcGFzdC4gSSBsb3ZlIG15IHByZXNlbnQuIEltIG5vdCBhc2hhbWVkIG9mIHdoYXQgSXZlIGhhZCwgYW5kIEltIG5vdCBzYWQgYmVjYXVzZSBJIGhhdmUgaXQgbm8gbG9uZ2VyLiINCiJNYXlhIEFuZ2Vsb3UiLCJQcmVqdWRpY2UgaXMgYSBidXJkZW4gdGhhdCBjb25mdXNlcyB0aGUgcGFzdCwgdGhyZWF0ZW5zIHRoZSBmdXR1cmUgYW5kIHJlbmRlcnMgdGhlIHByZXNlbnQgaW5hY2Nlc3NpYmxlLiINCiJXaWxsaWFtIEhhemxpdHQiLCJKdXN0IGFzIG11Y2ggYXMgd2Ugc2VlIGluIG90aGVycyB3ZSBoYXZlIGluIG91cnNlbHZlcy4iDQoiR2VvZmZyZXkgRi4gQWJlcnQiLCJQcm9zcGVyaXR5IGRlcGVuZHMgbW9yZSBvbiB3YW50aW5nIHdoYXQgeW91IGhhdmUgdGhhbiBoYXZpbmcgd2hhdCB5b3Ugd2FudC4iDQoiQ29jbyBDaGFuZWwiLCJIb3cgbWFueSBjYXJlcyBvbmUgbG9zZXMgd2hlbiBvbmUgZGVjaWRlcyBub3QgdG8gYmUgc29tZXRoaW5nIGJ1dCB0byBiZSBzb21lb25lLiINCiJMYW8gVHp1IiwiSGUgd2hvIGtub3dzLCBkb2VzIG5vdCBzcGVhay4gSGUgd2hvIHNwZWFrcywgZG9lcyBub3Qga25vdy4iDQoiIiwiV2UgY2Fubm90IGRpcmVjdCB0aGUgd2luZCBidXQgd2UgY2FuIGFkanVzdCB0aGUgc2FpbHMuIg0KIkFsYmVydCBFaW5zdGVpbiIsIk9uZSBtYXkgc2F5IHRoZSBldGVybmFsIG15c3Rlcnkgb2YgdGhlIHdvcmxkIGlzIGl0cyBjb21wcmVoZW5zaWJpbGl0eS4iDQoiSm9obiBEZXdleSIsIlRoZSBzZWxmIGlzIG5vdCBzb21ldGhpbmcgcmVhZHktbWFkZSwgYnV0IHNvbWV0aGluZyBpbiBjb250aW51b3VzIGZvcm1hdGlvbiB0aHJvdWdoIGNob2ljZSBvZiBhY3Rpb24uIg0KIk1haGF0bWEgR2FuZGhpIiwiT3VyIGdyZWF0bmVzcyBsaWVzIG5vdCBzbyBtdWNoIGluIGJlaW5nIGFibGUgdG8gcmVtYWtlIHRoZSB3b3JsZCBhcyBiZWluZyBhYmxlIHRvIHJlbWFrZSBvdXJzZWx2ZXMuIg0KIlBoaWxpcCBCcmVlZHZlbGQiLCJNb21lbnRzIG9mIGNvbXBsZXRlIGFwYXRoeSBhcmUgdGhlIGJlc3QgZm9yIG5ldyBjcmVhdGlvbnMuIg0KIkpvaG4gUG93ZWxsIiwiVGhlIG9ubHkgcmVhbCBtaXN0YWtlIGlzIHRoZSBvbmUgZnJvbSB3aGljaCB3ZSBsZWFybiBub3RoaW5nLiINCiJUaW0gTWVuY2hlbiIsIlRvIGRyZWFtIG9mIHRoZSBwZXJzb24geW91IHdvdWxkIGxpa2UgdG8gYmUgaXMgdG8gd2FzdGUgdGhlIHBlcnNvbiB5b3UgYXJlLiINCiJDaGFybGVzIER1Ym9pcyIsIlRoZSBpbXBvcnRhbnQgdGhpbmcgaXMgdGhpczogdG8gYmUgYWJsZSBhdCBhbnkgbW9tZW50IHRvIHNhY3JpZmljZSB3aGF0IHdlIGFyZSBmb3Igd2hhdCB3ZSBjb3VsZCBiZWNvbWUuIg0KIkNpY2VybyIsIkdyYXRpdHVkZSBpcyBub3Qgb25seSB0aGUgZ3JlYXRlc3Qgb2YgdmlydHVlcywgYnV0IHRoZSBwYXJlbid0IG9mIGFsbCB0aGUgb3RoZXJzLiINCiJMYW1hIFllc2hlIiwiSXQgaXMgbmV2ZXIgdG9vIGxhdGUuIEV2ZW4gaWYgeW91IGFyZSBnb2luZyB0byBkaWUgdG9tb3Jyb3csIGtlZXAgeW91cnNlbGYgc3RyYWlnaHQgYW5kIGNsZWFyIGFuZCBiZSBhIGhhcHB5IGh1bWFuIGJlaW5nIHRvZGF5LiINCiJCeXJvbiBQdWxzaWZlciIsIlJlc3BlY3QgaXMgbm90IHNvbWV0aGluZyB0aGF0IHlvdSBjYW4gYXNrIGZvciwgYnV5IG9yIGJvcnJvdy4gUmVzcGVjdCBpcyB3aGF0IHlvdSBlYXJuIGZyb20gZWFjaCBwZXJzb24gbm8gbWF0dGVyIHRoZWlyIGJhY2tncm91bmQgb3Igc3RhdHVzLiINCiJIZW5yeSBUaG9yZWF1IiwiVGhpbmdzIGRvIG5vdCBjaGFuZ2U7IHdlIGNoYW5nZS4iDQoiQmxhaXNlIFBhc2NhbCIsIldlIG11c3QgbGVhcm4gb3VyIGxpbWl0cy4gV2UgYXJlIGFsbCBzb21ldGhpbmcsIGJ1dCBub25lIG9mIHVzIGFyZSBldmVyeXRoaW5nLiINCiJTdGVwaGVuIFNpZ211bmQiLCJMZWFybiB3aXNkb20gZnJvbSB0aGUgd2F5cyBvZiBhIHNlZWRsaW5nLiBBIHNlZWRsaW5nIHdoaWNoIGlzIG5ldmVyIGhhcmRlbmVkIG9mZiB0aHJvdWdoIHN0cmVzc2Z1bCBzaXR1YXRpb25zIHdpbGwgbmV2ZXIgYmVjb21lIGEgc3Ryb25nIHByb2R1Y3RpdmUgcGxhbnQuIg0KIkNoYXJsZXMgUi4gU3dpbmRvbGwiLCJXZSBhcmUgYWxsIGZhY2VkIHdpdGggYSBzZXJpZXMgb2YgZ3JlYXQgb3Bwb3J0dW5pdGllcyBicmlsbGlhbnRseSBkaXNndWlzZWQgYXMgaW1wb3NzaWJsZSBzaXR1YXRpb25zLiINCiJBbGJlcnQgQ2FtdXMiLCJBbGwgbWVuIGhhdmUgYSBzd2VldG5lc3MgaW4gdGhlaXIgbGlmZS4gVGhhdCBpcyB3aGF0IGhlbHBzIHRoZW0gZ28gb24uIEl0IGlzIHRvd2FyZHMgdGhhdCB0aGV5IHR1cm4gd2hlbiB0aGV5IGZlZWwgdG9vIHdvcm4gb3V0LiINCiJGcmFuayBUeWdlciIsIkJlIGEgZ29vZCBsaXN0ZW5lci4gWW91ciBlYXJzIHdpbGwgbmV2ZXIgZ2V0IHlvdSBpbiB0cm91YmxlLiINCiJCdWRkaGEiLCJNZWRpdGF0aW9uIGJyaW5ncyB3aXNkb207IGxhY2sgb2YgbWVkaWF0aW9uIGxlYXZlcyBpZ25vcmFuY2UuIEtub3cgd2VsbCB3aGF0IGxlYWRzIHlvdSBmb3J3YXJkIGFuZCB3aGF0IGhvbGQgeW91IGJhY2ssIGFuZCBjaG9vc2UgdGhlIHBhdGggdGhhdCBsZWFkcyB0byB3aXNkb20uIg0KIkFuYXRvbGUgRnJhbmNlIiwiWW91IGxlYXJuIHRvIHNwZWFrIGJ5IHNwZWFraW5nLCB0byBzdHVkeSBieSBzdHVkeWluZywgdG8gcnVuIGJ5IHJ1bm5pbmcsIHRvIHdvcmsgYnkgd29ya2luZzsgaW4ganVzdCB0aGUgc2FtZSB3YXksIHlvdSBsZWFybiB0byBsb3ZlIGJ5IGxvdmluZy4iDQoiSm9obiBNYXJzaGFsbCIsIlRvIGxpc3RlbiB3ZWxsIGlzIGFzIHBvd2VyZnVsIGEgbWVhbnMgb2YgY29tbXVuaWNhdGlvbiBhbmQgaW5mbHVlbmNlIGFzIHRvIHRhbGsgd2VsbC4iDQoiR2VvcmdlIFNhbmQiLCJUaGVyZSBpcyBvbmx5IG9uZSBoYXBwaW5lc3MgaW4gbGlmZSwgdG8gbG92ZSBhbmQgYmUgbG92ZWQuIg0KIk1hdHQgWm90dGkiLCJMaXZlIHRocm91Z2ggZmVlbGluZyBhbmQgeW91IHdpbGwgbGl2ZSB0aHJvdWdoIGxvdmUuIEZvciBmZWVsaW5nIGlzIHRoZSBsYW5ndWFnZSBvZiB0aGUgc291bCwgYW5kIGZlZWxpbmcgaXMgdHJ1dGguIg0KIkxhbyBUenUiLCJLaW5kbmVzcyBpbiB3b3JkcyBjcmVhdGVzIGNvbmZpZGVuY2UuIEtpbmRuZXNzIGluIHRoaW5raW5nIGNyZWF0ZXMgcHJvZm91bmRuZXNzLiBLaW5kbmVzcyBpbiBnaXZpbmcgY3JlYXRlcyBsb3ZlLiINCiJUaG9tYXMgSmVmZmVyc29uIiwiUmVhc29uIGFuZCBmcmVlIGlucXVpcnkgYXJlIHRoZSBvbmx5IGVmZmVjdHVhbCBhZ2VudHMgYWdhaW5zdCBlcnJvci4iDQoiTmFwb2xlb24gQm9uYXBhcnRlIiwiVGhlIGJlc3QgY3VyZSBmb3IgdGhlIGJvZHkgaXMgYSBxdWlldCBtaW5kLiINCiJEYWxhaSBMYW1hIiwiU2VlIHRoZSBwb3NpdGl2ZSBzaWRlLCB0aGUgcG90ZW50aWFsLCBhbmQgbWFrZSBhbiBlZmZvcnQuIg0KIkphbmUgUm9iZXJ0cyIsIkJ5IGFjY2VwdGluZyB5b3Vyc2VsZiBhbmQgYmVpbmcgZnVsbHkgd2hhdCB5b3UgYXJlLCB5b3VyIHByZXNlbmNlIGNhbiBtYWtlIG90aGVycyBoYXBweS4iDQoiTm9ybWFuIENvdXNpbnMiLCJOZXZlciBkZW55IGEgZGlhZ25vc2lzLCBidXQgZG8gZGVueSB0aGUgbmVnYXRpdmUgdmVyZGljdCB0aGF0IG1heSBnbyB3aXRoIGl0LiINCiJKb2hhbm4gV29sZmdhbmcgdm9uIEdvZXRoZSIsIlRoZSByZWFsbHkgdW5oYXBweSBwZXJzb24gaXMgdGhlIG9uZSB3aG8gbGVhdmVzIHVuZG9uZSB3aGF0IHRoZXkgY2FuIGRvLCBhbmQgc3RhcnRzIGRvaW5nIHdoYXQgdGhleSBkb24ndCB1bmRlcnN0YW5kOyBubyB3b25kZXIgdGhleSBjb21lIHRvIGdyaWVmLiINCiJXYXluZSBEeWVyIiwiWW91IGNhbm5vdCBiZSBsb25lbHkgaWYgeW91IGxpa2UgdGhlIHBlcnNvbiB5b3UncmUgYWxvbmUgd2l0aC4iDQoiRy4gSy4gQ2hlc3RlcnRvbiIsIkkgZG8gbm90IGJlbGlldmUgaW4gYSBmYXRlIHRoYXQgZmFsbHMgb24gbWVuIGhvd2V2ZXIgdGhleSBhY3Q7IGJ1dCBJIGRvIGJlbGlldmUgaW4gYSBmYXRlIHRoYXQgZmFsbHMgb24gbWFuIHVubGVzcyB0aGV5IGFjdC4iDQoiQnVkZGhhIiwiSWYgeW91IHByb3Bvc2UgdG8gc3BlYWssIGFsd2F5cyBhc2sgeW91cnNlbGYsIGlzIGl0IHRydWUsIGlzIGl0IG5lY2Vzc2FyeSwgaXMgaXQga2luZC4iDQoiQ2FkZXQgTWF4aW0iLCJSaXNrIG1vcmUgdGhhbiBvdGhlcnMgdGhpbmsgaXMgc2FmZS4gQ2FyZSBtb3JlIHRoYW4gb3RoZXJzIHRoaW5rIGlzIHdpc2UuIERyZWFtIG1vcmUgdGhhbiBvdGhlcnMgdGhpbmsgaXMgcHJhY3RpY2FsLkV4cGVjdCBtb3JlIHRoYW4gb3RoZXJzIHRoaW5rIGlzIHBvc3NpYmxlLiINCiJPZyBNYW5kaW5vIiwiRmFpbHVyZSB3aWxsIG5ldmVyIG92ZXJ0YWtlIG1lIGlmIG15IGRldGVybWluYXRpb24gdG8gc3VjY2VlZCBpcyBzdHJvbmcgZW5vdWdoLiINCiJSYWxwaCBNYXJzdG9uIiwiTGV0IGdvIG9mIHlvdXIgYXR0YWNobWVudCB0byBiZWluZyByaWdodCwgYW5kIHN1ZGRlbmx5IHlvdXIgbWluZCBpcyBtb3JlIG9wZW4uIFlvdSdyZSBhYmxlIHRvIGJlbmVmaXQgZnJvbSB0aGUgdW5pcXVlIHZpZXdwb2ludHMgb2Ygb3RoZXJzLCB3aXRob3V0IGJlaW5nIGNyaXBwbGVkIGJ5IHlvdXIgb3duIGp1ZGdlbWVudC4iDQoiTWFyayBUd2FpbiIsIldyaW5rbGVzIHNob3VsZCBtZXJlbHkgaW5kaWNhdGUgd2hlcmUgc21pbGVzIGhhdmUgYmVlbi4iDQoiWmlnIFppZ2xhciIsIllvdXIgYXR0aXR1ZGUsIG5vdCB5b3VyIGFwdGl0dWRlLCB3aWxsIGRldGVybWluZSB5b3VyIGFsdGl0dWRlLiINCiJSdW1pIiwiTGV0IHlvdXJzZWxmIGJlIHNpbGVudGx5IGRyYXduIGJ5IHRoZSBzdHJvbmdlciBwdWxsIG9mIHdoYXQgeW91IHJlYWxseSBsb3ZlLiINCiJSaWNoYXJkIEJhY2giLCJJIGdhdmUgbXkgbGlmZSB0byBiZWNvbWUgdGhlIHBlcnNvbiBJIGFtIHJpZ2h0IG5vdy4gV2FzIGl0IHdvcnRoIGl0PyINCiJIYXVzYSIsIkdpdmUgdGhhbmtzIGZvciBhIGxpdHRsZSBhbmQgeW91IHdpbGwgZmluZCBhIGxvdC4iDQoiQXJpZSBkZSBHdWVzIiwiWW91ciBhYmlsaXR5IHRvIGxlYXJuIGZhc3RlciB0aGFuIHlvdXIgY29tcGV0aXRpb24gaXMgeW91ciBvbmx5IHN1c3RhaW5hYmxlIGNvbXBldGl0aXZlIGFkdmFudGFnZS4iDQoiUGF1bCBCb2VzZSIsIkZvcmdpdmVuZXNzIGRvZXMgbm90IGNoYW5nZSB0aGUgcGFzdCwgYnV0IGl0IGRvZXMgZW5sYXJnZSB0aGUgZnV0dXJlLiINCiJOaWtvbGEgVGVzbGEiLCJMZXQgdGhlIGZ1dHVyZSB0ZWxsIHRoZSB0cnV0aCwgYW5kIGV2YWx1YXRlIGVhY2ggb25lIGFjY29yZGluZyB0byBoaXMgd29yayBhbmQgYWNjb21wbGlzaG1lbnRzLiBUaGUgcHJlc2VudCBpcyB0aGVpcnM7IHRoZSBmdXR1cmUsIGZvciB3aGljaCBJIGhhdmUgcmVhbGx5IHdvcmtlZCwgaXMgbWluZS4iDQoiQXJpc3RvdGxlIiwiTW9yYWwgZXhjZWxsZW5jZSBjb21lcyBhYm91dCBhcyBhIHJlc3VsdCBvZiBoYWJpdC4gV2UgYmVjb21lIGp1c3QgYnkgZG9pbmcganVzdCBhY3RzLCB0ZW1wZXJhdGUgYnkgZG9pbmcgdGVtcGVyYXRlIGFjdHMsIGJyYXZlIGJ5IGRvaW5nIGJyYXZlIGFjdHMuIg0KIldpbGxpYW0gSmFtZXMiLCJUaGUgZGVlcGVzdCBjcmF2aW5nIG9mIGh1bWFuIG5hdHVyZSBpcyB0aGUgbmVlZCB0byBiZSBhcHByZWNpYXRlZC4iDQoiQW50b2luZSBkZSBTYWludC1FeHVwZXJ5IiwiTG92ZSBkb2VzIG5vdCBjb25zaXN0IG9mIGdhemluZyBhdCBlYWNoIG90aGVyLCBidXQgaW4gbG9va2luZyB0b2dldGhlciBpbiB0aGUgc2FtZSBkaXJlY3Rpb24uIg0KIkVkd2luIE1hcmtoYW0iLCJXZSBoYXZlIGNvbW1pdHRlZCB0aGUgR29sZGVuIFJ1bGUgdG8gbWVtb3J5OyBsZXQgdXMgbm93IGNvbW1pdCBpdCB0byBsaWZlLiINCiJSb2JlcnQgU291dGhleSIsIkl0IGlzIHdpdGggd29yZHMgYXMgd2l0aCBzdW5iZWFtcy4gVGhlIG1vcmUgdGhleSBhcmUgY29uZGVuc2VkLCB0aGUgZGVlcGVyIHRoZXkgYnVybi4iDQoiVG9ueSBSb2JiaW5zIiwiV2hlbiBwZW9wbGUgYXJlIGxpa2UgZWFjaCBvdGhlciB0aGV5IHRlbmQgdG8gbGlrZSBlYWNoIG90aGVyLiINCiJDb25mdWNpdXMiLCJTaW5jZXJpdHkgaXMgdGhlIHdheSBvZiBIZWF2ZW4uIFRoZSBhdHRhaW5tZW50IG9mIHNpbmNlcml0eSBpcyB0aGUgd2F5IG9mIG1lbi4iDQoiTW9oYW5kYXMgR2FuZGhpIiwiQmUgdGhlIGNoYW5nZSB0aGF0IHlvdSB3YW50IHRvIHNlZSBpbiB0aGUgd29ybGQuIg0KIkppbSBSb2huIiwiVGhlIG1vcmUgeW91IGNhcmUsIHRoZSBzdHJvbmdlciB5b3UgY2FuIGJlLiINCiJPcHJhaCBXaW5mcmV5IiwiTG90cyBvZiBwZW9wbGUgd2FudCB0byByaWRlIHdpdGggeW91IGluIHRoZSBsaW1vLCBidXQgd2hhdCB5b3Ugd2FudCBpcyBzb21lb25lIHdobyB3aWxsIHRha2UgdGhlIGJ1cyB3aXRoIHlvdSB3aGVuIHRoZSBsaW1vIGJyZWFrcyBkb3duLiINCiJHb2V0aGUiLCJKdXN0IHRydXN0IHlvdXJzZWxmLCB0aGVuIHlvdSB3aWxsIGtub3cgaG93IHRvIGxpdmUuIg0KIlBlbWEgQ2hvZHJvbiIsIlRvIGJlIGZ1bGx5IGFsaXZlLCBmdWxseSBodW1hbiwgYW5kIGNvbXBsZXRlbHkgYXdha2UgaXMgdG8gYmUgY29udGludWFsbHkgdGhyb3duIG91dCBvZiB0aGUgbmVzdC4iDQoiSmltIFJvaG4iLCJJZiB5b3UgZG9uJ3QgZGVzaWduIHlvdXIgb3duIGxpZmUgcGxhbiwgY2hhbmNlcyBhcmUgeW91J2xsIGZhbGwgaW50byBzb21lb25lIGVsc2UncyBwbGFuLiBBbmQgZ3Vlc3Mgd2hhdCB0aGV5IGhhdmUgcGxhbm5lZCBmb3IgeW91PyBOb3QgbXVjaC4iDQoiQ2FybCBKdW5nIiwiSXQgYWxsIGRlcGVuZHMgb24gaG93IHdlIGxvb2sgYXQgdGhpbmdzLCBhbmQgbm90IGhvdyB0aGV5IGFyZSBpbiB0aGVtc2VsdmVzLiINCiIiLCJHaXZpbmcgdXAgZG9lc24ndCBhbHdheXMgbWVhbiB5b3UgYXJlIHdlYWs7IHNvbWV0aW1lcyBpdCBtZWFucyB0aGF0IHlvdSBhcmUgc3Ryb25nIGVub3VnaCB0byBsZXQgZ28uIg0KIldpbGxpYW0gU2hha2VzcGVhcmUiLCJUbyBjbGltYiBzdGVlcCBoaWxscyByZXF1aXJlcyBhIHNsb3cgcGFjZSBhdCBmaXJzdC4iDQoiQnVkZGhhIiwiQW4gaWRlYSB0aGF0IGlzIGRldmVsb3BlZCBhbmQgcHV0IGludG8gYWN0aW9uIGlzIG1vcmUgaW1wb3J0YW50IHRoYW4gYW4gaWRlYSB0aGF0IGV4aXN0cyBvbmx5IGFzIGFuIGlkZWEuIg0KIk1heCBQbGFuY2siLCJJdCBpcyBub3QgdGhlIHBvc3Nlc3Npb24gb2YgdHJ1dGgsIGJ1dCB0aGUgc3VjY2VzcyB3aGljaCBhdHRlbmRzIHRoZSBzZWVraW5nIGFmdGVyIGl0LCB0aGF0IGVucmljaGVzIHRoZSBzZWVrZXIgYW5kIGJyaW5ncyBoYXBwaW5lc3MgdG8gaGltLiINCiJBYnJhaGFtIExpbmNvbG4iLCJUcnV0aCBpcyBnZW5lcmFsbHkgdGhlIGJlc3QgdmluZGljYXRpb24gYWdhaW5zdCBzbGFuZGVyLiINCiJBbm5hIFBhdmxvdmEiLCJUbyBmb2xsb3csIHdpdGhvdXQgaGFsdCwgb25lIGFpbTogVGhlcmUgaXMgdGhlIHNlY3JldCBvZiBzdWNjZXNzLiINCiJOZWxzb24gTWFuZGVsYSIsIkFuZCBhcyB3ZSBsZXQgb3VyIG93biBsaWdodCBzaGluZSwgd2UgdW5jb25zY2lvdXNseSBnaXZlIG90aGVyIHBlb3BsZSBwZXJtaXNzaW9uIHRvIGRvIHRoZSBzYW1lLiINCiJSYWxwaCBFbWVyc29uIiwiV2hhdCBpcyBhIHdlZWQ/IEEgcGxhbnQgd2hvc2UgdmlydHVlcyBoYXZlIG5vdCB5ZXQgYmVlbiBkaXNjb3ZlcmVkLiINCiJSYWxwaCBFbWVyc29uIiwiQmVsaWVmIGNvbnNpc3RzIGluIGFjY2VwdGluZyB0aGUgYWZmaXJtYXRpb25zIG9mIHRoZSBzb3VsOyBVbmJlbGllZiwgaW4gZGVueWluZyB0aGVtLiINCiIiLCJNYW55IHBlb3BsZSBoYXZlIGdvbmUgZnVydGhlciB0aGFuIHRoZXkgdGhvdWdodCB0aGV5IGNvdWxkIGJlY2F1c2Ugc29tZW9uZSBlbHNlIHRob3VnaHQgdGhleSBjb3VsZC4iDQoiUmFiaW5kcmFuYXRoIFRhZ29yZSIsIldlIHJlYWQgdGhlIHdvcmxkIHdyb25nIGFuZCBzYXkgdGhhdCBpdCBkZWNlaXZlcyB1cy4iDQoiRWRpdGggV2hhcnRvbiIsIklmIG9ubHkgd2VkIHN0b3AgdHJ5aW5nIHRvIGJlIGhhcHB5IHdlZCBoYXZlIGEgcHJldHR5IGdvb2QgdGltZS4iDQoiRWxlYW5vciBSb29zZXZlbHQiLCJZb3UgbXVzdCBkbyB0aGUgdGhpbmdzIHlvdSB0aGluayB5b3UgY2Fubm90IGRvLiINCiJPc2NhciBXaWxkZSIsIkJlIHlvdXJzZWxmOyBldmVyeW9uZSBlbHNlIGlzIGFscmVhZHkgdGFrZW4uIg0KIlJpY2hhcmQgQmFjaCIsIlRoZSBtYXJrIG9mIHlvdXIgaWdub3JhbmNlIGlzIHRoZSBkZXB0aCBvZiB5b3VyIGJlbGllZiBpbiBpbmp1c3RpY2UgYW5kIHRyYWdlZHkuIFdoYXQgdGhlIGNhdGVycGlsbGFyIGNhbGxzIHRoZSBlbmQgb2YgdGhlIHdvcmxkLCB0aGUgTWFzdGVyIGNhbGxzIHRoZSBidXR0ZXJmbHkuIg0KIkVkbmEgTWlsbGF5IiwiSSBhbSBnbGFkIHRoYXQgSSBwYWlkIHNvIGxpdHRsZSBhdHRlbnRpb24gdG8gZ29vZCBhZHZpY2U7IGhhZCBJIGFiaWRlZCBieSBpdCBJIG1pZ2h0IGhhdmUgYmVlbiBzYXZlZCBmcm9tIHNvbWUgb2YgbXkgbW9zdCB2YWx1YWJsZSBtaXN0YWtlcy4iDQoiQWJyYWhhbSBMaW5jb2xuIiwiTW9zdCBmb2xrcyBhcmUgYXMgaGFwcHkgYXMgdGhleSBtYWtlIHVwIHRoZWlyIG1pbmRzIHRvIGJlLiINCiJPbGl2ZXIgSG9sbWVzIiwiTG92ZSBpcyB0aGUgbWFzdGVyIGtleSB0aGF0IG9wZW5zIHRoZSBnYXRlcyBvZiBoYXBwaW5lc3MuIg0KIkNlY2lsIEIuIERlTWlsbGUiLCJUaGUgcGVyc29uIHdobyBtYWtlcyBhIHN1Y2Nlc3Mgb2YgbGl2aW5nIGlzIHRoZSBvbmUgd2hvIHNlZSBoaXMgZ29hbCBzdGVhZGlseSBhbmQgYWltcyBmb3IgaXQgdW5zd2VydmluZ2x5LiBUaGF0IGlzIGRlZGljYXRpb24uIg0KIkdlb3JnZSBTaGF3IiwiTXkgcmVwdXRhdGlvbiBncm93cyB3aXRoIGV2ZXJ5IGZhaWx1cmUuIg0KIlJhbHBoIEVtZXJzb24iLCJHb29kIHRob3VnaHRzIGFyZSBubyBiZXR0ZXIgdGhhbiBnb29kIGRyZWFtcywgdW5sZXNzIHRoZXkgYmUgZXhlY3V0ZWQuIg0KIkRhbGFpIExhbWEiLCJIYXBwaW5lc3MgZG9lcyBub3QgY29tZSBhYm91dCBvbmx5IGR1ZSB0byBleHRlcm5hbCBjaXJjdW1zdGFuY2VzOyBpdCBtYWlubHkgZGVyaXZlcyBmcm9tIGlubmVyIGF0dGl0dWRlcy4iDQoiQnVkZGhhIiwiSG93ZXZlciBtYW55IGhvbHkgd29yZHMgeW91IHJlYWQsIGhvd2V2ZXIgbWFueSB5b3Ugc3BlYWssIHdoYXQgZ29vZCB3aWxsIHRoZXkgZG8geW91IGlmIHlvdSBkbyBub3QgYWN0IG9uIHVwb24gdGhlbT8iDQoiSGFycnkgQmFua3MiLCJGb3Igc3VjY2VzcywgYXR0aXR1ZGUgaXMgZXF1YWxseSBhcyBpbXBvcnRhbnQgYXMgYWJpbGl0eS4iDQoiQ29saW4gUG93ZWxsIiwiSWYgeW91IGFyZSBnb2luZyB0byBhY2hpZXZlIGV4Y2VsbGVuY2UgaW4gYmlnIHRoaW5ncywgeW91IGRldmVsb3AgdGhlIGhhYml0IGluIGxpdHRsZSBtYXR0ZXJzLiBFeGNlbGxlbmNlIGlzIG5vdCBhbiBleGNlcHRpb24sIGl0IGlzIGEgcHJldmFpbGluZyBhdHRpdHVkZS4iDQoiQWxiZXJ0IEVpbnN0ZWluIiwiQSBwZXJzb24gd2hvIG5ldmVyIG1hZGUgYSBtaXN0YWtlIG5ldmVyIHRyaWVkIGFueXRoaW5nIG5ldy4iDQoiQnVkZGhhIiwiQmV0dGVyIHRoYW4gYSB0aG91c2FuZCBob2xsb3cgd29yZHMgaXMgb25lIHdvcmQgdGhhdCBicmluZ3MgcGVhY2UuIg0KIkdlb3JnZSBCZXJuYXJkIFNoYXciLCJUaGUgcG9zc2liaWxpdGllcyBhcmUgbnVtZXJvdXMgb25jZSB3ZSBkZWNpZGUgdG8gYWN0IGFuZCBub3QgcmVhY3QuIg0KIkhlbnJpIEFtaWVsIiwiQWxtb3N0IGV2ZXJ5dGhpbmcgY29tZXMgZnJvbSBub3RoaW5nLiINCiJEb25hbGQgVHJ1bXAiLCJTb21ldGltZXMgYnkgbG9zaW5nIGEgYmF0dGxlIHlvdSBmaW5kIGEgbmV3IHdheSB0byB3aW4gdGhlIHdhci4iDQoiUmljaGFyZCBCYWNoIiwiTGlzdGVuIHRvIHdoYXQgeW91IGtub3cgaW5zdGVhZCBvZiB3aGF0IHlvdSBmZWFyLiINCiJCZXR0eSBGcmllZGFuIiwiSXQgaXMgZWFzaWVyIHRvIGxpdmUgdGhyb3VnaCBzb21lb25lIGVsc2UgdGhhbiB0byBiZWNvbWUgY29tcGxldGUgeW91cnNlbGYuIg0KIkpvaG4gU2ltb25lIiwiSWYgeW91J3JlIGluIGEgYmFkIHNpdHVhdGlvbiwgZG9uJ3Qgd29ycnkgaXQnbGwgY2hhbmdlLiBJZiB5b3UncmUgaW4gYSBnb29kIHNpdHVhdGlvbiwgZG9uJ3Qgd29ycnkgaXQnbGwgY2hhbmdlLiINCiJaaWcgWmlnbGFyIiwiUmVtZW1iZXIgdGhhdCBmYWlsdXJlIGlzIGFuIGV2ZW50LCBub3QgYSBwZXJzb24uIg0KIk9wcmFoIFdpbmZyZXkiLCJEb24ndCBzZXR0bGUgZm9yIGEgcmVsYXRpb25zaGlwIHRoYXQgd29uJ3QgbGV0IHlvdSBiZSB5b3Vyc2VsZi4iDQoiUmljaGFyZCBCYWNoIiwiV2hhdCB0aGUgY2F0ZXJwaWxsYXIgY2FsbHMgdGhlIGVuZCBvZiB0aGUgd29ybGQsIHRoZSBtYXN0ZXIgY2FsbHMgYSBidXR0ZXJmbHkuIg0KIlRob21hcyBDYXJseWxlIiwiSW5zdGVhZCBvZiBzYXlpbmcgdGhhdCBtYW4gaXMgdGhlIGNyZWF0dXJlIG9mIGNpcmN1bXN0YW5jZSwgaXQgd291bGQgYmUgbmVhcmVyIHRoZSBtYXJrIHRvIHNheSB0aGF0IG1hbiBpcyB0aGUgYXJjaGl0ZWN0IG9mIGNpcmN1bXN0YW5jZS4iDQoiVG9ueSBSb2JiaW5zIiwiSWYgeW91IGRvIHdoYXQgeW91J3ZlIGFsd2F5cyBkb25lLCB5b3UnbGwgZ2V0IHdoYXQgeW91dmUgYWx3YXlzIGdvdHRlbi4iDQoiTW90aGVyIFRlcmVzYSIsIkRvIG5vdCB3YWl0IGZvciBsZWFkZXJzOyBkbyBpdCBhbG9uZSwgcGVyc29uIHRvIHBlcnNvbi4iDQoiUGxvdGludXMiLCJLbm93bGVkZ2UgaGFzIHRocmVlIGRlZ3JlZXMsIG9waW5pb24sIHNjaWVuY2UsIGlsbHVtaW5hdGlvbi4gVGhlIG1lYW5zIG9yIGluc3RydW1lbnQgb2YgdGhlIGZpcnN0IGlzIHNlbnNlOyBvZiB0aGUgc2Vjb25kLCBkaWFsZWN0aWM7IG9mIHRoZSB0aGlyZCwgaW50dWl0aW9uLiINCiJNYXJ5IFBhcnJpc2giLCJMb3ZlIHZhbnF1aXNoZXMgdGltZS4gVG8gbG92ZXJzLCBhIG1vbWVudCBjYW4gYmUgZXRlcm5pdHksIGV0ZXJuaXR5IGNhbiBiZSB0aGUgdGljayBvZiBhIGNsb2NrLiINCiJWb2x0YWlyZSIsIldlIG5ldmVyIGxpdmU7IHdlIGFyZSBhbHdheXMgaW4gdGhlIGV4cGVjdGF0aW9uIG9mIGxpdmluZy4iDQoiSGVucmkgTC4gQmVyZ3NvbiIsIlRoaW5rIGxpa2UgYSBtYW4gb2YgYWN0aW9uOyBhY3QgbGlrZSBhIG1hbiBvZiB0aG91Z2h0LiINCiJaaWdneSIsIllvdSBjYW4gY29tcGxhaW4gYmVjYXVzZSByb3NlcyBoYXZlIHRob3Jucywgb3IgeW91IGNhbiByZWpvaWNlIGJlY2F1c2UgdGhvcm5zIGhhdmUgcm9zZXMuIg0KIkFuYWlzIE5pbiIsIlRoZXJlIGlzIG5vdCBvbmUgYmlnIGNvc21pYyBtZWFuaW5nIGZvciBhbGwsIHRoZXJlIGlzIG9ubHkgdGhlIG1lYW5pbmcgd2UgZWFjaCBnaXZlIHRvIG91ciBsaWZlLiINCiJMYW8gVHp1IiwiQSBsZWFkZXIgaXMgYmVzdCB3aGVuIHBlb3BsZSBiYXJlbHkga25vdyBoZSBleGlzdHMsIHdoZW4gaGlzIHdvcmsgaXMgZG9uZSwgaGlzIGFpbSBmdWxmaWxsZWQsIHRoZXkgd2lsbCBzYXk6IHdlIGRpZCBpdCBvdXJzZWx2ZXMuIg0KIkpvaG4gTGVubm9uIiwiVGltZSB5b3UgZW5qb3llZCB3YXN0aW5nIHdhcyBub3Qgd2FzdGVkLiINCiJBbGJlcnQgQ2FtdXMiLCJZb3Ugd2lsbCBuZXZlciBiZSBoYXBweSBpZiB5b3UgY29udGludWUgdG8gc2VhcmNoIGZvciB3aGF0IGhhcHBpbmVzcyBjb25zaXN0cyBvZi4gWW91IHdpbGwgbmV2ZXIgbGl2ZSBpZiB5b3UgYXJlIGxvb2tpbmcgZm9yIHRoZSBtZWFuaW5nIG9mIGxpZmUuIg0KIkRhaXNha3UgSWtlZGEiLCJHZW51aW5lIHNpbmNlcml0eSBvcGVucyBwZW9wbGUncyBoZWFydHMsIHdoaWxlIG1hbmlwdWxhdGlvbiBjYXVzZXMgdGhlbSB0byBjbG9zZS4iDQoiQ29uZnVjaXVzIiwiVG8gZ2l2ZSBvbmVzIHNlbGYgZWFybmVzdGx5IHRvIHRoZSBkdXRpZXMgZHVlIHRvIG1lbiwgYW5kLCB3aGlsZSByZXNwZWN0aW5nIHNwaXJpdHVhbCBiZWluZ3MsIHRvIGtlZXAgYWxvb2YgZnJvbSB0aGVtLCBtYXkgYmUgY2FsbGVkIHdpc2RvbS4iDQoiWmFkb2sgUmFiaW5vd2l0eiIsIkEgbWFuJ3MgZHJlYW1zIGFyZSBhbiBpbmRleCB0byBoaXMgZ3JlYXRuZXNzLiINCiJXaWxsaWFtIEx5b24gUGhlbHBzIiwiVGhpcyBpcyB0aGUgZmluYWwgdGVzdCBvZiBhIGdlbnRsZW1hbjogaGlzIHJlc3BlY3QgZm9yIHRob3NlIHdobyBjYW4gYmUgb2Ygbm8gcG9zc2libGUgdmFsdWUgdG8gaGltLiINCiJSaWNoYXJkIEJhY2giLCJZb3UgdGVhY2ggYmVzdCB3aGF0IHlvdSBtb3N0IG5lZWQgdG8gbGVhcm4uIg0KIldpbnN0b24gQ2h1cmNoaWxsIiwiQ29udGludW91cyBlZmZvcnQsIG5vdCBzdHJlbmd0aCBvciBpbnRlbGxpZ2VuY2UsIGlzIHRoZSBrZXkgdG8gdW5sb2NraW5nIG91ciBwb3RlbnRpYWwuIg0KIkhlbnJ5IEZvcmQiLCJPYnN0YWNsZXMgYXJlIHRob3NlIGZyaWdodGZ1bCB0aGluZ3MgeW91IHNlZSB3aGVuIHlvdSB0YWtlIHlvdXIgZXllcyBvZmYgeW91ciBnb2FsLiINCiJXYXluZSBEeWVyIiwiR28gZm9yIGl0IG5vdy4gVGhlIGZ1dHVyZSBpcyBwcm9taXNlZCB0byBubyBvbmUuIg0KIkpvaG4gSG9sbWVzIiwiTmV2ZXIgdGVsbCBhIHlvdW5nIHBlcnNvbiB0aGF0IGFueXRoaW5nIGNhbm5vdCBiZSBkb25lLiBHb2QgbWF5IGhhdmUgYmVlbiB3YWl0aW5nIGNlbnR1cmllcyBmb3Igc29tZW9uZSBpZ25vcmFudCBlbm91Z2ggb2YgdGhlIGltcG9zc2libGUgdG8gZG8gdGhhdCB2ZXJ5IHRoaW5nLiINCiJCeXJvbiBQdWxzaWZlciIsIkJvbGQgaXMgbm90IHRoZSBhY3Qgb2YgZm9vbGlzaG5lc3MgYnV0IHRoZSBhdHRyaWJ1dGUgYW5kIGlubmVyIHN0cmVuZ3RoIHRvIGFjdCB3aGVuIG90aGVycyB3aWxsIG5vdCBzbyBhcyB0byBtb3ZlIGZvcndhcmQgbm90IGJhY2t3YXJkLiINCiJEYWlzYWt1IElrZWRhIiwiSWYgd2UgbG9vayBhdCB0aGUgd29ybGQgd2l0aCBhIGxvdmUgb2YgbGlmZSwgdGhlIHdvcmxkIHdpbGwgcmV2ZWFsIGl0cyBiZWF1dHkgdG8gdXMuIg0KIlJhbHBoIEVtZXJzb24iLCJJbiBza2F0aW5nIG92ZXIgdGhpbiBpY2Ugb3VyIHNhZmV0eSBpcyBpbiBvdXIgc3BlZWQuIg0KIlcuIENsZW1lbnQgU3RvbmUiLCJXaGVuIHlvdSBkaXNjb3ZlciB5b3VyIG1pc3Npb24sIHlvdSB3aWxsIGZlZWwgaXRzIGRlbWFuZC4gSXQgd2lsbCBmaWxsIHlvdSB3aXRoIGVudGh1c2lhc20gYW5kIGEgYnVybmluZyBkZXNpcmUgdG8gZ2V0IHRvIHdvcmsgb24gaXQuIg0KIlB1YmxpbGl1cyBTeXJ1cyIsIk5ldmVyIHByb21pc2UgbW9yZSB0aGFuIHlvdSBjYW4gcGVyZm9ybS4iDQoiTm9yYSBSb2JlcnRzIiwiSWYgeW91IGRvbid0IGdvIGFmdGVyIHdoYXQgeW91IHdhbnQsIHlvdSdsbCBuZXZlciBoYXZlIGl0LiBJZiB5b3UgZG9uJ3QgYXNrLCB0aGUgYW5zd2VyIGlzIGFsd2F5cyBuby4gSWYgeW91IGRvbid0IHN0ZXAgZm9yd2FyZCwgeW91J3JlIGFsd2F5cyBpbiB0aGUgc2FtZSBwbGFjZS4iDQoiTG91IEhvbHR6IiwiSSBjYW4ndCBiZWxpZXZlIHRoYXQgR29kIHB1dCB1cyBvbiB0aGlzIGVhcnRoIHRvIGJlIG9yZGluYXJ5LiINCiJOYXBvbGVvbiBIaWxsIiwiVGhlcmUgYXJlIG5vIGxpbWl0YXRpb25zIHRvIHRoZSBtaW5kIGV4Y2VwdCB0aG9zZSB3ZSBhY2tub3dsZWRnZS4iDQoiSnVsZXMgUG9pbmNhcmUiLCJJdCBpcyB0aHJvdWdoIHNjaWVuY2UgdGhhdCB3ZSBwcm92ZSwgYnV0IHRocm91Z2ggaW50dWl0aW9uIHRoYXQgd2UgZGlzY292ZXIuIg0KIlJpY2hhcmQgQmFjaCIsIkRvbid0IGJlIGRpc21heWVkIGJ5IGdvb2QtYnllcy4gQSBmYXJld2VsbCBpcyBuZWNlc3NhcnkgYmVmb3JlIHlvdSBjYW4gbWVldCBhZ2Fpbi4gQW5kIG1lZXRpbmcgYWdhaW4sIGFmdGVyIG1vbWVudHMgb3IgbGlmZXRpbWVzLCBpcyBjZXJ0YWluIGZvciB0aG9zZSB3aG8gYXJlIGZyaWVuZHMuIg0KIkNhcmxhIEdvcmRvbiIsIklmIHNvbWVvbmUgaW4geW91ciBsaWZlIHRhbGtlZCB0byB5b3UgdGhlIHdheSB5b3UgdGFsayB0byB5b3Vyc2VsZiwgeW91IHdvdWxkIGhhdmUgbGVmdCB0aGVtIGxvbmcgYWdvLiINCiJFZHdhcmQgRXJpY3NvbiIsIlRoZSBjb3Ntb3MgaXMgbmVpdGhlciBtb3JhbCBvciBpbW1vcmFsOyBvbmx5IHBlb3BsZSBhcmUuIEhlIHdobyB3b3VsZCBtb3ZlIHRoZSB3b3JsZCBtdXN0IGZpcnN0IG1vdmUgaGltc2VsZi4iDQoiRGFpc2FrdSBJa2VkYSIsIklmIHlvdSBsb3NlIHRvZGF5LCB3aW4gdG9tb3Jyb3cuIEluIHRoaXMgbmV2ZXItZW5kaW5nIHNwaXJpdCBvZiBjaGFsbGVuZ2UgaXMgdGhlIGhlYXJ0IG9mIGEgdmljdG9yLiINCiJMaW5kYSBIb2dhbiIsIlRoZXJlIGlzIGEgd2F5IHRoYXQgbmF0dXJlIHNwZWFrcywgdGhhdCBsYW5kIHNwZWFrcy4gTW9zdCBvZiB0aGUgdGltZSB3ZSBhcmUgc2ltcGx5IG5vdCBwYXRpZW50IGVub3VnaCwgcXVpZXQgZW5vdWdoLCB0byBwYXkgYXR0ZW50aW9uIHRvIHRoZSBzdG9yeS4iDQoiR2VvcmcgTGljaHRlbmJlcmciLCJJIGNhbm5vdCBzYXkgd2hldGhlciB0aGluZ3Mgd2lsbCBnZXQgYmV0dGVyIGlmIHdlIGNoYW5nZTsgd2hhdCBJIGNhbiBzYXkgaXMgdGhleSBtdXN0IGNoYW5nZSBpZiB0aGV5IGFyZSB0byBnZXQgYmV0dGVyLiINCiJFY2toYXJ0IFRvbGxlIiwiVGhlIGdyZWF0ZXIgcGFydCBvZiBodW1hbiBwYWluIGlzIHVubmVjZXNzYXJ5LiBJdCBpcyBzZWxmLWNyZWF0ZWQgYXMgbG9uZyBhcyB0aGUgdW5vYnNlcnZlZCBtaW5kIHJ1bnMgeW91ciBsaWZlLiINCiJBbGV4YW5kZXIgUG9wZSIsIkJsZXNzZWQgaXMgdGhlIG1hbiB3aG8gZXhwZWN0cyBub3RoaW5nLCBmb3IgaGUgc2hhbGwgbmV2ZXIgYmUgZGlzYXBwb2ludGVkLiINCiJMYW8gVHp1IiwiSGUgd2hvIGtub3dzIG90aGVycyBpcyB3aXNlLiBIZSB3aG8ga25vd3MgaGltc2VsZiBpcyBlbmxpZ2h0ZW5lZC4iDQoiUGV0ZXIgRHJ1Y2tlciIsIlRoZSBiZXN0IHdheSB0byBwcmVkaWN0IHlvdXIgZnV0dXJlIGlzIHRvIGNyZWF0ZSBpdC4iDQoiTWF5IFNhcnRvbiIsIkEgZ2FyZGVuIGlzIGFsd2F5cyBhIHNlcmllcyBvZiBsb3NzZXMgc2V0IGFnYWluc3QgYSBmZXcgdHJpdW1waHMsIGxpa2UgbGlmZSBpdHNlbGYuIg0KIlJhY2hlbCBDYXJzb24iLCJJZiBmYWN0cyBhcmUgdGhlIHNlZWRzIHRoYXQgbGF0ZXIgcHJvZHVjZSBrbm93bGVkZ2UgYW5kIHdpc2RvbSwgdGhlbiB0aGUgZW1vdGlvbnMgYW5kIHRoZSBpbXByZXNzaW9ucyBvZiB0aGUgc2Vuc2VzIGFyZSB0aGUgZmVydGlsZSBzb2lsIGluIHdoaWNoIHRoZSBzZWVkcyBtdXN0IGdyb3cuIg0KIkVybmVzdCBIZW1pbmd3YXkiLCJOZXZlciBtaXN0YWtlIG1vdGlvbiBmb3IgYWN0aW9uLiINCiJIYW5uYWggU2VuZXNoIiwiT25lIG5lZWRzIHNvbWV0aGluZyB0byBiZWxpZXZlIGluLCBzb21ldGhpbmcgZm9yIHdoaWNoIG9uZSBjYW4gaGF2ZSB3aG9sZS1oZWFydGVkIGVudGh1c2lhc20uIE9uZSBuZWVkcyB0byBmZWVsIHRoYXQgb25lcyBsaWZlIGhhcyBtZWFuaW5nLCB0aGF0IG9uZSBpcyBuZWVkZWQgaW4gdGhpcyB3b3JsZC4iDQoiTGFvIFR6dSIsIk9uZSB3aG8gaXMgdG9vIGluc2lzdGVudCBvbiBoaXMgb3duIHZpZXdzLCBmaW5kcyBmZXcgdG8gYWdyZWUgd2l0aCBoaW0uIg0KIkhhcnJ5IEJ1cmNoZWxsIE1hdGhld3MiLCJUcmFuc2xhdGlvbiBpcyB0aGUgcGFyYWRpZ20sIHRoZSBleGVtcGxhciBvZiBhbGwgd3JpdGluZy4gSXQgaXMgdHJhbnNsYXRpb24gdGhhdCBkZW1vbnN0cmF0ZXMgbW9zdCB2aXZpZGx5IHRoZSB5ZWFybmluZyBmb3IgdHJhbnNmb3JtYXRpb24gdGhhdCB1bmRlcmxpZXMgZXZlcnkgYWN0IGludm9sdmluZyBzcGVlY2gsIHRoYXQgc3VwcmVtZWx5IGh1bWFuIGdpZnQuIg0KIlZvbHRhaXJlIiwiTWVkaXRhdGlvbiBpcyB0aGUgZGlzc29sdXRpb24gb2YgdGhvdWdodHMgaW4gZXRlcm5hbCBhd2FyZW5lc3Mgb3IgUHVyZSBjb25zY2lvdXNuZXNzIHdpdGhvdXQgb2JqZWN0aWZpY2F0aW9uLCBrbm93aW5nIHdpdGhvdXQgdGhpbmtpbmcsIG1lcmdpbmcgZmluaXR1ZGUgaW4gaW5maW5pdHkuIg0KIkdlb3JnZSBTaGF3IiwiVGhlIHJlYXNvbmFibGUgbWFuIGFkYXB0cyBoaW1zZWxmIHRvIHRoZSB3b3JsZDsgdGhlIHVucmVhc29uYWJsZSBtYW4gcGVyc2lzdHMgaW4gdHJ5aW5nIHRvIGFkYXB0IHRoZSB3b3JsZCB0byBoaW1zZWxmLiBUaGVyZWZvcmUsIGFsbCBwcm9ncmVzcyBkZXBlbmRzIG9uIHRoZSB1bnJlYXNvbmFibGUgbWFuLiINCiJNaWNoYWVsIEJ1cmtlIiwiR29vZCBpbnN0aW5jdHMgdXN1YWxseSB0ZWxsIHlvdSB3aGF0IHRvIGRvIGxvbmcgYmVmb3JlIHlvdXIgaGVhZCBoYXMgZmlndXJlZCBpdCBvdXQuIg0KIlBlbWEgQ2hvZHJvbiIsIkl0IGlzbid0IHdoYXQgaGFwcGVucyB0byB1cyB0aGF0IGNhdXNlcyB1cyB0byBzdWZmZXI7IGl0J3Mgd2hhdCB3ZSBzYXkgdG8gb3Vyc2VsdmVzIGFib3V0IHdoYXQgaGFwcGVucy4iDQoiRWRnYXIgQWxsYW4gUG9lIiwiVGhvc2Ugd2hvIGRyZWFtIGJ5IGRheSBhcmUgY29nbml6YW50IG9mIG1hbnkgdGhpbmdzIHdoaWNoIGVzY2FwZSB0aG9zZSB3aG8gZHJlYW0gb25seSBieSBuaWdodC4iDQoiQmVuIFN3ZWV0bGFuZCIsIldlIGNhbm5vdCBob2xkIGEgdG9yY2ggdG8gbGlnaHQgYW5vdGhlcidzIHBhdGggd2l0aG91dCBicmlnaHRlbmluZyBvdXIgb3duLiINCiJSaWNoYXJkIEJhY2giLCJZb3UgYXJlIG5ldmVyIGdpdmVuIGEgd2lzaCB3aXRob3V0IGFsc28gYmVpbmcgZ2l2ZW4gdGhlIHBvd2VyIHRvIG1ha2UgaXQgY29tZSB0cnVlLiBZb3UgbWF5IGhhdmUgdG8gd29yayBmb3IgaXQsIGhvd2V2ZXIuIg0KIk1vdGhlciBUZXJlc2EiLCJLaW5kIHdvcmRzIGNhbiBiZSBzaG9ydCBhbmQgZWFzeSB0byBzcGVhaywgYnV0IHRoZWlyIGVjaG9lcyBhcmUgdHJ1bHkgZW5kbGVzcy4iDQoiIiwiQ291bnQgeW91ciBqb3lzIGluc3RlYWQgb2YgeW91ciB3b2VzLiBDb3VudCB5b3VyIGZyaWVuZHMgaW5zdGVhZCBvZiB5b3VyIGZvZXMuIg0KIkpvaG4gVXBkaWtlIiwiRHJlYW1zIGNvbWUgdHJ1ZS4gV2l0aG91dCB0aGF0IHBvc3NpYmlsaXR5LCBuYXR1cmUgd291bGQgbm90IGluY2l0ZSB1cyB0byBoYXZlIHRoZW0uIg0KIkJ5cm9uIFB1bHNpZmVyIiwiU3RheWluZyBpbiBvbmUgcGxhY2UgaXMgdGhlIGJlc3QgcGF0aCB0byBiZSB0YWtlbiBvdmVyIGFuZCBzdXJwYXNzZWQgYnkgbWFueS4iDQoiQ2FybCBTYWdhbiIsIkltYWdpbmF0aW9uIHdpbGwgb2Z0ZW4gY2FycnkgdXMgdG8gd29ybGRzIHRoYXQgbmV2ZXIgd2VyZS4gQnV0IHdpdGhvdXQgaXQgd2UgZ28gbm93aGVyZS4iDQoiSGVsZW4gS2VsbGVyIiwiV2hlbiBvbmUgZG9vciBvZiBoYXBwaW5lc3MgY2xvc2VzLCBhbm90aGVyIG9wZW5zOyBidXQgb2Z0ZW4gd2UgbG9vayBzbyBsb25nIGF0IHRoZSBjbG9zZWQgZG9vciB0aGF0IHdlIGRvIG5vdCBzZWUgdGhlIG9uZSB3aGljaCBoYXMgYmVlbiBvcGVuZWQgZm9yIHVzLiINCiJKYXdhaGFybGFsIE5laHJ1IiwiQSBsZWFkZXIgb3IgYSBtYW4gb2YgYWN0aW9uIGluIGEgY3Jpc2lzIGFsbW9zdCBhbHdheXMgYWN0cyBzdWJjb25zY2lvdXNseSBhbmQgdGhlbiB0aGlua3Mgb2YgdGhlIHJlYXNvbnMgZm9yIGhpcyBhY3Rpb24uIg0KIkFsYmVydCBFaW5zdGVpbiIsIkkgaGF2ZSBubyBzcGVjaWFsIHRhbGVudC4gSSBhbSBvbmx5IHBhc3Npb25hdGVseSBjdXJpb3VzLiINCiJFbGl6YWJldGggTW9udGFndSIsIkkgZW5kZWF2b3VyIHRvIGJlIHdpc2Ugd2hlbiBJIGNhbm5vdCBiZSBtZXJyeSwgZWFzeSB3aGVuIEkgY2Fubm90IGJlIGdsYWQsIGNvbnRlbnQgd2l0aCB3aGF0IGNhbm5vdCBiZSBtZW5kZWQgYW5kIHBhdGllbnQgd2hlbiB0aGVyZSBpcyBubyByZWRyZXNzLiINCiJXaWxsaWFtIFNjb2xhdmlubyIsIlRoZSBoZWlnaHQgb2YgeW91ciBhY2NvbXBsaXNobWVudHMgd2lsbCBlcXVhbCB0aGUgZGVwdGggb2YgeW91ciBjb252aWN0aW9ucy4iDQoiUmFiYmkgSGlsbGVsIiwiSWYgSSBhbSBub3QgZm9yIG15c2VsZiwgd2hvIHdpbGwgYmUgZm9yIG1lPyBJZiBJIGFtIG5vdCBmb3Igb3RoZXJzLCB3aGF0IGFtIEk/IEFuZCBpZiBub3Qgbm93LCB3aGVuPyINCiJBdWRyZSBMb3JkZSIsIldoZW4gSSBkYXJlIHRvIGJlIHBvd2VyZnVsLCB0byB1c2UgbXkgc3RyZW5ndGggaW4gdGhlIHNlcnZpY2Ugb2YgbXkgdmlzaW9uLCB0aGVuIGl0IGJlY29tZXMgbGVzcyBhbmQgbGVzcyBpbXBvcnRhbnQgd2hldGhlciBJIGFtIGFmcmFpZC4iDQoiQWxleGlzIENhcnJlbCIsIkFsbCBncmVhdCBtZW4gYXJlIGdpZnRlZCB3aXRoIGludHVpdGlvbi4gVGhleSBrbm93IHdpdGhvdXQgcmVhc29uaW5nIG9yIGFuYWx5c2lzLCB3aGF0IHRoZXkgbmVlZCB0byBrbm93LiINCiJNYXJrIFR3YWluIiwiVG8gZ2V0IHRoZSBmdWxsIHZhbHVlIG9mIGpveSB5b3UgbXVzdCBoYXZlIHNvbWVvbmUgdG8gZGl2aWRlIGl0IHdpdGguIg0KIkpvaGFubiBXb2xmZ2FuZyB2b24gR29ldGhlIiwiU29tZXRpbWVzIG91ciBmYXRlIHJlc2VtYmxlcyBhIGZydWl0IHRyZWUgaW4gd2ludGVyLiBXaG8gd291bGQgdGhpbmsgdGhhdCB0aG9zZSBicmFuY2hlcyB3b3VsZCB0dXJuIGdyZWVuIGFnYWluIGFuZCBibG9zc29tLCBidXQgd2UgaG9wZSBpdCwgd2Uga25vdyBpdC4iDQoiTGVvIFRvbHN0b3kiLCJXZSBsb3N0IGJlY2F1c2Ugd2UgdG9sZCBvdXJzZWx2ZXMgd2UgbG9zdC4iDQoiSmFtZXMgUGVuY2UiLCJTdWNjZXNzIGlzIGRldGVybWluZWQgYnkgdGhvc2Ugd2hvbSBwcm92ZSB0aGUgaW1wb3NzaWJsZSwgcG9zc2libGUuIg0KIkFnYXRoYSBDaHJpc3RpZSIsIkdvb2QgYWR2aWNlIGlzIGFsd2F5cyBjZXJ0YWluIHRvIGJlIGlnbm9yZWQsIGJ1dCB0aGF0J3Mgbm8gcmVhc29uIG5vdCB0byBnaXZlIGl0LiINCiJEYWxlIEVhcm5oYXJkdCIsIlRoZSB3aW5uZXIgYWluJ3QgdGhlIG9uZSB3aXRoIHRoZSBmYXN0ZXN0IGNhciBpdCdzIHRoZSBvbmUgd2hvIHJlZnVzZXMgdG8gbG9zZS4iDQoiUm9iZXJ0IEMuIFNvbG9tb24iLCJTcGlyaXR1YWxpdHkgY2FuIGJlIHNldmVyZWQgZnJvbSBib3RoIHZpY2lvdXMgc2VjdGFyaWFuaXNtIGFuZCB0aG91Z2h0bGVzcyBiYW5hbGl0aWVzLiBTcGlyaXR1YWxpdHksIEkgaGF2ZSBjb21lIHRvIHNlZSwgaXMgbm90aGluZyBsZXNzIHRoYW4gdGhlIHRob3VnaHRmdWwgbG92ZSBvZiBsaWZlLiINCiJTYW0gUmF5YnVybiIsIk5vIG9uZSBoYXMgYSBmaW5lciBjb21tYW5kIG9mIGxhbmd1YWdlIHRoYW4gdGhlIHBlcnNvbiB3aG8ga2VlcHMgaGlzIG1vdXRoIHNodXQuIg0KIkRlbmlzIFdhaXRsZXkiLCJUaGUgb25seSBwZXJzb24gd2hvIG5ldmVyIG1ha2VzIG1pc3Rha2VzIGlzIHRoZSBwZXJzb24gd2hvIG5ldmVyIGRvZXMgYW55dGhpbmcuIg0KIkpvaG4gTGVubm9uIiwiTGlmZSBpcyB3aGF0IGhhcHBlbnMgdG8geW91IHdoaWxlIHlvdSdyZSBidXN5IG1ha2luZyBvdGhlciBwbGFucy4iDQoiSm9uYXRoYW4gU3dpZnQiLCJEaXNjb3ZlcnkgY29uc2lzdHMgb2Ygc2VlaW5nIHdoYXQgZXZlcnlib2R5IGhhcyBzZWVuIGFuZCB0aGlua2luZyB3aGF0IG5vYm9keSBlbHNlIGhhcyB0aG91Z2h0LiINCiJNYXJnYXJldCBGdWxsZXIiLCJJZiB5b3UgaGF2ZSBrbm93bGVkZ2UsIGxldCBvdGhlcnMgbGlnaHQgdGhlaXIgY2FuZGxlcyBpbiBpdC4iDQoiRXBpY3RldHVzIiwiSXQgaXMgaW1wb3NzaWJsZSBmb3IgYSBtYW4gdG8gbGVhcm4gd2hhdCBoZSB0aGlua3MgaGUgYWxyZWFkeSBrbm93cy4iDQoiV2lsbCBSb2dlcnMiLCJJZiB5b3UgZmluZCB5b3Vyc2VsZiBpbiBhIGhvbGUsIHRoZSBmaXJzdCB0aGluZyB0byBkbyBpcyBzdG9wIGRpZ2dpbmcuIg0KIlBsdXRhcmNoIiwiVG8gbWFrZSBubyBtaXN0YWtlcyBpcyBub3QgaW4gdGhlIHBvd2VyIG9mIG1hbjsgYnV0IGZyb20gdGhlaXIgZXJyb3JzIGFuZCBtaXN0YWtlcyB0aGUgd2lzZSBhbmQgZ29vZCBsZWFybiB3aXNkb20gZm9yIHRoZSBmdXR1cmUuIg0KIkxlZSBXb21hY2siLCJJIHRoaW5rIHlvdSBjYW4gaGF2ZSBtb2RlcmF0ZSBzdWNjZXNzIGJ5IGNvcHlpbmcgc29tZXRoaW5nIGVsc2UsIGJ1dCBpZiB5b3UgcmVhbGx5IHdhbnQgdG8ga25vY2sgaXQgb3V0IG9mIHRoZSBwYXJrLCB5b3UgaGF2ZSB0byBkbyBzb21ldGhpbmcgZGlmZmVyZW50IGFuZCB0YWtlIGNoYW5jZXMuIg0KIk1hcmN1cyBBdXJlbGl1cyIsIkV2ZXJ5dGhpbmcgd2UgaGVhciBpcyBhbiBvcGluaW9uLCBub3QgYSBmYWN0LiBFdmVyeXRoaW5nIHdlIHNlZSBpcyBhIHBlcnNwZWN0aXZlLCBub3QgdGhlIHRydXRoLiINCiJXaWxsaWFtIE1lbm5pbmdlciIsIlNpeCBlc3NlbnRpYWwgcXVhbGl0aWVzIHRoYXQgYXJlIHRoZSBrZXkgdG8gc3VjY2VzczogU2luY2VyaXR5LCBwZXJzb25hbCBpbnRlZ3JpdHksIGh1bWlsaXR5LCBjb3VydGVzeSwgd2lzZG9tLCBjaGFyaXR5LiINCiJMdWNpbGxlIEJhbGwiLCJJIGhhdmUgYW4gZXZlcnlkYXkgcmVsaWdpb24gdGhhdCB3b3JrcyBmb3IgbWUuIExvdmUgeW91cnNlbGYgZmlyc3QsIGFuZCBldmVyeXRoaW5nIGVsc2UgZmFsbHMgaW50byBsaW5lLiINCiJDaHVhbmcgVHp1IiwiRmxvdyB3aXRoIHdoYXRldmVyIGlzIGhhcHBlbmluZyBhbmQgbGV0IHlvdXIgbWluZCBiZSBmcmVlLiBTdGF5IGNlbnRyZWQgYnkgYWNjZXB0aW5nIHdoYXRldmVyIHlvdSBhcmUgZG9pbmcuIFRoaXMgaXMgdGhlIHVsdGltYXRlLiINCiJKYW5lIEFkZGFtcyIsIk5vdGhpbmcgY291bGQgYmUgd29yc2UgdGhhbiB0aGUgZmVhciB0aGF0IG9uZSBoYWQgZ2l2ZW4gdXAgdG9vIHNvb24sIGFuZCBsZWZ0IG9uZSB1bmV4cGVuZGVkIGVmZm9ydCB0aGF0IG1pZ2h0IGhhdmUgc2F2ZWQgdGhlIHdvcmxkLiINCiJBcmlzdG90bGUiLCJUaGUgZW5lcmd5IG9mIHRoZSBtaW5kIGlzIHRoZSBlc3NlbmNlIG9mIGxpZmUuIg0KIkhvcmFjZSIsIkJlZ2luLCBiZSBib2xkLCBhbmQgdmVudHVyZSB0byBiZSB3aXNlLiINCiJMYW8gVHp1IiwiR2l2ZSBhIG1hbiBhIGZpc2ggYW5kIHlvdSBmZWVkIGhpbSBmb3IgYSBkYXkuIFRlYWNoIGhpbSBob3cgdG8gZmlzaCBhbmQgeW91IGZlZWQgaGltIGZvciBhIGxpZmV0aW1lLiINCiJGcmFuY2lzIEJhY29uIiwiQSB3aXNlIG1hbiB3aWxsIG1ha2UgbW9yZSBvcHBvcnR1bml0aWVzIHRoYW4gaGUgZmluZHMuIg0KIkVkZGllIENhbnRvciIsIlNsb3cgZG93biBhbmQgZW5qb3kgbGlmZS4gSXQncyBub3Qgb25seSB0aGUgc2NlbmVyeSB5b3UgbWlzcyBieSBnb2luZyB0b28gZmFzdCwgeW91IGFsc28gbWlzcyB0aGUgc2Vuc2Ugb2Ygd2hlcmUgeW91IGFyZSBnb2luZyBhbmQgd2h5LiINCiJXYXluZSBEeWVyIiwiTWlyYWNsZXMgY29tZSBpbiBtb21lbnRzLiBCZSByZWFkeSBhbmQgd2lsbGluZy4iDQoiU29waG9jbGVzIiwiTnVtYmVybGVzcyBhcmUgdGhlIHdvcmxkcyB3b25kZXJzLCBidXQgbm9uZSBtb3JlIHdvbmRlcmZ1bCB0aGFuIG1hbi4iDQoiUmFscGggRW1lcnNvbiIsIlNvIGlzIGNoZWVyZnVsbmVzcywgb3IgYSBnb29kIHRlbXBlciwgdGhlIG1vcmUgaXQgaXMgc3BlbnQsIHRoZSBtb3JlIHJlbWFpbnMuIg0KIkZyYW5jb2lzZSBkZSBNb3R0ZXZpbGxlIiwiVGhlIHRydWUgd2F5IHRvIHJlbmRlciBvdXJzZWx2ZXMgaGFwcHkgaXMgdG8gbG92ZSBvdXIgd29yayBhbmQgZmluZCBpbiBpdCBvdXIgcGxlYXN1cmUuIg0KIldheW5lIER5ZXIiLCJXaGVuIHlvdSBqdWRnZSBhbm90aGVyLCB5b3UgZG8gbm90IGRlZmluZSB0aGVtLCB5b3UgZGVmaW5lIHlvdXJzZWxmLiINCiJSaWNoYXJkIEJhY2giLCJBcmd1ZSBmb3IgeW91ciBsaW1pdGF0aW9ucywgYW5kIHN1cmUgZW5vdWdoIHRoZXkncmUgeW91cnMuIg0KIkNvbmZ1Y2l1cyIsIkhlIHdobyB3aXNoZXMgdG8gc2VjdXJlIHRoZSBnb29kIG9mIG90aGVycywgaGFzIGFscmVhZHkgc2VjdXJlZCBoaXMgb3duLiINCiJQbGF0byIsIldpc2UgbWVuIHRhbGsgYmVjYXVzZSB0aGV5IGhhdmUgc29tZXRoaW5nIHRvIHNheTsgZm9vbHMsIGJlY2F1c2UgdGhleSBoYXZlIHRvIHNheSBzb21ldGhpbmcuIg0KIkNvbmZ1Y2l1cyIsIkxpZmUgaXMgcmVhbGx5IHNpbXBsZSwgYnV0IHdlIGluc2lzdCBvbiBtYWtpbmcgaXQgY29tcGxpY2F0ZWQuIg0KIkppbSBCaXNob3AiLCJUaGUgZnV0dXJlIGlzIGFuIG9wYXF1ZSBtaXJyb3IuIEFueW9uZSB3aG8gdHJpZXMgdG8gbG9vayBpbnRvIGl0IHNlZXMgbm90aGluZyBidXQgdGhlIGRpbSBvdXRsaW5lcyBvZiBhbiBvbGQgYW5kIHdvcnJpZWQgZmFjZS4iDQoiQ2FybCBKdW5nIiwiRXZlcnl0aGluZyB0aGF0IGlycml0YXRlcyB1cyBhYm91dCBvdGhlcnMgY2FuIGxlYWQgdXMgdG8gYSBiZXR0ZXIgdW5kZXJzdGFuZGluZyBvZiBvdXJzZWx2ZXMuIg0KIiIsIkJld2FyZSBvZiB0aGUgaGFsZiB0cnV0aC4gWW91IG1heSBoYXZlIGdvdHRlbiBob2xkIG9mIHRoZSB3cm9uZyBoYWxmLiINCiJFbGJlcnQgSHViYmFyZCIsIlRoZSBncmVhdGVzdCBtaXN0YWtlIHlvdSBjYW4gbWFrZSBpbiBsaWZlIGlzIHRvIGJlIGNvbnRpbnVhbGx5IGZlYXJpbmcgeW91IHdpbGwgbWFrZSBvbmUuIg0KIkNhbHZpbiBDb29saWRnZSIsIkkgaGF2ZSBuZXZlciBiZWVuIGh1cnQgYnkgYW55dGhpbmcgSSBkaWRuJ3Qgc2F5LiINCiJUaG9tYXMgS2VtcGlzIiwiQmUgbm90IGFuZ3J5IHRoYXQgeW91IGNhbm5vdCBtYWtlIG90aGVycyBhcyB5b3Ugd2lzaCB0aGVtIHRvIGJlLCBzaW5jZSB5b3UgY2Fubm90IG1ha2UgeW91cnNlbGYgYXMgeW91IHdpc2ggdG8gYmUuIg0KIldpbGxpYW0gV2FyZCIsIkFkdmVyc2l0eSBjYXVzZXMgc29tZSBtZW4gdG8gYnJlYWssIG90aGVycyB0byBicmVhayByZWNvcmRzLiINCiJUaG9tYXMgRnVsbGVyIiwiQW4gaW52aW5jaWJsZSBkZXRlcm1pbmF0aW9uIGNhbiBhY2NvbXBsaXNoIGFsbW9zdCBhbnl0aGluZyBhbmQgaW4gdGhpcyBsaWVzIHRoZSBncmVhdCBkaXN0aW5jdGlvbiBiZXR3ZWVuIGdyZWF0IG1lbiBhbmQgbGl0dGxlIG1lbi4iDQoiQWJlcm5hdGh5IiwiVGhlIGluZHVzdHJpYWwgbGFuZHNjYXBlIGlzIGFscmVhZHkgbGl0dGVyZWQgd2l0aCByZW1haW5zIG9mIG9uY2Ugc3VjY2Vzc2Z1bCBjb21wYW5pZXMgdGhhdCBjb3VsZCBub3QgYWRhcHQgdGhlaXIgc3RyYXRlZ2ljIHZpc2lvbiB0byBhbHRlcmVkIGNvbmRpdGlvbnMgb2YgY29tcGV0aXRpb24uIg0KIkNocmlzdGlhbiBCb3ZlZSIsIkV4YW1wbGUgaGFzIG1vcmUgZm9sbG93ZXJzIHRoYW4gcmVhc29uLiINCiJFcGljdGV0dXMiLCJPbmUgdGhhdCBkZXNpcmVzIHRvIGV4Y2VsIHNob3VsZCBlbmRlYXZvdXIgaW4gdGhvc2UgdGhpbmdzIHRoYXQgYXJlIGluIHRoZW1zZWx2ZXMgbW9zdCBleGNlbGxlbnQuIg0KIk1hcnkgUGlja2ZvcmQiLCJJZiB5b3UgaGF2ZSBtYWRlIG1pc3Rha2VzLCB0aGVyZSBpcyBhbHdheXMgYW5vdGhlciBjaGFuY2UgZm9yIHlvdS4gWW91IG1heSBoYXZlIGEgZnJlc2ggc3RhcnQgYW55IG1vbWVudCB5b3UgY2hvb3NlLiINCiJSb2JlcnQgUGlyc2lnIiwiVGhlIG9ubHkgWmVuIHlvdSBmaW5kIG9uIHRoZSB0b3BzIG9mIG1vdW50YWlucyBpcyB0aGUgWmVuIHlvdSBicmluZyB1cCB0aGVyZS4iDQoiRG9yaXMgRGF5IiwiR3JhdGl0dWRlIGlzIHJpY2hlcy4gQ29tcGxhaW50IGlzIHBvdmVydHkuIg0KIlJpY2hhcmQgTmVlZGhhbSIsIlN0cm9uZyBwZW9wbGUgbWFrZSBhcyBtYW55IG1pc3Rha2VzIGFzIHdlYWsgcGVvcGxlLiBEaWZmZXJlbmNlIGlzIHRoYXQgc3Ryb25nIHBlb3BsZSBhZG1pdCB0aGVpciBtaXN0YWtlcywgbGF1Z2ggYXQgdGhlbSwgbGVhcm4gZnJvbSB0aGVtLiBUaGF0IGlzIGhvdyB0aGV5IGJlY29tZSBzdHJvbmcuIg0KIkJ5cm9uIFB1bHNpZmVyIiwiVG8ga25vdyB5b3VyIHB1cnBvc2UgaXMgdG8gbGl2ZSBhIGxpZmUgb2YgZGlyZWN0aW9uLCBhbmQgaW4gdGhhdCBkaXJlY3Rpb24gaXMgZm91bmQgcGVhY2UgYW5kIHRyYW5xdWlsbGl0eS4iDQoiSGFycmlldCBXb29kcyIsIllvdSBjYW4gc3RhbmQgdGFsbCB3aXRob3V0IHN0YW5kaW5nIG9uIHNvbWVvbmUuIFlvdSBjYW4gYmUgYSB2aWN0b3Igd2l0aG91dCBoYXZpbmcgdmljdGltcy4iDQoiUmFscGggRW1lcnNvbiIsIkJhZCB0aW1lcyBoYXZlIGEgc2NpZW50aWZpYyB2YWx1ZS4gVGhlc2UgYXJlIG9jY2FzaW9ucyBhIGdvb2QgbGVhcm5lciB3b3VsZCBub3QgbWlzcy4iDQoiIiwiSXQncyBub3Qgd2hvIHlvdSBhcmUgdGhhdCBob2xkcyB5b3UgYmFjaywgaXQncyB3aG8geW91IHRoaW5rIHlvdSdyZSBub3QuIg0KIlBhYmxvIFBpY2Fzc28iLCJBbGwgY2hpbGRyZW4gYXJlIGFydGlzdHMuIFRoZSBwcm9ibGVtIGlzIGhvdyB0byByZW1haW4gYW4gYXJ0aXN0IG9uY2UgaGUgZ3Jvd3MgdXAuIg0KIlBoaWxpcCBTaWRuZXkiLCJFaXRoZXIgSSB3aWxsIGZpbmQgYSB3YXksIG9yIEkgd2lsbCBtYWtlIG9uZS4iDQoiTGFvIFR6dSIsIkhlIHdobyBrbm93cyB0aGF0IGVub3VnaCBpcyBlbm91Z2ggd2lsbCBhbHdheXMgaGF2ZSBlbm91Z2guIg0KIlJhbHBoIEVtZXJzb24iLCJUaGUgb25seSB3YXkgdG8gaGF2ZSBhIGZyaWVuZCBpcyB0byBiZSBvbmUuIg0KIkFubmUgQnJhZHN0cmVldCIsIklmIHdlIGhhZCBubyB3aW50ZXIsIHRoZSBzcHJpbmcgd291bGQgbm90IGJlIHNvIHBsZWFzYW50OyBpZiB3ZSBkaWQgbm90IHNvbWV0aW1lcyB0YXN0ZSBvZiBhZHZlcnNpdHksIHByb3NwZXJpdHkgd291bGQgbm90IGJlIHNvIHdlbGNvbWUuIg0KIk1hcmlhbm5lIFdpbGxpYW1zb24iLCJKb3kgaXMgd2hhdCBoYXBwZW5zIHRvIHVzIHdoZW4gd2UgYWxsb3cgb3Vyc2VsdmVzIHRvIHJlY29nbml6ZSBob3cgZ29vZCB0aGluZ3MgcmVhbGx5IGFyZS4iDQoiQ2FybCBKdW5nIiwiWW91ciB2aXNpb24gd2lsbCBiZWNvbWUgY2xlYXIgb25seSB3aGVuIHlvdSBjYW4gbG9vayBpbnRvIHlvdXIgb3duIGhlYXJ0LiBXaG8gbG9va3Mgb3V0c2lkZSwgZHJlYW1zOyB3aG8gbG9va3MgaW5zaWRlLCBhd2FrZXMuIg0KIkJyaWFuIFRyYWN5IiwiVGhlcmUgaXMgbmV2ZXIgZW5vdWdoIHRpbWUgdG8gZG8gZXZlcnl0aGluZywgYnV0IHRoZXJlIGlzIGFsd2F5cyBlbm91Z2ggdGltZSB0byBkbyB0aGUgbW9zdCBpbXBvcnRhbnQgdGhpbmcuIg0KIk1hcmlhbiBFZGVsbWFuIiwiWW91IHJlYWxseSBjYW4gY2hhbmdlIHRoZSB3b3JsZCBpZiB5b3UgY2FyZSBlbm91Z2guIg0KIkJ1ZGRoYSIsIldoYXQgeW91IGFyZSBpcyB3aGF0IHlvdSBoYXZlIGJlZW4uIFdoYXQgeW91J2xsIGJlIGlzIHdoYXQgeW91IGRvIG5vdy4iDQoiR29yZG9uIEhpbmNrbGV5IiwiT3VyIGxpdmVzIGFyZSB0aGUgb25seSBtZWFuaW5nZnVsIGV4cHJlc3Npb24gb2Ygd2hhdCB3ZSBiZWxpZXZlIGFuZCBpbiBXaG9tIHdlIGJlbGlldmUuIEFuZCB0aGUgb25seSByZWFsIHdlYWx0aCwgZm9yIGFueSBvZiB1cywgbGllcyBpbiBvdXIgZmFpdGguIg0KIkJlbmphbWluIEhheWRvbiIsIlRoZXJlIHN1cmVseSBpcyBpbiBodW1hbiBuYXR1cmUgYW4gaW5oZXJlbnQgcHJvcGVuc2l0eSB0byBleHRyYWN0IGFsbCB0aGUgZ29vZCBvdXQgb2YgYWxsIHRoZSBldmlsLiINCiJMYW8gVHp1IiwiTXVzaWMgaW4gdGhlIHNvdWwgY2FuIGJlIGhlYXJkIGJ5IHRoZSB1bml2ZXJzZS4iDQoiSm9obiBMdWJib2NrIiwiV2hhdCB3ZSBzZWUgZGVwZW5kcyBtYWlubHkgb24gd2hhdCB3ZSBsb29rIGZvci4iDQoiQnJ1Y2UgTGVlIiwiVG8gaGVsbCB3aXRoIGNpcmN1bXN0YW5jZXM7IEkgY3JlYXRlIG9wcG9ydHVuaXRpZXMuIg0KIkVsbGEgV2lsY294IiwiVGhlIHRydWVzdCBncmVhdG5lc3MgbGllcyBpbiBiZWluZyBraW5kLCB0aGUgdHJ1ZXN0IHdpc2RvbSBpbiBhIGhhcHB5IG1pbmQuIg0KIkpvaG4gSnVub3IiLCJBbiBvdW5jZSBvZiBlbW90aW9uIGlzIGVxdWFsIHRvIGEgdG9uIG9mIGZhY3RzLiINCiJCYXJiYXJhIERlIEFuZ2VsaXMiLCJXZSBuZWVkIHRvIGZpbmQgdGhlIGNvdXJhZ2UgdG8gc2F5IE5PIHRvIHRoZSB0aGluZ3MgYW5kIHBlb3BsZSB0aGF0IGFyZSBub3Qgc2VydmluZyB1cyBpZiB3ZSB3YW50IHRvIHJlZGlzY292ZXIgb3Vyc2VsdmVzIGFuZCBsaXZlIG91ciBsaXZlcyB3aXRoIGF1dGhlbnRpY2l0eS4iDQoiTGF6dXJ1cyBMb25nIiwiR3JlYXQgaXMgdGhlIGFydCBvZiBiZWdpbm5pbmcsIGJ1dCBncmVhdGVyIGlzIHRoZSBhcnQgb2YgZW5kaW5nLiINCiJXYXluZSBEeWVyIiwiU2ltcGx5IHB1dCwgeW91IGJlbGlldmVyIHRoYXQgdGhpbmdzIG9yIHBlb3BsZSBtYWtlIHlvdSB1bmhhcHB5LCBidXQgdGhpcyBpcyBub3QgYWNjdXJhdGUuIFlvdSBtYWtlIHlvdXJzZWxmIHVuaGFwcHkuIg0KIk1heWEgQW5nZWxvdSIsIk5vdGhpbmcgd2lsbCB3b3JrIHVubGVzcyB5b3UgZG8uIg0KIkNhdGhlcmluZSBQdWxzaWZlciIsIk91ciBhYmlsaXR5IHRvIGFjaGlldmUgaGFwcGluZXNzIGFuZCBzdWNjZXNzIGRlcGVuZHMgb24gdGhlIHN0cmVuZ3RoIG9mIG91ciB3aW5ncy4iDQoiVGhlb2RvcmUgSC4gV2hpdGUiLCJUbyBnbyBhZ2FpbnN0IHRoZSBkb21pbmFudCB0aGlua2luZyBvZiB5b3VyIGZyaWVuZHMsIG9mIG1vc3Qgb2YgdGhlIHBlb3BsZSB5b3Ugc2VlIGV2ZXJ5IGRheSwgaXMgcGVyaGFwcyB0aGUgbW9zdCBkaWZmaWN1bHQgYWN0IG9mIGhlcm9pc20geW91IGNhbiBwZXJmb3JtLiINCiJNZWxvZHkgQmVhdHRpZSIsIkdyYXRpdHVkZSBtYWtlcyBzZW5zZSBvZiBvdXIgcGFzdCwgYnJpbmdzIHBlYWNlIGZvciB0b2RheSwgYW5kIGNyZWF0ZXMgYSB2aXNpb24gZm9yIHRvbW9ycm93LiINCiJCeXJvbiBQdWxzaWZlciIsIkludG8gZWFjaCBsaWZlIHJhaW4gbXVzdCBmYWxsIGJ1dCByYWluIGNhbiBiZSB0aGUgZ2l2ZXIgb2YgbGlmZSBhbmQgaXQgaXMgYWxsIGluIHlvdXIgYXR0aXR1ZGUgdGhhdCBtYWtlcyByYWluIHByb2R1Y2Ugc3Vuc2hpbmUuIg0KIkhhcm9sZCBOaWNvbHNvbiIsIldlIGFyZSBhbGwgaW5jbGluZWQgdG8ganVkZ2Ugb3Vyc2VsdmVzIGJ5IG91ciBpZGVhbHM7IG90aGVycywgYnkgdGhlaXIgYWN0cy4iDQoiUm9kaW4iLCJOb3RoaW5nIGlzIGEgd2FzdGUgb2YgdGltZSBpZiB5b3UgdXNlIHRoZSBleHBlcmllbmNlIHdpc2VseS4iDQoiQXJpc3RvdGxlIiwiSWYgb25lIHdheSBiZSBiZXR0ZXIgdGhhbiBhbm90aGVyLCB0aGF0IHlvdSBtYXkgYmUgc3VyZSBpcyBuYXR1cmVzIHdheS4iDQoiTmFwb2xlb24gSGlsbCIsIkhlcmUgaXMgb25lIHF1YWxpdHkgdGhhdCBvbmUgbXVzdCBwb3NzZXNzIHRvIHdpbiwgYW5kIHRoYXQgaXMgZGVmaW5pdGVuZXNzIG9mIHB1cnBvc2UsIHRoZSBrbm93bGVkZ2Ugb2Ygd2hhdCBvbmUgd2FudHMsIGFuZCBhIGJ1cm5pbmcgZGVzaXJlIHRvIHBvc3Nlc3MgaXQuIg0KIldpbGxpYW0gU2hha2VzcGVhcmUiLCJJdCBpcyBub3QgaW4gdGhlIHN0YXJzIHRvIGhvbGQgb3VyIGRlc3RpbnkgYnV0IGluIG91cnNlbHZlcy4iDQoiVG9ueSBSb2JiaW5zIiwiVXNpbmcgdGhlIHBvd2VyIG9mIGRlY2lzaW9uIGdpdmVzIHlvdSB0aGUgY2FwYWNpdHkgdG8gZ2V0IHBhc3QgYW55IGV4Y3VzZSB0byBjaGFuZ2UgYW55IGFuZCBldmVyeSBwYXJ0IG9mIHlvdXIgbGlmZSBpbiBhbiBpbnN0YW50LiINCiJBYnJhaGFtIExpbmNvbG4iLCJJIHdpbGwgcHJlcGFyZSBhbmQgc29tZSBkYXkgbXkgY2hhbmNlIHdpbGwgY29tZS4iDQoiVG9tIEphY2tzb24iLCJTb21ldGltZXMgdGhlIGNhcmRzIHdlIGFyZSBkZWFsdCBhcmUgbm90IGFsd2F5cyBmYWlyLiBIb3dldmVyIHlvdSBtdXN0IGtlZXAgc21pbGluZyBhbmQgbW92aW5nIG9uLiINCiJBcm5vbGQgU2Nod2FyemVuZWdnZXIiLCJTdHJlbmd0aCBkb2VzIG5vdCBjb21lIGZyb20gd2lubmluZy4gWW91ciBzdHJ1Z2dsZXMgZGV2ZWxvcCB5b3VyIHN0cmVuZ3Rocy4gV2hlbiB5b3UgZ28gdGhyb3VnaCBoYXJkc2hpcHMgYW5kIGRlY2lkZSBub3QgdG8gc3VycmVuZGVyLCB0aGF0IGlzIHN0cmVuZ3RoLiINCiJBcm5vbGQgU2Nod2FyemVuZWdnZXIiLCJGb3IgbWUgbGlmZSBpcyBjb250aW51b3VzbHkgYmVpbmcgaHVuZ3J5LiBUaGUgbWVhbmluZyBvZiBsaWZlIGlzIG5vdCBzaW1wbHkgdG8gZXhpc3QsIHRvIHN1cnZpdmUsIGJ1dCB0byBtb3ZlIGFoZWFkLCB0byBnbyB1cCwgdG8gYWNoaWV2ZSwgdG8gY29ucXVlci4iDQoiQXJub2xkIFNjaHdhcnplbmVnZ2VyIiwiSSBzYXcgYSB3b21hbiB3ZWFyaW5nIGEgc3dlYXRzaGlydCB3aXRoIEd1ZXNzIG9uIGl0LiBJIHNhaWQsIFRoeXJvaWQgcHJvYmxlbT8iDQoiQXJub2xkIFNjaHdhcnplbmVnZ2VyIiwiQm9keWJ1aWxkaW5nIGlzIG11Y2ggbGlrZSBhbnkgb3RoZXIgc3BvcnQuIFRvIGJlIHN1Y2Nlc3NmdWwsIHlvdSBtdXN0IGRlZGljYXRlIHlvdXJzZWxmIDEwMCUgdG8geW91ciB0cmFpbmluZywgZGlldCBhbmQgbWVudGFsIGFwcHJvYWNoLiINCiJBcm5vbGQgU2Nod2FyemVuZWdnZXIiLCJJdCdzIHNpbXBsZSwgaWYgaXQgamlnZ2xlcywgaXQncyBmYXQuIg0KIkFybm9sZCBTY2h3YXJ6ZW5lZ2dlciIsIlRoZSByZXNpc3RhbmNlIHRoYXQgeW91IGZpZ2h0IHBoeXNpY2FsbHkgaW4gdGhlIGd5bSBhbmQgdGhlIHJlc2lzdGFuY2UgdGhhdCB5b3UgZmlnaHQgaW4gbGlmZSBjYW4gb25seSBidWlsZCBhIHN0cm9uZyBjaGFyYWN0ZXIuIg0KIkFybm9sZCBTY2h3YXJ6ZW5lZ2dlciIsIlRoZSBtaW5kIGlzIHRoZSBsaW1pdC4gQXMgbG9uZyBhcyB0aGUgbWluZCBjYW4gZW52aXNpb24gdGhlIGZhY3QgdGhhdCB5b3UgY2FuIGRvIHNvbWV0aGluZywgeW91IGNhbiBkbyBpdCwgYXMgbG9uZyBhcyB5b3UgcmVhbGx5IGJlbGlldmUgMTAwIHBlcmNlbnQuIg0KIkFybm9sZCBTY2h3YXJ6ZW5lZ2dlciIsIlRoZSBsYXN0IHRocmVlIG9yIGZvdXIgcmVwcyBpcyB3aGF0IG1ha2VzIHRoZSBtdXNjbGUgZ3Jvdy4gVGhpcyBhcmVhIG9mIHBhaW4gZGl2aWRlcyB0aGUgY2hhbXBpb24gZnJvbSBzb21lb25lIGVsc2Ugd2hvIGlzIG5vdCBhIGNoYW1waW9uLiBUaGF0J3Mgd2hhdCBtb3N0IHBlb3BsZSBsYWNrLCBoYXZpbmcgdGhlIGd1dHMgdG8gZ28gb24gYW5kIGp1c3Qgc2F5IHRoZXknbGwgZ28gdGhyb3VnaCB0aGUgcGFpbiBubyBtYXR0ZXIgd2hhdCBoYXBwZW5zLiINCiJBcm5vbGQgU2Nod2FyemVuZWdnZXIiLCJIZWxwIG90aGVycyBhbmQgZ2l2ZSBzb21ldGhpbmcgYmFjay4gSSBndWFyYW50ZWUgeW91IHdpbGwgZGlzY292ZXIgdGhhdCB3aGlsZSBwdWJsaWMgc2VydmljZSBpbXByb3ZlcyB0aGUgbGl2ZXMgYW5kIHRoZSB3b3JsZCBhcm91bmQgeW91LCBpdHMgZ3JlYXRlc3QgcmV3YXJkIGlzIHRoZSBlbnJpY2htZW50IGFuZCBuZXcgbWVhbmluZyBpdCB3aWxsIGJyaW5nIHlvdXIgb3duIGxpZmUuIg0KIkFybm9sZCBTY2h3YXJ6ZW5lZ2dlciIsIldoYXQgd2UgZmFjZSBtYXkgbG9vayBpbnN1cm1vdW50YWJsZS4gQnV0IEkgbGVhcm5lZCBzb21ldGhpbmcgZnJvbSBhbGwgdGhvc2UgeWVhcnMgb2YgdHJhaW5pbmcgYW5kIGNvbXBldGluZy4gSSBsZWFybmVkIHNvbWV0aGluZyBmcm9tIGFsbCB0aG9zZSBzZXRzIGFuZCByZXBzIHdoZW4gSSBkaWRuJ3QgdGhpbmsgSSBjb3VsZCBsaWZ0IGFub3RoZXIgb3VuY2Ugb2Ygd2VpZ2h0LiBXaGF0IEkgbGVhcm5lZCBpcyB0aGF0IHdlIGFyZSBhbHdheXMgc3Ryb25nZXIgdGhhbiB3ZSBrbm93LiINCiJBcm5vbGQgU2Nod2FyemVuZWdnZXIiLCJUaGUgZnV0dXJlIGlzIGdyZWVuIGVuZXJneSwgc3VzdGFpbmFiaWxpdHksIHJlbmV3YWJsZSBlbmVyZ3kuIg0KIkFybm9sZCBTY2h3YXJ6ZW5lZ2dlciIsIlRoZSB3b3JzdCB0aGluZyBJIGNhbiBiZSBpcyB0aGUgc2FtZSBhcyBldmVyeWJvZHkgZWxzZS4gSSBoYXRlIHRoYXQuIg0KIkFybm9sZCBTY2h3YXJ6ZW5lZ2dlciIsIkZhaWx1cmUgaXMgbm90IGFuIG9wdGlvbi4gRXZlcnlvbmUgaGFzIHRvIHN1Y2NlZWQuIg0KIkFybm9sZCBTY2h3YXJ6ZW5lZ2dlciIsIlN0YXJ0IHdpZGUsIGV4cGFuZCBmdXJ0aGVyLCBhbmQgbmV2ZXIgbG9vayBiYWNrLiINCiJBcm5vbGQgU2Nod2FyemVuZWdnZXIiLCJUcmFpbmluZyBnaXZlcyB1cyBhbiBvdXRsZXQgZm9yIHN1cHByZXNzZWQgZW5lcmdpZXMgY3JlYXRlZCBieSBzdHJlc3MgYW5kIHRodXMgdG9uZXMgdGhlIHNwaXJpdCBqdXN0IGFzIGV4ZXJjaXNlIGNvbmRpdGlvbnMgdGhlIGJvZHkuIg0KIkFybm9sZCBTY2h3YXJ6ZW5lZ2dlciIsIk15IGJvZHkgaXMgbGlrZSBicmVha2Zhc3QsIGx1bmNoLCBhbmQgZGlubmVyLiBJIGRvbid0IHRoaW5rIGFib3V0IGl0LCBJIGp1c3QgaGF2ZSBpdC4iDQoiQXJub2xkIFNjaHdhcnplbmVnZ2VyIiwiSSB3ZWxjb21lIGFuZCBzZWVrIHlvdXIgaWRlYXMsIGJ1dCBkbyBub3QgYnJpbmcgbWUgc21hbGwgaWRlYXM7IGJyaW5nIG1lIGJpZyBpZGVhcyB0byBtYXRjaCBvdXIgZnV0dXJlLiINCiJBcm5vbGQgU2Nod2FyemVuZWdnZXIiLCJBcyBsb25nIGFzIEkgbGl2ZSwgSSB3aWxsIG5ldmVyIGZvcmdldCB0aGF0IGRheSAyMSB5ZWFycyBhZ28gd2hlbiBJIHJhaXNlZCBteSBoYW5kIGFuZCB0b29rIHRoZSBvYXRoIG9mIGNpdGl6ZW5zaGlwLiBEbyB5b3Uga25vdyBob3cgcHJvdWQgSSB3YXM/IEkgd2FzIHNvIHByb3VkIHRoYXQgSSB3YWxrZWQgYXJvdW5kIHdpdGggYW4gQW1lcmljYW4gZmxhZyBhcm91bmQgbXkgc2hvdWxkZXJzIGFsbCBkYXkgbG9uZy4iDQoiQXJub2xkIFNjaHdhcnplbmVnZ2VyIiwiSSBqdXN0IHVzZSBteSBtdXNjbGVzIGFzIGEgY29udmVyc2F0aW9uIHBpZWNlLCBsaWtlIHNvbWVvbmUgd2Fsa2luZyBhIGNoZWV0YWggZG93biA0Mm5kIFN0cmVldC4iDQoiQXJub2xkIFNjaHdhcnplbmVnZ2VyIiwiQXMgeW91IGtub3csIEknbSBhbiBpbW1pZ3JhbnQuIEkgY2FtZSBvdmVyIGhlcmUgYXMgYW4gaW1taWdyYW50LCBhbmQgd2hhdCBnYXZlIG1lIHRoZSBvcHBvcnR1bml0aWVzLCB3aGF0IG1hZGUgbWUgdG8gYmUgaGVyZSB0b2RheSwgaXMgdGhlIG9wZW4gYXJtcyBvZiBBbWVyaWNhbnMuIEkgaGF2ZSBiZWVuIHJlY2VpdmVkLiBJIGhhdmUgYmVlbiBhZG9wdGVkIGJ5IEFtZXJpY2EuIg0KIkFybm9sZCBTY2h3YXJ6ZW5lZ2dlciIsIkluIG91ciBzb2NpZXR5LCB0aGUgd29tZW4gd2hvIGJyZWFrIGRvd24gYmFycmllcnMgYXJlIHRob3NlIHdobyBpZ25vcmUgbGltaXRzLiINCiJBcm5vbGQgU2Nod2FyemVuZWdnZXIiLCJMZWFybmVkIGhlbHBsZXNzbmVzcyBpcyB0aGUgZ2l2aW5nLXVwIHJlYWN0aW9uLCB0aGUgcXVpdHRpbmcgcmVzcG9uc2UgdGhhdCBmb2xsb3dzIGZyb20gdGhlIGJlbGllZiB0aGF0IHdoYXRldmVyIHlvdSBkbyBkb2Vzbid0IG1hdHRlci4iDQoiQXJub2xkIFNjaHdhcnplbmVnZ2VyIiwiTXkgb3duIGRyZWFtcyBmb3J0dW5hdGVseSBjYW1lIHRydWUgaW4gdGhpcyBncmVhdCBzdGF0ZS4gSSBiZWNhbWUgTXIuIFVuaXZlcnNlOyBJIGJlY2FtZSBhIHN1Y2Nlc3NmdWwgYnVzaW5lc3NtYW4uIEFuZCBldmVuIHRob3VnaCBzb21lIHBlb3BsZSBzYXkgSSBzdGlsbCBzcGVhayB3aXRoIGEgc2xpZ2h0IGFjY2VudCwgSSBoYXZlIHJlYWNoZWQgdGhlIHRvcCBvZiB0aGUgYWN0aW5nIHByb2Zlc3Npb24uIg0KIkFybm9sZCBTY2h3YXJ6ZW5lZ2dlciIsIklmIGl0J3MgaGFyZCB0byByZW1lbWJlciwgaXQnbGwgYmUgZGlmZmljdWx0IHRvIGZvcmdldC4i","base64"))});
}).call(this)}).call(this,require('_process'),require("buffer").Buffer)
},{"_process":4,"buffer":2}]},{},[5]);
