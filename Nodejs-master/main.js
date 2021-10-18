var express = require('express')
var app = express()
var fs = require('fs');
var path = require('path');
var qs = require('querystring');
var bodyParser = require('body-parser');
var sanitizeHtml = require('sanitize-html');
var template = require('./lib/template.js');
var db_template = require('./lib/db_template.js');
const getResult = require('./lib/db');
var mysql = require('mysql');
const { type } = require('os');
var sql = require('./db_sql')();
const lineReader = require('line-reader');
const db_info = {
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'meta_0'
};



//정적 파일 디렉토리 지정
app.use(express.static('public'));
app.use(express.static(__dirname + '/public'));

//미들웨어 작성 예제
app.use(bodyParser.urlencoded({ extended: false }));
app.get('*', function (request, response, next) {
  //get으로 접속하는 모든 페이지에 ./data에 존재하는 filelist를 request.list에 담아 보냄
  fs.readdir('./data', function (error, filelist) {
    request.list = filelist;
    next();
  });
});
app.get('/state/*', function (request, response, next) {
  fs.readdir('./equm_state', function (error, filelist) {
    request.list = filelist;
    next();
  });
});

//장비 상태를 입력받는 페이지 코드. state파일에 장비유형 별 state정리
app.get('/state/:equmId', function (request, response) {
  var filteredId = path.parse(request.params.equmId).base;
  const file_name = filteredId[0] + filteredId[1];
//측정 및 검사기는 입력 단계가 많아 따로 처리
  if (file_name == 'me') {
    fs.readFile(`./equm_state/${file_name}.txt`, 'utf8', function (err, equm_state) {
      var title = request.params.pageId;
      var sanitizedTitle = sanitizeHtml(filteredId);
      var strArray = equm_state.split('\n');
      var html = db_template.me_state_list(filteredId, strArray);
      response.send(html);
    })
  } else {
    fs.readFile(`./equm_state/${file_name}.txt`, 'utf8', function (err, equm_state) {
      var title = request.params.pageId;
      var sanitizedTitle = sanitizeHtml(filteredId);
      var strArray = equm_state.split('\n');
      var html = db_template.state_list(filteredId, strArray);
      response.send(html);
    })
  }
});
//장비 상태 업데이트 처리하는 코드
app.post('/submit', function (request, response) {
  var post = request.body;
  var equm = post.equm;
  var input_state = post.equm_state;
  var input_user = post.user_number;
  var html = ``;
  var connection = mysql.createConnection(db_info);
  connection.connect();
  var sql = `select User from ${equm}_now ORDER BY seq desc`;
  connection.query(sql,
    function (error, results, fields) {
      if (results[0].User == null) {
        if (input_state != '') {
          connection.query(`insert into ${equm}_now(State,User, Time) VALUES("${input_state}", ${input_user}, now())`,
            function (error, results, fields) {
              html = html + `장비 업데이트 완료`;
            });
        } else {
          html = html + `이미 작업이 종료된 장비`;
        }
      } else {
        if (results[0].User == input_user) {
          if (input_state == '') {
            connection.query(`insert into ${equm}_now(Time) VALUES(now())`,
              function (error, results, fields) {
                html = html + `장비 종료 완료`;
              });
          } else {
            connection.query(`insert into ${equm}_now(State,User, Time) VALUES("${input_state}", ${input_user}, now())`,
              function (error, results, fields) {
                html = html + `장비 업데이트 완료`;
              });
          }
        } else {
          html = html + `이미 작업 중인 장비`;
        }

      }
      setTimeout(() => {
        html = html + `</br><input type="button" value="닫기" onClick="window.close()">`;
        response.send(html);
      }, 500);
    })


});
//AGV 클릭시 해당 호기의 정보를 보여주는 페이지
app.get('/AGV_DATA/:AGVnumber', function (request, response) {
  var number = path.parse(request.params.AGVnumber).base;
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
  });
  var html = db_template.AGV_info(number);
  connection.connect();
  connection.query(`SELECT PointNumber,Destination,time FROM agvlocation${number} ORDER BY time DESC`,
  function (error, results, fields) {
    for(i in results){
      html = html + `<tr align=\"center\"><td>${results[i].PointNumber}</td>
      <td>${results[i].Destination}</td>
      <td>${results[i].time}</td></tr>`;
    }
    html = html +`</tr></table>  </BODY>  </HTML>
`;
response.send(html);

});
});

