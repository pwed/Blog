---
title: "RDP the easy way"
date: 2022-03-09T22:28:42+11:00
draft: true
images: [ "/images/desktop.png" ]
tags: [ "sso", "aws", "rdp", "bastion" ]
---

In my opinion, __RDP__ has always felt messy in __AWS__. To connect securely, many users resort to complicated network tunneling using __SSH__ or __SSM__ port forwarding. In the past I wrote a PowerShell module to automate the setup of the tunnel and start the __RDP__ application on Windows, this was good but had it's own issues, including, not being cross platform (although it probably could have been if I had a MacBook and some extra time).

A relatively new feature in __Systems Manager__ has made the whole process of securely and conveniently connecting to a Windows server in AWS through RDP. What sweetens the pie even more is that the __RDP__ session is entirely in the browser, so that makes it 100% cross platform. The feature is labeled as __Connect with Remote Desktop__ in the AWS Console or __GUI Connect__ when configuring access in __IAM__ (which suggest to me that it may support more then just Windows targets in the future). To get to __RDP Connect__ you need to navigate to the __Fleet Manager__ section in __Systems Manager__, then when you select your Windows instance, the option will appear in the drop down menu.

![](/images/guiconnect.png)

Normally when connecting to an instance you are presented with 2 options to authenticate, __User credentials__ or __Key pair__, but when you are logged into the console as an __AWS SSO__ user a third option appears. We can log in using our SSO user. This solves my other major issue with Windows servers in AWS, managing credentials and users. __Connect with Remote Desktop__ will automatically create a new user based on our SSO username and will also handle the credential storage.

![](/images/sso-login.png)

![](/images/desktop.png)

## Requirements

### Instance

- Needs SSMManagedInstanceRole
- Needs an internet connection, or a route to a SSM VPC endpoint

### User

- Needs SSM permissions
- Needs gui-connect permissions
- Needs permission to SSO Directory
- (optional) Is an SSO user