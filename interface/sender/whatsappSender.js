/**
 * SOCCOS-AutoBot
 * WhatsApp Sender
 * ----------------
 * Responsible ONLY for sending messages to WhatsApp API
 */

const axios = require('axios');
const env = require('../../config/env');

/**
 * Send message to WhatsApp Cloud API
 */
async function sendMessage(payload) {
    try {
        const url = `https://graph.facebook.com/${env.whatsapp.apiVersion}/${env.whatsapp.phoneNumberId}/messages`;

        const response = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${env.whatsapp.token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Message sent successfully');
        return response.data;

    } catch (error) {
        console.error('❌ WhatsApp Send Error:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = {
    sendMessage
};
