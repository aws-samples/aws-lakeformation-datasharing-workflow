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

    new CfnOutput(this, "StateMachineName", {
      value: appStack.stateMachine.stateMachineName,
      description: "Name of the DataWorkFlow Step Function"
    });

  }
}
