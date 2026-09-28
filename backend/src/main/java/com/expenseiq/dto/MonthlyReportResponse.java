package com.expenseiq.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class MonthlyReportResponse {

    private int month;
    private int year;
    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;
    private BigDecimal savings;
    private String highestSpendingCategory;
    private BigDecimal averageDailyExpense;
    private List<CategorySpendingResponse> categorySpendings = new ArrayList<>();
    private int transactionsCount;

    public MonthlyReportResponse() {
        this.totalIncome = BigDecimal.ZERO;
        this.totalExpenses = BigDecimal.ZERO;
        this.savings = BigDecimal.ZERO;
        this.highestSpendingCategory = "N/A";
        this.averageDailyExpense = BigDecimal.ZERO;
    }

    public int getMonth() {
        return month;
    }

    public void setMonth(int month) {
        this.month = month;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
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

    public BigDecimal getSavings() {
        return savings;
    }

    public void setSavings(BigDecimal savings) {
        this.savings = savings;
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

    public List<CategorySpendingResponse> getCategorySpendings() {
        return categorySpendings;
    }

    public void setCategorySpendings(List<CategorySpendingResponse> categorySpendings) {
        this.categorySpendings = categorySpendings;
    }

    public int getTransactionsCount() {
        return transactionsCount;
    }

    public void setTransactionsCount(int transactionsCount) {
        this.transactionsCount = transactionsCount;
    }
}
