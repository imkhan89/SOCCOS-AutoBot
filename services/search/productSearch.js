const shopifyClient = require("../../integrations/shopifyClient");

async function search(query) {
  return await shopifyClient.searchProducts(query);
}

module.exports = { search };
