import Amplify, {Auth} from "aws-amplify";
import { useEffect, useState } from "react";
import { SFNClient, ListExecutionsCommand } from "@aws-sdk/client-sfn";
import { Header, Table, Link, Box } from "@awsui/components-react";
import BadgeStatus from "./BadgeStatus";
import AppConfig from "../app-config";

const config = Amplify.configure();
const SM_ARN = AppConfig.state_machine_arn;

function WorkflowExecutionsComponent(props) {
    const [executions, setExecutions] = useState([]);
    const [response, setResponse] = useState();
    const [nextToken, setNextToken] = useState(null);

    useEffect(async() => {
        const credentials = await Auth.currentCredentials();
        const sfnClient = new SFNClient({region: config.aws_project_region, credentials: Auth.essentialCredentials(credentials)});
        const result = await sfnClient.send(new ListExecutionsCommand({
            maxResults: 20,
            nextToken: nextToken,
            stateMachineArn: SM_ARN
        }));
        
        setResponse(result);
        setExecutions(executions.concat(result.executions));
    }, [nextToken]);

    return (
        <div>
            <Table footer={<Box textAlign="center" display={(response && response.nextToken) ? "block" : "none"}><Link variant="primary" onFollow={(event) => setNextToken(response.nextToken)}>View More</Link></Box>} header={<Header variant="h2">Workflow Executions</Header>} items={executions} columnDefinitions={[
                {
                    header: "Name",
                    cell: item => <Link variant="primary" href={"/execution-details/"+item.executionArn}>{item.name}</Link>
                },
                {
                    header: "Start Date",
                    cell: item => item.startDate + ""
                },
                {
                    header: "Stop Date",
                    cell: item => item.stopDate + ""
                },
                {
                    header: "Status",
                    cell: item => <BadgeStatus>{item.status}</BadgeStatus>
                }
            ]} />
        </div>
    );
}

export default WorkflowExecutionsComponent;