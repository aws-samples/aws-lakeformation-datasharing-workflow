import { Badge } from "@awsui/components-react";
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

export default BadgeStatus;