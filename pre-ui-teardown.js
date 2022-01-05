#!/usr/bin/env node

const {fromIni} = require("@aws-sdk/credential-provider-ini");
const localEnvInfo = require(__dirname+"/amplify/.config/local-env-info.json");
const localAWSInfo = require(__dirname+"/amplify/.config/local-aws-info.json");
const teamProviderInfo = require(__dirname+"/amplify/team-provider-info.json");
const envName = localEnvInfo.envName;
const { IAMClient, DeleteRolePolicyCommand } = require("@aws-sdk/client-iam");

const preUITeardown = async() => {
    const awsInfo = localAWSInfo[envName];
    const clientParams = {};
    
    if ("profileName" in awsInfo) {
        clientParams.credentials = fromIni({profile: awsInfo.profileName});
    }

    const iamClient = new IAMClient(clientParams);
    await iamClient.send(new DeleteRolePolicyCommand({
        RoleName: teamProviderInfo[envName].awscloudformation.AuthRoleName,
        PolicyName: "inline0"
    }));
}

preUITeardown();