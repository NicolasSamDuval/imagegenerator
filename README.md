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

In mongo shell:
```
mongosh
use myprojects_db
db.createCollection("projects")
db.projects.insertOne({ sample: "data" })
show collections
```



## Run app
python app.py

