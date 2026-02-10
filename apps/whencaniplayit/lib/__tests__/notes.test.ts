import { getGameNote, getAllGameNotes } from '../notes';
import fs from 'fs';
import path from 'path';

// Mock the fs module
jest.mock('fs');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('notes utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default path.join behavior
    mockPath.join.mockImplementation((...args) => args.join('/'));
  });

  describe('getGameNote', () => {
    it('should return null if note file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const result = getGameNote(12345);
      
      expect(result).toBeNull();
      expect(mockFs.existsSync).toHaveBeenCalled();
    });

    it('should parse and return note with frontmatter', () => {
      const mockFileContent = `---
title: Test Game
hype_level: high
---

## My Thoughts

This is a test note.`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockFileContent);
      
      const result = getGameNote(12345);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('12345');
      expect(result?.data.title).toBe('Test Game');
      expect(result?.data.hype_level).toBe('high');
      expect(result?.content).toContain('My Thoughts');
    });

    it('should handle notes without frontmatter', () => {
      const mockFileContent = 'Just some plain content';

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockFileContent);
      
      const result = getGameNote(12345);
      
      expect(result).not.toBeNull();
      expect(result?.content).toBe('Just some plain content');
      expect(result?.data).toEqual({});
    });

    it('should return null and log error on file read failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });
      
      const result = getGameNote(12345);
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getAllGameNotes', () => {
    it('should return empty array if notes directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const result = getAllGameNotes();
      
      expect(result).toEqual([]);
    });

    it('should return list of game notes excluding README', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['12345.md', '67890.md', 'README.md']);
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.toString().includes('12345')) {
          return '---\ntitle: Game One\n---\nContent';
        }
        return '---\ntitle: Game Two\n---\nContent';
      });
      
      const result = getAllGameNotes();
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('12345');
      expect(result[0].title).toBe('Game One');
      expect(result[1].id).toBe('67890');
      expect(result[1].title).toBe('Game Two');
    });

    it('should use default title if note has no title in frontmatter', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['12345.md']);
      mockFs.readFileSync.mockReturnValue('No frontmatter here');
      
      const result = getAllGameNotes();
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Game 12345');
    });

    it('should return empty array on error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Directory read error');
      });
      
      const result = getAllGameNotes();
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
