import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

interface LoanStatement {
  loan: any;
  clientName: string;
  paymentHistory: any[];
  loanDetails: any;
}

interface SavingsStatement {
  savings: any;
  clientName: string;
  transactionHistory: any[];
  savingsDetails: any;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

export const generateLoanStatement = ({ loan, clientName, paymentHistory, loanDetails }: LoanStatement) => {
  const doc = new jsPDF();
  const currentDate = format(new Date(), 'MMMM dd, yyyy');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(234, 88, 12); // Orange color
  doc.text('LOAN STATEMENT', 105, 20, { align: 'center' });
  
  // Client and loan information
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Client: ${clientName}`, 20, 40);
  doc.text(`Loan ID: ${loan.id}`, 20, 50);
  doc.text(`Loan Type: ${loan.type}`, 20, 60);
  doc.text(`Statement Date: ${currentDate}`, 140, 40);
  doc.text(`Original Amount: KES ${loan.amount.toLocaleString()}`, 140, 50);
  doc.text(`Outstanding: KES ${loan.outstanding.toLocaleString()}`, 140, 60);
  
  // Loan details summary
  doc.setFontSize(14);
  doc.text('Loan Summary', 20, 80);
  doc.setFontSize(10);
  
  const summaryData = [
    ['Disbursement Date', format(new Date(loanDetails.disbursementDate), 'MMM dd, yyyy')],
    ['Maturity Date', format(new Date(loanDetails.maturityDate), 'MMM dd, yyyy')],
    ['Interest Rate', `${loanDetails.interestRate}% p.a.`],
    ['Monthly Payment', `KES ${loanDetails.monthlyPayment.toLocaleString()}`],
    ['Payments Made', loanDetails.totalPayments.toString()],
    ['Principal Paid', `KES ${loanDetails.principalPaid.toLocaleString()}`],
    ['Interest Paid', `KES ${loanDetails.interestPaid.toLocaleString()}`],
    ['Outstanding Balance', `KES ${loan.outstanding.toLocaleString()}`]
  ];
  
  doc.autoTable({
    startY: 90,
    head: [['Description', 'Details']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [234, 88, 12] },
    margin: { left: 20, right: 20 }
  });
  
  // Payment history
  doc.setFontSize(14);
  doc.text('Payment History', 20, doc.lastAutoTable.finalY + 20);
  
  const paymentData = paymentHistory.map(payment => [
    format(new Date(payment.date), 'MMM dd, yyyy'),
    payment.type,
    `KES ${payment.amount.toLocaleString()}`,
    payment.status,
    `KES ${payment.balance.toLocaleString()}`
  ]);
  
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 30,
    head: [['Date', 'Type', 'Amount', 'Status', 'Balance']],
    body: paymentData,
    theme: 'grid',
    headStyles: { fillColor: [234, 88, 12] },
    margin: { left: 20, right: 20 }
  });
  
  // Footer
  doc.setFontSize(8);
  doc.text(`Generated on ${currentDate} | Page 1`, 105, 280, { align: 'center' });
  
  // Download the PDF
  doc.save(`loan-statement-${loan.id}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateSavingsStatement = ({ savings, clientName, transactionHistory, savingsDetails }: SavingsStatement) => {
  const doc = new jsPDF();
  const currentDate = format(new Date(), 'MMMM dd, yyyy');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(34, 197, 94); // Green color
  doc.text('SAVINGS STATEMENT', 105, 20, { align: 'center' });
  
  // Client and account information
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Client: ${clientName}`, 20, 40);
  doc.text(`Account ID: ${savings.id}`, 20, 50);
  doc.text(`Account Type: ${savings.type}`, 20, 60);
  doc.text(`Statement Date: ${currentDate}`, 140, 40);
  doc.text(`Current Balance: KES ${savings.balance.toLocaleString()}`, 140, 50);
  doc.text(`Interest Rate: ${savings.interestRate}%`, 140, 60);
  
  // Account details summary
  doc.setFontSize(14);
  doc.text('Account Summary', 20, 80);
  doc.setFontSize(10);
  
  const summaryData = [
    ['Opening Date', format(new Date(savingsDetails.openingDate), 'MMM dd, yyyy')],
    ['Current Balance', `KES ${savings.balance.toLocaleString()}`],
    ['Interest Rate', `${savings.interestRate}% p.a.`],
    ['Total Deposits', `KES ${savingsDetails.totalDeposits.toLocaleString()}`],
    ['Total Withdrawals', `KES ${savingsDetails.totalWithdrawals.toLocaleString()}`],
    ['Interest Earned', `KES ${savingsDetails.interestEarned.toLocaleString()}`],
    ['Average Balance', `KES ${savingsDetails.averageBalance.toLocaleString()}`],
    ['Total Transactions', savingsDetails.numberOfTransactions.toString()]
  ];
  
  doc.autoTable({
    startY: 90,
    head: [['Description', 'Details']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [34, 197, 94] },
    margin: { left: 20, right: 20 }
  });
  
  // Transaction history
  doc.setFontSize(14);
  doc.text('Transaction History', 20, doc.lastAutoTable.finalY + 20);
  
  const transactionData = transactionHistory.map(transaction => [
    format(new Date(transaction.date), 'MMM dd, yyyy'),
    transaction.type,
    transaction.method,
    `KES ${transaction.amount.toLocaleString()}`,
    `KES ${transaction.balance.toLocaleString()}`,
    transaction.reference
  ]);
  
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 30,
    head: [['Date', 'Type', 'Method', 'Amount', 'Balance', 'Reference']],
    body: transactionData,
    theme: 'grid',
    headStyles: { fillColor: [34, 197, 94] },
    margin: { left: 20, right: 20 }
  });
  
  // Footer
  doc.setFontSize(8);
  doc.text(`Generated on ${currentDate} | Page 1`, 105, 280, { align: 'center' });
  
  // Download the PDF
  doc.save(`savings-statement-${savings.id}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};