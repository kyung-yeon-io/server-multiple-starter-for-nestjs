# api-local-tester
MSA로 생성되는 여러개의 서버를 로컬에서 동시에 띄워주는 tester project

## 사용을 위한 타 모듈 최소 버전
* api-code-generator : ^1.0.0
* core-config : ^1.0.0

## 사용방법
```
npm i -g api-local-tester

api-tester {params}
```

### params
* -c | -conf (optional) : nginx.conf 파일의 path를 지정. 미 입력시 mac homebrew 를 통해 설치한 nginx 경로를 기본으로 사용
* -s | -server (require) : 띄우고싶은 서버의 상대경로를 지정. 여러개 입력 시 띄워쓰기를 통해 구분

`ex) api-tester -server ../api-admin-v1-test1 ../api-admin-v1-test2`
