
import { Handler, APIGatewayProxyEvent } from "aws-lambda";
import config from "../config.json";

export const handler: Handler = async (event: APIGatewayProxyEvent) => {
  return {
    body: `Hello Serverless Citizen, your happy path is: "${event.path}"
    your IP is ${event.requestContext.identity.sourceIp}
    ${event.headers['referer'] ? 'Referer: ' + event.headers['referer'] : ""}`,
    headers: config.headers,
    statusCode: 200,
  };
};