import Amplify, {Auth} from 'aws-amplify';
import { useEffect, useState } from 'react';
import { SFNClient, DescribeExecutionCommand } from '@aws-sdk/client-sfn';
import { useParams } from 'react-router';
import { Box, BreadcrumbGroup, ColumnLayout, Container, Flashbar, Header, SpaceBetween } from '@awsui/components-react';
import ValueWithLabel from './ValueWithLabel';
import BadgeStatus from './BadgeStatus';

const config = Amplify.configure();

function WorkflowExecutionDetailsComponent(props) {
    const [detail, setDetail] = useState();
    const [input, setInput] = useState();
    const [arnError, setArnError] = useState();
    
    const {execArn} = useParams();

    useEffect(async() => {
        const credentials = await Auth.currentCredentials();
        const sfnClient = new SFNClient({region: config.aws_project_region, credentials: Auth.essentialCredentials(credentials)});
        try {
            const response = await sfnClient.send(new DescribeExecutionCommand({executionArn: execArn}));
            setInput(JSON.parse(response.input));
            setDetail(response);
        } catch (e) {
            setArnError(e);
        }
        
    }, []);

    if (arnError) {
        return <Flashbar items={[{header: "Invalid Request", type: "error", content: "There's no workflow execution found for the given parameter."}]} />;
    } else if (detail) {
        return (
            <div>
                <BreadcrumbGroup items={[
                            { text: "Workflow Executions", href: "/workflow-executions"},
                            { text: "Execution Details", href: "/execution-details/"+execArn },
                        ]} />
                <Container header={<Header variant="h2">Execution Details</Header>}>
                    <ColumnLayout columns={2} variant="text-grid">
                        <SpaceBetween size="m">
                            <ValueWithLabel label="Arn">
                                {detail.executionArn}
                            </ValueWithLabel>
                            <ValueWithLabel label="Name">
                                {detail.name}
                            </ValueWithLabel>
                            <ValueWithLabel label="Status">
                                <BadgeStatus>{detail.status}</BadgeStatus>
                            </ValueWithLabel>
                        </SpaceBetween>
                        <SpaceBetween size="m">
                        <ValueWithLabel label="State Machine Arn">
                                {detail.stateMachineArn}
                            </ValueWithLabel>
                            <ValueWithLabel label="Start Date">
                                {detail.startDate + ""}
                            </ValueWithLabel>
                            <ValueWithLabel label="Stop Date">
                                {detail.stopDate + ""}
                            </ValueWithLabel>
                        </SpaceBetween>
                    </ColumnLayout>
                </Container>
                <Box margin={{top: "l"}}>
                    <Container header={<Header variant="h3">Execution Input Parameters</Header>}>
                        <ColumnLayout columns={2} variant="text-grid">
                            <SpaceBetween size="m">
                                <ValueWithLabel label="Source Database">
                                    {input.source.database}
                                </ValueWithLabel>
                                <ValueWithLabel label="Source Table">
                                    {input.source.table}
                                </ValueWithLabel>
                            </SpaceBetween>
                            <SpaceBetween size="m">
                            <ValueWithLabel label="Target Account ID">
                                    {input.target.account_id}
                                </ValueWithLabel>
                            </SpaceBetween>
                        </ColumnLayout>
                    </Container>
                </Box>
            </div>
        );
    } else {
        return null;
    }
}

export default WorkflowExecutionDetailsComponent;