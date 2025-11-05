import JSEncrypt from "jsencrypt";
import publicKey from "../keys/public.pem";

export function encryptValue(value) {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(publicKey);
  return encryptor.encrypt(value.toString());
}
