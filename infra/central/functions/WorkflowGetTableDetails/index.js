const AWS = require("aws-sdk");
const PII_PROPERTY_KEY = "pii_flag";
const DATA_OWNER_KEY = "data_owner";

exports.handler = async (event) => {
    const dbName = event.database;
    const tableName = event.table;
    
    const glue = new AWS.Glue();
    var hasPii = false;
    var dataOwner = null;
    var db = null;
    
    const dbDetails = await glue.getDatabase({Name: dbName}).promise();
    if (dbDetails.Database) {
        db = dbDetails.Database;
        if (db.Parameters && DATA_OWNER_KEY in db.Parameters) {
            dataOwner = db.Parameters[DATA_OWNER_KEY];
        } else {
            throw new Error("Missing data_owner parameter in database");
        }
    } else {
        throw new Error("Invalid request, missing database.");
    }    
    
    if (tableName == "*") {
        if (db.Parameters && PII_PROPERTY_KEY in db.Parameters) {
            hasPii = db.Parameters[PII_PROPERTY_KEY] === "true";
        }
    } else {
        const details = await glue.getTable({
            DatabaseName: dbName,
            Name: tableName
        }).promise();
    
        const tableParameters = details.Table.Parameters;
        const columns = details.Table.StorageDescriptor.Columns;

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
    }

    var response = {
        has_pii: hasPii,
        data_owner: dataOwner
    }

    return response;
};