//route, routing
//app.get('/', (req, res) => res.send('Hello World!'))
app.get('/', function (request, response) {
  var title = 'Welcome';
  var description = 'Hello, Node.js';
  var list = template.list(request.list);
  var html = template.HTML(title, list,
    `<h2>${title}</h2>${description}
      <img src = "/images/hello.png">`,
    `<a href="/F1">F1</a>`
  );
  console.log('someone accessed..')
  response.send(html);
});
app.get('/page/:pageId', function (request, response) {
  var filteredId = path.parse(request.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
    var title = request.params.pageId;
    var sanitizedTitle = sanitizeHtml(title);
    var sanitizedDescription = sanitizeHtml(description, {
      allowedTags: ['h1']
    });
    var list = template.list(request.list);
    var html = template.HTML(sanitizedTitle, list,
      `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
      ` <a href="/create">create</a>
          <a href="/update/${sanitizedTitle}">update</a>
          <form action="/delete_process" method="post">
            <input type="hidden" name="id" value="${sanitizedTitle}">
            <input type="submit" value="delete">
          </form>`
    );
    response.send(html);
  });
});
app.get('/create', function (request, response) {
  fs.readdir('./data', function (error, filelist) {
    var title = 'WEB - create';
    var list = template.list(filelist);
    var html = template.HTML(title, list, `
      <form action="/create_process" method="post">
        <p><input type="text" name="title" placeholder="title"></p>
        <p>
          <textarea name="description" placeholder="description"></textarea>
        </p>
        <p>
          <input type="submit">
        </p>
      </form>
    `, '');
    response.send(html);
  });
});
app.post('/create_process', function (request, response) {
  var post = request.body;
  var title = post.title;
  var description = post.description;
  fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
    response.writeHead(302, { Location: `/?id=${title}` });
    response.end();
  });
});



app.get('/update/:pageId', function (request, response) {
  fs.readdir('./data', function (error, filelist) {
    var filteredId = path.parse(request.params.pageId).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
      var title = request.params.pageId;
      var list = template.list(filelist);
      var html = template.HTML(title, list,
        `
        <form action="/update_process" method="post">
          <input type="hidden" name="id" value="${title}">
          <p><input type="text" name="title" placeholder="title" value="${title}"></p>
          <p>
            <textarea name="description" placeholder="description">${description}</textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
        `,
        `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
      );
      response.send(html);
    });
  });
});



app.post('/update_process', function (request, response) {
  var post = request.body;
  var id = post.id;
  var title = post.title;
  var description = post.description;
  fs.rename(`data/${id}`, `data/${title}`, function (error) {
    fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
      response.redirect(`/?id=${title}`);
    })
  });
});
app.post('/delete_process', function (request, response) {
  var post = request.body;
  var id = post.id;
  var filteredId = path.parse(id).base;
  fs.unlink(`data/${filteredId}`, function (error) {
    response.redirect('/');
  });
});

