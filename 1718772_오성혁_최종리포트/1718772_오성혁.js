// 라이브러리 import
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { use } = require('express/lib/application');
const app = express();

//id_pw를 담을 객체 생성
let id_pw={"id_s" : [],"pw_s" :[]}

// id_pw가 저장된 파일을 읽어와서 id_pw에 저장
let a = fs.readFileSync('id_pw.txt','utf-8').toString()
a = JSON.parse(a);
id_pw.id_s=a.id_s
id_pw.pw_s=a.pw_s
console.log(id_pw)

// pw시도 제한을 위한 변수
let pw_num=0;
// 현재 로그인 되어 있는 id 저장, 로그인 성공 후 id에 맞는 정보를 들고 오기 위함
let current_id=0;

app.use(bodyParser.urlencoded({extended: true})) 

// 처음 서버에 접속했을 때 보이는 화면 설정, root page 설정
app.get("",(request,response)=>{
  let url = request.url;
  if(url == '/'){
    url = '/login.html';
  }
  response.writeHead(200);
  response.end(fs.readFileSync(__dirname + url));
})

// root page에서 회원가입 버튼을 누르면 join.html페이지가 띄어짐.
app.get("/join",(request,response)=>{
  let url = request.url;
  if(url == '/join'){
    url = '/join.html';
  }
  response.writeHead(200);
  response.end(fs.readFileSync(__dirname + url));
})

// id와 pw true/false 여부
app.post("/check",(request,response)=>{
  current_id = request.body.id;
  // id가 없으면 경고창이 띄어짐
  if(id_pw.id_s.includes(request.body.id)==false){
    let url = "/alert_id.html";
    response.writeHead(200,{'Content-type':'text/html; charset=utf-8'});
    response.end(fs.readFileSync(__dirname + url));
    }

  // id가 있으면 else if문을 통해 패스워드 검사
  else if(id_pw.pw_s[id_pw.id_s.indexOf(request.body.id)]!=request.body.pw){
    // 패스워드가 틀리면 카운터가 올라가며 3번 미만이면 경고창이 나타나며 root page로 돌아간다, 3번 이상이면 화면에 특정 메세지 표시
    pw_num++;
    // console.log(pw_num)
    if(pw_num>=3){
      response.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});
      response.write("비밀번호를 3번 이상 틀렸습니다! <br> 문의) osh990129@gmail.com");
      response.end()
    }
    else{
      console.log(pw_num)
      response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
      response.write("<script>alert('패스워드가 존재하지 않습니다.')</script>")
      response.write("<script>window.location='/'</script>")
    }
  }
  // id가 있으면 다음 페이지로 넘어간다. 이때 받은 id가 admin이면 manager페이지로 넘어가고 아니면 수강신청 페이지로 넘어간다.
  else{
    if(request.body.id=="admin"){
      response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
      response.write("<script>window.location='/manager'</script>")
    }
    else{
      current_id = request.body.id;
      response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
      response.write("<script>window.location='/next'</script>")
    }

  }

})

