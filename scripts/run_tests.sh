#!/bin/bash

# Log file for detailed *failure* output
LOG_FILE="test-log.log"
# Temporary file for full raw output 
TMP_LOG_FILE="full_raw_log.tmp"

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
echo -e "${CYAN}(Console will show summary only, detailed failures in ${UNDERLINE}$LOG_FILE${RESET}${CYAN})${RESET}"
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
    echo -e "${RED}${BOLD}❗ Failures detected. Failed tests:${RESET}"
    grep -E '^\s*×\s' "$TMP_LOG_FILE" | sed 's/^ *× *//' | while read -r line; do
        echo -e "${RED}✗ $line${RESET}"
    done
    echo -e "${YELLOW}   (Check ${UNDERLINE}$LOG_FILE${RESET}${YELLOW} for full details)${RESET}"
else
    echo ""
    echo -e "${GREEN}${BOLD}✅ All tests passed.${RESET}"
fi
echo -e "${YELLOW}${BOLD}╚═══════════════════════════════════════════════════╝${RESET}"

# --- Stylish Log File Creation ---
cat << EOF > "$LOG_FILE"
╔═══════════════════════════════════════════════════════════════╗
║                  Vitest Detailed Failure Log                   ║
║                  ========================                      ║
║  Generated: $(date)                    ║
╚═══════════════════════════════════════════════════════════════╝

EOF

if [ $test_exit_code -ne 0 ]; then
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
    ' "$TMP_LOG_FILE" >> "$LOG_FILE"

    if ! grep -q -E '(^ FAIL |^\s*×\s|Unhandled Errors)' "$LOG_FILE"; then
        echo "⚠️  Could not automatically extract specific failure details." >> "$LOG_FILE"
        echo "   Please check the full raw output in $TMP_LOG_FILE" >> "$LOG_FILE"
    fi
else
    echo "✨ All tests passed successfully! ✨" >> "$LOG_FILE"
fi

# --- Cleanup & Final Message ---

# Clean up temporary file
# Uncomment this line if you want to automatically delete the raw log
rm "$TMP_LOG_FILE"

echo ""
echo -e "${CYAN}Full raw output stored in ${UNDERLINE}$TMP_LOG_FILE${RESET}${CYAN} (Can be deleted manually)${RESET}"
echo -e "${CYAN}Formatted failure log is in ${UNDERLINE}$LOG_FILE${RESET}"

exit $test_exit_code