const axios = require('axios');

const API_URL = 'http://localhost:5001/api/events';

const eventData = {
    name: "Test Event Reproduction",
    description: "Testing event creation from script",
    address: "Test Address",
    lat: 28.6139,
    lng: 77.2090,
    date: "2025-12-01T10:00:00",
    ticketPrice: 100,
    userId: "test-user-repro",
    telegramChatId: "123456789"
};

async function createEvent() {
    try {
        console.log('Sending request to:', API_URL);
        console.log('Payload:', eventData);
        const response = await axios.post(API_URL, eventData);
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

createEvent();
