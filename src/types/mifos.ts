export interface MifosConfig {
  baseUrl: string;
  tenantIdentifier: string;
  username: string;
  password: string;
}

export interface MifosClient {
  id?: number;
  externalId?: string;
  firstName: string;
  lastName: string;
  mobileNo?: string;
  emailAddress?: string;
  dateOfBirth?: string;
  genderId?: number;
  clientTypeId?: number;
  officeId: number;
  active?: boolean;
  activationDate?: string;
  staffId?: number;
  legalFormId?: number;
}

export interface MifosLoanProduct {
  id: number;
  name: string;
  shortName: string;
  principal: {
    min: number;
    max: number;
    default: number;
  };
  numberOfRepayments: {
    min: number;
    max: number;
    default: number;
  };
  interestRatePerPeriod: {
    min: number;
    max: number;
    default: number;
  };
  repaymentEvery: number;
  repaymentFrequencyType: {
    id: number;
    code: string;
    value: string;
  };
  interestType: {
    id: number;
    code: string;
    value: string;
  };
  interestCalculationPeriodType: {
    id: number;
    code: string;
    value: string;
  };
  amortizationType: {
    id: number;
    code: string;
    value: string;
  };
  transactionProcessingStrategyId: number;
  charges: any[];
  accountingRule: {
    id: number;
    code: string;
    value: string;
  };
}

export interface MifosLoanApplication {
  id?: number;
  externalId?: string;
  clientId: number;
  productId: number;
  principal: number;
  loanTermFrequency: number;
  loanTermFrequencyType: number;
  numberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequencyType: number;
  interestRatePerPeriod: number;
  amortizationType: number;
  interestType: number;
  interestCalculationPeriodType: number;
  transactionProcessingStrategyId: number;
  expectedDisbursementDate: string;
  submittedOnDate: string;
  locale: string;
  dateFormat: string;
  loanOfficerId?: number;
  charges?: any[];
}

export interface MifosLoan {
  id: number;
  accountNo: string;
  externalId?: string;
  clientId: number;
  clientName: string;
  productId: number;
  productName: string;
  status: {
    id: number;
    code: string;
    value: string;
    pendingApproval: boolean;
    waitingForDisbursal: boolean;
    active: boolean;
    closedObligationsMet: boolean;
    closedWrittenOff: boolean;
    closedRescheduled: boolean;
    closed: boolean;
    overpaid: boolean;
  };
  loanType: {
    id: number;
    code: string;
    value: string;
  };
  principal: number;
  approvedPrincipal: number;
  proposedPrincipal: number;
  termFrequency: number;
  termPeriodFrequencyType: {
    id: number;
    code: string;
    value: string;
  };
  numberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequencyType: {
    id: number;
    code: string;
    value: string;
  };
  interestRatePerPeriod: number;
  interestType: {
    id: number;
    code: string;
    value: string;
  };
  timeline: {
    submittedOnDate?: string;
    submittedByUsername?: string;
    submittedByFirstname?: string;
    submittedByLastname?: string;
    approvedOnDate?: string;
    approvedByUsername?: string;
    approvedByFirstname?: string;
    approvedByLastname?: string;
    expectedDisbursementDate?: string;
    actualDisbursementDate?: string;
    disbursedByUsername?: string;
    disbursedByFirstname?: string;
    disbursedByLastname?: string;
    closedOnDate?: string;
    expectedMaturityDate?: string;
  };
  summary: {
    currency: {
      code: string;
      name: string;
      decimalPlaces: number;
      displaySymbol: string;
      nameCode: string;
      displayLabel: string;
    };
    principalDisbursed: number;
    principalPaid: number;
    principalWrittenOff: number;
    principalOutstanding: number;
    principalOverdue: number;
    interestCharged: number;
    interestPaid: number;
    interestWaived: number;
    interestWrittenOff: number;
    interestOutstanding: number;
    interestOverdue: number;
    feeChargesCharged: number;
    feeChargesDueAtDisbursementCharged: number;
    feeChargesPaid: number;
    feeChargesWaived: number;
    feeChargesWrittenOff: number;
    feeChargesOutstanding: number;
    feeChargesOverdue: number;
    penaltyChargesCharged: number;
    penaltyChargesPaid: number;
    penaltyChargesWaived: number;
    penaltyChargesWrittenOff: number;
    penaltyChargesOutstanding: number;
    penaltyChargesOverdue: number;
    totalExpectedRepayment: number;
    totalRepayment: number;
    totalExpectedCostOfLoan: number;
    totalCostOfLoan: number;
    totalWaived: number;
    totalWrittenOff: number;
    totalOutstanding: number;
    totalOverdue: number;
  };
}

export interface MifosLoanDisbursement {
  id?: number;
  transactionDate: string;
  transactionAmount: number;
  paymentTypeId?: number;
  accountNumber?: string;
  checkNumber?: string;
  routingCode?: string;
  receiptNumber?: string;
  bankNumber?: string;
  locale: string;
  dateFormat: string;
  note?: string;
}

export interface MifosApiResponse<T = any> {
  officeId?: number;
  clientId?: number;
  loanId?: number;
  resourceId?: number;
  changes?: any;
  status?: {
    id: number;
    code: string;
    value: string;
  };
  data?: T;
}

export interface MifosErrorResponse {
  developerMessage: string;
  httpStatusCode: string;
  defaultUserMessage: string;
  userMessageGlobalisationCode: string;
  errors?: Array<{
    developerMessage: string;
    defaultUserMessage: string;
    userMessageGlobalisationCode: string;
    parameterName?: string;
    value?: any;
    args?: Array<{
      value: any;
    }>;
  }>;
}