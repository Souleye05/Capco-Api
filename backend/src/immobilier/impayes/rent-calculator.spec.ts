import { BadRequestException } from '@nestjs/common';
import { RentCalculator } from './rent-calculator';

describe('RentCalculator', () => {
  describe('calculerDateEcheance', () => {
    it('should calculate correct due date for valid month', () => {
      const result = RentCalculator.calculerDateEcheance('2026-02');
      const expected = new Date(Date.UTC(2026, 1, 5, 23, 59, 59, 999));
      
      expect(result).toEqual(expected);
    });

    it('should handle different months correctly', () => {
      const january = RentCalculator.calculerDateEcheance('2026-01');
      const december = RentCalculator.calculerDateEcheance('2026-12');
      
      expect(january.getUTCMonth()).toBe(0); // January
      expect(december.getUTCMonth()).toBe(11); // December
      expect(january.getUTCDate()).toBe(5);
      expect(december.getUTCDate()).toBe(5);
    });

    it('should throw BadRequestException for invalid format', () => {
      expect(() => RentCalculator.calculerDateEcheance('invalid'))
        .toThrow(BadRequestException);
      
      expect(() => RentCalculator.calculerDateEcheance('2026'))
        .toThrow(BadRequestException);
      
      expect(() => RentCalculator.calculerDateEcheance('2026-'))
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid month', () => {
      expect(() => RentCalculator.calculerDateEcheance('2026-00'))
        .toThrow(BadRequestException);
      
      expect(() => RentCalculator.calculerDateEcheance('2026-13'))
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-numeric values', () => {
      expect(() => RentCalculator.calculerDateEcheance('abcd-ef'))
        .toThrow(BadRequestException);
      
      expect(() => RentCalculator.calculerDateEcheance('2026-ab'))
        .toThrow(BadRequestException);
    });
  });

  describe('calculerJoursRetard', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed date for consistent testing
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return 0 when due date is in the future', () => {
      // Set current date to February 1, 2026
      jest.setSystemTime(new Date('2026-02-01T10:00:00.000Z'));
      
      const result = RentCalculator.calculerJoursRetard('2026-02');
      expect(result).toBe(0);
    });

    it('should return 0 when current date equals due date', () => {
      // Set current date to February 5, 2026 (due date)
      jest.setSystemTime(new Date('2026-02-05T23:59:59.999Z'));
      
      const result = RentCalculator.calculerJoursRetard('2026-02');
      expect(result).toBe(0);
    });

    it('should calculate days late correctly', () => {
      // Set current date to February 10, 2026 (5 days after due date)
      jest.setSystemTime(new Date('2026-02-10T10:00:00.000Z'));
      
      const result = RentCalculator.calculerJoursRetard('2026-02');
      expect(result).toBe(5);
    });

    it('should handle month transitions correctly', () => {
      // Set current date to March 10, 2026 for February rent
      jest.setSystemTime(new Date('2026-03-10T10:00:00.000Z'));
      
      const result = RentCalculator.calculerJoursRetard('2026-02');
      // From Feb 5 to Mar 10 = 33 days
      expect(result).toBe(33);
    });

    it('should throw BadRequestException for invalid month format', () => {
      expect(() => RentCalculator.calculerJoursRetard('invalid'))
        .toThrow(BadRequestException);
    });
  });
});