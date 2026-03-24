import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({});

export const findWorkflowByEvent = async (
  eventType: string,
  tableName: string,
): Promise<any | null> => {
  try {
    const command = new ScanCommand({
      TableName: tableName,
      FilterExpression: "eventType = :eventType",
      ExpressionAttributeValues: {
        ":eventType": { S: eventType },
      },
    });
    const response = await dynamoClient.send(command);
    if (response.Items && response.Items.length > 0) {
      return response.Items[0];
    }
    return null;
  } catch (error) {
    console.error("Error finding workflow by event:", error);
    return null;
  }
};
