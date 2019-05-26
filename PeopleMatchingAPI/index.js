const express = require('express');
const app = express();
const parser = require("body-parser");
const fs = require('fs');

app.use(express.static('public'))
app.use(parser.urlencoded({ extended: false }));
app.use(parser.json());

/*
json file to store user data
*/
const userJson = '/public/data/user.json';

const port = 3000;

/*
expire time for all cookies, 1 minutes
*/
const timeout = 1 * 60 * 1000;

/*
handle general `GET` to show index.html
*/
app.get('/', async function(req, res) {
    res.sendFile(__dirname + '/index.html');
})

/*
handle 'GET' for list all user,find user, find friend user,
match age and mutual friend 
*/
app.get('/user', async function(req, res) {
    var id = req.query.id;
    var name = req.query.name;
    var q = req.query.q;
    var data = [];
    var jsonFile = __dirname + userJson;
    if (!fs.existsSync(jsonFile)) {
        res.cookie('user', null, { expires: new Date(Date.now() + timeout) });
        res.cookie('list', null, { expires: new Date(Date.now() + timeout) });
        res.redirect('/');
        return;

    }
    data = JSON.parse(fs.readFileSync(jsonFile));
    if (id == undefined && q == undefined) {
        res.cookie('list', jsonToCookies(data), { expires: new Date(Date.now() + timeout) });
        res.redirect('/');
        return;
    } else if (id != undefined && q == undefined) {
        var i = data.filter(function(item) {
            return (item.id == id || item.name == name);
        });
        if (i.length <= 0) {
            res.cookie('user', null, { expires: new Date(Date.now() + timeout) });
            res.redirect('/');
            return;
        }
        res.cookie('user', jsonToCookies(i[0]), { expires: new Date(Date.now() + timeout) });
        res.redirect('/');
        return;
    } else if (q == 'friend') {
        var i = data.filter(function(item) {
            return (item.id == id || item.name == name);
        });
        if (i.length <= 0 || i[0].friend == undefined) {
            res.cookie('friend', null, { expires: new Date(Date.now() + timeout) });
            res.redirect('/');
            return;
        }
        var friend = [];
        var ids = i[0].friend;
        if (ids == undefined || ids.length <= 0) {
            res.cookie('friend', null, { expires: new Date(Date.now() + timeout) });
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
        res.cookie('friend', jsonToCookies(friend), { expires: new Date(Date.now() + timeout) });
        res.redirect('/');
        return;
    } else if (q == 'match') {
        var i = data.filter(function(item) {
            return (item.id == id || item.name == name);
        });
        if (i.length <= 0) {
            res.cookie('match', null, { expires: new Date(Date.now() + timeout) });
            res.redirect('/');
            return;
        }
        var age = i[0].age;
        var _match = data.filter(function(item) {
            return (item.age == age && (item.id != id || item.name != name));
        });
        if (_match == undefined || _match.length <= 0) {
            res.cookie('match', null, { expires: new Date(Date.now() + timeout) });
            res.redirect('/');
            return;
        }
        var match = [];
        _match.forEach(function(e) {
            var f = e;
            var ismutual = false;
            if (f.friend != undefined && i[0].friend != undefined) {
                var g = f.friend.length > i[0].friend.length ? f.friend : i[0].friend;
                var h = f.friend.length < i[0].friend.length ? f.friend : i[0].friend;
                for (var j in g) {
                    ismutual = h.includes(j);
                    if (ismutual == true)
                        break;
                }
            }
            f.ismutual = ismutual;
            f.sameage = true;

            match.push(f);
        });

        if (match == undefined || match.length <= 0) {
            res.cookie('match', null, { expires: new Date(Date.now() + timeout) });
            res.redirect('/');
            return;
        }

        res.cookie('match', jsonToCookies(match), { expires: new Date(Date.now() + timeout) });
        res.redirect('/');
        return;
    }

})

/*
handle 'POST' for save new user, update age and friend 
*/
app.post('/', function(req, res) {
    var saveUser = save(req, saveUser);
    res.cookie('error', saveUser.error, { expires: new Date(Date.now() + timeout) });
    res.cookie('message', saveUser.message, { expires: new Date(Date.now() + timeout) });
    res.cookie('list', jsonToCookies(saveUser.list), { expires: new Date(Date.now() + timeout) });
    res.redirect('/');
})

/*
handle read and write user data to json file 
*/
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

    if (i.length > 0) {
        var index = jsonData.indexOf(i[0]);
        jsonData[index].age = _req.body.age;
        var friend = _req.body.friend;
        if (friend != undefined)
            jsonData[index].friend = friend.length > 0 ? friend.filter(distinct()) : friend;
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

/*
parsing json to cookies, require to be encode to base64 string.
*/
function jsonToCookies(json) {
    return Buffer.from(JSON.stringify(json)).toString('base64');
}

/*
show only distinct element in array
*/
function distinct(value, index, self) {
    return self.indexOf(value) === index;
}

app.listen(port, () => console.log(`listening on port ${port}!`))