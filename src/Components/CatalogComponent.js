import Amplify, { Auth } from "aws-amplify";
import { useEffect, useState } from "react";
import {GlueClient, GetDatabasesCommand} from '@aws-sdk/client-glue';
import { Box, Header, Link, Table } from "@awsui/components-react";

const config = Amplify.configure();

function CatalogComponent(props) {
    const [databases, setDatabases] = useState([]);
    const [response, setResponse] = useState();
    const [nextToken, setNextToken] = useState(null);

    useEffect(async() => {
        const credentials = await Auth.currentCredentials();
        const glue = new GlueClient({region: config.aws_project_region, credentials: Auth.essentialCredentials(credentials)});
        const results = await glue.send(new GetDatabasesCommand({NextToken: nextToken}));
        setDatabases(databases => databases.concat(results.DatabaseList));
        setResponse(results);
    }, [nextToken]);

    return (
        <div>
            <Table
                footer={<Box textAlign="center" display={(response && response.NextToken) ? "block" : "none"}><Link variant="primary" onFollow={(event) => setNextToken(response.NextToken)}>View More</Link></Box>}
                columnDefinitions={[
                    {
                        header: "Database Name",
                        cell: item => item.Name

                    },
                    {
                        header: "Location",
                        cell: item => item.LocationUri
                    },
                    {
                        header: "Owner",
                        cell: item => item.Parameters.data_owner_name + " ("+item.Parameters.data_owner+")"
                    },
                    {
                        header: "Actions",
                        cell: item => <Link variant="primary" href={"/tables/"+item.Name}>Request Access</Link>
                    }
                ]}

                items={databases}
                header={<Header variant="h2">Catalog - Databases</Header>}
             />
        </div>
    );
}

export default CatalogComponent;