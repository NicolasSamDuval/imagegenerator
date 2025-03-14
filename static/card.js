// Export the Card class so it can be imported in main.js.
export class Card {
    constructor(x, y) {
        // Position of the card (top-left).
        this.x = x;
        this.y = y;
        // Card layout dimensions.
        this.imageSize = 144;      // Image drawn as a 144x144 square.
        this.buttonHeight = 30;    // Buttons area height.
        this.width = 144;          // Card width (same as image width).
        this.height = this.imageSize;
        this.image = new Image();
        this.image.src = "images/default.png";
        this.prompt = '';
        this.creationDate = new Date();
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
        
        const radius = 10; // Adjust this value for more or less rounded corners
    
        // Create a rounded rectangle path.
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(this.width - radius, 0);
        ctx.quadraticCurveTo(this.width, 0, this.width, radius);
        ctx.lineTo(this.width, this.height - radius);
        ctx.quadraticCurveTo(this.width, this.height, this.width - radius, this.height);
        ctx.lineTo(radius, this.height);
        ctx.quadraticCurveTo(0, this.height, 0, this.height - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
    
        // Fill and stroke the rounded rectangle.
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();
    
        // Optionally, clip to the rounded rectangle so any content drawn afterward respects the rounded corners.
        ctx.clip();
        
        // Draw the image area inside the card.
        ctx.drawImage(this.image, 0, 0, this.imageSize, this.imageSize);
        
        // Define overlay dimensions.
        const overlayWidth = this.width * 0.8; // 80% of card width
        const overlayHeight = this.buttonHeight * 0.8; // slightly smaller for a neat look
        const overlayX = (this.width - overlayWidth) / 2;
        const overlayY = this.imageSize - overlayHeight - 5; // closer to the bottom
    
        // Draw transparent black overlay.
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(overlayX, overlayY, overlayWidth, overlayHeight);
        
        // Set up text properties for buttons.
        ctx.font = "14px sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white"; // white text for contrast
        
        // Calculate button widths within the overlay.
        const buttonWidth = overlayWidth / 3;
        
        // Draw Duplicate button (left section)
        ctx.fillText("+", overlayX + buttonWidth / 2 - 5, overlayY + overlayHeight / 2);
        
        // Draw Remove button (middle section)
        ctx.fillText("–", overlayX + buttonWidth + buttonWidth / 2 - 5, overlayY + overlayHeight / 2);
        
        // Draw Expand button (right section)
        ctx.fillText("!", overlayX + 2 * buttonWidth + buttonWidth / 2 - 5, overlayY + overlayHeight / 2);
        
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
        const overlayWidth = this.width * 0.8;
        const overlayHeight = this.buttonHeight * 0.8;
        const overlayX = (this.width - overlayWidth) / 2;
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
}
