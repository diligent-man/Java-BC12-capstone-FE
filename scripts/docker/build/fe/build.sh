#!/bin/bash

PROJECT_ROOT=../../../..
DOCKER_ROOT=""
CONTEXT_PATH="$PROJECT_ROOT/${DOCKER_ROOT}"

docker build \
    --tag java_bc12_capstone/fe:1.0.0 \
    --platform linux/amd64 \
    --build-arg NODE_VERSION="${NODE_VERSION:-26.8.1}" \
    --file "$CONTEXT_PATH/Dockerfile" \
    $CONTEXT_PATH
