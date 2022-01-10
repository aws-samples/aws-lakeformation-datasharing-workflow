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
import { Effect, Policy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "@aws-cdk/aws-iam";
import { Code, Function, Runtime } from "@aws-cdk/aws-lambda";
import { Construct, NestedStack, NestedStackProps, Stack, StackProps } from "@aws-cdk/core";
import {LambdaInvocationType, LambdaInvoke} from "@aws-cdk/aws-stepfunctions-tasks";
import { Choice, Condition, IntegrationPattern, JsonPath, StateMachine, StateMachineType, TaskInput } from "@aws-cdk/aws-stepfunctions";
import { HttpApi, HttpMethod } from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import { SecurityStack } from "../SecurityStack";

export interface AppStackProps extends NestedStackProps {
    readonly securityStack: SecurityStack
}

export class AppStack extends NestedStack {
    readonly stateMachine: StateMachine;

    constructor(scope: Construct, id: string, props: AppStackProps) {
        super(scope, id, props);

        const workflowActivityApprover = new Function(this, "WorkflowActivityApprover", {
            runtime: Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: Code.fromAsset(__dirname+"/../../functions/WorkflowActivityApprover"),
            role: props.securityStack.workflowLambdaSMApproverRole
        });

        const httpApi = new HttpApi(this, "DataLakeWorkflowAPIGW");
        httpApi.addRoutes({
            path: '/workflow/update-state',
            methods: [HttpMethod.GET],
            integration: new LambdaProxyIntegration({
                handler: workflowActivityApprover
            })
        });

        const workflowSendApprovalNotification = new Function(this, "WorkflowSendApprovalNotification", {
            runtime: Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: Code.fromAsset(__dirname+"/../../functions/WorkflowSendApprovalNotification"),
            role: props.securityStack.workflowLambdaSendApprovalEmailRole,
            environment: {
                "API_GATEWAY_BASE_URL": httpApi.apiEndpoint+"/workflow"
            }
        });

        const workflowGetTableDetails = new Function(this, "WorkflowGetTableDetails", {
            runtime: Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: Code.fromAsset(__dirname+"/../../functions/WorkflowGetTableDetails"),
            role: props.securityStack.workflowLambdaTableDetailsRole
        });

        const workflowShareCatalogItem = new Function(this, "WorkflowShareCatalogItem", {
            runtime: Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: Code.fromAsset(__dirname+"/../../functions/WorkflowShareCatalogItem"),
            role: props.securityStack.workflowLambdaShareCatalogItemRole
        });

        const sfnGetCatalogTableDetails = new LambdaInvoke(this, "GetCatalogTableDetails", {
            lambdaFunction: workflowGetTableDetails,
            payload: TaskInput.fromObject({
                "database.$": "$.source.database",
                "table.$": "$.source.table"
            }),
            resultPath: "$.table_details"
        });

        const sfnNoPIIShareCatalogItem = new LambdaInvoke(this, "NoPIIShareCatalogItem", {
            lambdaFunction: workflowShareCatalogItem,
            payload: TaskInput.fromObject({
                "source.$": "$.source",
                "target.$": "$.target",
            })
        });

        const sfnSendAndWaitPIIColumnApproval = new LambdaInvoke(this, "SendAndWaitPIIColumnApproval", {
            lambdaFunction: workflowSendApprovalNotification,
            integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
            payload: TaskInput.fromObject({
                "Input.$": "$",
                "TaskToken": JsonPath.taskToken
            }),
            resultPath: "$.approval_details"
        });

        const sfnApprovedPIIShareCatalogItem = new LambdaInvoke(this, "ApprovedPIIShareCatalogItem", {
            lambdaFunction: workflowShareCatalogItem,
            payload: TaskInput.fromObject({
                "source.$": "$.source",
                "target.$": "$.target",
            })
        });

        const sfnDoesItHavePIIColumns = new Choice(this, "DoesItHavePIIColumns");

        const sfnDefinition = sfnGetCatalogTableDetails.next(
            sfnDoesItHavePIIColumns
                .when(Condition.booleanEquals("$.table_details.Payload.has_pii", false), sfnNoPIIShareCatalogItem)
                .otherwise(sfnSendAndWaitPIIColumnApproval.next(sfnApprovedPIIShareCatalogItem))
        );

        this.stateMachine = new StateMachine(this, "DataLakeApprovalWorkflow", {
            definition: sfnDefinition,
            stateMachineType: StateMachineType.STANDARD,
            role: Role.fromRoleArn(this, "DataLakeWorkflowRole", props.securityStack.stateMachineWorkflowRole.roleArn)
        });
    }
}