app.get('/F1_2', function (request, response) {
  let product = new Array;
  let line_color = new Array;
  let visibility = new Array;
  let direction = new Array;
  let time = new Array;
  let position = new Array;
  let destination = new Array;
  let ScaleX = new Array;
  let ScaleY = new Array;
  let equm = new Array("pattern3", "pattern4", "pattern1", "AO1", "TS", "welding10", "welding11",
    "welding6", "measurement8", "measurement9",
    "external5", "measurement10", "measurement1", "measurement2",
    "measurement6", "external3",
    "welding5","welding1","welding4","measurement3","measurement4",
    "3D_scanner");

  let today = new Date();
  let user = new Array;
  let working = new Array;
  let working_time = new Array;
  let state = new Array;
  let color = new Array('#a5a5a5', '#d4cd00', '#3369d4', '#6f04b0');
  let vehicle_running = new Array;


  //목적지를 보고 line 색상을 결정해주는 함수
  function return_line(destination) {
    switch (destination) {
      case 306:
      case 1102:
        return 1;
        break;
      case 101:
      case 406:
        return 2;
        break;
      case 306:
      case 2102:
        return 3;
        break;
      case 14:
        return 4;
        break;
      default:
        return 0;
    }
  }

  //db접근(AGV)
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
  });
  connection.connect();
  //SQL문 1번 AGBS_Info 테이블에서 통합정보 제품 운반여부, 차체색상을 가져온다
  connection.query(`select * from agvs_info ORDER BY VehicleNumber asc`,
    function (error, results, fields) {
      for (i in results) {
        if (results[i].Product) {
          product.push("initial");
        } else {
          product.push("hidden");
        }
      }
    });
    
  //        SQL문 2번:: 각 agv 호기 테이블에서 시간, 방향, 마지막위치, 목적지(주행여부)를 가져옴
  for (var i = 0; i < 4; i++) {
    connection.query(`select Time,PointNumber,Destination from agvlocation? ORDER BY Time desc limit 1`, [i + 1],
      function (error, result, fields) {
        time.push(result[0].Time);
        position.push(result[0].PointNumber);
        destination.push(result[0].Destination);
        if (result[0].Destination < 0) {
          vehicle_running.push('yellow');
          direction.push("blank.png");
        } else if (result[0].Destination > 0 && result[0].Time) {
          var r = today - result[0].Time;
          if ((r / 6000) > 80) {
            vehicle_running.push('yellow');
            direction.push("blank.png");
          } else {
            vehicle_running.push("#02c706");
            if ((parseInt(result[0].Destination) - parseInt(result[0].PointNumber)) >= 500) {
              direction.push("up.gif");
            } else if ((parseInt(result[0].Destination) - parseInt(result[0].PointNumber)) <= -500) {
              direction.push("down.gif");
            }
            else {
              if (parseInt(result[0].Destination) - parseInt(result[0].PointNumber) > 0) {
                direction.push("left.gif");
              }
              else {
                direction.push("right.gif");
              }
            }

          }
        } else {
          vehicle_running.push('red');
          direction.push("blank.png");
        }
 
          var connection2 = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'agv_monitor'
          });
          connection2.query(`select ScaleX,ScaleY from PointInfo1000 where seq=${parseInt(result[0].PointNumber)}`,
            function (error, results, fields) {
              ScaleX.push(results[0].ScaleX);
              ScaleY.push(results[0].ScaleY);
            });
       
      });
  }

  // SQL문 3번 장비 정보 
  var connection3 = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'meta_0'
  });
  // array 사용해서 장비 상태 가져오기
  connection3.connect();
  for (i in equm) {
    connection3.query(`select State,User,Time from ${equm[i]}_now ORDER BY seq desc limit 1`,
      function (err, result, field) {

        working_time.push(parseInt((today - result[0].Time) / 60000));
        if (result[0].State == null) {
          state.push("대기 중..");
          working.push("off.png");
          connection3.query(`update user set unset=1 where User_no=${result[0].User}`);
          user.push("n.png");
        } else {
          state.push(result[0].State);
          working.push("on.gif");
          connection3.query(`update user set unset=0 where User_no=${result[0].User}`);
          user.push(`user${result[0].User}.gif`);
        }
      });
  }


    for (var i = 0; i < 4; i++) {
//1층이 아닌 장소에 있는 agv는 2, 3 층 버튼 밑에 위치하도록 
      if ((parseInt(position[i]) / 1000) > 2) {
        ScaleX[i] =(420);
        ScaleY[i] = (68 +  i * 30);
      } else if ((parseInt(position[i]) / 1000) > 1) {
        ScaleX[i]=(247);
        ScaleY[i]=(88 +  i * 30);
      }
      if (vehicle_running[i] === "#02c706") {
        line_color[return_line(destination[i])] = color[i];
      }
    }
    response.send(db_template.meta(ScaleX, ScaleY, time, product, destination, direction, position, equm,
      working, state, working_time, user, line_color, vehicle_running));


});
app.get('/tester', function (request, response) {
  var tmp = [1,2,3,4,5,6,7,8,9,7,6,54,3,2,54,62,4315,76]
    for (var i = 0; i < 4; i++) {
//1층이 아닌 장소에 있는 agv는 2, 3 층 버튼 밑에 위치하도록 
      if ((parseInt(tmp[i]) / 1000) > 2) {
        ScaleX[i] =(420);
        ScaleY[i] = (68 +  i * 30);
      } else if ((parseInt(tmp[i]) / 1000) > 1) {
        ScaleX[i]=(247);
        ScaleY[i]=(88 +  i * 30);
      }

    }
    html = db_template.meta(tmp, tmp, tmp, tmp, tmp, tmp, tmp, tmp,
      tmp, tmp, tmp, tmp, tmp, tmp);
  


    response.send(html);


});

