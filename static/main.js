import { Card } from './card.js';

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Global array of cards.
let cards = [];

// Global variable to track the selected card.
let selectedCard = null;

// Global variables for dragging.
let draggingCard = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// --- Event Handling ---
canvas.addEventListener("mousedown", async (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    // Iterate in reverse order (topmost card first).
    for (let i = cards.length - 1; i >= 0; i--) {
        let card = cards[i];
        if (card.isInside(mx, my)) {
            // Mark this card as selected.
            selectedCard = card;
            
            // Check if a button was clicked.
            let button = card.buttonAt(mx, my);
            if (button) {
                if (button === "duplicate") {
                    // Duplicate the card by creating a new one with a slight offset.
                    let newCard = new Card(card.x + 20, card.y + 20);
                    cards.push(newCard);
                    redraw();
                    return;
                } else if (button === "remove") {
                    // Remove this card.
                    cards.splice(i, 1);
                    redraw();
                    return;
                } else if (button === "expand") {
                    // Prepare 4 prompt variations
                    const prompt = selectedCard.prompt;
                    const variations = await generatePromptVariations(prompt);

                    // Expand: create four new cards around this card.
                    const offset = 10;
                    let newCards = [];
                    let topCard = new Card(card.x, card.y - card.height - offset);
                    let bottomCard = new Card(card.x, card.y + card.height + offset);
                    let leftCard = new Card(card.x - card.width - offset, card.y);
                    let rightCard = new Card(card.x + card.width + offset, card.y);
                    cards.push(topCard, bottomCard, leftCard, rightCard);
                    newCards.push(topCard, bottomCard, leftCard, rightCard);
                    redraw();

                    // Generate 4 new images
                    for (let i = 0 ; i < newCards.length; i++) {
                        const card = newCards[i];
                        const variation = variations[i+1];
                        generateImage(variation).then(generatedImage => {
                            // If a card is selected, update its image source.
                            if (card) {
                                card.image.src = `/images/${generatedImage}`;
                                // Redraw once the card's image is loaded.
                                card.image.onload = () => {
                                    redraw();
                                }
                                card.prompt = variation;
                            } else {
                                console.error("Card not valid.");
                            }
                        }).catch(err => {
                            console.error("Error generating image:", err);
                        });
                    }

                    return;
                }
            }
            // Otherwise, start dragging this card.
            draggingCard = card;
            dragOffsetX = mx - card.x;
            dragOffsetY = my - card.y;
            // Bring this card to the front.
            cards.splice(i, 1);
            cards.push(card);
            redraw();
            return;
        }
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (draggingCard) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        draggingCard.x = mx - dragOffsetX;
        draggingCard.y = my - dragOffsetY;
        redraw();
    }
});

canvas.addEventListener("mouseup", () => {
    draggingCard = null;
});

canvas.addEventListener("mouseleave", () => {
    draggingCard = null;
});

// Redraw the entire canvas.
function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cards.forEach(card => {
        card.draw(ctx);
    });
}

// Init
const baseImage = new Image();
baseImage.src = "image.png"; 

// Create an initial card when the base image is loaded.
baseImage.onload = () => {
    if (cards.length === 0) {
        const card = new Card(100, 100);
        selectedCard = card;
        cards.push(card);
        redraw();
    }
};

// ------ TEST ------

import { generatePromptVariations, generateImage } from './imagegenerator.js';

const promptInput = document.getElementById("prompt-input");
const generateBtn = document.getElementById("generate-btn");

// Listen for clicks on the generate button.
generateBtn.addEventListener("click", () => {
    // Retrieve the prompt entered by the user.
    const promptText = promptInput.value.trim();
    if (!promptText) return;
    
    // Generate a new image based on the prompt.
    generateImage(promptText).then(generatedImage => {
        // If a card is selected, update its image source.
        if (selectedCard) {
            selectedCard.image.src = `/images/${generatedImage}`;
            // Redraw once the card's image is loaded.
            selectedCard.image.onload = () => {
                redraw();
            }
            selectedCard.prompt = promptText;
        } else {
            console.warn("No card is selected to update.");
        }
    }).catch(err => {
        console.error("Error generating image:", err);
    });
});


