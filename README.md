# Image Generator

## Install env
```
env.sh
pip install flask openai fal_client requests python-dotenv pymongo
```

## MongoDB

### On MacOS
```
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

### On Linux
```
sudo apt update
sudo apt install -y docker.io
sudo systemctl enable --now docker
```

Start mongodb
```
sudo docker run -d --name mongodb -p 27017:27017 mongo:6.0
sudo docker ps
```

### In mongo shell:
```
mongosh
use myprojects_db
db.createCollection("projects")
db.projects.insertOne({ sample: "data" })
show collections
```

## Run app
python app.py

