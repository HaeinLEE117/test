var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var fs = require('fs');
var template = require('./lib/template.js');
var mysql = require('mysql');
const db_info = {
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'meeting_log'
}

//정적 파일 디렉토리 지정
app.use(express.static('public'));
app.use(express.static(__dirname + '/public'));

app.get('*', function (request, response, next) {
    var connection = mysql.createConnection(db_info);
    connection.connect();
    connection.query('select * from category where active = 1', function (err, results, fields) {
        request.category = results;
        fs.readFile('sub_title.txt', 'utf-8', function (err, body) {
            var sub_title = body.split('\n');
            request.sub_title = sub_title;
            next();
        });
    })
})
app.post('*', function (request, response, next) {
    var connection = mysql.createConnection(db_info);
    connection.connect();
    connection.query('select * from category where active = 1', function (err, results, fields) {
        request.category = results;
        fs.readFile('sub_title.txt', 'utf-8', function (err, body) {
            var sub_title = body.split('\n');
            request.sub_title = sub_title;
            next();
        });
    })
})

//메인
app.get('/', function (req, res) {

    var html = template.main_html(req.category, req.sub_title);
    res.send(html);

});

//조회 페이지
app.get('/search', function (req, res) {
    var html = template.search_html(req.category, req.sub_title);
    res.send(html);
});

app.post('/search', function (req, res) {
    //post로 넘어온 정보 parse
    var post = req.body;
    var category = post.input_category;
    var sub_category = post.input_sub_category;
    var descripttion = post.descripttion;
    var html = ``;
    var category = post.selboxDirect;
    var start_day = post.start_day;
    var end_day = post.end_day;

    
    var html = template.search_result_html(post.input_category,post.input_sub_category,post.descripttion,
        post.start_day,post.end_day,req.category, req.sub_title);
    html = html + template.table();
    //db연결 sql문 작성
    var connection = mysql.createConnection(db_info);
    connection.connect();
    var sql = `select * from board where category LIKE '%${post.input_category}%' && sub_category LIKE "%${sub_category}%" && descripttion LIKE '%${descripttion}%'`;

    //날짜 처리
    if(start_day&&end_day){
        sql = sql + ` && time BETWEEN DATE('${start_day}') AND DATE('${end_day}')+1`;
    }else if(start_day){
        sql = sql + `&& time >= DATE('${start_day}')`;
    }else if(end_day){
        sql = sql + `&& time <= DATE('${end_day}')+1`;
    }

    sql = sql + ` ORDER BY time DESC`;

    console.log(sql);

        connection.query(sql, function (err,results,field) {
            for( i in results){
                var days = '';
            var day = results[i].time;
           days = days + day.getFullYear() +"."+ (day.getMonth()+1) + "."+day.getDate(); 
                html = html + `<tr align=\"center\"><td>${results[i].category}</td>
            <td>${results[i].sub_category}</td>
            <td align = "left">${results[i].descripttion}</td>
            <td>${days}</td></tr>`;
            }
            res.send(html);
        })
    
    
})

//인풋 처리
app.post('/log_insert', function (request, response) {
    var post = request.body;
    var category;

    category = post.input_category;
    if (post.input_category == "직접 입력") {
        var category = post.selboxDirect;
        var connection = mysql.createConnection(db_info);
        connection.connect();
        connection.query(`insert into category(title)  values('${category}')`, function (err, result, field) {

        })

    }
    var sub_category = post.input_sub_category;
    var description = post.description;

    var connection = mysql.createConnection(db_info);
    connection.connect();

    var sql = `insert into board(category, sub_category, descripttion, time) 
    values('${category}', '${sub_category}', '${description}', now());
    `;
    connection.query(sql, function (err, results, fields) {
        response.redirect('/');

    });

});


var server = app.listen(3001, function () { })