#!/bin/sh
set -e

docker build -t $1 $1
docker run -d --name $1 -p 3000:80 $1

docker run --link $1:$1 --rm martin/wait

RESPONSE=$(curl localhost:3000/ignored/zipfile_date/filedir/filename)
docker kill $1
docker rm $1

echo $RESPONSE | grep foobar

echo "if you're reading this it worked"