app.get('/F1_3', function (request, response) {
  let product = new Array;
  let color = new Array;
  let visibility = new Array;
  let direction = new Array;
  let time = new Array;
  let position = new Array;
  let destination = new Array;

  function agv_location(callback) {
    for (var i = 0; i < 11; i++) {
      var sql_str = `select Time,PointNumber,Destination from agvlocation${i + 1} ORDER BY Time desc limit 1`;
      var sql2 = require('./db_sql2')(sql_str);
      sql2.select(function (err, data) {
        time.push(data[0].Time);
        position.push(data[0].PointNumber);
        destination.push(data[0].Destination);
      });
    }
    callback();
  }
  function log_out() {
    console.log(position);
  }

  console.log('app.js started');

  //SQL문 1번 AGBS_Info 테이블에서 통합정보 제품 운반여부, 차체색상을 가져온다
  sql.select(function (err, data) {
    for (i in data) {
      product.push(data[i].Product);
      color.push(data[i].Color);
      // 차량의 좌, 우 방향과 상품을 화면상에서 숨겨둔다
      visibility.push("hidden");
      direction.push("blank.png");
    }
    response.send(product);
    agv_location(log_out);
  });
});

//---------------------------------------------------------------------------

app.get('/F1', function (request, response) {
  let product = new Array;
  let line_color = new Array;
  let visibility = new Array;
  let direction = new Array;
  let time = new Array;
  let position = new Array;
  let destination = new Array;
  let ScaleX = new Array;
  let ScaleY = new Array;
  let equm = new Array("pattern3", "pattern4", "pattern1", "AO1", "TS", "welding10", "welding11",
    "welding6", "measurement8", "measurement9",
    "external5", "measurement10", "measurement1", "measurement2",
    "measurement6", "external3",
    "welding5","welding1","welding4","measurement3","measurement4",
    "3D_scanner");

  let today = new Date();
  let user = new Array;
  let working = new Array;
  let working_time = new Array;
  let state = new Array;
  let color = new Array('#a5a5a5', '#d4cd00', '#3369d4', '#6f04b0');
  let vehicle_running = new Array;


  //목적지를 보고 line 색상을 결정해주는 함수
  function return_line(destination) {
    switch (destination) {
      case 306:
      case 1102:
        return 1;
        break;
      case 101:
      case 406:
        return 2;
        break;
      case 306:
      case 2102:
        return 3;
        break;
      case 14:
        return 4;
        break;
      default:
        return 0;
    }
  }

  //db접근(AGV)
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
  });
  connection.connect();
  //SQL문 1번 AGBS_Info 테이블에서 통합정보 제품 운반여부, 차체색상을 가져온다
  connection.query(`select * from agvs_info ORDER BY VehicleNumber asc`,
    function (error, results, fields) {
      for (i in results) {
        if (results[i].Product) {
          product.push("initial");
        } else {
          product.push("hidden");
        }
      }
    });

  //        SQL문 2번:: 각 agv 호기 테이블에서 시간, 방향, 마지막위치, 목적지(주행여부)를 가져옴
  for (var i = 0; i < 4; i++) {
    connection.query(`select Time,PointNumber,Destination from agvlocation? ORDER BY Time desc limit 1`, [i + 1],
      function (error, result, fields) {
        time.push(result[0].Time);
        position.push(result[0].PointNumber);
        destination.push(result[0].Destination);
        if (result[0].Destination < 0) {
          vehicle_running.push('yellow');
          direction.push("blank.png");
        } else if (result[0].Destination > 0 && result[0].Time) {
          var r = today - result[0].Time;
          if ((r / 6000) > 80) {
            vehicle_running.push('yellow');
            direction.push("blank.png");
          } else {
            vehicle_running.push("#02c706");
            if ((parseInt(result[0].Destination) - parseInt(result[0].PointNumber)) >= 500) {
              direction.push("up.gif");
            } else if ((parseInt(result[0].Destination) - parseInt(result[0].PointNumber)) <= -500) {
              direction.push("down.gif");
            }
            else {
              if (parseInt(result[0].Destination) - parseInt(result[0].PointNumber) > 0) {
                direction.push("left.gif");
              }
              else {
                direction.push("right.gif");
              }
            }

          }
        } else {
          vehicle_running.push('red');
          direction.push("blank.png");
        }
 
          var connection2 = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'agv_monitor'
          });
          
          connection2.query(`select ScaleX,ScaleY from PointInfo1000 where seq=${parseInt(result[0].PointNumber)}`,
            function (error, results, fields) {
              ScaleX.push(results[0].ScaleX);
              ScaleY.push(results[0].ScaleY);
            });
       
      });
  }

  // SQL문 3번 장비 정보 
  var connection3 = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'meta_0'
  });
  // array 사용해서 장비 상태 가져오기
  connection3.connect();
  for (i in equm) {
    connection3.query(`select State,User,Time from ${equm[i]}_now ORDER BY seq desc limit 1`,
      function (err, result, field) {

        working_time.push(parseInt((today - result[0].Time) / 60000));
        if (result[0].State == null) {
          state.push("대기 중..");
          working.push("off.png");
          connection3.query(`update user set unset=1 where User_no=${result[0].User}`);
          user.push("n.png");
        } else {
          state.push(result[0].State);
          working.push("on.gif");
          connection3.query(`update user set unset=0 where User_no=${result[0].User}`);
          user.push(`user${result[0].User}.gif`);
        }
      });
  }


  var html = ``;

  setTimeout(() => {
    for (var i = 0; i < 4; i++) {
//1층이 아닌 장소에 있는 agv는 2, 3 층 버튼 밑에 위치하도록 
      if ((parseInt(position[i]) / 1000) > 2) {
        ScaleX[i] =(420);
        ScaleY[i] = (68 +  i * 30);
      } else if ((parseInt(position[i]) / 1000) > 1) {
        ScaleX[i]=(247);
        ScaleY[i]=(88 +  i * 30);
      }
      if (vehicle_running[i] === "#02c706") {
        line_color[return_line(destination[i])] = color[i];
      }
    }
    html = db_template.meta(ScaleX, ScaleY, time, product, destination, direction, position, equm,
      working, state, working_time, user, line_color, vehicle_running);
  }, 300);

  setTimeout(() => {
    response.send(html);
  }, 500);

});

