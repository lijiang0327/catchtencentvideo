'use strict';

var http = require('http');
var express = require('express');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var request = require('request');
var _ = require('underscore');

var app = express();
var server = http.createServer(app);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.set('views', path.resolve(__dirname, 'views'));

app.get('/', (req, res) => {
    res.end('hello world!');
});

app.get('/videourl', (req, res) => {
    var query = req.query;
    getVideoUrl(query.path, function (error, urlList) {
        res.render('video.html', {urlList: urlList});
    })
});
app.get('/api/videourl', (req, res) => {
    var query = req.query;
    getVideoUrl(query.path, function (error, urlList) {
        res.json({urlList: urlList});
    })
});

function getVideoUrl (path, callback) {
    request.get(path, function (err, response, body) {
        var videoInfoReg = /VIDEO_INFO = ({[^}]*})/;
        var listInfoReg = /LIST_INFO = ({[^}]*})/;
        var videoMatch = body.match(videoInfoReg) && body.match(videoInfoReg)[1] || '{}';
        var listMatch = body.match(listInfoReg) && body.match(listInfoReg)[1] || '{}';
        var videoInfo = jsonParse(videoMatch) || {};
        var listInfo = jsonParse(listMatch) || {};

        var params = {
            'isHLS': false,
            'charge': 0,
            'vid': videoInfo.vid,
            'defaultfmt': 'auto',
            'defn': 'shd',
            'defnpayver': 1,
            'otype': 'json',
            'platform': 11001,
            'sdtfrom': 'v1103',
            'host': 'v.qq.com',
            // 'fhdswitch': 0,
            // 'show1080p': 0,
            // 'guid': '8e66ae036ed5662c168c925a0efd5014',
            // 'flowid': 'db40b1fce11f76377c845c1cef95fae4_70901',
            // 'defnpayver': 0,
            // 'appVer': '3.3.131',
            // 'ehost': 'https%3A%2F%2Fm.v.qq.com%2Fplay.html%3F%26vid%3Dl0560fsmenm%26ptag%3Dv_qq_com%2523v.play.adaptor%25233',
            // 'sphttps': 1,
            // '_rnd': 1508213457,
            // 'spwm': 4,
            // 'defn': 'auto',
            // 'fmt': 'auto',
            // 'defsrc': 1
        };

        var baseUrl = 'http://h5vv.video.qq.com/getinfo?callback=formatParams&';
        var paramsArr = [];
        for (var key in params) {
            paramsArr.push('' + key + '=' + params[key]);
        }
        var paramsStr = paramsArr.join('&');
        request.get(baseUrl + paramsStr, {contentType: 'json'}, function (error, response, body) {
            var urlList = eval(body);
            callback(null, urlList);
            // 
        });
    });

    function formatParams (para) {
        var result = [];
        var vi = para && para.vl && para.vl.vi || [];
        for (var i = 0, len = vi.length; i < len; i ++) {
            var fileName = vi[i].fn;
            var fvkey = vi[i].fvkey;
            var ui = vi[i].ul.ui;
            for (var j = 0; j < ui.length; j++) {
                result.push(ui[j].url + fileName + '?vkey=' + fvkey + '&sdtfrom=v1103');
            }
        }
        return result;
    } 
    function jsonParse (str) {
        str = str.replace(/\s+/g, '');
        str = str.replace(/\"+/g, '');
        str = str.replace(/\'+/g, '');
        str = str.substr(1, str.length -1);
        var arr = str.split(',');
        var result = {}, temp;
        for (var i = 0, len = arr.length; i < len; i++) {
            temp = arr[i].split(':');
            result[temp[0]] = temp[1];
        }
        return result;
    }
}

server.listen(3000, () => {
    console.log('server is running at port 3000');
})