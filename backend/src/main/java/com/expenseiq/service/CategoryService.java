package com.expenseiq.service;

import com.expenseiq.dto.CategoryRequest;
import com.expenseiq.dto.CategoryResponse;
import com.expenseiq.entity.Category;
import com.expenseiq.entity.CategoryType;
import com.expenseiq.entity.User;
import com.expenseiq.exception.BadRequestException;
import com.expenseiq.exception.ResourceNotFoundException;
import com.expenseiq.repository.BudgetRepository;
import com.expenseiq.repository.CategoryRepository;
import com.expenseiq.repository.TransactionRepository;
import com.expenseiq.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;

    public CategoryService(CategoryRepository categoryRepository,
                           UserRepository userRepository,
                           TransactionRepository transactionRepository,
                           BudgetRepository budgetRepository) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
    }

    public List<CategoryResponse> getCategories(Long userId, CategoryType type) {
        List<Category> categories;
        if (type != null) {
            categories = categoryRepository.findByUserIdAndTypeOrderByNameAsc(userId, type);
        } else {
            categories = categoryRepository.findByUserIdOrderByNameAsc(userId);
        }
        return categories.stream().map(CategoryResponse::fromEntity).collect(Collectors.toList());
    }

    public CategoryResponse getCategoryById(Long id, Long userId) {
        Category category = categoryRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return CategoryResponse.fromEntity(category);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request, Long userId) {
        String trimmedName = request.getName().trim();

        if (categoryRepository.existsByUserIdAndNameIgnoreCaseAndType(userId, trimmedName, request.getType())) {
            throw new BadRequestException("A category with this name and type already exists.");
        }

        User user = userRepository.getReferenceById(userId);
        Category category = new Category(trimmedName, request.getType(), user);
        Category saved = categoryRepository.save(category);
        return CategoryResponse.fromEntity(saved);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request, Long userId) {
        Category category = categoryRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        String trimmedName = request.getName().trim();

        if (categoryRepository.existsByUserIdAndNameIgnoreCaseAndTypeAndIdNot(userId, trimmedName, request.getType(), id)) {
            throw new BadRequestException("Another category with this name and type already exists.");
        }

        category.setName(trimmedName);
        category.setType(request.getType());
        Category updated = categoryRepository.save(category);
        return CategoryResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteCategory(Long id, Long userId) {
        Category category = categoryRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        if (transactionRepository.existsByCategoryId(id)) {
            throw new BadRequestException("Cannot delete this category because transactions are associated with it.");
        }

        if (budgetRepository.existsByCategoryId(id)) {
            throw new BadRequestException("Cannot delete this category because active budgets are configured for it.");
        }

        categoryRepository.delete(category);
    }
}
