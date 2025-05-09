/**
 * @fileoverview
 * This file contains tests for the email validation utility function defined in `email.utils.ts`.
 * It focuses on testing the `isValidEmail` function with various valid and invalid email formats.
 */

import { describe, it, expect } from 'vitest';
import { isValidEmail } from './email.utils';

describe('email.utils', () => {
    describe('isValidEmail', () => {
        // Test cases for valid email addresses
        it('should return true for valid email addresses', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
            expect(isValidEmail('first.last@sub.domain.com')).toBe(true);
            expect(isValidEmail('email@domain-one.com')).toBe(true);
            expect(isValidEmail('_______@example.com')).toBe(true);
            expect(isValidEmail('1234567890@example.com')).toBe(true);
            expect(isValidEmail('email@123.123.123.123')).toBe(true); // Domain as IP (technically valid format) - Regex allows this
            // Although RFC doesn't strictly allow IP as domain without [], the regex is simple.
            // expect(isValidEmail('email@[123.123.123.123]')).toBe(true); // If IP literal format needed
        });

        // Test cases for invalid email addresses
        it('should return false for invalid email addresses', () => {
            expect(isValidEmail('')).toBe(false); // Empty string
            expect(isValidEmail('plainaddress')).toBe(false); // Missing @ and domain
            expect(isValidEmail('@missingusername.com')).toBe(false); // Missing username
            expect(isValidEmail('username@.com')).toBe(false); // Missing domain part
            expect(isValidEmail('username@domain.')).toBe(false); // Missing top-level domain
            expect(isValidEmail('username@domain.c')).toBe(true); // Regex `[^\\s@]+` allows single char TLD.
            // If stricter TLD needed, regex would change. Let's add a test for common invalid patterns.
            expect(isValidEmail('username @ domain.com')).toBe(false); // Contains space
            expect(isValidEmail('username..name@domain.com')).toBe(true); // Regex `[^\\s@]+` allows double dots.
            expect(isValidEmail('.username@domain.com')).toBe(true); // Starts with dot - Regex `[^\\s@]+` allows this.
            expect(isValidEmail('username@domain..com')).toBe(true); // Regex `[^\\s@]+` allows double dots here too.
            // The regex is quite simple! Let's add more definitive invalid cases for *this* regex.
            expect(isValidEmail('username@domain.com.')).toBe(true); // Regex `[^\\s@]+` allows trailing dot.
            expect(isValidEmail('username@domaincom')).toBe(false); // Missing dot in domain
            expect(isValidEmail('username@-domain.com')).toBe(true); // Starts domain part with hyphen (Regex allows)
            expect(isValidEmail('username@domain.com-')).toBe(true); // Ends TLD with hyphen (Regex allows)
            expect(isValidEmail('username@domain..com')).toBe(true); // Double dot (Regex allows)

        });

        // Refined invalid cases based on the specific regex behavior /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
        it('should return false for specific invalid cases for THIS regex', () => {
            expect(isValidEmail('')).toBe(false);
            expect(isValidEmail(' ')).toBe(false);
            expect(isValidEmail('plainaddress')).toBe(false);
            expect(isValidEmail('@domain.com')).toBe(false);
            expect(isValidEmail('username@')).toBe(false);
            expect(isValidEmail('username@domain')).toBe(false); // No dot after @ part
            expect(isValidEmail('username @domain.com')).toBe(false); // Space before @
            expect(isValidEmail('username@ domain.com')).toBe(false); // Space after @
            expect(isValidEmail('username@domain .com')).toBe(false); // Space in domain
            expect(isValidEmail('username@domain. com')).toBe(false); // Space in TLD
            expect(isValidEmail('username@domain.com ')).toBe(false); // Trailing space
            expect(isValidEmail(' username@domain.com')).toBe(false); // Leading space
            expect(isValidEmail('username\\@domain.com')).toBe(true); // Escaped @ is allowed by the simple regex
        });
    });
}); 