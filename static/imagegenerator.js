// Generate Image
export async function generateImage(prompt) {
    return fetch('/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: prompt })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Image generation failed');
        }
        return response.json();
    })
    .then(data => {
        // data.filename is something like "hash.jpg"
        return data.filename;
    })
    .catch(error => {
        console.error('Error generating image:', error);
        throw error;
    });
}

// Prompt variations
export async function generatePromptVariations(userPrompt) {
    try {
        const response = await fetch('/generate_variations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: userPrompt })
        });
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }
        const data = await response.json();
        // Return the JSON object as received (with keys variation1, variation2, etc.)
        return data;
    } catch (error) {
        console.error('Error generating prompt variations:', error);
        throw error;
    }
}
