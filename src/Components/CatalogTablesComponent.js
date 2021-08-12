import { GlueClient, GetTablesCommand } from "@aws-sdk/client-glue";
import { BreadcrumbGroup, Header, Link, Table } from "@awsui/components-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import Amplify, { Auth } from "aws-amplify";

const config = Amplify.configure();

function CatalogTablesComponent(props) {
    const {dbname} = useParams();
    
    const [tables, setTables] = useState([]);
    const [nextToken, setNextToken] = useState();

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
                        cell: item => <Link variant="primary" href={"/request-access/"+dbname+"/"+item.Name}>Request Access</Link>
                    }
                ]}

                items={tables}
                header={<Header variant="h2">Tables in {dbname}</Header>}
            />
        </div>
    );
}

export default CatalogTablesComponent;