//------------------------------3층 코드-------------------------------

app.get('/F3', function (request, response) {
  let product = new Array;
  let line_color = new Array;
  let visibility = new Array;
  let direction = new Array;
  let time = new Array;
  let position = new Array;
  let destination = new Array;
  let ScaleX = new Array;
  let ScaleY = new Array;
  let equm = new Array("welding8","welding9","measurement11","coating1","coating2","coating3");

  let today = new Date();
  let user = new Array;
  let working = new Array;
  let working_time = new Array;
  let state = new Array;
  let color = new Array('#a5a5a5', '#d4cd00', '#3369d4', '#6f04b0');
  let vehicle_running = new Array;


  //목적지를 보고 line 색상을 결정해주는 함수
  function return_line(destination) {
    switch (destination) {
      case 306:
      case 1102:
        return 1;
        break;
      case 101:
      case 406:
        return 2;
        break;
      case 306:
      case 2102:
        return 3;
        break;
      case 14:
        return 4;
        break;
      default:
        return 0;
    }
  }

  //db접근(AGV)
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
  });
  connection.connect();
  //SQL문 1번 AGBS_Info 테이블에서 통합정보 제품 운반여부, 차체색상을 가져온다
  connection.query(`select * from agvs_info ORDER BY VehicleNumber asc`,
    function (error, results, fields) {
      for (i in results) {
        if (results[i].Product) {
          product.push("initial");
        } else {
          product.push("hidden");
        }
      }
    });
  //        SQL문 2번:: 각 agv 호기 테이블에서 시간, 방향, 마지막위치, 목적지(주행여부)를 가져옴
  for (var i = 0; i < 4; i++) {
    connection.query(`select Time,PointNumber,Destination from agvlocation? ORDER BY Time desc limit 1`, [i + 1],
      function (error, result, fields) {
        time.push(result[0].Time);
        position.push(result[0].PointNumber);
        destination.push(result[0].Destination);
        if (result[0].Destination < 0) {
          vehicle_running.push('yellow');
          direction.push("blank.png");
        } else if (result[0].Destination > 0 && result[0].Time) {
          var r = today - result[0].Time;
          if ((r / 6000) > 8000) {
            vehicle_running.push('yellow');
            direction.push("blank.png");
          } else {
            vehicle_running.push("#02c706");
            if ((parseInt(result[0].Destination) - parseInt(result[0].PointNumber)) >= 500) {
              direction.push("up.gif");
            } else if ((parseInt(result[0].Destination) - parseInt(result[0].PointNumber)) <= -500) {
              direction.push("down.gif");
            }
            else {
              if (parseInt(result[0].Destination) - parseInt(result[0].PointNumber) > 0) {
                direction.push("left.gif");
              }
              else {
                direction.push("right.gif");
              }
            }

          }
        } else {
          vehicle_running.push('red');
          direction.push("blank.png");
        }
        
          var connection2 = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'agv_monitor'
          });
          connection2.query(`select ScaleX,ScaleY from PointInfo1000 where seq=${parseInt(result[0].PointNumber)}`,
            function (error, results, fields) {
              ScaleX.push(results[0].ScaleX);
              ScaleY.push(results[0].ScaleY);
            });
        
      });
  }

  // SQL문 3번 장비 정보 
  var connection3 = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'meta_0'
  });
  // array 사용해서 장비 상태 가져오기
  connection3.connect();
  for (i in equm) {
    connection3.query(`select State,User,Time from ${equm[i]}_now ORDER BY seq desc limit 1`,
      function (err, result, field) {

        working_time.push(parseInt((today - result[0].Time) / 60000));
        if (result[0].State == null) {
          state.push("대기 중..");
          working.push("off.png");
          connection3.query(`update user set unset=1 where User_no=${result[0].User}`);
          user.push("n.png");
        } else {
          state.push(result[0].State);
          working.push("on.gif");
          connection3.query(`update user set unset=0 where User_no=${result[0].User}`);
          user.push(`user${result[0].User}.gif`);
        }
      });
  }


  var html = ``;

  setTimeout(() => {
    for (var i = 0; i < 4; i++) {
//3층이 아닌 장소에 있는 agv는 1,2층 버튼 밑에 위치하도록 
      if ((parseInt(position[i]) / 1000) < 1) {
        ScaleX[i] = 85;
        ScaleY[i] = (68 + i * 30);
      } else if ((parseInt(position[i]) / 1000) < 2) {
        ScaleX[i] = 219;
        ScaleY[i] = (88 + i *30);
      }
      if (vehicle_running[i] === "#02c706") {
        line_color[return_line(destination[i])] = color[i];
      }
    }
    html = db_template.floor_3(ScaleX, ScaleY, time, product, destination, direction, position, equm,
      working, state, working_time, user, line_color, vehicle_running);
  }, 300);

  setTimeout(() => {
    response.send(html);
  }, 500);

});

