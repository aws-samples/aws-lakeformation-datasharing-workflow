import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { useEffect, useState } from "react";
import Amplify, { Auth } from "aws-amplify";
import { Button, Container, Form, FormField, Header, Input } from "@awsui/components-react";
import AppConfig from "../app-config";

const config = Amplify.configure();
const SM_ARN = AppConfig.state_machine_arn;

function RequestAccessComponent({dbName, tableName, successHandler}) {
    const [targetAccount, setTargetAccount] = useState();
    const [error, setError] = useState();

    const submitRequestAccess = async() => {
        if (targetAccount && targetAccount.length > 0) {
            const credentials = await Auth.currentCredentials();
            const sfnClient = new SFNClient({region: config.aws_project_region, credentials: Auth.essentialCredentials(credentials)});
            try {
                const smExecutionParams = {
                    source: {
                        database: dbName,
                        table: tableName
                    },
                    target: {
                        account_id: targetAccount
                    }
                };

                const resp = await sfnClient.send(new StartExecutionCommand({
                    input: JSON.stringify(smExecutionParams),
                    stateMachineArn: SM_ARN
                }));

                setTargetAccount(null);

                if (successHandler) {
                    successHandler(resp.executionArn);
                }
            } catch (e) {
                setError("An unexpected error has occurred: "+e);
            }
        } else {
            setError("Target Account ID is a required field.");
        }
    }

    return (
        <Form actions={<Button variant="primary" onClick={submitRequestAccess}>Submit</Button>} errorText={error}>
            <Container header={<Header variant="h3">Request Access</Header>}>                                
                <FormField label="Target Account ID">
                    <Input type="number" value={targetAccount} onChange={event => setTargetAccount(event.detail.value)} />
                </FormField>
            </Container>
        </Form>
    );
}

export default RequestAccessComponent;