import os
import json
import re
import openai
from flask import Flask, request, jsonify

app = Flask(__name__, static_folder="static", static_url_path="")
openai.api_key = os.environ.get("OPENAI_API_KEY")
client = openai 

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

@app.route("/")
def index():
    return app.send_static_file("index.html")

if __name__ == "__main__":
    app.run(debug=True)
