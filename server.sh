echo $1   # 첫 번째 인자 값
echo $2   # 두 번째 인자 값
echo $3   # 세 번째 인자 값
echo $4   # 네 번째 인자 값



export LOCAL_PORT=3001 && export NODE_ENV=local && cd $1 && nest start --watch &
export LOCAL_PORT=3002 && export NODE_ENV=local && cd $2 && nest start --watch &

dig_result=`dig apis.washswat.com`

if [[ $dig_result == *"devel"* ]]; then
  MSA_HOST='http://kong-internal-gateway-devel.system.ecs.internal:8000'
elif [[ $dig_result == *"prod"* ]]; then
  echo MSA_HOST='http://kong-internal-gateway-prod.system.ecs.internal:8000'
fi

echo "
#user  nobody;
worker_processes  1;

#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

#pid        logs/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       mime.types;
    default_type  application/octet-stream;

    #log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    #                  '$status $body_bytes_sent "$http_referer" '
    #                  '"$http_user_agent" "$http_x_forwarded_for"';

    #access_log  logs/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

    #gzip  on;

    server {
        listen       3000;
        server_name  localhost;

        #charset koi8-r;

        #access_log  logs/host.access.log  main;

        location / {
            root   html;
            index  index.html index.htm;
        }

        # MY
        location ~ \/wash/v1/admin/wash-orders/\w+/items {
          proxy_pass   http://localhost:3001;
        }

        location ~ \/wash/v1/admin/wash-orders/status {
           proxy_pass   http://localhost:3002;
        }

        location ~ \/.+ {
          rewrite ^(.*)$ $MSA_HOST\$1 permanent;
          break;
        }

    }

    include servers/*;
}
" > /opt/homebrew/etc/nginx/nginx.conf
