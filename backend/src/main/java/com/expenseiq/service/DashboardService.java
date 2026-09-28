package com.expenseiq.service;

import com.expenseiq.dto.CategorySpendingResponse;
import com.expenseiq.dto.DashboardSummaryResponse;
import com.expenseiq.dto.MonthlyTrendResponse;
import com.expenseiq.entity.TransactionType;
import com.expenseiq.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class DashboardService {

    private final TransactionRepository transactionRepository;

    public DashboardService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public DashboardSummaryResponse getSummary(Long userId) {
        LocalDate today = LocalDate.now();
        YearMonth currentYearMonth = YearMonth.from(today);
        LocalDate startOfMonth = currentYearMonth.atDay(1);
        LocalDate endOfMonth = currentYearMonth.atEndOfMonth();

        BigDecimal totalIncome = transactionRepository.sumAmountByUserIdAndType(userId, TransactionType.INCOME);
        BigDecimal totalExpenses = transactionRepository.sumAmountByUserIdAndType(userId, TransactionType.EXPENSE);

        if (totalIncome == null) totalIncome = BigDecimal.ZERO;
        if (totalExpenses == null) totalExpenses = BigDecimal.ZERO;

        BigDecimal currentBalance = totalIncome.subtract(totalExpenses);

        BigDecimal currentMonthExpenses = transactionRepository.sumAmountByUserIdAndTypeAndDateRange(
                userId, TransactionType.EXPENSE, startOfMonth, endOfMonth);
        if (currentMonthExpenses == null) currentMonthExpenses = BigDecimal.ZERO;

        // Average daily expense for elapsed days in current month
        int daysElapsed = today.getDayOfMonth();
        BigDecimal averageDailyExpense = BigDecimal.ZERO;
        if (daysElapsed > 0 && currentMonthExpenses.compareTo(BigDecimal.ZERO) > 0) {
            averageDailyExpense = currentMonthExpenses.divide(BigDecimal.valueOf(daysElapsed), 2, RoundingMode.HALF_UP);
        }

        // Highest spending category in current month
        List<Object[]> categoryBreakdown = transactionRepository.findCategorySpendingByDateRange(
                userId, TransactionType.EXPENSE, startOfMonth, endOfMonth);

        String highestCategory = "None";
        if (!categoryBreakdown.isEmpty()) {
            Object[] topRow = categoryBreakdown.get(0);
            highestCategory = (String) topRow[1];
        }

        return new DashboardSummaryResponse(
                totalIncome,
                totalExpenses,
                currentBalance,
                currentMonthExpenses,
                highestCategory,
                averageDailyExpense
        );
    }

    public List<MonthlyTrendResponse> getMonthlyTrend(Long userId, int monthsCount) {
        if (monthsCount <= 0 || monthsCount > 24) {
            monthsCount = 6;
        }

        List<MonthlyTrendResponse> trend = new ArrayList<>();
        YearMonth current = YearMonth.now();
        DateTimeFormatter displayFormatter = DateTimeFormatter.ofPattern("MMM yyyy");

        // Iterate chronologically for the last N months
        for (int i = monthsCount - 1; i >= 0; i--) {
            YearMonth targetYm = current.minusMonths(i);
            LocalDate start = targetYm.atDay(1);
            LocalDate end = targetYm.atEndOfMonth();

            BigDecimal inc = transactionRepository.sumAmountByUserIdAndTypeAndDateRange(
                    userId, TransactionType.INCOME, start, end);
            BigDecimal exp = transactionRepository.sumAmountByUserIdAndTypeAndDateRange(
                    userId, TransactionType.EXPENSE, start, end);

            trend.add(new MonthlyTrendResponse(
                    targetYm.format(displayFormatter),
                    inc != null ? inc : BigDecimal.ZERO,
                    exp != null ? exp : BigDecimal.ZERO
            ));
        }

        return trend;
    }

    public List<CategorySpendingResponse> getCategorySpending(Long userId, Integer month, Integer year) {
        LocalDate today = LocalDate.now();
        int targetMonth = (month != null) ? month : today.getMonthValue();
        int targetYear = (year != null) ? year : today.getYear();

        YearMonth ym = YearMonth.of(targetYear, targetMonth);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<Object[]> rawData = transactionRepository.findCategorySpendingByDateRange(
                userId, TransactionType.EXPENSE, start, end);

        BigDecimal totalMonthExpenses = transactionRepository.sumAmountByUserIdAndTypeAndDateRange(
                userId, TransactionType.EXPENSE, start, end);

        List<CategorySpendingResponse> result = new ArrayList<>();
        if (totalMonthExpenses == null || totalMonthExpenses.compareTo(BigDecimal.ZERO) == 0) {
            return result;
        }

        for (Object[] row : rawData) {
            Long catId = ((Number) row[0]).longValue();
            String catName = (String) row[1];
            BigDecimal amount = (BigDecimal) row[2];

            double percentage = amount.divide(totalMonthExpenses, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();

            result.add(new CategorySpendingResponse(
                    catId,
                    catName,
                    amount,
                    Math.round(percentage * 10.0) / 10.0
            ));
        }

        return result;
    }
}
