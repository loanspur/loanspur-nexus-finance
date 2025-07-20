import { 
  MifosConfig, 
  MifosClient, 
  MifosLoanApplication, 
  MifosLoan, 
  MifosLoanDisbursement, 
  MifosApiResponse,
  MifosErrorResponse
} from '@/types/mifos';

export class MifosService {
  private config: MifosConfig;
  private baseHeaders: HeadersInit;

  constructor(config: MifosConfig) {
    this.config = config;
    this.baseHeaders = {
      'Content-Type': 'application/json',
      'Fineract-Platform-TenantId': config.tenantIdentifier,
      'Authorization': 'Basic ' + btoa(`${config.username}:${config.password}`)
    };
  }

  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    body?: any
  ): Promise<T> {
    const url = `${this.config.baseUrl}/fineract-provider/api/v1${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: this.baseHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData: MifosErrorResponse = await response.json().catch(() => ({
        developerMessage: `HTTP ${response.status}: ${response.statusText}`,
        httpStatusCode: response.status.toString(),
        defaultUserMessage: `Request failed with status ${response.status}`,
        userMessageGlobalisationCode: 'error.msg.platform.service.unavailable'
      }));
      
      throw new Error(errorData.defaultUserMessage || errorData.developerMessage);
    }

    return response.json();
  }

  // Client operations
  async createClient(clientData: MifosClient): Promise<MifosApiResponse> {
    return this.makeRequest('/clients', 'POST', {
      ...clientData,
      locale: 'en',
      dateFormat: 'yyyy-MM-dd'
    });
  }

  async getClient(clientId: number): Promise<MifosClient> {
    return this.makeRequest(`/clients/${clientId}`);
  }

  async activateClient(clientId: number, activationDate: string): Promise<MifosApiResponse> {
    return this.makeRequest(`/clients/${clientId}?command=activate`, 'POST', {
      activationDate,
      locale: 'en',
      dateFormat: 'yyyy-MM-dd'
    });
  }

  // Loan operations
  async createLoanApplication(loanData: MifosLoanApplication): Promise<MifosApiResponse> {
    return this.makeRequest('/loans', 'POST', loanData);
  }

  async getLoan(loanId: number): Promise<MifosLoan> {
    return this.makeRequest(`/loans/${loanId}?associations=all`);
  }

  async approveLoan(
    loanId: number, 
    approvalData: {
      approvedOnDate: string;
      approvedLoanAmount?: number;
      expectedDisbursementDate?: string;
      locale: string;
      dateFormat: string;
    }
  ): Promise<MifosApiResponse> {
    return this.makeRequest(`/loans/${loanId}?command=approve`, 'POST', approvalData);
  }

  async disburseLoan(
    loanId: number, 
    disbursementData: MifosLoanDisbursement
  ): Promise<MifosApiResponse> {
    return this.makeRequest(`/loans/${loanId}?command=disburse`, 'POST', disbursementData);
  }

  async getLoanByExternalId(externalId: string): Promise<MifosLoan[]> {
    return this.makeRequest(`/loans?externalId=${externalId}`);
  }

  // Utility methods
  async getOffices(): Promise<any[]> {
    return this.makeRequest('/offices');
  }

  async getLoanProducts(): Promise<any[]> {
    return this.makeRequest('/loanproducts');
  }

  async getPaymentTypes(): Promise<any[]> {
    return this.makeRequest('/paymenttypes');
  }

  async getStaff(officeId?: number): Promise<any[]> {
    const endpoint = officeId ? `/staff?officeId=${officeId}` : '/staff';
    return this.makeRequest(endpoint);
  }

  // Validate configuration
  async validateConnection(): Promise<boolean> {
    try {
      await this.getOffices();
      return true;
    } catch (error) {
      console.error('Mifos connection validation failed:', error);
      return false;
    }
  }
}

// Factory function to create MifosService instance
export const createMifosService = (config: MifosConfig): MifosService => {
  return new MifosService(config);
};

// Helper to get Mifos config from tenant
export const getMifosConfigFromTenant = (tenant: any): MifosConfig | null => {
  if (!tenant.mifos_base_url || !tenant.mifos_tenant_identifier || 
      !tenant.mifos_username || !tenant.mifos_password) {
    return null;
  }

  return {
    baseUrl: tenant.mifos_base_url,
    tenantIdentifier: tenant.mifos_tenant_identifier,
    username: tenant.mifos_username,
    password: tenant.mifos_password
  };
};