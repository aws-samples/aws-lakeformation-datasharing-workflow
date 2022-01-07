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
import { AccountPrincipal, Effect, PolicyDocument, PolicyStatement, Role } from '@aws-cdk/aws-iam';
import { Topic } from '@aws-cdk/aws-sns';
import * as cdk from '@aws-cdk/core';
import { CfnOutput, CfnParameter } from '@aws-cdk/core';

export class ProducerStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const centralMeshAccountId = new CfnParameter(this, "centralMeshAccountId", {
      type: "Number",
      description: "The AWS Account ID of the central mesh."
    });

    const snsTopic = new Topic(this, "DataLakeSharingApproval", {
      topicName: "DataLakeSharingApproval"
    });

    const producerWorkflowRolePolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "sns:Publish"
          ],
          resources: [snsTopic.topicArn]
        })
      ]
    });

    const producerWorkflowRole = new Role(this, "ProducerWorkflowRole", {
      assumedBy: new AccountPrincipal(centralMeshAccountId.value),
      inlinePolicies: {
        "inline0": producerWorkflowRolePolicy
      },
      roleName: "ProducerWorkflowRole"
    });

    new CfnOutput(this, "ApprovalSnsTopicArn", {
      value: snsTopic.topicArn,
      description: "SNS Topic where approval requests would be sent."
    });

    new CfnOutput(this, "ProducerWorkflowRoleArn", {
      value: producerWorkflowRole.roleArn,
      description: "Role ARN that the central mesh workflow engine would assume to send approval requests."
    });
  }
}
