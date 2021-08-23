#!/usr/bin/env node

const { AmplifyClient, UpdateAppCommand, CustomRule, GetAppCommand } = require("@aws-sdk/client-amplify");
const { CognitoIdentityProviderClient, AdminCreateUserCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { IAMClient, PutRolePolicyCommand } = require("@aws-sdk/client-iam");

const {fromIni} = require("@aws-sdk/credential-provider-ini");
const localEnvInfo = require(__dirname+"/amplify/.config/local-env-info.json");
const localAWSInfo = require(__dirname+"/amplify/.config/local-aws-info.json");
const teamProviderInfo = require(__dirname+"/amplify/team-provider-info.json");
const awsExports = require(__dirname+"/src/aws-exports.js");
const inquirer = require("inquirer");
const envName = localEnvInfo.envName;
const execPostUIDeployment = async() => {
    const awsInfo = localAWSInfo[envName];
    const clientParams = {};
    
    if ("profileName" in awsInfo) {
        clientParams.credentials = fromIni({profile: awsInfo.profileName});
    }

    const iamClient = new IAMClient(clientParams);
    await iamClient.send(new PutRolePolicyCommand({
        RoleName: teamProviderInfo[envName].awscloudformation.AuthRoleName,
        PolicyName: "inline0",
        PolicyDocument: JSON.stringify({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "glue:GetDatabase",
                        "glue:GetTables",
                        "states:DescribeExecution",
                        "states:ListExecutions",
                        "states:StartExecution",
                        "glue:GetDatabases",
                        "glue:GetTable"
                    ],
                    "Resource": "*"
                }
            ]
        })
    }));

    const hosting = teamProviderInfo[envName].categories.hosting.amplifyhosting;
    const amplifyClient = new AmplifyClient(clientParams);
    await amplifyClient.send(new UpdateAppCommand({appId: hosting.appId, customRules: [{source: "</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>", target:"/index.html", status: 200}]}));
    const appDetails = await amplifyClient.send(new GetAppCommand({appId: hosting.appId}));

    console.log("Create First User");
    const username = await inquirer.prompt({message: "Enter Username", name: "value"});
    const email = await inquirer.prompt({message: "Enter Email", name: "value"});

    const cognitoClient = new CognitoIdentityProviderClient(clientParams);
    await cognitoClient.send(new AdminCreateUserCommand({
        UserPoolId: awsExports.aws_user_pools_id,
        Username: username.value,
        UserAttributes: [
            {
                Name: "email_verified",
                Value: "True"
            },
            {
                Name: "email",
                Value: email.value
            },
        ]
    }));

    console.log("Default Domain: "+appDetails.app.defaultDomain);
}

execPostUIDeployment();


