function base64UrlEncode(buffer){
    const bytes = new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateCodeVerifier(length = 64){
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return base64UrlEncode(array.buffer)
}

export async function generateCodeChallenge(codeVerifier){
    const data = new TextEncoder().encode(codeVerifier)
    const digest = await crypto.subtle.digest("SHA-256", data)
    return base64UrlEncode(digest)
}

export function generateState(length = 16){
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return base64UrlEncode(array.buffer)
}