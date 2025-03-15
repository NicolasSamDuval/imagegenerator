// Export the Card class so it can be imported in main.js.
export class Card {
    constructor(x, y) {
        // Position of the card (top-left).
        this.x = x;
        this.y = y;
        // Card layout dimensions.
        this.imageSize = 144;      // Image drawn as a 144x144 square.
        this.buttonHeight = 18;    // Buttons area height.
        this.width = 144;          // Card width (same as image width).
        this.height = this.imageSize;
        this.image = new Image();
        this.image.src = "images/default.png";
        this.prompt = '';
        this.creationDate = new Date();
        this.selected = false;     // Track selected state
    }

    update(src, prompt, creationDate) {
        this.image.src = src;
        this.prompt = prompt;
        this.creationDate = creationDate;
    }

    clone() {
        // Create a new card with position shifted 
        const newCard = new Card(this.x + 20, this.y + 20);
        // Create a new image instance with the same source.
        newCard.image = new Image();
        newCard.image.src = this.image.src;
        // Copy over the prompt.
        newCard.prompt = this.prompt;
        return newCard;
    }
    
    // Draw the card onto the provided context.
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const cardRadius = 10; // Card corner radius
    
        // Create a rounded rectangle path for the card.
        ctx.beginPath();
        ctx.moveTo(cardRadius, 0);
        ctx.lineTo(this.width - cardRadius, 0);
        ctx.quadraticCurveTo(this.width, 0, this.width, cardRadius);
        ctx.lineTo(this.width, this.height - cardRadius);
        ctx.quadraticCurveTo(this.width, this.height, this.width - cardRadius, this.height);
        ctx.lineTo(cardRadius, this.height);
        ctx.quadraticCurveTo(0, this.height, 0, this.height - cardRadius);
        ctx.lineTo(0, cardRadius);
        ctx.quadraticCurveTo(0, 0, cardRadius, 0);
        ctx.closePath();
    
        // Fill and stroke the card background.
        ctx.fillStyle = "white";
        ctx.fill();
        
        // Draw border with different styles based on selected state
        if (this.selected) {
            ctx.strokeStyle = "#007AFF";
            ctx.lineWidth = 3;
            ctx.stroke();
            // Add glow effect
            ctx.shadowColor = "rgba(0, 122, 255, 0.4)";
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else {
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    
        // Clip to the card's rounded boundaries.
        ctx.clip();
        
        // Draw the image area.
        ctx.drawImage(this.image, 0, 0, this.imageSize, this.imageSize);
        
        // Define overlay dimensions for the button container.
        const overlayWidth = this.width * 0.4; // 40% of card width
        const overlayHeight = this.buttonHeight * 0.8; // slightly smaller for a neat look
        const overlayX = this.width - overlayWidth - 5; // 5px from right edge
        const overlayY = this.imageSize - overlayHeight - 5; // 5px from bottom
    
        // Helper function to draw a rounded rectangle.
        function drawRoundedRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }
    
        // Draw the container as a rounded rectangle (no extra white border).
        const containerRadius = 4; // Smaller radius for more compact look
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        drawRoundedRect(ctx, overlayX, overlayY, overlayWidth, overlayHeight, containerRadius);
        ctx.fill();
    
        // Set up text properties for the button symbols.
        ctx.font = "12px sans-serif"; // Smaller font size
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        
        // Calculate each button's area within the container.
        const buttonWidth = overlayWidth / 3;
        
        // Draw the symbols centered in each button area.
        ctx.fillText("+", overlayX + buttonWidth / 2 - 4, overlayY + overlayHeight / 2);
        ctx.fillText("–", overlayX + buttonWidth + buttonWidth / 2 - 4, overlayY + overlayHeight / 2);
        ctx.fillText("!", overlayX + 2 * buttonWidth + buttonWidth / 2 - 4, overlayY + overlayHeight / 2);
        
        ctx.restore();
    }     
    
    // Returns true if the point (px,py) is inside this card.
    isInside(px, py) {
        return px >= this.x && px <= this.x + this.width &&
        py >= this.y && py <= this.y + this.height;
    }
    
    // If the point (px,py) falls within the button areas,
    // returns "duplicate", "remove", or "expand". Otherwise, returns null.
    buttonAt(px, py) {
        // Convert global coordinates to local coordinates.
        let lx = px - this.x;
        let ly = py - this.y;
    
        // Use the same overlay dimensions as in draw().
        const overlayWidth = this.width * 0.4; // 40% of card width
        const overlayHeight = this.buttonHeight * 0.8;
        const overlayX = this.width - overlayWidth - 5;
        const overlayY = this.imageSize - overlayHeight - 5;
    
        // Check if the click falls within the overlay.
        if (lx >= overlayX && lx <= overlayX + overlayWidth &&
            ly >= overlayY && ly <= overlayY + overlayHeight) {
            const buttonWidth = overlayWidth / 3;
            if (lx < overlayX + buttonWidth) {
                return "duplicate";
            } else if (lx < overlayX + 2 * buttonWidth) {
                return "remove";
            } else {
                return "expand";
            }
        }
        return null;
    }    

    setSelected(selected) {
        this.selected = selected;
    }
}
