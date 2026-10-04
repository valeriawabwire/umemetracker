const Api = {
  pin: null,

  async request(method, url, body) {
    const options = { method: method, headers: { "Content-Type": "application/json" } };
    if (Api.pin) options.headers["X-Household-Pin"] = Api.pin;
    if (body !== undefined) options.body = JSON.stringify(body);

    let response;
    try {
      response = await fetch(url, options);
    } catch (err) {
      throw new Error("Cannot reach the server. Is runserver still running?");
    }

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      data = null;
    }

    if (!response.ok) {
      throw new Error((data && data.error) || "Server error (" + response.status + "). Check the terminal running runserver.");
    }
    if (data === null) throw new Error("The server sent an unexpected response.");
    return data;
  },

  createHousehold: (d) => Api.request("POST", "/api/households/", d),
  login: (d) => Api.request("POST", "/api/households/login/", d),

  listPurchases: (hid) => Api.request("GET", "/api/households/" + hid + "/purchases/"),
  addPurchase: (hid, d) => Api.request("POST", "/api/households/" + hid + "/purchases/", d),
  updatePurchase: (id, d) => Api.request("PUT", "/api/purchases/" + id + "/", d),
  deletePurchase: (id) => Api.request("DELETE", "/api/purchases/" + id + "/"),

  listAppliances: (hid) => Api.request("GET", "/api/households/" + hid + "/appliances/"),
  addAppliance: (hid, d) => Api.request("POST", "/api/households/" + hid + "/appliances/", d),
  deleteAppliance: (id) => Api.request("DELETE", "/api/appliances/" + id + "/"),
};
