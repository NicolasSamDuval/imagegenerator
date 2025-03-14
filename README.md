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
sudo docker exec -it mongodb mongosh
use myprojects_db
db.createCollection("projects")
db.projects.insertOne({ sample: "data" })
show collections
```

## Run app

### Locally (debug)
```
python app.py
```

### Server

#### Run

To run imagegen, use `authbind`:

Install:
```
sudo apt install authbind
pip install gunicorn
```

Enable port 443
```
sudo touch /etc/authbind/byport/443
sudo chown ubuntu:ubuntu /etc/authbind/byport/443
sudo chmod 755 /etc/authbind/byport/443
```

```bash
./run.sh
```

#### Certificates

Install certbot
```
sudo apt-get install certbot
```

Run DNS challenge
```
sudo certbot certonly --manual --preferred-challenges=dns -d imagegen.ai-square.io
```

Add DNS TXT record on porkbun

Copy the certs:
```
mkdir -p /home/ubuntu/certs
sudo cp /etc/letsencrypt/live/imagegen.ai-square.io/fullchain.pem /home/ubuntu/certs/fullchain.pem
sudo cp /etc/letsencrypt/live/imagegen.ai-square.io/privkey.pem /home/ubuntu/certs/privkey.pem
sudo chown ubuntu:ubuntu /home/ubuntu/certs/fullchain.pem /home/ubuntu/certs/privkey.pem
chmod 600 /home/ubuntu/certs/fullchain.pem /home/ubuntu/certs/privkey.pem
 ```
