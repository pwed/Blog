---
title: "RDP the easy way"
date: 2022-05-24 00:00:00+11:00
images: ["/images/desktop.png"]
tags: ["sso", "aws", "rdp", "bastion", "windows"]
---

In my opinion, **RDP** has always felt messy in **AWS**. To connect securely, many users resort to complicated network tunneling using **SSH** or **SSM** port forwarding. In a past role I even wrote a PowerShell module to automate the setup of the tunnel and start the **RDP** application on Windows. This was good but had it's own issues, including, not being cross platform (although it probably could have been if I had a MacBook and some extra time).

A relatively new feature in **Systems Manager** has made the whole process of securely and conveniently connecting to a Windows server in AWS through RDP a lot easier. What sweetens the pie even more is that the **RDP** session is entirely in the browser, so that makes it 100% cross platform. The feature is labeled as **Connect with Remote Desktop** in the AWS Console or **SSM GUI Connect** when configuring access in **IAM** (which makes it sound like it may support more then just Windows targets in the future). To get to **RDP Connect** you need to navigate to the **Fleet Manager** section in **Systems Manager**, then when you select your Windows instance, the option will appear in the drop down menu.

![](/images/guiconnect.png)

Normally when connecting to an instance you are presented with 2 options to authenticate, **User credentials** or **Key pair**, but when you are logged into the console as an **AWS SSO** user, a third option appears, we can log in using our SSO user. This solves my other major issue with **Windows** servers in **AWS**, managing credentials and users. **Connect with Remote Desktop** will automatically create a new user based on our SSO username and will also handle the credential storage.

![](/images/sso-login.png)

After logging in we will be greeted with the windows desktop as with a normal RDP session. Fleet Manager allows us to have up to four active **RDP** sessions open in the same tab, this is great for working on multiple nodes at once. Each session has a limit of one hour, although you can reconnect if you time out.

![](/images/desktop.png)

## Requirements

For this all to work with the least amount of privileges there are some requirements as we will go over now.

1. Our Windows based EC2 will require an instance role with at least the `SSMManagedInstanceCore` policy.
1. The subnet that contains our instance will need a network path to SSM either via the internet or a vpc endpoint.
1. In **SSO**, the **permission set** assigned to the user or group will need the permissions from [the policy section](#policy) or [here](/assets/sso-rdp.json)

## Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SSO",
      "Effect": "Allow",
      "Action": [
        "sso:ListDirectoryAssociations*",
        "identitystore:DescribeUser"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EC2",
      "Effect": "Allow",
      "Action": ["ec2:DescribeInstances", "ec2:GetPasswordData"],
      "Resource": "*"
    },
    {
      "Sid": "SSM",
      "Effect": "Allow",
      "Action": [
        "ssm:DescribeInstanceProperties",
        "ssm:GetCommandInvocation",
        "ssm:GetInventorySchema"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TerminateSession",
      "Effect": "Allow",
      "Action": ["ssm:TerminateSession"],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "ssm:resourceTag/aws:ssmmessages:session-id": ["${aws:userName}"]
        }
      }
    },
    {
      "Sid": "SSMGetDocument",
      "Effect": "Allow",
      "Action": ["ssm:GetDocument"],
      "Resource": [
        "arn:aws:ssm:*:*:document/AWS-StartPortForwardingSession",
        "arn:aws:ssm:*:*:document/SSM-SessionManagerRunShell"
      ]
    },
    {
      "Sid": "SSMStartSession",
      "Effect": "Allow",
      "Action": ["ssm:StartSession"],
      "Resource": [
        "arn:aws:ec2:*:*:instance/*",
        "arn:aws:ssm:*:*:managed-instance/*",
        "arn:aws:ssm:*:*:document/AWS-StartPortForwardingSession"
      ],
      "Condition": {
        "BoolIfExists": {
          "ssm:SessionDocumentAccessCheck": "true"
        }
      }
    },
    {
      "Sid": "SSMSendCommand",
      "Effect": "Allow",
      "Action": ["ssm:SendCommand"],
      "Resource": [
        "arn:aws:ec2:*:*:instance/*",
        "arn:aws:ssm:*:*:managed-instance/*",
        "arn:aws:ssm:*:*:document/AWSSSO-CreateSSOUser"
      ],
      "Condition": {
        "BoolIfExists": {
          "ssm:SessionDocumentAccessCheck": "true"
        }
      }
    },
    {
      "Sid": "GuiConnect",
      "Effect": "Allow",
      "Action": [
        "ssm-guiconnect:CancelConnection",
        "ssm-guiconnect:GetConnection",
        "ssm-guiconnect:StartConnection"
      ],
      "Resource": "*"
    }
  ]
}
```
