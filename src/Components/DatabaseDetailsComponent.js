import { useEffect, useState } from "react";
import Amplify, { Auth } from "aws-amplify";
import { GetDatabaseCommand, GlueClient } from "@aws-sdk/client-glue";
import { Badge, ColumnLayout, Container, Header, SpaceBetween } from "@awsui/components-react";
import ValueWithLabel from "./ValueWithLabel";

const config = Amplify.configure();

function DatabaseDetailsComponent({dbName}) {
    const [db, setDb] = useState();

    useEffect(async() => {
        const credentials = await Auth.currentCredentials();
        const glueClient = new GlueClient({region: config.aws_project_region, credentials: Auth.essentialCredentials(credentials)});
        const db = await glueClient.send(new GetDatabaseCommand({Name: dbName}));
        setDb(db.Database);
    }, []);

    if (db) {
        return (
            <Container header={<Header variant="h2">Database Details</Header>}>
                <ColumnLayout columns={2} variant="text-grid">
                    <SpaceBetween size="m">
                        <ValueWithLabel label="Database">
                            {dbName}
                        </ValueWithLabel>
                        <ValueWithLabel label="Location">
                            {db.LocationUri}
                        </ValueWithLabel>
                        <ValueWithLabel label="Has PII">
                            {(db.Parameters && "pii_flag" in db.Parameters && db.Parameters.pii_flag === "true") ? <Badge color="red">Yes</Badge> : <Badge color="green">No</Badge>}
                        </ValueWithLabel>
                    </SpaceBetween>
                    <SpaceBetween size="m">
                        <ValueWithLabel label="Data Owner">
                            {(db.Parameters && "data_owner_name" in db.Parameters) ? db.Parameters.data_owner_name : "n/a"}
                        </ValueWithLabel>
                        <ValueWithLabel label="Data Owner Account ID">
                            {(db.Parameters && "data_owner" in db.Parameters) ? db.Parameters.data_owner : "n/a"}   
                        </ValueWithLabel>
                    </SpaceBetween>
                </ColumnLayout>
            </Container>
        );
    } else {
        return null;
    }
}

export default DatabaseDetailsComponent;