import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "@aws-cdk/aws-iam";
import { Code, Function, Runtime } from "@aws-cdk/aws-lambda";
import { Construct, Stack, StackProps } from "@aws-cdk/core";
import {LambdaInvocationType, LambdaInvoke} from "@aws-cdk/aws-stepfunctions-tasks";
import { Choice, Condition, StateMachine, StateMachineType, TaskInput } from "@aws-cdk/aws-stepfunctions";
import { HttpApi, HttpMethod } from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import { SecurityStack } from "../SecurityStack";

export interface AppStackProps extends StackProps {
    readonly securityStack: SecurityStack
}

export class AppStack extends Stack {
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
                ".$": "$"
            })
        });

        const sfnSendAndWaitPIIColumnApproval = new LambdaInvoke(this, "SendAndWaitPIIColumnApproval", {
            lambdaFunction: workflowSendApprovalNotification,
            invocationType: LambdaInvocationType.EVENT,
            payload: TaskInput.fromObject({
                "Input.$": "$",
                "TaskToken.$": "$$.Task.Token"
            }),
            resultPath: "$.approval_details"
        });

        const sfnApprovedPIIShareCatalogItem = new LambdaInvoke(this, "ApprovedPIIShareCatalogItem", {
            lambdaFunction: workflowShareCatalogItem,
            payload: TaskInput.fromObject({
                ".$": "$"
            })
        });

        const sfnDoesItHavePIIColumns = new Choice(this, "DoesItHavePIIColumns");

        const sfnDefinition = sfnGetCatalogTableDetails.next(
            sfnDoesItHavePIIColumns
                .when(Condition.booleanEquals("$.table_details.Payload.has_pii", false), sfnNoPIIShareCatalogItem)
                .otherwise(sfnSendAndWaitPIIColumnApproval.next(sfnApprovedPIIShareCatalogItem))
        );

        const stateMachine = new StateMachine(this, "DataLakeApprovalWorkflow", {
            definition: sfnDefinition,
            stateMachineType: StateMachineType.STANDARD,
            role: Role.fromRoleArn(this, "DataLakeWorkflowRole", props.securityStack.stateMachineWorkflowRole.roleArn)
        });
    }
}