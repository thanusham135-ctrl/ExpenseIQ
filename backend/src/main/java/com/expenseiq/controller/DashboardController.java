package com.expenseiq.controller;

import com.expenseiq.dto.CategorySpendingResponse;
import com.expenseiq.dto.DashboardSummaryResponse;
import com.expenseiq.dto.MonthlyTrendResponse;
import com.expenseiq.security.UserPrincipal;
import com.expenseiq.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        DashboardSummaryResponse summary = dashboardService.getSummary(userPrincipal.getId());
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/monthly")
    public ResponseEntity<List<MonthlyTrendResponse>> getMonthlyTrend(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "6") int monthsCount) {
        List<MonthlyTrendResponse> trend = dashboardService.getMonthlyTrend(userPrincipal.getId(), monthsCount);
        return ResponseEntity.ok(trend);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategorySpendingResponse>> getCategorySpending(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        List<CategorySpendingResponse> spending = dashboardService.getCategorySpending(
                userPrincipal.getId(), month, year);
        return ResponseEntity.ok(spending);
    }
}
