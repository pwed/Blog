---
title: "AWS SSO and RDP"
date: 2022-03-09T22:28:42+11:00
draft: true
tags: [ "sso", "aws", "rdp", "bastion" ]
---

__AWS SSO__ is a service that does exactly what it says on the label. It allows a directory of users to log into an organisations __AWS__ accounts using allocated __IAM__ roles or __permission sets__.

Using a relatively new feature in __Systems Manager__ we are able to log into our __Windows__ hosts through the console and get a full fat __RDP__ session. This service is apropriately named __GUI Connect__ and is tucked away under the __Fleet Manager__ sub menu of Systems Manager.

Normally when connecting to an instance you are presented with 2 options to authenticate, __User credentials__ or __Key pair__, but when you are logged into the console as an __AWS SSO__ user a third option appears. We can log in using our SSO user.

## How

There are several things that happen when you choose to log in with SSO. Systems Manager will run a documents that creates new Windows user based on your AWS SSO username with the prefix `sso-`. Then our connection starts being prepared and, poof, we land on a desktop with our fresh new user.
