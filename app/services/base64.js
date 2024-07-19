import { Buffer } from 'buffer'

global.Buffer = Buffer

export function btoa(input) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  const str = input
  let output = ''

  for (
    let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || ((map = '='), i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
  ) {
    charCode = str.charCodeAt((i += 3 / 4))

    if (charCode > 0xff) {
      throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.")
    }

    block = (block << 8) | charCode
  }

  return output
}

export function atob(input) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  const str = input.replace(/=+$/, '')
  let output = ''

  if (str.length % 4 == 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.")
  }
  for (
    let bc = 0, bs = 0, buffer, i = 0;
    (buffer = str.charAt(i++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer)
  }

  return output
}

export function base64ToHex(str) {
  return Buffer.from(str.replace(/[ \r\n]+$/, ''), 'base64').toString('hex')
}

export function hexToBytes(hex) {
  const values = hex.match(/../g)
  if (values && values.length) return values.map(x => parseInt(x, 16))
  return 0
}

export function base64ToBytes(str) {
  return Buffer.from(str, 'base64')
}

export function hexStringToByte(str) {
  if (!str) {
    return new Uint8Array();
  }
  
  var a = [];
  for (var i = 0, len = str.length; i < len; i+=2) {
    a.push(parseInt(str.substr(i,2),16));
  }
  
  return new Uint8Array(a);
}
