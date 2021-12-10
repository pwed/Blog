import { Handler, APIGatewayProxyEvent } from 'aws-lambda';
import { randomInt } from 'crypto';
import config from '../config.json';

export const handler: Handler = async (event: APIGatewayProxyEvent) => {
    const AccessControlAllowOrigin = process.env.AccessControlAllowOrigin!;
    config.headers['Access-Control-Allow-Origin'] = AccessControlAllowOrigin;

    return {
        body: randomInt(+event.pathParameters!['number']!).toString(),
        headers: config.headers,
        statusCode: 200,
    };
};
