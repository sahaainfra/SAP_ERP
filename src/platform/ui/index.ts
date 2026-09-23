/**
 * Part 18 — Metadata-Driven UI Exports
 * 
 * Exports all metadata types and generators for use by other parts.
 */

// Metadata Types
export * from './metadata/types';

// Generators
export { ListReport } from './generators/ListReport';
export { ObjectPage } from './generators/ObjectPage';

// Note: Additional generators (Form, Dashboard, Export) would be implemented
// in separate files following the same pattern.
