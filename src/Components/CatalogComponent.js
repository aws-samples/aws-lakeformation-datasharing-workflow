import Amplify, { Auth } from "aws-amplify";
import { useEffect, useState } from "react";
import {GlueClient, GetDatabasesCommand} from '@aws-sdk/client-glue';
import { Header, Link, Table } from "@awsui/components-react";

const config = Amplify.configure();

function CatalogComponent(props) {
    const [databases, setDatabases] = useState([]);
    const [nextToken, setNextToken] = useState();

    useEffect(async() => {
        const credentials = await Auth.currentCredentials();
        const glue = new GlueClient({region: config.aws_project_region, credentials: Auth.essentialCredentials(credentials)});
        const results = await glue.send(new GetDatabasesCommand({}));
        setDatabases(results.DatabaseList);
        setNextToken(results.NextToken);
    }, []);

    return (
        <div>
            <Table
                columnDefinitions={[
                    {
                        header: "Database Name",
                        cell: item => item.Name

                    },
                    {
                        id: "location",
                        header: "Location",
                        cell: item => item.LocationUri
                    },
                    {
                        id: "actions",
                        header: "Actions",
                        cell: item => <Link variant="primary" href={"/tables/"+item.Name}>View Tables</Link>
                    }
                ]}

                items={databases}
                header={<Header variant="h2">Catalog - Databases</Header>}
             />
        </div>
    );
}

export default CatalogComponent;