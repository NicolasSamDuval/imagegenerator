import { Card } from './card.js';
import { saveProject } from './project.js';

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Global array of cards.
export let cards = [];

// Global variable to track the selected card.
export let selectedCard = null;
export function setSelectedCard(card) {
    selectedCard = card;
}

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
                    let newCard = card.clone();
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

                    // Save project
                    saveProject();

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

    // Hover logic
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // If dragging, update the dragged card position.
    if (draggingCard) {
        draggingCard.x = mx - dragOffsetX;
        draggingCard.y = my - dragOffsetY;
        redraw();
    }

    // Check if mouse is over a card (topmost first)
    let hoveredCard = null;
    for (let i = cards.length - 1; i >= 0; i--) {
        if (cards[i].isInside(mx, my)) {
            hoveredCard = cards[i];
            break;
        }
    }

    // Update tooltip element based on hovered card.
    const tooltip = document.getElementById("tooltip");
    if (hoveredCard && hoveredCard.prompt) {
        tooltip.style.display = "block";
        tooltip.innerText = hoveredCard.prompt;
        // Position tooltip near the mouse pointer.
        tooltip.style.left = e.pageX + 10 + "px";
        tooltip.style.top = e.pageY + 10 + "px";
    } else {
        tooltip.style.display = "none";
    }
});

canvas.addEventListener("mouseup", () => {
    draggingCard = null;
    // Save project on mouse up
    saveProject();
});

canvas.addEventListener("mouseleave", () => {
    draggingCard = null;
});

// Rearrange logic
const rearrangeButton = document.getElementById('rearrange-btn');
const margin = 10; // spacing between cards

rearrangeButton.addEventListener('click', () => {
    // Sort cards by creation date (adjust sort order as needed)
    cards.sort((a, b) => a.creationDate - b.creationDate);
    
    // Set a constant margin for the left and bottom offsets
    const sideMargin = 10;
    
    // Initialize starting position at the bottom left of the canvas with a 10px margin
    let x = sideMargin;
    let cardHeight = cards.length > 0 ? cards[0].height : 0;
    let y = canvas.height - cardHeight - sideMargin;
    
    // Loop through sorted cards and assign new positions
    cards.forEach(card => {
        card.x = x;
        card.y = y;
        
        // Move to the right for the next card
        x += card.width + margin;
        
        // If the next card would go off the canvas, reset x and move y one row up
        if (x + card.width > canvas.width) {
            x = sideMargin;
            y -= card.height + margin;
        }
    });
    
    // Re-render the canvas with updated card positions
    redraw();

    // Save project
    saveProject();
});

// Redraw the entire canvas.
export function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cards.forEach(card => {
        card.draw(ctx);
    });
}


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

            // Save project
            saveProject();
        } else {
            console.warn("No card is selected to update.");
        }
    }).catch(err => {
        console.error("Error generating image:", err);
    });
});


