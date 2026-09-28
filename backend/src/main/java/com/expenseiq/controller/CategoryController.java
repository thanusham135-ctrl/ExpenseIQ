package com.expenseiq.controller;

import com.expenseiq.dto.CategoryRequest;
import com.expenseiq.dto.CategoryResponse;
import com.expenseiq.entity.CategoryType;
import com.expenseiq.security.UserPrincipal;
import com.expenseiq.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getCategories(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) CategoryType type) {
        List<CategoryResponse> categories = categoryService.getCategories(userPrincipal.getId(), type);
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        CategoryResponse category = categoryService.getCategoryById(id, userPrincipal.getId());
        return ResponseEntity.ok(category);
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        CategoryResponse created = categoryService.createCategory(request, userPrincipal.getId());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        CategoryResponse updated = categoryService.updateCategory(id, request, userPrincipal.getId());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        categoryService.deleteCategory(id, userPrincipal.getId());
        return ResponseEntity.noContent().build();
    }
}
