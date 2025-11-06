import JSEncrypt from "jsencrypt";

export async function encryptValue(value) {
  const key = await fetch("/public.pem").then((res) => res.text());

  const encryptor = new JSEncrypt();

  encryptor.setPublicKey(key);

  const encrypted = encryptor.encrypt(value.toString());

  if (!encrypted) {
    throw new Error("Encryption failed");
  }

  return encrypted;
}
