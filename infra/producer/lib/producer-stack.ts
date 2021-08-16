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
