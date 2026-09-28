package com.expenseiq.service;

import com.expenseiq.dto.TransactionRequest;
import com.expenseiq.dto.TransactionResponse;
import com.expenseiq.entity.Category;
import com.expenseiq.entity.CategoryType;
import com.expenseiq.entity.Transaction;
import com.expenseiq.entity.TransactionType;
import com.expenseiq.entity.User;
import com.expenseiq.exception.BadRequestException;
import com.expenseiq.exception.ResourceNotFoundException;
import com.expenseiq.repository.CategoryRepository;
import com.expenseiq.repository.TransactionRepository;
import com.expenseiq.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public TransactionService(TransactionRepository transactionRepository,
                              CategoryRepository categoryRepository,
                              UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    public List<TransactionResponse> getTransactions(Long userId,
                                                     TransactionType type,
                                                     Long categoryId,
                                                     LocalDate startDate,
                                                     LocalDate endDate,
                                                     String keyword) {
        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("user").get("id"), userId));

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("transactionDate"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("transactionDate"), endDate));
            }

            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                Predicate catMatch = cb.like(cb.lower(root.get("category").get("name")), pattern);
                predicates.add(cb.or(descMatch, catMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort = Sort.by(Sort.Direction.DESC, "transactionDate", "id");
        List<Transaction> transactions = transactionRepository.findAll(spec, sort);

        return transactions.stream().map(TransactionResponse::fromEntity).collect(Collectors.toList());
    }

    public TransactionResponse getTransactionById(Long id, Long userId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
        return TransactionResponse.fromEntity(transaction);
    }

    @Transactional
    public TransactionResponse createTransaction(TransactionRequest request, Long userId) {
        Category category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
                .orElseThrow(() -> new BadRequestException("Selected category does not exist or does not belong to user"));

        // Validate that category type matches transaction type
        CategoryType expectedCategoryType = request.getType() == TransactionType.INCOME ? CategoryType.INCOME : CategoryType.EXPENSE;
        if (category.getType() != expectedCategoryType) {
            throw new BadRequestException("Category type (" + category.getType() + ") does not match transaction type (" + request.getType() + ")");
        }

        User user = userRepository.getReferenceById(userId);

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setCategory(category);
        transaction.setType(request.getType());
        transaction.setAmount(request.getAmount());
        transaction.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        transaction.setPaymentMethod(request.getPaymentMethod());
        transaction.setTransactionDate(request.getTransactionDate());

        Transaction saved = transactionRepository.save(transaction);
        return TransactionResponse.fromEntity(saved);
    }

    @Transactional
    public TransactionResponse updateTransaction(Long id, TransactionRequest request, Long userId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));

        Category category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
                .orElseThrow(() -> new BadRequestException("Selected category does not exist or does not belong to user"));

        CategoryType expectedCategoryType = request.getType() == TransactionType.INCOME ? CategoryType.INCOME : CategoryType.EXPENSE;
        if (category.getType() != expectedCategoryType) {
            throw new BadRequestException("Category type (" + category.getType() + ") does not match transaction type (" + request.getType() + ")");
        }

        transaction.setCategory(category);
        transaction.setType(request.getType());
        transaction.setAmount(request.getAmount());
        transaction.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        transaction.setPaymentMethod(request.getPaymentMethod());
        transaction.setTransactionDate(request.getTransactionDate());

        Transaction updated = transactionRepository.save(transaction);
        return TransactionResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteTransaction(Long id, Long userId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
        transactionRepository.delete(transaction);
    }
}
