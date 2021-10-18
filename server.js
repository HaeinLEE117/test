const express = require('express');
const app = express();
app.use(express.static('public'));
app.use(express.static(__dirname + '/public'));

const server = app.listen(8001,()=>{
    console.log('start Server : localhost 3000')
});

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html',require('ejs').renderFile);

app.get('/', function(req,res){
    res.render('index.html')
    res.getElementById('car1').style.left="5000px";
    $( "p" ).append( "<strong>+"+"아무말이나쓰기"+"</strong>" );
})

app.get('/about', function(req,res){
    res.render('about.html')
})

app.get('/F1', function(req,res){
  res.render('F1.html')
})


app.get('/test', function(req,res){
  res.render('test.html')
})


