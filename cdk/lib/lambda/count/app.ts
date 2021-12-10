import { Handler, APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import config from '../config.json';

const documentClient = new DynamoDB.DocumentClient();

export const main: Handler = async (event: APIGatewayProxyEvent) => {
    let data;
    const id = event.queryStringParameters
        ? event.queryStringParameters['path']
        : null;
    const referer = event.headers ? event.headers['referer'] : null;
    const AccessControlAllowOrigin = process.env.AccessControlAllowOrigin!;
    config.headers['Access-Control-Allow-Origin'] = AccessControlAllowOrigin;

    if (!id) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'no path variable',
                status: 'Bad Request',
            }),
        };
    }
    if (!referer || !id.startsWith(referer)) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: "Path doesn't match referer",
                status: 'Bad Request',
            }),
        };
    }
    if (!referer.startsWith(config.headers['Access-Control-Allow-Origin'])) {
        return {
            statusCode: 403,
            body: JSON.stringify({
                error: 'Unauthorised domain',
                status: 'Forbidden',
            }),
        };
    }

    try {
        data = await documentClient
            .update({
                TableName: process.env.DatabaseTable!,
                Key: { ID: id },
                AttributeUpdates: {
                    COUNT: {
                        Action: 'ADD',
                        Value: 1,
                    },
                },
                ReturnValues: 'UPDATED_NEW',
            })
            .promise();
    } catch (err) {
        console.log(err);
        return err;
    }
    return {
        statusCode: 200,
        body: JSON.stringify(data.Attributes),
        headers: config.headers,
    };
};
