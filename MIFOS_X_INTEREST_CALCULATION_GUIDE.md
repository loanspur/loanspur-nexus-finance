# Mifos X Unified Interest Calculation System

## Overview

The LoanspurCBS v2.0 system now uses a **unified Mifos X-based interest calculation system** that provides accurate and consistent interest calculations and schedule generation for daily, weekly, and monthly loan payments. This system follows Mifos X standards and ensures compliance with international banking practices.

## Key Features

### ✅ **Unified Calculation Method**
- **Single source of truth** for all interest calculations
- **Consistent results** across all loan types and frequencies
- **Mifos X compliance** for international standards

### ✅ **Multiple Payment Frequencies**
- **Daily payments** with accurate daily interest calculation
- **Weekly payments** with proper weekly compounding
- **Monthly payments** with standard monthly amortization

### ✅ **Multiple Interest Types**
- **Declining Balance** (reducing balance) - interest calculated on outstanding balance
- **Flat Rate** - interest calculated on original principal throughout the loan term

### ✅ **Multiple Amortization Methods**
- **Equal Installments** - same total payment amount each period
- **Equal Principal** - same principal amount each period, varying interest

### ✅ **Flexible Day Conventions**
- **360 days** - standard banking year
- **365 days** - actual calendar year
- **Actual days** - leap year aware

## Implementation Details

### Core Files

1. **`src/lib/mifos-interest-calculation.ts`** - Main calculation engine
2. **`src/lib/loan-schedule-generator.ts`** - Updated to use Mifos X system
3. **`src/hooks/useLoanManagement.ts`** - Updated loan management hooks

### Key Functions

#### `generateMifosLoanSchedule(params: MifosInterestParams)`
Generates complete loan schedule using Mifos X standards.

```typescript
const schedule = generateMifosLoanSchedule({
  principal: 10000,
  annualInterestRate: 12, // 12% per annum
  termInPeriods: 12, // 12 months
  repaymentFrequency: 'monthly',
  interestType: 'declining_balance',
  amortizationType: 'equal_installments',
  daysInYearType: '365',
  daysInMonthType: 'actual',
  disbursementDate: new Date('2024-01-01'),
  gracePeriodDays: 0,
  gracePeriodType: 'none'
});
```

#### `calculateMifosDailyInterest(outstandingBalance, annualRate, date, daysInYearType)`
Calculates daily interest for a specific date.

#### `calculateMifosWeeklyInterest(outstandingBalance, annualRate, startDate, endDate, daysInYearType)`
Calculates weekly interest between two dates.

#### `calculateMifosMonthlyInterest(outstandingBalance, annualRate, date, daysInMonthType, daysInYearType)`
Calculates monthly interest for a specific month.

## Interest Calculation Formulas

### Daily Interest (Mifos X Standard)
```
Daily Interest = Outstanding Balance × (Annual Rate / 100) / Days in Year
```

### Weekly Interest (Mifos X Standard)
```
Weekly Interest = Outstanding Balance × (Annual Rate / 100) × (Days in Period / Days in Year)
```

### Monthly Interest (Mifos X Standard)
```
Monthly Interest = Outstanding Balance × (Annual Rate / 100) × (Days in Month / Days in Year)
```

### Declining Balance with Equal Installments
```
Periodic Payment = Principal × (Periodic Rate × (1 + Periodic Rate)^Term) / ((1 + Periodic Rate)^Term - 1)
Interest = Outstanding Balance × Periodic Rate
Principal = Periodic Payment - Interest
```

### Flat Rate
```
Total Interest = Principal × Annual Rate × Term / 12
Periodic Interest = Total Interest / Number of Periods
```

## Day Convention Calculations

### 360-Day Year
- Standard banking convention
- Each month = 30 days
- Year = 360 days

### 365-Day Year
- Actual calendar year
- Leap years = 366 days
- Each month = actual days

### Actual Days
- Uses actual calendar days
- Leap year aware
- Most accurate for irregular periods

## Grace Period Support

The system supports four types of grace periods:

1. **None** - No grace period
2. **Principal Only** - Only principal payments deferred
3. **Interest Only** - Only interest payments deferred
4. **Principal and Interest** - Both principal and interest deferred

## Usage Examples

### Daily Payment Loan
```typescript
const dailyLoanParams = {
  principal: 5000,
  annualInterestRate: 15, // 15% per annum
  termInPeriods: 30, // 30 days
  repaymentFrequency: 'daily',
  interestType: 'declining_balance',
  amortizationType: 'equal_installments',
  daysInYearType: '365',
  disbursementDate: new Date('2024-01-01')
};

const dailySchedule = generateMifosLoanSchedule(dailyLoanParams);
```

