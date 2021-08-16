import * as cdk from '@aws-cdk/core';
import { CfnOutput, Construct, StackProps } from '@aws-cdk/core';
import { AppStack } from './AppStack';
import { SecurityStack } from './SecurityStack';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const securityStack = new SecurityStack(this, "SecurityStack");

    const appStack = new AppStack(this, "AppStack", {securityStack: securityStack});

    new CfnOutput(this, "StateMachineArn", {
      value: appStack.stateMachine.stateMachineArn,
      description: "ARN of DataWorkFlow Step Function"
    });

  }
}
