package com.expenseiq.dto;

import java.math.BigDecimal;

public class CategorySpendingResponse {

    private Long categoryId;
    private String categoryName;
    private BigDecimal amount;
    private double percentage;

    public CategorySpendingResponse() {
        this.amount = BigDecimal.ZERO;
    }

    public CategorySpendingResponse(Long categoryId, String categoryName, BigDecimal amount, double percentage) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.amount = amount;
        this.percentage = percentage;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public double getPercentage() {
        return percentage;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }
}
