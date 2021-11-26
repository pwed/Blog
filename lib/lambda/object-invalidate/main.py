#!/bin/env python

import json
import urllib.parse
import boto3
from datetime import datetime

print('Loading function')

s3 = boto3.client('s3')


def handler(event, context):
    print("Received event: " + json.dumps(event, indent=2))

    # Get the object from the event and show its content type
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    try:
        object_versions = s3.list_object_versions(Bucket=bucket, Prefix=key)['Versions']
        version_count = len(object_versions)

        if version_count > 1:
            cf = boto3.client('cloudfront')
            cf.create_invalidation(
                DistributionId='E1IV1F78MHTOMK',
                InvalidationBatch={
                    'Paths': {
                        'Quantity': 1,
                        'Items': [
                            '/' + key,
                        ],
                    },
                    'CallerReference': key + datetime.now().strftime("%d-%b-%Y (%H:%M:%S.%f)"),
                }
            )

        
        return response['ContentType']
    except Exception as e:
        print(e)
        print('Error getting object {} from bucket {}. Make sure they exist and your bucket is in the same region as this function.'.format(key, bucket))
        raise e
     