import MPesaIntegrationManagement from "@/components/tenant/MPesaIntegrationManagement";
import { useAuth } from "@/hooks/useAuth";

const MPesaIntegrationPage = () => {
  const { profile } = useAuth();

  if (!profile?.tenant_id) {
    return <div>Loading...</div>;
  }

  return <MPesaIntegrationManagement tenantId={profile.tenant_id} />;
};

export default MPesaIntegrationPage;