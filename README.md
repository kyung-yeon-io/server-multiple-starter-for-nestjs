# nest-server-multiple-starter
MSA로 생성되는 여러개의 서버를 로컬에서 동시에 띄워주는 multiple-server-starter project.

## 사용방법
```
npm i -g nestjs-multiple-starter
nestjs-multiple-starter {params}
```

### params
* -c | -conf (optional) : nginx.conf 파일의 path를 지정. 미 입력시 mac homebrew 를 통해 설치한 nginx 경로를 기본으로 사용
* -s | -server (require) : 띄우고싶은 서버의 상대경로를 지정. 여러개 입력 시 띄워쓰기를 통해 구분

`ex) nestjs-multiple-starter -server ../api-admin-v1-test1 ../api-admin-v1-test2`
