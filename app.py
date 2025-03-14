import os
import json
import re
import openai
import hashlib
import requests
import fal_client
from flask import Flask, request, jsonify, send_from_directory
from pymongo import MongoClient
from datetime import datetime
      
# Read API keys
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__, static_folder="static", static_url_path="")
openai.api_key = os.environ.get("OPENAI_API_KEY")
client = openai

fal_client.api_key = os.getenv("FAL_KEY")

# Print the API key
print("The API key is:", fal_client.api_key)

# MongoDB connection
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
mongo_client = MongoClient(mongo_uri)
db = mongo_client["myprojects_db"]
projects_collection = db["projects"]

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
                "width": 144,
                "height": 144
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

@app.route("/doc")
def doc():
    return app.send_static_file("doc.html")

@app.route("/")
def home():
    return app.send_static_file("home.html")

# Mongodb routes
@app.route('/save', methods=['POST'])
def save_project():
    """
    Save a project JSON document to MongoDB.
    The payload must include an "id" field to identify the project.
    Sets the modification date when saving.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400

    project_id = data.get("id")
    if not project_id:
        return jsonify({"error": "Project id is required in the JSON payload"}), 400

    # Set the modification date to the current time (UTC)
    data['modified'] = datetime.utcnow().isoformat()

    # Upsert the document using the project id
    projects_collection.update_one({"id": project_id}, {"$set": data}, upsert=True)
    return jsonify({"status": "success", "message": f"Project {project_id} saved"}), 200

@app.route('/load', methods=['GET'])
def load_project():
    """
    Load a project JSON document from MongoDB.
    Expects a query parameter "id" for the project id.
    """
    project_id = request.args.get("id")
    if not project_id:
        return jsonify({"error": "Project id is required as a query parameter"}), 400

    project = projects_collection.find_one({"id": project_id}, {"_id": 0})
    if not project:
        return jsonify({"error": f"No project found with id {project_id}"}), 404

    return jsonify(project), 200

@app.route('/list', methods=['GET'])
def list_projects():
    """
    List all projects.
    Each project is expected to include a "modified" field.
    """
    projects = list(projects_collection.find({}, {"_id": 0}))
    return jsonify(projects), 200

@app.route('/delete', methods=['DELETE'])
def delete_project():
    """
    Delete a project by its id.
    Expects a query parameter "id" for the project id.
    """
    project_id = request.args.get("id")
    if not project_id:
        return jsonify({"error": "Project id is required as a query parameter"}), 400
    result = projects_collection.delete_one({"id": project_id})
    if result.deleted_count == 0:
        return jsonify({"error": f"No project found with id {project_id}"}), 404
    return jsonify({"status": "success", "message": f"Project {project_id} deleted"}), 200

if __name__ == "__main__":
    certificate_path = 'certs/local.pem'
    private_key_path = 'certs/local-key.pem'
    if os.path.exists('/home/ubuntu/certs/'):
        certificate_path = '/home/ubuntu/certs/fullchain.pem'
        private_key_path = '/home/ubuntu/certs/privkey.pem'

        app.run(host='0.0.0.0', port=443, ssl_context=(certificate_path, private_key_path))
    else:
        app.run(debug=True)
