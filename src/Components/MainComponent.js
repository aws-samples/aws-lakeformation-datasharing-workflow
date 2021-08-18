import { AppLayout, Button, SideNavigation } from "@awsui/components-react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import CatalogComponent from "./CatalogComponent";
import CatalogTablesComponent from "./CatalogTablesComponent";
import {Auth} from "aws-amplify";
import WorkflowExecutionsComponent from "./WorkflowExecutionsComponent";
import WorkflowExecutionDetailsComponent from "./WorkflowExecutionDetailsComponent";
import TableDetailsComponent from "./TableDetailsComponent";

function MainComponent(props) {
    return (
        <AppLayout navigation={
            <SideNavigation 
                activeHref={window.location.pathname} 
                header={{ href: "/", text: "Data Lake Workflow"}}
                items={[
                    {type: "link", text: "Catalog", href: "/"},
                    {type: "link", text: "Workflow Executions", href: "/workflow-executions"},
                    {type: "link", text: "Logout", href: "#"}
                ]}
                onFollow={async(event) => {
                    event.preventDefault();
                    if (event.detail.text != "Logout") {
                        window.location = event.detail.href;
                    } else {
                        await Auth.signOut();
                        window.location = "/";
                    }
                }}
                />
        } content={
            <BrowserRouter>
                <Switch>
                    <Route exact path="/">
                        <CatalogComponent />
                    </Route>
                    <Route exact path="/tables/:dbname">
                        <CatalogTablesComponent />
                    </Route>
                    <Route exact path="/request-access/:dbname/:tablename">
                        <TableDetailsComponent />
                    </Route>
                    <Route exact path="/workflow-executions">
                        <WorkflowExecutionsComponent />
                    </Route>
                    <Route exact path="/execution-details/:execArn">
                        <WorkflowExecutionDetailsComponent />
                    </Route>
                </Switch>
            </BrowserRouter>
        } />
    );
}

export default MainComponent;