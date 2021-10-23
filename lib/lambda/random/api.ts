
import { Handler, APIGatewayProxyEvent } from "aws-lambda";
import { randomInt } from "crypto";
import config from "../config.json";

export const handler: Handler = async (event: APIGatewayProxyEvent) => {
  
  return {
    body: randomInt(+event.pathParameters!['number']!).toString(),
    headers: config.headers,
    statusCode: 200,
  };
};