// 회원가입 시 id존재 여부 확인 pw는 중복 가능, 존재하면 존재한다고 경고창이 뜸, 성공하면 특정 메세지를 경고창으로 띄운 후 root page 로 이동
app.post("/join_check",(request,response)=>{
  if(id_pw.id_s.includes(request.body.id)==false){
      id_pw.id_s.push(request.body.id);
      id_pw.pw_s.push(request.body.pw);
      fs.writeFileSync("id_pw.txt",JSON.stringify(id_pw),'utf-8')
      // 가입한 사용자들을 위한 수강신청 가능한 교과목 리스트와 수강신청 한 교과목(init버전)리스트 파일을 생성, 파일이름을 id+_class/id+_enrol으로 생성함
      let origin_class = fs.readFileSync(`original_class_list.txt`,'utf-8').toString()
      let origin_enrol = fs.readFileSync(`original_enrol_list.txt`,'utf-8').toString()
      fs.writeFileSync(`${request.body.id}_classes.txt`,origin_class,'utf-8')
      fs.writeFileSync(`${request.body.id}_enrol.txt`,origin_enrol,'utf-8')

      response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
      response.write("<script>alert('가입을 축하드립니다.')</script>")
      response.write("<script>window.location='/'</script>")
      
    }
  else{
    response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    response.write("<script>alert('id exist! Please different id!.')</script>" );
    response.write("<script>window.location='/join'</script>");
  }

})
// 과목추가삭제 코드
app.get("/next",(req,res)=>{
  // 파일에 저장되어 있는 신청 가능한 과목과 신청한 과목 table로 보여주기
  let total_credit = 0; // 신청한 학점을 계산하기 위한 변수
  let table = fs.readFileSync(`${current_id}_classes.txt`,'utf-8').toString()
  table = JSON.parse(table);
  let table2 = fs.readFileSync(`${current_id}_enrol.txt`,'utf-8').toString()
  table2 = JSON.parse(table2);

  let next = fs.readFileSync('next.html','utf-8').toString()

  let classes = `<table id="tb" border=1  style="float:left;"> <th>신청가능한 과목</th><th>학점</th>`
  for(let i=0; i<table.class.length; i++){
    classes+=`<tr><td>${table.class[i]}<td>${table.credit[i]}`
  }
  classes+=`</table>`

  classes+= `<table id="tb"border=3px solid black  style="float:left;"> <th>신청한 과목</th><th>학점</th>`
  for(let i=0; i<table2.class.length; i++){
    classes+=`<tr><td>${table2.class[i]}<td>${table2.credit[i]}`
  }
  classes+=`</table>`

  for(let i=0; i<table2.credit.length; i++){
    total_credit+=table2.credit[i]
  }

  
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'})
  res.write(next)
  res.write(`<h3>총 수강 신청한 학점 : ${total_credit}</h3>`)
  res.write("<style> #tb{ border: 3px solid black;background-color: rgb(178,190,181);color: black;padding: 5px;}</style>")
  res.write(classes)
  res.end()
  // 수강신청 페이지에서 원하는 과목을 입력 후 추가 버튼이나 삭제 버튼을 누르면 작동하는 코드
  app.post("/add",(req,res)=>{
    let value = req.body.butt
    console.log(value)
    // 누른 버튼의 value값이 add인지 del인지 판단하는 조건문
    if(value=="add"){
      // 현재 신청가능한 과목 중 사용자가 입력한 과목의 존재 여부 판단, 없으면 특정 메세지를 넣은 경고창 실행
      if(table.class.includes(req.body.class_name)==true){
        let class_index=table.class.indexOf(req.body.class_name)

        table2.class.push(req.body.class_name)
        total_credit+=table.class
        table2.credit.push(table.credit[class_index])

        table.class.splice(class_index,1)
        table.credit.splice(class_index,1)

        fs.writeFileSync(`${current_id}_classes.txt`,JSON.stringify(table),'utf-8')
        fs.writeFileSync(`${current_id}_enrol.txt`,JSON.stringify(table2),'utf-8')
        
        res.send("<script>window.location='/next'</script>")
      }
      // 없으면 경고창 실행
      else{
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
        res.write(`<script>alert('-오타입력-${req.body.class_name}')</script>`)
        res.write(`<script>window.location='/next'</script>`)
      }
    }
    // 버튼의 value가 del이면 실행
    else if(value=="del"){
      if(table2.class.includes(req.body.class_name)==true){
        // 삭제하려는 과목이 수강신청한 과목에 존재하는지 판단
        let class_index = table2.class.indexOf(req.body.class_name)
        total_credit-=table.class
        table.class.push(req.body.class_name)
        table.credit.push(table2.credit[class_index])

        table2.class.splice(class_index,1)
        table2.credit.splice(class_index,1)

        fs.writeFileSync(`${current_id}_classes.txt`,JSON.stringify(table),'utf-8')
        fs.writeFileSync(`${current_id}_enrol.txt`,JSON.stringify(table2),'utf-8')
        res.send("<script>window.location='/next'</script>")
      }
      // 없으면 경고창 실행
      else{
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
        res.write(`<script>alert('-오타입력-${req.body.class_name}')</script>`)
        res.write(`<script>window.location='/next'</script>`)
      }
    } 
  })

  
})
// admin으로 로그인하면 /manager.html 실행
app.get("/manager",(req,res)=>{

    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'})
    res.end(fs.readFileSync(__dirname + '/manager.html'));

})
// 관리자모드에서 form으로 값을 post로 넘겨주면 실행되는 코드
app.post("/manager",(req,res)=>{
  // 교과목 관리버튼, 교과목 추가버튼 , 교과목 삭제버튼 , 교과목 수정버튼들이 눌렸을 때만 실행되는 코드
  if(req.body.management_n=="management" || req.body.management_n=="add_v" || req.body.management_n=="del_v" || req.body.management_n=="chan_v"||req.body.management_n == "chan_v2"){
    // 교과목 추가버튼을 눌렸을 때 실행
    if(req.body.management_n=="add_v"){
      // original 교과목 리스트에 사용자가 입력한 교과목 이름과 학점 추가
      let total_class = fs.readFileSync("original_class_list.txt",'utf-8').toString()
      total_class=JSON.parse(total_class)
      total_class.class.push(req.body.class_n)
      total_class.credit.push(Number(req.body.credit))
      fs.writeFileSync("original_class_list.txt",JSON.stringify(total_class),'utf-8')

      // 이용하는 사용자들의 id를 파일에서 가져와 id마다 수강신청 가능한 교과목에도 추가
      let user = fs.readFileSync("id_pw.txt",'utf-8').toString()
      user=JSON.parse(user)
      for(let i  =0; i<user.id_s.length; i++){
        let user_id = user.id_s[i]
        if(user_id=="admin"){
          continue;
        }
        let user_info=JSON.parse(fs.readFileSync(`${user_id}_classes.txt`,'utf-8').toString())
        user_info.class.push(req.body.class_n)
        user_info.credit.push(Number(req.body.credit))
        fs.writeFileSync(`${user_id}_classes.txt`,JSON.stringify(user_info),'utf-8')
      }   
    }
    // 교과목 삭제 버튼이 눌렸을 때 실행
    else if(req.body.management_n=="del_v"){
      let total_class = fs.readFileSync("original_class_list.txt",'utf-8').toString()
      total_class=JSON.parse(total_class)
      // 삭제 할 교과목 이름을 변수에 저장
      del_class = req.body.class_n
      // 삭제 할 교과목이 존재하는 여부 판단 존재하지 않는다면 경과창 실행
      if(total_class.class.includes(del_class)){
        // original 교과목 리스트에서 삭제
        del_class_index = total_class.class.indexOf(del_class)
        total_class.class.splice(del_class_index,1)
        total_class.credit.splice(del_class_index,1)
        fs.writeFileSync("original_class_list.txt",JSON.stringify(total_class),'utf-8')
        
        //유저별로 삭제하기 위해 id이 들어있는 파일 read
        let user = fs.readFileSync("id_pw.txt",'utf-8').toString()
        user=JSON.parse(user)
        
        // 유저의 숫자 만큼 실행
        for(let i  = 0; i<user.id_s.length; i++){
          let user_id = user.id_s[i]
          // admin은 관리자라서 패스
          if(user_id=="admin"){
            continue;
          }
          // 유저별로 맞는 수강신청 가능한 교과목 리스트와 수강신청 한 리스트 파일 읽어오기
          let user_info_class=JSON.parse(fs.readFileSync(`${user_id}_classes.txt`,'utf-8').toString())
          let user_info_enrol=JSON.parse(fs.readFileSync(`${user_id}_enrol.txt`,'utf-8').toString())
          
          // 만약 수강신청 가능한 교과목 리스트 안에 삭제할 교과목이 있으면 삭제
          if(user_info_class.class.includes(del_class)==true){
            del_class_index = user_info_class.class.indexOf(del_class)
            user_info_class.class.splice(del_class_index,1)
            user_info_class.credit.splice(del_class_index,1)
            fs.writeFileSync(`${user_id}_classes.txt`,JSON.stringify(user_info_class),'utf-8')
          }
          // 위의 조건이 충족하지 않았다면 수강신청한 교과목 리스트에 있으므로 수강신청한 교과목 리스트에서 삭제
          else{
            del_class_index = user_info_enrol.class.indexOf(del_class)
            user_info_enrol.class.splice(del_class_index,1)
            user_info_enrol.credit.splice(del_class_index,1)
            fs.writeFileSync(`${user_id}_enrol.txt`,JSON.stringify(user_info_enrol),'utf-8')
          }
       }
      } 
      // 삭제하고 싶은 교과목이 없으면 경고창 실행
      else{
        res.write('<script>alert("교과목이 없습니다.")</script>')
      }  
    }
    //교과목 수정 코드
    // 초기화면 + 입력창 2개와 변경버튼이 있는 화면에서 원래 교과목 이름과 변경할 교과목을 입력하고 변경할 학점을 고른 후 교과목 수정 버튼을 누르면 실행되는 화면
      if(req.body.management_n == "chan_v2"){
        let origin_class = req.body.class_n
        let chan_class = req.body.chan_class_n
        // post로 받은 값은 string type이므로 int형으로 변환 해준다.
        let chan_credit = Number(req.body.chan_credit)

        let origin_classes = JSON.parse(fs.readFileSync("original_class_list.txt",'utf-8').toString())

        // 변경 하고 싶은 교과목이 원래 존재하는지 여부 확인
        if(origin_classes.class.includes(origin_class)==true){
          let index = origin_classes.class.indexOf(origin_class)
          origin_classes.class[index] = chan_class
          origin_classes.credit[index] = chan_credit
          fs.writeFileSync("original_class_list.txt",JSON.stringify(origin_classes),'utf-8')
        
          let user_info = JSON.parse(fs.readFileSync("id_pw.txt",'utf-8').toString()).id_s

          // 삭제와 비슷하게 유저들도 바꾸어준다.
          for(let i=0; i<user_info.length; i++){
            if(user_info[i]!="admin"){
              let user_class = JSON.parse(fs.readFileSync(`${user_info[i]}_classes.txt`,'utf-8').toString())
            
              if(user_class.class.includes(origin_class)==true){
                let index = user_class.class.indexOf(origin_class)
                user_class.class[index] = chan_class
                user_class.credit[index] = chan_credit
                fs.writeFileSync(`${user_info[i]}_classes.txt`,JSON.stringify(user_class),'utf-8')
              }
              else{
                let user_enrol = JSON.parse(fs.readFileSync(`${user_info[i]}_enrol.txt`,'utf-8').toString())
                let index = user_enrol.class.indexOf(origin_class)
                user_enrol.class[index] = chan_class
                user_enrol.credit[index] = chan_credit
                fs.writeFileSync(`${user_info[i]}_enrol.txt`,JSON.stringify(user_enrol),'utf-8')
              }
            }

          }
        }
        // 변경하고 싶은 교과목이 없으면 경고창을 띄운다.
        else{
          res.write('<script>alert("교과목이 없습니다.")</script>')
        }
      
    }
    // 교과목 관리 버튼을 누르면 기본적으로 전체 교과목 리스트(table형식)를 보여준다.
    let total_class = fs.readFileSync("original_class_list.txt",'utf-8').toString()
    total_class=JSON.parse(total_class)
    let classes = `<table id="tb" border=1  , style="margin-left: auto; margin-right: auto;"> <th>과목</th><th>학점</th>`
    for(let i=0; i<total_class.class.length; i++){
      classes+=`<tr><td>${total_class.class[i]}<td>${total_class.credit[i]}`
    }
    classes+=`</table>`
    res.write(fs.readFileSync(__dirname + '/manager.html'));
    res.write("<center><h2>교과목 관리</h2></center>")
    res.write(`<center>${classes}</center>`)
    
    // manager 초기화면에서 교과목 관리 버튼 누른 후 변경버튼을 누르면 초기화면 + 입력창 2개와 변경버튼+학점 선택 창이 있는 화면이 생긴다.
    if(req.body.management_n== "chan_v"||req.body.management_n== "chan_v2"){
      res.write(`</br><div id=div3 style="margin:auto;text-align:center; border:1;" >
                <form action="/manager" method="post" style="display:inline-block;" >
                <input type="text" id = "class" name="class_n"></input>
                <input type="text" id = "class_chan" name="chan_class_n"></input>
                <select name="chan_credit">
                  <option value=1>1학점</option>
                  <option value=2>2학점</option>
                  <option value=3>3학점</option>
                </select>
                <button type="submit" id = "del" name="management_n" value="chan_v2">과목 수정</button>
                </form>
              </div>`)
                
    }
    // manager 초기화면에서 교과목 관리 버튼을 누르면 초기화면 밑 에 추가적으로 입력창과 교과목 추가,삭제,변경 버튼이 생긴다.
    else{
      res.write(`</br><div id=div2 style="margin:auto;text-align:center; border:1;" >
                  <form action="/manager" method="post" style="display:inline-block;" >
                  <input type="text" id = "class" name="class_n"></input>
                  <select name="credit">
                    <option value=1>1학점</option>
                    <option value=2>2학점</option>
                    <option value=3>3학점</option>
                  </select>
                  <button type="submit" id = "add" name="management_n" value="add_v">과목 추가</button>
                  <button type="submit" id = "del" name="management_n" value="del_v">과목 제거</button>
                  <button type="submit" id = "del" name="management_n" value="chan_v">과목 수정</button>
                  </form>
                </div>`)
    }
    
    res.end()
  }
  //초기 화면에서 수강 현황 출력 버튼을 누르면 실행 됨 또한 수강 현황 출력 화면에서 확인 버튼을 눌렸을 때도 실행된다.
  else if(req.body.curr_enrol_n=="curr_enrol_v"||req.body.ok_n == "ok_v"){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'})
    // manager초기 화면을 보여준다.
    res.write(fs.readFileSync(__dirname + '/manager.html'));
    let classes = ``
    let user_info = JSON.parse(fs.readFileSync("id_pw.txt",'utf-8').toString()).id_s
    // 모든 유저의 수강 현황을 테이블로 만들어서 classes변수에 저장 해 둔다.
    for(let i=0; i<user_info.length; i++){
      if(user_info[i]!="admin"){
        
        let user_class = JSON.parse(fs.readFileSync(`${user_info[i]}_classes.txt`,'utf-8').toString())
        let user_enrol = JSON.parse(fs.readFileSync(`${user_info[i]}_enrol.txt`,'utf-8').toString())
        classes += `<div style="border: 1px solid orange; float: left; width: 25%;">
                      <h1>${user_info[i]}</h1> <table id="tb" border=3  style="float:left;"> <th>신청가능한 과목</th><th>학점</th>`
        for(let i=0; i<user_class.class.length; i++){
          classes+=`<tr><td>${user_class.class[i]}<td>${user_class.credit[i]}`
        }
        classes+=`</table>`
      
        classes+= `<table id="tb"border=3px solid black "> <th>신청한 과목</th><th>학점</th>`
        for(let i=0; i<user_enrol.class.length; i++){
          classes+=`<tr><td>${user_enrol.class[i]}<td>${user_enrol.credit[i]}`
        }
        classes+=`</table></div>`
      }
    }
    // 만약 누른 버튼이 확인 버튼일 때 실행된다.
    if(req.body.ok_n == "ok_v"){
      let id = req.body.id_n
      let user_id = JSON.parse(fs.readFileSync('id_pw.txt','utf-8').toString()).id_s
      let classes1=``
      // 입력한 id가 존재하면 실행된다.
      if(user_id.includes(id)==true){
        // 입력한 id에 관련된 파일을 읽어온 후 테이블 형태로 classes1의 변수에 저장한다. 
        let user_class = JSON.parse(fs.readFileSync(`${id}_classes.txt`,'utf-8').toString())
        let user_enrol = JSON.parse(fs.readFileSync(`${id}_enrol.txt`,'utf-8').toString())
        classes1 += `<div style="border: 1px solid orange; float: left; width: 25%;">
                    <h1>${id}</h1> <table id="tb" border=3  style="float:left;"> <th>신청가능한 과목</th><th>학점</th>`
        for(let i=0; i<user_class.class.length; i++){
        classes1+=`<tr><td>${user_class.class[i]}<td>${user_class.credit[i]}`
        }
        classes1+=`</table>`

        classes1+= `<table id="tb"border=3px solid black "> <th>신청한 과목</th><th>학점</th>`
        for(let i=0; i<user_enrol.class.length; i++){
          classes1+=`<tr><td>${user_enrol.class[i]}<td>${user_enrol.credit[i]}`
        }
        classes1+=`</table></div>`
        // 입력한 id의 교과목 현황 테이블과 함께 교과목 현환 초기 페이지를 함께 화면에 띄운다.
        res.write(`</br><div id=div5 style="margin:auto;text-align:center; border:1;" >
                  <form action="/manager" method="post" style="display:inline-block;" >
                    <input type="text" id = "id" name="id_n"></input>
                    <button type="submit" id = "ok" name="ok_n" value="ok_v">확인</button>
                  </form>
                </div><br>`)
        res.write(classes1)
      }
      // id가 없을 경우 경고창을 띄우고, 화면에 전체 유저의 테이블을 저장한 classes변수를 이용해 화면에 표시하고 추가로 교과목 현환 초기 화면을 표시한다.
      else{
        res.write('<script>alert("id가 없습니다.")</script>')
        res.write(`</br><div id=div5 style="margin:auto;text-align:center; border:1;" >
                    <form action="/manager" method="post" style="display:inline-block;" >
                      <input type="text" id = "id" name="id_n"></input>
                      <button type="submit" id = "ok" name="ok_n" value="ok_v">확인</button>
                    </form>
                  </div><br>`)
        res.write(classes);
      }
    }
    // 입력 버튼이 아닌 교과목 현환 버튼을 눌렸을 때 실행된다. 이때 화면에 전체 유저의 테이블을 저장한 classes변수를 이용해 화면에 표시하고 추가로 교과목 현환 초기 화면을 표시한다.
    else{
      res.write(`</br><div id=div5 style="margin:auto;text-align:center; border:1;" >
      <form action="/manager" method="post" style="display:inline-block;" >
        <input type="text" id = "id" name="id_n"></input>
        <button type="submit" id = "ok" name="ok_n" value="ok_v">확인</button>
      </form>
    </div><br>`)
      res.write(classes);
    }   
    
    res.end()
  }
})
app.listen(9999)
