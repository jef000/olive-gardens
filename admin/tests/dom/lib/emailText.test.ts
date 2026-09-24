import { describe, it, expect } from 'vitest';
import { htmlToPlainText } from '@/lib/emailText';

describe('htmlToPlainText', () => {
  it('turns block tags into line breaks', () => {
    expect(htmlToPlainText('<p>First</p><p>Second</p>')).toBe('First\nSecond');
    expect(htmlToPlainText('<p>One<br>line</p>')).toBe('One\nline');
    expect(htmlToPlainText('<ul><li>Alpha</li><li>Beta</li></ul>')).toBe('Alpha\nBeta');
  });

  it('keeps formatted text readable', () => {
    expect(htmlToPlainText('<p>Hi <strong>Ana</strong> &amp; Bo</p>')).toBe('Hi Ana & Bo');
  });

  it('collapses excess blank lines and trims', () => {
    expect(htmlToPlainText('<p> </p><p>Hello</p><p> </p>')).toBe('Hello');
    expect(htmlToPlainText('')).toBe('');
  });
});
