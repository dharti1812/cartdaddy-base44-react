import { API_BASE_URL } from "../../config";

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token"); 

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const bankOfferApi = {
  saveOffers(productId, offers) {
    return fetch(`${API_BASE_URL}/api/bank-offers`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        product_id: productId,
        offers: offers,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    });
  },

  getStates() {
    return fetch(`${API_BASE_URL}/api/locations/states`, {
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },

  getCities(stateIds) {
    return fetch(`${API_BASE_URL}/api/locations/cities`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ state_ids: stateIds }),
    }).then(res => res.json());
  },

  getOffersByProduct(productId) {
    return fetch(`${API_BASE_URL}/api/bank-offers/product/${productId}`, {
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },

  deleteOffer(offerId) {
    return fetch(`${API_BASE_URL}/api/bank-offers/${offerId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    });
  },


};