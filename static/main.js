const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Global array of cards.
let cards = [];

// Load a base image (shared by all cards).
const baseImage = new Image();
baseImage.src = "image.png"; // Ensure this image is available in your project.

// Card class represents a draggable card with an image and three buttons.
class Card {
    constructor(x, y) {
        // Position of the card (top-left).
        this.x = x;
        this.y = y;
        // Card layout dimensions.
        this.imageSize = 150;      // Image drawn as a 150x150 square.
        this.buttonHeight = 30;    // Buttons area height.
        this.width = 150;          // Card width (same as image width).
        this.height = this.imageSize + this.buttonHeight;
    }
    
    // Draw the card onto the provided context.
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw card background.
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.strokeStyle = "black";
        ctx.strokeRect(0, 0, this.width, this.height);
        
        // Draw the image area.
        ctx.drawImage(baseImage, 0, 0, this.imageSize, this.imageSize);
        
        // Draw the buttons area (the bottom part).
        ctx.fillStyle = "#ddd";
        ctx.fillRect(0, this.imageSize, this.width, this.buttonHeight);
        ctx.font = "16px sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "black";
        
        // Duplicate button (left third)
        ctx.fillStyle = "lightgray";
        ctx.fillRect(0, this.imageSize, this.width / 3, this.buttonHeight);
        ctx.fillStyle = "black";
        ctx.fillText("+", this.width / 6 - 5, this.imageSize + this.buttonHeight / 2);
        
        // Remove button (middle third)
        ctx.fillStyle = "lightgray";
        ctx.fillRect(this.width / 3, this.imageSize, this.width / 3, this.buttonHeight);
        ctx.fillStyle = "black";
        ctx.fillText("–", this.width / 2 - 5, this.imageSize + this.buttonHeight / 2);
        
        // Expand button (right third)
        ctx.fillStyle = "lightgray";
        ctx.fillRect((2 * this.width) / 3, this.imageSize, this.width / 3, this.buttonHeight);
        ctx.fillStyle = "black";
        ctx.fillText("!", (5 * this.width) / 6 - 5, this.imageSize + this.buttonHeight / 2);
        
        ctx.restore();
    }
    
    // Returns true if the point (px,py) is inside this card.
    isInside(px, py) {
        return px >= this.x && px <= this.x + this.width &&
        py >= this.y && py <= this.y + this.height;
    }
    
    // If the point (px,py) falls within the button areas, returns:
    // "duplicate", "remove", or "expand". Otherwise, returns null.
    buttonAt(px, py) {
        let lx = px - this.x;
        let ly = py - this.y;
        if (ly >= this.imageSize && ly <= this.imageSize + this.buttonHeight) {
            if (lx >= 0 && lx < this.width / 3) return "duplicate";
            if (lx >= this.width / 3 && lx < (2 * this.width) / 3) return "remove";
            if (lx >= (2 * this.width) / 3 && lx <= this.width) return "expand";
        }
        return null;
    }
}

// Global variables for dragging.
let draggingCard = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// --- Event Handling ---
canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    // Iterate in reverse order (topmost card first).
    for (let i = cards.length - 1; i >= 0; i--) {
        let card = cards[i];
        if (card.isInside(mx, my)) {
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
                    // Expand: create four new cards around this card.
                    const offset = 10;
                    let topCard = new Card(card.x, card.y - card.height - offset);
                    let bottomCard = new Card(card.x, card.y + card.height + offset);
                    let leftCard = new Card(card.x - card.width - offset, card.y);
                    let rightCard = new Card(card.x + card.width + offset, card.y);
                    cards.push(topCard, bottomCard, leftCard, rightCard);
                    redraw();
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

// Create an initial card when the base image is loaded.
baseImage.onload = () => {
    if (cards.length === 0) {
        cards.push(new Card(100, 100));
        redraw();
    }
};
