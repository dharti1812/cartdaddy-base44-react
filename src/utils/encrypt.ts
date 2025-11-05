import JSEncrypt from "jsencrypt";

export async function encryptValue(value) {
  const key = await fetch("/public.pem").then((r) => r.text());

  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(key);

  return encryptor.encrypt(value.toString());
}
