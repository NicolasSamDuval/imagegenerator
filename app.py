import os
import json
import re
import openai
import hashlib
import requests
import fal_client
from flask import Flask, request, jsonify, send_from_directory
      
# Read API keys
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__, static_folder="static", static_url_path="")
openai.api_key = os.environ.get("OPENAI_API_KEY")
client = openai

fal_client.api_key = os.getenv("FAL_KEY")

# Ensure the images directory exists
IMAGES_DIR = 'images'
if not os.path.exists(IMAGES_DIR):
    os.makedirs(IMAGES_DIR)

@app.route('/generate_variations', methods=['POST'])
def generate_variations():
    data = request.get_json()
    user_prompt = data.get("prompt", "")
    if not user_prompt:
        return jsonify({"error": "Prompt is required"}), 400

    try:
        completion = client.chat.completions.create(
            model="gpt-4o",
            store=True,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a creative assistant. Your task is to generate four distinct and creative variations for an image prompt, "
                        "each with a different twist in content or style. Your output must be a valid JSON object with exactly four keys: "
                        "'1', '2', '3', '4'. Do not output any additional text."
                    )
                },
                {
                    "role": "user",
                    "content": f"Original prompt: {user_prompt}\n\nPlease provide the JSON object with the variations."
                }
            ]
        )
        # Get the text response and remove markdown formatting if present.
        text = completion.choices[0].message.content.strip()
        # Use regex to extract the JSON content between ```json and ```.
        match = re.search(r"```json\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1)
        # Parse the JSON.
        variations_json = json.loads(text)
        return jsonify(variations_json)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
            print(log["message"])

@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    if not data or 'prompt' not in data:
        return jsonify({'error': 'Prompt not provided'}), 400

    prompt = data['prompt']

    # Call fal_client with the given prompt
    result = fal_client.subscribe(
        "fal-ai/flux/schnell",
        arguments={
            "prompt": prompt,
            "image_size":  {
                "width": 150,
                "height": 150
            },
            "num_inference_steps": 2,
            "num_images": 1,
            "enable_safety_checker": True
        },
        with_logs=True,
        on_queue_update=on_queue_update,
    )

    # Extract the image URL from the result
    # Expected result format:
    # { "images": [ { "url": "https://v3.fal.media/files/panda/TWgr7EQamxzEmLqw5mxrT.png" } ] }
    images_list = result.get('images')
    if not images_list or len(images_list) == 0:
        return jsonify({'error': 'No images returned from fal_client'}), 500

    image_url = images_list[0].get('url')
    if not image_url:
        return jsonify({'error': 'Image URL not found in fal_client result'}), 500

    # Download the image from the provided URL
    try:
        response = requests.get(image_url)
        response.raise_for_status()
    except Exception as e:
        return jsonify({'error': 'Failed to download image', 'details': str(e)}), 500

    image_data = response.content

    # Generate a unique hash for the image and take the first 8 characters
    image_hash = hashlib.sha256(image_data).hexdigest()[:8]
    # Determine file extension from the URL (default to .jpg if not found)
    ext = os.path.splitext(image_url)[1] or '.jpg'
    filename = f"{image_hash}{ext}"
    filepath = os.path.join(IMAGES_DIR, filename)

    # Save the downloaded image to disk
    with open(filepath, 'wb') as f:
        f.write(image_data)

    # Return the filename
    return jsonify({'filename': filename})

@app.route('/images/<path:filename>')
def serve_image(filename):
    return send_from_directory(IMAGES_DIR, filename)

@app.route("/")
def index():
    return app.send_static_file("index.html")

if __name__ == "__main__":
    app.run(debug=True)
