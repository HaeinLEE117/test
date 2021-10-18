const express = require('express');
const mysql = require('mysql');

// DB connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'nodemysql'
});

db.connect((err)=>{
    if(err){
        throw err;
    }
    console.log('MySql connected..');
});
const app = express();

app.get('/createdb',(req,res)=>{
    let sql = 'create database nodemysql';
    db.query(sql, (err,result)=>{
        if(err) throw err;
        console.log(result);
        res.send('database created..');
    });

})

app.get('/create_posttable',(req,res)=>{
    let sql = 'create table post(id int auto_increment, title varchar(255), body varchar(225), primary key (id)) ';
    db.query(sql,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.send('Posts table created..');

    });
});

app.get('/add_post1',(req,res)=>{
    let post = {title : 'Post one', body :"this is post numbert 1"};
    let sql = 'insert into post set ?';
    let query = db.query(sql, post,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.send('Posts one added..');
    });
});

app.get('/getposts',(req,res)=>{
    let sql = 'select * from post';
    let query = db.query(sql,(err,results)=>{
        if(err) throw err;
        console.log(results);
        res.send('Posts patched...');
    });
});

//select single post
app.get('/getpost/:id',(req,res)=>{
    let sql = `select * from post where id = ${req.params.id}`;
    let query = db.query(sql,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.send('Post patched...');
    });
});

//update post
app.get('/updatetpost/:id',(req,res)=>{
    let newTitle = 'Updated Title';
    let sql = `update post set title = '${newTitle}' where id = ${req.params.id}`;
    let query = db.query(sql,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.send('Post updated...');
    });
});
app.listen('3000',()=>{
    console.log("server started on port 3000");
});