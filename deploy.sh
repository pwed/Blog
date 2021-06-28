#!/bin/bash

rm -rf ./blog/public

cd blog
hugo

cd ..

cdk deploy
