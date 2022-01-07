/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
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
