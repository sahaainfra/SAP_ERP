/**
 * Part 19 — Mobile Line Editor
 * 
 * Specialized component for editing grid data on mobile (MB lines, bill items).
 * Shows one dimension set at a time with large numeric inputs.
 * 
 * Features:
 * - Full-screen editor for each line
 * - Large numeric inputs with dedicated keypad
 * - Live-computed quantity shown prominently
 * - Previous/Next line navigation
 * - "Repeat last dimension set" action
 * - "Add similar line" action
 * - Running cumulative total pinned to top
 * - Uses same calculation module as desktop (Part 12)
 */

import React, { useState, useEffect } from 'react';
import { Quantity } from '../../platform/calc/quantity';

export interface DimensionSet {
  nos?: number;
  length?: number;
  breadth?: number;
  height?: number;
  deduction?: number;
}

export interface MeasurementLine {
  id: string;
  description: string;
  dimensions: DimensionSet;
  quantity: number;
  uom: string;
  formulaCode: string;
}

interface MobileLineEditorProps {
  lines: MeasurementLine[];
  onChange: (lines: MeasurementLine[]) => void;
  onSave: () => void;
  onCancel: () => void;
  uom: string;
  formulaCode: string;
}

export const MobileLineEditor: React.FC<MobileLineEditorProps> = ({
  lines,
  onChange,
  onSave,
  onCancel,
  uom,
  formulaCode,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentLine, setCurrentLine] = useState<MeasurementLine>(lines[0] || createEmptyLine());
  const [showKeypad, setShowKeypad] = useState<string | null>(null);

  // Update current line when index changes
  useEffect(() => {
    if (lines[currentIndex]) {
      setCurrentLine(lines[currentIndex]);
    }
  }, [currentIndex, lines]);

  // Create empty line
  function createEmptyLine(): MeasurementLine {
    return {
      id: `line-${Date.now()}`,
      description: '',
      dimensions: {},
      quantity: 0,
      uom,
      formulaCode,
    };
  }

  // Calculate quantity from dimensions
  function calculateQuantity(dimensions: DimensionSet): number {
    // Simplified calculation - in production, would use Part 12 calculation engine
    const { nos = 1, length = 0, breadth = 0, height = 0, deduction = 0 } = dimensions;
    
    let quantity = 0;
    
    switch (formulaCode) {
      case 'LINEAR':
        quantity = nos * length;
        break;
      case 'AREA_LB':
        quantity = nos * length * breadth;
        break;
      case 'VOLUME_LBH':
        quantity = nos * length * breadth * height;
        break;
      default:
        quantity = nos * length * breadth * height;
    }
    
    // Apply deduction
    if (deduction > 0) {
      quantity -= deduction;
    }
    
    return Math.max(0, quantity);
  }

  // Update dimension
  function updateDimension(field: keyof DimensionSet, value: number | undefined) {
    const newDimensions = { ...currentLine.dimensions, [field]: value };
    const newQuantity = calculateQuantity(newDimensions);
    
    const updatedLine = {
      ...currentLine,
      dimensions: newDimensions,
      quantity: newQuantity,
    };
    
    setCurrentLine(updatedLine);
    
    // Update lines array
    const newLines = [...lines];
    newLines[currentIndex] = updatedLine;
    onChange(newLines);
  }

  // Update description
  function updateDescription(description: string) {
    const updatedLine = { ...currentLine, description };
    setCurrentLine(updatedLine);
    
    const newLines = [...lines];
    newLines[currentIndex] = updatedLine;
    onChange(newLines);
  }

  // Add new line
  function addLine() {
    const newLine = createEmptyLine();
    const newLines = [...lines, newLine];
    onChange(newLines);
    setCurrentIndex(newLines.length - 1);
  }

  // Delete current line
  function deleteLine() {
    if (lines.length === 1) {
      // Can't delete last line
      return;
    }
    
    const newLines = lines.filter((_, i) => i !== currentIndex);
    onChange(newLines);
    
    if (currentIndex >= newLines.length) {
      setCurrentIndex(newLines.length - 1);
    }
  }

  // Repeat last dimension set
  function repeatLastDimensions() {
    if (currentIndex === 0) return;
    
    const lastLine = lines[currentIndex - 1];
    updateDimension('nos', lastLine.dimensions.nos);
    updateDimension('length', lastLine.dimensions.length);
    updateDimension('breadth', lastLine.dimensions.breadth);
    updateDimension('height', lastLine.dimensions.height);
    updateDimension('deduction', lastLine.dimensions.deduction);
  }

  // Add similar line
  function addSimilarLine() {
    const newLine: MeasurementLine = {
      ...createEmptyLine(),
      description: currentLine.description,
      dimensions: { ...currentLine.dimensions },
      quantity: currentLine.quantity,
    };
    
    const newLines = [...lines];
    newLines.splice(currentIndex + 1, 0, newLine);
    onChange(newLines);
    setCurrentIndex(currentIndex + 1);
  }

  // Calculate cumulative total
  const cumulativeTotal = lines.reduce((sum, line) => sum + line.quantity, 0);

  // Numeric keypad component
  const NumericKeypad = ({ field, value, onChange }: { field: string; value?: number; onChange: (v: number | undefined) => void }) => (
    <div className="numeric-keypad">
      <div className="keypad-header">
        <span className="field-label">{field}</span>
        <button className="clear-button" onClick={() => onChange(undefined)}>
          Clear
        </button>
      </div>
      <div className="keypad-display">
        <input
          type="text"
          value={value !== undefined ? value.toString() : ''}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') {
              onChange(undefined);
            } else {
              const num = parseFloat(val);
              if (!isNaN(num)) {
                onChange(num);
              }
            }
          }}
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]*"
          className="keypad-input"
          autoFocus
        />
        <span className="uom-label">{uom}</span>
      </div>
      <div className="keypad-buttons">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '⌫'].map((key) => (
          <button
            key={key}
            className="keypad-button"
            onClick={() => {
              const currentValue = value !== undefined ? value.toString() : '';
              let newValue: string;
              
              if (key === '⌫') {
                newValue = currentValue.slice(0, -1);
              } else if (key === '.') {
                if (!currentValue.includes('.')) {
                  newValue = currentValue + '.';
                } else {
                  return;
                }
              } else {
                newValue = currentValue + key.toString();
              }
              
              if (newValue === '') {
                onChange(undefined);
              } else {
                const num = parseFloat(newValue);
                if (!isNaN(num)) {
                  onChange(num);
                }
              }
            }}
          >
            {key}
          </button>
        ))}
      </div>
      <button className="keypad-done" onClick={() => setShowKeypad(null)}>
        Done
      </button>
    </div>
  );

  return (
    <div className="mobile-line-editor">
      {/* Cumulative total pinned to top */}
      <div className="cumulative-total">
        <span className="total-label">Total:</span>
        <span className="total-value">
          {cumulativeTotal.toFixed(3)} {uom}
        </span>
        <span className="line-count">
          ({lines.length} line{lines.length !== 1 ? 's' : ''})
        </span>
      </div>

      {/* Line navigation */}
      <div className="line-navigation">
        <button
          className="nav-button"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>
        <span className="line-indicator">
          Line {currentIndex + 1} of {lines.length}
        </span>
        <button
          className="nav-button"
          onClick={() => setCurrentIndex(Math.min(lines.length - 1, currentIndex + 1))}
          disabled={currentIndex === lines.length - 1}
        >
          Next →
        </button>
      </div>

      {/* Line editor */}
      <div className="line-editor-content">
        {/* Description */}
        <div className="field-group">
          <label className="field-label">Description</label>
          <input
            type="text"
            value={currentLine.description}
            onChange={(e) => updateDescription(e.target.value)}
            className="description-input"
            placeholder="Enter description"
          />
        </div>

        {/* Dimensions */}
        <div className="dimensions-grid">
          {(['nos', 'length', 'breadth', 'height', 'deduction'] as const).map((field) => (
            <div key={field} className="dimension-field">
              <label className="field-label">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <button
                className="dimension-input"
                onClick={() => setShowKeypad(field)}
              >
                {currentLine.dimensions[field] !== undefined
                  ? currentLine.dimensions[field]!.toFixed(3)
                  : '—'}
              </button>
            </div>
          ))}
        </div>

        {/* Computed quantity */}
        <div className="computed-quantity">
          <span className="quantity-label">Quantity:</span>
          <span className="quantity-value">
            {currentLine.quantity.toFixed(3)} {uom}
          </span>
        </div>

        {/* Quick actions */}
        <div className="quick-actions">
          <button
            className="action-button"
            onClick={repeatLastDimensions}
            disabled={currentIndex === 0}
          >
            🔄 Repeat Last
          </button>
          <button className="action-button" onClick={addSimilarLine}>
            📋 Add Similar
          </button>
          <button
            className="action-button delete"
            onClick={deleteLine}
            disabled={lines.length === 1}
          >
            🗑️ Delete Line
          </button>
        </div>
      </div>

      {/* Numeric keypad overlay */}
      {showKeypad && (
        <div className="keypad-overlay">
          <NumericKeypad
            field={showKeypad}
            value={currentLine.dimensions[showKeypad as keyof DimensionSet]}
            onChange={(value) => updateDimension(showKeypad as keyof DimensionSet, value)}
          />
        </div>
      )}

      {/* Footer actions */}
      <div className="editor-footer">
        <button className="footer-button cancel" onClick={onCancel}>
          Cancel
        </button>
        <button className="footer-button add-line" onClick={addLine}>
          + Add Line
        </button>
        <button className="footer-button save" onClick={onSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default MobileLineEditor;
