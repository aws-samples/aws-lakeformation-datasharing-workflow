const AWS = require("aws-sdk");
const util = require("util");

exports.handler = async (event) => {
    const validActions = ["approve", "deny"];
    const action = event.queryStringParameters.action;
    const token = event.queryStringParameters.token;
    
    console.log("Action: "+action);
    console.log("Token: "+token);
    
    let statusCode = 200;
    let body = '';
    
    if (!validActions.includes(action) || token == null || token.length == 0) {
        statusCode = 400;
        body = 'Result: Invalid parameters';
    } else {
        const state = new AWS.StepFunctions();
        try {
            if (action == 'deny') {
                let params = {
                    taskToken: token
                }
                await state.sendTaskFailure(params).promise();
            } else if (action == 'approve') {
                let params = {
                    taskToken: token,
                    output: "{}"
                }
                await state.sendTaskSuccess(params).promise();
            }
            body = util.format("OK\nResult:%s", action);
        } catch (error) {
            console.log("Error: "+error);
            statusCode = 400;
            body: error;
        }

    }
    
    const response = {
        statusCode: statusCode,
        body: body
    };
    
    return response;
};
