---
title: "Hello World"
date: 2021-10-25T11:45:08+11:00
---

## Hello World! 

Over the next few weeks I plan to post about some fun technology and projects I have been working with and playing with in my spare time. This blog will also be an excuse for me to test out new things and try to keep them as cheap as possible since this is all hosted on my own AWS account.

## How do I run this blog?

For simplified hosting and security, this site is created using the Static Site Generator __Hugo__, allowing me to host the files with __S3__ and __CloudFront__. This removes any burden of running and maintaining servers. I also have a endpoint at https://api.pwed.me/ where I experiment with various uses of __API Gateway__ and __Lambda__.

## How do I maintain this site?

The entire infrastructure is created and maintained using __AWS CDK__ written in TypeScript. This means that all changes I make are docuemtned and reproducable. In future I plan to utilise __CDK Pipelines__ to automate updates.

