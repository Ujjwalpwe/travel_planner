// Sample itinerary data
const itineraryData = [
    { id: 1, name: "Paris Adventure", destination: "Paris, France", startDate: "2025-05-15", endDate: "2025-05-22", notes: "First time in Paris, want to see the Eiffel Tower and Louvre", status: "upcoming" },
    { id: 2, name: "Beach Getaway", destination: "Bali, Indonesia", startDate: "2025-07-10", endDate: "2025-07-20", notes: "Relaxation trip with beach activities and local cuisine", status: "upcoming" },
    { id: 3, name: "NYC Weekend", destination: "New York City, USA", startDate: "2025-03-05", endDate: "2025-03-08", notes: "Quick city break to see Broadway shows and visit museums", status: "past" },
    { id: 4, name: "Tokyo Exploration", destination: "Tokyo, Japan", startDate: "2024-11-12", endDate: "2024-11-22", notes: "Exploring Japanese culture, food, and technology", status: "past" },
    { id: 5, name: "Italian Cuisine Tour", destination: "Rome & Florence, Italy", startDate: "2024-09-18", endDate: "2024-09-28", notes: "Food tour focusing on authentic Italian cuisine", status: "past" },
    { id: 6, name: "Swiss Alps Hiking", destination: "Interlaken, Switzerland", startDate: "2024-08-03", endDate: "2024-08-10", notes: "Mountain hiking and outdoor activities", status: "past" },
    { id: 7, name: "Greek Island Hopping", destination: "Santorini & Mykonos, Greece", startDate: "2024-06-20", endDate: "2024-06-30", notes: "Exploring multiple Greek islands and beaches", status: "past" },
    { id: 8, name: "Safari Adventure", destination: "Serengeti, Tanzania", startDate: "2024-05-15", endDate: "2024-05-25", notes: "Wildlife safari with photography focus", status: "past" },
    { id: 9, name: "Northern Lights", destination: "Reykjavik, Iceland", startDate: "2024-02-10", endDate: "2024-02-17", notes: "Winter trip to see the aurora borealis", status: "past" },
    { id: 10, name: "Southeast Asia Tour", destination: "Thailand, Vietnam, Cambodia", startDate: "2025-09-12", endDate: "2025-10-03", notes: "Multi-country backpacking adventure", status: "upcoming" }
];

// DOM elements
const itineraryList = document.getElementById('itineraryList');
const tripFilter = document.getElementById('tripFilter');
const searchTrips = document.getElementById('searchTrips');
const createTripBtn = document.getElementById('createTripBtn');
const tripModal = document.getElementById('tripModal');
const tripForm = document.getElementById('tripForm');
const modalTitle = document.getElementById('modalTitle');
const closeModal = document.querySelector('.close-modal');
const cancelTrip = document.getElementById('cancelTrip');
const chatMessages = document.getElementById('chatMessages');
const userMessage = document.getElementById('userMessage');
const sendMessage = document.getElementById('sendMessage');
const assistantMode = document.getElementById('assistantMode');

// Gemini API configuration
const API_KEY = 'AIzaSyCTq1DoZ008rovrJ55vim_7-W3rBZTZpdk'; // Replace with your real API key
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadItineraries();
    setupEventListeners();
});

// Load itineraries based on filter
function loadItineraries(filter = 'all', searchTerm = '') {
    itineraryList.innerHTML = '';

    const filteredData = itineraryData.filter(trip => {
        if (filter !== 'all' && trip.status !== filter) return false;
        if (searchTerm && !trip.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !trip.destination.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    if (filteredData.length === 0) {
        itineraryList.innerHTML = '<p class="no-results">No itineraries found.</p>';
        return;
    }

    filteredData.forEach(trip => {
        const card = document.createElement('div');
        card.className = `itinerary-card ${trip.status === 'past' ? 'past-trip' : ''}`;

        const startDate = new Date(trip.startDate);
        const endDate = new Date(trip.endDate);
        const formattedStartDate = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const formattedEndDate = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        card.innerHTML = `
            <h3>${trip.name}</h3>
            <div class="dates">${formattedStartDate} - ${formattedEndDate}</div>
            <div class="location">${trip.destination}</div>
            <div class="notes">${trip.notes}</div>
            <span class="tag ${trip.status}">${trip.status === 'upcoming' ? 'Upcoming' : 'Past'}</span>
            <div class="card-actions">
                <button class="btn secondary view-details" data-id="${trip.id}">View Details</button>
                ${trip.status === 'upcoming' ? `<button class="btn primary modify-trip" data-id="${trip.id}">Modify Trip</button>` : ''}
            </div>
        `;

        itineraryList.appendChild(card);
    });

    document.querySelectorAll('.modify-trip').forEach(button => {
        button.addEventListener('click', () => openEditModal(button.dataset.id));
    });

    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', () => viewTripDetails(button.dataset.id));
    });
}

// Set up event listeners
function setupEventListeners() {
    tripFilter.addEventListener('change', () => loadItineraries(tripFilter.value, searchTrips.value));
    searchTrips.addEventListener('input', () => loadItineraries(tripFilter.value, searchTrips.value));
    createTripBtn.addEventListener('click', openCreateModal);
    closeModal.addEventListener('click', closeModalWindow);
    cancelTrip.addEventListener('click', closeModalWindow);

    tripForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveTrip();
    });

    sendMessage.addEventListener('click', sendUserMessage);
    userMessage.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendUserMessage();
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target === tripModal) {
            closeModalWindow();
        }
    });
}

