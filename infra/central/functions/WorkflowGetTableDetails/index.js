const AWS = require("aws-sdk");
const PII_PROPERTY_KEY = "pii_flag";
const DATA_OWNER_KEY = "data_owner";

exports.handler = async (event) => {
    const dbName = event.database;
    const tableName = event.table;
    const sourceAccount = event.source_account;
    
    const glue = new AWS.Glue();
    const details = await glue.getTable({
        DatabaseName: dbName,
        Name: tableName,
        CatalogId: sourceAccount
    }).promise();

    const tableParameters = details.Table.Parameters;
    const columns = details.Table.StorageDescriptor.Columns;
    var hasPii = false;
    
    if (!(DATA_OWNER_KEY in tableParameters)) {
        throw new Error("Missing data_owner parameter in table");
    }
    
    const dataOwner = tableParameters[DATA_OWNER_KEY];
    
    for (var i = 0; i < columns.length; i++) {
        const col = columns[i];
        
        if ("Parameters" in col) {
            if (PII_PROPERTY_KEY in col.Parameters) {
                hasPii = col.Parameters[PII_PROPERTY_KEY] === "true";
                
                if (hasPii)
                    break;
            }
        }
    }

    var response = {
        columns: details.Table.StorageDescriptor.Columns,
        has_pii: hasPii,
        data_owner: dataOwner
    }

    return response;
};
