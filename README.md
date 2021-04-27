# MICROBO - microscopic JSON based admin panel 

Microbo is a small admin panel built on top of ExpressJS that utilize JSON files as data storage.
It has it's own UI with JSON Editor that allows quickly manipulate json files.
Every key-value pair is accessible via GET method or via template placeholder.

![Microbo main screen](https://github.com/zorg-industries-limited/microbo-admin-panel/blob/main/misc/image.png)

### ⚠ It's a proof-of-concept!
It's highly recommended not to use it in **production**.


## Installation and running
Git clone the repo and use `npm install` to install all necessary dependencies.
Use `node server.js` to start the app.

## How to use
### Authorization
Visit `http://127.0.0.1:3000/microbo/signin` and use `admin4eg` as a username and `microbo` as a password.

### Using JSON editor
JSON tree is a combinations of multiple json files joined together:
- **content.json** - where all app content should be stored.
- **settings.json** - vital parameters to operate Microbo properly.
- **users.json** - array of users that can log to Mircrobo. This file can be served as an example of user authorization.