#!/bin/bash

format_test_output() {
    # Store the formatted output in a variable first
    local formatted_output=$(echo -e "$1" | 
        tr -d '()' | 
        sed 's/\\n/\n/g' | 
        sed 's/"//g' |
        sed 's/ succeeded\./ ✅ PASSED/g' |
        sed 's/\(.*\)failed with an unexpected trap\./\1❌ FAILED (TRAPPED)/g' |
        sed 's/ failed:.*/ ❌ FAILED/g' |
        grep -v "Failure!" |
        sed 's/^[[:space:]]*//')
    
    # Print results only once
    echo -e "\nTest Results:"
    echo "$formatted_output"
    
    # Count tests using the stored formatted_output
    local failed_tests=$(echo "$formatted_output" | grep -c "❌")
    local passed_tests=$(echo "$formatted_output" | grep -c "✅")
    local total_tests=$((failed_tests + passed_tests))
    
    echo -e "\nSummary: $passed_tests/$total_tests tests passed\n"
}

# Capture test output and format it
TEST_OUTPUT=$(dfx canister call test test)
format_test_output "$TEST_OUTPUT"