package com.expenseiq.dto;

import java.math.BigDecimal;

public class MonthlyTrendResponse {

    private String period; // e.g. "2026-09" or "Sep 2026"
    private BigDecimal income;
    private BigDecimal expense;

    public MonthlyTrendResponse() {
        this.income = BigDecimal.ZERO;
        this.expense = BigDecimal.ZERO;
    }

    public MonthlyTrendResponse(String period, BigDecimal income, BigDecimal expense) {
        this.period = period;
        this.income = income;
        this.expense = expense;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public BigDecimal getIncome() {
        return income;
    }

    public void setIncome(BigDecimal income) {
        this.income = income;
    }

    public BigDecimal getExpense() {
        return expense;
    }

    public void setExpense(BigDecimal expense) {
        this.expense = expense;
    }
}
