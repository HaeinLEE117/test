var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
});
connection.connect();

function query_return(sql_query){
    connection.query(sql_query,function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        sql_query = results[0].PointNumber;
    });
    return sql_query;
}


module.exports = {

    
    get_postion:function(template){
        var tmp=1;
        connection.query('select Time,PointNumber,Destination from agvlocation4 ORDER BY Time desc limit 1', 
        function (error, results, fields) {
            tmp = results[0].PointNumber;
            template = template+`
            <!doctype html>
            <html>
            <head>
              <title>WEB1 - Welcome</title>
              <meta charset="utf-8">
            </head>
            <body>
              <h1><a href="index.html">WEB</a></h1>
              <p>
              <div style ="width :30px; height :30px; position: absolute;
              background-color:yellow;
              left:${tmp}px; top:${tmp}px;
              ">test</div>
              </p>
            </body>
            </html>
            `;
            connection.end();
            console.log("리턴 직전 값 : "+tmp);
            return tmp;
        })
    }
    

    
}