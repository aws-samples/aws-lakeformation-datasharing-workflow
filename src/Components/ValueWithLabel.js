import { Box } from "@awsui/components-react";
const ValueWithLabel = ({ label, children }) => (
    <div>
      <Box margin={{ bottom: 'xxxs' }} color="text-label">
        {label}
      </Box>
      <div>{children}</div>
    </div>
  );

export default ValueWithLabel