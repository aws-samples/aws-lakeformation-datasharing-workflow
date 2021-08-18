import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "@aws-cdk/aws-iam";
import { Construct, NestedStack, NestedStackProps, Stack, StackProps } from "@aws-cdk/core";

export class SecurityStack extends NestedStack {

    readonly stateMachineWorkflowRole: Role;
    readonly workflowLambdaSMApproverRole: Role;
    readonly workflowLambdaSendApprovalEmailRole: Role;
    readonly workflowLambdaShareCatalogItemRole: Role;
    readonly workflowLambdaTableDetailsRole: Role;

    constructor(scope: Construct, id: string, props?: NestedStackProps) {
        super(scope, id, props);
    
        const workflowLambdaSMApproverRolePolicy = new PolicyDocument({
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "states:DescribeActivity",
                        "states:DeleteActivity",
                        "states:GetActivityTask",
                        "states:SendTaskSuccess",
                        "states:SendTaskFailure",
                        "states:SendTaskHeartbeat"
                    ],
                    resources: ["*"]
                })
            ]
        });

        this.workflowLambdaSMApproverRole = new Role(this, "WorkflowLambdaSMApproverRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
            inlinePolicies: {inline0: workflowLambdaSMApproverRolePolicy}
        });

        const workflowLambdaSendApprovalEmailRolePolicy = new PolicyDocument({
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "sts:AssumeRole"
                    ],
                    resources: ["arn:aws:iam::*:role/ProducerWorkflowRole"]
                })
            ]
        });

        this.workflowLambdaSendApprovalEmailRole = new Role(this, "WorkflowLambdaSendApprovalEmailRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
            inlinePolicies: {inline0: workflowLambdaSendApprovalEmailRolePolicy}
        });

        const workflowLambdaShareCatalogItemRolePolicy = new PolicyDocument({
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "lakeformation:GrantPermissions",
                        "glue:GetTable",
                        "glue:GetDatabase"
                    ],
                    resources: ["*"]
                })
            ]
        });

        this.workflowLambdaShareCatalogItemRole = new Role(this, "WorkflowLambdaShareCatalogItemRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"), ManagedPolicy.fromAwsManagedPolicyName("AWSLakeFormationCrossAccountManager")],
            inlinePolicies: {inline0: workflowLambdaShareCatalogItemRolePolicy}
        });

        const workflowLambdaTableDetailsRolePolicy = new PolicyDocument({
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "glue:GetTable",
                        "glue:GetDatabase"
                    ],
                    resources: ["*"]
                })
            ]
        });

        this.workflowLambdaTableDetailsRole = new Role(this, "WorkflowLambdaTableDetailsRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
            inlinePolicies: {inline0: workflowLambdaTableDetailsRolePolicy}
        });
        
        const stateMachineWorkflowRolePolicy = new PolicyDocument({
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "lambda:InvokeFunction",
                        "lambda:InvokeAsync",
                        "lakeformation:*"
                    ],
                    resources: ["*"]
                })
            ]
        });

        this.stateMachineWorkflowRole = new Role(this, "DataLakeWorkflowRole", {
            assumedBy: new ServicePrincipal("states.amazonaws.com"),
            inlinePolicies: {inline0: stateMachineWorkflowRolePolicy}
        });
    }
}