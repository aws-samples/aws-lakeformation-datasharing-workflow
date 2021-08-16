const AWS = require("aws-sdk");
const util = require("util");

exports.handler = async (event) => {
    const target = event.target;
    const source = event.source;
    
    const lakeformation = new AWS.LakeFormation();
    
    const grantParams = {
        Permissions: ["SELECT", "DESCRIBE"],
        PermissionsWithGrantOption: ["SELECT", "DESCRIBE"],
        Principal: {
            DataLakePrincipalIdentifier: target.account_id
        },
        Resource: {
            Table: {
                DatabaseName: source.database,
                Name: source.table,
            }
        }
    }
    
    return await lakeformation.grantPermissions(grantParams).promise();
};
