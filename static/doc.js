import { Card } from './card.js';
import { saveProject } from './project.js';
import { generatePromptVariations, generateImage } from './imagegenerator.js';

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const promptInput = document.getElementById("prompt-input");
const rearrangeButton = document.getElementById('rearrange-btn');

// Global array of cards.
export let cards = [];

// Global variable to track the selected card.
export let selectedCard = null;
export function setSelectedCard(card) {
    // Remove selected state from previous card if any
    if (selectedCard) {
        selectedCard.setSelected(false);
    }
    
    // Set new selected card
    selectedCard = card;
    
    // Add selected state to new card if any
    if (selectedCard) {
        selectedCard.setSelected(true);
    }

     // Update the prompt input with the selected card's prompt.
     promptInput.value = card.prompt;
}

// Global variables for dragging.
let draggingCard = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Debounce timer for prompt input
let debounceTimer = null;
const DEBOUNCE_DELAY = 500; // 500ms delay

// Track the previous position of the dragged card
let previousCardPosition = { x: 0, y: 0, width: 0, height: 0 };

// Dynamically set the canvas size.
function resizeCanvas() {    
    // Set canvas width to the full window width
    canvas.width = window.innerWidth;
    // Set canvas height to the full window height
    canvas.height = window.innerHeight;
    
    // Redraw the canvas with the new dimensions
    redraw();
}

// Call resizeCanvas on load and when the window is resized.
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

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
            setSelectedCard(card)
            
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
                    // Expand: create four new cards around this card.
                    const offset = 10;
                    let newCards = [];
                    let topCard = new Card(card.x, card.y - card.height - offset);
                    let bottomCard = new Card(card.x, card.y + card.height + offset);
                    let leftCard = new Card(card.x - card.width - offset, card.y);
                    let rightCard = new Card(card.x + card.width + offset, card.y);
                    cards.push(topCard, bottomCard, leftCard, rightCard);
                    newCards.push(topCard, bottomCard, leftCard, rightCard);

                    // Set up image loading for each card first
                    newCards.forEach(card => {
                        card.image.onload = () => redraw();
                    });

                    // Prepare 4 prompt variations
                    const prompt = selectedCard.prompt;
                    const variations = await generatePromptVariations(prompt);
                    
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
                                     // Save project
                                    saveProject();
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
            
            // Initialize the previous card position for redraw optimization
            previousCardPosition = {
                x: card.x,
                y: card.y,
                width: card.width,
                height: card.height
            };
            
            // Bring this card to the front.
            cards.splice(i, 1);
            cards.push(card);
            redraw();
            return;
        }
    }
});

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    // If dragging, update the dragged card position.
    if (draggingCard) {
        draggingCard.x = mx - dragOffsetX;
        draggingCard.y = my - dragOffsetY;
        redraw(draggingCard);
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

// Redraw the canvas
export function redraw(movedCard = null) {
    if (movedCard) {
        // Partial redraw - only update affected areas
        
        // Calculate a bounding box that encompasses both the previous and current positions
        const selectionPadding = 20; // Large padding to account for selection effects
        
        // Find the min/max coordinates to create a rectangle that covers both positions
        const minX = Math.min(previousCardPosition.x, movedCard.x) - selectionPadding;
        const minY = Math.min(previousCardPosition.y, movedCard.y) - selectionPadding;
        const maxX = Math.max(
            previousCardPosition.x + previousCardPosition.width,
            movedCard.x + movedCard.width
        ) + selectionPadding;
        const maxY = Math.max(
            previousCardPosition.y + previousCardPosition.height,
            movedCard.y + movedCard.height
        ) + selectionPadding;
        
        // Clear the entire area between previous and current positions
        const clearWidth = maxX - minX;
        const clearHeight = maxY - minY;
        ctx.clearRect(minX, minY, clearWidth, clearHeight);
        
        // Store the current position for next time
        previousCardPosition = {
            x: movedCard.x,
            y: movedCard.y,
            width: movedCard.width,
            height: movedCard.height
        };
        
        // Track which cards need to be redrawn
        const needsRedraw = new Set();
        
        // Function to check if a card intersects with a region
        function cardIntersectsRegion(card, x, y, width, height, padding) {
            return (card.x + card.width + padding >= x && 
                    card.x - padding <= x + width && 
                    card.y + card.height + padding >= y && 
                    card.y - padding <= y + height);
        }
        
        // Function to add a card and all intersecting cards recursively
        function addCardAndIntersections(index) {
            if (needsRedraw.has(index)) return; // Already processed
            
            const card = cards[index];
            needsRedraw.add(index);
            
            // Check all other cards to see if they intersect with this one
            for (let i = 0; i < cards.length; i++) {
                if (i !== index && !needsRedraw.has(i)) {
                    const otherCard = cards[i];
                    
                    // If the cards intersect, add the other card too
                    if (cardIntersectsRegion(
                        otherCard, 
                        card.x - selectionPadding, 
                        card.y - selectionPadding, 
                        card.width + selectionPadding * 2, 
                        card.height + selectionPadding * 2,
                        selectionPadding
                    )) {
                        addCardAndIntersections(i);
                    }
                }
            }
        }
        
        // Start with cards that intersect with the cleared area
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            
            // Check if card intersects with the cleared area
            if (cardIntersectsRegion(card, minX, minY, clearWidth, clearHeight, 0)) {
                addCardAndIntersections(i);
            }
        }
        
        // Convert the Set to an array and sort by index to maintain z-order
        const cardsToRedraw = Array.from(needsRedraw).sort((a, b) => a - b);
        
        // Draw the cards in their original order
        for (let i = 0; i < cardsToRedraw.length; i++) {
            cards[cardsToRedraw[i]].draw(ctx);
        }
    } else {
        // Full redraw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw all cards from bottom to top (lowest to highest z-index)
        for (let i = 0; i < cards.length; i++) {
            cards[i].draw(ctx);
        }
        
        // Reset previous position tracking when doing a full redraw
        if (cards.length > 0 && draggingCard) {
            previousCardPosition = {
                x: draggingCard.x,
                y: draggingCard.y,
                width: draggingCard.width,
                height: draggingCard.height
            };
        }
    }
}

// Listen for input events on the prompt input field.
promptInput.addEventListener("input", () => {
    // Clear any existing timer
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    
    // Set a new timer
    debounceTimer = setTimeout(() => {
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
    }, DEBOUNCE_DELAY);
});
