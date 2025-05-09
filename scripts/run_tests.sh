#!/bin/bash

# Create logs directory if it doesn't exist
LOGS_DIR="logs"
mkdir -p "$LOGS_DIR"

# Log files
MAIN_LOG_FILE="$LOGS_DIR/test-log.log"
TMP_LOG_FILE="$LOGS_DIR/full_raw_log.tmp"
COUNTS_FILE="$LOGS_DIR/test_counts.tmp"

# Define ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
UNDERLINE='\033[4m'
RESET='\033[0m'

echo -e "${BLUE}${BOLD}Running tests...${RESET}"
echo -e "${CYAN}(Console will show summary only, detailed failures in ${UNDERLINE}$LOGS_DIR${RESET}${CYAN} folder)${RESET}"
echo -e "${PURPLE}--------------------------------------------------${RESET}"

# Run vitest, capture all output to temporary file
npx vitest run --reporter=default > "$TMP_LOG_FILE" 2>&1
test_exit_code=$?

# --- Console Summary ---
echo "" 
echo -e "${YELLOW}${BOLD}╔══════════════════ Console Summary ══════════════════╗${RESET}"

# Extract and colorize summary counts
grep -E '^( *Test Files +| *Tests +| *Errors +)' "$TMP_LOG_FILE" | while read -r line; do
    formatted_line=$(echo "$line" | sed 's/^ *//')
    if [[ $formatted_line == *"failed"* ]]; then
        echo -e "${RED}$formatted_line${RESET}"
    else
        echo -e "${GREEN}$formatted_line${RESET}"
    fi
done

if [ $test_exit_code -ne 0 ]; then
    echo ""
    echo -e "${RED}${BOLD}❗ Failures detected. Failed tests by file:${RESET}"
    
    # Count failures per file and display them
    grep -E '^\s*×\s' "$TMP_LOG_FILE" | sed 's/^ *× *//' > "$COUNTS_FILE"
    
    # Use sort -u to ensure unique file names before counting
    awk -F'>' '{print $1}' "$COUNTS_FILE" | sort -u | while read -r file; do
        count=$(grep -c "^$file" <(awk -F'>' '{print $1}' "$COUNTS_FILE"))
        echo -e "${RED}[$count failures] $file${RESET}"
        
        # Create separate log file for each failing test file
        test_file_name=$(basename "$file" .test.ts)
        test_log_file="$LOGS_DIR/${test_file_name}_failures.log"
        
        echo "Failures for $file" > "$test_log_file"
        echo "===================" >> "$test_log_file"
        grep -A 5 "$file" "$TMP_LOG_FILE" >> "$test_log_file"
    done
    
    echo ""
    echo -e "${RED}${BOLD}Detailed failures:${RESET}"
    cat "$COUNTS_FILE" | while read -r line; do
        echo -e "${RED}✗ $line${RESET}"
    done
    
    echo -e "${YELLOW}   (Check ${UNDERLINE}$LOGS_DIR${RESET}${YELLOW} folder for detailed logs)${RESET}"
else
    echo ""
    echo -e "${GREEN}${BOLD}✅ All tests passed.${RESET}"
fi
echo -e "${YELLOW}${BOLD}╚═══════════════════════════════════════════════════╝${RESET}"

# --- Stylish Main Log File Creation ---
cat << EOF > "$MAIN_LOG_FILE"
╔═══════════════════════════════════════════════════════════════╗
║                  Vitest Detailed Failure Log                   ║
║                  ========================                      ║
║  Generated: $(date)                    ║
╚═══════════════════════════════════════════════════════════════╝

EOF

if [ $test_exit_code -ne 0 ]; then
    # Add failure counts to main log file
    echo "Test Failures by File:" >> "$MAIN_LOG_FILE"
    echo "=====================" >> "$MAIN_LOG_FILE"
    
    awk -F'>' '{print $1}' "$COUNTS_FILE" | sort -u | while read -r file; do
        count=$(grep -c "^$file" <(awk -F'>' '{print $1}' "$COUNTS_FILE"))
        echo "[$count failures] $file" >> "$MAIN_LOG_FILE"
    done
    echo "" >> "$MAIN_LOG_FILE"
    
    awk '
        /^ FAIL |^\s*×\s/ { 
            print "▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄"
            printing_block=1 
        }
        /^( {2}Test Files {2})/ { 
            printing_block=0
            print "▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀"
        }
        printing_block { print }
        /Unhandled Errors/ { printing_unhandled=1 }
        printing_unhandled { print }
    ' "$TMP_LOG_FILE" >> "$MAIN_LOG_FILE"

    if ! grep -q -E '(^ FAIL |^\s*×\s|Unhandled Errors)' "$MAIN_LOG_FILE"; then
        echo "⚠️  Could not automatically extract specific failure details." >> "$MAIN_LOG_FILE"
        echo "   Please check the full raw output in $TMP_LOG_FILE" >> "$MAIN_LOG_FILE"
    fi
else
    echo "✨ All tests passed successfully! ✨" >> "$MAIN_LOG_FILE"
fi

# --- Cleanup & Final Message ---

# Clean up temporary files
rm "$TMP_LOG_FILE"
rm "$COUNTS_FILE"

echo ""
echo -e "${CYAN}Formatted failure logs are in ${UNDERLINE}$LOGS_DIR${RESET}${CYAN} folder${RESET}"

exit $test_exit_code