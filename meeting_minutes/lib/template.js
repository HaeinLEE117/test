module.exports = {
    main_html: function (category, sub_category) {
        html = ``;
        html = html + `<!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <title>Meeting Minutes</title>
            <link rel="stylesheet" href="css/style.css" />            
    <script src="//code.jquery.com/jquery-3.3.1.min.js"></script>
        </head>
        <body>
            <h1>Main</h1>
            <h3><a href="/search">조회 페이지수정을 해봣습니다</a></h3>

            <form action="/log_insert" method="post">
            <label for="input_category">대분류 (장비):</label>
<select name="input_category" id="input_category">`;

        for (i in category) {
            html = html + `<option value="${category[i].title}">${category[i].title}</option>`;
        }

        html = html + `
        <option value="직접 입력">직접 입력</option>
        </select>
        <input type="text" id="selboxDirect" name="selboxDirect"/>
        <label for="input_sub_category">소분류 :</label>
        <select name="input_sub_category" id="input_sub_category">`;
        for (i in sub_category) {
            html = html + `<option value="${sub_category[i]}">${sub_category[i]}</option>`;
        }
        html = html + `</select>
        <p>
            <textarea id="test" name="description" placeholder="내용 입력"></textarea>
            <div id="test_cnt">(0 / 250)</div>
          </p>
        <p>
        <input type="submit">
      </p>
    </form>
    <script>
$(function(){

    //직접 입력 인풋박스 

$("#selboxDirect").hide();

$("#input_category").change(function() {
      if($("#input_category").val() == "직접 입력") {
          $("#selboxDirect").show();
      }  else {
          $("#selboxDirect").hide();
      }
  }) 
});

//내용 입력 박스 글자 수 제한

$(document).ready(function() {
    $('#test').on('keyup', function() {
        $('#test_cnt').html("("+$(this).val().length+" / 250)");
 
        if($(this).val().length > 250) {
            $(this).val($(this).val().substring(0, 250));
            $('#test_cnt').html("(250 / 250)");
        }
    });
});

</script>
        </body>
        
        </html>`;
        return html;
    }, search_html: function (category, sub_category) {
        var html = `<!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <title>Meeting Minutes</title>
            <link rel="stylesheet" href="css/style.css" />            
    <script src="//code.jquery.com/jquery-3.3.1.min.js"></script>
        </head>
        <body>
            <h1><a href="/">Main</a></h1>
            <h3>조회 페이지</h3>
            <form action="/search" method="post" target='_blank'>
    <label for="input_category"> 대분류 (장비):</label>
<select name="input_category" id="input_category">
<option value=""></option>`;

        for (i in category) {
            html = html + `<option value="${category[i].title}">${category[i].title}</option>`;
        }

        html = html + `
</select>
<label for="input_sub_category"> 소분류 :</label>
<select name="input_sub_category" id="input_sub_category">
<option value=""></option>
`;
        for (i in sub_category) {
            html = html + `<option value="${sub_category[i]}">${sub_category[i]}</option>`;
        }
        html = html + `</select>
<label for="descripttion">내용 :</label>
<input type="text" id="descripttion" name="descripttion"/><p>
<label for="start_day"> 날짜 </label><input type="date" id = "start_day" name = "start_day"/>
<label for="end_day">부터  </label><input type="date" id = "end_day" name = "end_day"/>까지 <input type="submit" value ="조회">
</p>

</form>`;
        return html;

    }, search_result_html: function (selected_category, selected_sub_category, descripttion,
        start_day,end_day,
        category, sub_category) {
        var html = `<!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <title>Meeting Minutes</title>
            <link rel="stylesheet" href="css/style.css" />            
    <script src="//code.jquery.com/jquery-3.3.1.min.js"></script>
        </head>
        <body>
            <h1><a href="/">Main</a></h1>
            <h3>조회 페이지</h3>
            <form action="/search" method="post">
            <label for="input_category"> 대분류 (장비):</label>
            <select name="input_category" id="input_category">
            <option value="${selected_category}">${selected_category}</option>`;
            
                    for (i in category) {
                        html = html + `<option value="${category[i].title}">${category[i].title}</option>`;
                    }
            
                    html = html + `
            </select>
            <label for="input_sub_category"> 소분류 :</label>
            <select name="input_sub_category" id="input_sub_category">
            <option value="${selected_sub_category}">${selected_sub_category}</option>
            `;
                    for (i in sub_category) {
                        html = html + `<option value="${sub_category[i]}">${sub_category[i]}</option>`;
                    }
                    html = html + `</select>

<label for="descripttion">내용 :</label>
<input type="text" id="descripttion" name="descripttion" value = "${descripttion}"/><p>
<label for="start_day"> 날짜 </label><input type="date" id = "start_day" name = "start_day" value = "${start_day}"/>
<label for="end_day"> 부터 </label><input type="date" id = "end_day" name = "end_day" value = "${end_day}"/>까지
<input type="submit" value ="조회">
</p>

</form>`;
        return html;

    }, table : function () {
        var html = `<table border="1" width="100%" bgcolor="white" bordercolor=#003096 cellspacing="2" align="center" style="margin-top:40px">
        <tr align="center" bgcolor="white" style="font-weight:800">
            <td>대분류</td>
            <td>소분류</td>
            <td>내용</td>
            <td>작성 날짜</td>
        </tr>`;

        return html;

        
    }
}