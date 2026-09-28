package com.expenseiq.service;

import com.expenseiq.dto.CategorySpendingResponse;
import com.expenseiq.dto.MonthlyReportResponse;
import com.expenseiq.entity.Transaction;
import com.expenseiq.entity.TransactionType;
import com.expenseiq.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final DashboardService dashboardService;

    public ReportService(TransactionRepository transactionRepository, DashboardService dashboardService) {
        this.transactionRepository = transactionRepository;
        this.dashboardService = dashboardService;
    }

    public MonthlyReportResponse getMonthlyReport(Long userId, Integer month, Integer year) {
        LocalDate today = LocalDate.now();
        int targetMonth = (month != null) ? month : today.getMonthValue();
        int targetYear = (year != null) ? year : today.getYear();

        YearMonth ym = YearMonth.of(targetYear, targetMonth);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        BigDecimal income = transactionRepository.sumAmountByUserIdAndTypeAndDateRange(
                userId, TransactionType.INCOME, start, end);
        BigDecimal expense = transactionRepository.sumAmountByUserIdAndTypeAndDateRange(
                userId, TransactionType.EXPENSE, start, end);

        if (income == null) income = BigDecimal.ZERO;
        if (expense == null) expense = BigDecimal.ZERO;

        BigDecimal savings = income.subtract(expense);

        int daysInMonth = ym.lengthOfMonth();
        BigDecimal avgDaily = BigDecimal.ZERO;
        if (expense.compareTo(BigDecimal.ZERO) > 0) {
            avgDaily = expense.divide(BigDecimal.valueOf(daysInMonth), 2, RoundingMode.HALF_UP);
        }

        List<CategorySpendingResponse> categorySpendings = dashboardService.getCategorySpending(userId, targetMonth, targetYear);

        String highestCategory = "None";
        if (!categorySpendings.isEmpty()) {
            highestCategory = categorySpendings.get(0).getCategoryName();
        }

        List<Transaction> transactionsInMonth = transactionRepository.findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
                userId, start, end);

        MonthlyReportResponse report = new MonthlyReportResponse();
        report.setMonth(targetMonth);
        report.setYear(targetYear);
        report.setTotalIncome(income);
        report.setTotalExpenses(expense);
        report.setSavings(savings);
        report.setHighestSpendingCategory(highestCategory);
        report.setAverageDailyExpense(avgDaily);
        report.setCategorySpendings(categorySpendings);
        report.setTransactionsCount(transactionsInMonth.size());

        return report;
    }

    public String generateCsv(Long userId, Integer month, Integer year) {
        LocalDate today = LocalDate.now();
        int targetMonth = (month != null) ? month : today.getMonthValue();
        int targetYear = (year != null) ? year : today.getYear();

        YearMonth ym = YearMonth.of(targetYear, targetMonth);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<Transaction> transactions = transactionRepository.findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
                userId, start, end);

        StringBuilder sb = new StringBuilder();
        sb.append("Transaction ID,Date,Type,Category,Amount,Payment Method,Description\n");

        for (Transaction t : transactions) {
            sb.append(t.getId()).append(",");
            sb.append(t.getTransactionDate()).append(",");
            sb.append(t.getType()).append(",");
            sb.append("\"").append(t.getCategory().getName().replace("\"", "\"\"")).append("\",");
            sb.append(t.getAmount()).append(",");
            sb.append(t.getPaymentMethod()).append(",");
            sb.append("\"").append(t.getDescription() != null ? t.getDescription().replace("\"", "\"\"") : "").append("\"\n");
        }

        return sb.toString();
    }
}
