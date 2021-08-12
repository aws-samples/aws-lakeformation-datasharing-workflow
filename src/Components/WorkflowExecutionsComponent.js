import Amplify, {Auth} from "aws-amplify";
import { useEffect, useState } from "react";
import { SFNClient, ListExecutionsCommand } from "@aws-sdk/client-sfn";
import { Badge, Header, Table, Link, Box } from "@awsui/components-react";

const config = Amplify.configure();
const SM_ARN = "arn:aws:states:ap-southeast-1:124052206493:stateMachine:DataLakeApprovalWorkflow";

const BadgeStatus = ({children}) => {
    let color = "red";

    switch (children) {
        case "SUCCEEDED":
            color = "green";
            break;
        case "RUNNING":
            color = "blue";
            break;
    }

    return <Badge color={color}>{children}</Badge>
}

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
                    cell: item => item.name
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