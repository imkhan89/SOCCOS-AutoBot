const axios = require("axios");

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

const BASE_URL = `https://${SHOPIFY_STORE}/admin/api/2024-01`;

async function searchProducts(query) {
  try {
    const response = await axios.get(`${BASE_URL}/products.json`, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
        "Content-Type": "application/json",
      },
      params: {
        limit: 10,
      },
    });

    const products = response.data.products || [];

    // 🔍 simple keyword filter
    return products.filter((p) =>
      p.title.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    console.error("❌ Shopify Search Error:", error.message);
    return [];
  }
}

async function createOrder(customerName, product) {
  try {
    const orderPayload = {
      order: {
        line_items: [
          {
            variant_id: product.variants[0].id,
            quantity: 1,
          },
        ],
        customer: {
          first_name: customerName,
        },
      },
    };

    const response = await axios.post(
      `${BASE_URL}/orders.json`,
      orderPayload,
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.order;
  } catch (error) {
    console.error("❌ Shopify Order Error:", error.message);
    return null;
  }
}

module.exports = {
  searchProducts,
  createOrder,
};
