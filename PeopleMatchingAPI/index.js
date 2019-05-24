const express = require('express');
const app = express();
const parser = require("body-parser");
const fs = require('fs');

app.use(express.static('public'))
app.use(parser.urlencoded({ extended: false }));
app.use(parser.json());

const userJson = '/public/data/user.json';

const port = 3000;


app.get('/', async function(req, res) {
    res.sendFile(__dirname + '/index.html');
})

app.get('/user', async function(req, res) {
    var id = req.query.id;
    var name = req.query.name;
    var q = req.query.q;
    var data = [];
    var jsonFile = __dirname + userJson;
    if (!fs.existsSync(jsonFile)) {
        res.cookie('user', null);
        res.cookie('list', null);
        res.redirect('/');
        return;
    }
    data = JSON.parse(fs.readFileSync(jsonFile));
    if (id == undefined && q == undefined) {
        res.cookie('list', jsonToCookies(data));
        res.redirect('/');
        return;
    } else if (id != undefined && q == undefined) {
        var i = data.filter(function(item) {
            return (item.id == id && item.name == name);
        });
        if (i.length <= 0) {
            res.cookie('user', null);
            res.redirect('/');
            return;
        }
        res.cookie('user', jsonToCookies(i[0]));
        res.redirect('/');
        return;
    } else if (q == 'friend') {
        var i = data.filter(function(item) {
            return (item.id == id || item.name == name);
        });
        if (i.length <= 0) {
            res.cookie('friend', null);
            res.redirect('/');
            return;
        }
        var friend = [];
        var ids = i[0].friend;
        if (ids == undefined || ids.length <= 0) {
            res.cookie('friend', null);
            res.redirect('/');
            return;
        }
        if (ids.length > 0) {
            ids.forEach(function(e) {
                friend.push(data.filter(function(item) {
                    return (item.id == e);
                })[0]);
            });
        } else {
            friend.push(data.filter(function(item) {
                return (item.id == ids);
            }));
        }
        res.cookie('friend', jsonToCookies(friend));
        res.redirect('/');
        return;
    } else if (q == 'match') {
        var i = data.filter(function(item) {
            return (item.id == id || item.name == name);
        });
        if (i.length <= 0) {
            res.cookie('match', null);
            res.redirect('/');
            return;
        }
        var age = i[0].age;
        var match = data.filter(function(item) {
            return (item.age == age && (item.id != id || item.name != name));
        });
        console.log(match);
        if (match == undefined || match.length <= 0) {
            res.cookie('match', null);
            res.redirect('/');
            return;
        }

        res.cookie('match', jsonToCookies(match));
        res.redirect('/');
        return;
    }

})

app.post('/', function(req, res) {
    var saveUser = save(req, saveUser);
    console.log(saveUser);
    res.cookie('error', saveUser.error);
    res.cookie('message', saveUser.message);
    res.cookie('list', jsonToCookies(saveUser.list));
    res.redirect('/');
})

function save(_req) {
    var data = [];
    data.error = true;
    data.list = [];
    var jsonFile = __dirname + userJson;
    if (!fs.existsSync(jsonFile)) {
        data.message = 'data files missing!';
        return data;
    }
    var jsonData = JSON.parse(fs.readFileSync(jsonFile));
    var i = jsonData.filter(function(item) {
        return (item.id == _req.body.id || item.name == _req.body.name);
    });

    if (i.length > 0) //user exist
    {
        var index = jsonData.indexOf(i[0]);
        jsonData[index].age = _req.body.age;
        jsonData[index].friend = _req.body.friend.filter(distinct());
        fs.writeFile(jsonFile, JSON.stringify(jsonData), 'ascii', function(err) {
            if (err) {
                data.message = "An error occured while writing JSON Object to File.";
            }
        });
        data.message = '[' + _req.body.id + ' ' + _req.body.name + '] exist!. Update age and friend only!';
        data.list = jsonData;
    } else {
        try {
            jsonData.push({ id: _req.body.id, name: _req.body.name, age: _req.body.age, friend: _req.body.friend });
            fs.writeFile(jsonFile, JSON.stringify(jsonData), 'ascii', function(err) {
                if (err) {
                    data.message = "An error occured while writing JSON Object to File.";
                }
            });
        } catch (e) {
            data.message = e;
        } finally {
            data.message = '[' + _req.body.id + ' ' + _req.body.name + '] saved succesfully!';
            data.error = false;
            data.list = jsonData;
        }

    }
    return data;

}

function jsonToCookies(json) {
    return Buffer.from(JSON.stringify(json)).toString('base64');
}

function distinct(value, index, self) {
    return self.indexOf(value) === index;
}

app.listen(port, () => console.log(`listening on port ${port}!`))