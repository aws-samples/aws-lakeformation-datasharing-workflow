import Amplify, {Auth} from "aws-amplify";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { GlueClient, GetTableCommand } from "@aws-sdk/client-glue";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { ColumnLayout, Container, Flashbar, Header, Link, Box, SpaceBetween, BreadcrumbGroup, Table, Button, Form, FormField, Input, Badge} from "@awsui/components-react";
import ValueWithLabel from "./ValueWithLabel";

const config = Amplify.configure();
const SM_ARN = "arn:aws:states:ap-southeast-1:124052206493:stateMachine:DataLakeApprovalWorkflow";

function RequestAccessComponent(props) {
    const {dbname, tablename} = useParams();
    const [table, setTable] = useState();
    const [targetAccount, setTargetAccount] = useState();
    const [error, setError] = useState();
    const [tableNotFound, setTableNotFound] = useState(false);
    const [requestSuccessful, setRequestSuccessful] = useState(false);
    const [executionArn, setExecutionArn] = useState();

    const submitRequestAccess = async() => {
        if (targetAccount && targetAccount.length > 0) {
            const credentials = await Auth.currentCredentials();
            const sfnClient = new SFNClient({region: config.aws_project_region, credentials: Auth.essentialCredentials(credentials)});
            try {
                const smExecutionParams = {
                    source: {
                        database: dbname,
                        table: tablename
                    },
                    target: {
                        account_id: targetAccount
                    }
                };

                const resp = await sfnClient.send(new StartExecutionCommand({
                    input: JSON.stringify(smExecutionParams),
                    stateMachineArn: SM_ARN
                }));

                setExecutionArn(resp.executionArn);
                setRequestSuccessful(true);
                setTargetAccount(null);
            } catch (e) {
                setError("An unexpected error has occurred: "+e);
            }
        } else {
            setError("Target Account ID is a required field.");
        }
    }

    useEffect(async() => {
        const credentials = await Auth.currentCredentials();
        const glueClient = new GlueClient({region: config.aws_project_region, credentials: Auth.essentialCredentials(credentials)});
        try {
            const response = await glueClient.send(new GetTableCommand({DatabaseName: dbname, Name: tablename}));
            const table = response.Table;
            setTable(table);
        } catch (e) {
            setTableNotFound(true);
        }
    }, []);

    if (tableNotFound) {
        return <Flashbar items={[{header: "Invalid Request", type: "error", content: "There's no table found for the given parameter."}]} />;
    } else if (table) {
        return (
            <div>
                <BreadcrumbGroup items={[
                            { text: "Databases", href: "/"},
                            { text: dbname, href: "/tables/"+dbname },
                            { text: "Request Access ("+tablename+")", href: "/request-access/"+dbname+"/"+tablename }
                        ]} />
                <Box margin={{top: "s", bottom: "s"}} display={requestSuccessful ? "block" : "none"}>
                    <Flashbar items={[{type: "success", header: "Request Submitted ("+executionArn+")", content: "Successfully submitted request, once approved please accept RAM request."}]}></Flashbar>
                </Box>
                <Container header={<Header variant="h2">Table Details</Header>}>
                    <ColumnLayout columns={2} variant="text-grid">
                        <SpaceBetween size="m">
                            <ValueWithLabel label="Database">
                                <Link variant="primary" href={"/tables/"+dbname}>{dbname}</Link>
                            </ValueWithLabel>
                            <ValueWithLabel label="Table">
                                {tablename}
                            </ValueWithLabel>
                        </SpaceBetween>
                        <SpaceBetween size="m">
                            <ValueWithLabel label="Location">
                                {table.StorageDescriptor.Location}
                            </ValueWithLabel>
                            <ValueWithLabel label="Data Owner">
                                {(table.Parameters && "data_owner" in table.Parameters) ? table.Parameters.data_owner : "n/a"}
                            </ValueWithLabel>
                        </SpaceBetween>
                    </ColumnLayout>
                </Container>
                <Box margin={{top: "m"}}>
                    <Table header={<Header variant="h3">Columns</Header>} items={table.StorageDescriptor.Columns} columnDefinitions={[
                        {
                            header: "Name",
                            cell: item => item.Name
                        },
                        {
                            header: "Type",
                            cell: item => item.Type
                        },
                        {
                            header: "Is PII",
                            cell: item => (item.Parameters && "pii_flag" in item.Parameters && item.Parameters.pii_flag) ? <Badge color="red">Yes</Badge> : <Badge color="green">No</Badge>
                        }
                    ]} />
                </Box>
                <Box margin={{top: "m"}}>
                    <Form actions={<Button variant="primary" onClick={submitRequestAccess}>Submit</Button>} errorText={error}>
                        <Container header={<Header variant="h3">Request Access</Header>}>                                
                            <FormField label="Target Account ID">
                                <Input type="number" value={targetAccount} onChange={event => setTargetAccount(event.detail.value)} />
                            </FormField>
                        </Container>
                    </Form>
                </Box>  
            </div>
        );
    } else {
        return null;
    }
}

export default RequestAccessComponent;