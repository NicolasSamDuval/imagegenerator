import { Card } from './card.js';
import { redraw, cards, setSelectedCard } from './doc.js'

// Function to extract and return the project ID from the URL path
function getProjectId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

document.addEventListener("DOMContentLoaded", () => {
    const projectId = getProjectId();
    if (projectId) {
        console.log("Loading project:", projectId);
        loadProject();
    } else {
        console.warn("Project with followign id doesn't exist yet:", projectId);
    }
});

export function saveProject() {
    const projectId = getProjectId();
    
    // Create project data
    const projectData = [];
    
    cards.forEach(card => {
        const x = card.x|| "0";
        const y = card.y || "0";
        const imageSrc = card.image.src ? card.image.src : "";
        const prompt = card.prompt || "";
        const creationDate = card.creationDate || new Date();
        
        projectData.push({
            x,
            y,
            imageSrc,
            prompt,
            creationDate
        });
    });
    
    // Create a payload that includes a project id (required by the backend)
    // and the array of card objects. Adjust the id value as necessary.
    const payload = {
        id: projectId,
        cards: projectData
    };
    
    // Call the save_project endpoint to persist the project data.
    fetch("/save", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Project saved successfully:", data);
    })
    .catch(error => {
        console.error("Error saving project:", error);
    });
}

function loadProject() {
    const projectId = getProjectId();
    
    // Call the load endpoint to fetch the project data using the project id.
    fetch(`/load?id=${encodeURIComponent(projectId)}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log("Project loaded successfully:", data);
        // Process the loaded project data as needed.
        
        if (data && data.cards) { // Project exists
            data.cards.forEach(card => {
                console.log("Card data:", card);
                
                // Create a new cad
                let newCard = new Card(card.x,card.y);
                setSelectedCard(card); // Set selection //FIXME: could save selection in project
                newCard.update(card.imageSrc, card.prompt, card.creationDate);
                cards.push(newCard);
                // Redraw
                newCard.image.onload = () => {
                    redraw();
                }
            });
        } else { // Project doesn't exist
            // Add a default image
            const defaultImage = new Image();
            defaultImage.src = "images/default.png"; 
            
            // Create an initial card when the base image is loaded.
            defaultImage.onload = () => {
                if (cards.length === 0) {
                    let card = new Card(100, 100);
                    setSelectedCard(card);
                    cards.push(card);
                    redraw();
                }
            };          
        }
    })
    .catch(error => {
        console.error("Error loading project:", error);
    });
}

