/**
 * Part 16 — Global ERP Application Shell Exports
 * 
 * Exports all shell components and services for use by other parts.
 */

// Types
export * from './types';

// Services
export { NavigationService, navigationService } from './navigation-service';
export { ContextService, contextService } from './context-service';
export { SearchService, searchService } from './search-service';

// Components (located in src/components/shell/)
// Note: Components are exported from their respective files
// Import them directly: import { ShellBar } from '../components/shell/ShellBar';
