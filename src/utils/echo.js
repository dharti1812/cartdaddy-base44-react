import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { API_BASE_URL } from "../config";

window.Pusher = Pusher;

export const createEcho = () => {
  return new Echo({
    broadcaster: "pusher",
    key: "11dd2f12bedcec7c70a3",
    cluster: "ap2",
    forceTLS: true,
    authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    },
  });
};