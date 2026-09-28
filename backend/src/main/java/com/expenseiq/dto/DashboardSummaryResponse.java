package com.expenseiq.dto;

import java.math.BigDecimal;

public class DashboardSummaryResponse {

    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;
    private BigDecimal currentBalance;
    private BigDecimal currentMonthExpenses;
    private String highestSpendingCategory;
    private BigDecimal averageDailyExpense;

    public DashboardSummaryResponse() {
        this.totalIncome = BigDecimal.ZERO;
        this.totalExpenses = BigDecimal.ZERO;
        this.currentBalance = BigDecimal.ZERO;
        this.currentMonthExpenses = BigDecimal.ZERO;
        this.highestSpendingCategory = "N/A";
        this.averageDailyExpense = BigDecimal.ZERO;
    }

    public DashboardSummaryResponse(BigDecimal totalIncome, BigDecimal totalExpenses,
                                    BigDecimal currentBalance, BigDecimal currentMonthExpenses,
                                    String highestSpendingCategory, BigDecimal averageDailyExpense) {
        this.totalIncome = totalIncome;
        this.totalExpenses = totalExpenses;
        this.currentBalance = currentBalance;
        this.currentMonthExpenses = currentMonthExpenses;
        this.highestSpendingCategory = highestSpendingCategory;
        this.averageDailyExpense = averageDailyExpense;
    }

    public BigDecimal getTotalIncome() {
        return totalIncome;
    }

    public void setTotalIncome(BigDecimal totalIncome) {
        this.totalIncome = totalIncome;
    }

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public void setTotalExpenses(BigDecimal totalExpenses) {
        this.totalExpenses = totalExpenses;
    }

    public BigDecimal getCurrentBalance() {
        return currentBalance;
    }

    public void setCurrentBalance(BigDecimal currentBalance) {
        this.currentBalance = currentBalance;
    }

    public BigDecimal getCurrentMonthExpenses() {
        return currentMonthExpenses;
    }

    public void setCurrentMonthExpenses(BigDecimal currentMonthExpenses) {
        this.currentMonthExpenses = currentMonthExpenses;
    }

    public String getHighestSpendingCategory() {
        return highestSpendingCategory;
    }

    public void setHighestSpendingCategory(String highestSpendingCategory) {
        this.highestSpendingCategory = highestSpendingCategory;
    }

    public BigDecimal getAverageDailyExpense() {
        return averageDailyExpense;
    }

    public void setAverageDailyExpense(BigDecimal averageDailyExpense) {
        this.averageDailyExpense = averageDailyExpense;
    }
}
