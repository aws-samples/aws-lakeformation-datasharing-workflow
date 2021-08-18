import { GlueClient, GetTablesCommand, GetDatabasesCommand, GetDatabaseCommand } from "@aws-sdk/client-glue";
import { Box, BreadcrumbGroup, Flashbar, Header, Link, Table } from "@awsui/components-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import Amplify, { Auth } from "aws-amplify";
import DatabaseDetailsComponent from "./DatabaseDetailsComponent";
import RequestAccessComponent from "./RequestAccessComponent";

const config = Amplify.configure();

function CatalogTablesComponent(props) {
    const {dbname} = useParams();
    
    const [tables, setTables] = useState([]);
    const [nextToken, setNextToken] = useState();
    const [executionArn, setExecutionArn] = useState();
    const [requestSuccessful, setRequestSuccessful] = useState(false);

    const requestAccessSuccessHandler = async(executionArn) => {
        setExecutionArn(executionArn);
        setRequestSuccessful(true);
    }

    useEffect(async() => {
        const credentials = await Auth.currentCredentials();
        const glue = new GlueClient({region: config.aws_project_region, credentials: Auth.essentialCredentials(credentials)});
        const results = await glue.send(new GetTablesCommand({DatabaseName: dbname}));
        setTables(results.TableList);
        setNextToken(results.NextToken);
    }, []);

    return(
        <div>
            <BreadcrumbGroup items={[
                { text: "Databases", href: "/"},
                { text: dbname, href: "/tables/"+dbname }
            ]} />
            <Box margin={{top: "s", bottom: "s"}} display={requestSuccessful ? "block" : "none"}>
                <Flashbar items={[{type: "success", header: "Request Submitted ("+executionArn+")", content: "Successfully submitted request, once approved please accept RAM request."}]}></Flashbar>
            </Box>
            <DatabaseDetailsComponent dbName={dbname} />
            <Box margin={{top: "l"}}>
                <Table 
                    columnDefinitions={[
                        {
                            header: "Table Name",
                            cell: item => item.Name
                        },
                        {
                            header: "Data Owner",
                            cell: item => ("data_owner" in item.Parameters) ? item.Parameters.data_owner : "n/a"
                        },
                        {
                            header: "Actions",
                            cell: item => <Link variant="primary" href={"/request-access/"+dbname+"/"+item.Name}>Request Per Table Access</Link>
                        }
                    ]}

                    items={tables}
                    header={<Header variant="h2">Tables in {dbname}</Header>}
                />
            </Box>
            <Box margin={{top: "l"}}>
                <RequestAccessComponent dbName={dbname} tableName="*" successHandler={requestAccessSuccessHandler} />
            </Box>
        </div>
    );
}

export default CatalogTablesComponent;