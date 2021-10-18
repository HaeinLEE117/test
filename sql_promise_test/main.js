const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'agv_monitor'
});
connection.connect();
var sql = `select Time,PointNumber,Destination from agvlocation1 ORDER BY Time desc limit 1`;


          let product = new Array;
          let color = new Array;
          let visibility = new Array;
          let direction = new Array;
          let time = new Array;
          let position = new Array;
          let destination = new Array;


    connection.query(sql, function(error,results,fields){
        product.push(results[0].Time);
        console.log(`Inner sql : ${product}`);
    })
      
//promise.then(pro=>{console.log(pro)});

setTimeout(()=>{console.log(product)},2000);


