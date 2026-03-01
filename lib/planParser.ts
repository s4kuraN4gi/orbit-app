/**
 * Markdown Plan Parser
 * 
 * Parses AI-generated implementation plans in Markdown format
 * and converts them to a hierarchical task structure.
 * 
 * Supported formats:
 * - ## Headers → Parent tasks
 * - - [ ] Checkbox items → Subtasks
 * - - Bullet items → Subtasks
 * - Indentation (2/4 spaces) → Nested hierarchy
 */

export interface ParsedTask {
  title: string;
  description?: string;
  children?: ParsedTask[];
}

interface LineInfo {
  indent: number;
  content: string;
  isHeader: boolean;
  headerLevel: number;
  isCheckbox: boolean;
  isBullet: boolean;
}

/**
 * Parse a single line and extract metadata
 */
function parseLine(line: string): LineInfo | null {
  if (!line.trim()) return null;

  // Count leading spaces for indentation
  const indentMatch = line.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1].length : 0;
  
  const trimmed = line.trim();

  // Check for headers (## Header)
  const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
  if (headerMatch) {
    return {
      indent: 0, // Headers reset indent
      content: headerMatch[2].trim(),
      isHeader: true,
      headerLevel: headerMatch[1].length,
      isCheckbox: false,
      isBullet: false,
    };
  }

  // Check for checkbox (- [ ] or - [x] or * [ ])
  const checkboxMatch = trimmed.match(/^[-*]\s+\[[ xX]\]\s+(.+)$/);
  if (checkboxMatch) {
    return {
      indent,
      content: checkboxMatch[1].trim(),
      isHeader: false,
      headerLevel: 0,
      isCheckbox: true,
      isBullet: false,
    };
  }

  // Check for bullet point (- item or * item)
  const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
  if (bulletMatch) {
    return {
      indent,
      content: bulletMatch[1].trim(),
      isHeader: false,
      headerLevel: 0,
      isCheckbox: false,
      isBullet: true,
    };
  }

  // Check for numbered list (1. item)
  const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
  if (numberedMatch) {
    return {
      indent,
      content: numberedMatch[1].trim(),
      isHeader: false,
      headerLevel: 0,
      isCheckbox: false,
      isBullet: true,
    };
  }

  return null;
}

/**
 * Build hierarchical task structure from parsed lines
 */
function buildHierarchy(lines: LineInfo[]): ParsedTask[] {
  const root: ParsedTask[] = [];
  const stack: { task: ParsedTask; indent: number; headerLevel: number }[] = [];

  for (const line of lines) {
    const task: ParsedTask = {
      title: line.content,
      children: [],
    };

    if (line.isHeader) {
      // Headers: First, pop all non-header (bullet) items from stack
      while (stack.length > 0 && stack[stack.length - 1].headerLevel === 0) {
        stack.pop();
      }
      // Then, pop headers with same or higher level (smaller number = higher)
      while (
        stack.length > 0 &&
        stack[stack.length - 1].headerLevel >= line.headerLevel
      ) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(task);
      } else {
        const parent = stack[stack.length - 1].task;
        if (!parent.children) parent.children = [];
        parent.children.push(task);
      }

      stack.push({ task, indent: -1, headerLevel: line.headerLevel });
    } else {
      // Bullets/checkboxes use indentation for nesting
      while (
        stack.length > 0 &&
        stack[stack.length - 1].indent >= line.indent &&
        stack[stack.length - 1].headerLevel === 0
      ) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(task);
      } else {
        const parent = stack[stack.length - 1].task;
        if (!parent.children) parent.children = [];
        parent.children.push(task);
      }

      stack.push({ task, indent: line.indent, headerLevel: 0 });
    }
  }

  // Clean up empty children arrays
  const cleanChildren = (tasks: ParsedTask[]): ParsedTask[] => {
    return tasks.map(t => ({
      ...t,
      children: t.children && t.children.length > 0 
        ? cleanChildren(t.children) 
        : undefined,
    }));
  };

  return cleanChildren(root);
}

/**
 * Main parser function
 * 
 * @param markdown - Raw Markdown string from AI implementation plan
 * @returns Array of parsed tasks with hierarchical structure
 */
export function parsePlanMarkdown(markdown: string): ParsedTask[] {
  const lines = markdown.split('\n');
  const parsedLines: LineInfo[] = [];

  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed) {
      parsedLines.push(parsed);
    }
  }

  return buildHierarchy(parsedLines);
}

/**
 * Convert ParsedTask to the format expected by bulk-create API
 */
export function convertToApiFormat(
  tasks: ParsedTask[],
  projectId: string,
  sourceTool: 'Cursor' | 'Antigravity' | 'Manual' = 'Manual',
  originalPrompt: string = ''
) {
  interface ConvertedTask {
    title: string;
    description: string | null;
    status: string;
    priority: string;
    children: ConvertedTask[];
  }

  const convertTask = (task: ParsedTask): ConvertedTask => ({
    title: task.title,
    description: task.description || null,
    status: 'todo',
    priority: 'medium',
    children: task.children?.map(convertTask) || [],
  });

  return {
    project_id: projectId,
    source_tool: sourceTool,
    original_prompt: originalPrompt,
    tasks: tasks.map(convertTask),
  };
}
