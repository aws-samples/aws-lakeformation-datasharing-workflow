const AWS = require("aws-sdk");
const util = require("util");

exports.handler = async (event) => {
    const input = event.Input;
    const taskToken = event.TaskToken;
    
    const target = input.target;
    const source = input.source;
    const sourceAccountId = input.table_details.Payload.data_owner;

    const sts = new AWS.STS();
    const roleArn = util.format("arn:aws:iam::%s:role/ProducerWorkflowRole", sourceAccountId);
    const assumedRole = await sts.assumeRole({
        RoleArn: roleArn,
        RoleSessionName: util.format("ProducerWorkflowRole-AssumedRole-%s", Date.now()),
    }).promise();
    
    const assumedCredentials = assumedRole.Credentials;
    const sns = new AWS.SNS({
        accessKeyId: assumedCredentials.AccessKeyId,
        secretAccessKey: assumedCredentials.SecretAccessKey,
        sessionToken: assumedCredentials.SessionToken
    });
    
    const apiGatewayBaseUrl = process.env.API_GATEWAY_BASE_URL;
    const approveLink = util.format("%s/update-state?action=approve&token=%s", apiGatewayBaseUrl, encodeURIComponent(taskToken));
    const denyLink = util.format("%s/update-state?action=deny&token=%s", apiGatewayBaseUrl, encodeURIComponent(taskToken));
    
    const topicArn = util.format("arn:aws:sns:%s:%s:DataLakeSharingApproval", process.env.AWS_REGION, sourceAccountId);
    var messageBody = "A data sharing request has been created, please see the following details:\n";
    messageBody += util.format("Database: %s\n", source.database);
    messageBody += util.format("Table: %s\n", source.table);
    messageBody += util.format("Target Account: %s\n\n", target.account_id);
    messageBody += util.format("Approve: %s\n\nDeny: %s\n\n", approveLink, denyLink);
    
    const subject = util.format("Data Sharing Request Approval %s - %s", source.database, source.table);
    
    const notificationParams = {
        "Message": messageBody,
        "Subject": subject,
        "TopicArn": topicArn
    }
    
    await sns.publish(notificationParams).promise();
    
    return {};
};