// proceed input from AGV
// AGV에서 보내는 정보를 DB에 처리하는 부분 API
app.get('/AGV/:VN/:point/:des/:pro', async (req, res) => {
  var fail_res = {message:'failed'};
  var ok_res = {message : 'query ok'};
  console.log(typeof(fail_res));
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
  });
  connection.connect();
  sql = `insert into agvlocation${req.params.VN} 
  (PointNumber, Destination, Time)
  VALUES (${req.params.point}, ${req.params.des}, 
  now())`;
  connection.query(sql, (err, result) => {
    if (err) {
      console.log("something wrong");
      res.json(fail_res);
    }else{
    sql = `update agvs_info set Product = ${req.params.pro} 
    WHERE VehicleNumber = ${req.params.VN}`;
    connection.query(sql, (err, result) => {
      if (err) {
        console.log('wrong isnert');
        res.send('failed...');
      }
      console.log(result);
      res.json(ok_res);
    });
  }
    console.log(result);
    connection.end();
  });


});




app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});



//임시 ㅁ2층
app.get('/F2', function (request, response) {
  let product = new Array;
  let line_color = new Array;
  let visibility = new Array;
  let direction = new Array;
  let time = new Array;
  let position = new Array;
  let destination = new Array;
  let ScaleX = new Array;
  let ScaleY = new Array;
  let equm = new Array("welding8","welding9","measurement11","coating1","coating2","coating3");

  let today = new Date();
  let user = new Array;
  let working = new Array;
  let working_time = new Array;
  let state = new Array;
  let color = new Array('#a5a5a5', '#d4cd00', '#3369d4', '#6f04b0');
  let vehicle_running = new Array;


  //목적지를 보고 line 색상을 결정해주는 함수
  function return_line(destination) {
    switch (destination) {
      case 306:
      case 1102:
        return 1;
        break;
      case 101:
      case 406:
        return 2;
        break;
      case 306:
      case 2102:
        return 3;
        break;
      case 14:
        return 4;
        break;
      default:
        return 0;
    }
  }

  //db접근(AGV)
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
  });
  connection.connect();
  //SQL문 1번 AGBS_Info 테이블에서 통합정보 제품 운반여부, 차체색상을 가져온다
  connection.query(`select * from agvs_info ORDER BY VehicleNumber asc`,
    function (error, results, fields) {
      for (i in results) {
        if (results[i].Product) {
          product.push("initial");
        } else {
          product.push("hidden");
        }
      }
    });
  //        SQL문 2번:: 각 agv 호기 테이블에서 시간, 방향, 마지막위치, 목적지(주행여부)를 가져옴
  for (var i = 0; i < 4; i++) {
    connection.query(`select Time,PointNumber,Destination from agvlocation? ORDER BY Time desc limit 1`, [i + 1],
      function (error, result, fields) {
        time.push(result[0].Time);
        position.push(result[0].PointNumber);
        destination.push(result[0].Destination);
        if (result[0].Destination < 0) {
          vehicle_running.push('yellow');
          direction.push("blank.png");
        } else if (result[0].Destination > 0 && result[0].Time) {
          var r = today - result[0].Time;
          if ((r / 6000) > 8000) {
            vehicle_running.push('yellow');
            direction.push("blank.png");
          } else {
            vehicle_running.push("#02c706");
            if ((parseInt(result[0].Destination) - parseInt(result[0].PointNumber)) >= 500) {
              direction.push("up.gif");
            } else if ((parseInt(result[0].Destination) - parseInt(result[0].PointNumber)) <= -500) {
              direction.push("down.gif");
            }
            else {
              if (parseInt(result[0].Destination) - parseInt(result[0].PointNumber) > 0) {
                direction.push("left.gif");
              }
              else {
                direction.push("right.gif");
              }
            }

          }
        } else {
          vehicle_running.push('red');
          direction.push("blank.png");
        }
        
          var connection2 = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'agv_monitor'
          });
          connection2.query(`select ScaleX,ScaleY from PointInfo1000 where seq=${parseInt(result[0].PointNumber)}`,
            function (error, results, fields) {
              ScaleX.push(results[0].ScaleX);
              ScaleY.push(results[0].ScaleY);
            });
        
      });
  }

  // SQL문 3번 장비 정보 
  var connection3 = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'meta_0'
  });
  // array 사용해서 장비 상태 가져오기
  connection3.connect();
  for (i in equm) {
    connection3.query(`select State,User,Time from ${equm[i]}_now ORDER BY seq desc limit 1`,
      function (err, result, field) {

        working_time.push(parseInt((today - result[0].Time) / 60000));
        if (result[0].State == null) {
          state.push("대기 중..");
          working.push("off.png");
          connection3.query(`update user set unset=1 where User_no=${result[0].User}`);
          user.push("n.png");
        } else {
          state.push(result[0].State);
          working.push("on.gif");
          connection3.query(`update user set unset=0 where User_no=${result[0].User}`);
          user.push(`user${result[0].User}.gif`);
        }
      });
  }


  var html = ``;

  setTimeout(() => {
    for (var i = 0; i < 4; i++) {
//3층이 아닌 장소에 있는 agv는 1,2층 버튼 밑에 위치하도록 
      if ((parseInt(position[i]) / 1000) < 1) {
        ScaleX[i] = 85;
        ScaleY[i] = (68 + i * 30);
      } else if ((parseInt(position[i]) / 1000) > 2) {
        ScaleX[i] = 405619;
        ScaleY[i] = (88 + i *30);
      }
      if (vehicle_running[i] === "#02c706") {
        line_color[return_line(destination[i])] = color[i];
      }
    }
    html = db_template.floor_2(ScaleX, ScaleY, time, product, destination, direction, position, equm,
      working, state, working_time, user, line_color, vehicle_running);
  }, 300);

  setTimeout(() => {
    response.send(html);
  }, 500);

});