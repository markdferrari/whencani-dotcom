import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface GameNote {
  id: string;
  content: string;
  data: {
    title?: string;
    hype_level?: string;
    [key: string]: unknown;
  };
}

/**
 * Get the path to the notes directory
 */
function getNotesDirectory(): string {
  return path.join(process.cwd(), 'data', 'notes');
}

/**
 * Read a note file for a specific game ID
 */
export function getGameNote(gameId: number): GameNote | null {
  const notesDir = getNotesDirectory();
  const filePath = path.join(notesDir, `${gameId}.md`);

  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      id: gameId.toString(),
      content,
      data,
    };
  } catch (error) {
    console.error(`Error reading note for game ${gameId}:`, error);
    return null;
  }
}

/**
 * Get all note files
 */
export function getAllGameNotes(): Array<{ id: string; title: string }> {
  const notesDir = getNotesDirectory();

  try {
    if (!fs.existsSync(notesDir)) {
      return [];
    }

    const files = fs.readdirSync(notesDir);
    
    return files
      .filter(file => file.endsWith('.md') && file !== 'README.md')
      .map(file => {
        const id = file.replace('.md', '');
        const filePath = path.join(notesDir, file);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContents);
        
        return {
          id,
          title: data.title || `Game ${id}`,
        };
      });
  } catch (error) {
    console.error('Error reading notes directory:', error);
    return [];
  }
}
