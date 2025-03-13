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
        this.height = this.imageSize + this.buttonHeight;
        this.image = new Image();
        this.image.src = "image.png";
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
        
        // Draw card background.
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.strokeStyle = "black";
        ctx.strokeRect(0, 0, this.width, this.height);
        
        // Draw the image area.
        ctx.drawImage(this.image, 0, 0, this.imageSize, this.imageSize);
        
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
    
    // If the point (px,py) falls within the button areas,
    // returns "duplicate", "remove", or "expand". Otherwise, returns null.
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
