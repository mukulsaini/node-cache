const redis = require('redis');
const express = require('express');
const request = require('superagent');
const PORT = process.env.PORT || 3000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const app = express();
// create redis client
const client = redis.createClient(REDIS_PORT);

function respond(org, numberOfRepos) {
    return `Organization "${org}" has ${numberOfRepos} public repositories.`;
}

// if data is null then it will get number of repos form getNumberOfRepos func.
function fromCache(req, res, next) {
    const org = req.query.org;
    console.log(org);
    client.get(org, function (err, data) {
        if (data != null) {
            res.send(respond(org, data));
        } else {
            next();
        }
    });
}

function getNumberOfRepos(req, res, next) {
    const org = req.query.org;
    request.get(`https://api.github.com/orgs/${org}/repos`, function (err, response) {
        if (err) {
            throw err;
        }
        
        var repoNumber = 0;
        if (response && response.body) {
            repoNumber = response.body.length;
        }
        client.setex(org, 10, repoNumber);
        res.send(respond(org, repoNumber));
    });
}

app.use('/reposNumber', fromCache, getNumberOfRepos);

app.listen(PORT, function () {
    console.log(`app is  listening on port`, PORT);
});