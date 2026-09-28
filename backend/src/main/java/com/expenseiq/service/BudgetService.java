package com.expenseiq.service;

import com.expenseiq.dto.BudgetRequest;
import com.expenseiq.dto.BudgetResponse;
import com.expenseiq.entity.Budget;
import com.expenseiq.entity.Category;
import com.expenseiq.entity.CategoryType;
import com.expenseiq.entity.TransactionType;
import com.expenseiq.entity.User;
import com.expenseiq.exception.BadRequestException;
import com.expenseiq.exception.ResourceNotFoundException;
import com.expenseiq.repository.BudgetRepository;
import com.expenseiq.repository.CategoryRepository;
import com.expenseiq.repository.TransactionRepository;
import com.expenseiq.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    public BudgetService(BudgetRepository budgetRepository,
                         CategoryRepository categoryRepository,
                         UserRepository userRepository,
                         TransactionRepository transactionRepository) {
        this.budgetRepository = budgetRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }

    public List<BudgetResponse> getBudgets(Long userId, Integer month, Integer year) {
        LocalDate now = LocalDate.now();
        int targetMonth = (month != null) ? month : now.getMonthValue();
        int targetYear = (year != null) ? year : now.getYear();

        List<Budget> budgets = budgetRepository.findByUserIdAndMonthAndYear(userId, targetMonth, targetYear);

        YearMonth ym = YearMonth.of(targetYear, targetMonth);
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();

        return budgets.stream().map(budget -> {
            BigDecimal spent = transactionRepository.sumAmountByUserIdAndCategoryAndDateRange(
                    userId, budget.getCategory().getId(), TransactionType.EXPENSE, startDate, endDate);

            if (spent == null) {
                spent = BigDecimal.ZERO;
            }

            BigDecimal remaining = budget.getAmount().subtract(spent);
            boolean isExceeded = spent.compareTo(budget.getAmount()) > 0;

            double percentageUsed = 0.0;
            if (budget.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                percentageUsed = spent.divide(budget.getAmount(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue();
            }

            return new BudgetResponse(
                    budget.getId(),
                    budget.getCategory().getId(),
                    budget.getCategory().getName(),
                    budget.getAmount(),
                    spent,
                    remaining,
                    Math.round(percentageUsed * 10.0) / 10.0,
                    isExceeded,
                    budget.getMonth(),
                    budget.getYear(),
                    budget.getCreatedAt()
            );
        }).collect(Collectors.toList());
    }

    public BudgetResponse getBudgetById(Long id, Long userId) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));

        YearMonth ym = YearMonth.of(budget.getYear(), budget.getMonth());
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();

        BigDecimal spent = transactionRepository.sumAmountByUserIdAndCategoryAndDateRange(
                userId, budget.getCategory().getId(), TransactionType.EXPENSE, startDate, endDate);
        if (spent == null) spent = BigDecimal.ZERO;

        BigDecimal remaining = budget.getAmount().subtract(spent);
        boolean isExceeded = spent.compareTo(budget.getAmount()) > 0;

        double percentageUsed = 0.0;
        if (budget.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            percentageUsed = spent.divide(budget.getAmount(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        return new BudgetResponse(
                budget.getId(),
                budget.getCategory().getId(),
                budget.getCategory().getName(),
                budget.getAmount(),
                spent,
                remaining,
                Math.round(percentageUsed * 10.0) / 10.0,
                isExceeded,
                budget.getMonth(),
                budget.getYear(),
                budget.getCreatedAt()
        );
    }

    @Transactional
    public BudgetResponse createBudget(BudgetRequest request, Long userId) {
        Category category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
                .orElseThrow(() -> new BadRequestException("Selected category not found"));

        if (category.getType() != CategoryType.EXPENSE) {
            throw new BadRequestException("Budgets can only be set for EXPENSE categories.");
        }

        Optional<Budget> existing = budgetRepository.findByUserIdAndCategoryIdAndMonthAndYear(
                userId, request.getCategoryId(), request.getMonth(), request.getYear());
        if (existing.isPresent()) {
            throw new BadRequestException("A budget for category '" + category.getName() + "' already exists for "
                    + request.getMonth() + "/" + request.getYear() + ". Please edit the existing budget.");
        }

        User user = userRepository.getReferenceById(userId);

        Budget budget = new Budget();
        budget.setUser(user);
        budget.setCategory(category);
        budget.setAmount(request.getAmount());
        budget.setMonth(request.getMonth());
        budget.setYear(request.getYear());

        Budget saved = budgetRepository.save(budget);
        return getBudgetById(saved.getId(), userId);
    }

    @Transactional
    public BudgetResponse updateBudget(Long id, BudgetRequest request, Long userId) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));

        Category category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
                .orElseThrow(() -> new BadRequestException("Selected category not found"));

        if (category.getType() != CategoryType.EXPENSE) {
            throw new BadRequestException("Budgets can only be set for EXPENSE categories.");
        }

        Optional<Budget> existing = budgetRepository.findByUserIdAndCategoryIdAndMonthAndYear(
                userId, request.getCategoryId(), request.getMonth(), request.getYear());
        if (existing.isPresent() && !existing.get().getId().equals(id)) {
            throw new BadRequestException("Another budget for this category and period already exists.");
        }

        budget.setCategory(category);
        budget.setAmount(request.getAmount());
        budget.setMonth(request.getMonth());
        budget.setYear(request.getYear());

        Budget updated = budgetRepository.save(budget);
        return getBudgetById(updated.getId(), userId);
    }

    @Transactional
    public void deleteBudget(Long id, Long userId) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));
        budgetRepository.delete(budget);
    }
}
