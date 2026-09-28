# ExpenseIQ Full QA Automation Test Suite
$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080/api"
$testResults = @()

function Assert-Test {
    param(
        [string]$Name,
        [bool]$Condition,
        [string]$Details = ""
    )
    if ($Condition) {
        Write-Host " [PASS] $Name" -ForegroundColor Green
        $script:testResults += [PSCustomObject]@{ Test = $Name; Status = "PASS"; Details = $Details }
    } else {
        Write-Host " [FAIL] $Name - $Details" -ForegroundColor Red
        $script:testResults += [PSCustomObject]@{ Test = $Name; Status = "FAIL"; Details = $Details }
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " STARTING EXPENSEIQ QA AUTOMATION TEST SUITE" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# ----------------------------------------------------------------------
# 1. DATABASE CONNECTIVITY & PERSISTENCE
# ----------------------------------------------------------------------
Write-Host "`n--- 1. DATABASE VERIFICATION ---" -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "Postgres123"
    $dbCheck = psql -U postgres -d expenseiq -t -A -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('users', 'categories', 'transactions', 'budgets');"
    Assert-Test -Name "PostgreSQL Connection & Schema Tables" -Condition ($dbCheck.Trim() -eq "4") -Details "Found $dbCheck of 4 expected tables"
} catch {
    Assert-Test -Name "PostgreSQL Connection & Schema Tables" -Condition $false -Details $_.Exception.Message
}

# ----------------------------------------------------------------------
# 2. AUTHENTICATION & VALIDATION
# ----------------------------------------------------------------------
Write-Host "`n--- 2. AUTHENTICATION & VALIDATION TESTS ---" -ForegroundColor Yellow

$uniqueSuffix = [System.DateTime]::UtcNow.Ticks
$email1 = "qa_user_${uniqueSuffix}@example.com"
$email2 = "qa_user2_${uniqueSuffix}@example.com"
$pwd = "SecurePass123!"

# Test 2.1: Register Valid User 1
try {
    $regBody = @{ name = "QA Engineer One"; email = $email1; password = $pwd } | ConvertTo-Json
    $regRes1 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -ContentType "application/json" -Body $regBody
    $token1 = $regRes1.token
    $user1Id = $regRes1.user.id
    Assert-Test -Name "User Registration (Valid)" -Condition ($token1 -ne $null -and $user1Id -gt 0) -Details "User ID: $user1Id"
} catch {
    Assert-Test -Name "User Registration (Valid)" -Condition $false -Details $_.Exception.Message
}

# Test 2.2: Duplicate Email Registration
try {
    $dupBody = @{ name = "Duplicate"; email = $email1; password = $pwd } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -ContentType "application/json" -Body $dupBody
    Assert-Test -Name "Duplicate Email Rejection" -Condition $false -Details "Expected 400 Bad Request, but succeeded"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test -Name "Duplicate Email Rejection" -Condition ($statusCode -eq 400) -Details "Returned HTTP $statusCode"
}

# Test 2.3: Password Validation (< 6 chars)
try {
    $shortPwdBody = @{ name = "Short Pwd"; email = "short_${uniqueSuffix}@example.com"; password = "123" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -ContentType "application/json" -Body $shortPwdBody
    Assert-Test -Name "Short Password Rejection (< 6 chars)" -Condition $false -Details "Expected 400 Bad Request"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test -Name "Short Password Rejection (< 6 chars)" -Condition ($statusCode -eq 400) -Details "Returned HTTP $statusCode"
}

# Test 2.4: Invalid Password Login
try {
    $badLoginBody = @{ email = $email1; password = "WrongPassword999" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $badLoginBody
    Assert-Test -Name "Invalid Password Login Rejection" -Condition $false -Details "Expected 401 Unauthorized"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test -Name "Invalid Password Login Rejection" -Condition ($statusCode -eq 401) -Details "Returned HTTP $statusCode"
}

# Test 2.5: Successful Login
try {
    $goodLoginBody = @{ email = $email1; password = $pwd } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $goodLoginBody
    Assert-Test -Name "Valid User Login" -Condition ($loginRes.token -ne $null) -Details "Received valid JWT token"
} catch {
    Assert-Test -Name "Valid User Login" -Condition $false -Details $_.Exception.Message
}

# Test 2.6: Get Current User Profile (/api/auth/me)
$headers1 = @{ Authorization = "Bearer $token1" }
try {
    $meRes = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Headers $headers1 -Method Get
    Assert-Test -Name "Get Current User Profile" -Condition ($meRes.email -eq $email1) -Details "Authenticated as $($meRes.name)"
} catch {
    Assert-Test -Name "Get Current User Profile" -Condition $false -Details $_.Exception.Message
}

# ----------------------------------------------------------------------
# 3. DEFAULT & CUSTOM CATEGORIES
# ----------------------------------------------------------------------
Write-Host "`n--- 3. CATEGORY MANAGEMENT TESTS ---" -ForegroundColor Yellow

# Test 3.1: Verify 14 Default Categories Seeded
try {
    $cats = Invoke-RestMethod -Uri "$baseUrl/categories" -Headers $headers1 -Method Get
    Assert-Test -Name "Default Categories Seeded (14 count)" -Condition ($cats.Count -eq 14) -Details "Found $($cats.Count) categories"
} catch {
    Assert-Test -Name "Default Categories Seeded (14 count)" -Condition $false -Details $_.Exception.Message
}

# Test 3.2: Create Custom Category
try {
    $customCatBody = @{ name = "Gym & Fitness"; type = "EXPENSE" } | ConvertTo-Json
    $newCat = Invoke-RestMethod -Uri "$baseUrl/categories" -Headers $headers1 -Method Post -ContentType "application/json" -Body $customCatBody
    $gymCatId = $newCat.id
    Assert-Test -Name "Create Custom Category" -Condition ($newCat.name -eq "Gym & Fitness" -and $newCat.id -gt 0) -Details "Created Category ID: $gymCatId"
} catch {
    Assert-Test -Name "Create Custom Category" -Condition $false -Details $_.Exception.Message
}

# Test 3.3: Reject Duplicate Category
try {
    $dupCatBody = @{ name = "Gym & Fitness"; type = "EXPENSE" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/categories" -Headers $headers1 -Method Post -ContentType "application/json" -Body $dupCatBody
    Assert-Test -Name "Reject Duplicate Category Name" -Condition $false -Details "Expected 400 Bad Request"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test -Name "Reject Duplicate Category Name" -Condition ($statusCode -eq 400) -Details "Returned HTTP $statusCode"
}

# ----------------------------------------------------------------------
# 4. TRANSACTIONS MANAGEMENT & VALIDATIONS
# ----------------------------------------------------------------------
Write-Host "`n--- 4. TRANSACTION CRUD & VALIDATION TESTS ---" -ForegroundColor Yellow

$salaryCat = ($cats | Where-Object { $_.name -eq "Salary" -and $_.type -eq "INCOME" }).id
$foodCat = ($cats | Where-Object { $_.name -eq "Food" -and $_.type -eq "EXPENSE" }).id
$transportCat = ($cats | Where-Object { $_.name -eq "Transport" -and $_.type -eq "EXPENSE" }).id

# Test 4.1: Create Valid Income Transaction
try {
    $incBody = @{
        type = "INCOME";
        amount = 80000.00;
        categoryId = $salaryCat;
        description = "Principal Architect Monthly Salary";
        paymentMethod = "BANK_TRANSFER";
        transactionDate = "2026-09-01"
    } | ConvertTo-Json
    $incTx = Invoke-RestMethod -Uri "$baseUrl/transactions" -Headers $headers1 -Method Post -ContentType "application/json" -Body $incBody
    $incTxId = $incTx.id
    Assert-Test -Name "Create Income Transaction" -Condition ($incTx.amount -eq 80000.00 -and $incTxId -gt 0) -Details "Tx ID: $incTxId"
} catch {
    Assert-Test -Name "Create Income Transaction" -Condition $false -Details $_.Exception.Message
}

# Test 4.2: Create Valid Expense Transaction
try {
    $expBody = @{
        type = "EXPENSE";
        amount = 4500.00;
        categoryId = $foodCat;
        description = "Organic Groceries and Dining";
        paymentMethod = "CARD";
        transactionDate = "2026-09-05"
    } | ConvertTo-Json
    $expTx = Invoke-RestMethod -Uri "$baseUrl/transactions" -Headers $headers1 -Method Post -ContentType "application/json" -Body $expBody
    $expTxId = $expTx.id
    Assert-Test -Name "Create Expense Transaction" -Condition ($expTx.amount -eq 4500.00 -and $expTxId -gt 0) -Details "Tx ID: $expTxId"
} catch {
    Assert-Test -Name "Create Expense Transaction" -Condition $false -Details $_.Exception.Message
}

# Test 4.3: Reject Negative Amount
try {
    $negBody = @{
        type = "EXPENSE";
        amount = -500.00;
        categoryId = $foodCat;
        description = "Invalid negative amount";
        paymentMethod = "CASH";
        transactionDate = "2026-09-06"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/transactions" -Headers $headers1 -Method Post -ContentType "application/json" -Body $negBody
    Assert-Test -Name "Reject Negative Amount Transaction" -Condition $false -Details "Expected 400 Bad Request"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test -Name "Reject Negative Amount Transaction" -Condition ($statusCode -eq 400) -Details "Returned HTTP $statusCode"
}

# Test 4.4: Reject Mismatched Type (Expense tx with Income category)
try {
    $mismatchBody = @{
        type = "EXPENSE";
        amount = 1000.00;
        categoryId = $salaryCat; # Salary is INCOME
        description = "Invalid mismatch";
        paymentMethod = "CASH";
        transactionDate = "2026-09-06"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/transactions" -Headers $headers1 -Method Post -ContentType "application/json" -Body $mismatchBody
    Assert-Test -Name "Reject Mismatched Category Type" -Condition $false -Details "Expected 400 Bad Request"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test -Name "Reject Mismatched Category Type" -Condition ($statusCode -eq 400) -Details "Returned HTTP $statusCode"
}

# Test 4.5: Update Transaction
try {
    $updateBody = @{
        type = "EXPENSE";
        amount = 4800.00;
        categoryId = $foodCat;
        description = "Updated Groceries Total";
        paymentMethod = "CARD";
        transactionDate = "2026-09-05"
    } | ConvertTo-Json
    $updatedTx = Invoke-RestMethod -Uri "$baseUrl/transactions/$expTxId" -Headers $headers1 -Method Put -ContentType "application/json" -Body $updateBody
    Assert-Test -Name "Update Transaction Amount & Description" -Condition ($updatedTx.amount -eq 4800.00) -Details "Updated to ₹4,800.00"
} catch {
    Assert-Test -Name "Update Transaction Amount & Description" -Condition $false -Details $_.Exception.Message
}

# Test 4.6: Search and Filter Transactions
try {
    $filterRes = Invoke-RestMethod -Uri "$baseUrl/transactions?type=EXPENSE&search=Groceries" -Headers $headers1 -Method Get
    Assert-Test -Name "Filter & Search Transactions" -Condition ($filterRes.Count -ge 1 -and $filterRes[0].categoryName -eq "Food") -Details "Found $($filterRes.Count) matching transactions"
} catch {
    Assert-Test -Name "Filter & Search Transactions" -Condition $false -Details $_.Exception.Message
}

# ----------------------------------------------------------------------
# 5. BUDGETS & CALCULATION LOGIC
# ----------------------------------------------------------------------
Write-Host "`n--- 5. BUDGET MANAGEMENT & SPENDING MATH TESTS ---" -ForegroundColor Yellow

# Test 5.1: Create Budget for Food (₹6,000 for Sep 2026)
try {
    $bBody1 = @{ categoryId = $foodCat; amount = 6000.00; month = 9; year = 2026 } | ConvertTo-Json
    $bRes1 = Invoke-RestMethod -Uri "$baseUrl/budgets" -Headers $headers1 -Method Post -ContentType "application/json" -Body $bBody1
    # Spent is ₹4,800.00, remaining should be ₹1,200.00, percentageUsed = 80.0%, exceeded = false
    $correctRemaining = ($bRes1.remaining -eq 1200.00)
    $correctExceeded = ($bRes1.exceeded -eq $false)
    Assert-Test -Name "Budget Creation & On-Track Calculation" -Condition ($correctRemaining -and $correctExceeded) -Details "Budget: ₹$($bRes1.amount), Spent: ₹$($bRes1.spent), Remaining: ₹$($bRes1.remaining), Exceeded: $($bRes1.exceeded)"
} catch {
    Assert-Test -Name "Budget Creation & On-Track Calculation" -Condition $false -Details $_.Exception.Message
}

# Test 5.2: Create Budget for Transport (₹1,000) & Add Expense of ₹1,500 (Exceeded)
try {
    $bBody2 = @{ categoryId = $transportCat; amount = 1000.00; month = 9; year = 2026 } | ConvertTo-Json
    $bRes2 = Invoke-RestMethod -Uri "$baseUrl/budgets" -Headers $headers1 -Method Post -ContentType "application/json" -Body $bBody2

    # Add Transport expense of ₹1,500
    $txTrans = Invoke-RestMethod -Uri "$baseUrl/transactions" -Headers $headers1 -Method Post -ContentType "application/json" -Body (@{
        type = "EXPENSE"; amount = 1500.00; categoryId = $transportCat; description = "High speed rail"; paymentMethod = "UPI"; transactionDate = "2026-09-08"
    } | ConvertTo-Json)

    # Re-fetch budgets
    $budgetsList = Invoke-RestMethod -Uri "$baseUrl/budgets?month=9&year=2026" -Headers $headers1 -Method Get
    $transBudget = $budgetsList | Where-Object { $_.categoryId -eq $transportCat }

    $isExceeded = ($transBudget.exceeded -eq $true)
    $isNegativeRemaining = ($transBudget.remaining -lt 0)
    Assert-Test -Name "Budget Exceeded Flag & Negative Remaining Calculation" -Condition ($isExceeded -and $isNegativeRemaining) -Details "Budget: ₹$($transBudget.amount), Spent: ₹$($transBudget.spent), Remaining: ₹$($transBudget.remaining), Exceeded: $($transBudget.exceeded)"
} catch {
    Assert-Test -Name "Budget Exceeded Flag & Negative Remaining Calculation" -Condition $false -Details $_.Exception.Message
}

# Test 5.3: Reject Budget for INCOME Category
try {
    $badBudgetBody = @{ categoryId = $salaryCat; amount = 10000.00; month = 9; year = 2026 } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/budgets" -Headers $headers1 -Method Post -ContentType "application/json" -Body $badBudgetBody
    Assert-Test -Name "Reject Budget for INCOME Category" -Condition $false -Details "Expected 400 Bad Request"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test -Name "Reject Budget for INCOME Category" -Condition ($statusCode -eq 400) -Details "Returned HTTP $statusCode"
}

# ----------------------------------------------------------------------
# 6. DASHBOARD & REPORTING AUDIT
# ----------------------------------------------------------------------
Write-Host "`n--- 6. DASHBOARD & FINANCIAL REPORTING TESTS ---" -ForegroundColor Yellow

# Test 6.1: Dashboard Summary Math
try {
    $dashSummary = Invoke-RestMethod -Uri "$baseUrl/dashboard/summary" -Headers $headers1 -Method Get
    # Total Income: 80,000. Total Expenses: 4,800 + 1,500 = 6,300. Balance: 80,000 - 6,300 = 73,700
    $expectedBal = $dashSummary.totalIncome - $dashSummary.totalExpenses
    $mathMatches = ($dashSummary.currentBalance -eq $expectedBal)
    Assert-Test -Name "Dashboard Balance Formula (Income - Expenses)" -Condition $mathMatches -Details "Income: ₹$($dashSummary.totalIncome), Expenses: ₹$($dashSummary.totalExpenses), Balance: ₹$($dashSummary.currentBalance)"
} catch {
    Assert-Test -Name "Dashboard Balance Formula (Income - Expenses)" -Condition $false -Details $_.Exception.Message
}

# Test 6.2: Category Breakdown Endpoint
try {
    $catBreakdown = Invoke-RestMethod -Uri "$baseUrl/dashboard/categories?month=9&year=2026" -Headers $headers1 -Method Get
    $hasCategories = ($catBreakdown.Count -gt 0)
    $pctSum = ($catBreakdown | Measure-Object -Property percentage -Sum).Sum
    $pctApprox100 = ($pctSum -ge 99.0 -and $pctSum -le 101.0)
    Assert-Test -Name "Category Spending Breakdown Percentages" -Condition ($hasCategories -and $pctApprox100) -Details "Percentages sum to $pctSum%"
} catch {
    Assert-Test -Name "Category Spending Breakdown Percentages" -Condition $false -Details $_.Exception.Message
}

# Test 6.3: CSV Export
try {
    $csvData = (Invoke-WebRequest -Uri "$baseUrl/reports/export/csv?month=9&year=2026" -Headers $headers1 -UseBasicParsing).Content
    $hasHeader = $csvData -match "Transaction ID,Date,Type,Category,Amount,Payment Method,Description"
    $hasEntries = ($csvData -match "Groceries") -or ($csvData -match "Salary") -or ($csvData -match "rail")
    Assert-Test -Name "CSV Export Endpoint" -Condition ($hasHeader -and $hasEntries) -Details "Export contains valid CSV headers and records ($($csvData.Length) bytes)"
} catch {
    Assert-Test -Name "CSV Export Endpoint" -Condition $false -Details $_.Exception.Message
}

# ----------------------------------------------------------------------
# 7. MULTI-TENANT USER DATA ISOLATION & SECURITY
# ----------------------------------------------------------------------
Write-Host "`n--- 7. SECURITY & MULTI-TENANT DATA ISOLATION TESTS ---" -ForegroundColor Yellow

# Register User 2
$regRes2 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -ContentType "application/json" -Body (@{
    name = "QA Engineer Two"; email = $email2; password = $pwd
} | ConvertTo-Json)
$token2 = $regRes2.token
$headers2 = @{ Authorization = "Bearer $token2" }

# Test 7.1: User 2 cannot access User 1's transaction
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/transactions/$incTxId" -Headers $headers2 -Method Get
    Assert-Test -Name "Data Isolation: Cross-User Transaction Access" -Condition $false -Details "User 2 was able to access User 1's transaction"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test -Name "Data Isolation: Cross-User Transaction Access" -Condition ($statusCode -eq 404) -Details "Returned HTTP $statusCode (Resource Not Found / Hidden)"
}

# Test 7.2: User 2 cannot update User 1's transaction
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/transactions/$incTxId" -Headers $headers2 -Method Put -ContentType "application/json" -Body (@{
        type = "INCOME"; amount = 1.00; categoryId = $salaryCat; paymentMethod = "CASH"; transactionDate = "2026-09-01"
    } | ConvertTo-Json)
    Assert-Test -Name "Data Isolation: Cross-User Transaction Mutation" -Condition $false -Details "User 2 modified User 1's transaction"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test -Name "Data Isolation: Cross-User Transaction Mutation" -Condition ($statusCode -eq 404) -Details "Returned HTTP $statusCode"
}

# Test 7.3: User 2 cannot delete User 1's transaction
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/transactions/$incTxId" -Headers $headers2 -Method Delete
    Assert-Test -Name "Data Isolation: Cross-User Transaction Deletion" -Condition $false -Details "User 2 deleted User 1's transaction"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test -Name "Data Isolation: Cross-User Transaction Deletion" -Condition ($statusCode -eq 404) -Details "Returned HTTP $statusCode"
}

# Test 7.4: User 2's dashboard is completely isolated (starts at ₹0.00)
try {
    $dash2 = Invoke-RestMethod -Uri "$baseUrl/dashboard/summary" -Headers $headers2 -Method Get
    $isIsolated = ($dash2.currentBalance -eq 0 -and $dash2.totalIncome -eq 0 -and $dash2.totalExpenses -eq 0)
    Assert-Test -Name "Data Isolation: Fresh User Dashboard Balance" -Condition $isIsolated -Details "Balance: ₹$($dash2.currentBalance)"
} catch {
    Assert-Test -Name "Data Isolation: Fresh User Dashboard Balance" -Condition $false -Details $_.Exception.Message
}

# Test 7.5: Unauthenticated access blocked
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/transactions" -Method Get
    Assert-Test -Name "Security: Unauthenticated API Access Blocked" -Condition $false -Details "Expected 401 Unauthorized"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Assert-Test -Name "Security: Unauthenticated API Access Blocked" -Condition ($statusCode -eq 401) -Details "Returned HTTP $statusCode"
}

# ----------------------------------------------------------------------
# 8. FRONTEND SERVER & PROXY INTEGRATION
# ----------------------------------------------------------------------
Write-Host "`n--- 8. FRONTEND SERVER & PROXY VERIFICATION ---" -ForegroundColor Yellow
try {
    $feRes = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing
    Assert-Test -Name "Frontend Vite Server HTTP 200" -Condition ($feRes.StatusCode -eq 200) -Details "Vite is serving the application on port 5173"
} catch {
    Assert-Test -Name "Frontend Vite Server HTTP 200" -Condition $false -Details $_.Exception.Message
}

# Summary
Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " QA TEST SUITE SUMMARY" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $testResults.Count

Write-Host " Total Tests Executed: $total"
Write-Host " Passed: $passed" -ForegroundColor Green
Write-Host " Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })

if ($failed -gt 0) {
    Write-Host "`nFAILED TESTS DETAILS:" -ForegroundColor Red
    $testResults | Where-Object { $_.Status -eq "FAIL" } | Format-Table -AutoSize
    exit 1
} else {
    Write-Host "`nAll QA Tests Passed with 100% Success Rate!" -ForegroundColor Green
    exit 0
}