// Open modal for creating a new trip
function openCreateModal() {
    modalTitle.textContent = 'Create New Trip';
    tripForm.reset();
    document.getElementById('tripId').value = '';

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 8);

    document.getElementById('startDate').value = formatDateForInput(tomorrow);
    document.getElementById('endDate').value = formatDateForInput(nextWeek);

    tripModal.style.display = 'block';
}

// Open modal for editing an existing trip
function openEditModal(tripId) {
    const trip = itineraryData.find(t => t.id == tripId);
    if (!trip) return;

    modalTitle.textContent = 'Modify Trip';
    document.getElementById('tripName').value = trip.name;
    document.getElementById('destination').value = trip.destination;
    document.getElementById('startDate').value = trip.startDate;
    document.getElementById('endDate').value = trip.endDate;
    document.getElementById('tripNotes').value = trip.notes;
    document.getElementById('tripId').value = trip.id;

    tripModal.style.display = 'block';
}

// Close the modal window
function closeModalWindow() {
    tripModal.style.display = 'none';
}

// Save trip data
function saveTrip() {
    const tripId = document.getElementById('tripId').value;
    const tripData = {
        name: document.getElementById('tripName').value,
        destination: document.getElementById('destination').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        notes: document.getElementById('tripNotes').value,
        status: 'upcoming'
    };

    if (tripId) {
        const index = itineraryData.findIndex(t => t.id == tripId);
        if (index !== -1) {
            itineraryData[index] = { ...itineraryData[index], ...tripData };
            alert('Trip updated successfully!');
        }
    } else {
        const newId = Math.max(...itineraryData.map(t => t.id)) + 1;
        itineraryData.push({ id: newId, ...tripData });
        alert('New trip created successfully!');
    }

    closeModalWindow();
    loadItineraries(tripFilter.value, searchTrips.value);
}

// Format date for input fields
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// View trip details
function viewTripDetails(tripId) {
    const trip = itineraryData.find(t => t.id == tripId);
    if (!trip) return;

    const message = `Show me details for my trip to ${trip.destination} from ${trip.startDate} to ${trip.endDate}`;
    userMessage.value = message;
    sendUserMessage();
}

// Send user message
function sendUserMessage() {
    const message = userMessage.value.trim();
    if (!message) return;

    addMessageToChat(message, 'user');
    userMessage.value = '';

    sendToGemini(message);
}

// Add message to chat UI
function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;

    if (sender === 'assistant') {
        messageElement.innerHTML = `<p>${marked.parse(message)}</p>`;
    } else {
        messageElement.innerText = message;
    }

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message to Gemini API
async function sendToGemini(message) {
    try {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message assistant typing';
        typingIndicator.innerHTML = '<p>Typing...</p>';
        chatMessages.appendChild(typingIndicator);

        const mode = assistantMode.value;
        let context = "";

        switch (mode) {
            case 'itinerary':
                context = "You are a travel planning assistant. Help the user plan their itinerary with specific recommendations.";
                break;
            case 'recommendations':
                context = "You are a travel recommendation specialist. Suggest specific places, activities, and experiences.";
                break;
            default:
                context = "You are a helpful travel assistant.";
        }

        if (message.includes("my trip") || message.includes("itinerary")) {
            context += " User's upcoming trips: " + JSON.stringify(itineraryData.filter(t => t.status === 'upcoming'));
        }

        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: context },
                            { text: message }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 800
                }
            })
        });

        const result = await response.json();
        const aiMessage = result?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't fetch a response.";
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Add AI response
        addMessageToChat(aiMessage, 'assistant');
    } catch (error) {
        console.error('Error sending message to Gemini:', error);
        typingIndicator.remove();
        addMessageToChat("Error communicating with AI. Please try again later.", 'assistant');
    }
}
