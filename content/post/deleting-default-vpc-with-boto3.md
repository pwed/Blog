---
title: "Deleting Default Vpc With Boto3"
date: 2022-09-14T10:40:35+10:00
draft: false
tags: ["boto3", "vpc", "scripting"]
---

When setting up a new account, AWS will create a default VPC that most people don't want to use.

We can easily script the removal of this VPC using Boto3 in Python

```python
import boto3

ec2_client = boto3.client("ec2")
ec2_resource = boto3.resource("ec2")

response = ec2_client.describe_vpcs(
    Filters=[{"Name": "is-default", "Values": ["true"]}]
)

vpc = ec2_resource.Vpc(response["Vpcs"][0]["VpcId"])
vpc.load()

for instance in vpc.instances.all():
    print(instance)

for subnet in vpc.subnets.all():
    subnet.delete()

for internet_gateway in vpc.internet_gateways.all():
    internet_gateway.detach_from_vpc(VpcId=vpc.id)
    internet_gateway.delete()

for route_table in vpc.route_tables.all():
    print(route_table)

for security_group in vpc.security_groups.all():
    print(security_group)

for network_interface in vpc.network_interfaces.all():
    print(network_interface)

vpc.delete()
```