### Weekly Payment Loan
```typescript
const weeklyLoanParams = {
  principal: 10000,
  annualInterestRate: 12, // 12% per annum
  termInPeriods: 52, // 52 weeks
  repaymentFrequency: 'weekly',
  interestType: 'declining_balance',
  amortizationType: 'equal_installments',
  daysInYearType: '365',
  disbursementDate: new Date('2024-01-01')
};

const weeklySchedule = generateMifosLoanSchedule(weeklyLoanParams);
```

### Monthly Payment Loan with Grace Period
```typescript
const monthlyLoanParams = {
  principal: 20000,
  annualInterestRate: 10, // 10% per annum
  termInPeriods: 12, // 12 months
  repaymentFrequency: 'monthly',
  interestType: 'declining_balance',
  amortizationType: 'equal_installments',
  daysInYearType: '365',
  disbursementDate: new Date('2024-01-01'),
  gracePeriodDays: 30,
  gracePeriodType: 'principal_only'
};

const monthlySchedule = generateMifosLoanSchedule(monthlyLoanParams);
```

## Database Integration

### Schedule Storage
The generated schedules are stored in the `loan_schedules` table with the following structure:

```sql
CREATE TABLE loan_schedules (
  id UUID PRIMARY KEY,
  loan_id UUID REFERENCES loans(id),
  installment_number INTEGER,
  due_date DATE,
  principal_amount DECIMAL(15,2),
  interest_amount DECIMAL(15,2),
  fee_amount DECIMAL(15,2),
  total_amount DECIMAL(15,2),
  paid_amount DECIMAL(15,2),
  outstanding_amount DECIMAL(15,2),
  payment_status TEXT,
  created_at TIMESTAMP
);
```

### Automatic Schedule Generation
Schedules are automatically generated during loan disbursement using the `useProcessLoanDisbursement` hook.

## Validation

### Parameter Validation
The system includes comprehensive parameter validation:

```typescript
const validation = validateMifosLoanParams(params);
if (!validation.valid) {
  throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
}
```

### Validation Rules
- Principal amount must be greater than zero
- Annual interest rate must be between 0 and 100 percent
- Term in periods must be greater than zero
- Grace period days cannot be negative
- Grace period cannot exceed loan term

## Error Handling

### Common Errors
1. **Invalid interest rate** - Rate must be between 0-100%
2. **Invalid principal** - Principal must be positive
3. **Invalid term** - Term must be positive
4. **Invalid grace period** - Grace period cannot exceed term

### Error Recovery
- Automatic parameter validation before calculation
- Detailed error messages for debugging
- Graceful fallback to default values where appropriate

## Performance Considerations

### Optimization Features
- **Efficient calculations** using optimized formulas
- **Minimal memory usage** for large schedules
- **Fast validation** with early exit conditions
- **Cached results** for repeated calculations

### Scalability
- **Handles large loans** with many installments
- **Supports high-frequency payments** (daily)
- **Efficient database operations** with batch inserts

## Testing

### Unit Tests
The system includes comprehensive unit tests for:
- Interest calculation accuracy
- Schedule generation correctness
- Parameter validation
- Edge cases and error conditions

### Integration Tests
- Database integration testing
- End-to-end loan workflow testing
- Performance testing with large datasets

## Migration from Old System

### Backward Compatibility
- **Legacy functions preserved** for existing code
- **Gradual migration** supported
- **No breaking changes** to existing APIs

### Migration Steps
1. Update loan product configurations
2. Regenerate existing loan schedules
3. Update UI components to use new system
4. Remove legacy calculation code

## Benefits

### ✅ **Accuracy**
- Mifos X compliant calculations
- Precise interest calculations
- Correct schedule generation

### ✅ **Consistency**
- Unified calculation method
- Same results across all components
- Standardized formulas

### ✅ **Flexibility**
- Multiple payment frequencies
- Various interest types
- Configurable day conventions

### ✅ **Maintainability**
- Single source of truth
- Clear, documented code
- Comprehensive testing

### ✅ **Compliance**
- Mifos X standards
- International banking practices
- Regulatory compliance

## Conclusion

The new Mifos X-based interest calculation system provides a **robust, accurate, and compliant** solution for loan interest calculations and schedule generation. It ensures **consistency across all loan types** and **compliance with international standards**, making it suitable for production use in financial institutions.

The system is **fully integrated** with the existing LoanspurCBS v2.0 architecture and provides **seamless migration** from the previous calculation methods while maintaining **backward compatibility**.
