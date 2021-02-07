const _ = {
  clamp(number, lower, upper) {
    let clampedNumber = number;
    clampedNumber = Math.max(clampedNumber, lower);
    clampedNumber = Math.min(clampedNumber, upper);
    return clampedNumber;
  },
  inRange(number, start, end) {
    if(end === undefined) {
      end = start;
      start = 0;
    }
    if(start > end) {
      let swap = start;
      start = end;
      end = swap;
    }
    return (number >= start && number < end);
  },
  words(str) {
    return str.split(' ');
  },
  pad(str, num) {
    if (str.length > num) return str;
    const totalPad = num - str.length;
    const frontPad = Math.floor(totalPad / 2);
    const backPad = totalPad - frontPad;
    const padChar = ' ';
    return padChar.repeat(frontPad) + str + padChar.repeat(backPad);
  },
  has(obj, key) {
    return (obj[key] ? true : false);
  },
  invert(obj) {
    const invertedObj = {};
    for (const [key, value] of Object.entries(obj)) {
      invertedObj[value] = key;
    }
    return invertedObj;
  },
  findKey(obj, func) {
    for (const [key, value] of Object.entries(obj)) {
      if(func(value)) return key;
    }
    return undefined;
  },
  drop(arr, n=1) {
    return arr.slice(n);
  },
  dropWhile(arr, func) {
    for(let i = 0; i < arr.length; i++) {
      if(!func(arr[i], i, arr)) return this.drop(arr, i);
    }
  },
  chunk(arr, size=1) {
    const inChunk = [];
    for(let i = 0; i < arr.length; i += 2) {
      inChunk.push(arr.slice(i, i + size));
    }
    return inChunk;
  }
};

// Do not write or modify code below this line.
module.exports = _;