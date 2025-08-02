import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class');
      expect(result).toBe('base-class additional-class');
    });

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class');
      expect(result).toBe('base-class conditional-class');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'valid-class');
      expect(result).toBe('base-class valid-class');
    });

    it('should handle empty strings', () => {
      const result = cn('base-class', '', 'valid-class');
      expect(result).toBe('base-class valid-class');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle object-style classes', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true,
      });
      expect(result).toBe('class1 class3');
    });

    it('should handle mixed input types', () => {
      const result = cn(
        'base-class',
        ['array-class1', 'array-class2'],
        {
          'object-class1': true,
          'object-class2': false,
        },
        true && 'conditional-class',
        'final-class'
      );
      expect(result).toContain('base-class');
      expect(result).toContain('array-class1');
      expect(result).toContain('array-class2');
      expect(result).toContain('object-class1');
      expect(result).not.toContain('object-class2');
      expect(result).toContain('conditional-class');
      expect(result).toContain('final-class');
    });

    it('should handle no arguments', () => {
      const result = cn();
      expect(result).toBe('');
    });
  });
});