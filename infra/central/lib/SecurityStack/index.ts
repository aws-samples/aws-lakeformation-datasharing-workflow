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
                        "states:SendTaskSuccess",
                        "states:SendTaskFailure"
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

        this.stateMachineWorkflowRole = new Role(this, "DataLakeWorkflowRole", {
            assumedBy: new ServicePrincipal("states.amazonaws.com")
        });
    }
}