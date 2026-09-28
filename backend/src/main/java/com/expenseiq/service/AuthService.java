package com.expenseiq.service;

import com.expenseiq.dto.AuthResponse;
import com.expenseiq.dto.LoginRequest;
import com.expenseiq.dto.RegisterRequest;
import com.expenseiq.dto.UserDto;
import com.expenseiq.entity.Category;
import com.expenseiq.entity.CategoryType;
import com.expenseiq.entity.User;
import com.expenseiq.exception.BadRequestException;
import com.expenseiq.repository.CategoryRepository;
import com.expenseiq.repository.UserRepository;
import com.expenseiq.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository,
                       CategoryRepository categoryRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("An account with this email address already exists.");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);

        // Seed default categories
        seedDefaultCategories(savedUser);

        // Generate token
        String token = tokenProvider.generateTokenForUser(savedUser.getId(), savedUser.getEmail(), savedUser.getName());

        UserDto userDto = new UserDto(savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getCreatedAt());
        return new AuthResponse(token, userDto);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        UserDto userDto = new UserDto(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt());
        return new AuthResponse(token, userDto);
    }

    public UserDto getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));
        return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt());
    }

    private void seedDefaultCategories(User user) {
        List<String> expenseCategories = Arrays.asList(
                "Food", "Transport", "Shopping", "Bills",
                "Entertainment", "Healthcare", "Education", "Travel", "Other"
        );

        List<String> incomeCategories = Arrays.asList(
                "Salary", "Freelance", "Scholarship", "Business", "Other"
        );

        for (String name : expenseCategories) {
            categoryRepository.save(new Category(name, CategoryType.EXPENSE, user));
        }

        for (String name : incomeCategories) {
            categoryRepository.save(new Category(name, CategoryType.INCOME, user));
        }
    }
}
