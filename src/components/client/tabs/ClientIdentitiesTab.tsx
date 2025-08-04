// This component has been replaced by ClientIdentifiersTab
// Redirecting to the proper implementation
import { ClientIdentifiersTab } from "./ClientIdentifiersTab";

interface ClientIdentitiesTabProps {
  clientId: string;
}

export const ClientIdentitiesTab = ({ clientId }: ClientIdentitiesTabProps) => {
  return <ClientIdentifiersTab clientId={clientId} />;
};
